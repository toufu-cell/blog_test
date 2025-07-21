from django.db import models
from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils.text import slugify
from django.utils import timezone
import markdown
from django.utils.html import mark_safe

User = get_user_model()


class Tag(models.Model):
    """記事タグ"""
    
    name = models.CharField('タグ名', max_length=50, unique=True)
    slug = models.SlugField('スラグ', max_length=50, unique=True, blank=True)
    description = models.TextField('説明', blank=True)
    color = models.CharField('カラーコード', max_length=7, default='#6c757d')
    is_active = models.BooleanField('有効', default=True)
    created_at = models.DateTimeField('作成日時', auto_now_add=True)
    
    class Meta:
        verbose_name = 'タグ'
        verbose_name_plural = 'タグ'
        ordering = ['name']
        db_table = 'blog_tag'
    
    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)
    
    def __str__(self):
        return self.name
    
    def get_article_count(self):
        """このタグが付けられた記事数"""
        return self.articles.filter(status='published').count()


class ArticleManager(models.Manager):
    """記事モデル用のカスタムマネージャー"""
    
    def published(self):
        """公開済み記事のみを取得"""
        return self.filter(status='published', published_at__lte=timezone.now())
    
    def drafts(self):
        """下書き記事のみを取得"""
        return self.filter(status='draft')
    
    def by_author(self, author):
        """特定の著者の記事を取得"""
        return self.filter(author=author)


class Article(models.Model):
    """記事モデル"""
    
    STATUS_CHOICES = [
        ('draft', '下書き'),
        ('published', '公開'),
        ('private', '非公開'),
        ('scheduled', '予約投稿'),
    ]
    
    title = models.CharField('タイトル', max_length=200)
    slug = models.SlugField('スラグ', max_length=200, unique=True, blank=True)
    excerpt = models.TextField('要約', max_length=300, blank=True)
    content = models.TextField('本文')
    author = models.ForeignKey(
        User, 
        verbose_name='著者', 
        on_delete=models.CASCADE,
        related_name='articles'
    )
    tags = models.ManyToManyField(
        Tag, 
        verbose_name='タグ', 
        blank=True,
        related_name='articles'
    )
    status = models.CharField(
        '状態', 
        max_length=20, 
        choices=STATUS_CHOICES, 
        default='draft'
    )
    
    # SEO関連フィールド
    meta_title = models.CharField('メタタイトル', max_length=60, blank=True)
    meta_description = models.CharField('メタディスクリプション', max_length=160, blank=True)
    og_title = models.CharField('OGタイトル', max_length=60, blank=True)
    og_description = models.CharField('OGディスクリプション', max_length=160, blank=True)
    og_image = models.ImageField('OG画像', upload_to='og_images/', blank=True, null=True)
    
    # 画像・メディア
    featured_image = models.ImageField('アイキャッチ画像', upload_to='articles/', blank=True, null=True)
    featured_image_alt = models.CharField('アイキャッチ画像alt', max_length=100, blank=True)
    
    # 統計情報
    view_count = models.PositiveIntegerField('表示回数', default=0)
    like_count = models.PositiveIntegerField('いいね数', default=0)
    share_count = models.PositiveIntegerField('シェア数', default=0)
    
    # 日時情報
    published_at = models.DateTimeField('公開日時', null=True, blank=True)
    created_at = models.DateTimeField('作成日時', auto_now_add=True)
    updated_at = models.DateTimeField('更新日時', auto_now=True)
    
    # 設定
    allow_comments = models.BooleanField('コメント許可', default=True)
    is_featured = models.BooleanField('注目記事', default=False)
    is_pinned = models.BooleanField('ピン留め', default=False)
    
    objects = ArticleManager()
    
    class Meta:
        verbose_name = '記事'
        verbose_name_plural = '記事'
        ordering = ['-published_at', '-created_at']
        db_table = 'blog_article'
        indexes = [
            models.Index(fields=['status', 'published_at']),
            models.Index(fields=['author', 'status']),
        ]
    
    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title)
        
        # 公開時に公開日時を自動設定
        if self.status == 'published' and not self.published_at:
            self.published_at = timezone.now()
        
        # SEOメタデータの自動生成
        if not self.meta_title:
            self.meta_title = self.title[:60]
        
        if not self.meta_description and self.excerpt:
            self.meta_description = self.excerpt[:160]
        
        super().save(*args, **kwargs)
    
    def __str__(self):
        return self.title
    
    def get_absolute_url(self):
        return reverse('blog:article_detail', kwargs={'slug': self.slug})
    
    @property
    def is_published(self):
        return self.status == 'published' and self.published_at <= timezone.now()
    
    @property
    def content_html(self):
        """MarkdownをHTMLに変換"""
        return mark_safe(markdown.markdown(
            self.content,
            extensions=['markdown.extensions.codehilite', 'markdown.extensions.fenced_code']
        ))
    
    @property
    def reading_time(self):
        """読了時間を計算（分）"""
        words_per_minute = 200  # 日本語の平均読解速度
        word_count = len(self.content.split())
        return max(1, round(word_count / words_per_minute))
    
    def get_related_articles(self, limit=5):
        """関連記事を取得（タグベースで検索）"""
        if not self.tags.exists():
            return Article.objects.published().exclude(id=self.id)[:limit]
        
        # 共通のタグを持つ記事を取得
        tag_ids = list(self.tags.values_list('id', flat=True))
        return Article.objects.published().filter(
            tags__in=tag_ids
        ).exclude(id=self.id).distinct()[:limit]
    
    def increment_view_count(self):
        """表示回数をインクリメント"""
        self.view_count += 1
        self.save(update_fields=['view_count'])


class ArticleLike(models.Model):
    """記事のいいね"""
    
    article = models.ForeignKey(Article, on_delete=models.CASCADE, related_name='likes')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['article', 'user']
        verbose_name = '記事いいね'
        verbose_name_plural = '記事いいね'
        db_table = 'blog_article_like'
    
    def __str__(self):
        return f"{self.user.username} - {self.article.title}"


class ArticleView(models.Model):
    """記事の閲覧履歴"""
    
    article = models.ForeignKey(Article, on_delete=models.CASCADE, related_name='views')
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    ip_address = models.GenericIPAddressField('IPアドレス')
    user_agent = models.TextField('ユーザーエージェント', blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = '記事閲覧'
        verbose_name_plural = '記事閲覧'
        db_table = 'blog_article_view'
        indexes = [
            models.Index(fields=['article', 'created_at']),
        ]
    
    def __str__(self):
        return f"{self.article.title} - {self.ip_address}"
