"""URL configuration for the core project."""

from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/", include("auth_app.api.urls")),
    path("api/", include("character_app.api.urls")),
    path("api/", include("world.world_app.api.urls")),
    path("api/", include("session_app.api.urls")),
    path("api/", include("battle_app.api.urls")),
]

# While developing, Django itself hands out the uploaded pictures.
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
