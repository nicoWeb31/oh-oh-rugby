resource "aws_iam_user" "deploy" {
  name = "oh-rugby-${var.env}-deploy"

  tags = {
    Project     = "oh-rugby"
    Environment = var.env
  }
}

# Static long-lived credentials for GitHub Actions (stored as GitHub secrets).
# Prefer the OIDC role approach (see git history / infra/terraform/README.md)
# when possible: it avoids long-lived keys entirely. Rotate these regularly.
resource "aws_iam_access_key" "deploy" {
  user = aws_iam_user.deploy.name
}

data "aws_iam_policy_document" "permissions" {
  # Terraform remote state (shared bucket/table, scoped to this env's state key).
  statement {
    sid       = "TerraformStateBucket"
    actions   = ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"]
    resources = ["arn:aws:s3:::oh-rugby-tfstate-${var.account_id}/oh-rugby/${var.env}/*"]
  }

  statement {
    sid       = "TerraformStateBucketList"
    actions   = ["s3:ListBucket"]
    resources = ["arn:aws:s3:::oh-rugby-tfstate-${var.account_id}"]
  }

  statement {
    sid       = "TerraformLockTable"
    actions   = ["dynamodb:GetItem", "dynamodb:PutItem", "dynamodb:DeleteItem"]
    resources = ["arn:aws:dynamodb:${var.region}:${var.account_id}:table/oh-rugby-tf-locks"]
  }

  # Application DynamoDB table.
  statement {
    sid     = "AppDynamoDbTable"
    actions = ["dynamodb:*"]
    resources = [
      "arn:aws:dynamodb:${var.region}:${var.account_id}:table/oh-rugby-${var.env}",
      "arn:aws:dynamodb:${var.region}:${var.account_id}:table/oh-rugby-${var.env}/*",
    ]
  }

  # Lambda function managed by Terraform + code pushed by the deploy step.
  statement {
    sid       = "AppLambda"
    actions   = ["lambda:*"]
    resources = ["arn:aws:lambda:${var.region}:${var.account_id}:function:oh-rugby-${var.env}"]
  }

  # IAM role/policy for the Lambda execution role Terraform creates.
  statement {
    sid = "AppLambdaExecRole"
    actions = [
      "iam:CreateRole", "iam:DeleteRole", "iam:GetRole", "iam:TagRole",
      "iam:PutRolePolicy", "iam:DeleteRolePolicy", "iam:GetRolePolicy",
      "iam:AttachRolePolicy", "iam:DetachRolePolicy", "iam:ListAttachedRolePolicies",
      "iam:ListRolePolicies", "iam:PassRole",
    ]
    resources = ["arn:aws:iam::${var.account_id}:role/oh-rugby-${var.env}-lambda-exec"]
  }

  # CloudWatch Logs for the Lambda and API Gateway access logs.
  statement {
    sid = "AppLogs"
    actions = [
      "logs:CreateLogGroup", "logs:DeleteLogGroup", "logs:PutRetentionPolicy",
      "logs:DescribeLogGroups", "logs:TagResource", "logs:ListTagsForResource",
    ]
    resources = [
      "arn:aws:logs:${var.region}:${var.account_id}:log-group:/aws/lambda/oh-rugby-${var.env}*",
      "arn:aws:logs:${var.region}:${var.account_id}:log-group:/aws/apigateway/oh-rugby-${var.env}*",
    ]
  }

  # S3 static site bucket (Terraform-managed) + CI upload/sync at deploy time,
  # plus the CloudFront access logs bucket.
  statement {
    sid     = "AppSiteBucket"
    actions = ["s3:*"]
    resources = [
      "arn:aws:s3:::oh-rugby-${var.env}-site-${var.account_id}",
      "arn:aws:s3:::oh-rugby-${var.env}-site-${var.account_id}/*",
      "arn:aws:s3:::oh-rugby-${var.env}-cf-logs-${var.account_id}",
      "arn:aws:s3:::oh-rugby-${var.env}-cf-logs-${var.account_id}/*",
    ]
  }

  # API Gateway v2 and CloudFront do not support useful resource-level
  # scoping for the management actions Terraform needs, so access is
  # granted at the service level rather than per-resource.
  statement {
    sid       = "ApiGatewayManage"
    actions   = ["apigateway:*"]
    resources = ["*"]
  }

  statement {
    sid       = "CloudFrontManage"
    actions   = ["cloudfront:*"]
    resources = ["*"]
  }

  statement {
    sid       = "STSIdentity"
    actions   = ["sts:GetCallerIdentity"]
    resources = ["*"]
  }
}

# Inline user policies cap out at 2048 bytes, too small for this policy.
# A customer-managed policy allows up to 6144 bytes.
resource "aws_iam_policy" "deploy" {
  name   = "oh-rugby-${var.env}-deploy"
  policy = data.aws_iam_policy_document.permissions.json
}

resource "aws_iam_user_policy_attachment" "deploy" {
  user       = aws_iam_user.deploy.name
  policy_arn = aws_iam_policy.deploy.arn
}
