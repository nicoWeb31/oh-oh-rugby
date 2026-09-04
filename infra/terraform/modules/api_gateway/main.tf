resource "aws_apigatewayv2_api" "http_api" {
  name          = "oh-rugby-${var.env}"
  protocol_type = "HTTP"
}

resource "aws_apigatewayv2_integration" "lambda" {
  api_id                 = aws_apigatewayv2_api.http_api.id
  integration_type       = "AWS_PROXY"
  integration_uri        = var.lambda_invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "default" {
  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = "$default"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.http_api.id
  name        = "$default"
  auto_deploy = true

  # Throttle at the edge, before Lambda/DynamoDB are ever touched. Global to
  # the whole API (no per-IP/per-user quota, no WAF) — a blunt ceiling meant
  # to stop a runaway script or accidental request loop, not real abuse.
  # Burst is sized for the matchday prediction form: each click on an
  # outcome/bonus fires a PUT then a ranking GET with no debounce, so a
  # player blitzing through a whole matchday (7 matches) can burst ~40
  # requests, and several players doing that at once share this same
  # counter. Sizing it too low would silently drop saves under load (the
  # front has no 429 retry/error UI yet).
  default_route_settings {
    throttling_rate_limit  = 15
    throttling_burst_limit = 40
  }

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.access_logs.arn
    format = jsonencode({
      requestId               = "$context.requestId"
      routeKey                = "$context.routeKey"
      status                  = "$context.status"
      responseLength          = "$context.responseLength"
      integrationErrorMessage = "$context.integrationErrorMessage"
    })
  }
}

resource "aws_cloudwatch_log_group" "access_logs" {
  name              = "/aws/apigateway/oh-rugby-${var.env}"
  retention_in_days = var.env == "prod" ? 30 : 14

  tags = {
    Project     = "oh-rugby"
    Environment = var.env
  }
}

resource "aws_lambda_permission" "allow_api_gateway" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = var.lambda_function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.http_api.execution_arn}/*/*"
}
