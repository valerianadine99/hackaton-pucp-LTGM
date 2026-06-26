# Vigia — Infrastructure

Terraform infrastructure for the Vigia backend on AWS.
- **Prod**: `api.vigia.net.pe` — ECS Fargate + RDS PostgreSQL 16
- **Staging**: `api-staging.vigia.net.pe` — ECS Fargate Spot + PostgreSQL sidecar (no RDS, ~$5/month)
- **Frontend**: Vercel (not managed here)

---

## Prerequisites

| Tool | Version | Install |
|---|---|---|
| Terraform | >= 1.10 | https://developer.hashicorp.com/terraform/install |
| AWS CLI | v2 | https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2.html |
| Docker | any | https://docs.docker.com/get-docker/ |
| Git | any | — |

AWS credentials must be configured (`aws configure` or environment variables).  
The IAM user/role needs permissions for: ECS, ECR, RDS, ALB, ACM, Route53, Secrets Manager, CloudWatch, IAM, VPC, S3.

---

## Architecture

```
                          Internet
                             │
                    ┌────────▼────────┐
                    │  Route 53       │
                    │  vigia.net.pe   │
                    └────────┬────────┘
                             │ A alias
                    ┌────────▼────────┐
                    │  ALB (shared)   │  us-east-1
                    │  :80  → HTTPS   │
                    │  :443           │
                    └────┬───────┬────┘
            host-rule    │       │   host-rule
         api.vigia.net.pe│       │api-staging.vigia.net.pe
                         │       │
           ┌─────────────▼─┐   ┌─▼─────────────────┐
           │  ECS Fargate  │   │  ECS Fargate Spot  │
           │  prod cluster │   │  staging cluster   │
           │  0.5vCPU/1GB  │   │  0.5vCPU/1GB       │
           │  2 tasks      │   │  1 task            │
           └──────┬────────┘   └──────┬─────────────┘
                  │                   │
           ┌──────▼────────┐   ┌──────▼──────────────┐
           │  RDS           │   │  postgres:16-alpine  │
           │  db.t3.micro   │   │  sidecar container   │
           │  PostgreSQL 16 │   │  (ephemeral)         │
           │  private subnet│   │  localhost:5432      │
           └────────────────┘   └──────────────────────┘

           *.vigia.net.pe wildcard TLS cert (ACM)
           Secrets Manager: SECRET_KEY, ANTHROPIC_API_KEY, DATABASE_URL (prod)
           ECR: vigia-backend Docker images
           S3: Terraform remote state
```

**No NAT Gateway** — ECS tasks run in public subnets with `assign_public_ip = true`. RDS stays in private subnets, only reachable from inside the VPC.

---

## Directory Structure

```
infrastructure/
├── bootstrap/                  # Shared resources — apply ONCE
│   ├── providers.tf            # AWS provider + S3 backend config (step 2: uncomment)
│   ├── s3_backend.tf           # Terraform state S3 bucket
│   ├── vpc.tf                  # VPC, public/private subnets, IGW
│   ├── alb.tf                  # Shared ALB + HTTP→HTTPS redirect + HTTPS listener
│   ├── acm.tf                  # Wildcard cert *.vigia.net.pe
│   ├── ecr.tf                  # vigia-backend ECR repository
│   ├── route53.tf              # Hosted zone for vigia.net.pe
│   ├── variables.tf
│   └── outputs.tf              # Outputs consumed by environments via remote_state
│
├── modules/
│   ├── app_service/            # ECS + IAM + Secrets Manager + ALB listener rule
│   │   ├── ecs.tf              # Cluster, task definition (with optional pg sidecar), service
│   │   ├── iam.tf              # Execution role + task role + secrets policy
│   │   ├── secrets.tf          # SECRET_KEY and ANTHROPIC_API_KEY in Secrets Manager
│   │   ├── security_group.tf   # ECS task SG (no inline rules)
│   │   ├── alb_rule.tf         # Target group + host-based listener rule
│   │   ├── variables.tf
│   │   └── outputs.tf
│   └── database/               # Used by prod only
│       ├── rds.tf              # RDS instance + random password + DATABASE_URL secret
│       ├── subnet_group.tf
│       ├── security_group.tf
│       ├── variables.tf
│       └── outputs.tf
│
└── environments/
    ├── prod/                   # api.vigia.net.pe
    │   ├── providers.tf        # S3 backend key: prod/terraform.tfstate
    │   ├── main.tf             # Calls app_service + database modules
    │   ├── cloudwatch.tf       # Log group, 30-day retention
    │   ├── route53.tf          # A alias: api.vigia.net.pe → ALB
    │   ├── variables.tf
    │   ├── outputs.tf
    │   └── terraform.tfvars    # ← update state_bucket with your account ID
    └── staging/                # api-staging.vigia.net.pe
        ├── providers.tf        # S3 backend key: staging/terraform.tfstate
        ├── main.tf             # Calls app_service only (postgres sidecar, no RDS)
        ├── cloudwatch.tf       # Log group, 7-day retention
        ├── route53.tf          # A alias: api-staging.vigia.net.pe → ALB
        ├── variables.tf
        ├── outputs.tf
        └── terraform.tfvars    # ← update state_bucket with your account ID
```

