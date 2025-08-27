from django.shortcuts import render
from rest_framework.generics import CreateAPIView
from rest_framework.permissions import AllowAny
from .serializers import RegisterSerializer
# Create your views here.
from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .serializers import LoginByEmailSerializer, ForgotPasswordSerializer, ResetPasswordSerializer
from django.contrib.auth import get_user_model

from rest_framework import status, views
from rest_framework.response import Response

User = get_user_model() 

class LoginView(TokenObtainPairView):
    serializer_class = LoginByEmailSerializer
    permission_classes = [permissions.AllowAny]

class RefreshView(TokenRefreshView):
    permission_classes = [permissions.AllowAny]

class MeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        u = request.user
        return Response({
            "id": u.id,
            "username": u.username,
            "email": u.email,
            "role": getattr(u, "role", None),
        })

class RegisterView(CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

class ForgotPasswordView(views.APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        s = ForgotPasswordSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        s.save()  # всегда 200
        return Response({"ok": True})

class ResetPasswordView(views.APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        s = ResetPasswordSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        s.save()
        return Response({"ok": True})