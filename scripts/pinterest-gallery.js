/**
 * ギャラリー — カルーセル比較 + Masonryレイアウト
 * 8weeks LP用
 *
 * - "All" → 物件ごとの横スクロール行（Netflix/Airbnb風）
 * - 個別物件 → カテゴリ順Masonryレイアウト
 */

class PinterestGallery {
    constructor() {
        this.currentPropertyFilter = 'all';
        this.currentLightboxIndex = 0;
        this.allPhotos = [];
        this.filteredPhotos = [];
        this.loadedCount = 0;
        this.itemsPerLoad = 12;
        this.propertyOrder = ['fujimi', 'quriu', 'studio'];

        this.initializeGallery();
        this.setupEventListeners();
    }

    async initializeGallery() {
        if (typeof cleanGalleryData === 'undefined') {
            this.showError('ギャラリーデータが読み込まれていません。');
            return;
        }
        this.processGalleryData();
        this.showGallery();
    }

    processGalleryData() {
        this.allPhotos = [];
        this.propertyOrder.forEach(key => {
            const prop = cleanGalleryData.properties[key];
            if (!prop) return;
            prop.photos.forEach(photo => {
                const heights = ['small', 'medium', 'tall'];
                const weights = [40, 40, 20];
                this.allPhotos.push({
                    src: photo.src,
                    alt: photo.alt || `${key} - ${photo.caption || 'Photo'}`,
                    property: key,
                    propertyName: this.getPropertyDisplayName(key),
                    category: photo.category || 'living',
                    caption: photo.caption || '',
                    featured: photo.featured || false,
                    height: this.weightedRandom(heights, weights)
                });
            });
        });
        this.filteredPhotos = [...this.allPhotos];
    }

    getPropertyDisplayName(key) {
        return { quriu: '8weeks Quriu', studio: '8weeks Studio', fujimi: '8weeks Fujimi' }[key] || key;
    }

    getPropertyTagline(key) {
        return {
            fujimi: 'グランドピアノのある森の中の一棟貸切別荘',
            quriu: '100m²超のフロア貸切・薪ストーブのある空間',
            studio: '富士見商店街のリノベーションフラット'
        }[key] || '';
    }

    weightedRandom(items, weights) {
        let total = weights.reduce((s, w) => s + w, 0), r = Math.random() * total;
        for (let i = 0; i < items.length; i++) { r -= weights[i]; if (r <= 0) return items[i]; }
        return items[0];
    }

    // === Display ===

    showGallery() {
        const container = document.getElementById('property-masonry');
        const loading = document.getElementById('gallery-loading');
        if (!container) return;
        if (loading) loading.style.display = 'none';

        if (this.currentPropertyFilter === 'all') {
            this.renderCarouselView(container);
        } else {
            this.loadMoreItems();
            setTimeout(() => this.animateItems(), 100);
        }
    }

    // === Carousel View (All) ===

