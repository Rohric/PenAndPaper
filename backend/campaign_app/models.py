from django.db import models
from character_app.models import CharacterProfile

# Create your models here.


class Campaign(models.Model):

    name_campaign = models.TextField()
    description_campaign = models.TextField()
    characters = models.ForeignKey(CharacterProfile)
