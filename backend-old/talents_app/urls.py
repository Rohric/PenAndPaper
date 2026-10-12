from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TalentViewSet

router = DefaultRouter()
router.register(r'talents', TalentViewSet, basename='talent')

urlpatterns = [
    path('', include(router.urls)),
]
