from django.db import models
from django.conf import settings

class Property(models.Model):
    class DealType(models.TextChoices):
        SALE = "sale", "Продажа"
        RENT = "rent", "Аренда"

    class Status(models.TextChoices):
        DRAFT = "draft", "Черновик"
        ACTIVE = "active", "Активен"
        RESERVED = "reserved", "Зарезервирован"
        SOLD = "sold", "Продан"
        ARCHIVED = "archived", "Архив"

    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    address = models.CharField(max_length=255, blank=True)

    deal_type = models.CharField(max_length=10, choices=DealType.choices)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.DRAFT)

    district = models.CharField(max_length=100, blank=True)
    rooms = models.PositiveIntegerField(default=1)
    area = models.DecimalField(max_digits=8, decimal_places=2)
    price = models.DecimalField(max_digits=12, decimal_places=2)

    realtor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="properties")

    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.title} ({self.deal_type}/{self.status})"
