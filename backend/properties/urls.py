from rest_framework.routers import DefaultRouter
from .views import PropertyViewSet, FavoriteViewSet  

router = DefaultRouter()
router.register("properties", PropertyViewSet, basename="property")
router.register("favorites", FavoriteViewSet, basename="favorite")
urlpatterns = router.urls
