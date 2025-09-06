from django.core.files.storage import FileSystemStorage
from django.conf import settings
import os

class PrivateMediaStorage(FileSystemStorage):
    """
    Файлы лежат в PRIVATE_MEDIA_ROOT, ссылки наружу НЕ отдаём.
    Доставать файлы только через защищённый вью.
    """
    def __init__(self, *args, **kwargs):
        location = getattr(settings, 'PRIVATE_MEDIA_ROOT')
        base_url = None  # у приватных файлов нет публичного URL
        super().__init__(location=location, base_url=base_url, *args, **kwargs)

    # на всякий случай, не строим публичные URL
    def url(self, name):
        raise NotImplementedError("Private files don't have public URLs")
