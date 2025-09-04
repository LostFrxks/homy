from rest_framework.routers import DefaultRouter
from .views import ShowingViewSet

router = DefaultRouter()
router.register('', ShowingViewSet, basename='showing')
urlpatterns = router.urls