---

## Environment Comparison

| | Prod | Staging |
|---|---|---|
| URL | `api.vigia.net.pe` | `api-staging.vigia.net.pe` |
| ECS capacity | FARGATE | FARGATE_SPOT |
| Task size | 0.5 vCPU / 1 GB | 0.5 vCPU / 1 GB |
| Task count | 2 | 1 |
| Database | RDS db.t3.micro (persistent) | postgres:16-alpine sidecar (ephemeral) |
| DB data on restart | Preserved | **Lost** (re-migrates on startup) |
| Backup retention | 7 days | 1 day |
| Deletion protection | Yes | No |
| Log retention | 30 days | 7 days |
| Approx. cost | ~$47/month | ~$5/month |

---

## One-Time Bootstrap

Run this once to create shared AWS resources. You need a clean AWS account (or at least no existing `vigia-*` resources).

### Step 1 — Get your AWS Account ID

```bash
aws sts get-caller-identity --query Account --output text
# e.g. 123456789012
```

### Step 2 — Update tfvars with your Account ID

Edit both files and replace `REPLACE_WITH_ACCOUNT_ID`:

```bash
# infrastructure/environments/prod/terraform.tfvars
# infrastructure/environments/staging/terraform.tfvars
state_bucket = "vigia-terraform-state-123456789012"
```

Also update `infrastructure/bootstrap/providers.tf` — the commented-out backend block has the same placeholder.

### Step 3 — Create the S3 state bucket (bootstrap of bootstrap)

The S3 bucket must exist before it can store state, so we create it with local state first:

```bash
cd infrastructure/bootstrap
terraform init
terraform apply \
  -target=aws_s3_bucket.terraform_state \
  -target=aws_s3_bucket_versioning.terraform_state \
  -target=aws_s3_bucket_server_side_encryption_configuration.terraform_state \
  -target=aws_s3_bucket_public_access_block.terraform_state
```

### Step 4 — Migrate bootstrap state to S3

Uncomment the `backend "s3"` block in `infrastructure/bootstrap/providers.tf` (update the bucket name), then:

```bash
terraform init -migrate-state
# Answer "yes" when prompted to copy state to S3
```

### Step 5 — Apply remaining bootstrap resources

```bash
terraform apply
# Creates: VPC, subnets, IGW, ALB, ACM cert, ECR repo, Route53 zone
```

### Step 6 — Delegate DNS at punto.pe

Terraform will output the 4 Route53 NS records:

```bash
terraform output route53_name_servers
```

Log in to your punto.pe registrar panel for `vigia.net.pe` and replace the existing nameservers with these 4 values. DNS propagation takes 5–30 minutes. The ACM certificate validates automatically once DNS is delegated.

Verify delegation:
```bash
dig NS vigia.net.pe +short
# Should show the 4 ns-*.awsdns-*.* nameservers
```

---

## First Deploy

After bootstrap and DNS delegation:

