from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from datetime import timedelta

from .models import Showing
from .serializers import ShowingSerializer

class ShowingViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = ShowingSerializer
    queryset = Showing.objects.all().select_related('property','agent')

    def get_queryset(self):
        qs = super().get_queryset().filter(agent=self.request.user)
        date_from = self.request.query_params.get('from')
        date_to = self.request.query_params.get('to')
        if date_from and date_to:
            qs = qs.filter(starts_at__date__range=[date_from, date_to])
        else:
            # по умолчанию ближайшие 14 дней
            today = timezone.localdate()
            qs = qs.filter(starts_at__date__range=[today, today + timedelta(days=14)])
        return qs

    def perform_create(self, serializer):
        serializer.save(agent=self.request.user)
