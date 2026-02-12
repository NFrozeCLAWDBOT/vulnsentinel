resource "aws_dynamodb_table" "cves" {
  name         = "${var.project_name}-cves"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "cveId"

  attribute {
    name = "cveId"
    type = "S"
  }

  attribute {
    name = "vendor"
    type = "S"
  }

  attribute {
    name = "cvssScore"
    type = "N"
  }

  attribute {
    name = "cweId"
    type = "S"
  }

  attribute {
    name = "cvssSeverity"
    type = "S"
  }

  attribute {
    name = "publishedDate"
    type = "S"
  }

  attribute {
    name = "isKev"
    type = "S"
  }

  attribute {
    name = "kevDateAdded"
    type = "S"
  }

  global_secondary_index {
    name            = "vendor-index"
    hash_key        = "vendor"
    range_key       = "cvssScore"
    projection_type = "ALL"
  }

  global_secondary_index {
    name            = "cwe-index"
    hash_key        = "cweId"
    range_key       = "cvssScore"
    projection_type = "ALL"
  }

  global_secondary_index {
    name            = "severity-index"
    hash_key        = "cvssSeverity"
    range_key       = "publishedDate"
    projection_type = "ALL"
  }

  global_secondary_index {
    name            = "kev-index"
    hash_key        = "isKev"
    range_key       = "kevDateAdded"
    projection_type = "ALL"
  }
}
