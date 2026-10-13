"""Admin registration for the battle models."""

from django.contrib import admin

from .models import Battle, Combatant

admin.site.register([Battle, Combatant])
