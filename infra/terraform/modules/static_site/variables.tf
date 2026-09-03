variable "env" {
  type = string
}

variable "account_suffix" {
  description = "Suffix (e.g. AWS account id) appended to the bucket name to keep it globally unique"
  type        = string
}
