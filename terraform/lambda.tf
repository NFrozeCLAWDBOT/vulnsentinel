# IAM Role for Lambda functions
resource "aws_iam_role" "lambda_role" {
  name = "${var.project_name}-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy" "lambda_policy" {
  name = "${var.project_name}-lambda-policy"
  role = aws_iam_role.lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:BatchWriteItem",
          "dynamodb:Query",
          "dynamodb:Scan"
        ]
        Resource = [
          aws_dynamodb_table.cves.arn,
          "${aws_dynamodb_table.cves.arn}/index/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      }
    ]
  })
}

# Archive files for Lambda deployment
data "archive_file" "sync_lambda" {
  type        = "zip"
  source_dir  = "${path.module}/lambda/sync"
  output_path = "${path.module}/lambda/sync.zip"
}

data "archive_file" "api_lambda" {
  type        = "zip"
  source_dir  = "${path.module}/lambda/api"
  output_path = "${path.module}/lambda/api.zip"
}

# Sync Lambda
resource "aws_lambda_function" "sync" {
  function_name    = "${var.project_name}-sync"
  filename         = data.archive_file.sync_lambda.output_path
  source_code_hash = data.archive_file.sync_lambda.output_base64sha256
  handler          = "index.handler"
  runtime          = "nodejs20.x"
  role             = aws_iam_role.lambda_role.arn
  timeout          = 900
  memory_size      = 512

  environment {
    variables = {
      TABLE_NAME  = aws_dynamodb_table.cves.name
      NVD_API_KEY = var.nvd_api_key
    }
  }
}

# API Lambda
resource "aws_lambda_function" "api" {
  function_name    = "${var.project_name}-api"
  filename         = data.archive_file.api_lambda.output_path
  source_code_hash = data.archive_file.api_lambda.output_base64sha256
  handler          = "index.handler"
  runtime          = "nodejs20.x"
  role             = aws_iam_role.lambda_role.arn
  timeout          = 30
  memory_size      = 256

  environment {
    variables = {
      TABLE_NAME = aws_dynamodb_table.cves.name
    }
  }
}
