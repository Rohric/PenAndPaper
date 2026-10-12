from django.db import models
from character_app.models import CharacterProfile

# Create your models here.


class Campaign(models.Model):
    name_campaign = models.CharField(max_length=200)
    description_campaign = models.TextField()

    # Der Game Master leitet die Runde (darf auch gelöscht werden, ohne dass die Kampagne verschwindet -> SET_NULL)
    game_master = models.ForeignKey(
        'player_profile_app.PlayerProfile', on_delete=models.SET_NULL, null=True)

    # ManyToManyField löscht niemals die Charaktere, wenn die Kampagne gelöscht wird!
    characters = models.ManyToManyField(
        CharacterProfile, related_name='campaigns')
