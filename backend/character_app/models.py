from django.db import models
from django.contrib.auth import get_user_model
from player_profile_app.models import PlayerProfile

User = get_user_model()
# Create your models here.


class CharacterProfile(models.Model):
    name = models.TextField()
    alter = models.TextField()
    beruf = models.TextField()
    geschlecht = models.TextField()
    beschreibung = models.TextField()
    beschreibung = models.TextField()
    lore = models.TextField()
    health_points = models.IntegerField(default=0)
    player = models.ForeignKey(PlayerProfile, on_delete=models.CASCADE)
