# Blog CMS System

フルスタックブログCMSシステム - Django REST Framework + Next.js

## 概要

本プロジェクトは、Django REST Frameworkをバックエンド、Next.js (TypeScript)をフロントエンドとした、モダンなブログCMSシステムです。

## 主な機能

### 記事管理
- 記事の作成、編集、削除
- カテゴリ・タグ管理
- 画像アップロード
- 管理者・編集者権限管理

### コメントシステム
- 記事へのコメント投稿
- リアルタイムコメント数更新
- 管理者によるコメント管理

### ユーザー認証
- ユーザー登録・ログイン
- JWT認証
- ダッシュボード機能

### 記事一覧・検索
- フルテキスト検索
- カテゴリ・タグフィルター
- 並び順変更
- グリッド/リスト表示切り替え

## 技術スタック

### バックエンド
- Django 4.x
- Django REST Framework
- JWT認証
- SQLite3
- CORS対応

### フロントエンド
- Next.js 14
- TypeScript
- Material-UI (MUI)
- SWR (データフェッチング)
- Tailwind CSS

## プロジェクト構成

```
database/
├── backend/           # Django バックエンド
│   ├── accounts/     # ユーザー管理
│   ├── blog/         # ブログ記事管理
│   ├── comments/     # コメント機能
│   └── blog_cms/     # プロジェクト設定
└── frontend/         # Next.js フロントエンド
    ├── app/          # ページコンポーネント
    ├── components/   # 再利用コンポーネント
    ├── lib/          # ユーティリティ・API
    └── types/        # TypeScript型定義
```

## セットアップ

### バックエンド

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

### フロントエンド

```bash
cd frontend
npm install
npm run dev
```

## 開発環境URL

- フロントエンド: http://localhost:3000
- バックエンドAPI: http://localhost:8000
- Django管理画面: http://localhost:8000/admin

## 主要API エンドポイント

- `GET /api/v1/blog/articles/` - 記事一覧
- `POST /api/v1/blog/articles/` - 記事作成
- `GET /api/v1/comments/articles/{articleId}/comments/` - 記事コメント一覧
- `POST /api/v1/comments/comments/` - コメント投稿
- `POST /api/v1/accounts/login/` - ログイン
- `POST /api/v1/accounts/register/` - ユーザー登録

## ライセンス

MIT License 