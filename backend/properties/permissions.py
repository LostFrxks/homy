from rest_framework.permissions import BasePermission, SAFE_METHODS

class IsOwnerOrReadOnly(BasePermission):
    """
    Чтение (GET/HEAD/OPTIONS): разрешено для аутентифицированных.
    Запись (POST/PUT/PATCH/DELETE): только владелец (owner/created_by/realtor) или staff.
    """
    message = "Вы не владелец объекта."

    def has_permission(self, request, view):
        # У тебя уже стоит IsAuthenticated на ViewSet — просто пропускаем дальше.
        return True

    def has_object_permission(self, request, view, obj):
        # Разрешаем чтение
        if request.method in SAFE_METHODS:
            return True

        # STAFF может всё
        if getattr(request.user, "is_staff", False):
            return True

        # Определяем владельца: поддержка разных моделей
        owner = (
            getattr(obj, "realtor", None)
            or getattr(obj, "created_by", None)
            or getattr(obj, "realtor", None)
        )

        return bool(owner and owner == request.user)
