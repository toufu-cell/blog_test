from django.shortcuts import render
from rest_framework import generics, status, permissions
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.db.models import Q, F, Count, Sum, Avg
from django.utils import timezone
from datetime import datetime, timedelta
from django.contrib.auth import get_user_model
from .models import Article, Tag, ArticleLike, ArticleView
from comments.models import Comment
from .serializers import (
    ArticleListSerializer,
    ArticleDetailSerializer,
    ArticleCreateUpdateSerializer,
    TagSerializer,
    ArticleLikeSerializer,
    ArticleViewSerializer
)
from .permissions import IsAuthorOrReadOnly, CanPublishOrReadOnly

User = get_user_model()


class TagViewSet(ModelViewSet):
    """タグ管理API"""
    
    queryset = Tag.objects.filter(is_active=True)
    serializer_class = TagSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']
    
    def get_permissions(self):
        """読み取りは全ユーザー、書き込みは投稿者以上"""
        if self.action in ['list', 'retrieve']:
            self.permission_classes = [permissions.AllowAny]
        else:
            self.permission_classes = [permissions.IsAuthenticated]
        return super().get_permissions()
    
    def perform_create(self, serializer):
        # 全認証ユーザーがタグ作成可能
        serializer.save()


class ArticleViewSet(ModelViewSet):
    """記事管理API"""
    
    queryset = Article.objects.all()
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsAuthorOrReadOnly, CanPublishOrReadOnly]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'tags', 'author', 'is_featured', 'is_pinned']
    search_fields = ['title', 'excerpt', 'content']
    ordering_fields = ['published_at', 'created_at', 'updated_at', 'view_count', 'like_count']
    ordering = ['-published_at', '-created_at']
    
    def get_queryset(self):
        """ユーザーと記事の状態に応じてクエリセットを制限"""
        queryset = Article.objects.all()
        user = self.request.user
        
        # 管理画面での記事一覧表示の場合（認証が必要なアクション）
        if self.action in ['list'] and user.is_authenticated:
            if user.is_admin:
                # 管理者のみ全ての記事を管理可能
                return queryset
            else:
                # 編集者・投稿者は自分の記事のみ管理可能
                return queryset.filter(author=user)
        
        # 記事詳細表示の場合
        elif self.action == 'retrieve':
            if user.is_authenticated:
                if user.is_admin:
                    # 管理者は全ての記事を閲覧可能
                    return queryset
                else:
                    # 編集者は公開記事と自分の記事を閲覧可能
                    return queryset.filter(
                        Q(status='published') | Q(author=user)
                    )
            else:
                # 未認証ユーザーは公開記事のみ
                return queryset.filter(status='published')
        
        # 作成・編集・削除の場合
        elif self.action in ['create', 'update', 'partial_update', 'destroy']:
            if user.is_authenticated:
                if user.is_admin:
                    # 管理者のみ全ての記事を操作可能
                    return queryset
                else:
                    # 編集者は自分の記事のみ操作可能
                    return queryset.filter(author=user)
        
        # その他のアクション（未認証時など）
        return queryset.filter(status='published')
    
    def get_serializer_class(self):
        """アクションに応じてシリアライザーを変更"""
        if self.action == 'retrieve':
            return ArticleDetailSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return ArticleCreateUpdateSerializer
        return ArticleListSerializer
    
    def get_permissions(self):
        """読み取りは制限付きで全ユーザー、書き込みは認証ユーザーのみ"""
        if self.action in ['list', 'retrieve']:
            self.permission_classes = [permissions.AllowAny]
        else:
            self.permission_classes = [permissions.IsAuthenticated, IsAuthorOrReadOnly, CanPublishOrReadOnly]
        return super().get_permissions()
    
    def perform_create(self, serializer):
        """記事作成時の処理"""
        # 全認証ユーザーが記事作成可能
        serializer.save(author=self.request.user)
    
    def retrieve(self, request, *args, **kwargs):
        """記事詳細取得時に閲覧数をカウント"""
        instance = self.get_object()
        
        # 閲覧履歴を記録
        if request.user.is_authenticated:
            ArticleView.objects.get_or_create(
                article=instance,
                user=request.user,
                ip_address=self.get_client_ip(request),
                defaults={'user_agent': request.META.get('HTTP_USER_AGENT', '')}
            )
        else:
            ArticleView.objects.get_or_create(
                article=instance,
                user=None,
                ip_address=self.get_client_ip(request),
                defaults={'user_agent': request.META.get('HTTP_USER_AGENT', '')}
            )
        
        # 閲覧数をインクリメント
        instance.increment_view_count()
        
        serializer = self.get_serializer(instance)
        return Response(serializer.data)
    
    def get_client_ip(self, request):
        """クライアントのIPアドレスを取得"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def like(self, request, pk=None):
        """記事にいいねを付ける/外す"""
        article = self.get_object()
        user = request.user
        
        like, created = ArticleLike.objects.get_or_create(article=article, user=user)
        
        if not created:
            # 既にいいねしている場合は削除
            like.delete()
            article.like_count = F('like_count') - 1
            article.save(update_fields=['like_count'])
            return Response({'message': 'いいねを取り消しました。', 'liked': False})
        else:
            # いいねを追加
            article.like_count = F('like_count') + 1
            article.save(update_fields=['like_count'])
            return Response({'message': 'いいねしました。', 'liked': True})
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def toggle_featured(self, request, pk=None):
        """記事の注目フラグを切り替え（管理者のみ）"""
        if not request.user.is_admin:
            raise permissions.PermissionDenied("この操作の権限がありません。")
        
        article = self.get_object()
        article.is_featured = not article.is_featured
        article.save(update_fields=['is_featured'])
        
        return Response({
            'message': f"記事が{'注目記事' if article.is_featured else '通常記事'}に設定されました。",
            'is_featured': article.is_featured
        })
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def toggle_pinned(self, request, pk=None):
        """記事のピン留めフラグを切り替え（管理者のみ）"""
        if not request.user.is_admin:
            raise permissions.PermissionDenied("この操作の権限がありません。")
        
        article = self.get_object()
        article.is_pinned = not article.is_pinned
        article.save(update_fields=['is_pinned'])
        
        return Response({
            'message': f"記事が{'ピン留め' if article.is_pinned else 'ピン留め解除'}されました。",
            'is_pinned': article.is_pinned
        })
    
    @action(detail=False, methods=['get'])
    def featured(self, request):
        """注目記事一覧"""
        articles = self.get_queryset().filter(is_featured=True, status='published')
        page = self.paginate_queryset(articles)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(articles, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def pinned(self, request):
        """ピン留め記事一覧"""
        articles = self.get_queryset().filter(is_pinned=True, status='published')
        serializer = self.get_serializer(articles, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def popular(self, request):
        """人気記事一覧（閲覧数順）"""
        articles = self.get_queryset().filter(status='published').order_by('-view_count')
        page = self.paginate_queryset(articles)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(articles, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def recent(self, request):
        """最新記事一覧"""
        articles = self.get_queryset().filter(status='published').order_by('-published_at')
        page = self.paginate_queryset(articles)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(articles, many=True)
        return Response(serializer.data)


# 個別のビューも必要に応じて作成
class PublicArticleListView(generics.ListAPIView):
    """公開記事一覧API（認証不要）"""
    
    queryset = Article.objects.filter(status='published')
    serializer_class = ArticleListSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['tags', 'author', 'is_featured']
    search_fields = ['title', 'excerpt', 'content']
    ordering_fields = ['published_at', 'view_count', 'like_count']
    ordering = ['-published_at']


class PublicArticleDetailView(generics.RetrieveAPIView):
    """公開記事詳細API（認証不要）"""
    
    queryset = Article.objects.filter(status='published')
    serializer_class = ArticleDetailSerializer
    lookup_field = 'slug'
    permission_classes = [permissions.AllowAny]
    
    def retrieve(self, request, *args, **kwargs):
        """記事詳細取得時に閲覧数をカウント"""
        instance = self.get_object()
        
        # 閲覧履歴を記録（未認証ユーザー用）
        ArticleView.objects.create(
            article=instance,
            user=request.user if request.user.is_authenticated else None,
            ip_address=self.get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', '')
        )
        
        # 閲覧数をインクリメント
        instance.increment_view_count()
        
        serializer = self.get_serializer(instance)
        return Response(serializer.data)
    
    def get_client_ip(self, request):
        """クライアントのIPアドレスを取得"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


