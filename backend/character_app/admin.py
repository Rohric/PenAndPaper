"""Admin registration for characters."""

from django.contrib import admin

from .models import Npc, PlayerCharacter


@admin.register(Npc, PlayerCharacter)
class CharacterAdmin(admin.ModelAdmin):
    """Show NPCs and player characters with their owner."""

    list_display = ["name", "profession", "category", "owner"]
    search_fields = ["name"]
