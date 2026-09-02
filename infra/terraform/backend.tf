# Backend is intentionally left partial: bucket/key/region/dynamodb_table are
# supplied at `terraform init -backend-config=envs/<env>.backend.hcl`, so the
# same configuration can target either the dev or the prod state file.
terraform {
  backend "s3" {}
}
