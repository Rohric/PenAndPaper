from rest_framework import generics
from user_auth_app.models import PlayerProfile
from .serializers import PlayerSerializer
from rest_framework.views import APIView
from rest_framework.authtoken.models import Token
from rest_framework.response import Response
from .serializers import RegistrationSerializer
from rest_framework import status
from django.contrib.auth import authenticate
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.contrib.auth.models import User


class PlayerProfileList(generics.ListCreateAPIView):
    queryset = PlayerProfile.objects.all()
    serializer_class = PlayerSerializer

    def get(self, request):
        return super().get(request)


class UserListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        users = User.objects.all().values('id', 'email', 'username')
        return Response(list(users))


class PlayerProfileDetail(generics.RetrieveUpdateDestroyAPIView):
    queryset = PlayerProfile.objects.all()
    serializer_class = PlayerSerializer


class RegistrationView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegistrationSerializer(data=request.data)

        if serializer.is_valid():
            user = serializer.save()
            token, _ = Token.objects.get_or_create(user=user)

            return Response({
                'token': token.key,
                'fullname': f"{user.first_name} {user.last_name}".strip(),
                'email': user.email,
                'user_id': user.id
            }, status=201)

        return Response(serializer.errors, status=400)


class LoginView(APIView):
    permission_classes = []

    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')

        if not email or not password:
            return Response(
                {"error": "Email and password required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        user = authenticate(username=email, password=password)

        if not user:
            return Response(
                {"error": "Invalid credentials"},
                status=status.HTTP_400_BAD_REQUEST
            )

        token, _ = Token.objects.get_or_create(user=user)

        return Response({
            "token": token.key,
            "fullname": f"{user.first_name} {user.last_name}".strip(),
            "email": user.email,
            "user_id": user.id
        }, status=status.HTTP_200_OK)


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        token = getattr(request.user, 'auth_token', None)

        if token:
            token.delete()

        return Response({"detail": "Logout erfolgreich. Token wurde gelöscht."}, status=status.HTTP_200_OK)
