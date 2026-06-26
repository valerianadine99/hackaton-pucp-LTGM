from django.db import models


class AlertLevel(models.TextChoices):
    INACTIVE = "inactive", "No Activo"
    WATCH = "watch", "Vigilancia de El Niño Costero"
    ALERT = "alert", "Alerta de El Niño Costero"


class EnfenSummary(models.Model):
    alert_level = models.CharField(
        max_length=20,
        choices=AlertLevel.choices,
        default=AlertLevel.INACTIVE,
    )
    raw_text = models.TextField(default="")
    summary = models.TextField()
    date = models.DateField(db_index=True)
    bulletin_number = models.CharField(max_length=20, default="")
    source_url = models.URLField(default="")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "enfen_summaries"
        ordering = ["-date"]

    def __str__(self):
        return f"EnfenSummary({self.alert_level}, {self.date})"
