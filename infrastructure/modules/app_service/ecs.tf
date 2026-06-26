locals {
  # Sidecar postgres container added only when enable_db_sidecar is true (staging)
  db_sidecar_container = var.enable_db_sidecar ? [{
    name      = "db"
    image     = "postgres:16-alpine"
    essential = true

    environment = [
      { name = "POSTGRES_DB", value = "vigia" },
      { name = "POSTGRES_USER", value = "vigia" },
      { name = "POSTGRES_PASSWORD", value = "vigia" },
    ]

    healthCheck = {
      command     = ["CMD-SHELL", "pg_isready -U vigia"]
      interval    = 5
      timeout     = 3
      retries     = 10
      startPeriod = 10
    }

    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = var.log_group_name
        "awslogs-region"        = var.aws_region
        "awslogs-stream-prefix" = "db"
      }
    }
  }] : []

  # When using sidecar, DATABASE_URL is a plain env var pointing to localhost
  db_env_var = var.enable_db_sidecar ? [{
    name  = "DATABASE_URL"
    value = "postgres://vigia:vigia@localhost:5432/vigia"
  }] : []

  # When using RDS, DATABASE_URL comes from Secrets Manager
  db_secret = !var.enable_db_sidecar && var.db_url_secret_arn != "" ? [{
    name      = "DATABASE_URL"
    valueFrom = var.db_url_secret_arn
  }] : []

  # Startup command: when sidecar is present, wait for postgres then migrate + start gunicorn
  app_command = var.enable_db_sidecar ? [
    "sh", "-c",
    "python manage.py migrate --noinput && gunicorn config.wsgi:application --bind 0.0.0.0:${var.container_port} --workers 2 --timeout 60 --access-logfile - --error-logfile -"
  ] : null

  # app container depends on db sidecar being healthy
  app_depends_on = var.enable_db_sidecar ? [{ containerName = "db", condition = "HEALTHY" }] : []
}

resource "aws_ecs_cluster" "this" {
  name = "vigia-${var.environment}"

  setting {
    name  = "containerInsights"
    value = "disabled"
  }

  tags = { Environment = var.environment }
}

resource "aws_ecs_cluster_capacity_providers" "this" {
  cluster_name       = aws_ecs_cluster.this.name
  capacity_providers = ["FARGATE", "FARGATE_SPOT"]
}

resource "aws_ecs_task_definition" "app" {
  family                   = "vigia-${var.environment}"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.cpu
  memory                   = var.memory
  execution_role_arn       = aws_iam_role.execution.arn
  task_role_arn            = aws_iam_role.task.arn

  container_definitions = jsonencode(concat(
    local.db_sidecar_container,
    [{
      name      = "app"
      image     = "${var.ecr_repository_url}:${var.image_tag}"
      essential = true

      command   = local.app_command
      dependsOn = local.app_depends_on

      portMappings = [{ containerPort = var.container_port, protocol = "tcp" }]

      environment = concat(
        [
          { name = "DJANGO_SETTINGS_MODULE", value = "config.settings.production" },
          { name = "ALLOWED_HOSTS", value = var.allowed_hosts },
          { name = "CORS_ORIGINS", value = var.cors_origins },
          { name = "PORT", value = tostring(var.container_port) },
        ],
        local.db_env_var,
      )

      secrets = concat(
        [
          { name = "SECRET_KEY", valueFrom = aws_secretsmanager_secret.secret_key.arn },
          { name = "ANTHROPIC_API_KEY", valueFrom = aws_secretsmanager_secret.anthropic_api_key.arn },
        ],
        local.db_secret,
      )

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = var.log_group_name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "app"
        }
      }

      healthCheck = {
        command     = ["CMD-SHELL", "python -c \"import urllib.request; urllib.request.urlopen('http://localhost:${var.container_port}/health')\" || exit 1"]
        interval    = 30
        timeout     = 5
        retries     = 3
        startPeriod = 60
      }
    }]
  ))

  tags = { Environment = var.environment }
}

resource "aws_ecs_service" "app" {
  name            = "vigia-${var.environment}"
  cluster         = aws_ecs_cluster.this.id
  task_definition = aws_ecs_task_definition.app.arn
  desired_count   = var.desired_count

  capacity_provider_strategy {
    capacity_provider = var.use_spot ? "FARGATE_SPOT" : "FARGATE"
    weight            = 1
    base              = 1
  }

  network_configuration {
    subnets          = var.public_subnet_ids
    security_groups  = [aws_security_group.ecs_task.id]
    assign_public_ip = true
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.app.arn
    container_name   = "app"
    container_port   = var.container_port
  }

  deployment_minimum_healthy_percent = var.use_spot ? 0 : 50
  deployment_maximum_percent         = 200

  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }

  depends_on = [
    aws_lb_listener_rule.host_based,
    aws_iam_role_policy_attachment.execution_base,
  ]

  lifecycle {
    ignore_changes = [desired_count]
  }

  tags = { Environment = var.environment }
}
