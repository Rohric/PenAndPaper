from django.db import models
from django.contrib.auth.models import User


class PlayerProfile(models.Model):
    ROLE_CHOICES = (
        ('HERO', 'Game Hero'),
        ('MASTER', 'Game Master'),
    )

    # Geändert zu ForeignKey: Ein User kann jetzt MEHRERE Profile haben (z.B. 1x Hero, 1x Master)
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='player_profiles')

    # Die Rolle in der App (Standardmäßig erstmal Player)
    role = models.CharField(
        max_length=10, choices=ROLE_CHOICES, default='HERO')

    @property
    def play_name(self):
        return f"{self.user.first_name} {self.user.last_name}".strip()

    def __str__(self):
        return f"{self.play_name} ({self.get_role_display()})"
