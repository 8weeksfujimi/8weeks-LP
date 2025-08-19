// Three-Stage Gallery System
// Stage 1: Preview (3 photos) → Stage 2: Grid popup (all photos) → Stage 3: Individual lightbox

class ThreeStageGallery {
    constructor() {
        this.imageCache = new Map();
        this.currentProperty = null;
        this.currentPhotos = [];
        this.currentLightboxIndex = 0;
        
        // Performance settings
        this.batchSize = 3;
        this.preloadDistance = '100px';
        
        this.injectStyles();
        this.createObserver();
    }
    
    injectStyles() {
        const style = document.createElement('style');
        style.textContent = `
            /* Stage 1: Preview Grid Styles - Uniform CSS Grid */
            .preview-gallery {
                display: grid !important;
                grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)) !important;
                gap: 12px !important;
                margin: 32px 0 0 !important;
                width: 100% !important;
                box-sizing: border-box !important;
                padding: 0 !important;
            }
            
            /* Uniform grid items */
            
            /* Basic grid item styles */
            .preview-gallery .preview-item {
                aspect-ratio: 4/3 !important;
                overflow: hidden !important;
                cursor: pointer !important;
                position: relative !important;
                background: #f8f8f8 !important;
                transition: all 0.2s ease !important;
                box-sizing: border-box !important;
                border-radius: 8px !important;
                width: 100% !important;
            }
            
            .preview-gallery .preview-item:not(.preview-more) {
                background: #f8f8f8 !important;
            }
            
            .preview-gallery .preview-item:hover {
                transform: translateY(-2px) !important;
                box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15) !important;
            }
            
            .preview-gallery .preview-item img {
                width: 100% !important;
                height: 100% !important;
                object-fit: cover !important;
                transition: transform 0.2s ease !important;
                image-rendering: auto !important;
                image-rendering: -webkit-optimize-contrast !important;
                will-change: auto !important;
                display: block !important;
                border-radius: 8px !important;
            }
            
            .preview-gallery .preview-item:hover img {
                transform: scale(1.02) !important;
            }
            
            .preview-item.loading {
                background: #f8f8f8;
                animation: pulse 1.5s ease-in-out infinite;
            }
            
            .preview-item.preview-more.loading,
            .preview-gallery .preview-item.preview-more,
            .preview-gallery .preview-more {
                background: linear-gradient(135deg, #FF5A5F, #E5484D) !important;
                color: #ffffff !important;
                animation: none !important;
                opacity: 1 !important;
            }
            
            @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.7; }
            }
            
            div.preview-more,
            div.preview-item.preview-more,
            .preview-gallery div.preview-more,
            .preview-gallery div.preview-item.preview-more {
                flex: 1 !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                background: #ffffff !important;
                border: 1px solid #FF5A5F !important;
                color: #FF5A5F !important;
                font-weight: 500 !important;
                font-size: 0.9rem !important;
                text-align: center !important;
                padding: 12px 16px !important;
                border-radius: 6px !important;
                text-decoration: none !important;
                transition: all 0.2s ease !important;
                cursor: pointer !important;
                opacity: 1 !important;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1) !important;
                aspect-ratio: 4/3 !important;
            }
            
            .preview-more:hover {
                background: #FF5A5F !important;
                color: #ffffff !important;
                transform: translateY(-2px) !important;
                box-shadow: 0 4px 12px rgba(255, 90, 95, 0.3) !important;
            }
            
            /* More Photos Button Container */
            .more-photos-container {
                text-align: center;
                margin-top: 24px;
                width: 100%;
            }
            
            /* More Photos Button Styles */
            .more-photos-btn {
                display: inline-block;
                padding: 14px 28px;
                background: #ffffff;
                border: 1px solid #FF5A5F;
                border-radius: 8px;
                color: #FF5A5F;
                font-weight: 500;
                font-size: 1rem;
                cursor: pointer;
                transition: all 0.2s ease;
                font-family: inherit;
                text-decoration: none;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            }
            
            .more-photos-btn:hover {
                background: #FF5A5F;
                color: #ffffff;
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(255, 90, 95, 0.3);
            }
            
            /* Responsive adjustments for preview */
            @media (max-width: 768px) {
                .preview-gallery {
                    gap: 10px !important;
                    margin: 24px 0 0 !important;
                }
            }
            
            @media (max-width: 480px) {
                .preview-gallery {
                    gap: 10px !important;
                }
            }
            
            /* Stage 2: Grid Popup Styles */
            .grid-popup {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.95);
                z-index: 9999;
                display: flex;
                flex-direction: column;
                opacity: 0;
                visibility: hidden;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                backdrop-filter: blur(10px);
            }
            
            .grid-popup.active {
                opacity: 1;
                visibility: visible;
            }
            
            .grid-popup-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 20px;
                color: white;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            }
            
            .grid-popup-title {
                font-size: 24px;
                font-weight: 600;
                margin: 0;
            }
            
            .grid-popup-close {
                background: rgba(255, 255, 255, 0.1);
                border: none;
                border-radius: 50%;
                width: 40px;
                height: 40px;
                color: white;
                font-size: 20px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s ease;
            }
            
            .grid-popup-close:hover {
                background: rgba(255, 255, 255, 0.2);
                transform: scale(1.1);
            }
            
            .grid-popup-content {
                flex: 1;
                overflow-y: auto;
                padding: 20px;
            }
            
            .grid-popup-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
                gap: 16px;
                max-width: 1200px;
                margin: 0 auto;
            }
            
            @media (max-width: 768px) {
                .grid-popup-grid {
                    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
                    gap: 12px;
                }
            }
            
            @media (max-width: 480px) {
                .grid-popup-grid {
                    grid-template-columns: repeat(2, 1fr);
                    gap: 8px;
                }
                
                .grid-popup-header {
                    padding: 15px;
                }
                
                .grid-popup-title {
                    font-size: 20px;
                }
            }
            
            .grid-item {
                aspect-ratio: 4/3;
                border-radius: 8px;
                overflow: hidden;
                cursor: pointer;
                background: #333;
                position: relative;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            }
            
            .grid-item:hover {
                transform: scale(1.05);
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
            }
            
            .grid-item img {
                width: 100%;
                height: 100%;
                object-fit: cover;
            }
            
            .grid-item.loading {
                background: #444;
                animation: pulse 1.5s ease-in-out infinite;
            }
            
            /* Stage 3: Lightbox Styles */
            .photo-lightbox {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.95);
                z-index: 10000;
                display: flex;
                align-items: center;
                justify-content: center;
                opacity: 0;
                visibility: hidden;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                backdrop-filter: blur(10px);
            }
            
            .photo-lightbox.active {
                opacity: 1;
                visibility: visible;
            }
            
            .lightbox-content {
                max-width: 90vw;
                max-height: 90vh;
                position: relative;
                transform: scale(0.8);
                transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            }
            
            .photo-lightbox.active .lightbox-content {
                transform: scale(1);
            }
            
            .lightbox-image {
                max-width: 100%;
                max-height: 100%;
                object-fit: contain;
                border-radius: 8px;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
            }
            
            .lightbox-nav {
                position: absolute;
                top: 50%;
                transform: translateY(-50%);
                background: rgba(255, 255, 255, 0.9);
                border: none;
                border-radius: 50%;
                width: 50px;
                height: 50px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 24px;
                color: #333;
                transition: all 0.2s ease;
                opacity: 0.8;
            }
            
            .lightbox-nav:hover {
                background: white;
                transform: translateY(-50%) scale(1.1);
                opacity: 1;
            }
            
            .lightbox-prev {
                left: -70px;
            }
            
            .lightbox-next {
                right: -70px;
            }
            
            .lightbox-close {
                position: absolute;
                top: -50px;
                right: 0;
                background: rgba(255, 255, 255, 0.9);
                border: none;
                border-radius: 50%;
                width: 40px;
                height: 40px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 20px;
                color: #333;
                transition: all 0.2s ease;
            }
            
            .lightbox-close:hover {
                background: white;
                transform: scale(1.1);
            }
            
            .lightbox-counter {
                position: absolute;
                bottom: -40px;
                left: 50%;
                transform: translateX(-50%);
                color: rgba(255, 255, 255, 0.8);
                font-size: 14px;
                background: rgba(0, 0, 0, 0.5);
                padding: 8px 16px;
                border-radius: 20px;
            }
            
            
            /* Mobile optimizations */
            @media (max-width: 768px) {
                .preview-gallery {
                    gap: 8px;
                }
                
                .lightbox-nav {
                    width: 40px;
                    height: 40px;
                    font-size: 20px;
                }
                
                .lightbox-prev {
                    left: -50px;
                }
                
                .lightbox-next {
                    right: -50px;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    createObserver() {
        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.loadImage(entry.target);
                }
            });
        }, {
            root: null,
            rootMargin: this.preloadDistance,
            threshold: 0.1
        });
    }
    
    // Stage 1: Create preview grid with new layout
    createPreviewGallery(containerId, photos, propertyName) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        container.innerHTML = '';
        
        const previewGrid = document.createElement('div');
        previewGrid.className = 'preview-gallery';
        
        // Show first 6 photos in grid
        const previewPhotos = photos.slice(0, 6);
        previewPhotos.forEach((photo, index) => {
            const item = this.createPreviewItem(photo, index, propertyName);
            previewGrid.appendChild(item);
        });
        
        container.appendChild(previewGrid);
        
        // Add "More Photos" button below the gallery if there are more than 6 photos
        if (photos.length > 6) {
            this.createMorePhotosButton(container, propertyName, photos);
        }
    }
    
    createMorePhotosButton(container, propertyName, photos) {
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'more-photos-container';
        
        const moreButton = document.createElement('button');
        moreButton.className = 'more-photos-btn';
        
        const moreText = document.documentElement.lang === 'en' ? 'More Photos' : 'すべての写真を見る';
        const photoCount = photos.length - 6;
        const countText = document.documentElement.lang === 'en' ? `(+${photoCount} more)` : `(他${photoCount}枚)`;
        moreButton.innerHTML = `${moreText} ${countText}`;
        
        moreButton.addEventListener('click', () => {
            this.openGridPopup(propertyName, photos);
        });
        
        buttonContainer.appendChild(moreButton);
        container.appendChild(buttonContainer);
    }
    
    createPreviewItem(photo, index, propertyName) {
        const item = document.createElement('div');
        item.className = 'preview-item loading';
        
        item.addEventListener('click', () => {
            const photos = optimizedGalleryData.properties[propertyName].photos;
            this.openGridPopup(propertyName, photos);
        });
        
        // Store photo data for lazy loading
        item.dataset.photoSrc = photo.src;
        item.dataset.photoIndex = index;
        
        // Observe for lazy loading
        this.observer.observe(item);
        
        return item;
    }
    
    // Stage 2: Open grid popup with all photos
    openGridPopup(propertyName, photos) {
        this.currentProperty = propertyName;
        this.currentPhotos = photos;
        
        // Create popup if it doesn't exist
        if (!document.getElementById('grid-popup')) {
            this.createGridPopup();
        }
        
        // Update popup content
        this.updateGridPopup(propertyName, photos);
        
        // Show popup
        const popup = document.getElementById('grid-popup');
        popup.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    
    createGridPopup() {
        const popup = document.createElement('div');
        popup.id = 'grid-popup';
        popup.className = 'grid-popup';
        
        popup.innerHTML = `
            <div class="grid-popup-header">
                <h2 class="grid-popup-title"></h2>
                <button class="grid-popup-close" onclick="threeStageGallery.closeGridPopup()">×</button>
            </div>
            <div class="grid-popup-content">
                <div class="grid-popup-grid"></div>
            </div>
        `;
        
        // Close on background click
        popup.addEventListener('click', (e) => {
            if (e.target === popup) {
                this.closeGridPopup();
            }
        });
        
        // Keyboard support
        document.addEventListener('keydown', (e) => {
            if (popup.classList.contains('active') && e.key === 'Escape') {
                this.closeGridPopup();
            }
        });
        
        document.body.appendChild(popup);
    }
    
    updateGridPopup(propertyName, photos) {
        const title = document.querySelector('.grid-popup-title');
        const grid = document.querySelector('.grid-popup-grid');
        
        const propertyData = optimizedGalleryData.properties[propertyName];
        const photoText = document.documentElement.lang === 'en' ? 'photos' : '枚';
        title.textContent = `${propertyData.name} (${photos.length}${photoText})`;
        
        // Clear existing grid
        grid.innerHTML = '';
        
        // Create grid items for all photos
        photos.forEach((photo, index) => {
            const item = this.createGridItem(photo, index);
            grid.appendChild(item);
        });
    }
    
    createGridItem(photo, index) {
        const item = document.createElement('div');
        item.className = 'grid-item loading';
        
        item.addEventListener('click', () => {
            this.openLightbox(index);
        });
        
        // Store photo data
        item.dataset.photoSrc = photo.src;
        item.dataset.photoIndex = index;
        
        // Lazy load
        this.observer.observe(item);
        
        return item;
    }
    
    // Stage 3: Open individual photo lightbox
    openLightbox(photoIndex) {
        this.currentLightboxIndex = photoIndex;
        
        // Create lightbox if it doesn't exist
        if (!document.getElementById('photo-lightbox')) {
            this.createLightbox();
        }
        
        // Update lightbox content
        this.updateLightbox();
        
        // Show lightbox
        const lightbox = document.getElementById('photo-lightbox');
        lightbox.classList.add('active');
    }
    
    createLightbox() {
        const lightbox = document.createElement('div');
        lightbox.id = 'photo-lightbox';
        lightbox.className = 'photo-lightbox';
        
        lightbox.innerHTML = `
            <div class="lightbox-content">
                <button class="lightbox-close" onclick="threeStageGallery.closeLightbox()">×</button>
                <button class="lightbox-nav lightbox-prev" onclick="threeStageGallery.previousPhoto()">‹</button>
                <button class="lightbox-nav lightbox-next" onclick="threeStageGallery.nextPhoto()">›</button>
                <img class="lightbox-image" src="" alt="">
                <div class="lightbox-counter"></div>
            </div>
        `;
        
        // Close on background click
        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox) {
                this.closeLightbox();
            }
        });
        
        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (!lightbox.classList.contains('active')) return;
            
            switch(e.key) {
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
        });
        
        document.body.appendChild(lightbox);
    }
    
    updateLightbox() {
        const img = document.querySelector('.lightbox-image');
        const counter = document.querySelector('.lightbox-counter');
        const prevBtn = document.querySelector('.lightbox-prev');
        const nextBtn = document.querySelector('.lightbox-next');
        
        const photo = this.currentPhotos[this.currentLightboxIndex];
        
        img.src = photo.src;
        img.alt = photo.caption || '';
        
        counter.textContent = `${this.currentLightboxIndex + 1} / ${this.currentPhotos.length}`;
        
        // Update navigation buttons
        prevBtn.style.display = this.currentLightboxIndex > 0 ? 'flex' : 'none';
        nextBtn.style.display = this.currentLightboxIndex < this.currentPhotos.length - 1 ? 'flex' : 'none';
    }
    
    // Load image with caching
    async loadImage(element) {
        const src = element.dataset.photoSrc;
        
        if (this.imageCache.has(src)) {
            this.displayImage(element, src);
            return;
        }
        
        return new Promise((resolve) => {
            const img = new Image();
            
            img.onload = () => {
                this.imageCache.set(src, img);
                this.displayImage(element, src);
                resolve();
            };
            
            img.onerror = () => {
                element.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#999;font-size:12px;">読み込みエラー</div>';
                element.classList.remove('loading');
                resolve();
            };
            
            img.src = src;
        });
    }
    
    displayImage(element, src) {
        const img = document.createElement('img');
        img.src = src;
        img.style.cssText = 'width: 100%; height: 100%; object-fit: cover;';
        
        element.innerHTML = '';
        element.appendChild(img);
        element.classList.remove('loading');
    }
    
    // Navigation methods
    previousPhoto() {
        if (this.currentLightboxIndex > 0) {
            this.currentLightboxIndex--;
            this.updateLightbox();
        }
    }
    
    nextPhoto() {
        if (this.currentLightboxIndex < this.currentPhotos.length - 1) {
            this.currentLightboxIndex++;
            this.updateLightbox();
        }
    }
    
    // Close methods
    closeGridPopup() {
        const popup = document.getElementById('grid-popup');
        popup.classList.remove('active');
        document.body.style.overflow = '';
    }
    
    closeLightbox() {
        const lightbox = document.getElementById('photo-lightbox');
        lightbox.classList.remove('active');
    }
    
    // Cleanup
    destroy() {
        if (this.observer) {
            this.observer.disconnect();
        }
        this.imageCache.clear();
    }
}

// Create global instance
window.threeStageGallery = new ThreeStageGallery();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ThreeStageGallery;
}