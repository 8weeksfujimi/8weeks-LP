# 🚀 8weeks LP - クイックスタートガイド

## 新しいClaude Codeセッション開始時の手順

### 1️⃣ 最初に実行するコマンド
```bash
cd "/Users/shunji/Library/Mobile Documents/iCloud~md~obsidian/Documents/Shunji Memo/8weeks LP"
pwd
ls -la
git status
```

### 2️⃣ プロジェクト状況の把握
```bash
# 最新のコミット履歴確認
git log --oneline -10

# 現在のブランチとリモート状況確認  
git branch -av
```

### 3️⃣ ローカル開発環境の起動
```bash
# Webサーバー起動（バックグラウンド）
python3 -m http.server 8000 > /dev/null 2>&1 &

# 確認用URL
echo "ローカルサーバー: http://localhost:8000/index.html"
echo "日本語版: http://localhost:8000/index.html"  
echo "英語版: http://localhost:8000/index-en.html"
```

### 4️⃣ 重要ファイルの確認
必要に応じて以下のファイルを読み込んでコンテクストを把握：
- `CLAUDE.md` - プロジェクトの詳細仕様
- `SESSION_NOTES.md` - 前回のセッション記録
- `README.md` - プロジェクト概要

### 5️⃣ 作業完了時
```bash
# 変更をコミット
git add -A
git commit -m "作業内容の説明

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"

# GitHubにプッシュ
git push origin main

# サーバー停止
pkill -f 'python3 -m http.server'
```

## 🎯 現在の優先タスク

1. **パフォーマンス最適化** - 画像の遅延読み込み実装
2. **SEO強化** - 構造化データの追加
3. **予約システム改善** - フォーム機能の拡充

## 📁 重要なディレクトリ構成

```
8weeks LP/
├── index.html, index-en.html    # メインページ
├── assets/images/logos/         # ロゴファイル  
├── assets/images/gallery/       # ギャラリー画像
├── scripts/                     # JavaScript
└── docs/                        # ドキュメント
```

## 🔧 トラブルシューティング

### 画像が表示されない場合
```bash
# 画像パスの確認
ls -la assets/images/logos/
ls -la assets/images/gallery/
```

### JavaScriptエラーの場合  
```bash
# スクリプトファイルの存在確認
ls -la scripts/
curl -s http://localhost:8000/scripts/clean-gallery-data.js | head -5
```

### Git関連の問題
```bash
# リモートとの同期確認
git fetch origin
git status
```

---
**このガイドを使って素早くプロジェクトに復帰し、効率的に作業を進めてください！**