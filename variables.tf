variable "aws_region" {
  description = "AWS deployment region."
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Short project identifier used in resource names."
  type        = string
  default     = "enterprise-platform"
}

variable "environment" {
  description = "Deployment environment."
  type        = string
  default     = "dev"

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "environment must be dev, staging, or prod."
  }
}

variable "enable_network" {
  description = "Create the VPC and networking resources."
  type        = bool
  default     = false
}

variable "enable_s3" {
  description = "Create the private S3 application bucket."
  type        = bool
  default     = false
}

variable "enable_ec2" {
  description = "Create a small EC2 instance. EC2 and public IPv4 may incur charges."
  type        = bool
  default     = false

  validation {
    condition     = !var.enable_ec2 || var.enable_network
    error_message = "EC2 cannot be enabled unless networking is also enabled."
  }
}

variable "enable_dynamodb" {
  description = "Create an on-demand DynamoDB table."
  type        = bool
  default     = false
}

variable "enable_lambda" {
  description = "Create a minimal Lambda function and log group."
  type        = bool
  default     = false
}

variable "enable_cloudtrail" {
  description = "Create a multi-region CloudTrail trail. S3 storage and data events can incur charges."
  type        = bool
  default     = false
}

variable "vpc_cidr" {
  description = "IPv4 CIDR block for the VPC."
  type        = string
  default     = "10.20.0.0/16"
}

variable "public_subnet_cidrs" {
  description = "Public subnet CIDRs; one subnet is created per entry."
  type        = list(string)
  default     = ["10.20.1.0/24", "10.20.2.0/24"]
}

variable "instance_type" {
  description = "EC2 instance type. Check current Free Tier eligibility before enabling."
  type        = string
  default     = "t3.micro"
}

variable "allowed_ssh_cidr" {
  description = "Your public IP in CIDR notation, e.g. 203.0.113.10/32. Never use 0.0.0.0/0."
  type        = string
  default     = null
}

variable "lambda_runtime" {
  description = "Supported Lambda runtime."
  type        = string
  default     = "python3.12"
}
variable "enable_point_in_time_recovery" {
  description = "Enable point-in-time recovery for DynamoDB."
  type        = bool
  default     = false
}

variable "lambda_timeout" {
  description = "Maximum Lambda execution time in seconds."
  type        = number
  default     = 10

  validation {
    condition     = var.lambda_timeout >= 1 && var.lambda_timeout <= 900
    error_message = "Lambda timeout must be between 1 and 900 seconds."
  }
}

variable "lambda_memory_size" {
  description = "Lambda memory allocation in MB."
  type        = number
  default     = 128

  validation {
    condition     = var.lambda_memory_size >= 128 && var.lambda_memory_size <= 10240
    error_message = "Lambda memory must be between 128 and 10240 MB."
  }
}

variable "glacier_transition_days" {
  description = "Number of days before CloudTrail logs transition to Glacier."
  type        = number
  default     = 90

  validation {
    condition     = var.glacier_transition_days >= 1
    error_message = "Glacier transition days must be at least 1."
  }
}
variable "availability_zone_ids" {
  description = "Explicit Availability Zone IDs for the selected AWS region."
  type        = list(string)

  # These IDs are for us-east-1.
  default = ["use1-az1", "use1-az2"]
}