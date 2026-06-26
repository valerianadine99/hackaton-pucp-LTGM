#!/usr/bin/env bash
# Run Django migrations as a one-shot ECS task (prod only).
# Staging runs migrations automatically on container startup.
# Usage: ./scripts/run_migration.sh prod
set -euo pipefail

ENV=${1:?Usage: $0 <prod>}
AWS_REGION=${AWS_REGION:-us-east-1}

if [[ "$ENV" != "prod" ]]; then
  echo "Staging migrations run automatically on container start — no manual step needed." >&2
  exit 0
fi

CLUSTER="vigia-${ENV}"
TASK_DEF="vigia-${ENV}"

echo "Fetching network config from running service..."
SERVICE_JSON=$(aws ecs describe-services \
  --cluster "${CLUSTER}" \
  --services "${TASK_DEF}" \
  --region "${AWS_REGION}" \
  --query 'services[0].networkConfiguration.awsvpcConfiguration' \
  --output json)

SUBNETS=$(echo "${SERVICE_JSON}" | python3 -c "import sys,json; d=json.load(sys.stdin); print(','.join(d['subnets']))")
SGS=$(echo "${SERVICE_JSON}" | python3 -c "import sys,json; d=json.load(sys.stdin); print(','.join(d['securityGroups']))")

echo "Running migrate task on cluster ${CLUSTER}..."
TASK_ARN=$(aws ecs run-task \
  --cluster "${CLUSTER}" \
  --task-definition "${TASK_DEF}" \
  --launch-type FARGATE \
  --region "${AWS_REGION}" \
  --network-configuration "awsvpcConfiguration={subnets=[${SUBNETS}],securityGroups=[${SGS}],assignPublicIp=ENABLED}" \
  --overrides '{"containerOverrides":[{"name":"app","command":["python","manage.py","migrate","--noinput"]}]}' \
  --query 'tasks[0].taskArn' \
  --output text)

echo "Task started: ${TASK_ARN}"
echo "Waiting for task to complete..."

aws ecs wait tasks-stopped \
  --cluster "${CLUSTER}" \
  --tasks "${TASK_ARN}" \
  --region "${AWS_REGION}"

EXIT_CODE=$(aws ecs describe-tasks \
  --cluster "${CLUSTER}" \
  --tasks "${TASK_ARN}" \
  --region "${AWS_REGION}" \
  --query 'tasks[0].containers[0].exitCode' \
  --output text)

if [[ "${EXIT_CODE}" == "0" ]]; then
  echo "Migrations completed successfully."
else
  echo "Migration task exited with code ${EXIT_CODE}." >&2
  exit 1
fi
