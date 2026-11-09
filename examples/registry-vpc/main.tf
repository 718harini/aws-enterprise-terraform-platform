# Alternative VPC implementation using a widely used Registry module.
# This example is intentionally separate from the root deployment.
# Review the module version and inputs before using it.
module "vpc" {
  #checkov:skip=CKV_TF_1:This example intentionally demonstrates a Terraform Registry module pinned to version 5.21.0.

  source  = "terraform-aws-modules/vpc/aws"
  version = "5.21.0"

  name = "example-vpc"
  cidr = "10.30.0.0/16"

  azs             = ["us-east-1a", "us-east-1b"]
  public_subnets  = ["10.30.1.0/24", "10.30.2.0/24"]
  private_subnets = ["10.30.11.0/24", "10.30.12.0/24"]

  enable_nat_gateway = false
  single_nat_gateway = false
}