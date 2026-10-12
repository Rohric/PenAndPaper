"""Serializers for registration."""

from rest_framework import serializers

from auth_app.models import User

MIN_PASSWORD_LENGTH = 6


class RegistrationSerializer(serializers.ModelSerializer):
    """Validate registration input and create a new player account."""

    password = serializers.CharField(write_only=True, min_length=MIN_PASSWORD_LENGTH)
    repeated_password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ["id", "username", "password", "repeated_password"]

    def validate(self, data):
        """Check that both password entries match."""
        if data["password"] != data["repeated_password"]:
            raise serializers.ValidationError({"repeated_password": "Die Passwörter stimmen nicht überein."})
        return data

    def create(self, validated_data):
        """Create the account with a hashed password; it always starts as a player."""
        validated_data.pop("repeated_password")
        return User.objects.create_user(**validated_data)
