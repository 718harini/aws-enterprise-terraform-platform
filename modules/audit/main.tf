# =====================================================
# GENERATE UNIQUE BUCKET SUFFIX
# =====================================================

resource "random_id" "suffix" {
  byte_length = 3
}

# =====================================================
# S3 BUCKET FOR CLOUDTRAIL AUDIT LOGS
# =====================================================

resource "aws_s3_bucket" "trail" {
  #checkov:skip=CKV_AWS_18:Dedicated access logging bucket would add unnecessary storage and management overhead.
  #checkov:skip=CKV_AWS_144:Cross-region replication adds storage and transfer costs.
  #checkov:skip=CKV_AWS_145:SSE-S3 encryption is enabled; customer-managed KMS keys introduce additional costs.
  #checkov:skip=CKV2_AWS_62:No event consumer is required for the current audit-log workflow.

  bucket = "${substr(replace(var.name_prefix, "_", "-"), 0, 45)}-trail-${random_id.suffix.hex}"

  tags = {
    Name      = "${var.name_prefix}-audit-logs"
    ManagedBy = "Terraform"
    Project   = "AWS-Enterprise-Platform"
  }
}

# =====================================================
# BLOCK PUBLIC ACCESS
# =====================================================

resource "aws_s3_bucket_public_access_block" "trail" {
  bucket                  = aws_s3_bucket.trail.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# =====================================================
# S3 VERSIONING
# =====================================================

resource "aws_s3_bucket_versioning" "trail" {
  bucket = aws_s3_bucket.trail.id

  versioning_configuration {
    status = "Enabled"
  }
}

# =====================================================
# S3 SERVER-SIDE ENCRYPTION
# =====================================================

resource "aws_s3_bucket_server_side_encryption_configuration" "trail" {
  bucket = aws_s3_bucket.trail.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# =====================================================
# S3 LIFECYCLE CONFIGURATION
# =====================================================

resource "aws_s3_bucket_lifecycle_configuration" "trail" {
  #checkov:skip=CKV_AWS_300:Seven-day incomplete multipart upload cleanup is explicitly configured.

  bucket = aws_s3_bucket.trail.id

  # Abort incomplete uploads after seven days.
  rule {
    id     = "abort-incomplete-uploads"
    status = "Enabled"

    filter {}

    abort_incomplete_multipart_upload {
      days_after_initiation = 7
    }
  }

  # Archive CloudTrail logs.
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

# =====================================================
# CLOUDTRAIL BUCKET POLICY
# =====================================================

data "aws_iam_policy_document" "trail_bucket" {

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

# =====================================================
# ATTACH BUCKET POLICY
# =====================================================

resource "aws_s3_bucket_policy" "trail" {
  bucket = aws_s3_bucket.trail.id
  policy = data.aws_iam_policy_document.trail_bucket.json

  depends_on = [
    aws_s3_bucket_public_access_block.trail
  ]
}

# =====================================================
# CLOUDTRAIL
# =====================================================

resource "aws_cloudtrail" "this" {
  #checkov:skip=CKV_AWS_252:SNS notifications are not required for the current project workflow.
  #checkov:skip=CKV_AWS_35:SSE-S3 encryption is enabled on the destination bucket; avoiding additional KMS costs.
  #checkov:skip=CKV2_AWS_10:CloudWatch integration would introduce additional log ingestion and storage costs.

  name                          = "${var.name_prefix}-trail"
  s3_bucket_name                = aws_s3_bucket.trail.id
  include_global_service_events = true
  is_multi_region_trail         = true
  enable_logging                = true
  enable_log_file_validation    = true

  depends_on = [
    aws_s3_bucket_policy.trail
  ]
}
