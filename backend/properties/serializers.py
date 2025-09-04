# properties/serializers.py
from rest_framework import serializers
from .models import Property, PropertyImage, Favorite

class PropertyImageSerializer(serializers.ModelSerializer):
    realtor  = serializers.SerializerMethodField(read_only=True)

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
    is_favorite = serializers.SerializerMethodField()

    class Meta:
        model = Property
        fields = "__all__"
        read_only_fields = (
            "id","realtor","realtor_name","created_at","updated_at","images",
            "status_display","deal_type_display","is_favorite"
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

    def validate(self, attrs):
        for k in ["price", "area", "rooms"]:
            v = attrs.get(k)
            if v is not None and v < 0:
                raise serializers.ValidationError({k: "Must be ≥ 0"})
        for k in ["address", "district"]:
            if not attrs.get(k):
                raise serializers.ValidationError({k: "Required"})
        return attrs     
    
    def get_is_favorite(self, obj) -> bool:
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return False
        # без лишних запросов: если в qs уже был prefetch fav_by — будет дёшево,
        # но и так один EXISTS быстрый
        return obj.fav_by.filter(user=request.user).exists()
    
class FavoriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Favorite
        fields = ("id", "property", "created_at")
        read_only_fields = ("id", "created_at")