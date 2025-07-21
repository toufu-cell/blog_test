from rest_framework import serializers
from django.utils.text import slugify
from .models import Article, Tag, ArticleLike, ArticleView
from accounts.serializers import UserSerializer


class TagSerializer(serializers.ModelSerializer):
    """タグシリアライザー"""
    
    article_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Tag
        fields = '__all__'
        read_only_fields = ['created_at']
    
    def get_article_count(self, obj):
        return obj.get_article_count()


class ArticleListSerializer(serializers.ModelSerializer):
    """記事一覧用シリアライザー"""
    
    author = UserSerializer(read_only=True)
    tags = TagSerializer(many=True, read_only=True)
    reading_time = serializers.ReadOnlyField()
    is_liked = serializers.SerializerMethodField()
    comment_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Article
        fields = [
            'id', 'title', 'slug', 'excerpt', 'author', 'tags',
            'status', 'featured_image', 'featured_image_alt', 'view_count',
            'like_count', 'share_count', 'comment_count', 'published_at', 'created_at',
            'updated_at', 'is_featured', 'is_pinned', 'reading_time', 'is_liked'
        ]
    
    def get_is_liked(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.likes.filter(user=request.user).exists()
        return False
    
    def get_comment_count(self, obj):
        """承認済みコメント数を取得"""
        return obj.comments.filter(is_approved=True).count()


class ArticleDetailSerializer(serializers.ModelSerializer):
    """記事詳細用シリアライザー"""
    
    author = UserSerializer(read_only=True)
    tags = TagSerializer(many=True, read_only=True)
    content_html = serializers.ReadOnlyField()
    reading_time = serializers.ReadOnlyField()
    is_liked = serializers.SerializerMethodField()
    related_articles = serializers.SerializerMethodField()
    comment_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Article
        fields = [
            'id', 'title', 'slug', 'excerpt', 'content', 'content_html',
            'author', 'tags', 'status', 'meta_title',
            'meta_description', 'og_title', 'og_description', 'og_image',
            'featured_image', 'featured_image_alt', 'view_count',
            'like_count', 'share_count', 'comment_count', 'published_at', 'created_at',
            'updated_at', 'allow_comments', 'is_featured', 'is_pinned',
            'reading_time', 'is_liked', 'related_articles'
        ]
    
    def get_is_liked(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.likes.filter(user=request.user).exists()
        return False
    
    def get_related_articles(self, obj):
        related = obj.get_related_articles()
        return ArticleListSerializer(related, many=True, context=self.context).data
    
    def get_comment_count(self, obj):
        """承認済みコメント数を取得"""
        return obj.comments.filter(is_approved=True).count()


class ArticleCreateUpdateSerializer(serializers.ModelSerializer):
    """記事作成・更新用シリアライザー"""
    
    tag_ids = serializers.ListField(
        child=serializers.CharField(),  # 文字列（新規タグ名）または数値（既存タグID）を受け入れ
        write_only=True,
        required=False
    )
    
    class Meta:
        model = Article
        fields = [
            'title', 'slug', 'excerpt', 'content', 'tag_ids',
            'status', 'meta_title', 'meta_description', 'og_title',
            'og_description', 'og_image', 'featured_image', 'featured_image_alt',
            'published_at', 'allow_comments', 'is_featured', 'is_pinned'
        ]
    
    def validate_slug(self, value):
        """スラグの重複チェック"""
        if value:
            queryset = Article.objects.all()
            if self.instance:
                queryset = queryset.exclude(pk=self.instance.pk)
            if queryset.filter(slug=value).exists():
                raise serializers.ValidationError("このスラグは既に使用されています。")
        return value
    
    def _process_tags(self, tag_data):
        """タグデータを処理して、Tagオブジェクトのリストを返す"""
        tags = []
        for item in tag_data:
            if isinstance(item, str):
                # 文字列の場合、新しいタグとして作成または既存タグを検索
                if item.isdigit():
                    # 数値文字列の場合はIDとして扱う
                    try:
                        tag = Tag.objects.get(id=int(item))
                        tags.append(tag)
                    except Tag.DoesNotExist:
                        continue
                else:
                    # タグ名として処理
                    tag, created = Tag.objects.get_or_create(
                        name=item,
                        defaults={'slug': slugify(item)}
                    )
                    tags.append(tag)
            elif isinstance(item, int):
                # 整数の場合、既存タグのIDとして処理
                try:
                    tag = Tag.objects.get(id=item)
                    tags.append(tag)
                except Tag.DoesNotExist:
                    continue
        return tags
    
    def create(self, validated_data):
        tag_data = validated_data.pop('tag_ids', [])
        
        # スラグを自動生成（空の場合）
        if not validated_data.get('slug'):
            validated_data['slug'] = slugify(validated_data['title'])
        
        article = Article.objects.create(**validated_data)
        
        # タグを処理・設定
        if tag_data:
            tags = self._process_tags(tag_data)
            article.tags.set(tags)
        
        return article
    
    def update(self, instance, validated_data):
        tag_data = validated_data.pop('tag_ids', None)
        
        # 記事を更新
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # タグを更新
        if tag_data is not None:
            tags = self._process_tags(tag_data)
            instance.tags.set(tags)
        
        return instance


class ArticleLikeSerializer(serializers.ModelSerializer):
    """記事いいねシリアライザー"""
    
    class Meta:
        model = ArticleLike
        fields = ['id', 'article', 'user', 'created_at']
        read_only_fields = ['user', 'created_at']


class ArticleViewSerializer(serializers.ModelSerializer):
    """記事閲覧履歴シリアライザー"""
    
    class Meta:
        model = ArticleView
        fields = ['id', 'article', 'user', 'ip_address', 'user_agent', 'created_at']
        read_only_fields = ['user', 'created_at'] 