resource "aws_db_subnet_group" "this" {
  name        = "vigia-${var.environment}"
  subnet_ids  = var.private_subnet_ids
  description = "RDS subnet group for vigia ${var.environment}"

  tags = { Environment = var.environment }
}
