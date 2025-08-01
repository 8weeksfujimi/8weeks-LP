// Airbnb Data Fetcher
// Note: Due to CORS policies, this needs to run on a backend server or use a proxy

const airbnbProperties = {
    fujimi: {
        url: 'https://airbnb.com/h/8weeksfujimi',
        id: '8weeksfujimi'
    },
    quriu: {
        url: 'https://airbnb.com/h/8weeks-quriu', 
        id: '8weeks-quriu'
    },
    studio: {
        url: 'https://airbnb.com/h/8weeks-studio',
        id: '8weeks-studio'
    }
};

// Static data as fallback (update manually when needed)
const airbnbDataFallback = {
    fujimi: {
        rating: 4.98,
        reviewCount: 45,
        superhost: true,
        price: '¥12,000',
        availability: 'Available'
    },
    quriu: {
        rating: 5.0,
        reviewCount: 28,
        superhost: true,
        price: '¥15,000',
        availability: 'Available'
    },
    studio: {
        rating: 5.0,
        reviewCount: 32,
        superhost: true,
        price: '¥8,000',
        availability: 'Available'
    }
};

// Function to get Airbnb data
async function getAirbnbData(propertyKey) {
    try {
        // In a real implementation, this would use a backend API or proxy
        // For now, return static data
        return airbnbDataFallback[propertyKey];
    } catch (error) {
        console.error('Error fetching Airbnb data:', error);
        return airbnbDataFallback[propertyKey];
    }
}

// Function to update all property data
async function updateAllPropertyData() {
    const properties = ['fujimi', 'quriu', 'studio'];
    const results = {};
    
    for (const property of properties) {
        results[property] = await getAirbnbData(property);
    }
    
    return results;
}

// Function to update UI with fresh data
async function refreshPropertyData() {
    try {
        const data = await updateAllPropertyData();
        
        // Update ratings and reviews in the DOM
        Object.keys(data).forEach(property => {
            const propertyData = data[property];
            
            // Update rating
            const ratingElement = document.querySelector(`[data-property="${property}"] .rating-number`);
            if (ratingElement) {
                ratingElement.textContent = propertyData.rating;
            }
            
            // Update review count
            const reviewElement = document.querySelector(`[data-property="${property}"] .review-count`);
            if (reviewElement) {
                reviewElement.textContent = propertyData.reviewCount;
            }
            
            // Update host stats (total reviews)
            const totalReviews = Object.values(data).reduce((sum, prop) => sum + prop.reviewCount, 0);
            const hostReviewElement = document.querySelector('.stat-number');
            if (hostReviewElement && hostReviewElement.textContent.includes('+')) {
                hostReviewElement.textContent = `${totalReviews}+`;
            }
        });
        
        console.log('Property data updated successfully');
    } catch (error) {
        console.error('Error refreshing property data:', error);
    }
}

// Auto-refresh data every 24 hours
setInterval(refreshPropertyData, 24 * 60 * 60 * 1000);

// Export functions for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        getAirbnbData,
        updateAllPropertyData,
        refreshPropertyData,
        airbnbDataFallback
    };
}