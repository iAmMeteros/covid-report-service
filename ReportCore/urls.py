from django.urls import path
from .views import *

urlpatterns = [
    path('report/', reportCreate),
    path('map/', mapView),
    path('', indexView),
    path('radar/', radarView),
    path('api/placescan/', getPlaces),
]