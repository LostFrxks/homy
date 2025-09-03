from django.db import models
from django.conf import settings

def property_image_upload_to(instance, filename):
    return f"properties/{instance.property_id}/{filename}"

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
    price = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    area = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    rooms = models.PositiveIntegerField(default=0)
    address = models.CharField(max_length=255)
    district = models.CharField(max_length=120)

    deal_type = models.CharField(max_length=10, choices=DealType.choices)
    status = models.CharField(max_length=12, choices=Status.choices, default=Status.ACTIVE)

    realtor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="properties")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    def __str__(self): return f"{self.title} · {self.deal_type} · {self.status}"

class PropertyImage(models.Model):
    property = models.ForeignKey(Property, on_delete=models.CASCADE, related_name="images")
    image = models.ImageField(upload_to=property_image_upload_to)
    created_at = models.DateTimeField(auto_now_add=True)
    def delete(self, *args, **kwargs):
        storage = self.image.storage
        path = self.image.path
        super().delete(*args, **kwargs)
        try:
            if storage.exists(path):
                storage.delete(path)
        except Exception:
            pass
    def __str__(self): return f"PropertyImage<{self.id}> for Property<{self.property_id}>"

class Favorite(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="favorites")
    property = models.ForeignKey("properties.Property", on_delete=models.CASCADE, related_name="fav_by")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user", "property")
        indexes = [
            models.Index(fields=["user", "property"]),
        ]

    def __str__(self):
        return f"{self.user_id} → {self.property_id}"