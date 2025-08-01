// Simple Node.js proxy server to fetch Airbnb data
// Run with: node airbnb-proxy-server.js

const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Airbnb data extraction function
function extractAirbnbData(html) {
    const $ = cheerio.load(html);
    
    try {
        // Extract rating
        const rating = $('[data-testid="review-score-value"]').text() || 
                      $('._17p6nbba').text() || 
                      $('[aria-label*="rating"]').text();
        
        // Extract review count
        const reviewCount = $('[data-testid="review-score-count"]').text() || 
                           $('._1f1oir5').text() || 
                           $('[aria-label*="review"]').text();
        
        // Extract superhost status
        const isuperhost = $('._1mhorg9').length > 0 || 
                          $('[data-testid="superhost-badge"]').length > 0;
        
        // Extract price
        const price = $('._tyxjp1').text() || 
                     $('[data-testid="price-availability-row"] ._1k4xcdh').text();
        
        return {
            rating: parseFloat(rating) || null,
            reviewCount: parseInt(reviewCount.replace(/[^\d]/g, '')) || null,
            superhost: isuperhost,
            price: price || null,
            lastUpdated: new Date().toISOString()
        };
    } catch (error) {
        console.error('Error extracting data:', error);
        return null;
    }
}

// API endpoint to fetch Airbnb data
app.get('/api/airbnb/:propertyId', async (req, res) => {
    const { propertyId } = req.params;
    const propertyUrls = {
        'fujimi': 'https://airbnb.com/h/8weeksfujimi',
        'quriu': 'https://airbnb.com/h/8weeks-quriu',
        'studio': 'https://airbnb.com/h/8weeks-studio'
    };
    
    const url = propertyUrls[propertyId];
    if (!url) {
        return res.status(400).json({ error: 'Invalid property ID' });
    }
    
    try {
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Accept-Encoding': 'gzip, deflate, br',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1',
            }
        });
        
        const data = extractAirbnbData(response.data);
        
        if (data) {
            res.json({
                success: true,
                property: propertyId,
                data: data
            });
        } else {
            res.status(500).json({ error: 'Failed to extract data' });
        }
    } catch (error) {
        console.error('Error fetching Airbnb data:', error.message);
        res.status(500).json({ 
            error: 'Failed to fetch data',
            message: error.message 
        });
    }
});

// Get all properties data
app.get('/api/airbnb/all', async (req, res) => {
    const properties = ['fujimi', 'quriu', 'studio'];
    const results = {};
    
    for (const property of properties) {
        try {
            const propertyUrls = {
                'fujimi': 'https://airbnb.com/h/8weeksfujimi',
                'quriu': 'https://airbnb.com/h/8weeks-quriu', 
                'studio': 'https://airbnb.com/h/8weeks-studio'
            };
            
            const response = await axios.get(propertyUrls[property], {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                }
            });
            
            results[property] = extractAirbnbData(response.data);
        } catch (error) {
            console.error(`Error fetching ${property}:`, error.message);
            results[property] = null;
        }
    }
    
    res.json({
        success: true,
        data: results,
        timestamp: new Date().toISOString()
    });
});

app.listen(PORT, () => {
    console.log(`Airbnb proxy server running on port ${PORT}`);
    console.log('Endpoints:');
    console.log(`  GET /api/airbnb/:propertyId - Get specific property data`);
    console.log(`  GET /api/airbnb/all - Get all properties data`);
});

// package.json content:
/*
{
  "name": "airbnb-proxy-server",
  "version": "1.0.0",
  "description": "Proxy server to fetch Airbnb data",
  "main": "airbnb-proxy-server.js",
  "scripts": {
    "start": "node airbnb-proxy-server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "axios": "^1.4.0",
    "cheerio": "^1.0.0-rc.12"
  }
}
*/