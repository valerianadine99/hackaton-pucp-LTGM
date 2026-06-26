output "db_endpoint" {
  description = "RDS instance endpoint"
  value       = aws_db_instance.this.endpoint
}

output "db_url_secret_arn" {
  description = "Secrets Manager ARN for DATABASE_URL — pass to app_service module"
  value       = aws_secretsmanager_secret.database_url.arn
}

output "rds_sg_id" {
  description = "RDS security group ID"
  value       = aws_security_group.rds.id
}
