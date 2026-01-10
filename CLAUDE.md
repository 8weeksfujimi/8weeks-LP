# 8weeks LP プロジェクトコンテクスト

## プロジェクト概要
8weeks Stayの宿泊施設を紹介するランディングページプロジェクト。
富士見町にある3つの施設（8weeks Fujimi、8weeks Quriu、8weeks Studio）の情報とAirbnbリスティングへの誘導を行う。

## フォルダ構成

```
8weeks LP/
├── index.html              # 日本語版メインページ
├── index-en.html           # 英語版メインページ
├── index-photo-ready.html  # 写真準備版
├── booking.html            # 予約ページ
├── gallery-test.html       # ギャラリーテストページ
│
├── assets/                 # アセットフォルダ
│   ├── images/
│   │   ├── logos/         # ロゴファイル
│   │   │   ├── favicon.png
│   │   │   ├── ロゴ.png
│   │   │   ├── ロゴ2.png
│   │   │   ├── fujimi.png
│   │   │   ├── quriu.png
│   │   │   └── studio.png
│   │   ├── gallery/       # ギャラリー画像
│   │   │   ├── Host Photo/
│   │   │   ├── Quriu Photo/
│   │   │   ├── Studio Photos/
│   │   │   └── optimized/
│   │   └── archived/      # アーカイブ画像
│   │       ├── Xfavicon.png
│   │       ├── Xロゴ.png
│   │       └── Xロゴ2.png
│   │
│   └── styles/
│       └── host-gallery-styles.css
│
├── scripts/                # スクリプトファイル
│   ├── airbnb-data.js
│   ├── airbnb-proxy-server.js
│   ├── booking.js
│   ├── categorized-gallery-data.js
│   ├── clean-gallery-data.js
│   ├── cloud-gallery-data.js
│   ├── gallery-data.js
│   ├── optimized-gallery-data.js
│   ├── pinterest-gallery.js
│   ├── three-stage-gallery.js
│   ├── ultra-performance-gallery.js
│   ├── performance-optimizer.js
│   ├── compress-all-images.py
│   ├── create_pdf.py
│   ├── image-optimizer.py
│   └── quick-compress.py
│
└── docs/                   # ドキュメント
    ├── AI応答テンプレート.md
    ├── AIRBNB_API_README.md
    ├── Google_APIs_Setup_Guide.md
    ├── 使用方法説明書.md
    ├── 写真保存ガイド.md
    ├── 写真分類表.md
    ├── 写真管理ガイド.md
    ├── 分類済み写真一覧.md
    └── 8weeks Fujimiでの暮らし · Airbnb.pdf
```

## 主要ファイルの説明

### HTMLファイル
- **index.html**: 日本語版のメインランディングページ
- **index-en.html**: 英語版のメインランディングページ
- **booking.html**: 予約システムページ
- **gallery-test.html**: ギャラリー機能のテストページ

### スクリプト
- **airbnb-data.js**: Airbnbのリスティング情報を管理
- **airbnb-proxy-server.js**: Airbnb APIアクセス用のプロキシサーバー
- **booking.js**: 予約システムのJavaScript
- **gallery系スクリプト**: 画像ギャラリーの表示・管理
- **Python系スクリプト**: 画像の圧縮・最適化処理

### 画像ファイル
- **logos/**: サイトのロゴとファビコン
- **gallery/**: 施設の写真（Host、Quriu、Studio）
- **optimized/**: 最適化済みの画像
- **archived/**: 古いバージョンのロゴファイル

## 技術スタック
- HTML5/CSS3
- JavaScript (Vanilla JS)
- Python (画像処理用)
- Node.js (プロキシサーバー用)

## 外部連携
- Airbnb API
- Google Maps API
- その他の予約システムAPI

## デプロイ情報
- GitHubリポジトリ: https://github.com/8weeksfujimi/8weeks-LP
- メインブランチ: main
- ブランド名: 8weeks Stay
- 個別物件: 8weeks Fujimi, 8weeks Quriu, 8weeks Studio

## 更新時の注意事項

### ロゴファイルの更新
1. 新しいロゴファイルは `assets/images/logos/` に配置
2. 古いロゴファイルは `assets/images/archived/` に移動
3. HTMLファイル内のパスを更新

### 画像の追加
1. 元画像は適切なフォルダ（Host Photo、Quriu Photo、Studio Photos）に追加
2. `scripts/image-optimizer.py` または `scripts/quick-compress.py` で最適化
3. 最適化済み画像は `optimized/` フォルダに保存
4. `gallery-data.js` を更新

### コミット時のルール
- 意味のある単位でコミット
- 日本語でのコミットメッセージ推奨
- 大きな変更前にはブランチを作成

## よく使うコマンド

```bash
# 画像の最適化
python scripts/image-optimizer.py

# プロキシサーバーの起動
node scripts/airbnb-proxy-server.js

# Gitへのプッシュ
git add .
git commit -m "変更内容の説明"
git push origin main
```

## トラブルシューティング
- 画像が表示されない場合: パスが正しいか確認
- APIが動作しない場合: APIキーの有効性を確認
- スタイルが適用されない場合: CSSファイルのパスを確認

## 今後の改善案
1. レスポンシブデザインの最適化
2. 画像の遅延読み込み実装
3. SEO対策の強化
4. 多言語対応の拡充
5. パフォーマンスの最適化