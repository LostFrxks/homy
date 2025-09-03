from rest_framework import viewsets, status, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters import rest_framework as dj_filters
from django.shortcuts import get_object_or_404

from .models import Property, PropertyImage
from .serializers import PropertySerializer, PropertyImageSerializer
from .permissions import IsOwnerOrReadOnly  

class PropertyFilter(dj_filters.FilterSet):
    class Meta:
        model = Property
        fields = ["status", "district", "rooms", "deal_type", "realtor"]

class PropertyViewSet(viewsets.ModelViewSet):
    queryset = Property.objects.all().select_related("realtor").prefetch_related("images")
    serializer_class = PropertySerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly]
    filter_backends = [dj_filters.DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = PropertyFilter
    search_fields = ["title", "address", "district", "description"]
    ordering_fields = ["created_at", "price", "area", "rooms"]
    ordering = ["-created_at"]

    @action(detail=True, methods=["post"])
    def upload_image(self, request, pk=None):
        prop = self.get_object()
        if prop.images.count() >= 20:
            return Response({"detail": "Max 20 images per property"}, status=400)
        file = request.FILES.get("file")
        if not file:
            return Response({"detail": "file is required"}, status=400)
        img = PropertyImage.objects.create(property=prop, image=file)
        return Response(PropertyImageSerializer(img).data, status=201)

    @action(detail=True, methods=["delete"], url_path=r"images/(?P<image_id>\d+)")
    def delete_image(self, request, pk=None, image_id=None):
        prop = self.get_object()
        img = get_object_or_404(prop.images, pk=image_id)
        img.image.delete(save=False)
        img.delete()
        return Response(status=204)
    
    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx["request"] = self.request
        return ctx
    
    def get_queryset(self):
        qs = super().get_queryset()
        request = self.request

        status_param = request.query_params.get('status')
        mine = request.query_params.get('mine') in {'1', 'true', 'True'}

        # Явный фильтр по статусу (если пришёл)
        if status_param:
            qs = qs.filter(status=status_param)

        if mine:
            # Мои объекты (любые статусы)
            qs = qs.filter(realtor=request.user)
        else:
            # Каталог: для не-staff по умолчанию показываем только активные,
            # если статус не указан явно.
            if not status_param and not request.user.is_staff:
                try:
                    from .models import Property
                    qs = qs.filter(status=Property.Status.ACTIVE)
                except Exception:
                    qs = qs.filter(status='active')

        return qs
    
    def list(self, request, *args, **kwargs):
        if request.query_params.get('summary') in {'1', 'true', 'True'}:
            user = request.user
            try:
                from .models import Property
                ACTIVE = Property.Status.ACTIVE
                DRAFT = Property.Status.DRAFT
            except Exception:
                ACTIVE = 'active'
                DRAFT = 'draft'

            base_qs = self.queryset  # уже select_related/prefetch
            data = {
                'total_active': base_qs.filter(status=ACTIVE).count(),
                'my_active':    base_qs.filter(status=ACTIVE, realtor=user).count(),
                'my_drafts':    base_qs.filter(status=DRAFT,  realtor=user).count(),
            }
            return Response(data)

        return super().list(request, *args, **kwargs)
    
    def destroy(self, request, *args, **kwargs):
        obj = self.get_object()
        status_val = getattr(obj, 'status', None)

        # Поддержим и enum, и строку
        is_draft = (
            status_val == 'draft' or
            (hasattr(obj, 'Status') and status_val == getattr(obj.Status, 'DRAFT', None))
        )
        if not is_draft:
            return Response({'detail': 'Можно удалять только черновик.'}, status=400)

        return super().destroy(request, *args, **kwargs)

    def perform_create(self, serializer):
        serializer.save(realtor=self.request.user)