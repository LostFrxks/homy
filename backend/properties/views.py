from django.shortcuts import render

# Create your views here.
from rest_framework import viewsets, permissions
from django_filters import rest_framework as filters
from .models import Property
from .serializers import PropertySerializer

class PropertyFilter(filters.FilterSet):
    price_min = filters.NumberFilter(field_name="price", lookup_expr="gte")
    price_max = filters.NumberFilter(field_name="price", lookup_expr="lte")
    area_min = filters.NumberFilter(field_name="area", lookup_expr="gte")
    area_max = filters.NumberFilter(field_name="area", lookup_expr="lte")

    class Meta:
        model = Property
        fields = ["deal_type", "status", "district", "rooms"]

class PropertyViewSet(viewsets.ModelViewSet):
    queryset = Property.objects.all()
    serializer_class = PropertySerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_class = PropertyFilter
    search_fields = ["title", "description", "address", "district"]
    ordering_fields = ["created_at", "price", "area", "rooms"]

    def perform_create(self, serializer):
        # по умолчанию ставим текущего юзера как риелтора
        serializer.save(realtor=self.request.user)
