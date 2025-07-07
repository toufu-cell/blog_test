from django.shortcuts import render, get_object_or_404
from rest_framework import generics, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import OrderingFilter
from django.db.models import Prefetch, F
from .models import Comment, CommentLike, CommentReport
from .serializers import (
    CommentSerializer,
    CommentCreateUpdateSerializer,
    CommentLikeSerializer,
    CommentReportSerializer,
    CommentModerationSerializer
)
from blog.models import Article


class CommentViewSet(ModelViewSet):
    """コメント管理API"""
    
    serializer_class = CommentSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['article', 'parent', 'is_approved']
    ordering_fields = ['created_at', 'updated_at', 'like_count']
    ordering = ['created_at']
    
    def get_queryset(self):
        """クエリセットを取得"""
        queryset = Comment.objects.select_related('author', 'article').prefetch_related(
            Prefetch(
                'replies',
                queryset=Comment.objects.filter(is_approved=True).select_related('author').order_by('created_at'),
                to_attr='prefetched_replies'
            )
        )
        
        # 一般ユーザーは承認済みコメントのみ表示
        if not self.request.user.is_authenticated or not self.request.user.is_editor:
            queryset = queryset.filter(is_approved=True)
        
        return queryset
    
    def get_serializer_class(self):
        """アクションに応じてシリアライザーを変更"""
        if self.action in ['create', 'update', 'partial_update']:
            return CommentCreateUpdateSerializer
        return CommentSerializer
    
    def perform_create(self, serializer):
        """コメント作成時の処理"""
        # IPアドレスとユーザーエージェントを取得
        ip_address = self.get_client_ip(self.request)
        user_agent = self.request.META.get('HTTP_USER_AGENT', '')
        
        # 自動承認の判定（管理者・編集者は自動承認）
        is_approved = self.request.user.is_editor
        
        serializer.save(
            author=self.request.user,
            ip_address=ip_address,
            user_agent=user_agent,
            is_approved=is_approved
        )
    
    def get_client_ip(self, request):
        """クライアントのIPアドレスを取得"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip
    
    @action(detail=True, methods=['post'])
    def like(self, request, pk=None):
        """コメントにいいね"""
        comment = self.get_object()
        like, created = CommentLike.objects.get_or_create(
            comment=comment,
            user=request.user
        )
        
        if created:
            # いいね数を更新
            Comment.objects.filter(pk=comment.pk).update(
                like_count=F('like_count') + 1
            )
            return Response({'status': 'liked'}, status=status.HTTP_201_CREATED)
        else:
            return Response(
                {'error': '既にいいねしています。'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['delete'])
    def unlike(self, request, pk=None):
        """コメントのいいねを取り消し"""
        comment = self.get_object()
        try:
            like = CommentLike.objects.get(comment=comment, user=request.user)
            like.delete()
            # いいね数を更新
            Comment.objects.filter(pk=comment.pk).update(
                like_count=F('like_count') - 1
            )
            return Response({'status': 'unliked'}, status=status.HTTP_200_OK)
        except CommentLike.DoesNotExist:
            return Response(
                {'error': 'いいねしていません。'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['post'])
    def report(self, request, pk=None):
        """コメントを報告"""
        comment = self.get_object()
        serializer = CommentReportSerializer(data=request.data)
        
        if serializer.is_valid():
            # 既に報告済みかチェック
            if CommentReport.objects.filter(
                comment=comment, 
                reporter=request.user
            ).exists():
                return Response(
                    {'error': '既に報告済みです。'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            serializer.save(comment=comment, reporter=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def approve(self, request, pk=None):
        """コメントを承認（編集者以上）"""
        if not request.user.is_editor:
            return Response(
                {'error': 'コメント承認の権限がありません。'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        comment = self.get_object()
        comment.approve()
        
        return Response({'status': 'approved'}, status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def mark_spam(self, request, pk=None):
        """コメントをスパムとしてマーク（編集者以上）"""
        if not request.user.is_editor:
            return Response(
                {'error': 'コメント管理の権限がありません。'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        comment = self.get_object()
        comment.mark_as_spam()
        
        return Response({'status': 'marked_as_spam'}, status=status.HTTP_200_OK)


class ArticleCommentListView(generics.ListAPIView):
    """記事のコメント一覧"""
    
    serializer_class = CommentSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [OrderingFilter]
    ordering_fields = ['created_at', 'like_count']
    ordering = ['created_at']
    
    def get_queryset(self):
        """記事IDに基づいてコメントを取得"""
        article_id = self.kwargs['article_id']
        article = get_object_or_404(Article, id=article_id)
        
        # 公開されていない記事のコメントは表示しない
        if article.status != 'published':
            return Comment.objects.none()
        
        # 親コメントのみを取得（返信は各コメントのrepliesフィールドで取得）
        return Comment.objects.filter(
            article=article,
            parent__isnull=True,
            is_approved=True
        ).select_related('author').prefetch_related(
            Prefetch(
                'replies',
                queryset=Comment.objects.filter(is_approved=True).select_related('author').order_by('created_at'),
                to_attr='prefetched_replies'
            )
        )


class CommentModerationViewSet(ModelViewSet):
    """コメント管理API（管理者用）"""
    
    queryset = Comment.objects.all().select_related('author', 'article')
    serializer_class = CommentModerationSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['is_approved', 'is_spam', 'article']
    ordering_fields = ['created_at', 'updated_at']
    ordering = ['-created_at']
    
    def get_permissions(self):
        """編集者以上のみアクセス可能"""
        self.permission_classes = [permissions.IsAuthenticated]
        return super().get_permissions()
    
    def check_permissions(self, request):
        """編集者以上の権限をチェック"""
        super().check_permissions(request)
        if not request.user.is_editor:
            self.permission_denied(request, '管理者権限が必要です。')
    
    @action(detail=False, methods=['get'])
    def pending(self, request):
        """承認待ちコメント一覧"""
        comments = self.get_queryset().filter(is_approved=False, is_spam=False)
        page = self.paginate_queryset(comments)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(comments, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def spam(self, request):
        """スパムコメント一覧"""
        comments = self.get_queryset().filter(is_spam=True)
        page = self.paginate_queryset(comments)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(comments, many=True)
        return Response(serializer.data)
