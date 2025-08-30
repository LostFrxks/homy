from django.contrib import admin
from . import models

@admin.register(models.Deal)
class DealAdmin(admin.ModelAdmin):
    list_display = (
        "id", "property", "stage", "client_name",
        "price_offer", "created_by", "assigned_to", "created_at"
    )
    list_filter = ("stage", "created_by", "assigned_to", "property__deal_type")
    search_fields = ("client_name", "client_phone", "property__title")

