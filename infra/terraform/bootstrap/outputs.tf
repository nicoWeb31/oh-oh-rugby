output "state_bucket" {
  value = aws_s3_bucket.tf_state.id
}

output "lock_table" {
  value = aws_dynamodb_table.tf_lock.name
}

output "deploy_user_dev_access_key_id" {
  value = module.deploy_user_dev.access_key_id
}

output "deploy_user_dev_secret_access_key" {
  value     = module.deploy_user_dev.secret_access_key
  sensitive = true
}

output "deploy_user_prod_access_key_id" {
  value = module.deploy_user_prod.access_key_id
}

output "deploy_user_prod_secret_access_key" {
  value     = module.deploy_user_prod.secret_access_key
  sensitive = true
}
