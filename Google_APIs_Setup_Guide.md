# Google APIs設定ガイド - 8WEEKS FUJIMI予約システム

## 概要
8WEEKS FUJIMI予約システムで使用するGoogle APIs（Gmail、Calendar、Sheets）の設定手順を説明します。

---

## 必要なAPI
1. **Gmail API** - 自動メール送信
2. **Google Calendar API** - 予約カレンダー管理  
3. **Google Sheets API** - 予約データ管理（オプション）

---

## ステップ1: Google Cloud Projectの作成

### 1.1 Google Cloud Consoleにアクセス
- [Google Cloud Console](https://console.cloud.google.com/) にアクセス
- Googleアカウントでログイン

### 1.2 新しいプロジェクトを作成
```
1. 左上の「プロジェクトを選択」をクリック
2. 「新しいプロジェクト」をクリック  
3. プロジェクト名: "8weeks-fujimi-booking"
4. 「作成」をクリック
```

---

## ステップ2: APIの有効化

### 2.1 Gmail API
```
1. Google Cloud Console > APIs & Services > ライブラリ
2. "Gmail API" を検索
3. Gmail APIを選択 > 「有効にする」
```

### 2.2 Google Calendar API
```
1. APIs & Services > ライブラリ
2. "Google Calendar API" を検索  
3. Google Calendar APIを選択 > 「有効にする」
```

### 2.3 Google Sheets API（オプション）
```
1. APIs & Services > ライブラリ
2. "Google Sheets API" を検索
3. Google Sheets APIを選択 > 「有効にする」
```

---

## ステップ3: 認証情報の作成

### 3.1 OAuth 2.0クライアントIDの作成
```
1. APIs & Services > 認証情報
2. 「認証情報を作成」> 「OAuth クライアント ID」
3. アプリケーションの種類: 「ウェブアプリケーション」
4. 名前: "8weeks-fujimi-web-client"
5. 承認済みJavaScriptの生成元:
   - http://localhost:8080 (開発用)
   - https://your-domain.com (本番用)
6. 承認済みリダイレクトURI:
   - http://localhost:8080/booking.html (開発用)  
   - https://your-domain.com/booking.html (本番用)
7. 「作成」をクリック
```

### 3.2 APIキーの作成
```
1. APIs & Services > 認証情報
2. 「認証情報を作成」> 「APIキー」
3. 作成されたAPIキーをコピー
4. APIキーの制限（推奨）:
   - アプリケーションの制限: HTTPリファラー
   - 許可するリファラー: your-domain.com/*
   - APIの制限: Gmail API, Calendar API, Sheets API
```

---

## ステップ4: Google Calendarの設定

### 4.1 予約用カレンダーの作成
各物件用に専用カレンダーを作成します：

```
1. Google Calendarを開く
2. 左側「他のカレンダー」> 「新しいカレンダーを作成」

【8weeks Fujimi用】
- カレンダー名: "8weeks-fujimi-bookings"
- 説明: "8weeks Fujimi 予約管理用"
- タイムゾーン: Asia/Tokyo

【8weeks Quriu用】  
- カレンダー名: "8weeks-quriu-bookings"
- 説明: "8weeks Quriu 予約管理用"
- タイムゾーン: Asia/Tokyo

【8weeks Studio用】
- カレンダー名: "8weeks-studio-bookings"  
- 説明: "8weeks Studio 予約管理用"
- タイムゾーン: Asia/Tokyo
```

### 4.2 カレンダーIDの取得
```
1. 作成したカレンダーの設定を開く
2. 「カレンダーの統合」セクション
3. 「カレンダーID」をコピー
   例: abc123@group.calendar.google.com
```

---

## ステップ5: コードの設定

### 5.1 booking.jsの設定
`booking.js`ファイルの以下の部分を編集：

```javascript
// Google API初期化設定
await gapi.client.init({
    apiKey: 'YOUR_API_KEY_HERE',           // ステップ3.2で取得
    clientId: 'YOUR_CLIENT_ID_HERE',       // ステップ3.1で取得  
    discoveryDocs: [
        'https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest',
        'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'
    ],
    scope: 'https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/calendar'
});

// カレンダーID設定
const calendarIds = {
    'fujimi': 'FUJIMI_CALENDAR_ID@group.calendar.google.com',    // ステップ4.2で取得
    'quriu': 'QURIU_CALENDAR_ID@group.calendar.google.com',      // ステップ4.2で取得
    'studio': 'STUDIO_CALENDAR_ID@group.calendar.google.com'     // ステップ4.2で取得
};
```

### 5.2 オーナーメールアドレス設定
```javascript
// オーナーへの通知メール
await this.sendEmail(
    'your-email@example.com',    // 実際のオーナーメールアドレスに変更
    `【新規予約】${formData.property.name} - ${formData.bookingId}`,
    ownerEmailBody
);
```

---

## ステップ6: テスト実行

### 6.1 ローカルサーバーの起動
```bash
# Python 3の場合
python -m http.server 8080

# Node.jsの場合  
npx serve -p 8080
```

### 6.2 テストアクセス
- ブラウザで `http://localhost:8080` にアクセス
- 予約フォームをテスト

### 6.3 確認項目
- [ ] Google認証が正常に動作する
- [ ] カレンダーにイベントが作成される
- [ ] 確認メールが送信される
- [ ] エラーハンドリングが機能する

---

## ステップ7: 本番環境デプロイ

### 7.1 ドメイン設定の更新
Google Cloud Consoleで本番ドメインを追加：
```
1. APIs & Services > 認証情報
2. 作成したOAuth クライアントID を選択
3. 承認済みJavaScriptの生成元に本番ドメインを追加
4. 承認済みリダイレクトURIに本番URLを追加
```

### 7.2 セキュリティ設定
- APIキーの制限を本番ドメインに設定
- HTTPSの使用を確認
- 認証情報の適切な管理

---

## トラブルシューティング

### よくある問題と解決法

#### 1. "API key not valid" エラー
```
原因: APIキーが正しく設定されていない
解決: 
- APIキーが正しくコピーされているか確認
- APIキーの制限設定を確認
- APIが有効化されているか確認
```

#### 2. "Origin not allowed" エラー  
```
原因: OAuth設定でオリジンが許可されていない
解決:
- Google Cloud ConsoleでJavaScriptオリジンを確認
- HTTPSを使用しているか確認
```

#### 3. カレンダーへのアクセス権限エラー
```
原因: カレンダーの共有設定またはAPI権限の問題
解決:
- カレンダーの共有設定を確認
- 適切なスコープが設定されているか確認
```

#### 4. メール送信エラー
```
原因: Gmail APIの権限またはスコープの問題  
解決:
- Gmail APIが有効化されているか確認
- 送信用メールアカウントの設定確認
- OAuth スコープに gmail.send が含まれているか確認
```

---

## セキュリティ注意事項

### 1. APIキーの管理
- APIキーをコード内にハードコーディングしない
- 環境変数やsettingsファイルで管理
- 定期的にAPIキーをローテーション

### 2. 権限の最小化
- 必要最小限のAPIスコープのみ許可
- カレンダーへのアクセス権限を適切に設定
- 本番環境では適切な制限を設置

### 3. データ保護
- 個人情報の適切な取り扱い
- HTTPS通信の使用
- ログ出力時の個人情報除外

---

## 運用・メンテナンス

### 1. 定期確認項目
- [ ] API使用量の監視
- [ ] エラーログの確認  
- [ ] カレンダー同期状況の確認
- [ ] メール送信状況の確認

### 2. バックアップ
- 予約データの定期バックアップ
- カレンダー設定のバックアップ
- 認証情報の安全な保管

### 3. アップデート
- Google APIs SDKの定期アップデート
- セキュリティパッチの適用
- 機能改善の実装

---

## 追加リソース

### 公式ドキュメント
- [Gmail API Documentation](https://developers.google.com/gmail/api)
- [Google Calendar API Documentation](https://developers.google.com/calendar/api)
- [Google Sheets API Documentation](https://developers.google.com/sheets/api)

### サンプルコード
- [Gmail API Samples](https://github.com/googleworkspace/gmail-api-samples)
- [Calendar API Samples](https://github.com/googleworkspace/calendar-api-samples)

### サポート
- [Google Workspace Developer Support](https://developers.google.com/workspace/support)
- [Stack Overflow - google-api](https://stackoverflow.com/questions/tagged/google-api)

---

**最終更新**: 2025年7月29日  
**バージョン**: 1.0  
**対象**: 8WEEKS FUJIMI 予約システム v1.0