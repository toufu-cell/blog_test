from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    UserRegistrationView,
    UserLoginView,
    UserLogoutView,
    UserProfileView,
    ChangePasswordView,
    UserDetailView,
    UserListView,
    UserViewSet,
    UserProfileDetailView,
)

app_name = 'accounts'

# API Router
router = DefaultRouter()
router.register(r'admin/users', UserViewSet, basename='admin-users')

urlpatterns = [
    # 認証関連
    path('auth/register/', UserRegistrationView.as_view(), name='register'),
    path('auth/login/', UserLoginView.as_view(), name='login'),
    path('auth/logout/', UserLogoutView.as_view(), name='logout'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # ユーザープロフィール
    path('profile/', UserProfileView.as_view(), name='profile'),
    path('profile/detail/', UserProfileDetailView.as_view(), name='profile-detail'),
    path('profile/change-password/', ChangePasswordView.as_view(), name='change-password'),
    
    # 公開ユーザー情報
    path('users/', UserListView.as_view(), name='user-list'),
    path('users/<str:username>/', UserDetailView.as_view(), name='user-detail'),
    
    # 管理者用API
    path('', include(router.urls)),
] 