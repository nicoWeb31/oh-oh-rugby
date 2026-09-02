module "dynamodb" {
  source = "./modules/dynamodb"
  env    = var.env
}

module "static_site" {
  source         = "./modules/static_site"
  env            = var.env
  account_suffix = var.account_id
}

module "lambda" {
  source              = "./modules/lambda"
  env                 = var.env
  dynamodb_table_arn  = module.dynamodb.table_arn
  dynamodb_table_name = module.dynamodb.table_name
}

module "api_gateway" {
  source               = "./modules/api_gateway"
  env                  = var.env
  lambda_invoke_arn    = module.lambda.invoke_arn
  lambda_function_name = module.lambda.function_name
}
