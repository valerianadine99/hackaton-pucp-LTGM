resource "aws_security_group" "rds" {
  name        = "vigia-rds-${var.environment}"
  description = "RDS security group for vigia ${var.environment}"
  vpc_id      = var.vpc_id

  tags = { Name = "vigia-rds-${var.environment}-sg" }
}

resource "aws_vpc_security_group_ingress_rule" "from_ecs" {
  security_group_id            = aws_security_group.rds.id
  referenced_security_group_id = var.ecs_task_sg_id
  ip_protocol                  = "tcp"
  from_port                    = 5432
  to_port                      = 5432
  description                  = "PostgreSQL from ECS tasks only"
}
