from django.contrib.auth.models import AbstractUser
from django.db import models
from django.contrib.auth.validators import UnicodeUsernameValidator
from django.conf import settings
from django.utils import timezone
import secrets

class User(AbstractUser):
    username_validator = UnicodeUsernameValidator()
    class Role(models.TextChoices):
        ADMIN = "admin", "Admin"
        MANAGER = "manager", "Manager"
        REALTOR = "realtor", "Realtor"

    role = models.CharField(max_length=20, choices=Role.choices, default=Role.REALTOR)

    def __str__(self):
        return f"{self.username} ({self.role})"

class PasswordResetCode(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    code = models.CharField(max_length=6)          # "012345"
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    used = models.BooleanField(default=False)

    @staticmethod
    def generate_code():
        return f"{secrets.randbelow(10**6):06d}"   # 6-значный

    def is_valid(self):
        return (not self.used) and timezone.now() <= self.expires_a
    
    
    class Meta:
        indexes = [models.Index(fields=["user", "-created_at"])]