from django.db import models
from character_app.models import CharacterProfile

# Create your models here.


class Talent(models.Model):
    ROLE_CHOICES = (
        ('WISSEN', 'wissen'),
        ('SOZIAL', 'sozial'),
        ('HANDELN', 'handeln'),
    )

    grund_punkte = models.TextField()
    bonus_punkte = models.TextField()
    gesamt_punkte = models.TextField()
    geistesblitz_punkte = models.TextField()
    character = models.ForeignKey(CharacterProfile, on_delete=models.CASCADE)
