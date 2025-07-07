from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ArticleViewSet,
    CategoryViewSet,
    TagViewSet,
    PublicArticleListView,
    PublicArticleDetailView,
)

app_name = 'blog'

# API Router
router = DefaultRouter()
router.register(r'articles', ArticleViewSet, basename='articles')
router.register(r'categories', CategoryViewSet, basename='categories')
router.register(r'tags', TagViewSet, basename='tags')

urlpatterns = [
    # 公開API（認証不要）
    path('public/articles/', PublicArticleListView.as_view(), name='public-article-list'),
    path('public/articles/<slug:slug>/', PublicArticleDetailView.as_view(), name='public-article-detail'),
    
    # 管理API（認証必要）
    path('', include(router.urls)),
    
    # スラッグによる記事詳細取得
    path('articles/slug/<slug:slug>/', PublicArticleDetailView.as_view(), name='article-detail-by-slug'),
] 