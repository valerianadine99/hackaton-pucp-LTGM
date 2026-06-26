terraform {
  required_version = "~> 1.10"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # STEP 2: Uncomment after first targeted apply creates the S3 bucket.
  # Then run: terraform init -migrate-state
  #
  # backend "s3" {
  #   bucket       = "vigia-terraform-state-<YOUR_ACCOUNT_ID>"
  #   key          = "bootstrap/terraform.tfstate"
  #   region       = "us-east-1"
  #   use_lockfile = true
  # }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project   = "vigia"
      ManagedBy = "terraform"
      Component = "bootstrap"
    }
  }
}
