#!/usr/bin/env bash
# Populate SECRET_KEY and ANTHROPIC_API_KEY in Secrets Manager for a given environment.
# Run this once after the first terraform apply.
# Usage: ./scripts/init_secrets.sh <prod|staging>
set -euo pipefail

ENV=${1:?Usage: $0 <prod|staging>}
AWS_REGION=${AWS_REGION:-us-east-1}

if [[ "$ENV" != "prod" && "$ENV" != "staging" ]]; then
  echo "Error: environment must be 'prod' or 'staging'" >&2
  exit 1
fi

echo ""
echo "Setting secrets for environment: ${ENV}"
echo ""

read -rsp "Django SECRET_KEY for ${ENV}: " SECRET_KEY; echo
read -rsp "ANTHROPIC_API_KEY for ${ENV}: " ANTHROPIC_KEY; echo

aws secretsmanager put-secret-value \
  --region "${AWS_REGION}" \
  --secret-id "vigia/${ENV}/SECRET_KEY" \
  --secret-string "${SECRET_KEY}"

echo "SECRET_KEY updated."

aws secretsmanager put-secret-value \
  --region "${AWS_REGION}" \
  --secret-id "vigia/${ENV}/ANTHROPIC_API_KEY" \
  --secret-string "${ANTHROPIC_KEY}"

echo "ANTHROPIC_API_KEY updated."
echo ""
echo "Secrets initialized for ${ENV}."
echo "Run: aws ecs update-service --cluster vigia-${ENV} --service vigia-${ENV} --force-new-deployment --region ${AWS_REGION}"
