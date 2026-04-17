from django.db import models
from talents_app.models import Talent

# Create your models here.


class Ability(models.Model):

    name_ability = models.TextField()
    description_ability = models.TextField()
    grund_punkte = models.TextField()
    bonus_punkte = models.TextField()
    gesamt_punkte = models.TextField()
    talent = models.ForeignKey(Talent, on_delete=models.CASCADE)


class SpezialAbility(models.Model):

    name_ability = models.TextField()
    description_ability = models.TextField()
    wurd_bedingung = models.TextField()
