from django.urls import path
from .views import (
    LoginView, RefreshView, MeView, RegisterView, ForgotPasswordView, ResetPasswordView,
    register_request_code, register_verify_code, ForgotPasswordNoAuthView, ResetPasswordNoAuthView
)

urlpatterns = [
    path("login/",    LoginView.as_view(),    name="auth-login"),
    path("refresh/",  RefreshView.as_view(),  name="auth-refresh"),
    path("me/",       MeView.as_view(),       name="auth-me"),
    path("register/", RegisterView.as_view(), name="auth-register"),

    path("password/forgot/", ForgotPasswordNoAuthView.as_view(), name="password-forgot"),
    path("password/reset/",  ResetPasswordNoAuthView.as_view(),  name="password-reset"),
    path("password/forgot-noauth/", ForgotPasswordNoAuthView.as_view(), name="auth-forgot-noauth"),
    path("password/reset-noauth/",  ResetPasswordNoAuthView.as_view(),  name="auth-reset-noauth"),

    path("register-request-code/", register_request_code),
    path("register-verify-code/", register_verify_code),
]
