from django.contrib.auth import login
from django.contrib.auth.models import User
from rest_framework import generics, authentication, permissions
from rest_framework.authtoken.serializers import AuthTokenSerializer
from knox.views import LoginView as KnoxLoginView
from .serializers import UserSerializer, AuthSerializer
from rest_framework import permissions
from django.conf import settings


class RegisterView(generics.CreateAPIView):
    serializer_class = UserSerializer


class LoginView(KnoxLoginView):
    serializer_class = AuthSerializer
    permission_classes = (permissions.AllowAny,)

    def post(self, request, format=None):
        serializer = AuthTokenSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        login(request, user)
        response = super(LoginView, self).post(request, format=None)
        response.data['username'] = user.username
        return response



class ProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = (permissions.IsAuthenticated,) if settings.AUTH_ENABLED else (permissions.AllowAny,)

    def get_object(self):
        """Retrieve and return authenticated user"""
        if settings.AUTH_ENABLED:
            return self.request.user
        else:
            # Return a dummy user or handle the case when authentication is disabled
            return User.objects.first()  # Replace with your logic