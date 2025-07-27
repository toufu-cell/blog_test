"""
データベースリセット管理コマンド
adminユーザーを保持しつつ、他のデータを安全にリセット
"""

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone
from accounts.models import User, UserProfile
from blog.models import Article, Tag, ArticleLike, ArticleView
from comments.models import Comment, CommentLike, CommentReport, CommentModerationLog
import sys


class Command(BaseCommand):
    help = 'データベースをリセット（adminユーザーは保持）'

    def add_arguments(self, parser):
        parser.add_argument(
            '--confirm',
            action='store_true',
            help='確認なしで実行',
        )
        parser.add_argument(
            '--create-sample',
            action='store_true',
            help='サンプルデータを作成',
        )
        parser.add_argument(
            '--admin-username',
            type=str,
            default='admin',
            help='保持するadminユーザー名（デフォルト: admin）',
        )

    def handle(self, *args, **options):
        self.stdout.write(
            self.style.WARNING('🚨 データベースリセット操作 🚨')
        )
        
        # adminユーザーの確認
        admin_username = options['admin_username']
        try:
            admin_user = User.objects.get(username=admin_username, role='admin')
            self.stdout.write(
                self.style.SUCCESS(f'✅ 保持対象adminユーザー: {admin_user.username} ({admin_user.email})')
            )
        except User.DoesNotExist:
            self.stdout.write(
                self.style.ERROR(f'❌ adminユーザー "{admin_username}" が見つかりません')
            )
            return

        # 現在のデータ状況を表示
        self._show_current_data()

        # 確認プロンプト
        if not options['confirm']:
            confirm = input('\n本当にデータベースをリセットしますか？ (yes/no): ')
            if confirm.lower() != 'yes':
                self.stdout.write(
                    self.style.WARNING('❌ 操作がキャンセルされました')
                )
                return

        # リセット実行
        self.stdout.write('\n🔄 データベースリセットを開始...')
        
        try:
            with transaction.atomic():
                self._reset_database(admin_user)
                
                if options['create_sample']:
                    self._create_sample_data()
                    
            self.stdout.write(
                self.style.SUCCESS('\n✅ データベースリセットが完了しました')
            )
            
            # 最終結果表示
            self._show_current_data()
            
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'❌ エラーが発生しました: {e}')
            )
            sys.exit(1)

    def _show_current_data(self):
        """現在のデータ状況を表示"""
        self.stdout.write('\n📊 現在のデータ状況:')
        self.stdout.write(f'  👥 ユーザー: {User.objects.count()}人')
        self.stdout.write(f'  📝 記事: {Article.objects.count()}件')
        self.stdout.write(f'  🏷️  タグ: {Tag.objects.count()}個')
        self.stdout.write(f'  💬 コメント: {Comment.objects.count()}件')
        self.stdout.write(f'  👀 記事閲覧: {ArticleView.objects.count()}件')
        self.stdout.write(f'  👍 記事いいね: {ArticleLike.objects.count()}件')
        self.stdout.write(f'  💭 コメントいいね: {CommentLike.objects.count()}件')

    def _reset_database(self, admin_user):
        """データベースリセット実行"""
        
        # 1. コメント関連データの削除
        self.stdout.write('  🗑️  コメント関連データを削除中...')
        CommentModerationLog.objects.all().delete()
        CommentReport.objects.all().delete()
        CommentLike.objects.all().delete()
        Comment.objects.all().delete()
        
        # 2. 記事関連データの削除
        self.stdout.write('  🗑️  記事関連データを削除中...')
        ArticleView.objects.all().delete()
        ArticleLike.objects.all().delete()
        Article.objects.all().delete()
        
        # 3. タグの削除
        self.stdout.write('  🗑️  タグを削除中...')
        Tag.objects.all().delete()
        
        # 4. adminユーザー以外のユーザーとプロファイルを削除
        self.stdout.write('  🗑️  ユーザー（admin除く）を削除中...')
        other_users = User.objects.exclude(id=admin_user.id)
        other_user_ids = list(other_users.values_list('id', flat=True))
        
        # プロファイルも削除
        UserProfile.objects.filter(user_id__in=other_user_ids).delete()
        other_users.delete()
        
        self.stdout.write(
            self.style.SUCCESS(f'  ✅ adminユーザー "{admin_user.username}" を保持してリセット完了')
        )

    def _create_sample_data(self):
        """サンプルデータの作成"""
        self.stdout.write('\n🎯 サンプルデータを作成中...')
        
        # サンプルユーザーの作成
        sample_user = User.objects.create_user(
            username='sample_editor',
            email='editor@example.com',
            password='password123',
            role='editor',
            bio='サンプル編集者ユーザーです。'
        )
        
        # ユーザープロファイルの作成
        UserProfile.objects.create(
            user=sample_user,
            notification_email=True,
            privacy_public_profile=True
        )
        
        # サンプルタグの作成
        tags = []
        tag_data = [
            {'name': 'Python', 'color': '#3776ab', 'description': 'Pythonプログラミング'},
            {'name': 'Django', 'color': '#092e20', 'description': 'Djangoフレームワーク'},
            {'name': 'JavaScript', 'color': '#f7df1e', 'description': 'JavaScript開発'},
            {'name': 'React', 'color': '#61dafb', 'description': 'Reactライブラリ'},
        ]
        
        for tag_info in tag_data:
            tag = Tag.objects.create(**tag_info)
            tags.append(tag)
        
        # サンプル記事の作成
        articles_data = [
            {
                'title': 'Djangoブログシステムの構築',
                'slug': 'django-blog-system',
                'excerpt': 'Djangoを使ったブログシステムの構築方法を解説します。',
                'content': '''# Djangoブログシステムの構築

この記事では、Djangoを使ったブログシステムの構築方法について説明します。

## 主な機能
- 記事の投稿・編集
- コメント機能
- タグ機能
- ユーザー管理

## 技術スタック
- Django
- MySQL
- Next.js
- Material-UI

詳細な実装方法については、以下で説明していきます。''',
                'status': 'published',
                'allow_comments': True,
                'is_featured': True,
                'tags': [tags[0], tags[1]]  # Python, Django
            },
            {
                'title': 'React + Next.jsでモダンなフロントエンド開発',
                'slug': 'react-nextjs-frontend',
                'excerpt': 'ReactとNext.jsを使ったモダンなフロントエンド開発のベストプラクティス。',
                'content': '''# React + Next.jsでモダンなフロントエンド開発

モダンなWebアプリケーション開発において、ReactとNext.jsの組み合わせは非常に強力です。

## Next.jsの特徴
- サーバーサイドレンダリング
- 静的サイト生成
- ファイルベースルーティング
- APIルート

## 開発のポイント
1. コンポーネント設計
2. 状態管理
3. パフォーマンス最適化

実際のプロジェクトでの活用方法を見ていきましょう。''',
                'status': 'published',
                'allow_comments': True,
                'tags': [tags[2], tags[3]]  # JavaScript, React
            }
        ]
        
        created_articles = []
        for article_data in articles_data:
            article_tags = article_data.pop('tags')
            article = Article.objects.create(
                author=sample_user,
                published_at=timezone.now(),
                **article_data
            )
            article.tags.set(article_tags)
            created_articles.append(article)
        
        # サンプルコメントの作成
        for i, article in enumerate(created_articles):
            Comment.objects.create(
                article=article,
                author=sample_user,
                content=f'この記事「{article.title}」はとても参考になりました！ありがとうございます。',
                is_approved=True
            )
        
        self.stdout.write(
            self.style.SUCCESS(f'✅ サンプルデータを作成しました:')
        )
        self.stdout.write(f'  - サンプルユーザー: {sample_user.username}')
        self.stdout.write(f'  - タグ: {len(tags)}個')
        self.stdout.write(f'  - 記事: {len(created_articles)}件')
        self.stdout.write(f'  - コメント: {len(created_articles)}件') 