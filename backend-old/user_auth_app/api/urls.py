from django.urls import path
from .views import RegistrationView, LoginView, LogoutView, UserListView

urlpatterns = [
    path('users/', UserListView.as_view()),
    path('registration/', RegistrationView.as_view(),
         name='registration'),
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout')
]
