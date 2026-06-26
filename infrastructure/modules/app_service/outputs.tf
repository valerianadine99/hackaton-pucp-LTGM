output "ecs_cluster_name" {
  description = "ECS cluster name"
  value       = aws_ecs_cluster.this.name
}

output "ecs_service_name" {
  description = "ECS service name"
  value       = aws_ecs_service.app.name
}

output "ecs_task_sg_id" {
  description = "ECS task security group ID — pass to database module"
  value       = aws_security_group.ecs_task.id
}

output "secret_key_secret_arn" {
  description = "Secrets Manager ARN for SECRET_KEY"
  value       = aws_secretsmanager_secret.secret_key.arn
}

output "anthropic_key_secret_arn" {
  description = "Secrets Manager ARN for ANTHROPIC_API_KEY"
  value       = aws_secretsmanager_secret.anthropic_api_key.arn
}

output "target_group_arn" {
  description = "ALB target group ARN"
  value       = aws_lb_target_group.app.arn
}
