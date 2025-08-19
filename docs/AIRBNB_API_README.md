# Airbnb API Integration Guide

## 概要
8weeks Fujimi LPサイトにAirbnbのレビュー数、評価、料金情報を自動取得する機能を追加しました。

## ファイル構成

### 1. airbnb-data.js
- クライアントサイドのAirbnbデータ管理
- 静的データのフォールバック機能
- 自動データ更新機能

### 2. airbnb-proxy-server.js
- Node.js プロキシサーバー
- AirbnbページからWebスクレイピングでデータ取得
- CORS問題を回避

## セットアップ方法

### Option 1: 静的データのみ（簡単）
現在の実装：
- airbnb-data.js の `airbnbDataFallback` オブジェクトを手動更新
- サーバー不要
- データは手動更新

### Option 2: 自動データ取得（推奨）

#### 必要なソフトウェア
- Node.js (v14以上)
- npm

#### インストール手順
1. サーバーディレクトリに移動
```bash
cd "/Users/shunji/Library/Mobile Documents/iCloud~md~obsidian/Documents/Shunji Memo/8weeks LP"
```

2. package.jsonを作成
```bash
npm init -y
```

3. 依存関係をインストール
```bash
npm install express cors axios cheerio
```

4. プロキシサーバーを起動
```bash
node airbnb-proxy-server.js
```

#### airbnb-data.jsの設定変更
```javascript
// getAirbnbData関数を以下のように変更
async function getAirbnbData(propertyKey) {
    try {
        const response = await fetch(`http://localhost:3001/api/airbnb/${propertyKey}`);
        const data = await response.json();
        return data.success ? data.data : airbnbDataFallback[propertyKey];
    } catch (error) {
        console.error('Error fetching Airbnb data:', error);
        return airbnbDataFallback[propertyKey];
    }
}
```

## 機能説明

### 自動データ更新
- ページロード時に最新データを取得
- 24時間ごとに自動更新
- エラー時は静的データにフォールバック

### 更新されるデータ
- 評価 (rating)
- レビュー数 (reviewCount)
- Superhost ステータス
- 価格情報
- 利用可能状況

### 対象物件
- 8weeks Fujimi
- 8weeks Quriu  
- 8weeks Studio

## データ形式

```javascript
{
    rating: 4.98,
    reviewCount: 45,
    superhost: true,
    price: '¥12,000',
    availability: 'Available',
    lastUpdated: '2024-08-01T12:00:00.000Z'
}
```

## トラブルシューティング

### データが更新されない
1. プロキシサーバーが起動しているか確認
2. コンソールでエラーメッセージを確認
3. Airbnbページ構造の変更の可能性

### CORS エラー
- プロキシサーバーを使用してください
- 直接Airbnbにアクセスすることはできません

### レート制限
- Airbnbからのレート制限を避けるため、適度な間隔で取得
- 現在は24時間間隔に設定

## カスタマイズ

### 更新間隔の変更
```javascript
// 24時間を12時間に変更
setInterval(refreshPropertyData, 12 * 60 * 60 * 1000);
```

### 新しい物件の追加
1. `airbnbProperties` オブジェクトに追加
2. `airbnbDataFallback` にデータ追加
3. HTMLにdata-property属性を追加

## 注意事項

1. **利用規約**: Airbnbの利用規約に従ってください
2. **レート制限**: 過度なリクエストは避けてください
3. **データ精度**: スクレイピングデータの精度は保証されません
4. **メンテナンス**: Airbnbのページ構造変更時は修正が必要

## 更新履歴
- 2024-08-01: 初版作成
- Airbnb API統合機能を追加