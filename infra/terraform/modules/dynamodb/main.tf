resource "aws_dynamodb_table" "table" {
  name         = "oh-rugby-${var.env}"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "PK"
  range_key    = "SK"

  attribute {
    name = "PK"
    type = "S"
  }

  attribute {
    name = "SK"
    type = "S"
  }

  point_in_time_recovery {
    enabled = var.env == "prod"
  }

  tags = {
    Project     = "oh-rugby"
    Environment = var.env
  }
}
