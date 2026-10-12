"""Permissions for world_app.

The app has no rules of its own yet: it uses IsGameMaster from auth_app and
limits every query to the worlds the requesting game master owns.
"""
