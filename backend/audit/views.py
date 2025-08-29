# audit/views.py
from rest_framework.viewsets import ReadOnlyModelViewSet
from rest_framework.permissions import IsAdminUser
from .models import AuditLog
from .serializers import AuditLogSerializer

class AuditLogViewSet(ReadOnlyModelViewSet):
    queryset = AuditLog.objects.all()
    serializer_class = AuditLogSerializer
    permission_classes = [IsAdminUser]
