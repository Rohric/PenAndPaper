"""URL patterns for character endpoints."""

from django.urls import path

from .views import NpcDetail, NpcList

urlpatterns = [
    path("npcs/", NpcList.as_view(), name="npc-list"),
    path("npcs/<int:pk>/", NpcDetail.as_view(), name="npc-detail"),
]
