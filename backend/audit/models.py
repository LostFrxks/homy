# audit/models.py
from django.db import models
from django.conf import settings

class AuditLog(models.Model):
    # что случилось
    action = models.CharField(max_length=50)  # created / updated / deleted / image_uploaded / image_deleted
    model = models.CharField(max_length=100)  # "properties.Property", "properties.PropertyImage"
    object_id = models.CharField(max_length=64)

    # кто сделал
    user = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL)
    ip = models.GenericIPAddressField(null=True, blank=True)
    method = models.CharField(max_length=10, blank=True)   # POST/PATCH/DELETE
    path = models.CharField(max_length=255, blank=True)

    # когда
    created_at = models.DateTimeField(auto_now_add=True)

    # полезные мелочи
    message = models.CharField(max_length=255, blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"[{self.created_at:%Y-%m-%d %H:%M}] {self.action} {self.model}#{self.object_id} by {self.user_id or 'anon'}"
