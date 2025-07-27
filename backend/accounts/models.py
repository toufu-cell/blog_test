from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """カスタムユーザーモデル"""
    
    ROLE_CHOICES = [
        ('admin', '管理者'),
        ('editor', '編集者'),
    ]
    
    email = models.EmailField('メールアドレス', unique=True)
    role = models.CharField('権限', max_length=10, choices=ROLE_CHOICES, default='editor')
    bio = models.TextField('自己紹介', blank=True, max_length=500)
    avatar = models.ImageField('アバター', upload_to='avatars/', blank=True, null=True)
    website = models.URLField('ウェブサイト', blank=True)
    twitter = models.CharField('Twitter', max_length=50, blank=True)
    github = models.CharField('GitHub', max_length=50, blank=True)
    is_email_verified = models.BooleanField('メール認証済み', default=False)
    created_at = models.DateTimeField('作成日時', auto_now_add=True)
    updated_at = models.DateTimeField('更新日時', auto_now=True)
    
    # Django標準の権限システムを無効化
    groups = None
    user_permissions = None
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']
    
    class Meta:
        verbose_name = 'ユーザー'
        verbose_name_plural = 'ユーザー'
        db_table = 'accounts_user'
    
    def __str__(self):
        return f"{self.username} ({self.email})"
    
    @property
    def is_admin(self):
        return self.role == 'admin'
    
    @property
    def is_editor(self):
        return self.role in ['admin', 'editor']
    
    @property
    def is_author(self):
        # 全ユーザーが記事投稿可能（editorに統合）
        return self.role in ['admin', 'editor']
    
    @property
    def can_publish(self):
        # 全ユーザーが記事公開可能
        return self.role in ['admin', 'editor']
    
    @property
    def can_delete_others_posts(self):
        return self.role == 'admin'


class UserProfile(models.Model):
    """ユーザープロファイル追加情報"""
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    birth_date = models.DateField('生年月日', blank=True, null=True)
    phone = models.CharField('電話番号', max_length=20, blank=True)
    address = models.TextField('住所', blank=True)
    notification_email = models.BooleanField('メール通知', default=True)
    notification_push = models.BooleanField('プッシュ通知', default=True)
    privacy_public_profile = models.BooleanField('プロフィール公開', default=True)
    privacy_show_email = models.BooleanField('メールアドレス公開', default=False)
    
    class Meta:
        verbose_name = 'ユーザープロフィール'
        verbose_name_plural = 'ユーザープロフィール'
        db_table = 'accounts_user_profile'
    
    def __str__(self):
        return f"{self.user.username} のプロフィール"