# 統計・分析API
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def user_analytics(request):
    """ユーザー個人の統計データAPI"""
    user = request.user
    
    # 基本統計
    articles = Article.objects.filter(author=user, status='published')
    total_articles = articles.count()
    total_views = articles.aggregate(Sum('view_count'))['view_count__sum'] or 0
    total_likes = articles.aggregate(Sum('like_count'))['like_count__sum'] or 0
    total_comments = Comment.objects.filter(article__author=user, is_approved=True).count()
    
    # 最近30日の記事投稿数
    thirty_days_ago = timezone.now() - timedelta(days=30)
    recent_articles = articles.filter(published_at__gte=thirty_days_ago).count()
    
    # 人気記事トップ5
    popular_articles = articles.order_by('-view_count')[:5].values(
        'id', 'title', 'slug', 'view_count', 'like_count', 'published_at'
    )
    
    # 最近の活動（最新10記事）
    recent_activity = articles.order_by('-published_at')[:10].values(
        'id', 'title', 'slug', 'view_count', 'like_count', 'published_at'
    )
    
    # 月別統計（過去12ヶ月）
    monthly_stats = []
    for i in range(12):
        month_start = (timezone.now().replace(day=1) - timedelta(days=i*30)).replace(day=1)
        month_end = (month_start + timedelta(days=32)).replace(day=1) - timedelta(days=1)
        
        month_articles = articles.filter(
            published_at__gte=month_start,
            published_at__lte=month_end
        )
        
        monthly_stats.insert(0, {
            'month': month_start.strftime('%Y-%m'),
            'articles': month_articles.count(),
            'views': month_articles.aggregate(Sum('view_count'))['view_count__sum'] or 0,
            'likes': month_articles.aggregate(Sum('like_count'))['like_count__sum'] or 0,
        })
    
    # タグ別統計
    tag_stats = articles.values('tags__name').annotate(
        count=Count('id'),
        views=Sum('view_count'),
        likes=Sum('like_count')
    ).filter(tags__name__isnull=False).order_by('-count')[:10]
    
    return Response({
        'overview': {
            'total_articles': total_articles,
            'total_views': total_views,
            'total_likes': total_likes,
            'total_comments': total_comments,
            'recent_articles': recent_articles,
            'avg_views_per_article': round(total_views / max(total_articles, 1), 1),
            'avg_likes_per_article': round(total_likes / max(total_articles, 1), 1),
        },
        'popular_articles': list(popular_articles),
        'recent_activity': list(recent_activity),
        'monthly_stats': monthly_stats,
        'tag_stats': list(tag_stats),
    })


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def site_analytics(request):
    """サイト全体の統計データAPI（管理者のみ）"""
    if not request.user.is_admin:
        return Response({'error': '権限がありません。'}, status=status.HTTP_403_FORBIDDEN)
    
    # 基本統計
    total_users = User.objects.filter(is_active=True).count()
    total_articles = Article.objects.filter(status='published').count()
    total_views = Article.objects.filter(status='published').aggregate(
        Sum('view_count'))['view_count__sum'] or 0
    total_likes = Article.objects.filter(status='published').aggregate(
        Sum('like_count'))['like_count__sum'] or 0
    total_comments = Comment.objects.filter(is_approved=True).count()
    total_tags = Tag.objects.count()
    
    # 最近30日の新規登録ユーザー
    thirty_days_ago = timezone.now() - timedelta(days=30)
    new_users = User.objects.filter(created_at__gte=thirty_days_ago).count()
    
    # 最近30日の新記事
    new_articles = Article.objects.filter(
        status='published',
        published_at__gte=thirty_days_ago
    ).count()
    
    # ユーザー役割別統計
    user_role_stats = User.objects.filter(is_active=True).values('role').annotate(
        count=Count('id')
    ).order_by('role')
    
    # 人気記事トップ10
    popular_articles = Article.objects.filter(status='published').order_by(
        '-view_count'
    )[:10].values(
        'id', 'title', 'slug', 'author__username', 'view_count', 'like_count', 'published_at'
    )
    
    # アクティブユーザートップ10（記事投稿数順）
    active_authors = User.objects.annotate(
        article_count=Count('articles', filter=Q(articles__status='published'))
    ).filter(article_count__gt=0).order_by('-article_count')[:10].values(
        'id', 'username', 'first_name', 'last_name', 'article_count'
    )
    
    # 月別成長統計（過去12ヶ月）
    growth_stats = []
    for i in range(12):
        month_start = (timezone.now().replace(day=1) - timedelta(days=i*30)).replace(day=1)
        month_end = (month_start + timedelta(days=32)).replace(day=1) - timedelta(days=1)
        
        month_users = User.objects.filter(
            created_at__gte=month_start,
            created_at__lte=month_end
        ).count()
        
        month_articles = Article.objects.filter(
            status='published',
            published_at__gte=month_start,
            published_at__lte=month_end
        ).count()
        
        growth_stats.insert(0, {
            'month': month_start.strftime('%Y-%m'),
            'new_users': month_users,
            'new_articles': month_articles,
        })
    
    # タグ別記事統計
    tag_stats = Tag.objects.filter(is_active=True).annotate(
        article_count=Count('articles', filter=Q(articles__status='published')),
        total_views=Sum('articles__view_count', filter=Q(articles__status='published')),
        total_likes=Sum('articles__like_count', filter=Q(articles__status='published'))
    ).order_by('-article_count')[:10].values(
        'name', 'article_count', 'total_views', 'total_likes'
    )
    
    return Response({
        'overview': {
            'total_users': total_users,
            'total_articles': total_articles,
            'total_views': total_views,
            'total_likes': total_likes,
            'total_comments': total_comments,
            'total_tags': total_tags,
            'new_users_30d': new_users,
            'new_articles_30d': new_articles,
        },
        'user_role_stats': list(user_role_stats),
        'popular_articles': list(popular_articles),
        'active_authors': list(active_authors),
        'growth_stats': growth_stats,
        'tag_stats': list(tag_stats),
    })


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def article_analytics(request, article_id):
    """個別記事の詳細分析API"""
    try:
        article = Article.objects.get(id=article_id)
    except Article.DoesNotExist:
        return Response({'error': '記事が見つかりません。'}, status=status.HTTP_404_NOT_FOUND)
    
    # 権限チェック：自分の記事または編集者以上
    if article.author != request.user and not request.user.is_editor:
        return Response({'error': '権限がありません。'}, status=status.HTTP_403_FORBIDDEN)
    
    # 基本統計
    view_count = article.view_count
    like_count = article.like_count
    comment_count = Comment.objects.filter(article=article, is_approved=True).count()
    
    # 日別閲覧数（過去30日）
    thirty_days_ago = timezone.now() - timedelta(days=30)
    daily_views = []
    for i in range(30):
        date = (timezone.now() - timedelta(days=i)).date()
        views = ArticleView.objects.filter(
            article=article,
            created_at__date=date
        ).count()
        daily_views.insert(0, {
            'date': date.strftime('%Y-%m-%d'),
            'views': views
        })
    
    # 閲覧者統計
    total_viewers = ArticleView.objects.filter(article=article).values('ip_address').distinct().count()
    authenticated_viewers = ArticleView.objects.filter(
        article=article, user__isnull=False
    ).values('user').distinct().count()
    
    # 最近のコメント（5件）
    recent_comments = Comment.objects.filter(
        article=article, is_approved=True
    ).order_by('-created_at')[:5].values(
        'id', 'author__username', 'content', 'created_at'
    )
    
    # 関連記事のパフォーマンス比較（タグベース）
    related_articles = article.get_related_articles(limit=5)
    related_articles_data = []
    for related in related_articles:
        related_articles_data.append({
            'id': related.id,
            'title': related.title,
            'slug': related.slug,
            'view_count': related.view_count,
            'like_count': related.like_count
        })
    
    return Response({
        'article': {
            'id': article.id,
            'title': article.title,
            'slug': article.slug,
            'published_at': article.published_at,
            'author': article.author.username,
            'tags': [tag.name for tag in article.tags.all()],
        },
        'stats': {
            'view_count': view_count,
            'like_count': like_count,
            'comment_count': comment_count,
            'total_viewers': total_viewers,
            'authenticated_viewers': authenticated_viewers,
            'engagement_rate': round((like_count + comment_count) / max(view_count, 1) * 100, 2),
        },
        'daily_views': daily_views,
        'recent_comments': list(recent_comments),
        'related_articles': related_articles_data,
    })


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def dashboard_data(request):
    """ダッシュボード用データ取得API"""
    user = request.user
    
    # 最近の記事（自分の記事）
    recent_articles = Article.objects.filter(
        author=user
    ).order_by('-created_at')[:5].values(
        'id', 'title', 'slug', 'status', 'view_count', 
        'like_count', 'created_at', 'published_at'
    )
    
    # 最近のコメント（自分の記事に対するコメント）
    recent_comments = Comment.objects.filter(
        article__author=user,
        is_approved=True
    ).select_related('author', 'article').order_by('-created_at')[:5]
    
    # コメントデータの整形
    comments_data = []
    for comment in recent_comments:
        comments_data.append({
            'id': comment.id,
            'content': comment.content[:100] + '...' if len(comment.content) > 100 else comment.content,
            'author': {
                'username': comment.author.username,
                'avatar': comment.author.avatar.url if comment.author.avatar else None
            },
            'article': {
                'id': comment.article.id,
                'title': comment.article.title,
                'slug': comment.article.slug
            },
            'created_at': comment.created_at
        })
    
    # 統計情報
    total_articles = Article.objects.filter(author=user).count()
    published_articles = Article.objects.filter(author=user, status='published').count()
    draft_articles = Article.objects.filter(author=user, status='draft').count()
    total_views = Article.objects.filter(author=user).aggregate(Sum('view_count'))['view_count__sum'] or 0
    total_likes = Article.objects.filter(author=user).aggregate(Sum('like_count'))['like_count__sum'] or 0
    total_comments = Comment.objects.filter(article__author=user, is_approved=True).count()
    
    return Response({
        'recent_articles': list(recent_articles),
        'recent_comments': comments_data,
        'stats': {
            'total_articles': total_articles,
            'published_articles': published_articles,
            'draft_articles': draft_articles,
            'total_views': total_views,
            'total_likes': total_likes,
            'total_comments': total_comments
        }
    })
