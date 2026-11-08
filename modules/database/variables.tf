variable "table_name" { type = string }
variable "enable_point_in_time_recovery" {
  description = "Enable point-in-time recovery for DynamoDB."
  type        = bool
  default     = false
}
