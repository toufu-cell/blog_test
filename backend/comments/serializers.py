from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Comment, CommentLike, CommentReport
from accounts.serializers import UserSerializer

User = get_user_model()


class CommentSerializer(serializers.ModelSerializer):
    """コメント一覧・詳細用シリアライザー"""
    
    author = UserSerializer(read_only=True)
    replies = serializers.SerializerMethodField()
    is_liked = serializers.SerializerMethodField()
    can_reply = serializers.SerializerMethodField()
    
    class Meta:
        model = Comment
        fields = [
            'id', 'article', 'author', 'parent', 'content', 
            'is_approved', 'is_spam', 'is_edited', 'like_count',
            'created_at', 'updated_at', 'edited_at', 
            'replies', 'is_liked', 'can_reply', 'depth'
        ]
        read_only_fields = [
            'author', 'is_approved', 'is_spam', 'is_edited', 
            'like_count', 'created_at', 'updated_at', 'edited_at'
        ]
    
    def get_replies(self, obj):
        """子コメント（返信）を取得"""
        if hasattr(obj, 'prefetched_replies'):
            # prefetch_relatedを使用している場合
            replies = obj.prefetched_replies
        else:
            replies = obj.get_replies()
        
        return CommentSerializer(replies, many=True, context=self.context).data
    
    def get_is_liked(self, obj):
        """現在のユーザーがいいねしているかどうか"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.likes.filter(user=request.user).exists()
        return False
    
    def get_can_reply(self, obj):
        """返信可能かどうか"""
        return obj.can_reply()


class CommentCreateUpdateSerializer(serializers.ModelSerializer):
    """コメント作成・更新用シリアライザー"""
    
    class Meta:
        model = Comment
        fields = ['article', 'parent', 'content']
    
    def validate_parent(self, value):
        """親コメントの妥当性をチェック"""
        if value:
            # 親コメントが存在し、同じ記事に属するかチェック
            article = self.initial_data.get('article')
            if article and value.article.id != int(article):
                raise serializers.ValidationError(
                    "親コメントは同じ記事に属している必要があります。"
                )
            
            # 返信可能な深度かチェック
            if not value.can_reply():
                raise serializers.ValidationError(
                    "これ以上深いレベルの返信はできません。"
                )
        
        return value
    
    def validate_article(self, value):
        """記事がコメント可能かチェック"""
        if not value.allow_comments:
            raise serializers.ValidationError(
                "この記事にはコメントできません。"
            )
        
        if value.status != 'published':
            raise serializers.ValidationError(
                "公開された記事にのみコメントできます。"
            )
        
        return value


class CommentLikeSerializer(serializers.ModelSerializer):
    """コメントいいねシリアライザー"""
    
    class Meta:
        model = CommentLike
        fields = ['id', 'comment', 'user', 'created_at']
        read_only_fields = ['user', 'created_at']


class CommentReportSerializer(serializers.ModelSerializer):
    """コメント報告シリアライザー"""
    
    class Meta:
        model = CommentReport
        fields = [
            'id', 'comment', 'reporter', 'reason', 'description',
            'is_resolved', 'created_at'
        ]
        read_only_fields = ['reporter', 'is_resolved', 'created_at']


class CommentModerationSerializer(serializers.ModelSerializer):
    """コメント管理用シリアライザー（管理者用）"""
    
    author = UserSerializer(read_only=True)
    article_title = serializers.CharField(source='article.title', read_only=True)
    report_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Comment
        fields = [
            'id', 'article', 'article_title', 'author', 'parent', 'content',
            'is_approved', 'is_spam', 'is_edited', 'like_count',
            'ip_address', 'created_at', 'updated_at', 'report_count'
        ]
        read_only_fields = ['author', 'article', 'parent', 'created_at', 'updated_at']
    
    def get_report_count(self, obj):
        """報告数を取得"""
        return obj.reports.filter(is_resolved=False).count() 