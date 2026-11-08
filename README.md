# Enterprise AWS Terraform Platform

A modular, portfolio-oriented AWS infrastructure codebase. It demonstrates custom Terraform modules, safe defaults, security controls, and an optional Registry-module alternative.

## Safety contract

- Every root-level feature flag defaults to `false`.
- `terraform init`, `terraform fmt`, and `terraform validate` do not create AWS infrastructure.
- `terraform plan` evaluates the proposed changes; it does not create resources.
- `terraform apply` creates resources and can incur charges. Do not run it without reviewing the plan and current AWS pricing.
- NAT Gateway, ALB, CloudFront, public IPv4, RDS, ECS/EKS, CloudTrail data events, and many other services can incur charges.
- The starter does not create NAT Gateways, ALBs, RDS, EKS, or ECS by default.
- Do not commit credentials, `.tfvars` containing secrets, state files, or private keys.

## Included modules

| Module | Purpose |
|---|---|
| network | VPC, public subnets, IGW, public route table, web security group |
| storage | Private S3 bucket, public access block, versioning, encryption |
| compute | Amazon Linux 2023 EC2 instance with IMDSv2 and encrypted gp3 root volume |
| database | On-demand DynamoDB table |
| serverless | Minimal Python Lambda, IAM execution role, CloudWatch log group |
| audit | Multi-region CloudTrail and dedicated S3 log bucket |

The root module uses custom Terraform resources for clarity. `examples/registry-vpc` shows the alternative of consuming `terraform-aws-modules/vpc/aws`.

## Repository layout

```text
.
├── main.tf
├── variables.tf
├── outputs.tf
├── versions.tf
├── terraform.tfvars.example
├── modules/
│   ├── network/
│   ├── storage/
│   ├── compute/
│   ├── database/
│   ├── serverless/
│   └── audit/
└── examples/
    └── registry-vpc/
```

## Local validation first

Install Terraform and configure AWS CLI only if you later need AWS-backed planning or deployment.

```bash
cp terraform.tfvars.example terraform.tfvars
terraform fmt -recursive
terraform init
terraform validate
```

No AWS resources are created by these commands. `terraform init` downloads provider plugins and writes a dependency lock file. Commit `.terraform.lock.hcl` after reviewing it so provider selections remain reproducible.

### Validate with all features disabled

The example tfvars keeps all features disabled. The expected plan is zero infrastructure changes.

```bash
terraform plan
```

A plan may still require AWS credentials/provider access depending on provider data sources and configuration. This starter's root has no mandatory AWS data sources when all modules are disabled.

## Enabling modules

Only enable one component group at a time after reading the module code and reviewing current pricing.

Example: networking only:

```hcl
enable_network = true
```

Then run:

```bash
terraform plan -out=tfplan
terraform show tfplan
```

Do not apply unless you intentionally approve the resources and understand the costs. The network module creates a VPC, subnets, IGW, route table, routes, and security group. It does not create NAT Gateway.

EC2 requires networking to be enabled as well. Set `enable_network = true` and `enable_ec2 = true` together. Set `allowed_ssh_cidr` to your own public IP `/32` only if SSH is genuinely required. Prefer Systems Manager Session Manager in a later hardened iteration.

## State management

The starter intentionally uses local state for the first validation-only phase. For team/production use, create a separate bootstrap stack for:
- an S3 state bucket with versioning and encryption,
- tightly scoped IAM permissions,
- state locking using the currently recommended Terraform/AWS locking approach,
- backup and recovery procedures.

Do not point a backend at a bucket managed by the same unbootstrapped root module.

## Known next engineering iterations

This is a safe, working foundation, not a claim that every AWS service has already been implemented. Planned modules include ALB, Auto Scaling, ECS/ECR, EFS, RDS, ElastiCache, CloudFront, Route 53, ACM, WAF, KMS, Secrets Manager, Config, GuardDuty, EventBridge, SQS, API Gateway, Step Functions, Glue, and Athena. Add these in independent modules with feature flags and cost notes.

## Interview topics

Be ready to explain:
- Terraform module source and version pinning
- resource graph and implicit/explicit dependencies
- `count` versus `for_each`
- variables, outputs, locals, data sources
- state, drift, locking, and remote backends
- plan versus apply
- least-privilege IAM and security group ingress
- encryption at rest and public S3 access prevention
- IMDSv2 and encrypted EBS
- why NAT Gateway and public IPv4 can create ongoing costs
