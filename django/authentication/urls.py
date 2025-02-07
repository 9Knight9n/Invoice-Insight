from django.urls import path
from knox import views as knox_views

from .views import RegisterView, ProfileView, LoginView

urlpatterns = [
    path('register/', RegisterView.as_view(), name="create"),
    path('profile/', ProfileView.as_view(), name='profile'),
    path('login/', LoginView.as_view(), name='knox_login'),
    path('logout/', knox_views.LogoutView.as_view(), name='knox_logout'),
]
