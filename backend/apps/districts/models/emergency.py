from django.db import models


class Emergency(models.Model):
    sinpad_id = models.IntegerField(unique=True, null=True, blank=True, db_index=True)
    date = models.DateField(null=True, blank=True, db_index=True)
    year = models.PositiveSmallIntegerField(db_index=True)
    district = models.ForeignKey(
        "District", on_delete=models.CASCADE, related_name="emergencies"
    )
    phenomenon = models.CharField(max_length=200)
    displaced = models.IntegerField(default=0)       # DAMNIFICADOS
    affected = models.IntegerField(default=0)        # AFECTADOS
    victims = models.IntegerField(default=0)         # FALLECIDOS
    destroyed_homes = models.IntegerField(default=0) # VIVIENDAS DESTRUIDAS
    damaged_homes = models.IntegerField(default=0)   # VIVIENDAS AFECTADAS

    class Meta:
        db_table = "emergencies"
        ordering = ["-year", "-date"]

    def __str__(self):
        return f"Emergency({self.sinpad_id}, {self.year}, {self.phenomenon})"
