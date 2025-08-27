from django.urls import path
from .views import LoginView, RefreshView, MeView, RegisterView, ForgotPasswordView, ResetPasswordView

urlpatterns = [
    path("login/",    LoginView.as_view(),    name="auth-login"),
    path("refresh/",  RefreshView.as_view(),  name="auth-refresh"),
    path("me/",       MeView.as_view(),       name="auth-me"),
    path("register/", RegisterView.as_view(), name="auth-register"),
    path("password/forgot", ForgotPasswordView.as_view(), name="auth-forgot"),
    path("password/reset",  ResetPasswordView.as_view(),  name="auth-reset"),
]
