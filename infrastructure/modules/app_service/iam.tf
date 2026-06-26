data "aws_iam_policy_document" "ecs_task_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["ecs-tasks.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "execution" {
  name               = "vigia-${var.environment}-execution"
  assume_role_policy = data.aws_iam_policy_document.ecs_task_assume.json
  description        = "ECS task execution role — pulls images and injects secrets"

  tags = { Environment = var.environment }
}

resource "aws_iam_role_policy_attachment" "execution_base" {
  role       = aws_iam_role.execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

data "aws_iam_policy_document" "secrets_access" {
  statement {
    sid    = "AllowSecretsRead"
    effect = "Allow"
    actions = [
      "secretsmanager:GetSecretValue",
    ]
    resources = compact([
      aws_secretsmanager_secret.secret_key.arn,
      aws_secretsmanager_secret.anthropic_api_key.arn,
      var.db_url_secret_arn,
    ])
  }
}

resource "aws_iam_role_policy" "execution_secrets" {
  name   = "secrets-access"
  role   = aws_iam_role.execution.id
  policy = data.aws_iam_policy_document.secrets_access.json
}

resource "aws_iam_role" "task" {
  name               = "vigia-${var.environment}-task"
  assume_role_policy = data.aws_iam_policy_document.ecs_task_assume.json
  description        = "ECS task role — identity assumed by the running container"

  tags = { Environment = var.environment }
}
