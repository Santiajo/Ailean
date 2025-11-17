from django.urls import path
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

urlpatterns = [
    # Esta es la ruta de LOGIN. Next.js enviará usuario/pass aquí
    path('login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    
    # Esta sirve para renovar el token sin loguearse de nuevo
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]