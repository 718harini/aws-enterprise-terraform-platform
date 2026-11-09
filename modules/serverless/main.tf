# =====================================================
# PACKAGE LAMBDA FUNCTION
# =====================================================

data "archive_file" "lambda" {
  type        = "zip"
  source_file = "${path.module}/src/handler.py"
  output_path = "${path.module}/lambda_payload.zip"
}

# =====================================================
# CLOUDWATCH LOG GROUP
# =====================================================

resource "aws_cloudwatch_log_group" "lambda" {
  #checkov:skip=CKV_AWS_158:Using AWS-managed log encryption to avoid additional KMS costs.
  #checkov:skip=CKV_AWS_338:Seven-day retention is intentional to control CloudWatch storage costs.

  name              = "/aws/lambda/${var.function_name}"
  retention_in_days = 7
}

# =====================================================
# LAMBDA IAM ROLE
# =====================================================

resource "aws_iam_role" "lambda" {
  name = "${var.function_name}-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"

    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"

      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })
}

# =====================================================
# LAMBDA CLOUDWATCH LOG PERMISSIONS
# =====================================================

resource "aws_iam_role_policy" "logs" {
  name = "${var.function_name}-logs"
  role = aws_iam_role.lambda.id

  policy = jsonencode({
    Version = "2012-10-17"

    Statement = [{
      Effect = "Allow"

      Action = [
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ]

      Resource = "${aws_cloudwatch_log_group.lambda.arn}:*"
    }]
  })
}

# =====================================================
# LAMBDA FUNCTION
# =====================================================

resource "aws_lambda_function" "this" {
  #checkov:skip=CKV_AWS_272:Code signing is not required for this controlled portfolio deployment.
  #checkov:skip=CKV_AWS_116:No asynchronous failure destination is required for the current function.
  #checkov:skip=CKV_AWS_117:VPC attachment is unnecessary for this function's current execution requirements.
  #checkov:skip=CKV_AWS_50:X-Ray tracing is excluded to avoid additional tracing costs.

  function_name    = var.function_name
  role             = aws_iam_role.lambda.arn
  handler          = "handler.lambda_handler"
  runtime          = var.runtime
  filename         = data.archive_file.lambda.output_path
  source_code_hash = data.archive_file.lambda.output_base64sha256

  timeout     = var.timeout
  memory_size = var.memory_size

  # Limit concurrent executions to protect the account.
  reserved_concurrent_executions = 5

  depends_on = [
    aws_iam_role_policy.logs,
    aws_cloudwatch_log_group.lambda
  ]
}