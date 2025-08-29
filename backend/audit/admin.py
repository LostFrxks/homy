from django.contrib import admin
from .models import AuditLog

@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ("created_at", "action", "model", "object_id", "user", "ip", "method")
    list_filter = ("action", "model")
    search_fields = ("object_id", "path", "message")
