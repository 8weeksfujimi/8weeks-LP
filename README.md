# 8weeks LP - ランディングページ

## 概要
8weeks Fujimiの宿泊施設を紹介するランディングページです。富士見町にある3つの施設（Fujimi、Quriu、Studio）の情報を提供し、Airbnbでの予約へ誘導します。

## 施設情報

### 8weeks Fujimi
- 八ヶ岳の麓にある一軒家
- 最大8名宿泊可能
- キッチン、リビング、暖炉完備

### 8weeks Quriu
- モダンなデザインの施設
- プライベート空間重視
- 自然との調和

### 8weeks Studio
- コンパクトで機能的
- 1-2名向け
- 長期滞在に最適

## 機能
- 日本語/英語対応
- レスポンシブデザイン
- フォトギャラリー
- Airbnb連携
- 予約システム

## セットアップ

### 必要環境
- Node.js (プロキシサーバー用)
- Python 3.x (画像処理用)
- 最新のWebブラウザ

### インストール
```bash
# リポジトリのクローン
git clone https://github.com/8weeksfujimi/8weeks-LP.git
cd 8weeks-LP

# 依存関係のインストール（必要に応じて）
npm install
pip install -r requirements.txt
```

### ローカル実行
```bash
# HTMLファイルを直接ブラウザで開く
open index.html

# プロキシサーバーを起動する場合
node scripts/airbnb-proxy-server.js
```

## ファイル構成
詳細な構成は[CLAUDE.md](./CLAUDE.md)を参照してください。

## デプロイ
GitHubへのプッシュで自動的にデプロイされます。
```bash
git add .
git commit -m "更新内容"
git push origin main
```

## ライセンス
© 2025 8weeks Fujimi. All rights reserved.

## お問い合わせ
- Email: info@8weeksfujimi.com
- Website: https://8weeksfujimi.com