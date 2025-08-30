from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models
from django.utils import timezone
import secrets

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
    
    # Важно для аутентификации по email
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []  # Теперь createsuperuser будет запрашивать username
    
    # Используем кастомный менеджер
    objects = CustomUserManager()
    
    def __str__(self):
        return f"{self.email} ({self.role})"

class PasswordResetCode(models.Model):
    user = models.ForeignKey("users.User", on_delete=models.CASCADE, related_name="reset_codes")
    code = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    used = models.BooleanField(default=False)
    
    @staticmethod
    def generate_code():
        return f"{secrets.randbelow(10**6):06d}"
    
    def is_valid(self):
        return (not self.used) and timezone.now() <= self.expires_at
    
    def save(self, *args, **kwargs):
        if not self.expires_at:
            self.expires_at = timezone.now() + timezone.timedelta(minutes=10)
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"Reset code for {self.user.email}: {self.code}"
    
    class Meta:
        indexes = [
            models.Index(fields=["user", "created_at"]),
        ]