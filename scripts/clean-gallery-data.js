const cleanGalleryData = {
  // Room type definitions for comparison view
  "roomTypes": [
    { "key": "living",   "label": "リビング・ダイニング", "labelEn": "Living & Dining", "icon": "sofa" },
    { "key": "bedroom",  "label": "寝室",               "labelEn": "Bedroom",          "icon": "bed-double" },
    { "key": "kitchen",  "label": "キッチン",            "labelEn": "Kitchen",           "icon": "cooking-pot" },
    { "key": "bathroom", "label": "水回り",              "labelEn": "Bath & Wash",       "icon": "bath" },
    { "key": "exterior", "label": "外観・周辺",          "labelEn": "Exterior",          "icon": "trees" }
  ],
  "properties": {
    "fujimi": {
      "name": "8weeks Fujimi",
      "description": "グランドピアノのある森の中の一棟貸切別荘",
      "photos": [
        // --- Curated first 5 (design impact order) ---
        { "src": "assets/images/gallery/optimized/Fujimi%20Photos/DSCF4080.jpg",  "caption": "グランドピアノ",   "category": "living",   "featured": true },
        { "src": "assets/images/gallery/optimized/Fujimi%20Photos/LINE_ALBUM_20240202_250831_1.jpg", "caption": "リビング全景", "category": "living", "featured": true },
        { "src": "assets/images/gallery/optimized/Fujimi%20Photos/DSCF3664.jpg",  "caption": "寝室",             "category": "bedroom",  "featured": true },
        { "src": "assets/images/gallery/optimized/Fujimi%20Photos/DSCF2243.jpg",  "caption": "外観",             "category": "exterior", "featured": true },
        { "src": "assets/images/gallery/optimized/Fujimi%20Photos/DSCF3602.jpg",  "caption": "和室",             "category": "bedroom",  "featured": true },
        // --- Remaining photos ---
        { "src": "assets/images/gallery/optimized/Fujimi%20Photos/DSCF2457.jpg",  "caption": "リビング",         "category": "living" },
        { "src": "assets/images/gallery/optimized/Fujimi%20Photos/DSCF3800.jpg",  "caption": "リビング詳細",     "category": "living" },
        { "src": "assets/images/gallery/optimized/Fujimi%20Photos/DSCF3735.jpg",  "caption": "リビング",         "category": "living" },
        { "src": "assets/images/gallery/optimized/Fujimi%20Photos/DSCF3744.jpg",  "caption": "ダイニング",       "category": "living" },
        { "src": "assets/images/gallery/optimized/Fujimi%20Photos/DSCF3863.jpg",  "caption": "リビング別角度",   "category": "living" },
        { "src": "assets/images/gallery/optimized/Fujimi%20Photos/LINE_ALBUM_20240202_250831_6.jpg", "caption": "夜のリビング",   "category": "living" },
        { "src": "assets/images/gallery/optimized/Fujimi%20Photos/DSCF3715.jpg",  "caption": "ベッドルーム詳細", "category": "bedroom" },
        { "src": "assets/images/gallery/optimized/Fujimi%20Photos/DSCF3620.jpg",  "caption": "キッチン",         "category": "kitchen" },
        { "src": "assets/images/gallery/optimized/Fujimi%20Photos/DSCF2356.jpg",  "caption": "キッチン詳細",     "category": "kitchen" },
        { "src": "assets/images/gallery/optimized/Fujimi%20Photos/DSCF3643.jpg",  "caption": "調理器具",         "category": "kitchen" },
        { "src": "assets/images/gallery/optimized/Fujimi%20Photos/DSCF2419.jpg",  "caption": "バスルーム",       "category": "bathroom" },
        { "src": "assets/images/gallery/optimized/Fujimi%20Photos/DSCF3653.jpg",  "caption": "洗面所",           "category": "bathroom" },
        { "src": "assets/images/gallery/optimized/Fujimi%20Photos/DSCF3886.jpg",  "caption": "建物外観",         "category": "exterior" },
        { "src": "assets/images/gallery/optimized/Fujimi%20Photos/DSCF2450.jpg",  "caption": "エントランス",     "category": "exterior" },
        { "src": "assets/images/gallery/optimized/Fujimi%20Photos/DSCF4020.jpg",  "caption": "外観朝",           "category": "exterior" },
        { "src": "assets/images/gallery/optimized/Fujimi%20Photos/DSCF4031.jpg",  "caption": "外観昼",           "category": "exterior" },
        { "src": "assets/images/gallery/optimized/Fujimi%20Photos/DSCF4053.jpg",  "caption": "周辺環境",         "category": "exterior" },
        { "src": "assets/images/gallery/optimized/Fujimi%20Photos/DSCF2454.jpg",  "caption": "アメニティ",       "category": "living" },
        { "src": "assets/images/gallery/optimized/Fujimi%20Photos/DSCF2519.jpg",  "caption": "室内設備",         "category": "living" },
        { "src": "assets/images/gallery/optimized/Fujimi%20Photos/LINE_ALBUM_20240202_250831_5.jpg", "caption": "窓辺の風景", "category": "exterior" }
      ]
    },
    "quriu": {
      "name": "8weeks Quriu",
      "description": "100m²超のフロア貸切・薪ストーブのある温かみのある空間",
      "photos": [
        // --- Curated first 5 (design impact order) ---
        { "src": "assets/images/gallery/optimized/Quriu%20Photo/202403_Quriu1.jpeg",  "caption": "薪ストーブのあるダイニング", "category": "living",   "featured": true },
        { "src": "assets/images/gallery/optimized/Quriu%20Photo/202403_Quriu16.jpeg", "caption": "夜のリビング",     "category": "living",   "featured": true },
        { "src": "assets/images/gallery/optimized/Quriu%20Photo/202403_Quriu25.jpeg", "caption": "ベッドルーム",     "category": "bedroom",  "featured": true },
        { "src": "assets/images/gallery/optimized/Quriu%20Photo/202403_Quriu10.jpeg", "caption": "ピアノ",           "category": "living",   "featured": true },
        { "src": "assets/images/gallery/optimized/Quriu%20Photo/202403_Quriu40.jpeg", "caption": "アメニティ",       "category": "bathroom", "featured": true },
        // --- Remaining photos ---
        { "src": "assets/images/gallery/optimized/Quriu%20Photo/202403_Quriu6.jpeg",  "caption": "リビング別角度",   "category": "living" },
        { "src": "assets/images/gallery/optimized/Quriu%20Photo/202403_Quriu7.jpeg",  "caption": "ダイニングエリア", "category": "living" },
        { "src": "assets/images/gallery/optimized/Quriu%20Photo/202403_Quriu17.jpeg", "caption": "窓際の景色",       "category": "living" },
        { "src": "assets/images/gallery/optimized/Quriu%20Photo/202403_Quriu14.jpeg", "caption": "リビング全体",     "category": "living" },
        { "src": "assets/images/gallery/optimized/Quriu%20Photo/202403_Quriu5.jpeg",  "caption": "ベッドルーム1",   "category": "bedroom" },
        { "src": "assets/images/gallery/optimized/Quriu%20Photo/202403_Quriu18.jpeg", "caption": "ベッドルーム2",   "category": "bedroom" },
        { "src": "assets/images/gallery/optimized/Quriu%20Photo/202403_Quriu26.jpeg", "caption": "子供部屋",       "category": "bedroom" },
        { "src": "assets/images/gallery/optimized/Quriu%20Photo/202403_Quriu27.jpeg", "caption": "書斎スペース",   "category": "bedroom" },
        { "src": "assets/images/gallery/optimized/Quriu%20Photo/202403_Quriu3.jpeg",  "caption": "キッチン",       "category": "kitchen" },
        { "src": "assets/images/gallery/optimized/Quriu%20Photo/202403_Quriu8.jpeg",  "caption": "キッチン詳細",   "category": "kitchen" },
        { "src": "assets/images/gallery/optimized/Quriu%20Photo/202403_Quriu11.jpeg", "caption": "洗面所",         "category": "bathroom" },
        { "src": "assets/images/gallery/optimized/Quriu%20Photo/202403_Quriu12.jpeg", "caption": "トイレ",         "category": "bathroom" },
        { "src": "assets/images/gallery/optimized/Quriu%20Photo/202403_Quriu36.jpeg", "caption": "ルームキー",     "category": "exterior" },
        { "src": "assets/images/gallery/optimized/Quriu%20Photo/202403_Quriu37.jpeg", "caption": "周辺環境",       "category": "exterior" },
        { "src": "assets/images/gallery/optimized/Quriu%20Photo/202403_Quriu34.jpeg", "caption": "庭",             "category": "exterior" },
        { "src": "assets/images/gallery/optimized/Quriu%20Photo/202403_Quriu32.jpeg", "caption": "テラス",         "category": "exterior" },
        { "src": "assets/images/gallery/optimized/Quriu%20Photo/202403_Quriu30.jpeg", "caption": "景色",           "category": "exterior" },
        { "src": "assets/images/gallery/optimized/Quriu%20Photo/202403_Quriu29.jpeg", "caption": "バルコニー",     "category": "exterior" },
        { "src": "assets/images/gallery/optimized/Quriu%20Photo/202403_Quriu9.jpeg",  "caption": "階段ホール",     "category": "living" },
        { "src": "assets/images/gallery/optimized/Quriu%20Photo/202403_Quriu21.jpeg", "caption": "エントランス",   "category": "exterior" },
        { "src": "assets/images/gallery/optimized/Quriu%20Photo/202403_Quriu38.jpeg", "caption": "アメニティ",     "category": "bathroom" },
        { "src": "assets/images/gallery/optimized/Quriu%20Photo/202403_Quriu20.jpeg", "caption": "窓からの景色",   "category": "living" },
        { "src": "assets/images/gallery/optimized/Quriu%20Photo/202403_Quriu22.jpeg", "caption": "廊下",           "category": "living" },
        { "src": "assets/images/gallery/optimized/Quriu%20Photo/202403_Quriu23.jpeg", "caption": "階段",           "category": "living" },
        { "src": "assets/images/gallery/optimized/Quriu%20Photo/202403_Quriu24.jpeg", "caption": "2階の廊下",     "category": "living" },
        { "src": "assets/images/gallery/optimized/Quriu%20Photo/202403_Quriu28.jpeg", "caption": "収納部屋",       "category": "bedroom" },
        { "src": "assets/images/gallery/optimized/Quriu%20Photo/202403_Quriu31.jpeg", "caption": "夕暮れ時",       "category": "exterior" },
        { "src": "assets/images/gallery/optimized/Quriu%20Photo/202403_Quriu35.jpeg", "caption": "駐車場",         "category": "exterior" }
      ]
    },
    "studio": {
      "name": "8weeks Studio",
      "description": "富士見商店街のリノベーションフラット・モダンなデザイン",
      "photos": [
        // --- Curated first 5 (design impact order) ---
        { "src": "assets/images/gallery/optimized/Studio%20Photos/DSCF9615.jpeg",           "caption": "リビング・ダイニング", "category": "living",   "featured": true },
        { "src": "assets/images/gallery/optimized/Studio%20Photos/DSCF9462.jpeg",           "caption": "外観",               "category": "exterior", "featured": true },
        { "src": "assets/images/gallery/optimized/Studio%20Photos/DSCF9526.jpeg",           "caption": "富士見駅方面",       "category": "exterior", "featured": true },
        { "src": "assets/images/gallery/optimized/Studio%20Photos/Bath%20room.jpeg",        "caption": "バスルーム",         "category": "bathroom", "featured": true },
        { "src": "assets/images/gallery/optimized/Studio%20Photos/DSCF9379.jpeg",           "caption": "読書コーナー",       "category": "living",   "featured": true },
        // --- Remaining photos ---
        { "src": "assets/images/gallery/optimized/Studio%20Photos/DSCF9283.jpeg",           "caption": "メインリビング",     "category": "living" },
        { "src": "assets/images/gallery/optimized/Studio%20Photos/DSCF9395.jpeg",           "caption": "リビング夜景",       "category": "living" },
        { "src": "assets/images/gallery/optimized/Studio%20Photos/DSCF9188.jpeg",           "caption": "ダイニングテーブル", "category": "living" },
        { "src": "assets/images/gallery/optimized/Studio%20Photos/DSCF9259.jpeg",           "caption": "リビング詳細",       "category": "living" },
        { "src": "assets/images/gallery/optimized/Studio%20Photos/DSCF9747.jpeg",           "caption": "夕暮れ時の室内",     "category": "living" },
        { "src": "assets/images/gallery/optimized/Studio%20Photos/DSCF9707.jpeg",           "caption": "室内全景",           "category": "living" },
        { "src": "assets/images/gallery/optimized/Studio%20Photos/DSCF9304.jpeg",           "caption": "ベッドルーム詳細",   "category": "bedroom" },
        { "src": "assets/images/gallery/optimized/Studio%20Photos/DSCF9410.jpeg",           "caption": "ベッドルーム夜",     "category": "bedroom" },
        { "src": "assets/images/gallery/optimized/Studio%20Photos/DSCF9294.jpeg",           "caption": "窓からの眺め",       "category": "bedroom" },
        { "src": "assets/images/gallery/optimized/Studio%20Photos/DSCF9228.jpeg",           "caption": "キッチン周辺",       "category": "kitchen" },
        { "src": "assets/images/gallery/optimized/Studio%20Photos/DSCF9242.jpeg",           "caption": "キッチン設備",       "category": "kitchen" },
        { "src": "assets/images/gallery/optimized/Studio%20Photos/Bath%20room%202.jpeg",    "caption": "バスルーム詳細",     "category": "bathroom" },
        { "src": "assets/images/gallery/optimized/Studio%20Photos/Toilet.jpeg",             "caption": "トイレ",             "category": "bathroom" },
        { "src": "assets/images/gallery/optimized/Studio%20Photos/DSCF9363.jpeg",           "caption": "洗面所",             "category": "bathroom" },
        { "src": "assets/images/gallery/optimized/Studio%20Photos/DSCF9441.jpeg",           "caption": "建物外観",           "category": "exterior" },
        { "src": "assets/images/gallery/optimized/Studio%20Photos/DSCF9751.jpeg",           "caption": "夜の外観",           "category": "exterior" },
        { "src": "assets/images/gallery/optimized/Studio%20Photos/DSCF9526.jpeg",           "caption": "富士見駅方面",       "category": "exterior" },
        { "src": "assets/images/gallery/optimized/Studio%20Photos/DSCF9513.jpeg",           "caption": "近隣の商店",         "category": "exterior" },
        { "src": "assets/images/gallery/optimized/Studio%20Photos/DSCF9515.jpeg",           "caption": "商店街の雰囲気",     "category": "exterior" },
        { "src": "assets/images/gallery/optimized/Studio%20Photos/DSCF9557.jpeg",           "caption": "室内装飾",           "category": "living" },
        { "src": "assets/images/gallery/optimized/Studio%20Photos/DSCF9166.jpeg",           "caption": "ワークスペース",     "category": "bedroom" },
        { "src": "assets/images/gallery/optimized/Studio%20Photos/DSCF9265.jpeg",           "caption": "インテリア装飾",     "category": "living" },
        { "src": "assets/images/gallery/optimized/Studio%20Photos/DSCF9273.jpeg",           "caption": "照明",               "category": "living" },
        { "src": "assets/images/gallery/optimized/Studio%20Photos/DSCF9193.jpeg",           "caption": "収納スペース",       "category": "bedroom" },
        { "src": "assets/images/gallery/optimized/Studio%20Photos/DSCF9322.jpeg",           "caption": "クローゼット",       "category": "bedroom" },
        { "src": "assets/images/gallery/optimized/Studio%20Photos/DSCF9204.jpeg",           "caption": "エントランス内",     "category": "living" },
        { "src": "assets/images/gallery/optimized/Studio%20Photos/DSCF9250.jpeg",           "caption": "窓際スペース",       "category": "living" },
        { "src": "assets/images/gallery/optimized/Studio%20Photos/DSCF9154.jpeg",           "caption": "リビング別角度",     "category": "living" },
        { "src": "assets/images/gallery/optimized/Studio%20Photos/DSCF9659.jpeg",           "caption": "セキュリティ",       "category": "exterior" },
        { "src": "assets/images/gallery/optimized/Studio%20Photos/DSCF9719.jpeg",           "caption": "チェックイン案内",   "category": "exterior" },
        { "src": "assets/images/gallery/optimized/Studio%20Photos/DSCF9621.jpeg",           "caption": "設備",               "category": "living" },
        { "src": "assets/images/gallery/optimized/Studio%20Photos/DSCF9635.jpeg",           "caption": "暖房設備",           "category": "living" }
      ]
    }
  }
};