    renderCarouselView(container) {
        container.innerHTML = '';
        container.classList.add('carousel-mode');

        // Build flat photo list for lightbox
        this.filteredPhotos = [];
        let globalIndex = 0;

        this.propertyOrder.forEach(propKey => {
            // Photos are pre-curated in data file — first 5 are hand-picked for design impact
            const photos = this.allPhotos.filter(p => p.property === propKey);

            // Row wrapper
            const row = document.createElement('div');
            row.className = 'carousel-row';

            // Row header
            const header = document.createElement('div');
            header.className = 'carousel-header';
            header.innerHTML = `
                <div class="carousel-header-text">
                    <h3 class="carousel-property-name">${this.getPropertyDisplayName(propKey)}</h3>
                    <p class="carousel-property-tagline">${this.getPropertyTagline(propKey)}</p>
                </div>
                <div class="carousel-nav">
                    <button class="carousel-arrow carousel-prev" aria-label="前へ">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m15 18-6-6 6-6"/></svg>
                    </button>
                    <button class="carousel-arrow carousel-next" aria-label="次へ">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg>
                    </button>
                </div>
            `;
            row.appendChild(header);

            // Scroll track
            const track = document.createElement('div');
            track.className = 'carousel-track';

            photos.forEach(photo => {
                const idx = globalIndex++;
                this.filteredPhotos.push(photo);

                const card = document.createElement('div');
                card.className = 'carousel-card';
                card.onclick = () => this.openLightbox(idx);

                // Category label
                const catLabel = this.getCategoryLabel(photo.category);
                card.innerHTML = `
                    <div class="carousel-card-image">
                        <img src="${photo.src}" alt="${photo.caption}" loading="lazy" decoding="async">
                    </div>
                    <div class="carousel-card-info">
                        <span class="carousel-card-category">${catLabel}</span>
                        <span class="carousel-card-caption">${photo.caption}</span>
                    </div>
                `;
                track.appendChild(card);
            });

            row.appendChild(track);

            // Wire up arrows
            const prevBtn = header.querySelector('.carousel-prev');
            const nextBtn = header.querySelector('.carousel-next');
            prevBtn.addEventListener('click', () => { track.scrollBy({ left: -320, behavior: 'smooth' }); });
            nextBtn.addEventListener('click', () => { track.scrollBy({ left: 320, behavior: 'smooth' }); });

            container.appendChild(row);
        });

        // Hide load-more
        const loadMoreBtn = document.getElementById('gallery-load-more');
        if (loadMoreBtn) loadMoreBtn.style.display = 'none';

        // Animate rows in
        setTimeout(() => {
            container.querySelectorAll('.carousel-row').forEach((r, i) => {
                setTimeout(() => r.classList.add('visible'), i * 150);
            });
        }, 100);
    }

    getCategoryLabel(cat) {
        return {
            living: 'リビング', bedroom: '寝室', kitchen: 'キッチン',
            bathroom: '水回り', exterior: '外観'
        }[cat] || cat;
    }

    // === Masonry View (single property) ===

    loadMoreItems() {
        const container = document.getElementById('property-masonry');
        const loadMoreBtn = document.getElementById('gallery-load-more');
        if (!container) return;

        const start = this.loadedCount;
        const end = Math.min(start + this.itemsPerLoad, this.filteredPhotos.length);

        for (let i = start; i < end; i++) {
            container.appendChild(this.createMasonryItem(this.filteredPhotos[i], i));
        }

        this.loadedCount = end;
        if (loadMoreBtn) {
            loadMoreBtn.style.display = this.loadedCount >= this.filteredPhotos.length ? 'none' : 'block';
        }
    }

    createMasonryItem(photo, globalIndex) {
        const item = document.createElement('div');
        item.className = `masonry-item ${photo.height}`;
        item.setAttribute('data-property', photo.property);
        item.innerHTML = `
            <div class="masonry-card" onclick="pinterestGallery.openLightbox(${globalIndex})">
                <div class="card-image">
                    <img src="${photo.src}" alt="${photo.alt}" loading="lazy" decoding="async">
                    <div class="property-badge ${photo.property}">${photo.propertyName}</div>
                </div>
            </div>
        `;
        return item;
    }

    animateItems() {
        document.querySelectorAll('.masonry-item:not(.visible)').forEach((item, i) => {
            setTimeout(() => item.classList.add('visible'), i * 100);
        });
    }

    // === Filters ===

    applyPropertyFilter(property) {
        this.currentPropertyFilter = property;
        this.applyFilters();
    }

    applyFilters() {
        const container = document.getElementById('property-masonry');
        if (!container) return;

        container.innerHTML = '';
        container.classList.remove('carousel-mode');
        this.loadedCount = 0;

        if (this.currentPropertyFilter === 'all') {
            this.filteredPhotos = [];
            this.renderCarouselView(container);
        } else {
            const order = ['living', 'bedroom', 'kitchen', 'bathroom', 'exterior'];
            this.filteredPhotos = this.allPhotos
                .filter(p => p.property === this.currentPropertyFilter)
                .sort((a, b) => (order.indexOf(a.category) ?? 99) - (order.indexOf(b.category) ?? 99));
            this.loadMoreItems();
            setTimeout(() => this.animateItems(), 100);
        }
    }

    // === Lightbox ===

    openLightbox(index) {
        this.currentLightboxIndex = index;
        const lb = document.getElementById('enhanced-lightbox');
        if (!lb) return;
        this.updateLightboxContent();
        lb.classList.add('active');
        document.addEventListener('keydown', this._keyHandler = this.handleKeydown.bind(this));
        document.body.style.overflow = 'hidden';
    }

