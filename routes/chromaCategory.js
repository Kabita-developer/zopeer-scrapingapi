const express = require('express');
const router = express.Router();
const ChromaCategoryScraper = require('../utilities/chromaCategoryScraper');

// Initialize scraper instance
let chromaCategoryScraper = null;

// Initialize scraper
const initializeScraper = async () => {
  if (!chromaCategoryScraper) {
    chromaCategoryScraper = new ChromaCategoryScraper();
    await chromaCategoryScraper.initialize();
  }
  return chromaCategoryScraper;
};

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'Chroma Category Scraper',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Scrape Chroma category page
router.post('/scrape-category', async (req, res) => {
  try {
    const { url, usePuppeteer = true } = req.body;

    // Validate input
    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'URL is required',
        message: 'Please provide a valid Chroma category URL'
      });
    }

    // Validate URL format
    if (!url.includes('croma.com') || !url.includes('/c/')) {
      return res.status(400).json({
        success: false,
        error: 'Invalid URL format',
        message: 'Please provide a valid Chroma category URL (must contain croma.com and /c/)'
      });
    }

    // Initialize scraper
    const scraper = await initializeScraper();

    // Scrape the category page
    const categoryData = await scraper.scrapeCategoryPage(url, usePuppeteer);

    // Return success response
    res.json({
      success: true,
      message: 'Category scraped successfully',
      data: categoryData,
      scrapedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in /scrape-category endpoint:', error);
    
    res.status(500).json({
      success: false,
      error: 'Scraping failed',
      message: error.message || 'An error occurred while scraping the category',
      timestamp: new Date().toISOString()
    });
  }
});

// Scrape Chroma category page (GET method)
router.get('/scrape-category', async (req, res) => {
  try {
    const { url, usePuppeteer = true } = req.query;

    // Validate input
    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'URL is required',
        message: 'Please provide a valid Chroma category URL as query parameter'
      });
    }

    // Validate URL format
    if (!url.includes('croma.com') || !url.includes('/c/')) {
      return res.status(400).json({
        success: false,
        error: 'Invalid URL format',
        message: 'Please provide a valid Chroma category URL (must contain croma.com and /c/)'
      });
    }

    // Initialize scraper
    const scraper = await initializeScraper();

    // Scrape the category page
    const categoryData = await scraper.scrapeCategoryPage(url, usePuppeteer === 'true');

    // Return success response
    res.json({
      success: true,
      message: 'Category scraped successfully',
      data: categoryData,
      scrapedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in GET /scrape-category endpoint:', error);
    
    res.status(500).json({
      success: false,
      error: 'Scraping failed',
      message: error.message || 'An error occurred while scraping the category',
      timestamp: new Date().toISOString()
    });
  }
});

// Test endpoint with sample data
router.post('/test', async (req, res) => {
  try {
    // Sample Chroma category URL for testing
    const sampleUrl = 'https://www.croma.com/home-appliances/c/5?q=%3Adiscount-desc%3AZAStatusFlag%3Atrue%3AskuStockFlag%3Atrue%3AskuStockFlag%3Atrue';
    
    // Initialize scraper
    const scraper = await initializeScraper();
    
    // Scrape the sample category
    const categoryData = await scraper.scrapeCategoryPage(sampleUrl);
    
    res.json({
      success: true,
      message: 'Test scraping completed successfully',
      sampleUrl: sampleUrl,
      data: categoryData,
      scrapedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in /test endpoint:', error);
    
    res.status(500).json({
      success: false,
      error: 'Test scraping failed',
      message: error.message || 'An error occurred during test scraping',
      timestamp: new Date().toISOString()
    });
  }
});

// Get scraping history
router.get('/history', async (req, res) => {
  try {
    const fs = require('fs').promises;
    const path = require('path');
    const scrapedDir = path.join(__dirname, '..', 'scraped_data');
    
    try {
      const files = await fs.readdir(scrapedDir);
      const chromaFiles = files.filter(file => file.startsWith('chroma-category-') && file.endsWith('.json'));
      
      const history = [];
      
      for (const file of chromaFiles) {
        try {
          const filepath = path.join(scrapedDir, file);
          const stats = await fs.stat(filepath);
          const content = await fs.readFile(filepath, 'utf8');
          const data = JSON.parse(content);
          
          history.push({
            filename: file,
            scrapedAt: data.scrapedAt,
            categoryName: data.categoryName,
            totalProducts: data.totalProducts,
            categoryUrl: data.categoryUrl,
            fileSize: stats.size,
            lastModified: stats.mtime
          });
        } catch (fileError) {
          console.error(`Error reading file ${file}:`, fileError);
        }
      }
      
      // Sort by scraped date (newest first)
      history.sort((a, b) => new Date(b.scrapedAt) - new Date(a.scrapedAt));
      
      res.json({
        success: true,
        message: 'Scraping history retrieved successfully',
        count: history.length,
        history: history
      });
      
    } catch (dirError) {
      res.json({
        success: true,
        message: 'No scraping history found',
        count: 0,
        history: []
      });
    }

  } catch (error) {
    console.error('Error in /history endpoint:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve history',
      message: error.message || 'An error occurred while retrieving scraping history',
      timestamp: new Date().toISOString()
    });
  }
});

// Get specific scraping result
router.get('/result/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const fs = require('fs').promises;
    const path = require('path');
    
    // Validate filename
    if (!filename || !filename.startsWith('chroma-category-') || !filename.endsWith('.json')) {
      return res.status(400).json({
        success: false,
        error: 'Invalid filename',
        message: 'Filename must be a valid Chroma category scraping result file'
      });
    }
    
    const filepath = path.join(__dirname, '..', 'scraped_data', filename);
    
    try {
      const content = await fs.readFile(filepath, 'utf8');
      const data = JSON.parse(content);
      
      res.json({
        success: true,
        message: 'Scraping result retrieved successfully',
        data: data
      });
      
    } catch (fileError) {
      res.status(404).json({
        success: false,
        error: 'File not found',
        message: 'The specified scraping result file was not found'
      });
    }

  } catch (error) {
    console.error('Error in /result/:filename endpoint:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve result',
      message: error.message || 'An error occurred while retrieving the scraping result',
      timestamp: new Date().toISOString()
    });
  }
});

// Error handling middleware
router.use((error, req, res, next) => {
  console.error('Chroma Category route error:', error);
  
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: 'An unexpected error occurred',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
