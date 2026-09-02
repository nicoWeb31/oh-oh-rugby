module "dynamodb" {
  source = "./modules/dynamodb"
  env    = var.env
}

module "static_site" {
  source         = "./modules/static_site"
  env            = var.env
  account_suffix = var.account_id
}

locals {
  cloudfront_origin = "https://${module.static_site.cloudfront_domain_name}"
  allowed_origins = join(",", compact([
    local.cloudfront_origin,
    var.allowed_origins,
  ]))
}

module "lambda" {
  source              = "./modules/lambda"
  env                 = var.env
  dynamodb_table_arn  = module.dynamodb.table_arn
  dynamodb_table_name = module.dynamodb.table_name
  allowed_origins     = local.allowed_origins
}

module "api_gateway" {
  source               = "./modules/api_gateway"
  env                  = var.env
  lambda_invoke_arn    = module.lambda.invoke_arn
  lambda_function_name = module.lambda.function_name
}
