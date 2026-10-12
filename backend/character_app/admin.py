"""Admin registration for characters."""

from django.contrib import admin

from .models import Npc


@admin.register(Npc)
class NpcAdmin(admin.ModelAdmin):
    """Show NPCs with their owner."""

    list_display = ["name", "profession", "owner"]
    search_fields = ["name"]