    closeLightbox() {
        const lb = document.getElementById('enhanced-lightbox');
        if (lb) lb.classList.remove('active');
        if (this._keyHandler) document.removeEventListener('keydown', this._keyHandler);
        document.body.style.overflow = '';
    }

    updateLightboxContent() {
        const photo = this.filteredPhotos[this.currentLightboxIndex];
        if (!photo) return;
        const img = document.getElementById('lightbox-main-image');
        if (img) { img.src = photo.src; img.alt = photo.caption || photo.alt; }
        const name = document.getElementById('lightbox-property-name');
        if (name) name.textContent = photo.propertyName;
        const badge = document.getElementById('lightbox-property-badge');
        if (badge) { badge.textContent = photo.property.charAt(0).toUpperCase() + photo.property.slice(1); badge.className = `property-badge ${photo.property}`; }
        const cur = document.getElementById('current-photo-num');
        const tot = document.getElementById('total-photos-num');
        if (cur && tot) { cur.textContent = this.currentLightboxIndex + 1; tot.textContent = this.filteredPhotos.length; }
        this.updateThumbnails();
    }

    updateThumbnails() {
        const el = document.getElementById('lightbox-thumbnails');
        if (!el) return;
        el.innerHTML = '';
        const start = Math.max(0, this.currentLightboxIndex - 4);
        const end = Math.min(this.filteredPhotos.length, start + 9);
        for (let i = start; i < end; i++) {
            const t = document.createElement('div');
            t.className = `lightbox-thumbnail ${i === this.currentLightboxIndex ? 'active' : ''}`;
            t.onclick = () => { this.currentLightboxIndex = i; this.updateLightboxContent(); };
            t.innerHTML = `<img src="${this.filteredPhotos[i].src}" alt="">`;
            el.appendChild(t);
        }
    }

    previousPhoto() { if (this.currentLightboxIndex > 0) { this.currentLightboxIndex--; this.updateLightboxContent(); } }
    nextPhoto() { if (this.currentLightboxIndex < this.filteredPhotos.length - 1) { this.currentLightboxIndex++; this.updateLightboxContent(); } }
    handleKeydown(e) {
        if (e.key === 'Escape') this.closeLightbox();
        else if (e.key === 'ArrowLeft') this.previousPhoto();
        else if (e.key === 'ArrowRight') this.nextPhoto();
    }

    showError(msg) {
        const el = document.getElementById('gallery-loading');
        if (el) el.innerHTML = `<div style="color:#e74c3c"><p>⚠️ ${msg}</p></div>`;
    }

    setupTouchSwipe() {
        const lb = document.getElementById('enhanced-lightbox');
        if (!lb) return;
        let startX = 0;
        lb.addEventListener('touchstart', e => { startX = e.changedTouches[0].screenX; }, { passive: true });
        lb.addEventListener('touchend', e => {
            const diff = startX - e.changedTouches[0].screenX;
            if (Math.abs(diff) > 50) { diff > 0 ? this.nextPhoto() : this.previousPhoto(); }
        }, { passive: true });
    }

    setupEventListeners() {
        this.setupTouchSwipe();

        document.addEventListener('click', e => {
            const btn = e.target.closest('.filter-btn');
            if (btn && btn.hasAttribute('data-property')) {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.applyPropertyFilter(btn.getAttribute('data-property'));
            }
        });

        document.addEventListener('click', e => {
            if (e.target.closest('.load-more-btn')) {
                this.loadMoreItems();
                setTimeout(() => this.animateItems(), 100);
            }
        });

        document.addEventListener('click', e => {
            if (e.target.closest('.lightbox-close') || e.target.classList.contains('lightbox-backdrop')) this.closeLightbox();
            if (e.target.closest('.nav-prev')) this.previousPhoto();
            if (e.target.closest('.nav-next')) this.nextPhoto();
        });
    }
}

let pinterestGallery;
document.addEventListener('DOMContentLoaded', () => {
    if (typeof cleanGalleryData === 'undefined') return;
    setTimeout(() => {
        try { pinterestGallery = new PinterestGallery(); }
        catch (err) { console.error('Gallery init error:', err); }
    }, 500);
});
