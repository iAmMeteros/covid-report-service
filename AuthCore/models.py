from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils.translation import ugettext_lazy as _

class User(AbstractUser):
    first_name = None
    last_name = None
    is_verified = models.BooleanField(_('is account verified'), default=False)
    email = None
    last_login = None
    date_joined = None