/**
 * Pinterest風Masonryギャラリー - JavaScript実装
 * 8weeks LP用
 */

class PinterestGallery {
    constructor() {
        this.currentPropertyFilter = 'all';
        this.currentCategoryFilter = 'all';
        this.currentLightboxIndex = 0;
        this.allPhotos = [];
        this.filteredPhotos = [];
        this.loadedCount = 0;
        this.itemsPerLoad = 12;
        
        this.initializeGallery();
        this.setupEventListeners();
    }

    // ギャラリー初期化
    async initializeGallery() {
        try {
            // クリーンなギャラリーデータを使用
            if (typeof cleanGalleryData !== 'undefined') {
                this.processGalleryData();
                this.showGallery();
            } else {
                this.showError('ギャラリーデータが読み込まれていません。');
            }
        } catch (error) {
            console.error('Gallery initialization error:', error);
            this.showError('ギャラリーの初期化中にエラーが発生しました。');
        }
    }

    // ギャラリーデータを処理
    processGalleryData() {
        this.allPhotos = [];
        
        // 各プロパティの写真を処理
        Object.keys(cleanGalleryData.properties).forEach(propertyKey => {
            const property = cleanGalleryData.properties[propertyKey];
            
            property.photos.forEach((photo, index) => {
                // Pinterest風にランダムな高さを設定（より自然な分布）
                const heights = ['small', 'medium', 'tall'];
                const weights = [40, 40, 20]; // medium多め、tall少なめ
                const randomHeight = this.getWeightedRandomHeight(heights, weights);
                
                this.allPhotos.push({
                    src: photo.src,
                    alt: photo.alt || `${propertyKey} - Photo ${index + 1}`,
                    property: propertyKey,
                    propertyName: this.getPropertyDisplayName(propertyKey),
                    category: photo.category || 'living',
                    caption: photo.caption || '',
                    index: index,
                    height: randomHeight
                });
            });
        });
        
        // 写真をシャッフルして自然な配置に
        this.allPhotos = this.shuffleArray(this.allPhotos);
        this.filteredPhotos = [...this.allPhotos];
    }

    // プロパティ表示名を取得
    getPropertyDisplayName(key) {
        const names = {
            'quriu': '8weeks Quriu',
            'studio': '8weeks Studio',
            'fujimi': '8weeks Fujimi'
        };
        return names[key] || key;
    }


    // 配列をシャッフル
    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    // 重み付きランダム高さ選択
    getWeightedRandomHeight(heights, weights) {
        const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
        let random = Math.random() * totalWeight;
        
        for (let i = 0; i < heights.length; i++) {
            random -= weights[i];
            if (random <= 0) {
                return heights[i];
            }
        }
        return heights[0]; // フォールバック
    }


    // ギャラリーを表示
    showGallery() {
        const galleryContainer = document.getElementById('property-masonry');
        const loadingElement = document.getElementById('gallery-loading');
        
        if (!galleryContainer) return;
        
        // ローディング状態を隠す
        if (loadingElement) {
            loadingElement.style.display = 'none';
        }
        
        // 初期表示
        this.loadMoreItems();
        
        // アニメーション付きで表示
        setTimeout(() => {
            this.animateItems();
        }, 100);
    }

    // アイテムを追加読み込み
    loadMoreItems() {
        const galleryContainer = document.getElementById('property-masonry');
        const loadMoreBtn = document.getElementById('gallery-load-more');
        
        if (!galleryContainer) return;
        
        const start = this.loadedCount;
        const end = Math.min(start + this.itemsPerLoad, this.filteredPhotos.length);
        
        for (let i = start; i < end; i++) {
            const photo = this.filteredPhotos[i];
            const item = this.createMasonryItem(photo, i);
            galleryContainer.appendChild(item);
        }
        
        this.loadedCount = end;
        
        // もっと見るボタンの表示制御
        if (loadMoreBtn) {
            if (this.loadedCount >= this.filteredPhotos.length) {
                loadMoreBtn.style.display = 'none';
            } else {
                loadMoreBtn.style.display = 'block';
            }
        }
    }

