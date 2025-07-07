from django.shortcuts import render
from rest_framework import generics, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.db.models import Q, F
from django.utils import timezone
from .models import Article, Category, Tag, ArticleLike, ArticleView
from .serializers import (
    ArticleListSerializer,
    ArticleDetailSerializer,
    ArticleCreateUpdateSerializer,
    CategorySerializer,
    TagSerializer,
    ArticleLikeSerializer,
    ArticleViewSerializer
)
from .permissions import IsAuthorOrReadOnly, CanPublishOrReadOnly


class CategoryViewSet(ModelViewSet):
    """カテゴリ管理API"""
    
    queryset = Category.objects.filter(is_active=True)
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filterset_fields = ['parent', 'is_active']
    search_fields = ['name', 'description']
    ordering_fields = ['sort_order', 'name', 'created_at']
    ordering = ['sort_order', 'name']
    
    def get_permissions(self):
        """読み取りは全ユーザー、書き込みは編集者以上"""
        if self.action in ['list', 'retrieve']:
            self.permission_classes = [permissions.AllowAny]
        else:
            self.permission_classes = [permissions.IsAuthenticated]
        return super().get_permissions()
    
    def perform_create(self, serializer):
        # 編集者以上のみが作成可能
        if not self.request.user.is_editor:
            raise permissions.PermissionDenied("カテゴリの作成権限がありません。")
        serializer.save()
    
    def perform_update(self, serializer):
        # 編集者以上のみが更新可能
        if not self.request.user.is_editor:
            raise permissions.PermissionDenied("カテゴリの編集権限がありません。")
        serializer.save()
    
    def perform_destroy(self, instance):
        # 管理者のみが削除可能
        if not self.request.user.is_admin:
            raise permissions.PermissionDenied("カテゴリの削除権限がありません。")
        instance.delete()


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
        # 投稿者以上のみが作成可能
        if not self.request.user.is_author:
            raise permissions.PermissionDenied("タグの作成権限がありません。")
        serializer.save()


class ArticleViewSet(ModelViewSet):
    """記事管理API"""
    
    queryset = Article.objects.all()
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsAuthorOrReadOnly, CanPublishOrReadOnly]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'category', 'tags', 'author', 'is_featured', 'is_pinned']
    search_fields = ['title', 'excerpt', 'content']
    ordering_fields = ['published_at', 'created_at', 'updated_at', 'view_count', 'like_count']
    ordering = ['-published_at', '-created_at']
    
    def get_queryset(self):
        """ユーザーと記事の状態に応じてクエリセットを制限"""
        queryset = Article.objects.all()
        user = self.request.user
        
        if self.action in ['list', 'retrieve']:
            if user.is_authenticated:
                if user.is_editor:
                    # 編集者は全ての記事を閲覧可能
                    return queryset
                elif user.is_author:
                    # 投稿者は公開記事と自分の記事を閲覧可能
                    return queryset.filter(
                        Q(status='published') | Q(author=user)
                    )
                else:
                    # 読者は公開記事のみ
                    return queryset.filter(status='published')
            else:
                # 未認証ユーザーは公開記事のみ
                return queryset.filter(status='published')
        else:
            # 作成・編集・削除は認証ユーザーのみ
            if user.is_authenticated:
                if user.is_editor:
                    return queryset
                else:
                    return queryset.filter(author=user)
        
        return queryset.none()
    
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
        # 権限チェックは既にget_permissions()で実行されているため削除
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
        """記事の注目フラグを切り替え（編集者以上）"""
        if not request.user.is_editor:
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
        """記事のピン留めフラグを切り替え（編集者以上）"""
        if not request.user.is_editor:
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
    filterset_fields = ['category', 'tags', 'author', 'is_featured']
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
