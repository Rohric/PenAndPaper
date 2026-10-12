"""Custom user model: accounts log in with a username and a password only."""

from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """Store an account; every account starts as a player."""

    # Only an admin switches this on (admin panel). It unlocks the game master menu.
    is_game_master = models.BooleanField(default=False)
