from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters import rest_framework as filters
from .permissions import IsOwnerOrReadOnly
from .models import Property
from .serializers import PropertySerializer

class PropertyFilter(filters.FilterSet):
    price_min = filters.NumberFilter(field_name="price", lookup_expr="gte")
    price_max = filters.NumberFilter(field_name="price", lookup_expr="lte")
    area_min  = filters.NumberFilter(field_name="area",  lookup_expr="gte")
    area_max  = filters.NumberFilter(field_name="area",  lookup_expr="lte")
    class Meta:
        model = Property
        fields = ["deal_type", "status", "district", "rooms"]

class PropertyViewSet(viewsets.ModelViewSet):
    queryset = Property.objects.all().order_by("-created_at")
    serializer_class = PropertySerializer

    permission_classes = [IsOwnerOrReadOnly]

    filter_backends   = [filters.DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class   = PropertyFilter
    search_fields     = ["title", "description", "address", "district"]
    ordering_fields   = ["created_at", "price", "area", "rooms"]
    ordering          = ["-created_at"]

    def perform_create(self, serializer):
        serializer.save(realtor=self.request.user)
