from django.urls import path
from .views import RegisterView
from .views_openai import ChatView
from .views_gamification import ProgressView
from .views_chat import SessionListView, SessionDetailView, MessageListView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView # Kept for potential future use or if LoginView is not a direct replacement

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', TokenObtainPairView.as_view(), name='login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('chat/', ChatView.as_view(), name='chat'),
    path('progress/', ProgressView.as_view(), name='progress'),
    
    # Chat Persistence
    path('sessions/', SessionListView.as_view(), name='session-list'),
    path('sessions/<int:pk>/', SessionDetailView.as_view(), name='session-detail'),
    path('sessions/<int:session_id>/messages/', MessageListView.as_view(), name='message-list'),
]