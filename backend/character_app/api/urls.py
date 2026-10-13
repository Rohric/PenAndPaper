"""URL patterns for character endpoints."""

from django.urls import path

from . import views

urlpatterns = [
    path("npcs/", views.NpcList.as_view(), name="npc-list"),
    path("npcs/<int:pk>/", views.NpcDetail.as_view(), name="npc-detail"),
    path("player-characters/", views.PlayerCharacterList.as_view(), name="player-character-list"),
    path("player-characters/<int:pk>/", views.PlayerCharacterDetail.as_view(), name="player-character-detail"),
    path("gm/player-characters/", views.GmPlayerCharacterList.as_view(), name="gm-player-character-list"),
    path("gm/player-characters/<int:pk>/", views.GmPlayerCharacterDetail.as_view(), name="gm-player-character-detail"),
]
