from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ArticleViewSet,
    TagViewSet,
    PublicArticleListView,
    PublicArticleDetailView,
    user_analytics,
    site_analytics,
    article_analytics,
    dashboard_data,
)

app_name = 'blog'

# API Router
router = DefaultRouter()
router.register(r'articles', ArticleViewSet, basename='articles')
router.register(r'tags', TagViewSet, basename='tags')

urlpatterns = [
    # 公開API（認証不要）
    path('public/articles/', PublicArticleListView.as_view(), name='public-article-list'),
    path('public/articles/<slug:slug>/', PublicArticleDetailView.as_view(), name='public-article-detail'),
    
    # 統計・分析API
    path('analytics/user/', user_analytics, name='user-analytics'),
    path('analytics/site/', site_analytics, name='site-analytics'),
    path('analytics/article/<int:article_id>/', article_analytics, name='article-analytics'),
    path('dashboard/', dashboard_data, name='dashboard-data'),
    
    # 管理API（認証必要）
    path('', include(router.urls)),
    
    # スラッグによる記事詳細取得
    path('articles/slug/<slug:slug>/', PublicArticleDetailView.as_view(), name='article-detail-by-slug'),
] 