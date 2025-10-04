const express = require('express');
const router = express.Router();
const ajioCategoriesScraper = require('../utilities/ajioCategoriesScraper');
const fs = require('fs');
const path = require('path');

// POST /api/ajio-categories/scrape-category
router.post('/scrape-category', async (req, res) => {
    try {
        const { url, usePuppeteer = true } = req.body;

        if (!url) {
            return res.status(400).json({
                success: false,
                message: 'URL is required'
            });
        }

        if (!url.includes('ajio.com')) {
            return res.status(400).json({
                success: false,
                message: 'URL must be from ajio.com domain'
            });
        }

        console.log(`Starting Ajio categories scraping for URL: ${url}`);
        
        const scrapedData = await ajioCategoriesScraper.scrapeCategory(url, usePuppeteer);

        if (!scrapedData || !scrapedData.products || scrapedData.products.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No products found on the page'
            });
        }

        // Save scraped data to file
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `ajio-categories-${timestamp}.json`;
        const filepath = path.join(__dirname, '../scraped_data', filename);
        
        fs.writeFileSync(filepath, JSON.stringify(scrapedData, null, 2));

        res.json({
            success: true,
            message: 'Ajio categories scraped successfully',
            data: scrapedData,
            totalProducts: scrapedData.products.length,
            savedTo: filename
        });

    } catch (error) {
        console.error('Error scraping Ajio categories:', error);
        res.status(500).json({
            success: false,
            message: 'Error scraping Ajio categories',
            error: error.message
        });
    }
});

// GET /api/ajio-categories/test-scrape
router.get('/test-scrape', async (req, res) => {
    try {
        const testUrl = 'https://www.ajio.com/s/up-to-80-percent-off-4627-57771?query=%3Arelevance%3Al1l3nestedcategory%3AHome%20%26%20Kitchen%20-%20Bath%20Curtains%3Al1l3nestedcategory%3AHome%20%26%20Kitchen%20-%20Bed%20Room%3Al1l3nestedcategory%3AHome%20%26%20Kitchen%20-%20Bathroom%20Accessories%3Agenderfilter%3AHome%20%26%20Kitchen&curated=true&curatedid=up-to-80-percent-off-4627-57771&gridColumns=3';
        
        console.log('Testing Ajio categories scraping...');
        
        const scrapedData = await ajioCategoriesScraper.scrapeCategory(testUrl, true);

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

// GET /api/ajio-categories/saved-data
router.get('/saved-data', (req, res) => {
    try {
        const scrapedDataDir = path.join(__dirname, '../scraped_data');
        const files = fs.readdirSync(scrapedDataDir)
            .filter(file => file.startsWith('ajio-categories-') && file.endsWith('.json'))
            .sort((a, b) => {
                const aTime = fs.statSync(path.join(scrapedDataDir, a)).mtime;
                const bTime = fs.statSync(path.join(scrapedDataDir, b)).mtime;
                return bTime - aTime;
            });

        res.json({
            success: true,
            message: 'Saved Ajio categories data files retrieved',
            files: files,
            totalFiles: files.length
        });

    } catch (error) {
        console.error('Error retrieving saved data:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving saved data',
            error: error.message
        });
    }
});

// GET /api/ajio-categories/saved-data/:filename
router.get('/saved-data/:filename', (req, res) => {
    try {
        const { filename } = req.params;
        const filepath = path.join(__dirname, '../scraped_data', filename);

        if (!fs.existsSync(filepath)) {
            return res.status(404).json({
                success: false,
                message: 'File not found'
            });
        }

        const data = JSON.parse(fs.readFileSync(filepath, 'utf8'));

        res.json({
            success: true,
            message: 'Saved data retrieved successfully',
            data: data
        });

    } catch (error) {
        console.error('Error reading saved data:', error);
        res.status(500).json({
            success: false,
            message: 'Error reading saved data',
            error: error.message
        });
    }
});

module.exports = router;
