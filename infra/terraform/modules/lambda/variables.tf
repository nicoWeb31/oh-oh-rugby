variable "env" {
  description = "Deployment environment (dev or prod)"
  type        = string
}

variable "dynamodb_table_arn" {
  type = string
}

variable "dynamodb_table_name" {
  type = string
}

variable "allowed_origins" {
  description = "Comma-separated list of origins allowed by CORS"
  type        = string
}

variable "node_runtime" {
  description = "Lambda Node.js runtime identifier"
  type        = string
  default     = "nodejs22.x"
}

variable "memory_size" {
  type    = number
  default = 256
}

variable "timeout" {
  type    = number
  default = 10
}
