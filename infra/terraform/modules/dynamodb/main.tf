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

  # Prod holds real player predictions, and Terraform's `prevent_destroy`
  # can only ever be a literal (no `var.env == "prod"` — Terraform rejects
  # any expression here), so this applies to both envs rather than prod
  # only. Blocks any `terraform destroy`/`apply` that would delete or
  # force-recreate this table (e.g. an accidental change to
  # hash_key/range_key/name) — Terraform refuses the plan instead of
  # silently wiping the data. To genuinely tear down a table (e.g. reset
  # dev), comment this block out, apply, then restore it.
  lifecycle {
    prevent_destroy = true
  }
}
