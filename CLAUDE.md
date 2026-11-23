# 8weeks LP プロジェクトコンテクスト

## プロジェクト概要
8weeks Stayの宿泊施設を紹介するランディングページプロジェクト。
富士見町にある3つの施設（8weeks Fujimi、8weeks Quriu、8weeks Studio）の情報を載せ、公式サイトの予約ページ（直接予約）と Airbnb リスティングへ案内する。

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

## 予約の導線（宿の頁）

予約ボタンは、**主が公式サイトの予約ページ（予約システム Beds24）、従が Airbnb**。対象は `index.html`・`index-en.html`・`panorama-resort.html`・`fujimimachi-hotel.html`。

| 棟 | 予約ページの物件ID | Airbnb の名前 |
|---|---|---|
| 8weeks Fujimi | 370159 | `8weeksfujimi` |
| 8weeks Quriu | 370160 | `8weeks-quriu` |
| 8weeks Studio | 370161 | `8weeks-studio` |

- 予約ページのアドレス: `https://beds24.com/booking2.php?propid=<物件ID>&lang=<ja か en>&referer=<印>`。日本語の頁は `lang=ja`、英語の頁は `lang=en`
- `referer` は、どの頁のどのボタンから来た予約かを、予約システムの側で見分けるための印（`lp-ja-spaces`・`lp-ja-booking`・`lp-en-spaces`・`lp-en-booking`・`lp-panorama-stays`・`lp-panorama-booking`・`lp-fujimimachi`）
- Airbnb のリンクは、日本語の頁が `https://www.airbnb.jp/h/<名前>`、英語の頁が `https://www.airbnb.com/h/<名前>`
- 予約のリンクには `data-book`（`direct`／`airbnb`）・`data-property`（`fujimi`／`quriu`／`studio`）・`data-pos`（頁の中の場所）を付けてある。解析の道具は入れていない（あとでクリックを数えるときの目印）
- 料金の差を書いた要素には `data-claim="direct-rate"` を付けてある。料金の決まりを変えたら、`grep -n 'data-claim="direct-rate"' *.html` で出る場所をまとめて直す。`index-en.html` と `panorama-resort.html` は、構造化データ（FAQPage）の中にも同じ文がある
- キャンセルの条件・支払い方法・予約の流れ（リクエスト制）を書いた場所は、予約欄の箇条書き（`.lp-assure`）と、`index-en.html` の「Frequently Asked Questions」（見える文と構造化データの両方）
- ローカルアーカイブの頁（archive*.html・records/）には、この導線を足さない

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

## ローカルアーカイブ（archive*.html・records/・data/）

宿の頁とは別に、土地の記録「8weeks Local Archive」を同じリポジトリで公開している。**記録の本文は宣伝にしない**（宿への案内は、頁の外側の開示欄に一か所だけ）。つくり方と決まりは `archive-method.html`（方法と凡例）に公開している。

**台帳は一つ**（`data/archive-db.json`）。その中の記録を、土地（サブリージョン）で三つに分けている — 富士見（`FJM-`）・蓼科（`TSN-`）・諏訪（`SUW-`）。「富士見編」「蓼科編」という言い方はしない。

### 構成
| ファイル | 役割 |
|---|---|
| `archive.html` | 手帖。Notes（一人称の覚え書き。本人だけが書く）・Places（場所の記録。一つの並びで、土地は絞り込みの区分） |
| `archive-db.html` | 台帳（Ledger）。土地・主題・資本で絞り込み、考証メモ・制作の記録・出典を開ける。`?region=suwa` で土地を指定 |
| `archive-graph.html` | 星図（Graph）。記録どうしのつながり |
| `archive-map.html` | 絵図（Map）。座標のある記録を地図に置く。`?region=suwa` で土地を指定 |
| `archive-method.html` | 方法と凡例。確度の定義・出典の扱い・土地の線引き・書き手の立場・引用と訂正・統計 |
| `records/<ID>.html` | 記録ごとの頁（固定URL。**生成物**） |
| `records/index.html`・`records/<土地>.html` | 総目録と、土地ごとの入口の頁（**生成物**。三つの土地は同じ型） |
| `data/archive-db.json` | **一つの台帳（生成物）**。頁はこれだけを読む。各記録に `subregion`（主の土地）・`related_subregions`（関わる土地）・`updated`（版）が付く |
| `data/fujimi-archive-db.json` | 富士見の書き出し元（**制作側パイプラインの書き出し。このリポジトリで手で直さない**） |
| `data/tateshina-archive-db.json`・`data/suwa-archive-db.json` | 蓼科・諏訪の書き出し元（考証の資料から統合スクリプトで作る。内部の資料は vault にある） |
| `data/archive-config.json` | 土地（線引き・市町村・色）・分類・資本の割り当て・出典の種類の規則（頁と生成スクリプトの両方が読む） |
| `data/archive-stats.json` | 台帳の統計（**生成物**） |
| `assets/styles/archive-pages.css` | 記録の頁・総目録・土地の入口・方法の頁の共通スタイル |

