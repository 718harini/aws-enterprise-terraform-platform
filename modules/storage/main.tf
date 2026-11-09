# =====================================================
# GENERATE UNIQUE BUCKET SUFFIX
# =====================================================

resource "random_id" "suffix" {
  byte_length = 4
}

# =====================================================
# CREATE S3 BUCKET
# =====================================================

resource "aws_s3_bucket" "this" {
  #checkov:skip=CKV_AWS_18:Dedicated access logging bucket would add storage and management overhead.
  #checkov:skip=CKV_AWS_144:Cross-region replication is excluded to avoid additional storage and transfer costs.
  #checkov:skip=CKV_AWS_145:SSE-S3 encryption is enabled; customer-managed KMS keys are not required for this project.
  #checkov:skip=CKV2_AWS_62:No event notification consumer is required for the current storage workflow.

  bucket = "${substr(lower(replace(var.bucket_name_prefix, "_", "-")), 0, 40)}-${random_id.suffix.hex}"

  tags = {
    Name        = "${var.bucket_name_prefix}-bucket"
    Environment = "enterprise"
    ManagedBy   = "Terraform"
  }
}

# =====================================================
# BLOCK PUBLIC ACCESS
# =====================================================

resource "aws_s3_bucket_public_access_block" "this" {
  bucket                  = aws_s3_bucket.this.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# =====================================================
# ENABLE VERSIONING
# =====================================================

resource "aws_s3_bucket_versioning" "this" {
  bucket = aws_s3_bucket.this.id

  versioning_configuration {
    status = "Enabled"
  }
}

# =====================================================
# SERVER-SIDE ENCRYPTION
# =====================================================

resource "aws_s3_bucket_server_side_encryption_configuration" "this" {
  bucket = aws_s3_bucket.this.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# =====================================================
# S3 LIFECYCLE CONFIGURATION
# =====================================================

resource "aws_s3_bucket_lifecycle_configuration" "this" {
  bucket = aws_s3_bucket.this.id

  rule {
    id     = "abort-incomplete-uploads"
    status = "Enabled"

    filter {}

    abort_incomplete_multipart_upload {
      days_after_initiation = 7
    }
  }
}

# =====================================================
# ENFORCE HTTPS-ONLY ACCESS
# =====================================================

resource "aws_s3_bucket_policy" "secure_transport" {
  bucket = aws_s3_bucket.this.id

  policy = jsonencode({
    Version = "2012-10-17"

    Statement = [
      {
        Sid       = "DenyInsecureTransport"
        Effect    = "Deny"
        Principal = "*"
        Action    = "s3:*"

        Resource = [
          aws_s3_bucket.this.arn,
          "${aws_s3_bucket.this.arn}/*"
        ]

        Condition = {
          Bool = {
            "aws:SecureTransport" = "false"
          }
        }
      }
    ]
  })

  depends_on = [
    aws_s3_bucket_public_access_block.this
  ]
}