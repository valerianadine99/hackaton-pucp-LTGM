output "api_url" {
  description = "Production API URL"
  value       = "https://api.vigia.net.pe"
}

output "ecs_cluster_name" {
  description = "ECS cluster name for CLI commands"
  value       = module.app_service.ecs_cluster_name
}

output "ecs_service_name" {
  description = "ECS service name for CLI commands"
  value       = module.app_service.ecs_service_name
}
