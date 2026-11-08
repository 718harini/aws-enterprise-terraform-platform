# Generate a unique suffix for the S3 bucket
resource "random_id" "suffix" {
  byte_length = 3
}


# S3 bucket for CloudTrail audit logs
resource "aws_s3_bucket" "trail" {
  bucket = "${substr(replace(var.name_prefix, "_", "-"), 0, 45)}-trail-${random_id.suffix.hex}"

  tags = {
    Name      = "${var.name_prefix}-audit-logs"
    ManagedBy = "Terraform"
    Project   = "AWS-Enterprise-Platform"
  }
}


# Block all public access
resource "aws_s3_bucket_public_access_block" "trail" {
  bucket                  = aws_s3_bucket.trail.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}


# Enable S3 versioning
resource "aws_s3_bucket_versioning" "trail" {
  bucket = aws_s3_bucket.trail.id

  versioning_configuration {
    status = "Enabled"
  }
}


# Enable encryption at rest
resource "aws_s3_bucket_server_side_encryption_configuration" "trail" {
  bucket = aws_s3_bucket.trail.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}


# S3 lifecycle policy for CloudTrail logs
resource "aws_s3_bucket_lifecycle_configuration" "trail" {
  bucket = aws_s3_bucket.trail.id

  rule {
    id     = "archive-cloudtrail-logs"
    status = "Enabled"

    filter {
      prefix = "AWSLogs/"
    }

    transition {
      days          = var.glacier_transition_days
      storage_class = "GLACIER"
    }
  }
}


# CloudTrail bucket permissions
data "aws_iam_policy_document" "trail_bucket" {

  # Allow CloudTrail to check bucket permissions
  statement {
    sid    = "AWSCloudTrailAclCheck"
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["cloudtrail.amazonaws.com"]
    }

    actions   = ["s3:GetBucketAcl"]
    resources = [aws_s3_bucket.trail.arn]
  }


  # Allow CloudTrail to upload audit logs
  statement {
    sid    = "AWSCloudTrailWrite"
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["cloudtrail.amazonaws.com"]
    }

    actions   = ["s3:PutObject"]
    resources = ["${aws_s3_bucket.trail.arn}/AWSLogs/*"]

    condition {
      test     = "StringEquals"
      variable = "s3:x-amz-acl"
      values   = ["bucket-owner-full-control"]
    }
  }


  # Deny insecure HTTP connections
  statement {
    sid     = "DenyInsecureTransport"
    effect  = "Deny"
    actions = ["s3:*"]
    resources = [
      aws_s3_bucket.trail.arn,
      "${aws_s3_bucket.trail.arn}/*"
    ]

    principals {
      type        = "*"
      identifiers = ["*"]
    }

    condition {
      test     = "Bool"
      variable = "aws:SecureTransport"
      values   = ["false"]
    }
  }
}


# Attach bucket policy
resource "aws_s3_bucket_policy" "trail" {
  bucket = aws_s3_bucket.trail.id
  policy = data.aws_iam_policy_document.trail_bucket.json

  depends_on = [
    aws_s3_bucket_public_access_block.trail
  ]
}


# Create multi-region CloudTrail
resource "aws_cloudtrail" "this" {
  name                          = "${var.name_prefix}-trail"
  s3_bucket_name                = aws_s3_bucket.trail.id
  include_global_service_events = true
  is_multi_region_trail         = true
  enable_logging                = true

  # Verify CloudTrail log file integrity
  enable_log_file_validation = true

  depends_on = [
    aws_s3_bucket_policy.trail
  ]
}