# core/exceptions.py
from rest_framework.views import exception_handler
from rest_framework.exceptions import PermissionDenied, NotAuthenticated

def custom_exception_handler(exc, context):
    """
    Единый обработчик ошибок DRF + SimpleJWT:
    - 401 без токена → «Требуется аутентификация»
    - 403 без прав → «Недостаточно прав» (если не задано своё сообщение)
    - SimpleJWT token_not_valid → «Refresh-токен недействителен или просрочен»
    """
    response = exception_handler(exc, context)
    if not response:
        return response

    data = response.data if isinstance(response.data, dict) else {}

    # 1) Явные исключения DRF
    if isinstance(exc, NotAuthenticated):
        data["detail"] = "Требуется аутентификация"
    elif isinstance(exc, PermissionDenied):
        # если пермишен уже вернул русское сообщение — не затираем
        if str(data.get("detail", "")) in (
            "You do not have permission to perform this action.",
            "Недостаточно прав",
        ):
            data["detail"] = "Недостаточно прав"

    # 2) Частые «английские» сообщения от DRF — нормализуем
    if response.status_code == 401 and data.get("detail") in (
        "Authentication credentials were not provided.",
        "Given token not valid for any token type",
        "Invalid token.",
    ):
        data["detail"] = "Требуется аутентификация"

    if response.status_code == 403 and data.get("detail") == "You do not have permission to perform this action.":
        data["detail"] = "Недостаточно прав"

    # 3) SimpleJWT: протух/невалиден (в т.ч. при рефреше)
    # Примеры payload:
    # {"detail":"Token is invalid or expired","code":"token_not_valid"}
    # {"code":"token_not_valid","messages":[{"token_class":"RefreshToken","token_type":"refresh","message":"Token is invalid or expired"}]}
    if data.get("code") == "token_not_valid":
        data["detail"] = "Refresh-токен недействителен или просрочен"

    # применяем изменённый словарь обратно в response.data
    response.data = data
    return response
