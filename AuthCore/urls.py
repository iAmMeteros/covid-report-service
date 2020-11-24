from django.urls import path
from .views import *

urlpatterns = [
    path('login/', loginView),
    path('register/', registerView),
    path('logout/', logoutView),
]