### Staging

```bash
# 1. Initialize Terraform for staging
cd infrastructure/environments/staging
terraform init
cd ../../..

# 2. Build and push Docker image
./scripts/build.sh staging

# 3. Deploy (terraform apply + ECS redeploy)
./scripts/deploy.sh staging

# 4. Populate secrets (one-time, run after first deploy)
./scripts/init_secrets.sh staging
# Enter SECRET_KEY and ANTHROPIC_API_KEY when prompted

# 5. Redeploy to pick up secrets
./scripts/deploy.sh staging
```

### Prod

```bash
# 1. Initialize Terraform for prod
cd infrastructure/environments/prod
terraform init
cd ../../..

# 2. Build and push Docker image (can reuse staging image or build separately)
./scripts/build.sh prod

# 3. Deploy (terraform apply + ECS redeploy + migrations)
./scripts/deploy.sh prod
# You will be prompted to confirm before applying to prod

# 4. Populate secrets (one-time)
./scripts/init_secrets.sh prod
# Enter SECRET_KEY and ANTHROPIC_API_KEY when prompted

# 5. Redeploy to pick up secrets + run migrations
./scripts/deploy.sh prod
```

---

## Day-to-Day Workflows

### Build a new image

```bash
# Build for staging (tags: <git-sha> and staging-latest)
./scripts/build.sh staging

# Build for prod (tags: <git-sha> and prod-latest)
./scripts/build.sh prod

# Build with explicit tag
./scripts/build.sh prod v1.2.3
```

### Deploy

```bash
# Deploy staging (uses staging-latest by default)
./scripts/deploy.sh staging

# Deploy prod (uses prod-latest, shows confirmation prompt)
./scripts/deploy.sh prod

# Deploy prod with explicit tag
./scripts/deploy.sh prod v1.2.3
```

### Build + deploy in one go

```bash
./scripts/build.sh staging && ./scripts/deploy.sh staging
./scripts/build.sh prod    && ./scripts/deploy.sh prod
```

### Makefile targets (alternative)

```bash
make deploy-staging          # push-staging + staging-apply
make deploy-prod             # push-prod + prod-apply + migrate-prod
make logs-staging            # tail CloudWatch logs
make logs-prod
make health-staging          # curl the /health endpoint
make health-prod
```

---

## Updating Secrets

To rotate `SECRET_KEY` or `ANTHROPIC_API_KEY`:

```bash
# Update one or both secrets
./scripts/init_secrets.sh staging   # or prod

# Force new ECS deployment to pick up new values
aws ecs update-service \
  --cluster vigia-staging \
  --service vigia-staging \
  --force-new-deployment \
  --region us-east-1
```

`DATABASE_URL` is managed automatically by Terraform (generated from the RDS password). It updates when you run `terraform apply`.

---

## Troubleshooting

### ECS task keeps stopping

Check the stopped reason:
```bash
aws ecs describe-tasks \
  --cluster vigia-staging \
  --tasks $(aws ecs list-tasks --cluster vigia-staging --query 'taskArns[0]' --output text) \
  --query 'tasks[0].containers[0].{reason:reason,exitCode:exitCode}' \
  --output table
```

### View live logs

```bash
make logs-staging
make logs-prod
# or directly:
aws logs tail /ecs/vigia-staging --follow
aws logs tail /ecs/vigia-prod    --follow
```

### Secrets not injected (container exits with 1)

Check that `init_secrets.sh` was run and the secret value is not the placeholder:
```bash
aws secretsmanager get-secret-value \
  --secret-id vigia/staging/SECRET_KEY \
  --query SecretString \
  --output text
# Should NOT start with "PLACEHOLDER_"
```

### ACM cert not validating

The cert validates via DNS. If the Route53 NS records are not yet active at punto.pe, validation hangs. Check delegation:
```bash
dig NS vigia.net.pe +short
```

### Terraform plan shows unexpected changes

Pull latest state before planning:
```bash
terraform -chdir=infrastructure/environments/staging init -reconfigure
terraform -chdir=infrastructure/environments/staging plan
```
