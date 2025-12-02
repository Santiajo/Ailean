from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import UserProfile
from .serializers import UserProfileSerializer

class ProgressView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        profile, created = UserProfile.objects.get_or_create(user=request.user)
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
        
        serializer = UserProfileSerializer(profile)
        return Response(serializer.data)
