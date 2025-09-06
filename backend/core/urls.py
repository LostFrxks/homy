# core/urls.py
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter

from properties.views import PropertyViewSet
from deals.views import DealViewSet
from audit.views import AuditLogViewSet  # read-only, admin only
from properties.views import PropertyViewSet, FavoriteViewSet,SavedSearchViewSet  # <— добавь классы


router = DefaultRouter()
router.register(r"properties", PropertyViewSet, basename="property")
router.register(r"deals", DealViewSet, basename="deal")
router.register(r"audit", AuditLogViewSet, basename="audit")  # /api/v1/audit/ (GET list/retrieve), IsAdminUser
router.register(r"favorites", FavoriteViewSet, basename="favorite")   
router.register(r"saved-searches", SavedSearchViewSet, basename="saved-search")          # <— добавь

urlpatterns = [
    path("admin/", admin.site.urls),

    # Весь auth — через users/urls (логин, рефреш, me, register, forgot/reset)
    # итого: /api/v1/auth/login/, /api/v1/auth/refresh/, /api/v1/auth/me/, ...
    path("api/v1/auth/", include("users.urls")),

    # Все viewsets — через единый router
    path("api/v1/", include(router.urls)),
    path('api/v1/showings/', include('showings.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
