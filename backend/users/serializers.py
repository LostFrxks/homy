# users/serializers.py
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

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
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ("id", "username", "email", "password")

    def validate_username(self, v):
        if User.objects.filter(username__iexact=v).exists():
            raise serializers.ValidationError("Username уже занят")
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