# audit/signals.py
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from properties.models import Property, PropertyImage
from .models import AuditLog

# утилита: достаём request (если проложим его в thread-local)
def _get_request():
    try:
        from .threadlocal import get_current_request
        return get_current_request()
    except Exception:
        return None

def _write_log(action, instance, message=""):
    req = _get_request()
    AuditLog.objects.create(
        action=action,
        model=f"{instance._meta.app_label}.{instance._meta.model_name}",
        object_id=str(instance.pk),
        user=getattr(req, "user", None) if req and getattr(req, "user", None) and req.user.is_authenticated else None,
        ip=req.META.get("REMOTE_ADDR") if req else None,
        method=req.method if req else "",
        path=req.path if req else "",
        message=message[:255],
    )

@receiver(post_save, sender=Property)
def log_property_save(sender, instance, created, **kwargs):
    _write_log("created" if created else "updated", instance)

@receiver(post_delete, sender=Property)
def log_property_delete(sender, instance, **kwargs):
    _write_log("deleted", instance)

@receiver(post_save, sender=PropertyImage)
def log_image_save(sender, instance, created, **kwargs):
    _write_log("image_uploaded" if created else "updated", instance)

@receiver(post_delete, sender=PropertyImage)
def log_image_delete(sender, instance, **kwargs):
    _write_log("image_deleted", instance)
