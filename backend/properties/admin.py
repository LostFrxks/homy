from django.contrib import admin
from .models import Property, PropertyImage

class PropertyImageInline(admin.TabularInline):
    model = PropertyImage
    extra = 0

@admin.register(Property)   
class PropertyAdmin(admin.ModelAdmin):
    inlines = [PropertyImageInline]
    list_display = (
        "id", "title", "deal_type", "status", 
        "price", "rooms", "area", "realtor", "created_at"
    )
    list_filter = ("deal_type", "status", "district", "realtor")
    search_fields = ("title", "description", "address")


@admin.register(PropertyImage)
class PropertyImageAdmin(admin.ModelAdmin):
    list_display = ("id", "property", "created_at")