variable "table_name" {
  description = "Name of the DynamoDB table."
  type        = string
}

variable "enable_point_in_time_recovery" {
  description = "Enable point-in-time recovery when required."
  type        = bool
  default     = false
}