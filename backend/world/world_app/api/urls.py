"""URL patterns for world endpoints.

Lists live under their world (or chapter), single entries have a flat address.
"""

from django.urls import path

from . import views

urlpatterns = [
    path("worlds/", views.WorldList.as_view(), name="world-list"),
    path("worlds/<int:pk>/", views.WorldDetail.as_view(), name="world-detail"),
    path("worlds/<int:world_id>/locations/", views.LocationList.as_view(), name="location-list"),
    path("locations/<int:pk>/", views.LocationDetail.as_view(), name="location-detail"),
    path("worlds/<int:world_id>/world-npcs/", views.WorldNpcList.as_view(), name="world-npc-list"),
    path("world-npcs/<int:pk>/", views.WorldNpcDetail.as_view(), name="world-npc-detail"),
    path("worlds/<int:world_id>/quests/", views.QuestList.as_view(), name="quest-list"),
    path("quests/<int:pk>/", views.QuestDetail.as_view(), name="quest-detail"),
    path("worlds/<int:world_id>/events/", views.EventList.as_view(), name="event-list"),
    path("events/<int:pk>/", views.EventDetail.as_view(), name="event-detail"),
    path("worlds/<int:world_id>/trivia/", views.TriviaList.as_view(), name="trivia-list"),
    path("trivia/<int:pk>/", views.TriviaDetail.as_view(), name="trivia-detail"),
    path("worlds/<int:world_id>/chapters/", views.ChapterList.as_view(), name="chapter-list"),
    path("chapters/<int:pk>/", views.ChapterDetail.as_view(), name="chapter-detail"),
    path("worlds/<int:world_id>/scenes/", views.WorldSceneList.as_view(), name="world-scene-list"),
    path("chapters/<int:chapter_id>/scenes/", views.SceneList.as_view(), name="scene-list"),
    path("scenes/<int:pk>/", views.SceneDetail.as_view(), name="scene-detail"),
    path("locations/<int:pk>/pictures/", views.LocationPictureList.as_view(), name="location-picture-list"),
    path("trivia/<int:pk>/pictures/", views.TriviaPictureList.as_view(), name="trivia-picture-list"),
    path("pictures/<int:pk>/", views.PictureDetail.as_view(), name="picture-detail"),
]
