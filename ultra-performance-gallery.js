// Ultra Performance Gallery System
// Optimized for maximum smoothness and speed

class UltraPerformanceGallery {
    constructor() {
        this.imageCache = new Map();
        this.observerCache = new Map();
        this.loadQueue = [];
        this.isProcessing = false;
        this.visibleImages = new Set();
        
        // Performance settings
        this.batchSize = 2; // Load only 2 images at a time
        this.preloadDistance = '50px'; // Smaller preload distance
        this.debounceDelay = 100; // Faster response
        
        // Create reusable intersection observer
        this.createObserver();
        
        // Optimize CSS transitions
        this.injectOptimizedCSS();
    }
    
    injectOptimizedCSS() {
        const style = document.createElement('style');
        style.textContent = `
            .ultra-gallery-container {
                contain: layout style paint;
                will-change: scroll-position;
            }
            
            .ultra-gallery-item {
                contain: layout style paint;
                transform: translateZ(0); /* Force GPU acceleration */
                backface-visibility: hidden;
                perspective: 1000px;
                transition: opacity 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            }
            
            .ultra-gallery-item img {
                will-change: transform;
                transform: translateZ(0);
                image-rendering: -webkit-optimize-contrast;
                image-rendering: crisp-edges;
            }
            
            .ultra-gallery-item.loading {
                opacity: 0.3;
                background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
                background-size: 200% 100%;
                animation: shimmer 1.5s infinite;
            }
            
            @keyframes shimmer {
                0% { background-position: 200% 0; }
                100% { background-position: -200% 0; }
            }
            
            .ultra-gallery-item.loaded {
                opacity: 1;
            }
            
            /* Grid layout optimized for 3 columns */
            .ultra-gallery-grid {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 8px;
                padding: 16px;
                contain: layout;
            }
            
            @media (max-width: 768px) {
                .ultra-gallery-grid {
                    grid-template-columns: repeat(2, 1fr);
                    gap: 6px;
                    padding: 12px;
                }
            }
            
            @media (max-width: 480px) {
                .ultra-gallery-grid {
                    grid-template-columns: 1fr;
                    gap: 4px;
                    padding: 8px;
                }
            }
            
            /* Lightbox optimizations */
            .ultra-lightbox {
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
                transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1), 
                           visibility 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                backdrop-filter: blur(10px);
                contain: strict;
            }
            
            .ultra-lightbox.active {
                opacity: 1;
                visibility: visible;
            }
            
            .ultra-lightbox-content {
                max-width: 90vw;
                max-height: 90vh;
                position: relative;
                transform: scale(0.8);
                transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            }
            
            .ultra-lightbox.active .ultra-lightbox-content {
                transform: scale(1);
            }
            
            .ultra-lightbox img {
                max-width: 100%;
                max-height: 100%;
                object-fit: contain;
                border-radius: 8px;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
            }
            
            .ultra-lightbox-close {
                position: absolute;
                top: -40px;
                right: 0;
                background: rgba(255, 255, 255, 0.9);
                border: none;
                border-radius: 50%;
                width: 32px;
                height: 32px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 18px;
                color: #333;
                transition: all 0.2s ease;
            }
            
            .ultra-lightbox-close:hover {
                background: white;
                transform: scale(1.1);
            }
            
            .ultra-lightbox-nav {
                position: absolute;
                top: 50%;
                transform: translateY(-50%);
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
            
            .ultra-lightbox-nav:hover {
                background: white;
                transform: translateY(-50%) scale(1.1);
            }
            
            .ultra-lightbox-prev {
                left: -60px;
            }
            
            .ultra-lightbox-next {
                right: -60px;
            }
        `;
        document.head.appendChild(style);
    }
    
