from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.hashers import make_password
from django.utils import timezone
from datetime import timedelta
from .models import PasswordResetCode, User, KYCProfile
from django.core.exceptions import FieldDoesNotExist
import re

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
    new_password = serializers.CharField(write_only=True, min_length=6)
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

class ForgotPasswordNoAuthSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate(self, attrs):
        email = attrs["email"].strip().lower()
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise serializers.ValidationError({"email": "User not found"})
        attrs["user"] = user
        return attrs

    def create(self, validated_data):
        user = validated_data["user"]
        rec = PasswordResetCode.objects.create(
            user=user,
            code=PasswordResetCode.generate_code(),
            expires_at=timezone.now() + timedelta(minutes=10),
        )
        return {"record": rec, "user": user}

class ResetPasswordNoAuthSerializer(serializers.Serializer):
    email = serializers.EmailField()
    code = serializers.CharField(max_length=6)
    new_password = serializers.CharField(write_only=True, min_length=6)

    def validate(self, attrs):
        email = attrs["email"].strip().lower()
        code  = attrs["code"].strip()
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

        # проверим качество нового пароля
        validate_password(attrs["new_password"], user=user)

        attrs["user"] = user
        attrs["rec"]  = rec
        return attrs

    def create(self, validated_data):
        user = validated_data["user"]
        rec  = validated_data["rec"]
        new_pwd = validated_data["new_password"]

        user.set_password(new_pwd)
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




_PHONE_RE = re.compile(r'^[0-9+\-\s()]{6,32}$')
class MeSerializer(serializers.ModelSerializer):
    # счётчики только для чтения
    properties_active = serializers.SerializerMethodField()
    properties_draft = serializers.SerializerMethodField()
    showings_planned_today = serializers.SerializerMethodField()
    deals_open = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            "id", "email", "first_name", "last_name", "phone", "role",
            "properties_active", "properties_draft",
            "showings_planned_today", "deals_open",
        )
        read_only_fields = ("email", "role")

    # простая валидация телефона
    def validate_phone(self, value: str):
        v = (value or "").strip()
        if v and not _PHONE_RE.match(v):
            raise serializers.ValidationError("Некорректный телефонный номер.")
        return v

    # --- counters ---
    def get_properties_active(self, user) -> int:
        try:
            from properties.models import Property
            return Property.objects.filter(realtor=user, status=getattr(Property.Status, "ACTIVE", "active")).count()
        except Exception:
            return 0

    def get_properties_draft(self, user) -> int:
        try:
            from properties.models import Property
            return Property.objects.filter(realtor=user, status=getattr(Property.Status, "DRAFT", "draft")).count()
        except Exception:
            return 0

    def get_showings_planned_today(self, user) -> int:
        try:
            from showings.models import Showing
            today = timezone.localdate()
            return Showing.objects.filter(agent=user, status="planned", starts_at__date=today).count()
        except Exception:
            return 0

    from django.core.exceptions import FieldDoesNotExist

    def get_deals_open(self, user) -> int:
        """
        Возвращает количество «незакрытых» сделок для пользователя.
        Поддерживает разные схемы полей:
        - агент: agent / assigned_to / created_by / user
        - состояние: status / stage / is_closed
        """
        try:
            from deals.models import Deal  # type: ignore
        except Exception:
            return 0

        # --- определить поле "агента" динамически ---
        agent_field_candidates = ["agent", "assigned_to", "created_by", "user"]
        agent_field = None
        for name in agent_field_candidates:
            try:
                Deal._meta.get_field(name)
                agent_field = name
                break
            except FieldDoesNotExist:
                continue

        # если вообще не нашли поле агента — считаем по всем
        if agent_field:
            qs = Deal.objects.filter(**{agent_field: user})
        else:
            qs = Deal.objects.all()

        # --- применить «незакрытость» по разным схемам ---
        # 1) status (строка/choices)
        try:
            Deal._meta.get_field("status")
            return qs.exclude(status__in=["closed_won", "closed_lost", "closed"]).count()
        except FieldDoesNotExist:
            pass
        except Exception:
            return 0

        # 2) stage (строка/choices)
        try:
            Deal._meta.get_field("stage")
            closed_stages = {"closed_won", "closed_lost", "closed", "lost", "won", "done"}
            return qs.exclude(stage__in=list(closed_stages)).count()
        except FieldDoesNotExist:
            pass
        except Exception:
            return 0

        # 3) is_closed (bool)
        try:
            Deal._meta.get_field("is_closed")
            return qs.filter(is_closed=False).count()
        except FieldDoesNotExist:
            pass
        except Exception:
            return 0

        # Фоллбэк: если никакого статуса нет — просто количество таких сделок
        return qs.count()

class KYCProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = KYCProfile
        # Файлы принимаем как обычные upload (multipart)
        fields = (
            'id',
            'status',
            'rejection_reason',
            'doc_front',
            'doc_back',
            'selfie',
            'created_at',
            'updated_at',
        )
        read_only_fields = ('status', 'rejection_reason', 'created_at', 'updated_at')

    def validate(self, attrs):
        # Если профиль уже approved — больше не редактируем через пользовательский эндпоинт
        instance: KYCProfile | None = getattr(self, 'instance', None)
        if instance and not instance.can_user_edit():
            raise serializers.ValidationError({'detail': 'Профиль подтверждён и не может быть изменён.'})
        return attrs


class KYCAdminUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = KYCProfile
        fields = (
            'id',
            'status',
            'rejection_reason',
            'reviewed_at',
            'reviewed_by',
        )
        read_only_fields = ('id',)

    def validate_status(self, value):
        if value not in (KYCProfile.Status.APPROVED, KYCProfile.Status.REJECTED, KYCProfile.Status.PENDING):
            raise serializers.ValidationError('Недопустимый статус.')
        return value