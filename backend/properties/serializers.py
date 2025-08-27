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
        fields = "__all__"
        read_only_fields = ("id","realtor","realtor_name","created_at","updated_at","images")
        extra_kwargs = {
            "address":  {"required": True, "allow_blank": False},
            "district": {"required": True, "allow_blank": False},
            "deal_type":{"required": True},
            "status":   {"required": True},
            "rooms":    {"required": True},
            "area":     {"required": True},
            "price":    {"required": True},
        }
        read_only_fields = ["id", "realtor", "realtor_name", "created_at", "updated_at","images"]
