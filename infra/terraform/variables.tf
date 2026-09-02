variable "env" {
  description = "Deployment environment: dev or prod"
  type        = string

  validation {
    condition     = contains(["dev", "prod"], var.env)
    error_message = "env must be \"dev\" or \"prod\"."
  }
}

variable "region" {
  description = "AWS region"
  type        = string
  default     = "eu-west-3"
}

variable "account_id" {
  description = "AWS account id, used to keep the S3 site bucket name globally unique"
  type        = string
}