    // Masonryアイテムを作成
    createMasonryItem(photo, globalIndex) {
        const item = document.createElement('div');
        item.className = `masonry-item ${photo.height}`;
        item.setAttribute('data-property', photo.property);
        item.setAttribute('data-index', globalIndex);
        
        item.innerHTML = `
            <div class="masonry-card" onclick="pinterestGallery.openLightbox(${globalIndex})">
                <div class="card-image">
                    <img src="${photo.src}" alt="${photo.alt}" loading="lazy">
                    <div class="property-badge ${photo.property}">${photo.propertyName}</div>
                </div>
            </div>
        `;
        
        return item;
    }

    // アイテムのアニメーション
    animateItems() {
        const items = document.querySelectorAll('.masonry-item:not(.visible)');
        
        items.forEach((item, index) => {
            setTimeout(() => {
                item.classList.add('visible');
            }, index * 100);
        });
    }

    // プロパティフィルターを適用
    applyPropertyFilter(property) {
        this.currentPropertyFilter = property;
        this.applyFilters();
    }
    
    // カテゴリーフィルターを適用
    applyCategoryFilter(category) {
        this.currentCategoryFilter = category;
        this.applyFilters();
    }
    
    // 二重フィルターを適用
    applyFilters() {
        let filteredPhotos = [...this.allPhotos];
        
        // プロパティフィルター
        if (this.currentPropertyFilter !== 'all') {
            filteredPhotos = filteredPhotos.filter(photo => photo.property === this.currentPropertyFilter);
        }
        
        // カテゴリーフィルター
        if (this.currentCategoryFilter !== 'all') {
            filteredPhotos = filteredPhotos.filter(photo => photo.category === this.currentCategoryFilter);
        }
        
        // ソート処理
        if (this.currentPropertyFilter === 'all' && this.currentCategoryFilter === 'all') {
            // 全て表示の場合はランダム
            this.filteredPhotos = this.shuffleArray(filteredPhotos);
        } else if (this.currentPropertyFilter !== 'all' && this.currentCategoryFilter === 'all') {
            // 個別物件のみ選択時はカテゴリー順
            this.filteredPhotos = this.sortByCategory(filteredPhotos);
        } else {
            // その他の場合はそのまま
            this.filteredPhotos = filteredPhotos;
        }
        
        // ギャラリーをリセット
        const galleryContainer = document.getElementById('property-masonry');
        if (galleryContainer) {
            galleryContainer.innerHTML = '';
        }
        
        this.loadedCount = 0;
        this.loadMoreItems();
        
        // アニメーション
        setTimeout(() => {
            this.animateItems();
        }, 100);
    }
    
    // カテゴリー順にソート
    sortByCategory(photos) {
        const categoryOrder = ['exterior', 'living', 'kitchen', 'bedroom', 'bathroom', 'amenities', 'view'];
        
        return photos.sort((a, b) => {
            const aIndex = categoryOrder.indexOf(a.category);
            const bIndex = categoryOrder.indexOf(b.category);
            
            // カテゴリーが見つからない場合は最後に配置
            const aOrder = aIndex === -1 ? categoryOrder.length : aIndex;
            const bOrder = bIndex === -1 ? categoryOrder.length : bIndex;
            
            return aOrder - bOrder;
        });
    }

    // ライトボックスを開く
    openLightbox(index) {
        this.currentLightboxIndex = index;
        const lightbox = document.getElementById('enhanced-lightbox');
        
        if (!lightbox) return;
        
        this.updateLightboxContent();
        lightbox.classList.add('active');
        
        // キーボードイベントを追加
        document.addEventListener('keydown', this.handleKeydown.bind(this));
        
        // スクロールを無効化
        document.body.style.overflow = 'hidden';
    }

