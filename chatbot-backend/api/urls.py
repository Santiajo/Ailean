from django.urls import path
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from .views import *

urlpatterns = [
    # Loguearse y obtener el tokens
    path('login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    
    # Renovar token sin loguearse de nuevo
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # Registrar nuevo usuario
    path('register/', RegisterView.as_view(), name='auth_register'),
]