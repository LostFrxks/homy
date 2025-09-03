from rest_framework import serializers
from .models import Showing

class ShowingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Showing
        fields = ('id','property','agent','client_name','client_phone','starts_at','status','created_at')
        read_only_fields = ('agent','created_at')

    def validate(self, attrs):
        instance = self.instance or Showing()
        # временно проставим agent для проверки пересечений
        req = self.context.get('request')
        if req and req.user and not attrs.get('agent'):
            instance.agent = req.user
        # склеим значения в instance для корректной проверки
        for k,v in attrs.items():
            setattr(instance, k, v)
        if instance.status == 'planned' and instance.overlaps():
            raise serializers.ValidationError({'starts_at': 'Пересечение с другим показом этого агента.'})
        return attrs


