output "api_url" {
  description = "API Gateway base URL (append /api/... for routes)"
  value       = module.api_gateway.api_url
}

output "cloudfront_domain_name" {
  value = module.static_site.cloudfront_domain_name
}

output "cloudfront_distribution_id" {
  value = module.static_site.cloudfront_distribution_id
}

output "site_bucket_name" {
  value = module.static_site.bucket_name
}

output "lambda_function_name" {
  value = module.lambda.function_name
}

output "dynamodb_table_name" {
  value = module.dynamodb.table_name
}
