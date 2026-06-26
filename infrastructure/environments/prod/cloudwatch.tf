resource "aws_cloudwatch_log_group" "app" {
  name              = "/ecs/vigia-prod"
  retention_in_days = 30
}
