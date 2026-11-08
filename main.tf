locals {
  name_prefix = "${var.project_name}-${var.environment}"
}

module "network" {
  source = "./modules/network"
  count  = var.enable_network ? 1 : 0

  name_prefix         = local.name_prefix
  vpc_cidr            = var.vpc_cidr
  public_subnet_cidrs = var.public_subnet_cidrs
  enable_ssh_ingress  = var.allowed_ssh_cidr != null
  allowed_ssh_cidr    = var.allowed_ssh_cidr
}

module "storage" {
  source = "./modules/storage"
  count  = var.enable_s3 ? 1 : 0

  bucket_name_prefix = local.name_prefix
}

module "compute" {
  source = "./modules/compute"
  count  = var.enable_ec2 ? 1 : 0

  name_prefix       = local.name_prefix
  instance_type     = var.instance_type
  subnet_id         = var.enable_network ? module.network[0].public_subnet_ids[0] : null
  security_group_id = var.enable_network ? module.network[0].web_security_group_id : null

  depends_on = [module.network]
}

module "database" {
  source = "./modules/database"
  count  = var.enable_dynamodb ? 1 : 0

  table_name                    = "${local.name_prefix}-records"
  enable_point_in_time_recovery = var.enable_point_in_time_recovery
}

module "serverless" {
  source = "./modules/serverless"
  count  = var.enable_lambda ? 1 : 0

  function_name = "${local.name_prefix}-hello"
  runtime       = var.lambda_runtime
  timeout       = var.lambda_timeout
  memory_size   = var.lambda_memory_size
}

module "audit" {
  source = "./modules/audit"
  count  = var.enable_cloudtrail ? 1 : 0

  name_prefix             = local.name_prefix
  glacier_transition_days = var.glacier_transition_days
}
