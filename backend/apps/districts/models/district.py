from django.db import models


class RiskLevel(models.TextChoices):
    NO_RECORD = "no_record", "No Record"
    LOW = "low", "Low"
    MEDIUM = "medium", "Medium"
    HIGH = "high", "High"


class District(models.Model):
    ubigeo_code = models.CharField(max_length=10, primary_key=True)
    name = models.CharField(max_length=200)
    department = models.CharField(max_length=100, default="", db_index=True)
    count = models.IntegerField(default=0, db_index=True)
    level = models.CharField(
        max_length=20,
        choices=RiskLevel.choices,
        default=RiskLevel.NO_RECORD,
        db_index=True,
    )
    years = models.JSONField(default=list)
    geom = models.JSONField(null=True, blank=True)

    class Meta:
        db_table = "districts"
        ordering = ["name"]

    def __str__(self):
        return f"{self.name} ({self.ubigeo_code})"
