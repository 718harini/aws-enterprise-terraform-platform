variable "name_prefix" {
  type = string
}

variable "vpc_cidr" {
  type = string
}

variable "public_subnet_cidrs" {
  type = list(string)
}

variable "availability_zone_ids" {
  description = "Explicit AWS Availability Zone IDs corresponding to public subnets."
  type        = list(string)
}

variable "enable_ssh_ingress" {
  type = bool
}

variable "allowed_ssh_cidr" {
  type    = string
  default = null
}