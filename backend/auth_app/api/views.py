"""Authentication endpoints: registration, login, logout and the own account."""

from rest_framework import status
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from auth_app.utils import token_payload, user_payload

from .serializers import RegistrationSerializer


class RegistrationView(APIView):
    """Register a new player account and log it in."""

    permission_classes = [AllowAny]

    def post(self, request):
        """Create the account and return its token and data."""
        serializer = RegistrationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(token_payload(user), status=status.HTTP_201_CREATED)


class LoginView(ObtainAuthToken):
    """Check username and password and return the token and account data."""

    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        """Validate the credentials and answer with the login data."""
        serializer = self.serializer_class(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        return Response(token_payload(serializer.validated_data["user"]))


class LogoutView(APIView):
    """Log the requesting account out."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        """Delete the token so it can no longer be used."""
        request.user.auth_token.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class MeView(APIView):
    """Return the requesting account, so the frontend notices a new game master switch."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Return the current account data."""
        return Response(user_payload(request.user))
