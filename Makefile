SHELL        := /bin/bash
AWS_REGION   ?= us-east-1
IMAGE_TAG    ?= $(shell git rev-parse --short HEAD 2>/dev/null || echo latest)

TF_BOOTSTRAP := infrastructure/bootstrap
TF_PROD      := infrastructure/environments/prod
TF_STAGING   := infrastructure/environments/staging

# ── Bootstrap (shared resources — run once) ────────────────────────────────────
.PHONY: bootstrap-init bootstrap-plan bootstrap-apply

bootstrap-init:
	terraform -chdir=$(TF_BOOTSTRAP) init

bootstrap-plan:
	terraform -chdir=$(TF_BOOTSTRAP) plan

bootstrap-apply:
	terraform -chdir=$(TF_BOOTSTRAP) apply

# ── Docker ─────────────────────────────────────────────────────────────────────
.PHONY: docker-build push-prod push-staging

docker-build:
	docker build -t vigia-backend:$(IMAGE_TAG) ./backend

push-prod:
	AWS_REGION=$(AWS_REGION) ./scripts/push_ecr.sh $(IMAGE_TAG)

push-staging:
	AWS_REGION=$(AWS_REGION) ./scripts/push_ecr.sh $(IMAGE_TAG)

# ── Prod environment ───────────────────────────────────────────────────────────
.PHONY: prod-init prod-plan prod-apply prod-destroy

prod-init:
	terraform -chdir=$(TF_PROD) init

prod-plan:
	terraform -chdir=$(TF_PROD) plan -var="image_tag=$(IMAGE_TAG)"

prod-apply:
	terraform -chdir=$(TF_PROD) apply -var="image_tag=$(IMAGE_TAG)"

prod-destroy:
	@echo "WARNING: This will destroy the production environment."
	@echo "Press Ctrl+C to cancel, or Enter to continue."
	@read _
	terraform -chdir=$(TF_PROD) destroy

# ── Staging environment ────────────────────────────────────────────────────────
.PHONY: staging-init staging-plan staging-apply staging-destroy

staging-init:
	terraform -chdir=$(TF_STAGING) init

staging-plan:
	terraform -chdir=$(TF_STAGING) plan -var="image_tag=$(IMAGE_TAG)"

staging-apply:
	terraform -chdir=$(TF_STAGING) apply -var="image_tag=$(IMAGE_TAG)"

staging-destroy:
	terraform -chdir=$(TF_STAGING) destroy

# ── Secrets (run once after first apply) ───────────────────────────────────────
.PHONY: secrets-init-prod secrets-init-staging

secrets-init-prod:
	AWS_REGION=$(AWS_REGION) ./scripts/init_secrets.sh prod

secrets-init-staging:
	AWS_REGION=$(AWS_REGION) ./scripts/init_secrets.sh staging

# ── Force new ECS deployments (picks up updated secrets / images) ───────────────
.PHONY: redeploy-prod redeploy-staging

redeploy-prod:
	aws ecs update-service \
	  --cluster vigia-prod \
	  --service vigia-prod \
	  --force-new-deployment \
	  --region $(AWS_REGION) \
	  --output table

redeploy-staging:
	aws ecs update-service \
	  --cluster vigia-staging \
	  --service vigia-staging \
	  --force-new-deployment \
	  --region $(AWS_REGION) \
	  --output table

# ── Database migrations ────────────────────────────────────────────────────────
.PHONY: migrate-prod migrate-staging

migrate-prod:
	AWS_REGION=$(AWS_REGION) ./scripts/run_migration.sh prod

migrate-staging:
	@echo "Staging runs migrations automatically on container start — no manual step needed."

# ── Full deploy shortcuts ──────────────────────────────────────────────────────
.PHONY: deploy-staging deploy-prod

deploy-staging: push-staging staging-apply

deploy-prod: push-prod prod-apply migrate-prod

# ── Logs ───────────────────────────────────────────────────────────────────────
.PHONY: logs-prod logs-staging

logs-prod:
	aws logs tail /ecs/vigia-prod --follow --region $(AWS_REGION)

logs-staging:
	aws logs tail /ecs/vigia-staging --follow --region $(AWS_REGION)

# ── Health checks ──────────────────────────────────────────────────────────────
.PHONY: health-prod health-staging

health-prod:
	curl -sf https://api.vigia.net.pe/health | python3 -m json.tool

health-staging:
	curl -sf https://api-staging.vigia.net.pe/health | python3 -m json.tool
