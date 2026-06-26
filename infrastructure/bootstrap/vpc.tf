locals {
  azs = ["${var.aws_region}a", "${var.aws_region}b"]

  public_subnets = {
    "${var.aws_region}a" = "10.0.1.0/24"
    "${var.aws_region}b" = "10.0.2.0/24"
  }

  private_subnets = {
    "${var.aws_region}a" = "10.0.101.0/24"
    "${var.aws_region}b" = "10.0.102.0/24"
  }
}

resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = { Name = "vigia-vpc" }
}

resource "aws_subnet" "public" {
  for_each = local.public_subnets

  vpc_id            = aws_vpc.main.id
  availability_zone = each.key
  cidr_block        = each.value

  # ECS tasks use assign_public_ip on the service level; subnet default stays false
  map_public_ip_on_launch = false

  tags = { Name = "vigia-public-${each.key}" }
}

resource "aws_subnet" "private" {
  for_each = local.private_subnets

  vpc_id            = aws_vpc.main.id
  availability_zone = each.key
  cidr_block        = each.value

  tags = { Name = "vigia-private-${each.key}" }
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = { Name = "vigia-igw" }
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = { Name = "vigia-public-rt" }
}

resource "aws_route_table_association" "public" {
  for_each = aws_subnet.public

  subnet_id      = each.value.id
  route_table_id = aws_route_table.public.id
}
