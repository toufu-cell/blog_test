from rest_framework import serializers
from django.utils.text import slugify
from .models import Article, Category, Tag, ArticleLike, ArticleView
from accounts.serializers import UserSerializer


class CategorySerializer(serializers.ModelSerializer):
    """カテゴリシリアライザー"""
    
    article_count = serializers.SerializerMethodField()
    full_path = serializers.ReadOnlyField()
    children = serializers.SerializerMethodField()
    
    class Meta:
        model = Category
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']
    
    def get_article_count(self, obj):
        return obj.get_article_count()
    
    def get_children(self, obj):
        if obj.children.exists():
            return CategorySerializer(obj.children.filter(is_active=True), many=True).data
        return []


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
    category = CategorySerializer(read_only=True)
    tags = TagSerializer(many=True, read_only=True)
    reading_time = serializers.ReadOnlyField()
    is_liked = serializers.SerializerMethodField()
    comment_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Article
        fields = [
            'id', 'title', 'slug', 'excerpt', 'author', 'category', 'tags',
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
    category = CategorySerializer(read_only=True)
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
            'author', 'category', 'tags', 'status', 'meta_title',
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
    
    category_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    tag_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False
    )
    
    class Meta:
        model = Article
        fields = [
            'title', 'slug', 'excerpt', 'content', 'category_id', 'tag_ids',
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
    
    def create(self, validated_data):
        category_id = validated_data.pop('category_id', None)
        tag_ids = validated_data.pop('tag_ids', [])
        
        # カテゴリを設定
        if category_id:
            try:
                category = Category.objects.get(id=category_id)
                validated_data['category'] = category
            except Category.DoesNotExist:
                raise serializers.ValidationError("指定されたカテゴリが存在しません。")
        
        # スラグを自動生成（空の場合）
        if not validated_data.get('slug'):
            validated_data['slug'] = slugify(validated_data['title'])
        
        article = Article.objects.create(**validated_data)
        
        # タグを設定
        if tag_ids:
            tags = Tag.objects.filter(id__in=tag_ids)
            article.tags.set(tags)
        
        return article
    
    def update(self, instance, validated_data):
        category_id = validated_data.pop('category_id', None)
        tag_ids = validated_data.pop('tag_ids', None)
        
        # カテゴリを更新
        if category_id is not None:
            if category_id:
                try:
                    category = Category.objects.get(id=category_id)
                    validated_data['category'] = category
                except Category.DoesNotExist:
                    raise serializers.ValidationError("指定されたカテゴリが存在しません。")
            else:
                validated_data['category'] = None
        
        # 記事を更新
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # タグを更新
        if tag_ids is not None:
            tags = Tag.objects.filter(id__in=tag_ids)
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