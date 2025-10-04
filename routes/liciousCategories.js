const express = require('express');
const router = express.Router();
const liciousCategoryScraper = require('../utilities/liciousCategoryScraper');
const path = require('path');
const fs = require('fs');

// POST /api/licious-categories/scrape-category
router.post('/scrape-category', async (req, res) => {
    try {
        const { url } = req.body;

        if (!url) {
            return res.status(400).json({
                success: false,
                message: 'URL is required'
            });
        }

        if (!url.includes('licious.in')) {
            return res.status(400).json({
                success: false,
                message: 'URL must be from licious.in domain'
            });
        }

        console.log(`Starting Licious category scraping for URL: ${url}`);
        
        const scrapedData = await liciousCategoryScraper.scrapeCategory(url);

        if (!scrapedData || !scrapedData.products || scrapedData.products.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No products found on the page'
            });
        }

        // Save scraped data to file
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `licious-categories-${timestamp}.json`;
        const filepath = path.join(__dirname, '../scraped_data', filename);
        
        fs.writeFileSync(filepath, JSON.stringify(scrapedData, null, 2));

        res.json({
            success: true,
            message: 'Licious categories scraped successfully',
            data: scrapedData,
            totalProducts: scrapedData.products.length,
            savedTo: filename
        });

    } catch (error) {
        console.error('Error scraping Licious categories:', error);
        res.status(500).json({
            success: false,
            message: 'Error scraping Licious categories',
            error: error.message
        });
    }
});

// GET /api/licious-categories/test-scrape
router.get('/test-scrape', async (req, res) => {
    try {
        const testUrl = 'https://www.licious.in/seafood';
        
        console.log('Testing Licious categories scraping...');
        
        const scrapedData = await liciousCategoryScraper.scrapeCategory(testUrl);

        res.json({
            success: true,
            message: 'Test scraping completed',
            data: scrapedData,
            totalProducts: scrapedData.products.length
        });

    } catch (error) {
        console.error('Error in test scraping:', error);
        res.status(500).json({
            success: false,
            message: 'Error in test scraping',
            error: error.message
        });
    }
});

module.exports = router;