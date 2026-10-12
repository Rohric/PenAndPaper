"""Tests for registration, login, logout and the own account."""

from django.urls import reverse
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase

from auth_app.models import User

PASSWORD = "test-pass-123"


def registration_data(**overrides):
    """Return valid registration input, optionally with changed fields."""
    data = {"username": "player_one", "password": PASSWORD, "repeated_password": PASSWORD}
    data.update(overrides)
    return data


class RegistrationTests(APITestCase):
    """Check the registration endpoint."""

    def test_registration_creates_player_and_returns_token(self):
        """Expect a new account, a token and no game master rights."""
        response = self.client.post(reverse("registration"), registration_data())
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("token", response.data)
        self.assertFalse(response.data["is_game_master"])

    def test_registration_ignores_game_master_flag(self):
        """Expect a player even when the request tries to set the flag."""
        self.client.post(reverse("registration"), registration_data(is_game_master=True))
        self.assertFalse(User.objects.get(username="player_one").is_game_master)

    def test_registration_rejects_different_passwords(self):
        """Expect a 400 when the repeated password does not match."""
        response = self.client.post(reverse("registration"), registration_data(repeated_password="other-pass-123"))
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("error", response.data)

    def test_registration_rejects_taken_username(self):
        """Expect a 400 when the username already exists."""
        User.objects.create_user(username="player_one", password=PASSWORD)
        response = self.client.post(reverse("registration"), registration_data())
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class SessionTests(APITestCase):
    """Check login, logout and the own account."""

    def setUp(self):
        """Create one account to log in with."""
        self.user = User.objects.create_user(username="player_one", password=PASSWORD)

    def _login(self):
        """Log in and send the token with every following request."""
        response = self.client.post(reverse("login"), {"username": "player_one", "password": PASSWORD})
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {response.data['token']}")
        return response

    def test_login_returns_token_and_account_data(self):
        """Expect the token and the account data after a correct login."""
        response = self._login()
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["username"], "player_one")

    def test_login_rejects_wrong_password(self):
        """Expect a 400 for a wrong password."""
        response = self.client.post(reverse("login"), {"username": "player_one", "password": "wrong-pass"})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_logout_deletes_token(self):
        """Expect the token to be gone after logout."""
        self._login()
        response = self.client.post(reverse("logout"))
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Token.objects.filter(user=self.user).exists())

    def test_me_requires_login(self):
        """Expect a 401 without a token."""
        self.assertEqual(self.client.get(reverse("me")).status_code, status.HTTP_401_UNAUTHORIZED)

    def test_me_shows_game_master_switch(self):
        """Expect the flag to appear once an admin has set it."""
        self._login()
        User.objects.filter(pk=self.user.pk).update(is_game_master=True)
        self.assertTrue(self.client.get(reverse("me")).data["is_game_master"])