    createObserver() {
        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.queueImageLoad(entry.target);
                } else {
                    this.visibleImages.delete(entry.target);
                }
            });
        }, {
            root: null,
            rootMargin: this.preloadDistance,
            threshold: 0.1
        });
    }
    
    createGalleryGrid(containerId, photos, propertyName) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        // Clear existing content
        container.innerHTML = '';
        
        // Create grid container
        const grid = document.createElement('div');
        grid.className = 'ultra-gallery-grid ultra-gallery-container';
        
        photos.forEach((photo, index) => {
            const item = this.createGalleryItem(photo, index, propertyName);
            grid.appendChild(item);
        });
        
        container.appendChild(grid);
    }
    
    createGalleryItem(photo, index, propertyName) {
        const item = document.createElement('div');
        item.className = 'ultra-gallery-item loading';
        item.style.cssText = `
            aspect-ratio: 4/3;
            border-radius: 8px;
            overflow: hidden;
            cursor: pointer;
            position: relative;
        `;
        
        // Add click handler for lightbox
        item.addEventListener('click', () => {
            this.openLightbox(propertyName, index);
        });
        
        // Store photo data
        item.dataset.photoSrc = photo.src;
        item.dataset.photoIndex = index;
        item.dataset.property = propertyName;
        
        // Observe for lazy loading
        this.observer.observe(item);
        
        return item;
    }
    
    queueImageLoad(element) {
        if (this.visibleImages.has(element)) return;
        this.visibleImages.add(element);
        
        this.loadQueue.push(element);
        if (!this.isProcessing) {
            this.processLoadQueue();
        }
    }
    
    async processLoadQueue() {
        this.isProcessing = true;
        
        while (this.loadQueue.length > 0) {
            const batch = this.loadQueue.splice(0, this.batchSize);
            
            await Promise.all(batch.map(element => this.loadImage(element)));
            
            // Small delay between batches to prevent blocking
            if (this.loadQueue.length > 0) {
                await new Promise(resolve => setTimeout(resolve, 50));
            }
        }
        
        this.isProcessing = false;
    }
    
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
            
            // Use requestIdleCallback for better performance
            if (window.requestIdleCallback) {
                requestIdleCallback(() => {
                    img.src = src;
                });
            } else {
                setTimeout(() => {
                    img.src = src;
                }, 0);
            }
        });
    }
    
    displayImage(element, src) {
        const img = document.createElement('img');
        img.src = src;
        img.style.cssText = `
            width: 100%;
            height: 100%;
            object-fit: cover;
            display: block;
        `;
        
        element.innerHTML = '';
        element.appendChild(img);
        element.classList.remove('loading');
        element.classList.add('loaded');
    }
    
    openLightbox(propertyName, photoIndex) {
        const photos = optimizedGalleryData.properties[propertyName].photos;
        this.currentProperty = propertyName;
        this.currentIndex = photoIndex;
        this.currentPhotos = photos;
        
        // Create lightbox if it doesn't exist
        if (!document.getElementById('ultra-lightbox')) {
            this.createLightbox();
        }
        
        this.showLightboxImage(photoIndex);
        
        const lightbox = document.getElementById('ultra-lightbox');
        lightbox.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    
    createLightbox() {
        const lightbox = document.createElement('div');
        lightbox.id = 'ultra-lightbox';
        lightbox.className = 'ultra-lightbox';
        
        lightbox.innerHTML = `
            <div class="ultra-lightbox-content">
                <button class="ultra-lightbox-close" onclick="ultraGallery.closeLightbox()">×</button>
                <button class="ultra-lightbox-nav ultra-lightbox-prev" onclick="ultraGallery.previousImage()">‹</button>
                <button class="ultra-lightbox-nav ultra-lightbox-next" onclick="ultraGallery.nextImage()">›</button>
                <img id="ultra-lightbox-img" src="" alt="">
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
                    this.previousImage();
                    break;
                case 'ArrowRight':
                    this.nextImage();
                    break;
            }
        });
        
        document.body.appendChild(lightbox);
    }
    
    showLightboxImage(index) {
        const img = document.getElementById('ultra-lightbox-img');
        const photo = this.currentPhotos[index];
        
        img.src = photo.src;
        img.alt = photo.caption || '';
        
        // Update navigation buttons
        const prevBtn = document.querySelector('.ultra-lightbox-prev');
        const nextBtn = document.querySelector('.ultra-lightbox-next');
        
        prevBtn.style.display = index > 0 ? 'flex' : 'none';
        nextBtn.style.display = index < this.currentPhotos.length - 1 ? 'flex' : 'none';
    }
    
    previousImage() {
        if (this.currentIndex > 0) {
            this.currentIndex--;
            this.showLightboxImage(this.currentIndex);
        }
    }
    
    nextImage() {
        if (this.currentIndex < this.currentPhotos.length - 1) {
            this.currentIndex++;
            this.showLightboxImage(this.currentIndex);
        }
    }
    
    closeLightbox() {
        const lightbox = document.getElementById('ultra-lightbox');
        lightbox.classList.remove('active');
        document.body.style.overflow = '';
    }
    
    // Clean up resources
    destroy() {
        if (this.observer) {
            this.observer.disconnect();
        }
        this.imageCache.clear();
        this.visibleImages.clear();
        this.loadQueue = [];
    }
}

// Create global instance
window.ultraGallery = new UltraPerformanceGallery();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UltraPerformanceGallery;
}