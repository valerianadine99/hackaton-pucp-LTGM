from django.db import models

from .district import RiskLevel


class ChecklistItem(models.Model):
    level = models.CharField(max_length=20, choices=RiskLevel.choices, db_index=True)
    order = models.PositiveSmallIntegerField()
    text = models.TextField()

    class Meta:
        db_table = "checklist_items"
        ordering = ["level", "order"]
        unique_together = [("level", "order")]

    def __str__(self):
        return f"[{self.level}] {self.order}. {self.text[:50]}"
