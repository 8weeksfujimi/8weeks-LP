// Cloud-based Gallery Data with optimized image delivery
// Uses Google Drive links for optimized image hosting

const cloudGalleryData = {
  "properties": {
    "quriu": {
      "name": "8weeks Quriu",
      "description": "100m²超のフロア貸切・薪ストーブのある温かみのある空間",
      "photos": [
        {
          "id": "quriu_001",
          "src": "https://drive.google.com/thumbnail?id=DRIVE_FILE_ID&sz=w800",
          "srcset": {
            "thumbnail": "https://drive.google.com/thumbnail?id=DRIVE_FILE_ID&sz=w300",
            "medium": "https://drive.google.com/thumbnail?id=DRIVE_FILE_ID&sz=w800", 
            "large": "https://drive.google.com/thumbnail?id=DRIVE_FILE_ID&sz=w1600"
          },
          "caption": "メインリビング・ダイニング",
          "description": "薪ストーブを囲む温かみのある空間",
          "featured": true
        }
        // Note: Replace DRIVE_FILE_ID with actual Google Drive file IDs
        // This template shows the structure for cloud-hosted images
      ]
    },
    "studio": {
      "name": "8weeks Studio", 
      "description": "富士見商店街のリノベーションフラット・モダンなデザイン",
      "photos": [
        {
          "id": "studio_001",
          "src": "https://drive.google.com/thumbnail?id=DRIVE_FILE_ID&sz=w800",
          "srcset": {
            "thumbnail": "https://drive.google.com/thumbnail?id=DRIVE_FILE_ID&sz=w300",
            "medium": "https://drive.google.com/thumbnail?id=DRIVE_FILE_ID&sz=w800",
            "large": "https://drive.google.com/thumbnail?id=DRIVE_FILE_ID&sz=w1600"
          },
          "caption": "メインリビング",
          "description": "モダンでスタイリッシュな空間",
          "featured": true
        }
        // Note: Replace DRIVE_FILE_ID with actual Google Drive file IDs
      ]
    },
    "fujimi": {
      "name": "8weeks Fujimi",
      "description": "グランドピアノのある森の中の一棟貸切別荘", 
      "photos": []
    }
  }
};

// Cloud Image Optimization System
class CloudImageManager {
  constructor() {
    this.cache = new Map();
    this.compressionLevels = {
      thumbnail: 'w300',  // 300px width
      medium: 'w800',     // 800px width  
      large: 'w1600',     // 1600px width
      original: 'w2400'   // 2400px width (max)
    };
  }

  // Generate optimized Google Drive URLs
  generateDriveUrl(fileId, size = 'medium') {
    const sizeParam = this.compressionLevels[size] || this.compressionLevels.medium;
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=${sizeParam}`;
  }

  // Get responsive image sources
  getResponsiveImageData(fileId) {
    return {
      thumbnail: this.generateDriveUrl(fileId, 'thumbnail'),
      medium: this.generateDriveUrl(fileId, 'medium'),
      large: this.generateDriveUrl(fileId, 'large'),
      original: this.generateDriveUrl(fileId, 'original')
    };
  }

  // Create responsive image element
  createResponsiveImage(fileId, alt = '', className = '') {
    const urls = this.getResponsiveImageData(fileId);
    
    const img = document.createElement('img');
    img.src = urls.medium; // Default to medium size
    img.alt = alt;
    img.className = className;
    img.loading = 'lazy';
    img.decoding = 'async';
    
    // Set srcset for responsive loading
    img.srcset = `
      ${urls.thumbnail} 300w,
      ${urls.medium} 800w,
      ${urls.large} 1600w
    `;
    
    // Set sizes attribute for responsive behavior
    img.sizes = `
      (max-width: 480px) 300px,
      (max-width: 768px) 800px,
      1600px
    `;
    
    return img;
  }

  // Preload critical images
  preloadImage(fileId, size = 'medium') {
    const url = this.generateDriveUrl(fileId, size);
    
    if (this.cache.has(url)) {
      return Promise.resolve();
    }
    
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        this.cache.set(url, true);
        resolve();
      };
      img.onerror = reject;
      img.src = url;
    });
  }

  // Batch preload images
  async batchPreload(fileIds, size = 'medium', batchSize = 3) {
    for (let i = 0; i < fileIds.length; i += batchSize) {
      const batch = fileIds.slice(i, i + batchSize);
      await Promise.all(batch.map(id => this.preloadImage(id, size).catch(() => {})));
      
      // Small delay between batches
      if (i + batchSize < fileIds.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
  }
}

// Alternative: Imgur hosting (free, no authentication required)
const generateImgurUrl = (imageId, size = 'm') => {
  // Imgur size suffixes: s (90x90), b (160x160), t (160x160), m (320x320), l (640x640), h (1024x1024)
  return `https://i.imgur.com/${imageId}${size}.jpg`;
};

// Alternative: Cloudinary hosting (optimized for web)
const generateCloudinaryUrl = (cloudName, imageId, width = 800, quality = 'auto') => {
  return `https://res.cloudinary.com/${cloudName}/image/upload/w_${width},q_${quality},f_auto/${imageId}`;
};

// Export for use in gallery system
window.cloudGalleryData = cloudGalleryData;
window.CloudImageManager = CloudImageManager;
window.generateImgurUrl = generateImgurUrl;
window.generateCloudinaryUrl = generateCloudinaryUrl;