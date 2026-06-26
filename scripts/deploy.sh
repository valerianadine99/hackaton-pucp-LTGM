#!/usr/bin/env bash
# Deploy the Vigia backend to a given environment.
#
# Usage:
#   ./scripts/deploy.sh <staging|prod> [image_tag]
#
# Examples:
#   ./scripts/deploy.sh staging                # uses staging-latest tag
#   ./scripts/deploy.sh prod v1.0.0            # explicit tag
#   ./scripts/deploy.sh staging abc1234        # specific commit SHA
#
# What this script does:
#   1. Runs terraform apply for the environment
#   2. Forces a new ECS deployment (picks up new image / secrets)
#   3. Waits for ECS service to stabilize
#   4. Runs Django migrations (prod only — staging auto-migrates on startup)
#   5. Prints the health check URL
#
# Prerequisites:
#   - AWS CLI configured with deploy permissions
#   - Terraform >= 1.10 in PATH
#   - terraform init already run for this environment
#   - Docker image already pushed (run build.sh first)
set -euo pipefail

# ── Args & defaults ────────────────────────────────────────────────────────────
ENV=${1:?Error: environment required. Usage: $0 <staging|prod> [image_tag]}
AWS_REGION=${AWS_REGION:-us-east-1}

if [[ "$ENV" != "prod" && "$ENV" != "staging" ]]; then
  echo "Error: environment must be 'prod' or 'staging', got '${ENV}'" >&2
  exit 1
fi

# Default tag: <env>-latest (set by build.sh)
TAG=${2:-${ENV}-latest}

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
TF_DIR="${REPO_ROOT}/infrastructure/environments/${ENV}"
CLUSTER="vigia-${ENV}"
SERVICE="vigia-${ENV}"

# ── Prod confirmation ──────────────────────────────────────────────────────────
if [[ "$ENV" == "prod" ]]; then
  echo ""
  echo "  WARNING: Deploying to PRODUCTION (api.vigia.net.pe)"
  echo "  Image tag: ${TAG}"
  echo ""
  read -rp "  Type 'yes' to continue: " CONFIRM
  if [[ "$CONFIRM" != "yes" ]]; then
    echo "Aborted." >&2
    exit 1
  fi
fi

echo ""
echo "==> Deploying to ${ENV} with image tag: ${TAG}"
echo ""

# ── Terraform apply ────────────────────────────────────────────────────────────
echo "==> Running terraform apply..."
terraform -chdir="${TF_DIR}" apply \
  -var="image_tag=${TAG}" \
  -auto-approve

# ── Force new ECS deployment ───────────────────────────────────────────────────
echo ""
echo "==> Triggering new ECS deployment..."
aws ecs update-service \
  --cluster "${CLUSTER}" \
  --service "${SERVICE}" \
  --force-new-deployment \
  --region "${AWS_REGION}" \
  --output text \
  --query 'service.serviceArn' > /dev/null

echo "    Deployment triggered on cluster '${CLUSTER}'"

# ── Wait for stability ─────────────────────────────────────────────────────────
echo ""
echo "==> Waiting for ECS service to stabilize (this may take a few minutes)..."
aws ecs wait services-stable \
  --cluster "${CLUSTER}" \
  --services "${SERVICE}" \
  --region "${AWS_REGION}"

echo "    Service is stable."

# ── Migrations (prod only) ─────────────────────────────────────────────────────
if [[ "$ENV" == "prod" ]]; then
  echo ""
  echo "==> Running database migrations..."
  "${SCRIPT_DIR}/run_migration.sh" prod
fi

# ── Health check ───────────────────────────────────────────────────────────────
if [[ "$ENV" == "prod" ]]; then
  HEALTH_URL="https://api.vigia.net.pe/health"
else
  HEALTH_URL="https://api-staging.vigia.net.pe/health"
fi

echo ""
echo "==> Checking health..."
sleep 5
if curl -sf --max-time 10 "${HEALTH_URL}" > /dev/null 2>&1; then
  echo "    Health check passed: ${HEALTH_URL}"
else
  echo "    Health check did not respond yet (DNS may still be propagating)."
  echo "    Try manually: curl ${HEALTH_URL}"
fi

# ── Done ───────────────────────────────────────────────────────────────────────
echo ""
echo "==> Deploy complete."
echo "    Environment : ${ENV}"
echo "    Image tag   : ${TAG}"
echo "    API URL     : ${HEALTH_URL%/health}"
echo ""
