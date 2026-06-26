data "terraform_remote_state" "bootstrap" {
  backend = "s3"
  config = {
    bucket = var.state_bucket
    key    = "bootstrap/terraform.tfstate"
    region = var.aws_region
  }
}

locals {
  bs = data.terraform_remote_state.bootstrap.outputs
}

# No database module for staging — PostgreSQL runs as a sidecar in the ECS task.
# Data is ephemeral (resets on task restart) which is acceptable for staging.

module "app_service" {
  source = "../../modules/app_service"

  environment = "staging"
  aws_region  = var.aws_region

  vpc_id            = local.bs.vpc_id
  public_subnet_ids = local.bs.public_subnet_ids
  alb_listener_arn  = local.bs.alb_https_listener_arn
  alb_sg_id         = local.bs.alb_sg_id

  alb_listener_priority = 20
  host_header           = "api-staging.vigia.net.pe"

  ecr_repository_url = local.bs.ecr_repository_url
  image_tag          = var.image_tag

  cpu           = 512
  memory        = 1024
  desired_count = 1
  use_spot      = true

  enable_db_sidecar = true

  allowed_hosts = "api-staging.vigia.net.pe"
  cors_origins  = "https://vigia.net.pe"

  log_group_name = aws_cloudwatch_log_group.app.name

  # DATABASE_URL is a plain env var (localhost sidecar) — no secret ARN needed
  db_url_secret_arn = ""
}
