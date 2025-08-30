from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.hashers import make_password
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
    new_password = serializers.CharField(write_only=True, min_length=8)
    def validate(self, attrs):
        user = self.context.get("user")
        if not user or not isinstance(user, User):
            raise serializers.ValidationError({"user": "Auth required"})
        validate_password(attrs["new_password"], user=user)
        attrs["user"] = user
        return attrs
    def create(self, validated_data):
        user = validated_data["user"]
        raw_pwd = validated_data["new_password"]
        rec = PasswordResetCode.objects.create(
            user=user,
            password_hash=make_password(raw_pwd),
            code=PasswordResetCode.generate_code(),
            expires_at=timezone.now() + timedelta(minutes=10),
        )
        return {"record": rec, "raw_password": raw_pwd}

class ResetPasswordSerializer(serializers.Serializer):
    code = serializers.CharField(max_length=6)
    def validate(self, attrs):
        user = self.context.get("user")
        if not user or not isinstance(user, User):
            raise serializers.ValidationError({"user": "Auth required"})
        code = attrs["code"].strip()
        rec = (PasswordResetCode.objects
               .filter(user=user, code=code, used=False)
               .order_by("-created_at").first())
        if not rec:
            raise serializers.ValidationError({"code": "Invalid code"})
        if not rec.is_valid():
            raise serializers.ValidationError({"code": "Code expired or already used"})
        if not rec.password_hash:
            raise serializers.ValidationError({"code": "Draft has no password. Request a new code."})
        attrs["user"] = user
        attrs["rec"]  = rec
        return attrs
    def create(self, validated_data):
        user = validated_data["user"]
        rec  = validated_data["rec"]
        user.password = rec.password_hash
        user.save(update_fields=["password"])
        rec.used = True
        rec.save(update_fields=["used"])
        return user

# ---------- НОВОЕ: noauth ----------
class ForgotPasswordNoAuthSerializer(serializers.Serializer):
    email = serializers.EmailField()
    new_password = serializers.CharField(write_only=True, min_length=8)

    def validate(self, attrs):
        email = attrs["email"].strip().lower()
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise serializers.ValidationError({"email": "User not found"})
        validate_password(attrs["new_password"], user=user)
        attrs["user"] = user
        return attrs

    def create(self, validated_data):
        user = validated_data["user"]
        raw_pwd = validated_data["new_password"]
        rec = PasswordResetCode.objects.create(
            user=user,
            password_hash=make_password(raw_pwd),
            code=PasswordResetCode.generate_code(),
            expires_at=timezone.now() + timedelta(minutes=10),
        )
        return {"record": rec, "raw_password": raw_pwd, "user": user}

class ResetPasswordNoAuthSerializer(serializers.Serializer):
    email = serializers.EmailField()
    code = serializers.CharField(max_length=6)

    def validate(self, attrs):
        email = attrs["email"].strip().lower()
        code = attrs["code"].strip()
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise serializers.ValidationError({"email": "User not found"})
        rec = (PasswordResetCode.objects
               .filter(user=user, code=code, used=False)
               .order_by("-created_at").first())
        if not rec:
            raise serializers.ValidationError({"code": "Invalid code"})
        if not rec.is_valid():
            raise serializers.ValidationError({"code": "Code expired or already used"})
        if not rec.password_hash:
            raise serializers.ValidationError({"code": "Draft has no password. Request a new code."})
        attrs["user"] = user
        attrs["rec"]  = rec
        return attrs

    def create(self, validated_data):
        user = validated_data["user"]
        rec  = validated_data["rec"]
        user.password = rec.password_hash
        user.save(update_fields=["password"])
        rec.used = True
        rec.save(update_fields=["used"])
        return user
    
class RegisterRequestSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(min_length=6, write_only=True)

class RegisterVerifySerializer(serializers.Serializer):
    email = serializers.EmailField()
    code = serializers.CharField(max_length=6)