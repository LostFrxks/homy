# users/serializers.py
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from .models import PasswordResetCode
from django.utils import timezone
from datetime import timedelta

User = get_user_model()

class LoginByEmailSerializer(TokenObtainPairSerializer):
    """
    Принимает только email + password.
    Находит пользователя по email (case-insensitive),
    мапит на attrs['username'] и дальше отдаёт в SimpleJWT.
    """
    # Объявим поля явно ради понятности
    email = serializers.EmailField(write_only=True)
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        email = self.initial_data.get("email")
        password = self.initial_data.get("password")

        if not email or not password:
            raise serializers.ValidationError("Требуются email и password.")

        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            # одинаковое сообщение, чтобы не палить существование почты
            raise serializers.ValidationError("Неверный email или пароль.")

        if not user.is_active:
            raise serializers.ValidationError("Аккаунт неактивен.")

        # Подставляем username, который ожидает базовый сериализатор
        attrs["username"] = getattr(user, User.USERNAME_FIELD)  # обычно 'username'
        attrs["password"] = password

        return super().validate(attrs)


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = User
        fields = ("id", "username", "email", "password")

    def validate_username(self, v):
        if User.objects.filter(username__iexact=v).exists():
            raise serializes.ValidationError("Username уже занят")
        return v

    def validate_email(self, v):
        if not v:
            return v
        if User.objects.filter(email__iexact=v).exists():
            raise serializers.ValidationError("Email уже используется")
        return v

    def validate_password(self, v):
        validate_password(v)
        return v

    def create(self, validated_data):
        return User.objects.create_user(
            username=validated_data["username"],
            email=validated_data.get("email"),
            password=validated_data["password"],
        )


class ForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def create(self, validated_data):
        # Всегда отвечаем 200, даже если юзера нет (чтобы не палить существование)
        email = validated_data["email"].lower().strip()
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return None

        # простой антиспам: не чаще 1 кода в 60 секунд
        last = PasswordResetCode.objects.filter(user=user).order_by("-created_at").first()
        if last and (timezone.now() - last.created_at).total_seconds() < 60:
            return None

        code = PasswordResetCode.generate_code()
        rec = PasswordResetCode.objects.create(
            user=user,
            code=code,
            expires_at=timezone.now() + timedelta(minutes=10)
        )

        from django.core.mail import send_mail
        send_mail(
            subject="Код для сброса пароля",
            message=f"Ваш код: {code}\nОн действует 10 минут.",
            from_email=None,
            recipient_list=[email],
        )
        return rec


class ResetPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()
    code = serializers.CharField(min_length=6, max_length=6)
    new_password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        email = attrs["email"].lower().strip()
        code = attrs["code"]
        pwd  = attrs["new_password"]

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            # Молча притворяемся, что всё ок
            raise serializers.ValidationError({"code": "Неверный код или срок действия истёк."})

        rec = (
            PasswordResetCode.objects
            .filter(user=user, code=code, used=False)
            .order_by("-created_at")
            .first()
        )
        if not rec or not rec.is_valid():
            raise serializers.ValidationError({"code": "Неверный код или срок действия истёк."})

        # стандартные проверки Django
        password_validation.validate_password(pwd, user=user)

        attrs["user"] = user
        attrs["rec"] = rec
        return attrs

    def create(self, validated_data):
        user = validated_data["user"]
        rec  = validated_data["rec"]
        pwd  = validated_data["new_password"]

        user.set_password(pwd)
        user.save()
        rec.used = True
        rec.save(update_fields=["used"])
        # по желанию: аннулировать все старые JWT refresh’и
        return user