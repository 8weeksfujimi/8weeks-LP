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

## 開発の流れ

### 画像の追加・管理

1. **画像の追加**
   - 元画像を適切なフォルダ（`Quriu Photo/`, `Studio Photos/`, `Fujimi Photos/`）に配置
   - `scripts/compress-*.py` で画像を圧縮
   - 圧縮済み画像は `assets/images/gallery/optimized/` に保存

2. **ギャラリーデータの更新**
   - `gallery-data.json` に新しい画像情報を追加
   - `scripts/clean-gallery-data.js` を同期更新
   - 各画像にカテゴリー（exterior, living, kitchen, bedroom, bathroom, amenities, view）を設定

3. **写真分類の管理**
   - `docs/写真分類表.md` で写真の分類を管理
   - 不要な写真は備考欄に「delete」と記載

## 実装履歴

### 2025-08-31: 8weeks Fujimi 写真ギャラリー実装

**実装概要**
- Fujimi物件（グランドピアノのある森の中の一棟貸切別荘）の写真を追加し、ウェブサイトのギャラリーシステムに統合

**対応内容**

1. **写真の圧縮・最適化**
   - 元画像56枚を圧縮（560.8MB → 7.5MB、98.7%削減）
   - 追加のLINE ALBUM写真6枚も圧縮（1.6MB → 1.4MB）
   - 圧縮スクリプト作成：`compress-fujimi.py`, `compress-line-album.py`

2. **写真分類表による管理**
   - `docs/写真分類表.md`にFujimi物件の写真46枚を追加
   - 7つのカテゴリーに分類：exterior, living, kitchen, bedroom, bathroom, amenities, view
   - 削除対象5枚を「delete」マークで管理

3. **ギャラリーデータの更新**
   - `gallery-data.json`: 41枚の写真データを追加（削除対象を除外）
   - `scripts/clean-gallery-data.js`: Pinterest風ギャラリー用データを更新
   - featuredフラグ設定でメイン写真を指定

4. **GitHub Pages対応**
   - スペースを含むフォルダ名のURLエンコーディング（`Fujimi Photos` → `Fujimi%20Photos`）
   - パス修正でGitHub Pages上での画像表示問題を解決

**技術的な課題と解決**
- **問題**: GitHub Pages上で画像が表示されない
- **原因**: フォルダ名のスペースが正しくエンコードされていない
- **解決**: URLエンコーディング（%20）を適用

**ファイル変更履歴**
- 新規作成：`scripts/compress-fujimi.py`, `scripts/compress-line-album.py`
- 更新：`gallery-data.json`, `scripts/clean-gallery-data.js`
- 追加：`assets/images/gallery/optimized/Fujimi Photos/` (62枚の圧縮済み画像)
- 更新：`docs/写真分類表.md`

**現在の状況**
- Fujimi物件の写真がウェブサイト上で正常に表示
- 他物件（Quriu、Studio）と同様のフィルタリング・ライトボックス機能が利用可能
- 合計3物件すべてのギャラリーが統合完了
- 削除対象写真（5枚）を除外し、最終的に41枚の写真を表示

### 2025-09-02: SEO強化実装 - 富士見町キーワード最適化

**実装概要**
- Google検索で「富士見町ホテル」「富士見町宿泊」「富士見町移住体験」での上位表示を目指すSEO対策を実装

**実装内容**

1. **メタタグ・タイトル最適化**
   - タイトル: 「富士見町のホテル・宿泊施設 | 8weeks Fujimi - 八ヶ岳山麓の貸別荘で移住体験」
   - メタディスクリプション: 富士見町関連キーワードを自然に配置
   - キーワードタグ: 地域特化キーワードを追加

2. **構造化データ（JSON-LD）強化**
   - LodgingBusinessスキーマに詳細情報追加
   - FAQPageスキーマで検索結果を強化
   - LocalBusinessスキーマで地域情報を充実
   - BreadcrumbListでナビゲーション構造を明示

3. **コンテンツキーワード最適化**
   - H1タグ: 「8weeks Fujimi - 富士見町の宿泊施設」
   - セクションタイトルに「富士見町」を自然に組み込み
   - 移住体験ストーリーに地域キーワードを配置

4. **新規ページ作成**
   - `fujimimachi-hotel.html`: 富士見町ホテル専用ランディングページ
   - 富士見町特化のFAQ、アクセス情報、料金表を含む完全なローカルSEOページ
   - 問い合わせ先: 8weeks.fujimi@gmail.com

5. **SEO技術ファイル追加**
   - `sitemap.xml`: 全ページのサイトマップ（Google Search Console用）
   - `robots.txt`: クローラー制御とサイトマップ指定
   - `google6ef0a2cf1735ead9.html`: Google Search Console所有権確認ファイル

6. **SEOガイド資料**
   - `seo-improvement-guide.md`: 継続的なSEO改善のためのガイド
   - `seo-optimization.html`: 最適化サンプルファイル

**SEO効果期待値**
- 短期（1-4週間）: Googleインデックス、ブランド名検索1位
- 中期（1-3ヶ月）: 「富士見町ホテル」「富士見町宿泊」で10位以内
- 長期（3-6ヶ月）: 「富士見町ホテル」で5位以内、月間検索流入500件

**現在の状況**
- Google Search Console登録完了
- サイトマップ送信済み（処理待ち）
- 全SEOファイルがGitHub Pagesで公開中
- 追加施策：Googleマイビジネス登録、外部リンク獲得が必要

**次回実施予定項目**
1. Google Search Consoleでのサイトマップ認識確認
2. Googleマイビジネス3施設登録
3. 富士見町観光協会等への掲載依頼
4. ページ速度最適化（Core Web Vitals改善）
5. 月次SEO効果測定レポート開始

## ライセンス
© 2025 8weeks Fujimi. All rights reserved.

## お問い合わせ
- Email: 8weeks.fujimi@gmail.com
- Website: https://8weeksfujimi.github.io/8weeks-LP/

## SEOツール・リンク
- Google Search Console: https://search.google.com/search-console
- サイトマップURL: https://8weeksfujimi.github.io/8weeks-LP/sitemap.xml
- 富士見町ホテル専用ページ: https://8weeksfujimi.github.io/8weeks-LP/fujimimachi-hotel.html
- SEO改善ガイド: [seo-improvement-guide.md](./seo-improvement-guide.md)