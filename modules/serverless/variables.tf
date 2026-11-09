variable "function_name" {
  description = "Name of the Lambda function."
  type        = string
}

variable "runtime" {
  description = "Lambda runtime."
  type        = string
}

variable "timeout" {
  description = "Maximum Lambda execution time in seconds."
  type        = number
  default     = 10

  validation {
    condition     = var.timeout >= 1 && var.timeout <= 900
    error_message = "Lambda timeout must be between 1 and 900 seconds."
  }
}

variable "memory_size" {
  description = "Lambda memory allocation in MB."
  type        = number
  default     = 128

  validation {
    condition     = var.memory_size >= 128 && var.memory_size <= 10240
    error_message = "Lambda memory must be between 128 and 10240 MB."
  }
}