    // ライトボックスを閉じる
    closeLightbox() {
        const lightbox = document.getElementById('enhanced-lightbox');
        if (lightbox) {
            lightbox.classList.remove('active');
        }
        
        // キーボードイベントを削除
        document.removeEventListener('keydown', this.handleKeydown.bind(this));
        
        // スクロールを有効化
        document.body.style.overflow = '';
    }

    // ライトボックスコンテンツを更新
    updateLightboxContent() {
        const photo = this.filteredPhotos[this.currentLightboxIndex];
        if (!photo) return;
        
        // メイン画像
        const mainImage = document.getElementById('lightbox-main-image');
        if (mainImage) {
            mainImage.src = photo.src;
            mainImage.alt = photo.alt;
        }
        
        // プロパティ情報
        const propertyName = document.getElementById('lightbox-property-name');
        if (propertyName) {
            propertyName.textContent = photo.propertyName;
        }
        
        
        const badge = document.getElementById('lightbox-property-badge');
        if (badge) {
            badge.textContent = photo.property.charAt(0).toUpperCase() + photo.property.slice(1);
            badge.className = `property-badge ${photo.property}`;
        }
        
        // 写真カウンター
        const currentNum = document.getElementById('current-photo-num');
        const totalNum = document.getElementById('total-photos-num');
        if (currentNum && totalNum) {
            currentNum.textContent = this.currentLightboxIndex + 1;
            totalNum.textContent = this.filteredPhotos.length;
        }
        
        // サムネイル
        this.updateLightboxThumbnails();
    }

    // ライトボックスサムネイルを更新
    updateLightboxThumbnails() {
        const thumbnailsContainer = document.getElementById('lightbox-thumbnails');
        if (!thumbnailsContainer) return;
        
        thumbnailsContainer.innerHTML = '';
        
        // 現在の写真周辺のサムネイルを表示
        const start = Math.max(0, this.currentLightboxIndex - 4);
        const end = Math.min(this.filteredPhotos.length, start + 9);
        
        for (let i = start; i < end; i++) {
            const photo = this.filteredPhotos[i];
            const thumbnail = document.createElement('div');
            thumbnail.className = `lightbox-thumbnail ${i === this.currentLightboxIndex ? 'active' : ''}`;
            thumbnail.onclick = () => {
                this.currentLightboxIndex = i;
                this.updateLightboxContent();
            };
            
            thumbnail.innerHTML = `<img src="${photo.src}" alt="${photo.alt}">`;
            thumbnailsContainer.appendChild(thumbnail);
        }
    }

    // 前の写真
    previousPhoto() {
        if (this.currentLightboxIndex > 0) {
            this.currentLightboxIndex--;
            this.updateLightboxContent();
        }
    }

    // 次の写真
    nextPhoto() {
        if (this.currentLightboxIndex < this.filteredPhotos.length - 1) {
            this.currentLightboxIndex++;
            this.updateLightboxContent();
        }
    }

    // キーボードイベント処理
    handleKeydown(event) {
        switch (event.key) {
            case 'Escape':
                this.closeLightbox();
                break;
            case 'ArrowLeft':
                this.previousPhoto();
                break;
            case 'ArrowRight':
                this.nextPhoto();
                break;
        }
    }

    // エラー表示
    showError(message) {
        const galleryContainer = document.getElementById('property-masonry');
        const loadingElement = document.getElementById('gallery-loading');
        
        if (loadingElement) {
            loadingElement.innerHTML = `
                <div style="color: #e74c3c;">
                    <p>⚠️ ${message}</p>
                </div>
            `;
        }
    }

