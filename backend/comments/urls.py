from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CommentViewSet, ArticleCommentListView, CommentModerationViewSet

router = DefaultRouter()
router.register(r'comments', CommentViewSet, basename='comment')
router.register(r'admin/comments', CommentModerationViewSet, basename='comment-moderation')

app_name = 'comments'

urlpatterns = [
    path('', include(router.urls)),
    path('articles/<int:article_id>/comments/', ArticleCommentListView.as_view(), name='article-comments'),
] 