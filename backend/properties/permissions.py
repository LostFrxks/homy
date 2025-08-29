from rest_framework.permissions import BasePermission, SAFE_METHODS
from rest_framework.exceptions import PermissionDenied, NotAuthenticated

class IsOwnerOrReadOnly(BasePermission):
    """
    SAFE-методы: как у тебя сейчас — только для аутентифицированных.
    Небезопасные методы: только владелец.
    Возвращаем понятные сообщения об ошибках.
    """

    message = "Вы не владелец объекта"

    def has_object_permission(self, request, view, obj):
        # SAFE: оставить как у тебя (чтение только для залогиненных)
        if request.method in SAFE_METHODS:
            return request.user and request.user.is_authenticated

        # Write-операции: сначала проверяем, что юзер залогинен
        if not request.user or not request.user.is_authenticated:
            raise NotAuthenticated(detail="Требуется аутентификация")

        # Только владелец может править/удалять
        if getattr(obj, "realtor_id", None) != request.user.id:
            raise PermissionDenied(detail=self.message)

        return True
