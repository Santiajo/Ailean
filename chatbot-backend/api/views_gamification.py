from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import UserProfile, Mission, UserMission, Achievement, UserAchievement
from .serializers import UserProfileSerializer

class ProgressView(APIView):
    permission_classes = [IsAuthenticated]

    def check_missions(self, user, profile):
        # Check Missions (Simple Check on every update)
        user_missions = UserMission.objects.filter(user=user, completed=False)
        for um in user_missions:
            if um.mission.condition_type == 'time_spent':
                um.progress = int(profile.total_time_minutes)
                if um.progress >= um.mission.condition_value:
                    um.completed = True
                    um.completed_at = profile.last_activity # approximate
                    profile.xp += um.mission.xp_reward
            elif um.mission.condition_type == 'login_streak':
                um.progress = profile.streak
                if um.progress >= um.mission.condition_value:
                    um.completed = True
                    um.completed_at = profile.last_activity
                    profile.xp += um.mission.xp_reward
            elif um.mission.condition_type == 'message_count':
                from .models import ChatMessage
                total_messages = ChatMessage.objects.filter(session__user=user, role='user').count()
                um.progress = total_messages
                if um.progress >= um.mission.condition_value:
                    um.completed = True
                    um.completed_at = profile.last_activity
                    profile.xp += um.mission.xp_reward
            
            um.save()
        profile.save()

    def get(self, request):
        profile, created = UserProfile.objects.get_or_create(user=request.user)
        
        # Ensure UserMissions exist for all Missions
        all_missions = Mission.objects.all()
        for mission in all_missions:
            UserMission.objects.get_or_create(user=request.user, mission=mission)
            
        # Calculate Global Score (Simple Formula)
        # Score = (XP / 1000) * 50 + (Streak * 2) + (Level * 5)
        # Capped at 100
        raw_score = (profile.xp / 1000) * 50 + (profile.streak * 2) + (profile.level * 5)
        profile.global_score = min(int(raw_score), 100)
        profile.save()

        # Check Missions on GET too
        self.check_missions(request.user, profile)

        serializer = UserProfileSerializer(profile)
        return Response(serializer.data)

    def post(self, request):
        # Endpoint to update progress (e.g., add XP, time)
        profile, created = UserProfile.objects.get_or_create(user=request.user)
        
        # Simple logic: Add XP and Time
        xp_gain = request.data.get('xp', 0)
        time_gain = request.data.get('time', 0)
        
        profile.xp += int(xp_gain)
        profile.total_time_minutes += float(time_gain)
        
        # Level up logic (simple: 100 XP per level)
        new_level = 1 + (profile.xp // 100)
        if new_level > profile.level:
            profile.level = new_level
            # Could return a "level_up": True flag here
            
        profile.save()
        
        self.check_missions(request.user, profile)
        
        serializer = UserProfileSerializer(profile)
        return Response(serializer.data)
