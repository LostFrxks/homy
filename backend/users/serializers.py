from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.utils import timezone
from datetime import timedelta
from .models import PasswordResetCode

User = get_user_model()

class LoginByEmailSerializer(TokenObtainPairSerializer):
    email = serializers.EmailField(write_only=True)
    password = serializers.CharField(write_only=True)
    def validate(self, attrs):
        email = attrs.get("email", "").strip().lower()
        pwd = attrs.get("password")
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise serializers.ValidationError({"email": "User not found"})
        attrs["username"] = user.get_username()
        data = super().validate(attrs)  # проверит пароль
        data["user"] = {"id": user.id, "email": user.email, "role": getattr(user, "role", None)}
        return data

class RegisterSerializer(serializers.ModelSerializer):
    username = serializers.CharField(required=False, allow_blank=True)
    password = serializers.CharField(write_only=True, validators=[validate_password])
    class Meta:
        model = User
        fields = ["email", "password", "first_name", "last_name", "username"]
    def validate_email(self, v):
        v = v.strip().lower()
        if User.objects.filter(email=v).exists():
            raise serializers.ValidationError("User with this email already exists")
        return v
    def create(self, validated_data):
        pwd = validated_data.pop("password")
        username = (validated_data.pop("username", "") or "").strip()
        user = User(**validated_data)
        user.email = user.email.strip().lower()
        user.username = username
        user.set_password(pwd)
        user.save()
        return user

class ForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()
    def validate_email(self, v): return v.strip().lower()
    def create(self, validated_data):
        email = validated_data["email"]
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return {}  # не палим существование
        code = PasswordResetCode.objects.create(
            user=user,
            code=PasswordResetCode.generate_code(),
            expires_at=timezone.now() + timedelta(minutes=15),
        )
        # здесь можно отправить письмо (console backend ок для MVP)
        print(f"Password reset code for {email}: {code.code}")
        return {"sent": True}

class ResetPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()
    code = serializers.CharField(max_length=6)
    new_password = serializers.CharField(write_only=True, validators=[validate_password])
    def validate(self, attrs):
        email = attrs["email"].strip().lower()
        code = attrs["code"]
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise serializers.ValidationError({"email": "User not found"})
        try:
            rec = PasswordResetCode.objects.filter(user=user, code=code).latest("created_at")
        except PasswordResetCode.DoesNotExist:
            raise serializers.ValidationError({"code": "Invalid code"})
        if not rec.is_valid():
            raise serializers.ValidationError({"code": "Code expired or already used"})
        attrs["user"] = user
        attrs["rec"] = rec
        return attrs
    def create(self, validated_data):
        user = validated_data["user"]
        rec  = validated_data["rec"]
        pwd  = validated_data["new_password"]
        user.set_password(pwd); user.save()
        rec.used = True; rec.save(update_fields=["used"])
        return user
