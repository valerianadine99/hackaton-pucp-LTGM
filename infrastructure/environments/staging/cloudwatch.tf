resource "aws_cloudwatch_log_group" "app" {
  name              = "/ecs/vigia-staging"
  retention_in_days = 7
}
