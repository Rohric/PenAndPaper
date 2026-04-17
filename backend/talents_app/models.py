from django.db import models
from character_app.models import CharacterProfile

# Create your models here.


class Talent(models.Model):
    ROLE_CHOICES = (
        ('WISSEN', 'wissen'),
        ('SOZIAL', 'sozial'),
        ('HANDELN', 'handeln'),
    )

    grund_punkte = models.IntegerField(default=0)
    bonus_punkte = models.IntegerField(default=0)
    gesamt_punkte = models.IntegerField(default=0)
    geistesblitz_punkte = models.IntegerField(default=0)
    character = models.ForeignKey(CharacterProfile, on_delete=models.CASCADE)
