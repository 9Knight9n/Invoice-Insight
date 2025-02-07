from knox.auth import TokenAuthentication
from rest_framework import exceptions

class BearerTokenAuthentication(TokenAuthentication):
    """
    Custom authentication class to use 'Bearer' prefix instead of 'Token'.
    """
    keyword = 'Bearer'  # Use 'Bearer' as the keyword

    def authenticate_credentials(self, token):
        """
        Authenticate the token and return the user.
        """
        try:
            user, auth_token = super().authenticate_credentials(token)
        except exceptions.AuthenticationFailed:
            raise exceptions.AuthenticationFailed('Invalid token.')

        return user, auth_token