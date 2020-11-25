from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils.translation import ugettext_lazy as _

class User(AbstractUser):
    first_name = None
    last_name = None
    email = None
    last_login = None
    date_joined = None
    last_report = models.CharField(_("Последний репорт"), max_length=20, blank=True)