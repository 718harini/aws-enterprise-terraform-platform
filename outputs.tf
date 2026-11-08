output "vpc_id" {
  description = "Created VPC ID, when networking is enabled."
  value       = try(module.network[0].vpc_id, null)
}

output "public_subnet_ids" {
  description = "Public subnet IDs, when networking is enabled."
  value       = try(module.network[0].public_subnet_ids, [])
}

output "application_bucket_name" {
  description = "Private S3 bucket name, when storage is enabled."
  value       = try(module.storage[0].bucket_name, null)
}

output "dynamodb_table_name" {
  description = "DynamoDB table name, when enabled."
  value       = try(module.database[0].table_name, null)
}

output "lambda_function_name" {
  description = "Lambda function name, when enabled."
  value       = try(module.serverless[0].function_name, null)
}
output "ec2_instance_id" {
  description = "EC2 instance ID, when compute is enabled."
  value       = try(module.compute[0].instance_id, null)
}

output "ec2_private_ip" {
  description = "EC2 private IP address, when compute is enabled."
  value       = try(module.compute[0].private_ip, null)
}
output "cloudtrail_arn" {
  description = "CloudTrail ARN, when auditing is enabled."
  value       = try(module.audit[0].cloudtrail_arn, null)
}

output "trail_bucket_name" {
  description = "CloudTrail log bucket name, when auditing is enabled."
  value       = try(module.audit[0].trail_bucket_name, null)
}