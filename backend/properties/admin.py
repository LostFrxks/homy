from django.contrib import admin
from . import models

@admin.register(models.Property)
class PropertyAdmin(admin.ModelAdmin):
    list_display = ("id", "title", "deal_type", "status", "price", "rooms", "area", "realtor", "created_at")
    list_filter = ("deal_type", "status", "district", "realtor")
    search_fields = ("title", "description", "address")
