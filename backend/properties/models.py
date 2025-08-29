from django.db import models
from django.conf import settings
from django.core.exceptions import ValidationError 

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
    
    def clean(self):
        errs = {}
        if self.price is not None and self.price < 0:
            errs["price"] = "Price must be ≥ 0"
        if self.area is not None and self.area < 0:
            errs["area"] = "Area must be ≥ 0"
        if self.rooms is not None and self.rooms < 0:
            errs["rooms"] = "Rooms must be ≥ 0"
        if not self.address:
            errs["address"] = "Address is required"
        if not self.district:
            errs["district"] = "District is required"
        if errs:
            raise ValidationError(errs)


# Это медиа очистка при удалении
def property_image_upload_to(instance, filename):
    # /properties/<property_id>/<original_name>
    return f"properties/{instance.property_id}/{filename}"

class PropertyImage(models.Model):
    property = models.ForeignKey(
        "properties.Property",
        related_name="images",
        on_delete=models.CASCADE,
    )
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

    def __str__(self):
        return f"PropertyImage<{self.id}> for Property<{self.property_id}>"