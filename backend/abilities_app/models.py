from django.db import models
from talents_app.models import Talent

# Create your models here.


class Ability(models.Model):

    name_ability = models.TextField()
    description_ability = models.TextField()
    grund_punkte = models.IntegerField(default=0)
    bonus_punkte = models.IntegerField(default=0)
    talent = models.ForeignKey(Talent, on_delete=models.CASCADE)

    @property
    def gesamt_punkte(self):
        return self.grund_punkte + self.bonus_punkte


class SpezialAbility(models.Model):

    name_ability = models.TextField()
    description_ability = models.TextField()
    wurf_bedingung = models.TextField()
