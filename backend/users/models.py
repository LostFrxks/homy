from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    class Role(models.TextChoices):
        ADMIN = "admin", "Admin"
        MANAGER = "manager", "Manager"
        REALTOR = "realtor", "Realtor"

    role = models.CharField(max_length=20, choices=Role.choices, default=Role.REALTOR)

    def __str__(self):
        return f"{self.username} ({self.role})"