from django.shortcuts import render
from rest_framework import generics, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import logout
from .models import User, UserProfile
from .serializers import (
    UserRegistrationSerializer,
    UserLoginSerializer,
    UserSerializer,
    UserUpdateSerializer,
    ChangePasswordSerializer,
    AdminUserSerializer,
    UserProfileSerializer
)


class UserRegistrationView(generics.CreateAPIView):
    """ユーザー登録API"""
    
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        # JWT トークンを生成
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'user': UserSerializer(user).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        }, status=status.HTTP_201_CREATED)


class UserLoginView(TokenObtainPairView):
    """ユーザーログインAPI"""
    
    serializer_class = UserLoginSerializer
    
    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'user': UserSerializer(user).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        })


class UserLogoutView(generics.GenericAPIView):
    """ユーザーログアウトAPI"""
    
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, *args, **kwargs):
        try:
            refresh_token = request.data.get('refresh_token')
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({'message': 'ログアウトしました。'}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': 'トークンが無効です。'}, status=status.HTTP_400_BAD_REQUEST)


class UserProfileView(generics.RetrieveUpdateAPIView):
    """ユーザープロフィール取得・更新API"""
    
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        return self.request.user
    
    def get_serializer_class(self):
        if self.request.method == 'PUT' or self.request.method == 'PATCH':
            return UserUpdateSerializer
        return UserSerializer


class ChangePasswordView(generics.UpdateAPIView):
    """パスワード変更API"""
    
    serializer_class = ChangePasswordSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        return self.request.user
    
    def update(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({'message': 'パスワードが変更されました。'})


class UserDetailView(generics.RetrieveAPIView):
    """ユーザー詳細情報取得API（公開プロフィール）"""
    
    queryset = User.objects.filter(is_active=True)
    serializer_class = UserSerializer
    lookup_field = 'username'
    permission_classes = [permissions.AllowAny]


class UserListView(generics.ListAPIView):
    """ユーザー一覧取得API（公開プロフィール）"""
    
    queryset = User.objects.filter(is_active=True)
    serializer_class = UserSerializer
    permission_classes = [permissions.AllowAny]
    filterset_fields = ['role']
    search_fields = ['username', 'first_name', 'last_name']
    ordering_fields = ['created_at', 'username']
    ordering = ['-created_at']


class UserViewSet(ModelViewSet):
    """管理者用ユーザー管理API"""
    
    queryset = User.objects.all()
    serializer_class = AdminUserSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['role', 'is_active', 'is_staff']
    search_fields = ['username', 'email', 'first_name', 'last_name']
    ordering_fields = ['created_at', 'username', 'email']
    ordering = ['-created_at']
    
    def get_permissions(self):
        """アクションに応じて権限を変更"""
        if self.action in ['list', 'retrieve']:
            # 一覧・詳細は編集者以上
            self.permission_classes = [permissions.IsAuthenticated]
        else:
            # 作成・更新・削除は管理者のみ
            self.permission_classes = [permissions.IsAuthenticated]
        return super().get_permissions()
    
    def get_queryset(self):
        """ユーザーの権限に応じてクエリセットを制限"""
        user = self.request.user
        if user.is_admin:
            return User.objects.all()
        elif user.is_editor:
            return User.objects.filter(role__in=['reader', 'author'])
        else:
            return User.objects.none()
    
    @action(detail=True, methods=['post'])
    def toggle_active(self, request, pk=None):
        """ユーザーのアクティブ状態を切り替え"""
        user = self.get_object()
        user.is_active = not user.is_active
        user.save()
        return Response({
            'message': f"ユーザー {user.username} が{'有効' if user.is_active else '無効'}になりました。"
        })
    
    @action(detail=True, methods=['post'])
    def change_role(self, request, pk=None):
        """ユーザーの権限を変更"""
        user = self.get_object()
        new_role = request.data.get('role')
        
        if new_role not in [choice[0] for choice in User.ROLE_CHOICES]:
            return Response({'error': '無効な権限です。'}, status=status.HTTP_400_BAD_REQUEST)
        
        user.role = new_role
        user.save()
        
        return Response({
            'message': f"ユーザー {user.username} の権限が {user.get_role_display()} に変更されました。"
        })


class UserProfileDetailView(generics.RetrieveUpdateAPIView):
    """ユーザープロフィール詳細管理API"""
    
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        profile, created = UserProfile.objects.get_or_create(user=self.request.user)
        return profile
