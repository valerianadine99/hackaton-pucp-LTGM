resource "aws_route53_record" "api" {
  zone_id = local.bs.route53_zone_id
  name    = "api.vigia.net.pe"
  type    = "A"

  alias {
    name                   = local.bs.alb_dns_name
    zone_id                = local.bs.alb_zone_id
    evaluate_target_health = true
  }
}
