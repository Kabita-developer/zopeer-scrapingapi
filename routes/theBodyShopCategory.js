const express = require('express');
const router = express.Router();
const TheBodyShopCategoryScraper = require('../utilities/theBodyShopCategoryScraper');
const fs = require('fs').promises;
const path = require('path');

// Initialize scraper instance
let theBodyShopCategoryScraper = null;

// Initialize scraper
const initializeScraper = async () => {
  if (!theBodyShopCategoryScraper) {
    theBodyShopCategoryScraper = new TheBodyShopCategoryScraper();
    await theBodyShopCategoryScraper.initialize();
  }
  return theBodyShopCategoryScraper;
};

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'The Body Shop Category Scraper',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Scrape The Body Shop category page
router.post('/scrape-category', async (req, res) => {
  try {
    const { url, usePuppeteer = true } = req.body;

    // Validate input
    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'URL is required',
        message: 'Please provide a valid The Body Shop category URL'
      });
    }

    // Validate URL
    if (!url.includes('thebodyshop.in') || (!url.includes('/c/') && !url.includes('/category') && !url.includes('/products'))) {
      return res.status(400).json({
        success: false,
        error: 'Invalid URL',
        message: 'Please provide a valid The Body Shop category URL'
      });
    }

    const scraper = await initializeScraper();
    
    console.log(`Scraping The Body Shop category: ${url}`);
    const categoryData = await scraper.scrapeCategory(url, usePuppeteer);

    // Save scraped data
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `thebodyshop-category-${timestamp}.json`;
    const filePath = path.join(__dirname, '../scraped_data', filename);
    
    await fs.writeFile(filePath, JSON.stringify(categoryData, null, 2));

    res.json({
      success: true,
      message: 'Category scraped successfully',
      data: categoryData,
      savedTo: filename,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error scraping The Body Shop category:', error);
    res.status(500).json({
      success: false,
      error: 'Scraping failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get category by URL (GET endpoint)
router.get('/category', async (req, res) => {
  try {
    const { url, usePuppeteer = true } = req.query;

    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'URL is required',
        message: 'Please provide a valid The Body Shop category URL as query parameter'
      });
    }

    const scraper = await initializeScraper();
    const categoryData = await scraper.scrapeCategory(url, usePuppeteer === 'true');

    res.json({
      success: true,
      message: 'Category data retrieved successfully',
      data: categoryData,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error getting The Body Shop category:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve category data',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Search products in category
router.get('/search', async (req, res) => {
  try {
    const { q: query, category = '', limit = 20 } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required',
        message: 'Please provide a search query parameter'
      });
    }

    const scraper = await initializeScraper();
    const searchResults = await scraper.searchProducts(query, category, parseInt(limit));

    res.json({
      success: true,
      message: `Found ${searchResults.length} products for "${query}"`,
      query: query,
      category: category,
      limit: parseInt(limit),
      results: searchResults,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error searching The Body Shop products:', error);
    res.status(500).json({
      success: false,
      error: 'Search failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get popular categories
router.get('/categories', async (req, res) => {
  try {
    const categories = [
      {
        id: 'bath-body',
        name: 'Bath & Body',
        url: 'https://www.thebodyshop.in/bath-body',
        subcategories: [
          'Body Butters', 'Body Lotions', 'Shower Gels', 'Soaps', 'Body Scrubs', 'Deodorants'
        ]
      },
      {
        id: 'face-skincare',
        name: 'Face & Skincare',
        url: 'https://www.thebodyshop.in/face-skincare',
        subcategories: [
          'Moisturisers', 'Cleansers & Toners', 'Face Masks', 'Serums & Essences', 'Eye Care'
        ]
      },
      {
        id: 'hair',
        name: 'Hair',
        url: 'https://www.thebodyshop.in/hair',
        subcategories: [
          'Shampoo', 'Conditioner', 'Hair Styling', 'Hair Brushes and Combs'
        ]
      },
      {
        id: 'makeup',
        name: 'Makeup',
        url: 'https://www.thebodyshop.in/makeup',
        subcategories: [
          'Lips', 'Mascara', 'Foundations & Concealers', 'Eye Shadow', 'Makeup Brushes'
        ]
      },
      {
        id: 'fragrance',
        name: 'Fragrance',
        url: 'https://www.thebodyshop.in/fragrance',
        subcategories: [
          'Body Mists', 'Eau De Toilette', 'Eau De Parfum', 'Fragrance Gifts'
        ]
      }
    ];

    res.json({
      success: true,
      message: 'Categories retrieved successfully',
      categories: categories,
      count: categories.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error getting categories:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve categories',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get scraper status
router.get('/status', async (req, res) => {
  try {
    const isInitialized = theBodyShopCategoryScraper !== null;
    
    res.json({
      success: true,
      message: 'The Body Shop scraper status',
      initialized: isInitialized,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error getting scraper status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get scraper status',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Initialize scraper
router.post('/init', async (req, res) => {
  try {
    await initializeScraper();
    
    res.json({
      success: true,
      message: 'The Body Shop scraper initialized successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error initializing scraper:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to initialize scraper',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Cleanup scraper
router.post('/cleanup', async (req, res) => {
  try {
    if (theBodyShopCategoryScraper) {
      await theBodyShopCategoryScraper.close();
      theBodyShopCategoryScraper = null;
    }
    
    res.json({
      success: true,
      message: 'The Body Shop scraper cleaned up successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error cleaning up scraper:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cleanup scraper',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get all saved scraped files
router.get('/files', async (req, res) => {
  try {
    const scrapedDataDir = path.join(__dirname, '../scraped_data');
    
    try {
      const files = await fs.readdir(scrapedDataDir);
      const bodyShopFiles = files.filter(file => file.startsWith('thebodyshop-') && file.endsWith('.json'));
      
      const fileDetails = await Promise.all(
        bodyShopFiles.map(async (file) => {
          const filePath = path.join(scrapedDataDir, file);
          const stats = await fs.stat(filePath);
          return {
            filename: file,
            size: stats.size,
            created: stats.birthtime,
            modified: stats.mtime
          };
        })
      );

      res.json({
        success: true,
        message: 'The Body Shop scraped files retrieved successfully',
        files: fileDetails,
        count: fileDetails.length,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      if (error.code === 'ENOENT') {
        res.json({
          success: true,
          message: 'No scraped files found',
          files: [],
          count: 0,
          timestamp: new Date().toISOString()
        });
      } else {
        throw error;
      }
    }

  } catch (error) {
    console.error('Error getting scraped files:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve scraped files',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get specific scraped file
router.get('/files/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    
    if (!filename.endsWith('.json') || !filename.startsWith('thebodyshop-')) {
      return res.status(400).json({
        success: false,
        error: 'Invalid filename',
        message: 'Filename must be a valid The Body Shop scraped file'
      });
    }

    const scrapedDataDir = path.join(__dirname, '../scraped_data');
    const filePath = path.join(scrapedDataDir, filename);
    
    try {
      const fileContent = await fs.readFile(filePath, 'utf8');
      const data = JSON.parse(fileContent);
      
      res.json({
        success: true,
        message: 'File retrieved successfully',
        filename: filename,
        data: data,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      if (error.code === 'ENOENT') {
        res.status(404).json({
          success: false,
          error: 'File not found',
          message: `File ${filename} does not exist`
        });
      } else {
        throw error;
      }
    }

  } catch (error) {
    console.error('Error getting scraped file:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve scraped file',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Delete scraped file
router.delete('/files/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    
    if (!filename.endsWith('.json') || !filename.startsWith('thebodyshop-')) {
      return res.status(400).json({
        success: false,
        error: 'Invalid filename',
        message: 'Filename must be a valid The Body Shop scraped file'
      });
    }

    const scrapedDataDir = path.join(__dirname, '../scraped_data');
    const filePath = path.join(scrapedDataDir, filename);
    
    try {
      await fs.unlink(filePath);
      
      res.json({
        success: true,
        message: 'File deleted successfully',
        filename: filename,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      if (error.code === 'ENOENT') {
        res.status(404).json({
          success: false,
          error: 'File not found',
          message: `File ${filename} does not exist`
        });
      } else {
        throw error;
      }
    }

  } catch (error) {
    console.error('Error deleting scraped file:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete scraped file',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get API documentation
router.get('/docs', (req, res) => {
  const documentation = {
    title: 'The Body Shop Category Scraper API Documentation',
    version: '1.0.0',
    description: 'API for scraping product data from The Body Shop India category pages',
    baseUrl: '/api/thebodyshop-category',
    endpoints: {
      'POST /scrape-category': {
        description: 'Scrape a category page from The Body Shop',
        parameters: {
          url: 'The Body Shop category URL (required)',
          usePuppeteer: 'Use Puppeteer for dynamic content (optional, default: true)'
        },
        example: {
          url: 'https://www.thebodyshop.in/bath-body',
          usePuppeteer: true
        }
      },
      'GET /category': {
        description: 'Get category data by URL',
        parameters: {
          url: 'The Body Shop category URL (required)',
          usePuppeteer: 'Use Puppeteer for dynamic content (optional, default: true)'
        }
      },
      'GET /search': {
        description: 'Search products in The Body Shop',
        parameters: {
          q: 'Search query (required)',
          category: 'Category filter (optional)',
          limit: 'Number of results (optional, default: 20)'
        }
      },
      'GET /categories': {
        description: 'Get list of popular categories'
      },
      'GET /status': {
        description: 'Get scraper status'
      },
      'POST /init': {
        description: 'Initialize the scraper'
      },
      'POST /cleanup': {
        description: 'Cleanup the scraper'
      },
      'GET /files': {
        description: 'Get list of all scraped files'
      },
      'GET /files/:filename': {
        description: 'Get specific scraped file content'
      },
      'DELETE /files/:filename': {
        description: 'Delete a scraped file'
      },
      'GET /health': {
        description: 'Health check endpoint'
      }
    },
    dataStructure: {
      product: {
        productId: 'Product ID',
        productName: 'Product name/title',
        brand: 'Product brand (The Body Shop)',
        sellingPrice: 'Current selling price',
        actualPrice: 'Original/MRP price',
        discount: 'Discount percentage',
        discountAmount: 'Discount amount',
        productImage: 'Product image URL',
        productUrl: 'Product page URL',
        rating: 'Product rating',
        reviewCount: 'Number of reviews',
        availability: 'Stock availability',
        category: 'Product category',
        subCategory: 'Product subcategory',
        description: 'Product description',
        ingredients: 'Product ingredients',
        offers: 'Special offers',
        scrapedAt: 'Timestamp when scraped'
      }
    }
  };

  res.json(documentation);
});

// Cleanup on process exit
process.on('SIGINT', async () => {
  console.log('Cleaning up The Body Shop scraper...');
  if (theBodyShopCategoryScraper) {
    await theBodyShopCategoryScraper.close();
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Cleaning up The Body Shop scraper...');
  if (theBodyShopCategoryScraper) {
    await theBodyShopCategoryScraper.close();
  }
  process.exit(0);
});

module.exports = router;
