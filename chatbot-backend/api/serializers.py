from django.contrib.auth.models import User
from rest_framework import serializers
from .models import UserProfile, ChatSession, ChatMessage, Mission, UserMission, Achievement, UserAchievement

class RegisterSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('username', 'password', 'email')
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email'),
            password=validated_data['password']
        )
        return user

class MissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Mission
        fields = '__all__'

class UserMissionSerializer(serializers.ModelSerializer):
    mission = MissionSerializer(read_only=True)
    class Meta:
        model = UserMission
        fields = ('id', 'mission', 'progress', 'completed', 'completed_at')

class AchievementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Achievement
        fields = '__all__'

class UserAchievementSerializer(serializers.ModelSerializer):
    achievement = AchievementSerializer(read_only=True)
    class Meta:
        model = UserAchievement
        fields = ('id', 'achievement', 'unlocked_at')

class UserProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    missions = UserMissionSerializer(source='user.missions', many=True, read_only=True)
    achievements = UserAchievementSerializer(source='user.achievements', many=True, read_only=True)
    
    class Meta:
        model = UserProfile
        fields = ('username', 'level', 'xp', 'streak', 'total_time_minutes', 'global_score', 'missions', 'achievements')

class ChatMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatMessage
        fields = ('id', 'role', 'content', 'created_at')

class ChatSessionSerializer(serializers.ModelSerializer):
    messages = ChatMessageSerializer(many=True, read_only=True)
    
    class Meta:
        model = ChatSession
        fields = ('id', 'title', 'created_at', 'updated_at', 'messages')