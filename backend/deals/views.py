from django.shortcuts import render

# Create your views here.
from rest_framework import viewsets, permissions
from django_filters import rest_framework as filters
from .models import Deal
from .serializers import DealSerializer

class DealFilter(filters.FilterSet):
    price_min = filters.NumberFilter(field_name="price", lookup_expr="gte")
    price_max = filters.NumberFilter(field_name="price", lookup_expr="lte")
    created_from = filters.DateFilter(field_name="created_at", lookup_expr="date__gte")
    created_to   = filters.DateFilter(field_name="created_at", lookup_expr="date__lte")

    class Meta:
        model = Deal
        fields = ["stage","property","created_by","assigned_to"]

class DealViewSet(viewsets.ModelViewSet):
    serializer_class = DealSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_class = DealFilter
    search_fields = ["client_name","client_phone","comment","property__title"]
    ordering_fields = ["created_at","price","commission"]

    def get_queryset(self):
        u = self.request.user
        role = getattr(u, "role", None)
        qs = Deal.objects.select_related("property","created_by","assigned_to")
        if role in ("admin","manager"):
            return qs
        # realtor — только свои
        return qs.filter(models.Q(created_by=u) | models.Q(assigned_to=u)).distinct()

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
