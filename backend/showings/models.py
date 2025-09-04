from django.conf import settings
from django.db import models
from django.utils import timezone
from datetime import timedelta
import os

SLOT_MINUTES = int(os.getenv('SHOWING_SLOT_MINUTES', '60'))

class Showing(models.Model):
    property = models.ForeignKey('properties.Property', on_delete=models.PROTECT, related_name='showings')
    agent = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='showings')
    client_name = models.CharField(max_length=255)
    client_phone = models.CharField(max_length=50)
    starts_at = models.DateTimeField()
    status = models.CharField(
        max_length=12,
        choices=[('planned','Запланирован'),('done','Проведен'),('canceled','Отменен')],
        default='planned'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [models.Index(fields=['agent', 'starts_at'])]
        ordering = ['starts_at']

    def overlaps(self) -> bool:
        # простой слот вокруг starts_at
        start = self.starts_at - timedelta(minutes=SLOT_MINUTES-1)
        end = self.starts_at + timedelta(minutes=SLOT_MINUTES-1)
        qs = Showing.objects.filter(agent=self.agent, status='planned', starts_at__range=(start, end))
        if self.pk:
            qs = qs.exclude(pk=self.pk)
        return qs.exists()
