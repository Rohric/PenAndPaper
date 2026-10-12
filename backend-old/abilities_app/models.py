from django.db import models
from talents_app.models import Talent
from django.core.exceptions import ValidationError

# Create your models here.


class Ability(models.Model):

    name_ability = models.TextField()
    description_ability = models.TextField()
    grund_punkte = models.IntegerField(default=0)
    max_grund_punkte = models.IntegerField(default=10)  # Cap für Grundpunkte
    bonus_punkte = models.IntegerField(default=0)
    max_bonus_punkte = models.IntegerField(default=10)  # Cap für Bonuspunkte
    talent = models.ForeignKey(Talent, on_delete=models.CASCADE)

    @property
    def gesamt_punkte(self):
        return self.grund_punkte + self.bonus_punkte

    def clean(self):
        # Validierung: Prüfen, ob die Punkte das jeweilige Cap überschreiten
        if self.grund_punkte > self.max_grund_punkte:
            raise ValidationError(
                {'grund_punkte': f'Grundpunkte dürfen das Maximum von {self.max_grund_punkte} nicht überschreiten.'})
        if self.bonus_punkte > self.max_bonus_punkte:
            raise ValidationError(
                {'bonus_punkte': f'Bonuspunkte dürfen das Maximum von {self.max_bonus_punkte} nicht überschreiten.'})


class SpezialAbility(models.Model):

    name_ability = models.TextField()
    description_ability = models.TextField()
    wurf_bedingung = models.TextField()
