from django.contrib.auth import get_user_model
from rest_framework import permissions, status
from rest_framework.generics import CreateAPIView
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.throttling import ScopedRateThrottle
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from django.utils import timezone
from rest_framework.response import Response
from rest_framework.decorators import api_view
from rest_framework import status
from django.core.mail import send_mail
from .models import User
from .serializers import RegisterRequestSerializer, RegisterVerifySerializer
from rest_framework_simplejwt.tokens import RefreshToken
import datetime
from django.conf import settings
from django.core.mail import send_mail

from .serializers import (
    RegisterSerializer,
    LoginByEmailSerializer,
    ForgotPasswordSerializer,
    ResetPasswordSerializer,
)

User = get_user_model()

class LoginView(TokenObtainPairView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth_login"
    serializer_class = LoginByEmailSerializer

class RefreshView(TokenRefreshView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "token_refresh"

class MeView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request):
        u = request.user
        return Response({
            "id": u.id,
            "username": getattr(u, "username", None),
            "email": u.email,
            "role": getattr(u, "role", None),
        }, status=status.HTTP_200_OK)

class RegisterView(CreateAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = RegisterSerializer

# backend/users/views.py
from rest_framework import permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from django.core.mail import send_mail
from django.conf import settings

from .serializers import (
    ForgotPasswordSerializer, ResetPasswordSerializer,
    ForgotPasswordNoAuthSerializer, ResetPasswordNoAuthSerializer
)

# авторизованные (как у тебя сейчас)
class ForgotPasswordView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "password_forgot"
    def post(self, request):
        s = ForgotPasswordSerializer(data=request.data, context={"user": request.user})
        s.is_valid(raise_exception=True)
        res = s.save()
        rec = res["record"]; raw_pwd = res["raw_password"]; user = request.user
        send_mail(
            "Сброс пароля — код подтверждения",
            (f"Код: {rec.code}\nДействует: 10 минут.\n\n"
             f"Новый пароль: {raw_pwd}\nПароль применится после ввода кода."),
            getattr(settings, "DEFAULT_FROM_EMAIL", None),
            [user.email], fail_silently=False
        )
        return Response({"ok": True, "detail": "Код отправлен на ваш email."}, status=status.HTTP_200_OK)

class ResetPasswordView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "password_reset"
    def post(self, request):
        s = ResetPasswordSerializer(data=request.data, context={"user": request.user})
        s.is_valid(raise_exception=True)
        s.save()
        return Response({"ok": True, "detail": "Пароль изменён"}, status=status.HTTP_200_OK)

# НОВОЕ: без авторизации
class ForgotPasswordNoAuthView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "password_forgot"
    def post(self, request):
        s = ForgotPasswordNoAuthSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        res = s.save()
        rec = res["record"]; raw_pwd = res["raw_password"]; user = res["user"]
        send_mail(
            "Сброс пароля — код подтверждения",
            (f"Код: {rec.code}\nДействует: 10 минут.\n\n"
             f"Новый пароль: {raw_pwd}\nПароль применится после ввода кода."),
            getattr(settings, "DEFAULT_FROM_EMAIL", None),
            [user.email], fail_silently=False
        )
        return Response({"ok": True, "detail": "Код отправлен на email"}, status=status.HTTP_200_OK)

class ResetPasswordNoAuthView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "password_reset"
    def post(self, request):
        s = ResetPasswordNoAuthSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        s.save()
        return Response({"ok": True, "detail": "Пароль изменён"}, status=status.HTTP_200_OK)
    
# users/views.py
import secrets
from django.utils import timezone
from django.core.mail import send_mail
from django.contrib.auth import get_user_model
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken

from .models import RegistrationCode
from .serializers import RegisterRequestSerializer, RegisterVerifySerializer

User = get_user_model()

def gen_code():
    return f"{secrets.randbelow(10**6):06d}"

@api_view(["POST"])
@authentication_classes([])            # отключаем глобальные аутентификаторы
@permission_classes([AllowAny])        # доступ без токена
def register_request_code(request):
    """
    Шаг 1. Принять name/email/password, отправить код, сохранить черновик.
    """
    ser = RegisterRequestSerializer(data=request.data)
    ser.is_valid(raise_exception=True)
    name = ser.validated_data["name"].strip()
    email = ser.validated_data["email"].lower().strip()
    password = ser.validated_data["password"]

    # Если такой пользователь уже есть — стоп
    if User.objects.filter(email=email).exists():
        return Response({"error": "Пользователь с таким email уже существует."},
                        status=status.HTTP_400_BAD_REQUEST)

    # Сгенерировать код и сохранить черновик
    code = gen_code()
    RegistrationCode.create(email=email, name=name, raw_password=password, code=code, ttl_minutes=10)

    # Отправить письмо
    send_mail(
        "Код подтверждения регистрации",
        f"Ваш код: {code}\nОн действителен 10 минут.",
        settings.DEFAULT_FROM_EMAIL,     # от кого
        [email],                         # ← кому (email из формы пользователя)
        fail_silently=False,
    )

    return Response({"message": "Код отправлен на почту."}, status=status.HTTP_200_OK)


@api_view(["POST"])
@authentication_classes([])
@permission_classes([AllowAny])
def register_verify_code(request):
    """
    Шаг 2. Принять email+code, проверить, создать User и выдать JWT.
    """
    ser = RegisterVerifySerializer(data=request.data)
    ser.is_valid(raise_exception=True)
    email = ser.validated_data["email"].lower().strip()
    code = ser.validated_data["code"].strip()

    # Уже зарегистрирован?
    if User.objects.filter(email=email).exists():
        return Response({"error": "Email уже подтверждён и зарегистрирован."},
                        status=status.HTTP_400_BAD_REQUEST)

    # Берём самый свежий черновик
    draft = RegistrationCode.objects.filter(email=email).order_by("-created_at").first()
    if not draft:
        return Response({"error": "Сначала запросите код."}, status=status.HTTP_400_BAD_REQUEST)

    # Ограничение по попыткам (например, 5)
    if draft.attempts >= 5:
        return Response({"error": "Превышено число попыток. Запросите новый код."},
                        status=status.HTTP_429_TOO_MANY_REQUESTS)

    # Валидация
    if not draft.is_valid():
        return Response({"error": "Код недействителен или просрочен. Запросите новый код."},
                        status=status.HTTP_400_BAD_REQUEST)

    if draft.code != code:
        draft.attempts += 1
        draft.save(update_fields=["attempts"])
        return Response({"error": "Неверный код."}, status=status.HTTP_400_BAD_REQUEST)

    # OK: создаём пользователя
    # Реши сам: имя класть в username или first_name. Ниже — в username.
    user = User.objects.create(
        username=draft.name,   # или username=email.split("@")[0]
        email=email,
    )
    user.set_password(None)   # на всякий случай обнулим перед set_password
    # Пароль из черновика уже в хеше → просто переносим:
    user.password = draft.password_hash
    user.save()

    # Пометить черновик использованным
    draft.used = True
    draft.save(update_fields=["used"])

    # Выдать токены
    refresh = RefreshToken.for_user(user)
    return Response({
        "refresh": str(refresh),
        "access": str(refresh.access_token),
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
        }
    }, status=status.HTTP_200_OK)
