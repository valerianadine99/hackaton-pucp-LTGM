#!/usr/bin/env bash
# Build the Vigia backend Docker image and push it to ECR.
#
# Usage:
#   ./scripts/build.sh <staging|prod> [image_tag]
#
# Examples:
#   ./scripts/build.sh staging                 # tag = current git SHA
#   ./scripts/build.sh prod v1.0.0             # explicit tag
#   ./scripts/build.sh staging my-feature      # custom tag
#
# The image is pushed with TWO tags:
#   <image_tag>       — exact version (e.g. abc1234 or v1.0.0)
#   <env>-latest      — mutable alias (e.g. staging-latest, prod-latest)
#
# The deploy.sh script defaults to <env>-latest, so you can run:
#   ./scripts/build.sh staging && ./scripts/deploy.sh staging
set -euo pipefail

# ── Args & defaults ────────────────────────────────────────────────────────────
ENV=${1:?Error: environment required. Usage: $0 <staging|prod> [image_tag]}
TAG=${2:-$(git rev-parse --short HEAD 2>/dev/null || echo "latest")}
AWS_REGION=${AWS_REGION:-us-east-1}

if [[ "$ENV" != "prod" && "$ENV" != "staging" ]]; then
  echo "Error: environment must be 'prod' or 'staging', got '${ENV}'" >&2
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
BACKEND_DIR="${REPO_ROOT}/backend"
ENV_LATEST_TAG="${ENV}-latest"

# ── Resolve ECR repo ───────────────────────────────────────────────────────────
echo ""
echo "==> Resolving AWS account..."
ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
ECR_HOST="${ACCOUNT}.dkr.ecr.${AWS_REGION}.amazonaws.com"
REPO="${ECR_HOST}/vigia-backend"

echo "    Account : ${ACCOUNT}"
echo "    Region  : ${AWS_REGION}"
echo "    Repo    : ${REPO}"
echo "    Tags    : ${TAG}, ${ENV_LATEST_TAG}"
echo ""

# ── ECR login ─────────────────────────────────────────────────────────────────
echo "==> Authenticating Docker to ECR..."
aws ecr get-login-password --region "${AWS_REGION}" | \
  docker login --username AWS --password-stdin "${ECR_HOST}"

# ── Build ──────────────────────────────────────────────────────────────────────
echo ""
echo "==> Building image from ${BACKEND_DIR}..."
docker build \
  --tag "vigia-backend:${TAG}" \
  --file "${BACKEND_DIR}/Dockerfile" \
  "${BACKEND_DIR}"

# ── Tag & push ─────────────────────────────────────────────────────────────────
echo ""
echo "==> Tagging and pushing..."

docker tag "vigia-backend:${TAG}" "${REPO}:${TAG}"
docker push "${REPO}:${TAG}"
echo "    Pushed: ${REPO}:${TAG}"

docker tag "vigia-backend:${TAG}" "${REPO}:${ENV_LATEST_TAG}"
docker push "${REPO}:${ENV_LATEST_TAG}"
echo "    Pushed: ${REPO}:${ENV_LATEST_TAG}"

# ── Done ───────────────────────────────────────────────────────────────────────
echo ""
echo "==> Build complete."
echo "    Image: ${REPO}:${TAG}"
echo ""
echo "    To deploy:"
echo "    ./scripts/deploy.sh ${ENV} ${TAG}"
echo ""
