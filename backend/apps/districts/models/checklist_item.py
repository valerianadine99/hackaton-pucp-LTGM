from django.db import models

from .district import RiskLevel


class ChecklistItem(models.Model):
    level = models.CharField(max_length=20, choices=RiskLevel.choices, db_index=True)
    order = models.PositiveSmallIntegerField()
    # User-facing content stays in Spanish (the citizen reads it); field names in English.
    emoji = models.CharField(max_length=8, default="")
    title = models.CharField(max_length=200, default="")
    detail = models.TextField(default="")

    class Meta:
        db_table = "checklist_items"
        ordering = ["level", "order"]
        unique_together = [("level", "order")]

    def __str__(self):
        return f"[{self.level}] {self.order}. {self.title}"