### 書き出し元を差し替えたら（富士見の書き出しを更新したときも、かならず）
```bash
python3 scripts/build_archive_pages.py            # 一つの台帳・records/*.html・総目録・土地の入口・統計・sitemap.xml を作り直す
python3 scripts/validate_archive_db.py            # 形と整合性の検査（--links で出典URLの生存確認）
python3 scripts/build_archive_pages.py --check    # 何も書かずに、生成物ぜんぶが、いまの書き出し元・設定・生成スクリプトと合っているかを確かめる
```
- **回し直さないと、台帳・星図・絵図・記録の頁は古いままになる**（頁は `data/archive-db.json` だけを読むため）。`--check` は、台帳だけでなく、記録の頁・総目録・土地の入口・統計・sitemap・方法の頁の統計欄までを突き合わせ、古ければ `STALE` で止まる（検査スクリプトもこれを呼ぶ）
- **記録が台帳から無くなると、生成スクリプトは頁を消さずに止まる**。書き出し元の置き忘れや記録の落ちで、引用されている頁を黙って消さないため。本当に消してよいときだけ `--prune` を付ける（原則として使わない。下の「頁を消さない」を先に読む）
- 生成物は、同じ書き出し元と設定からは、いつ回しても同じ内容になる（日付は書き出し元の `updated` から取る。回した日を入れない）
- `data/archive-db.json`・`records/`・`data/archive-stats.json`・`sitemap.xml` のアーカイブの行・`archive-method.html` の統計欄（`STATS:BEGIN`〜`END`）は、生成スクリプトが書き換える。手で直さない
- 記録の頁のURL（`records/<ID>.html`）は引用の単位なので、**IDを変えない・頁を消さない**
- 訂正は黙って直さない。記録の `review_log` と、`archive-method.html` の「これまでの歩みと、主な訂正」に残す

### 土地（サブリージョン）の決まり
- 記録は主の土地を一つ持つ（書き出し元のファイルで決まる）。線引きは `data/archive-config.json` の `subregions` と、方法の頁の「一つの台帳と、三つの土地」
- 「関わる土地」は、記録の `municipality` に別の土地の市町村が含まれるとき、生成スクリプトが機械的に付ける。手で足さない
- 記録の頁の題は「名称｜分類の記録（主の市町村）｜ローカルアーカイブ」。土地の名ではなく市町村を入れる。市町村を決められない記録（富士見の `town_outside: true`＝舞台が富士見町の外にある記録）には、括弧を付けない
- `town_outside` は富士見の記録のための印で、「富士見町の外の事柄を含む」の意味。蓼科・諏訪の記録では常に `true` なので、意味を持たない。蓼科・諏訪の記録の市町村は `municipality` で見る（台帳の `field_notes` に書いてある）
- 宿の有無は、土地の説明（`desc`）に書かない。開示の一文（`stay`）に分けてあり、記録の頁と土地の入口の、本文の外側の開示欄（書き手の立場）にだけ出る。方法の頁には「書き手の立場」の節に別に書いてある
- 三つの土地は同じ扱いにする。一つだけ別立てにしない

### 記録を書くときの決まり（要点）
- 出典は、開いて確かめたURLだけ。1記録に2件以上。確度は主張ごとに S/A/B/C/D（定義は方法の頁）
- 当事者（企業・施設・観光協会・社寺、そして宿）の発信は確度B。事典だけを根拠に S・A を付けない
- 書かない: 現存の企業・団体・個人の評価、宣伝の語、進歩の物語・賛美・悲嘆、存命の私人の特定、移ろう実用情報、宿のこと
- 書く: 記録の欠落（探しても見つからなかったこと）、出典間の食い違い
- 蓼科・諏訪の記録の項目（`capital`・`source_details`・`references`・`related_records`・`open_questions`・`geo_precision` など）は `scripts/validate_archive_db.py` が検査する
