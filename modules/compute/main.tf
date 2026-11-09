data "aws_ssm_parameter" "al2023" {
  name = "/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-default-x86_64"
}

# =====================================================
# IAM ROLE FOR EC2
# =====================================================

resource "aws_iam_role" "ec2" {
  name = "${var.name_prefix}-ec2-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"

    Statement = [
      {
        Effect = "Allow"

        Principal = {
          Service = "ec2.amazonaws.com"
        }

        Action = "sts:AssumeRole"
      }
    ]
  })
}

# SSM access without SSH keys

resource "aws_iam_role_policy_attachment" "ssm" {
  role       = aws_iam_role.ec2.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

# =====================================================
# INSTANCE PROFILE
# =====================================================

resource "aws_iam_instance_profile" "ec2" {
  name = "${var.name_prefix}-ec2-profile"
  role = aws_iam_role.ec2.name
}

# =====================================================
# EC2 INSTANCE
# =====================================================

resource "aws_instance" "this" {
  ami                         = data.aws_ssm_parameter.al2023.value
  instance_type               = var.instance_type
  subnet_id                   = var.subnet_id
  vpc_security_group_ids      = [var.security_group_id]
  associate_public_ip_address = false

  # Basic monitoring avoids additional CloudWatch charges.
  #checkov:skip=CKV_AWS_126:Basic monitoring is intentionally retained to avoid additional CloudWatch costs.
  monitoring = false

  # EBS optimization
  ebs_optimized = true

  # IAM role attachment
  iam_instance_profile = aws_iam_instance_profile.ec2.name

  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"
    http_put_response_hop_limit = 1
  }

  root_block_device {
    encrypted   = true
    volume_size = 8
    volume_type = "gp3"
  }

  tags = {
    Name      = "${var.name_prefix}-app-ec2"
    ManagedBy = "Terraform"
    Project   = "AWS-Enterprise-Platform"
  }

  lifecycle {
    precondition {
      condition = (
        var.subnet_id != null &&
        var.security_group_id != null
      )

      error_message = "Enable the network module before enabling EC2."
    }
  }
}