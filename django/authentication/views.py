from django.contrib.auth import login
from rest_framework import generics, authentication, permissions
from rest_framework.authtoken.serializers import AuthTokenSerializer
from knox.views import LoginView as KnoxLoginView
from .serializers import UserSerializer, AuthSerializer
from subscription.serializers import CustomerSerializer
from django.forms.models import model_to_dict
from subscription.models import Customer


class RegisterView(generics.CreateAPIView):
    serializer_class = CustomerSerializer


class LoginView(KnoxLoginView):
    serializer_class = AuthSerializer
    permission_classes = (permissions.AllowAny,)

    def post(self, request, format=None):
        serializer = AuthTokenSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        login(request, user)
        response = super(LoginView, self).post(request, format=None)
        customer = Customer.objects.get(user=user)
        customer_dict = customer.__dict__
        response.data['username'] = user.username
        response.data['id'] = customer_dict['id']
        response.data['credit'] = customer_dict['credit']
        del response.data['expiry']
        return response


class ProfileView(generics.RetrieveUpdateAPIView):
    """Manage the authenticated user"""
    serializer_class = UserSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_object(self):
        """Retrieve and return authenticated user"""
        return self.request.user
