output "vpc_id" {
  description = "VPC ID — consumed by environment configurations"
  value       = aws_vpc.main.id
}

output "public_subnet_ids" {
  description = "Public subnet IDs (ALB + ECS tasks)"
  value       = [for s in aws_subnet.public : s.id]
}

output "private_subnet_ids" {
  description = "Private subnet IDs (RDS)"
  value       = [for s in aws_subnet.private : s.id]
}

output "alb_arn" {
  description = "Shared ALB ARN"
  value       = aws_lb.shared.arn
}

output "alb_dns_name" {
  description = "Shared ALB DNS name — used for Route53 alias records"
  value       = aws_lb.shared.dns_name
}

output "alb_zone_id" {
  description = "Shared ALB hosted zone ID — used for Route53 alias records"
  value       = aws_lb.shared.zone_id
}

output "alb_https_listener_arn" {
  description = "HTTPS listener ARN — environments attach rules here"
  value       = aws_lb_listener.https.arn
}

output "alb_sg_id" {
  description = "ALB security group ID — referenced by ECS task SG ingress rules"
  value       = aws_security_group.alb.id
}

output "ecr_repository_url" {
  description = "ECR repository URL for the backend image"
  value       = aws_ecr_repository.backend.repository_url
}

output "route53_zone_id" {
  description = "Route53 hosted zone ID for vigia.net.pe"
  value       = aws_route53_zone.main.zone_id
}

output "route53_name_servers" {
  description = "NS records — configure these at your punto.pe registrar"
  value       = aws_route53_zone.main.name_servers
}

output "s3_state_bucket_name" {
  description = "Terraform state S3 bucket name"
  value       = aws_s3_bucket.terraform_state.id
}

output "acm_certificate_arn" {
  description = "Validated wildcard ACM certificate ARN"
  value       = aws_acm_certificate_validation.wildcard.certificate_arn
}

output "vpc_cidr" {
  description = "VPC CIDR block"
  value       = aws_vpc.main.cidr_block
}
