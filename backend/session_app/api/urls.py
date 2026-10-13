"""URL patterns for session endpoints."""

from django.urls import path

from . import views

urlpatterns = [
    path("sessions/", views.SessionList.as_view(), name="session-list"),
    path("sessions/<int:pk>/", views.SessionDetail.as_view(), name="session-detail"),
    path("my-sessions/", views.MySessionList.as_view(), name="my-session-list"),
    path("sessions/<int:session_id>/entries/", views.SessionEntryList.as_view(), name="session-entry-list"),
    path(
        "sessions/<int:session_id>/entries/<str:kind>/<int:entry_id>/",
        views.SessionEntryDetail.as_view(),
        name="session-entry-detail",
    ),
    path("sessions/<int:session_id>/quest-log/<int:quest_id>/", views.QuestLog.as_view(), name="quest-log"),
    path("sessions/<int:session_id>/level/", views.SessionLevel.as_view(), name="session-level"),
    path("sessions/<int:session_id>/items/", views.SessionItems.as_view(), name="session-items"),
    path("sessions/<int:session_id>/player-view/", views.PlayerView.as_view(), name="session-player-view"),
    path("sessions/<int:session_id>/notes/", views.NoteList.as_view(), name="note-list"),
    path("notes/<int:pk>/", views.NoteDetail.as_view(), name="note-detail"),
    path("notes/<int:note_id>/comments/", views.CommentList.as_view(), name="comment-list"),
    path("sessions/<int:session_id>/messages/", views.MessageList.as_view(), name="message-list"),
    path("sessions/<int:session_id>/messages/read/", views.MessagesRead.as_view(), name="messages-read"),
    path("sessions/<int:session_id>/rolls/", views.RollList.as_view(), name="roll-list"),
]
