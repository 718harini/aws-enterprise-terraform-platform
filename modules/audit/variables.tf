variable "name_prefix" { type = string }
variable "glacier_transition_days" {
  description = "Number of days before CloudTrail logs transition to Glacier."
  type        = number
  default     = 90

  validation {
    condition     = var.glacier_transition_days >= 1
    error_message = "Glacier transition days must be at least 1."
  }
}