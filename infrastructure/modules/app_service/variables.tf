variable "environment" {
  description = "Deployment environment (prod or staging)"
  type        = string

  validation {
    condition     = contains(["prod", "staging"], var.environment)
    error_message = "environment must be 'prod' or 'staging'"
  }
}

variable "aws_region" {
  description = "AWS region"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "public_subnet_ids" {
  description = "Public subnet IDs for ECS tasks (assign_public_ip replaces NAT Gateway)"
  type        = list(string)
}

variable "alb_listener_arn" {
  description = "HTTPS listener ARN on the shared ALB"
  type        = string
}

variable "alb_listener_priority" {
  description = "Listener rule priority (lower = higher priority; 10=prod, 20=staging)"
  type        = number
}

variable "alb_sg_id" {
  description = "ALB security group ID — ECS task SG allows ingress from this"
  type        = string
}

variable "host_header" {
  description = "Hostname the ALB listener rule matches (e.g. api.vigia.net.pe)"
  type        = string
}

variable "ecr_repository_url" {
  description = "ECR repository URL (without tag)"
  type        = string
}

variable "image_tag" {
  description = "Docker image tag to deploy"
  type        = string
  default     = "latest"
}

variable "container_port" {
  description = "Port the app container listens on"
  type        = number
  default     = 8000
}

variable "cpu" {
  description = "ECS task CPU units (256, 512, 1024 …)"
  type        = number
  default     = 512
}

variable "memory" {
  description = "ECS task memory in MiB"
  type        = number
  default     = 1024
}

variable "desired_count" {
  description = "Number of ECS tasks to run"
  type        = number
  default     = 1
}

variable "use_spot" {
  description = "Use FARGATE_SPOT capacity provider (true for staging)"
  type        = bool
  default     = false
}

variable "enable_db_sidecar" {
  description = "Add a postgres:16-alpine sidecar container for local DB (staging only)"
  type        = bool
  default     = false
}

variable "allowed_hosts" {
  description = "ALLOWED_HOSTS Django setting value"
  type        = string
}

variable "cors_origins" {
  description = "CORS_ORIGINS Django setting value (comma-separated)"
  type        = string
}

variable "log_group_name" {
  description = "CloudWatch log group name for ECS task logs"
  type        = string
}

variable "db_url_secret_arn" {
  description = "Secrets Manager ARN for DATABASE_URL (prod only; empty string when using sidecar)"
  type        = string
  default     = ""
}
