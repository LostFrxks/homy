from django.db import models

# Create your models here.
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

    client_name = models.CharField(max_length=120)
    client_phone = models.CharField(max_length=50, blank=True)
    comment = models.TextField(blank=True)

    price = models.DecimalField(max_digits=12, decimal_places=2)      # итоговая цена сделки
    commission = models.DecimalField(max_digits=8, decimal_places=2, default=0)  # комиссия, если надо

    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="deals_created")
    assigned_to = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="deals_assigned", null=True, blank=True)

    planned_date = models.DateField(null=True, blank=True)  # планируемая дата подписания/сдачи
    closed_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Deal #{self.pk} · {self.property} · {self.stage}"
