from rest_framework.routers import DefaultRouter
from .views import PropertyViewSet, FavoriteViewSet, SavedSearchViewSet

router = DefaultRouter()
router.register("properties", PropertyViewSet, basename="property")
router.register("favorites", FavoriteViewSet, basename="favorite")
router.register('saved-searches', SavedSearchViewSet, basename='saved-search')
urlpatterns = router.urls
