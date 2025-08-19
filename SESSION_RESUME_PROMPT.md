# 8weeks LP プロジェクト - セッション再開用プロンプト

以下の内容を新しいClaude Codeセッションで使用して、作業を継続してください：

---

## プロジェクト概要
8weeks Fujimiの宿泊施設を紹介するランディングページプロジェクトの継続作業をお願いします。

**基本情報：**
- プロジェクト名: 8weeks LP
- 場所: 富士見町（八ヶ岳山麓）の3つの宿泊施設
- 施設: Fujimi, Quriu, Studio
- 技術: HTML5/CSS3, JavaScript, Python (画像処理)
- GitHubリポジトリ: https://github.com/8weeksfujimi/8weeks-LP

## 現在のフォルダ構成
```
8weeks LP/
├── index.html              # 日本語版メインページ
├── index-en.html           # 英語版メインページ
├── booking.html            # 予約ページ
├── gallery-test.html       # ギャラリーテスト
├── CLAUDE.md              # プロジェクトコンテクスト（詳細）
├── README.md              # プロジェクト概要
├── SESSION_NOTES.md       # セッション履歴
│
├── assets/
│   ├── images/
│   │   ├── logos/         # 現在使用中のロゴ
│   │   │   ├── favicon.png, fujimi.png, quriu.png, studio.png
│   │   │   └── ロゴ.png, ロゴ2.png
│   │   ├── gallery/       # ギャラリー画像
│   │   │   ├── Host Photo/, Quriu Photo/, Studio Photos/
│   │   │   └── optimized/ (最適化済み画像)
│   │   └── archived/      # 古いロゴのバックアップ
│   └── styles/
│       └── host-gallery-styles.css
│
├── scripts/               # JavaScript & Pythonスクリプト
│   ├── clean-gallery-data.js    # ギャラリーデータ（メイン）
│   ├── pinterest-gallery.js     # Pinterest風ギャラリー
│   ├── airbnb-data.js           # Airbnbリスティング情報
│   └── その他のスクリプト...
│
└── docs/                  # ドキュメント類
    └── 各種マニュアル・ガイド
```

## 最近完了した作業（2025-08-19）

### ✅ 完了済み
1. **フォルダ構成の整理**
   - 画像、スクリプト、ドキュメントを適切なフォルダに整理
   - 全HTMLファイルのパスを新しい構成に更新

2. **画像表示問題の修正**
   - HTMLとJavaScriptファイル内の画像パスを修正
   - `assets/images/gallery/` 配下に正しく設定

3. **Hostセクションの更新**
   - 移住詳細: 2020年8月に神奈川県から富士見町へ
   - 現況: 5歳の娘の子育て中、夫はロンドンに単身赴任
   - 趣味タグ: アウトドア、アート、ウォーキング、ハイキング、ライブミュージック、旅行、楽器演奏

4. **技術的改善**
   - Pinterest風Masonryギャラリーの実装
   - レスポンシブデザインの最適化
   - SEO対策とメタタグの充実

### 🔧 現在の状況
- ローカルサーバー: `python3 -m http.server 8000` で動作確認可能
- GitHubページ: https://8weeksfujimi.github.io/8weeks-LP/
- 全ての画像とスクリプトが正しく読み込まれている

## 次回セッションで対応が必要な項目

### 🎯 優先度：高
1. **パフォーマンス最適化**
   - 画像の遅延読み込み実装
   - CSSとJSの圧縮・minify
   - CDN活用の検討

2. **SEO強化**
   - 構造化データ（JSON-LD）の追加
   - サイトマップの作成
   - Google Analytics設定

3. **機能追加**
   - 予約システムの改善
   - お問い合わせフォームの実装
   - 多言語対応の拡充

### 🎯 優先度：中
4. **コンテンツ拡充**
   - 8weeks Fujimiの写真追加
   - 周辺観光スポット情報
   - 季節ごとの特別プラン

5. **技術的改善**
   - PWA対応
   - オフライン機能
   - モバイルアプリ化検討

### 🎯 優先度：低
6. **マーケティング機能**
   - ソーシャルメディア連携
   - レビュー・評価システム
   - メールマガジン機能

## 重要なファイル参照

### プロジェクト詳細情報
- `CLAUDE.md` - プロジェクトの詳細なコンテクスト、技術仕様、更新履歴
- `README.md` - プロジェクト概要、セットアップ手順
- `SESSION_NOTES.md` - セッション履歴、作業メモ

### 主要なスクリプト
- `scripts/clean-gallery-data.js` - ギャラリー画像データ（33枚 Quriu、38枚 Studio）
- `scripts/pinterest-gallery.js` - Pinterest風レイアウトのギャラリー実装
- `scripts/airbnb-data.js` - Airbnbリスティング情報管理

### デザインファイル
- `assets/styles/host-gallery-styles.css` - ホストプロフィール、ギャラリー、レスポンシブスタイル

## セッション再開手順

1. **作業ディレクトリに移動**
   ```bash
   cd "/Users/shunji/Library/Mobile Documents/iCloud~md~obsidian/Documents/Shunji Memo/8weeks LP"
   ```

2. **現在の状態確認**
   ```bash
   git status
   git log --oneline -5
   ls -la
   ```

3. **ローカルサーバー起動（確認用）**
   ```bash
   python3 -m http.server 8000
   # http://localhost:8000/index.html で確認
   ```

4. **主要ファイルを確認**
   - `CLAUDE.md` で詳細仕様確認
   - `index.html` と `index-en.html` で現在の状態確認
   - `scripts/` フォルダの主要スクリプト確認

## 緊急時の復旧情報

### Git履歴（最新コミット）
```
3e0bc63 - Hostセクションの文章を更新し、趣味タグを追加
ba273e1 - 画像パスを修正して表示問題を解決  
0db024d - HTMLファイルのリソースパスを更新
0fbc348 - フォルダ構成を整理し、プロジェクトをよりメンテナンスしやすく改善
```

### 重要な設定
- メインブランチ: `main`
- リモートリポジトリ: `origin`
- GitHub Pages: 有効
- ローカルサーバーポート: `8000`

## よく使うコマンド

```bash
# 画像最適化
python scripts/image-optimizer.py

# 変更のコミットとプッシュ
git add -A
git commit -m "変更内容の説明"
git push origin main

# サーバー停止
pkill -f 'python3 -m http.server'
```

---

**このプロンプトを使用して新しいセッションを開始し、上記の「次回セッションで対応が必要な項目」から作業を継続してください。**