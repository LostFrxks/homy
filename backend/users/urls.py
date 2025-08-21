# users/urls.py
from django.urls import path
from .views import LoginView, RefreshView, MeView, RegisterView

urlpatterns = [
    path("login", LoginView.as_view(), name="auth-login"),
    path("refresh", RefreshView.as_view(), name="auth-refresh"),
    path("me", MeView.as_view(), name="auth-me"),
    path("register", RegisterView.as_view(), name="auth-register"),
]
