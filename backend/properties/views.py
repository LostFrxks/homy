from django.db.models import Prefetch
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters import rest_framework as filters
from .permissions import IsOwnerOrReadOnly
from django.shortcuts import get_object_or_404
from .models import Property, PropertyImage
from .serializers import PropertySerializer, PropertyImageSerializer

class PropertyFilter(filters.FilterSet):
    price_min = filters.NumberFilter(field_name="price", lookup_expr="gte")
    price_max = filters.NumberFilter(field_name="price", lookup_expr="lte")
    area_min  = filters.NumberFilter(field_name="area",  lookup_expr="gte")
    area_max  = filters.NumberFilter(field_name="area",  lookup_expr="lte")
    class Meta:
        model = Property
        fields = ["deal_type", "status", "district", "rooms"]

class PropertyViewSet(viewsets.ModelViewSet):
    queryset = (
        Property.objects.all()
        .select_related("realtor")
        .prefetch_related(Prefetch("images", queryset=PropertyImage.objects.order_by("-created_at")))
        .order_by("-created_at")
    )

    serializer_class = PropertySerializer
    permission_classes = [IsOwnerOrReadOnly]

    filter_backends   = [filters.DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class   = PropertyFilter
    search_fields     = ["title", "description", "address", "district"]
    ordering_fields   = ["created_at", "price", "area", "rooms"]
    ordering          = ["-created_at"]

    def perform_create(self, serializer):
        serializer.save(realtor=self.request.user)

    @action(detail=True, methods=["get"], url_path="images")
    def list_images(self, request, pk=None):
        """Список изображений объекта."""
        prop = self.get_object()
        imgs = prop.images.all().order_by("-created_at")
        return Response(PropertyImageSerializer(imgs, many=True, context={"request": request}).data)

    @action(detail=True, methods=["post"], url_path="images", permission_classes=[IsAuthenticated, IsOwnerOrReadOnly])
    def upload_images(self, request, pk=None):
        """Загрузка одного или нескольких изображений (multipart/form-data). Поле: image или images."""
        prop = self.get_object()
        if prop.realtor != request.user:
            return Response({"detail": "You are not the owner."}, status=status.HTTP_403_FORBIDDEN)

        files = request.FILES.getlist("images") or request.FILES.getlist("image")
        if not files:
            return Response({"detail": "No files provided. Use 'images' or 'image' fields."}, status=status.HTTP_400_BAD_REQUEST)

        # простая валидация
        for f in files:
            if f.content_type not in ["image/jpeg", "image/png", "image/webp"]:
                return Response({"detail": "Only jpeg/png/webp allowed."}, status=status.HTTP_400_BAD_REQUEST)
            if f.size > 10 * 1024 * 1024:  # 10 MB
                return Response({"detail": "Max file size is 10MB."}, status=status.HTTP_400_BAD_REQUEST)

        created = [PropertyImage.objects.create(property=prop, image=f) for f in files]
        data = PropertyImageSerializer(created, many=True, context={"request": request}).data
        return Response(data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["delete"], url_path=r"images/(?P<image_id>\d+)", permission_classes=[IsAuthenticated, IsOwnerOrReadOnly])
    def delete_image(self, request, pk=None, image_id=None):
        """Удаление конкретного изображения по id (только владелец)."""
        prop = self.get_object()
        if prop.realtor != request.user:
            return Response({"detail": "You are not the owner."}, status=status.HTTP_403_FORBIDDEN)

        img = get_object_or_404(PropertyImage, id=image_id, property=prop)
        img.delete()  # файл удалится благодаря переопределённому delete() в модели
        return Response(status=status.HTTP_204_NO_CONTENT)
    
    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx["request"] = self.request
        return ctx