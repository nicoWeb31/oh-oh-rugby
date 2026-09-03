terraform {
  required_version = ">= 1.6"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.region
}

# --- Terraform remote state (shared by dev and prod, separate keys) ---

resource "aws_s3_bucket" "tf_state" {
  bucket = "oh-rugby-tfstate-${var.account_id}"

  tags = { Project = "oh-rugby" }
}

resource "aws_s3_bucket_versioning" "tf_state" {
  bucket = aws_s3_bucket.tf_state.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "tf_state" {
  bucket = aws_s3_bucket.tf_state.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "tf_state" {
  bucket                  = aws_s3_bucket.tf_state.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_dynamodb_table" "tf_lock" {
  name         = "oh-rugby-tf-locks"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "LockID"

  attribute {
    name = "LockID"
    type = "S"
  }

  tags = { Project = "oh-rugby" }
}

# --- IAM users for GitHub Actions (static access keys stored as GitHub secrets) ---

module "deploy_user_dev" {
  source     = "./modules/deploy_user"
  env        = "dev"
  account_id = var.account_id
  region     = var.region
}

module "deploy_user_prod" {
  source     = "./modules/deploy_user"
  env        = "prod"
  account_id = var.account_id
  region     = var.region
}
