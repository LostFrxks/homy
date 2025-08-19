from rest_framework import serializers
from .models import Deal

class DealSerializer(serializers.ModelSerializer):
    property_title = serializers.CharField(source="property.title", read_only=True)
    created_by_name = serializers.CharField(source="created_by.username", read_only=True)
    assigned_to_name = serializers.CharField(source="assigned_to.username", read_only=True)

    class Meta:
        model = Deal
        fields = [
            "id","property","property_title",
            "stage",
            "client_name","client_phone","comment",
            "price","commission",
            "created_by","created_by_name",
            "assigned_to","assigned_to_name",
            "planned_date","closed_at",
            "created_at","updated_at",
        ]
        read_only_fields = ["id","created_by","created_by_name","created_at","updated_at"]
