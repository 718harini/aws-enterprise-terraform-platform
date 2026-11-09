resource "aws_dynamodb_table" "this" {
  #checkov:skip=CKV_AWS_28:Point-in-time recovery is optional and disabled by default to control backup costs for this portfolio project.
  #checkov:skip=CKV_AWS_119:DynamoDB encryption at rest is enabled using AWS-owned encryption; customer-managed KMS keys are not required.
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