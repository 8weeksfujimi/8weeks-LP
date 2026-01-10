# Google Hotel Center統合実装プラン - 8weeks Fujimi

## 目標
Googleマップ・検索結果に空室状況と価格を表示し、OTA経由せずにAirbnbと連携した直接予約システムを構築

## フェーズ1: Google Business Profile最適化（1-2週間）

### 必要な作業
1. **3施設のGoogle Business Profile完全設定**
   - 8weeks Fujimi（メイン施設）
   - 8weeks Quriu
   - 8weeks Studio

2. **各施設に必要な情報**
   - 正確な住所・座標
   - 営業時間（チェックイン15:00/チェックアウト10:00）
   - 電話番号（要取得）
   - 高品質写真（最低10枚/施設）
   - アメニティ詳細
   - 宿泊料金帯設定

3. **カテゴリー設定**
   - メインカテゴリー: 「宿泊施設」「貸別荘」
   - サブカテゴリー: 「ホテル」「バケーションレンタル」

## フェーズ2: Google Hotel Center連携（3-9週間）

### 連携パートナー選定
推奨順位：
1. **Cloudbeds**（中小規模向け、日本対応）
2. **WebRezPro**（中小規模特化）
3. **E4jConnect**（Google認定パートナー）

### 必要なシステム
```
8weeks直接予約システム
    ↓
連携パートナーAPI（Cloudbeds等）
    ↓
Google Hotel Center
    ↓  
Googleマップ・検索結果表示
```

### API連携の種類
- **ARI API**（推奨）: リアルタイム料金・在庫管理
- **Pull API**: 外部システムからデータ取得

## フェーズ3: Airbnb連携システム（2-4週間）

### Airbnbデータ同期方式

#### A. HAR File方式（合法・推奨）
```javascript
// 1. Airbnbカレンダーページで手動でHARファイル記録
// 2. JSON形式で空室・価格データを抽出
// 3. 自動処理スクリプトで連携システムに送信

const extractAirbnbData = (harFile) => {
    const bookingData = parseHARFile(harFile);
    return {
        dates: bookingData.availability,
        prices: bookingData.pricing,
        property_id: bookingData.listing_id
    };
};
```

#### B. Apify API利用
```javascript
// 月額$49〜でAirbnbカレンダーAPI利用
const apifyClient = require('apify-client').ApifyApi;

const airbnbData = await apifyClient.call(
    'rigelbytes/airbnb-availability-calendar',
    {
        listingUrl: 'https://airbnb.com/h/8weeksfujimi',
        checkin: '2025-09-15',
        checkout: '2025-12-15'
    }
);
```

### データ同期フロー
```
Airbnbカレンダー（手動/API）
    ↓ 1日1-2回更新
8weeks予約管理システム
    ↓ リアルタイム
連携パートナー（Cloudbeds）
    ↓ リアルタイム  
Google Hotel Center
    ↓
Googleマップ表示
```

## フェーズ4: 直接予約システム最適化

### 現在のbooking.htmlシステム改良
```javascript
// Google Hotel Center経由のアクセスを識別
const isFromGoogle = new URLSearchParams(window.location.search).get('utm_source') === 'google_hotel';

if (isFromGoogle) {
    // Google経由ユーザー向けの特別処理
    gtag('event', 'google_hotel_click', {
        'property': getPropertyFromUrl(),
        'dates': getSelectedDates()
    });
}
```

### 必要な機能追加
1. **リアルタイム空室確認**
2. **動的価格計算**
3. **Airbnb価格との整合性チェック**
4. **Google Analytics連携強化**

## 技術実装詳細

### 1. 空室・価格管理システム
```javascript
// calendar-sync.js
class AirbnbCalendarSync {
    constructor(propertyId) {
        this.propertyId = propertyId;
        this.lastSync = null;
    }

    async syncAvailability() {
        // HAR File方式でデータ取得
        const harData = await this.loadHARFile();
        const availability = this.parseAvailability(harData);
        
        // 連携パートナーAPIに送信
        await this.updatePartnerSystem(availability);
    }

    parseAvailability(harData) {
        // Airbnbカレンダー情報を解析
        return {
            dates: extractDatesFromHAR(harData),
            prices: extractPricesFromHAR(harData),
            restrictions: extractRestrictionsFromHAR(harData)
        };
    }
}
```

### 2. Google Hotel Center設定用JSON
```json
{
    "hotel_data": {
        "8weeks_fujimi": {
            "hotel_id": "8weeks_fujimi_main",
            "name": "8weeks Fujimi",
            "address": "長野県諏訪郡富士見町",
            "booking_url": "https://8weeksfujimi.github.io/8weeks-LP/booking.html",
            "rates_api_endpoint": "/api/rates/fujimi",
            "availability_api_endpoint": "/api/availability/fujimi"
        }
    }
}
```

## 期待される効果

### 検索結果での表示
- **Googleマップ**: 「8weeks Fujimi - ¥15,000〜/泊 空室あり」
- **検索結果**: リッチスニペットで価格・空室状況表示
- **公式サイトバッジ**: 「公式サイト」認証表示

### KPI目標
- Google経由予約数: 月20件→50件
- 直接予約比率: 30%→60%
- OTA手数料削減: 月15-20万円

## 実装スケジュール

| フェーズ | 期間 | 主な作業 |
|---------|------|----------|
| Phase1 | 1-2週間 | Google Business Profile設定完了 |
| Phase2 | 3-9週間 | 連携パートナー選定・契約・接続 |
| Phase3 | 2-4週間 | Airbnb連携システム開発 |
| Phase4 | 1-2週間 | 最適化・テスト・運用開始 |

## 費用概算

### 初期費用
- 連携パートナー設定費: $500-2,000
- 開発・設定作業: 40-60時間

### 月額費用
- 連携パートナー利用料: $99-299/月
- Apify API（選択時）: $49-199/月

### ROI計算
```
月額OTA手数料削減: 150,000円
システム運用費用: 50,000円
純利益向上: 100,000円/月
年間効果: 1,200,000円
```

## リスクと対策

### 技術リスク
- **Airbnb仕様変更**: HAR File方式なら影響最小
- **Google仕様変更**: 認定パートナー経由なら自動対応

### 法的リスク
- **Airbnb利用規約**: HAR File方式は合法的範囲内
- **データ保護**: 個人情報の適切な管理

## 次のアクション

### 即座に開始（今週）
1. Google Business Profile の詳細設定完了
2. 連携パートナー（Cloudbeds等）への問い合わせ
3. 電話番号取得・設定

### 中期（来月）
1. 連携パートナーとの契約・設定開始
2. Airbnbデータ同期システムの開発着手
3. 直接予約システムの改良計画策定