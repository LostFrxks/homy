# properties/serializers.py
from rest_framework import serializers
from .models import Property, PropertyImage, Favorite

class PropertyImageSerializer(serializers.ModelSerializer):
    url = serializers.SerializerMethodField()

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
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    deal_type_display = serializers.CharField(source="get_deal_type_display", read_only=True)
    is_favorite = serializers.SerializerMethodField()
    cover_url = serializers.SerializerMethodField()
    class Meta:
        model = Property
        fields = "__all__"
        read_only_fields = (
            "id","realtor","realtor_name","created_at","updated_at","images",
            "status_display","deal_type_display","is_favorite"
        )
        extra_kwargs = {
            # как и было: эти — обязательны
            "address":  {"required": True, "allow_blank": False},
            "district": {"required": True, "allow_blank": False},
            "deal_type":{"required": True},
            "status":   {"required": True},
            "rooms":    {"required": True},
            "area":     {"required": True},
            "price":    {"required": True},

            # новые — опциональные
            "kind": {"required": False, "allow_null": True, "allow_blank": True},
            "floor": {"required": False, "allow_null": True},
            "phone": {"required": False, "allow_blank": True},
            "owner_name": {"required": False, "allow_blank": True},
            "cross_streets": {"required": False, "allow_blank": True},
            "condition": {"required": False, "allow_null": True, "allow_blank": True},
            "furniture": {"required": False, "allow_null": True},
            "documents": {"required": False, "allow_null": True},
            "communications": {"required": False, "allow_null": True},
            "offer_type": {"required": False, "allow_null": True, "allow_blank": True},
            "offer_category": {"required": False, "allow_null": True, "allow_blank": True},
        }

    def validate(self, attrs):
        # неотрицательные числовые
        for k in ["price", "area", "rooms"]:
            v = attrs.get(k)
            if v is not None and v < 0:
                raise serializers.ValidationError({k: "Must be ≥ 0"})

        floor = attrs.get("floor")
        if floor is not None and floor < 0:
            raise serializers.ValidationError({"floor": "Must be ≥ 0"})

        for k in ["address", "district"]:
            if not attrs.get(k):
                raise serializers.ValidationError({k: "Required"})

        # массивы — только списки строк
        for k in ["documents", "communications"]:
            v = attrs.get(k)
            if v is not None and not (isinstance(v, list) and all(isinstance(x, str) for x in v)):
                raise serializers.ValidationError({k: "Must be a list of strings"})
        return attrs

    def get_is_favorite(self, obj) -> bool:
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return False
        return obj.fav_by.filter(user=request.user).exists()

    def get_cover_url(self, obj):
        first = obj.images.order_by("id").first()
        if not first or not hasattr(first.image, "url"):
            return None
        request = self.context.get("request")
        rel = first.image.url
        return request.build_absolute_uri(rel) if request else rel
    
class FavoriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Favorite
        fields = ("id", "property", "created_at")
        read_only_fields = ("id", "created_at")