const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs').promises;
const path = require('path');
const puppeteer = require('puppeteer');

class ChromaCategoryScraper {
  constructor() {
    this.baseUrl = 'https://www.croma.com';
    this.headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
    };
  }

  async initialize() {
    try {
      console.log('Chroma Category scraper initialized successfully');
      return true;
    } catch (error) {
      console.error('Error initializing Chroma Category scraper:', error);
      throw error;
    }
  }

  async scrapeCategoryPage(url, usePuppeteer = true) {
    try {
      console.log(`Starting to scrape Chroma category page: ${url}`);
      
      // Validate URL
      if (!url || !url.includes('croma.com')) {
        throw new Error('Invalid Chroma URL provided');
      }

      let html;
      
      // Try Puppeteer first for dynamic content
      if (usePuppeteer) {
        try {
          console.log('Attempting to fetch with Puppeteer for dynamic content...');
          html = await this.fetchWithPuppeteer(url);
        } catch (puppeteerError) {
          console.log('Puppeteer failed, falling back to axios:', puppeteerError.message);
          html = await this.fetchWithAxios(url);
        }
      } else {
        html = await this.fetchWithAxios(url);
      }
      
      const $ = cheerio.load(html);

      // Extract category data
      const categoryData = await this.extractCategoryData($, url);
      
      // Save to JSON file
      await this.saveToJson(categoryData, url);

      console.log('Category scraping completed successfully');
      return categoryData;

    } catch (error) {
      console.error('Error scraping Chroma category page:', error);
      throw error;
    }
  }

  async fetchWithAxios(url) {
    try {
      const response = await axios.get(url, {
        headers: this.headers,
        timeout: 30000,
        maxRedirects: 5,
        validateStatus: function (status) {
          return status >= 200 && status < 400;
        }
      });

      if (response.status !== 200) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response.data;
    } catch (error) {
      console.error('Error fetching URL with axios:', error.message);
      throw error;
    }
  }

  async fetchWithPuppeteer(url) {
    let browser;
    try {
      console.log('Launching Puppeteer for dynamic content extraction...');
      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ]
      });
      
      const page = await browser.newPage();
      
      // Set user agent
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
      
      console.log('Navigating to URL:', url);
      await page.goto(url, { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      });
      
      // Wait for product elements to load
      console.log('Waiting for product elements to load...');
      try {
        await page.waitForSelector('script', { 
          timeout: 15000 
        });
        console.log('Script elements found!');
      } catch (error) {
        console.log('Script elements not found within timeout, continuing with available content');
      }
      
      // Additional wait for any dynamic content
      await page.waitForTimeout(2000);
      
      const html = await page.content();
      console.log('Dynamic content extraction completed');
      
      return html;
    } catch (error) {
      console.error('Error with Puppeteer:', error);
      throw error;
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  async extractCategoryData($, url) {
    try {
      const categoryData = {
        categoryName: '',
        categoryUrl: url,
        totalProducts: 0,
        products: [],
        breadcrumbs: [],
        filters: {},
        pagination: {},
        scrapedAt: new Date().toISOString()
      };

      // Extract from JavaScript initial data
      const jsData = await this.extractFromJavaScript($);
      if (jsData && Object.keys(jsData).length > 0) {
        Object.assign(categoryData, jsData);
      }

      // Fallback to DOM extraction if JavaScript data is not available
      if (!categoryData.categoryName) {
        categoryData.categoryName = this.extractCategoryName($, url);
      }

      if (!categoryData.breadcrumbs || categoryData.breadcrumbs.length === 0) {
        categoryData.breadcrumbs = this.extractBreadcrumbs($);
      }

      return categoryData;

    } catch (error) {
      console.error('Error extracting category data:', error);
      throw error;
    }
  }

  async extractFromJavaScript($) {
    try {
      const jsData = {};

      // Extract from __INITIAL_DATA__
      const initialDataScript = $('script').filter(function() {
        return $(this).html().includes('window.__INITIAL_DATA__');
      });

      if (initialDataScript.length > 0) {
        try {
          const scriptContent = initialDataScript.html();
          
          // Find the start of the JSON data
          const startIndex = scriptContent.indexOf('window.__INITIAL_DATA__=');
          if (startIndex !== -1) {
            const jsonStart = scriptContent.indexOf('{', startIndex);
            if (jsonStart !== -1) {
              // Find the matching closing brace
              let braceCount = 0;
              let jsonEnd = jsonStart;
              for (let i = jsonStart; i < scriptContent.length; i++) {
                if (scriptContent[i] === '{') braceCount++;
                if (scriptContent[i] === '}') braceCount--;
                if (braceCount === 0) {
                  jsonEnd = i;
                  break;
                }
              }
              
              const jsonString = scriptContent.substring(jsonStart, jsonEnd + 1);
              
              // Clean up the JSON string by removing undefined values
              const cleanedJsonString = jsonString
                .replace(/undefined/g, 'null')
                .replace(/,(\s*[}\]])/g, '$1'); // Remove trailing commas
              
              const initialData = JSON.parse(cleanedJsonString);
              
              // Extract category data from plpReducer.plpData
              if (initialData.plpReducer && initialData.plpReducer.plpData) {
                const plpData = initialData.plpReducer.plpData;
                
                // Extract products
                if (plpData.products && Array.isArray(plpData.products)) {
                  jsData.products = plpData.products.map(product => this.formatProductData(product));
                  jsData.totalProducts = plpData.products.length;
                }
                
                // Extract breadcrumbs
                if (plpData.breadcrumbs && Array.isArray(plpData.breadcrumbs)) {
                  jsData.breadcrumbs = plpData.breadcrumbs.map(breadcrumb => ({
                    name: breadcrumb.name,
                    url: breadcrumb.url
                  }));
                }
                
                // Extract category name from breadcrumbs
                if (jsData.breadcrumbs && jsData.breadcrumbs.length > 0) {
                  jsData.categoryName = jsData.breadcrumbs[jsData.breadcrumbs.length - 1].name;
                }
                
                // Extract filters if available
                if (plpData.filters) {
                  jsData.filters = plpData.filters;
                }
                
                // Extract pagination info
                if (plpData.pagination) {
                  jsData.pagination = plpData.pagination;
                }
              }
            }
          }
        } catch (parseError) {
          console.error('Error parsing __INITIAL_DATA__:', parseError);
        }
      }

      return jsData;
    } catch (error) {
      console.error('Error extracting from JavaScript:', error);
      return {};
    }
  }

  formatProductData(product) {
    try {
      const formattedProduct = {
        productId: product.code || '',
        productName: product.name || '',
        brand: product.manufacturer || '',
        sellingPrice: product.price ? product.price.formattedValue || `₹${product.price.value}` : '',
        actualPrice: product.mrp ? product.mrp.formattedValue || `₹${product.mrp.value}` : '',
        discount: product.discountValue || '',
        discountAmount: this.calculateDiscountAmount(product),
        productImage: product.plpImage || '',
        productUrl: this.generateProductUrl(product),
        rating: product.averageRating || product.finalReviewRating || 0,
        reviewCount: product.finalReviewRatingCount || 0,
        availability: product.stockStatus || 'Available',
        category: product.categoryL0 || '',
        subCategory: product.categoryL1 || '',
        offers: product.productMessage ? [product.productMessage] : [],
        additionalInfo: {
          applianceType: product.applianceType || '',
          demoFlag: product.demoFlag || false,
          productLiveDate: product.productLiveDate || ''
        }
      };

      return formattedProduct;
    } catch (error) {
      console.error('Error formatting product data:', error);
      return {};
    }
  }

  calculateDiscountAmount(product) {
    try {
      if (product.mrp && product.price && product.mrp.value && product.price.value) {
        const discountAmount = product.mrp.value - product.price.value;
        return `₹${discountAmount.toLocaleString('en-IN')}`;
      }
      return '';
    } catch (error) {
      console.error('Error calculating discount amount:', error);
      return '';
    }
  }

  generateProductUrl(product) {
    try {
      if (product.code) {
        // Generate product URL based on product code
        return `${this.baseUrl}/p/${product.code}`;
      }
      return '';
    } catch (error) {
      console.error('Error generating product URL:', error);
      return '';
    }
  }

  extractCategoryName($, url = '') {
    try {
      // Try to extract from page title
      const pageTitle = $('title').text().trim();
      if (pageTitle && pageTitle !== 'Chroma') {
        // Remove common suffixes like "| Croma.com"
        const cleanTitle = pageTitle.replace(/\s*\|\s*Croma\.com.*$/i, '').trim();
        if (cleanTitle && cleanTitle.length > 0) {
          return cleanTitle;
        }
      }

      // Try to extract from URL
      if (url && url.includes('/c/')) {
        const urlParts = url.split('/c/')[1];
        if (urlParts) {
          const categoryId = urlParts.split('?')[0];
          return `Category ${categoryId}`;
        }
      }

      return 'Category not specified';
    } catch (error) {
      console.error('Error extracting category name:', error);
      return 'Category not specified';
    }
  }

  extractBreadcrumbs($) {
    try {
      const breadcrumbs = [];
      
      // Try breadcrumb selectors
      const breadcrumbSelectors = [
        '.breadcrumb',
        '.breadcrumbs',
        '.navigation-breadcrumb'
      ];

      for (const selector of breadcrumbSelectors) {
        const element = $(selector);
        if (element.length > 0) {
          element.find('a, span').each(function() {
            const text = $(this).text().trim();
            const href = $(this).attr('href');
            if (text && text.length > 0) {
              breadcrumbs.push({
                name: text,
                url: href ? (href.startsWith('http') ? href : `${this.baseUrl}${href}`) : ''
              });
            }
          });
          if (breadcrumbs.length > 0) break;
        }
      }

      return breadcrumbs;
    } catch (error) {
      console.error('Error extracting breadcrumbs:', error);
      return [];
    }
  }

  async saveToJson(categoryData, url) {
    try {
      // Create scraped_data directory if it doesn't exist
      const scrapedDir = path.join(__dirname, '..', 'scraped_data');
      await fs.mkdir(scrapedDir, { recursive: true });

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `chroma-category-${timestamp}.json`;
      const filepath = path.join(scrapedDir, filename);

      // Save the data
      await fs.writeFile(filepath, JSON.stringify(categoryData, null, 2), 'utf8');
      
      console.log(`Category data saved to: ${filepath}`);
      return filepath;
    } catch (error) {
      console.error('Error saving to JSON:', error);
      throw error;
    }
  }

  async close() {
    try {
      console.log('Chroma Category scraper closed successfully');
    } catch (error) {
      console.error('Error closing Chroma Category scraper:', error);
    }
  }
}

module.exports = ChromaCategoryScraper;
