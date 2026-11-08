resource "aws_dynamodb_table" "this" {
  name         = var.table_name
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "record_id"

  tags = {
    Name        = var.table_name
    Environment = "enterprise"
    ManagedBy   = "Terraform"
    Project     = "AWS-Enterprise-Platform"
  }

  attribute {
    name = "record_id"
    type = "S"
  }

  point_in_time_recovery {
    enabled = var.enable_point_in_time_recovery
  }

  server_side_encryption {
    enabled = true
  }
}