resource "aws_route53_zone" "main" {
  name = var.domain

  tags = { Name = "vigia-zone" }
}
