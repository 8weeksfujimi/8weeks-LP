// Performance Optimizer for 8weeks Gallery System
// Lightweight utility to optimize image loading and gallery performance

class GalleryPerformanceOptimizer {
    constructor() {
        this.loadedImages = new Set();
        this.observerOptions = {
            root: null,
            rootMargin: '100px',
            threshold: 0.1
        };
        this.imageQueue = [];
        this.processingQueue = false;
    }

    // Create optimized image loading with intersection observer
    createLazyImage(src, placeholder, options = {}) {
        if (this.loadedImages.has(src)) {
            // Image already loaded, use cached version
            const img = new Image();
            img.src = src;
            img.style.cssText = options.style || 'width: 100%; height: 100%; object-fit: cover;';
            return img;
        }

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.queueImageLoad(src, placeholder, options);
                    observer.unobserve(entry.target);
                }
            });
        }, this.observerOptions);

        observer.observe(placeholder.parentElement);
        return placeholder;
    }

    // Queue image loading to prevent browser overload
    queueImageLoad(src, placeholder, options) {
        this.imageQueue.push({ src, placeholder, options });
        if (!this.processingQueue) {
            this.processImageQueue();
        }
    }

    async processImageQueue() {
        this.processingQueue = true;
        
        while (this.imageQueue.length > 0) {
            const batch = this.imageQueue.splice(0, 3); // Process 3 images at a time
            
            await Promise.all(batch.map(async ({ src, placeholder, options }) => {
                return new Promise((resolve) => {
                    const img = new Image();
                    
                    img.onload = () => {
                        img.style.cssText = options.style || 'width: 100%; height: 100%; object-fit: cover;';
                        placeholder.replaceWith(img);
                        this.loadedImages.add(src);
                        resolve();
                    };
                    
                    img.onerror = () => {
                        placeholder.style.background = '#ddd';
                        placeholder.textContent = 'Failed';
                        resolve();
                    };
                    
                    // Add small delay to prevent browser choking
                    setTimeout(() => {
                        img.src = src;
                    }, 50);
                });
            }));
            
            // Small delay between batches
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        this.processingQueue = false;
    }

    // Create responsive image with multiple sizes
    createResponsiveImage(src, sizes = []) {
        const img = new Image();
        
        // Set srcset for different screen sizes if provided
        if (sizes.length > 0) {
            img.srcset = sizes.map(size => `${size.src} ${size.width}w`).join(', ');
            img.sizes = sizes.map(size => `(max-width: ${size.maxWidth}px) ${size.viewportWidth}vw`).join(', ');
        }
        
        img.src = src;
        img.loading = 'lazy';
        img.decoding = 'async';
        
        return img;
    }

    // Preload critical images
    preloadCriticalImages(imageUrls) {
        imageUrls.slice(0, 3).forEach((url, index) => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.as = 'image';
            link.href = url;
            if (index === 0) link.fetchPriority = 'high';
            document.head.appendChild(link);
        });
    }

    // Cleanup observers and cached data
    cleanup() {
        this.loadedImages.clear();
        this.imageQueue = [];
        this.processingQueue = false;
    }
}

// Export for use in main gallery system
window.GalleryPerformanceOptimizer = GalleryPerformanceOptimizer;