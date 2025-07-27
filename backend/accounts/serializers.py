from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from .models import User, UserProfile


class UserRegistrationSerializer(serializers.ModelSerializer):
    """ユーザー登録用シリアライザー"""
    
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'password_confirm', 'first_name', 'last_name']
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError("パスワードが一致しません。")
        return attrs
    
    def create(self, validated_data):
        validated_data.pop('password_confirm')
        user = User.objects.create_user(**validated_data)
        return user


class UserLoginSerializer(serializers.Serializer):
    """ユーザーログイン用シリアライザー"""
    
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    
    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')
        
        if email and password:
            user = authenticate(email=email, password=password)
            if not user:
                raise serializers.ValidationError('メールアドレスまたはパスワードが正しくありません。')
            if not user.is_active:
                raise serializers.ValidationError('このアカウントは無効化されています。')
            attrs['user'] = user
            return attrs
        raise serializers.ValidationError('メールアドレスとパスワードの両方を入力してください。')


class UserProfileSerializer(serializers.ModelSerializer):
    """ユーザープロフィール用シリアライザー"""
    
    class Meta:
        model = UserProfile
        fields = '__all__'
        read_only_fields = ['user']


class UserSerializer(serializers.ModelSerializer):
    """ユーザー情報用シリアライザー"""
    
    profile = UserProfileSerializer(read_only=True)
    article_count = serializers.SerializerMethodField()
    comment_count = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'role', 'bio', 'avatar', 'website', 'twitter', 'github',
            'is_email_verified', 'created_at', 'updated_at',
            'profile', 'article_count', 'comment_count'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'is_email_verified']
    
    def get_article_count(self, obj):
        return obj.articles.filter(status='published').count()
    
    def get_comment_count(self, obj):
        return obj.comments.filter(is_approved=True).count()


class UserUpdateSerializer(serializers.ModelSerializer):
    """ユーザー情報更新用シリアライザー"""
    
    class Meta:
        model = User
        fields = [
            'username', 'first_name', 'last_name', 'bio', 
            'avatar', 'website', 'twitter', 'github'
        ]
    
    def validate_username(self, value):
        user = self.context['request'].user
        if User.objects.exclude(pk=user.pk).filter(username=value).exists():
            raise serializers.ValidationError("このユーザー名は既に使用されています。")
        return value


class ChangePasswordSerializer(serializers.Serializer):
    """パスワード変更用シリアライザー"""
    
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, validators=[validate_password])
    new_password_confirm = serializers.CharField(write_only=True)
    
    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("現在のパスワードが正しくありません。")
        return value
    
    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError("新しいパスワードが一致しません。")
        return attrs
    
    def save(self):
        user = self.context['request'].user
        user.set_password(self.validated_data['new_password'])
        user.save()
        return user


class PasswordResetRequestSerializer(serializers.Serializer):
    """パスワードリセット要求用シリアライザー"""
    
    email = serializers.EmailField()
    
    def validate_email(self, value):
        try:
            user = User.objects.get(email=value, is_active=True)
        except User.DoesNotExist:
            raise serializers.ValidationError("このメールアドレスは登録されていません。")
        return value


class PasswordResetConfirmSerializer(serializers.Serializer):
    """パスワードリセット実行用シリアライザー"""
    
    token = serializers.CharField()
    new_password = serializers.CharField(write_only=True, validators=[validate_password])
    new_password_confirm = serializers.CharField(write_only=True)
    
    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError("パスワードが一致しません。")
        return attrs


class AdminUserSerializer(serializers.ModelSerializer):
    """管理者用ユーザーシリアライザー"""
    
    profile = UserProfileSerializer(read_only=True)
    
    class Meta:
        model = User
        fields = '__all__'
        read_only_fields = ['id', 'password', 'last_login', 'date_joined']
    
    def update(self, instance, validated_data):
        # パスワードフィールドを除外して更新
        validated_data.pop('password', None)
        return super().update(instance, validated_data) 