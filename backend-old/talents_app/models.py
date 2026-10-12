from django.db import models
from character_app.models import CharacterProfile

# Create your models here.


class Talent(models.Model):
    TALENT_CHOICES = (
        ('WISSEN', 'wissen'),
        ('SOZIAL', 'sozial'),
        ('HANDELN', 'handeln'),
    )

    name = models.CharField(
        max_length=20, choices=TALENT_CHOICES, default='WISSEN')
    grund_punkte = models.IntegerField(default=0)
    bonus_punkte = models.IntegerField(default=0)
    geistesblitz_punkte = models.IntegerField(default=0)
    character = models.ForeignKey(CharacterProfile, on_delete=models.CASCADE)

    @property
    def gesamt_punkte(self):
        return self.grund_punkte + self.bonus_punkte
