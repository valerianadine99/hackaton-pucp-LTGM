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

module "database" {
  source = "../../modules/database"

  environment        = "prod"
  vpc_id             = local.bs.vpc_id
  private_subnet_ids = local.bs.private_subnet_ids
  ecs_task_sg_id     = module.app_service.ecs_task_sg_id

  instance_class          = "db.t3.micro"
  backup_retention_period = 7
  deletion_protection     = true
  skip_final_snapshot     = false
}

module "app_service" {
  source = "../../modules/app_service"

  environment = "prod"
  aws_region  = var.aws_region

  vpc_id            = local.bs.vpc_id
  public_subnet_ids = local.bs.public_subnet_ids
  alb_listener_arn  = local.bs.alb_https_listener_arn
  alb_sg_id         = local.bs.alb_sg_id

  alb_listener_priority = 10
  host_header           = "api.vigia.net.pe"

  ecr_repository_url = local.bs.ecr_repository_url
  image_tag          = var.image_tag

  cpu           = 512
  memory        = 1024
  desired_count = 2
  use_spot      = false

  enable_db_sidecar = false

  allowed_hosts = "api.vigia.net.pe"
  cors_origins  = "https://vigia.net.pe"

  log_group_name = aws_cloudwatch_log_group.app.name

  db_url_secret_arn = module.database.db_url_secret_arn
}