    // イベントリスナーを設定
    setupEventListeners() {
        // プロパティフィルターボタン
        document.addEventListener('click', (event) => {
            if (event.target.classList.contains('filter-btn') || event.target.closest('.filter-btn')) {
                const btn = event.target.classList.contains('filter-btn') ? event.target : event.target.closest('.filter-btn');
                
                // プロパティフィルター
                if (btn.hasAttribute('data-property')) {
                    const property = btn.getAttribute('data-property');
                    
                    // アクティブ状態を更新
                    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    
                    // フィルターを適用
                    this.applyPropertyFilter(property);
                }
            }
        });
        
        // カテゴリーオプション
        document.addEventListener('click', (event) => {
            console.log('Click event:', event.target, event.target.classList);
            if (event.target.classList.contains('category-option') || event.target.closest('.category-option')) {
                const option = event.target.classList.contains('category-option') ? event.target : event.target.closest('.category-option');
                const category = option.getAttribute('data-category');
                console.log('Category selected:', category);
                
                // アクティブ状態を更新
                document.querySelectorAll('.category-option').forEach(opt => opt.classList.remove('active'));
                option.classList.add('active');
                
                // 選択されたカテゴリーを表示
                const selectedCategory = document.getElementById('selected-category');
                const selectedIcon = option.querySelector('.filter-icon').cloneNode(true);
                const selectedText = option.textContent.trim();
                
                if (selectedCategory) {
                    selectedCategory.innerHTML = '';
                    selectedCategory.appendChild(selectedIcon);
                    selectedCategory.appendChild(document.createTextNode(' ' + selectedText));
                }
                
                // ドロップダウンを閉じる
                const dropdown = document.querySelector('.category-dropdown');
                if (dropdown) {
                    dropdown.classList.remove('open');
                }
                
                // フィルターを適用
                this.applyCategoryFilter(category);
            }
        });
        
        // ドロップダウン開閉
        document.addEventListener('click', (event) => {
            // ドロップダウンボタンクリック
            if (event.target.closest('#category-dropdown-btn')) {
                event.preventDefault();
                const dropdown = document.querySelector('.category-dropdown');
                if (dropdown) {
                    dropdown.classList.toggle('open');
                }
            }
            // ドロップダウン外をクリックで閉じる
            else if (!event.target.closest('.category-dropdown')) {
                const dropdown = document.querySelector('.category-dropdown');
                if (dropdown) {
                    dropdown.classList.remove('open');
                }
            }
        });
        
        // キーボードナビゲーション（Escapeでドロップダウンを閉じる）
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                const dropdown = document.querySelector('.category-dropdown');
                if (dropdown && dropdown.classList.contains('open')) {
                    dropdown.classList.remove('open');
                }
            }
        });
        
        // もっと見るボタン
        document.addEventListener('click', (event) => {
            if (event.target.classList.contains('load-more-btn') || event.target.closest('.load-more-btn')) {
                this.loadMoreItems();
                setTimeout(() => {
                    this.animateItems();
                }, 100);
            }
        });
        
        // ライトボックス制御
        document.addEventListener('click', (event) => {
            // 閉じるボタン
            if (event.target.classList.contains('lightbox-close') || event.target.closest('.lightbox-close')) {
                this.closeLightbox();
            }
            
            // 背景クリックで閉じる
            if (event.target.classList.contains('lightbox-backdrop')) {
                this.closeLightbox();
            }
            
            // ナビゲーションボタン
            if (event.target.classList.contains('nav-prev') || event.target.closest('.nav-prev')) {
                this.previousPhoto();
            }
            
            if (event.target.classList.contains('nav-next') || event.target.closest('.nav-next')) {
                this.nextPhoto();
            }
        });
    }
}

// グローバル変数として初期化
let pinterestGallery;

// DOM読み込み完了後に初期化
document.addEventListener('DOMContentLoaded', () => {
    // データの読み込みを確認
    if (typeof cleanGalleryData === 'undefined') {
        console.error('cleanGalleryData is not loaded');
        return;
    }
    
    // 少し遅延させて既存のギャラリーシステムとの競合を避ける
    setTimeout(() => {
        try {
            pinterestGallery = new PinterestGallery();
            console.log('PinterestGallery initialized successfully');
        } catch (error) {
            console.error('Failed to initialize PinterestGallery:', error);
        }
    }, 500);
});