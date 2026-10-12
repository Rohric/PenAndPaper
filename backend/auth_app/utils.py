"""Helpers for building the account data the frontend works with."""

from rest_framework.authtoken.models import Token


def user_payload(user):
    """Return the public account data of the given user."""
    return {
        "user_id": user.id,
        "username": user.username,
        "is_game_master": user.is_game_master,
    }


def token_payload(user):
    """Return the account data together with the user's token, creating it if needed."""
    token, _ = Token.objects.get_or_create(user=user)
    return {"token": token.key, **user_payload(user)}
