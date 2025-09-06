from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models
from django.utils import timezone
from django.conf import settings
from core.storages import PrivateMediaStorage

class CustomUserManager(BaseUserManager):
    def create_superuser(self, email, password, **extra_fields):

        
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)
        extra_fields.setdefault('role', User.Role.ADMIN)
        extra_fields.setdefault('username', '')
        return self._create_user(email, password, **extra_fields)
    
    def _create_user(self, email, password, **extra_fields):
        if not extra_fields.get('username'):
            extra_fields['username'] = ''
        if not email:
            raise ValueError('The Email must be set')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

class User(AbstractUser):
    class Role(models.TextChoices):
        ADMIN = "admin", "Admin"
        MANAGER = "manager", "Manager"
        REALTOR = "realtor", "Realtor"

    username = models.CharField(max_length=150, blank=True, default='', unique=False)

    role = models.CharField(max_length=20, choices=Role.choices, default=Role.REALTOR)
    email = models.EmailField(unique=True)

    phone = models.CharField(max_length=30, blank=True) 
    
    # Важно для аутентификации по email
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []  # Теперь createsuperuser будет запрашивать username
    
    # Используем кастомный менеджер
    objects = CustomUserManager()
    
    def __str__(self):
        return f"{self.email} ({self.role})"

class PasswordResetCode(models.Model):
    user = models.ForeignKey("users.User", on_delete=models.CASCADE, related_name="reset_codes")
    password_hash = models.CharField(max_length=256, blank=True)  # хэш нового пароля
    code = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    used = models.BooleanField(default=False)

    @staticmethod
    def generate_code():
        import secrets
        return f"{secrets.randbelow(10**6):06d}"

    def is_valid(self):
        from django.utils import timezone
        return (not self.used) and timezone.now() <= self.expires_at

    def save(self, *args, **kwargs):
        from django.utils import timezone
        if not self.expires_at:
            self.expires_at = timezone.now() + timezone.timedelta(minutes=10)
        super().save(*args, **kwargs)

class EmailLoginCode(models.Model):
    user = models.ForeignKey("users.User", on_delete=models.CASCADE, related_name="login_codes")
    code = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    used = models.BooleanField(default=False)

    @staticmethod
    def generate_code():
        import secrets
        return f"{secrets.randbelow(10**6):06d}"

    def is_valid(self):
        from django.utils import timezone
        return (not self.used) and timezone.now() <= self.expires_at


from django.contrib.auth.hashers import make_password

class RegistrationCode(models.Model):
    email = models.EmailField()                       # будущий email пользователя
    name = models.CharField(max_length=150)           # будущий username/first_name
    password_hash = models.CharField(max_length=256)  # ХРАНИМ ТОЛЬКО ХЕШ!
    code = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    used = models.BooleanField(default=False)
    attempts = models.PositiveIntegerField(default=0)

    class Meta:
        indexes = [
            models.Index(fields=["email", "-created_at"]),
        ]

    @staticmethod
    def create(email: str, name: str, raw_password: str, code: str, ttl_minutes: int = 10):
        return RegistrationCode.objects.create(
            email=email,
            name=name,
            password_hash=make_password(raw_password),
            code=code,
            expires_at=timezone.now() + timezone.timedelta(minutes=ttl_minutes),
        )

    def is_valid(self) -> bool:
        return (not self.used) and timezone.now() <= self.expires_at
    

_private_storage = PrivateMediaStorage()

class KYCProfile(models.Model):
    class Status(models.TextChoices):
        PENDING = 'pending', 'На модерации'
        APPROVED = 'approved', 'Подтверждён'
        REJECTED = 'rejected', 'Отклонён'

    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='kyc')

    # Файлы (минимальный набор — под себя расширишь)
    doc_front = models.FileField(upload_to='kyc/docs/', storage=_private_storage, blank=True, null=True)
    doc_back  = models.FileField(upload_to='kyc/docs/', storage=_private_storage, blank=True, null=True)
    selfie    = models.FileField(upload_to='kyc/selfies/', storage=_private_storage, blank=True, null=True)

    status = models.CharField(max_length=16, choices=Status.choices, default=Status.PENDING)
    rejection_reason = models.TextField(blank=True, default='')

    reviewed_at = models.DateTimeField(blank=True, null=True)
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='kyc_reviews'
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def can_user_edit(self) -> bool:
        # Разрешим редактировать только когда не approved
        return self.status in (self.Status.PENDING, self.Status.REJECTED)

    def __str__(self):
        return f'KYC<{self.user_id}> {self.status}'