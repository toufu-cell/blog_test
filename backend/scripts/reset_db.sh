#!/bin/bash

# データベースリセットスクリプト
# adminユーザーを保持してデータベースをリセット

echo "🚨 ブログCMS データベースリセットスクリプト 🚨"
echo "================================================"

# スクリプトの場所に移動
cd "$(dirname "$0")/.."

# 仮想環境の確認
if [ ! -d "venv" ]; then
    echo "❌ 仮想環境が見つかりません。'venv'ディレクトリを作成してください。"
    exit 1
fi

# 仮想環境のアクティベート
source venv/bin/activate

echo "📋 使用可能なオプション:"
echo "  1. 基本リセット（adminユーザーのみ保持）"
echo "  2. リセット + サンプルデータ作成"
echo "  3. 確認なしで基本リセット"
echo "  4. 確認なしでリセット + サンプルデータ作成"
echo ""

read -p "選択してください (1-4): " choice

case $choice in
    1)
        echo "🔄 基本リセットを実行します..."
        python manage.py reset_database
        ;;
    2)
        echo "🔄 リセット + サンプルデータ作成を実行します..."
        python manage.py reset_database --create-sample
        ;;
    3)
        echo "🔄 確認なしで基本リセットを実行します..."
        python manage.py reset_database --confirm
        ;;
    4)
        echo "🔄 確認なしでリセット + サンプルデータ作成を実行します..."
        python manage.py reset_database --confirm --create-sample
        ;;
    *)
        echo "❌ 無効な選択です。1-4の数字を入力してください。"
        exit 1
        ;;
esac

echo ""
echo "✅ 操作が完了しました。"
echo "📝 サーバーを再起動することをお勧めします："
echo "   python manage.py runserver" 