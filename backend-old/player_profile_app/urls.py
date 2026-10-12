from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PlayerProfileViewSet

router = DefaultRouter()
router.register(r'profiles', PlayerProfileViewSet, basename='profile')

urlpatterns = [
    path('', include(router.urls)),
]
