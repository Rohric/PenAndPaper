from django.apps import AppConfig


class WorldAppConfig(AppConfig):
    """Configure the app that holds a world and everything written in it."""

    # The app lives inside the "world" folder, so its import path has two parts.
    name = "world.world_app"
