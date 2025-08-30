from django.db import models
from django.conf import settings

class Deal(models.Model):
    class Stage(models.TextChoices):
        LEAD = "lead", "Лид"
        NEGOTIATION = "negotiation", "Переговоры"
        SIGNED = "signed", "Подписан"
        CLOSED = "closed", "Закрыт"
        CANCELED = "canceled", "Отменён"

    property = models.ForeignKey("properties.Property", on_delete=models.PROTECT, related_name="deals")
    stage = models.CharField(max_length=20, choices=Stage.choices, default=Stage.LEAD)

    client_name = models.CharField(max_length=255)
    client_phone = models.CharField(max_length=50)
    price_offer = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)

    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="deals_created")
    assigned_to = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, related_name="deals_assigned", null=True, blank=True)

    planned_date = models.DateField(null=True, blank=True)
    closed_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta: ordering = ["-created_at"]
    def __str__(self): return f"Deal #{self.pk} · {self.property} · {self.stage}"
