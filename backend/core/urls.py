"""
URL configuration for core project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from users.views import LoginView, RefreshView, MeView
from properties.views import PropertyViewSet
from deals.views import DealViewSet
router = DefaultRouter()
router.register(r"properties", PropertyViewSet, basename="property")
router.register(r"deals", DealViewSet, basename="deal")

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/v1/auth/login",   LoginView.as_view(), name="login"),
    path("api/v1/auth/refresh", RefreshView.as_view(), name="token_refresh"),
    path("api/v1/properties/", include("properties.urls")),
    path("api/v1/auth/me",      MeView.as_view(), name="me"),
    path("api/v1/", include(router.urls)),
    path("api/v1/auth/", include("users.urls")),
]