resource "aws_security_group" "ecs_task" {
  name        = "vigia-ecs-${var.environment}"
  description = "ECS task security group for vigia ${var.environment}"
  vpc_id      = var.vpc_id

  tags = { Name = "vigia-ecs-${var.environment}-sg" }
}

resource "aws_vpc_security_group_ingress_rule" "from_alb" {
  security_group_id            = aws_security_group.ecs_task.id
  referenced_security_group_id = var.alb_sg_id
  ip_protocol                  = "tcp"
  from_port                    = var.container_port
  to_port                      = var.container_port
  description                  = "Allow ALB to reach app container"
}

resource "aws_vpc_security_group_egress_rule" "https_out" {
  security_group_id = aws_security_group.ecs_task.id
  cidr_ipv4         = "0.0.0.0/0"
  ip_protocol       = "tcp"
  from_port         = 443
  to_port           = 443
  description       = "HTTPS to ECR, Secrets Manager, Anthropic API"
}

resource "aws_vpc_security_group_egress_rule" "http_out" {
  security_group_id = aws_security_group.ecs_task.id
  cidr_ipv4         = "0.0.0.0/0"
  ip_protocol       = "tcp"
  from_port         = 80
  to_port           = 80
  description       = "HTTP outbound (e.g. ECR token endpoint)"
}

resource "aws_vpc_security_group_egress_rule" "postgres_out" {
  security_group_id = aws_security_group.ecs_task.id
  cidr_ipv4         = data.aws_vpc.main.cidr_block
  ip_protocol       = "tcp"
  from_port         = 5432
  to_port           = 5432
  description       = "PostgreSQL to RDS in private subnets"
}

data "aws_vpc" "main" {
  id = var.vpc_id
}
