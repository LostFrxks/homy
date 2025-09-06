from rest_framework import viewsets, status, permissions, filters, generics
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters import rest_framework as dj_filters
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.http import FileResponse, Http404

from .models import Property, PropertyImage, Favorite, SavedSearch, KYCProfile
from .serializers import PropertySerializer, PropertyImageSerializer, FavoriteSerializer, SavedSearchSerializer, KYCAdminUpdateSerializer, KYCProfileSerializer
from .permissions import IsOwnerOrReadOnly, IsOwnerOrAdmin

from rest_framework.permissions import IsAuthenticated

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


class FavoriteViewSet(viewsets.ReadOnlyModelViewSet):
    """
    GET /api/v1/favorites/ — список моих избранных объектов (id избранного + property id)
    POST /api/v1/favorites/toggle/ {"property_id": N} — переключить избранное
    """
    permission_classes = [IsAuthenticated]
    serializer_class = FavoriteSerializer

    def get_queryset(self):
        return Favorite.objects.filter(user=self.request.user).select_related("property").order_by("-created_at")

    @action(detail=False, methods=["post"])
    def toggle(self, request):
        prop_id = request.data.get("property_id")
        if not prop_id:
            return Response({"detail": "property_id is required"}, status=400)
        try:
            prop = Property.objects.get(pk=prop_id)
        except Property.DoesNotExist:
            return Response({"detail": "Property not found"}, status=404)

        fav, created = Favorite.objects.get_or_create(user=request.user, property=prop)
        if created:
            return Response({"is_favorite": True}, status=status.HTTP_201_CREATED)
        # уже было — удаляем
        fav.delete()
        return Response({"is_favorite": False})
    

class SavedSearchViewSet(viewsets.ModelViewSet):
    """
    CRUD: /api/v1/saved-searches/
    Выполнить: POST /api/v1/saved-searches/{id}/run/
    """
    permission_classes = [IsAuthenticated]
    serializer_class = SavedSearchSerializer

    def get_queryset(self):
        return SavedSearch.objects.filter(user=self.request.user).order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['post'])
    def run(self, request, pk=None):
        saved = self.get_object()
        query = dict(saved.query or {})

        # Базовый qs — как в каталоге (без mine), активные по умолчанию
        qs = Property.objects.all()

        # Маппинг «понятных» ключей запроса -> Django lookups
        mapping = {
            'status': 'status',
            'deal_type': 'deal_type',
            'rooms': 'rooms__in',
            'price_min': 'price__gte',
            'price_max': 'price__lte',
            'realtor_id': 'realtor_id',
            'district': 'district',
            'city': 'city',
        }

        filters = {}
        for k, lookup in mapping.items():
            if k in query and query[k] not in (None, '', []):
                filters[lookup] = query[k]
        if filters:
            qs = qs.filter(**filters)

        # Если нужно поддержать «мои» — разрешим ключ mine=true
        mine = query.get('mine') in (True, '1', 1, 'true', 'True')
        if mine:
            qs = qs.filter(realtor=request.user)

        # Если `status` не задан и юзер не staff — показываем только активные, как в каталоге
        if 'status' not in filters and not request.user.is_staff:
            try:
                ACTIVE = Property.Status.ACTIVE
            except Exception:
                ACTIVE = 'active'
            qs = qs.filter(status=ACTIVE)

        # Пагинация и сериализация как обычно
        page = self.paginate_queryset(qs.order_by('-id'))
        ser = PropertySerializer(page or qs, many=True, context={'request': request})
        if page is not None:
            return self.get_paginated_response(ser.data)
        return Response(ser.data)
    
class MyKYCView(generics.RetrieveUpdateAPIView):
    """
    Пользователь получает/обновляет СВОЙ KYC.
    Файлы присылаем multipart/form-data.
    """
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrAdmin]
    serializer_class = KYCProfileSerializer

    def get_object(self):
        kyc, _ = KYCProfile.objects.get_or_create(user=self.request.user)
        self.check_object_permissions(self.request, kyc)
        return kyc


class KYCAdminViewSet(viewsets.ModelViewSet):
    """
    Админ-лист/фильтр/апдейт KYC.
    """
    permission_classes = [permissions.IsAdminUser]
    queryset = KYCProfile.objects.select_related('user').all()

    def get_serializer_class(self):
        return KYCAdminUpdateSerializer

    def perform_update(self, serializer):
        obj: KYCProfile = serializer.save(
            reviewed_by=self.request.user,
            reviewed_at=timezone.now()
        )
        # Можно триггерить уведомления здесь (email/celery) — опционально.


class KYCFileDownloadView(generics.GenericAPIView):
    """
    Защищённая раздача приватных файлов.
    GET /api/v1/auth/kyc/files/<field>/<user_id>/   
    field ∈ {doc_front, doc_back, selfie}
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, field: str, user_id: int, *args, **kwargs):
        kyc = get_object_or_404(KYCProfile, user_id=user_id)
        # Разрешён доступ владельцу и staff
        if not (request.user.is_staff or request.user.id == kyc.user_id):
            raise Http404()

        if field not in ('doc_front', 'doc_back', 'selfie'):
            raise Http404()
        f = getattr(kyc, field, None)
        if not f or not f.name:
            raise Http404()
        # отдаём через FileResponse — файл лежит в PRIVATE_MEDIA_ROOT
        return FileResponse(f.open('rb'), as_attachment=True, filename=f.name.split('/')[-1])    