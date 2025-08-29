# properties/serializers.py
from rest_framework import serializers
from .models import Property, PropertyImage

class PropertyImageSerializer(serializers.ModelSerializer):
    url = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = PropertyImage
        fields = ["id", "url", "created_at"]

    def get_url(self, obj):
        request = self.context.get("request")
        rel = obj.image.url if hasattr(obj.image, "url") else ""
        return request.build_absolute_uri(rel) if request else rel


class PropertySerializer(serializers.ModelSerializer):
    realtor_name = serializers.CharField(source="realtor.username", read_only=True)
    images = PropertyImageSerializer(many=True, read_only=True)
    # «человеческие» варианты из choices
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    deal_type_display = serializers.CharField(source="get_deal_type_display", read_only=True)

    class Meta:
        model = Property
        fields = "__all__"
        read_only_fields = (
            "id","realtor","realtor_name","created_at","updated_at","images",
            "status_display","deal_type_display"
        )
        extra_kwargs = {
            "address":  {"required": True, "allow_blank": False},
            "district": {"required": True, "allow_blank": False},
            "deal_type":{"required": True},
            "status":   {"required": True},
            "rooms":    {"required": True},
            "area":     {"required": True},
            "price":    {"required": True},
        }
