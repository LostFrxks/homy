from rest_framework.permissions import BasePermission, SAFE_METHODS

class IsOwnerOrAdmin(BasePermission):
    """
    Доступ owner’у объекта (по .user) или staff.
    Ожидаем, что у объекта есть поле .user (как у KYCProfile).
    """
    def has_object_permission(self, request, view, obj):
        if request.user and request.user.is_staff:
            return True
        return getattr(obj, 'user_id', None) == getattr(request.user, 'id', None)

    def has_permission(self, request, view):
        # общая проверка — аутентифицирован
        return request.user and request.user.is_authenticated
