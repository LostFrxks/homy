from rest_framework import serializers
from .models import Property, PropertyImage

class PropertyImageSerializer(serializers.ModelSerializer):
    url = serializers.ImageField(source="image", read_only=True)

    class Meta:
        model = PropertyImage
        fields = ["id", "url", "created_at"]

class PropertySerializer(serializers.ModelSerializer):
    realtor_name = serializers.CharField(source="realtor.username", read_only=True)
    images = PropertyImageSerializer(many=True, read_only=True)

    class Meta:
        model = Property
        fields = [
            "id", "title", "description", "address",
            "deal_type", "status", "district",
            "rooms", "area", "price",
            "realtor", "realtor_name",
            "is_active", "created_at", "updated_at","images",
        ]
        read_only_fields = ["id", "realtor_name", "created_at", "updated_at","images",]
