data "archive_file" "placeholder" {
  type        = "zip"
  source_dir  = "${path.module}/placeholder"
  output_path = "${path.module}/placeholder.zip"
}

resource "aws_iam_role" "lambda_exec" {
  name = "oh-rugby-${var.env}-lambda-exec"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect    = "Allow"
        Principal = { Service = "lambda.amazonaws.com" }
        Action    = "sts:AssumeRole"
      }
    ]
  })

  tags = {
    Project     = "oh-rugby"
    Environment = var.env
  }
}

resource "aws_iam_role_policy" "lambda_dynamodb" {
  name = "oh-rugby-${var.env}-lambda-dynamodb"
  role = aws_iam_role.lambda_exec.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:Query",
          "dynamodb:Scan",
          "dynamodb:BatchGetItem",
          "dynamodb:BatchWriteItem",
        ]
        Resource = var.dynamodb_table_arn
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_logs" {
  role       = aws_iam_role.lambda_exec.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_lambda_function" "api" {
  function_name = "oh-rugby-${var.env}"
  role          = aws_iam_role.lambda_exec.arn
  handler       = "main.handler"
  runtime       = var.node_runtime
  memory_size   = var.memory_size
  timeout       = var.timeout

  # Complements the API Gateway throttle: caps how many invocations can run
  # in parallel, which in turn caps the max concurrent load on DynamoDB and
  # the worst-case cost if something loops out of control.
  reserved_concurrent_executions = 10

  filename         = data.archive_file.placeholder.output_path
  source_code_hash = data.archive_file.placeholder.output_base64sha256

  environment {
    variables = {
      NODE_ENV       = var.env == "prod" ? "production" : "development"
      DYNAMODB_TABLE = var.dynamodb_table_name
      # ALLOWED_ORIGINS intentionally unset for the MVP: Express then allows
      # every origin (see apps/back-oh-rugby/src/app.ts). Reinstate this once
      # the frontend origin is stable and CORS should be locked down.
    }
  }

  tags = {
    Project     = "oh-rugby"
    Environment = var.env
  }

  # The deploy workflow pushes real application code with
  # `aws lambda update-function-code` after every build; Terraform must not
  # revert it back to the placeholder on the next apply.
  lifecycle {
    ignore_changes = [filename, source_code_hash]
  }
}

resource "aws_cloudwatch_log_group" "api" {
  name              = "/aws/lambda/${aws_lambda_function.api.function_name}"
  retention_in_days = var.env == "prod" ? 30 : 14

  tags = {
    Project     = "oh-rugby"
    Environment = var.env
  }
}
