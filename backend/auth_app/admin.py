"""Admin registration for the custom user model."""

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import User


@admin.register(User)
class AccountAdmin(UserAdmin):
    """Show accounts with the game master switch."""

    list_display = ["username", "is_game_master", "is_staff", "date_joined"]
    list_filter = ["is_game_master", "is_staff"]
    fieldsets = UserAdmin.fieldsets + (("Spielleiter", {"fields": ["is_game_master"]}),)
