# users/serializers.py
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

User = get_user_model()

class EmailOrUsernameTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Логин по email ИЛИ username.
    Делаем username необязательным и добавляем поле email.
    Если пришёл email — ищем пользователя и подставляем его username перед базовой проверкой.
    """
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # username (т.е. self.username_field) больше не обязателен
        self.fields[self.username_field].required = False
        # email — опциональное поле
        self.fields['email'] = serializers.EmailField(required=False)

    def validate(self, attrs):
        email = (self.initial_data.get("email") or "").strip()
        username = (self.initial_data.get(self.username_field) or "").strip()

        if email and not username:
            user = (
                User.objects
                .filter(email__iexact=email)
                .order_by("id")
                .first()
            )
            if user:
                attrs[self.username_field] = user.get_username()

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