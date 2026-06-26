#!/usr/bin/env bash
# Push the backend Docker image to ECR.
# Usage: ./scripts/push_ecr.sh <image_tag>
set -euo pipefail

TAG=${1:-latest}
AWS_REGION=${AWS_REGION:-us-east-1}

ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
REPO="${ACCOUNT}.dkr.ecr.${AWS_REGION}.amazonaws.com/vigia-backend"

echo "Logging in to ECR..."
aws ecr get-login-password --region "${AWS_REGION}" | \
  docker login --username AWS --password-stdin "${ACCOUNT}.dkr.ecr.${AWS_REGION}.amazonaws.com"

echo "Building image..."
docker build -t "vigia-backend:${TAG}" "$(dirname "$0")/../backend"

echo "Tagging..."
docker tag "vigia-backend:${TAG}" "${REPO}:${TAG}"

echo "Pushing ${REPO}:${TAG} ..."
docker push "${REPO}:${TAG}"

echo "Done: ${REPO}:${TAG}"
