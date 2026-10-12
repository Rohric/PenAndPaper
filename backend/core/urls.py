"""URL configuration for the core project."""

from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/", include("auth_app.api.urls")),
    path("api/", include("character_app.api.urls")),
    path("api/", include("world.world_app.api.urls")),
]
