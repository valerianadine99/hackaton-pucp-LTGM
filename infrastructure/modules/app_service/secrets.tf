resource "aws_secretsmanager_secret" "secret_key" {
  name        = "vigia/${var.environment}/SECRET_KEY"
  description = "Django SECRET_KEY for ${var.environment}"

  tags = { Environment = var.environment }
}

resource "aws_secretsmanager_secret_version" "secret_key_placeholder" {
  secret_id     = aws_secretsmanager_secret.secret_key.id
  secret_string = "PLACEHOLDER_RUN_make_secrets-init-${var.environment}"

  lifecycle {
    # Prevent Terraform from overwriting the real value set via init_secrets.sh
    ignore_changes = [secret_string]
  }
}

resource "aws_secretsmanager_secret" "anthropic_api_key" {
  name        = "vigia/${var.environment}/ANTHROPIC_API_KEY"
  description = "Anthropic API key for ${var.environment}"

  tags = { Environment = var.environment }
}

resource "aws_secretsmanager_secret_version" "anthropic_api_key_placeholder" {
  secret_id     = aws_secretsmanager_secret.anthropic_api_key.id
  secret_string = "PLACEHOLDER_RUN_make_secrets-init-${var.environment}"

  lifecycle {
    ignore_changes = [secret_string]
  }
}
