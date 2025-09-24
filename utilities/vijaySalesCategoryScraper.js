const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs').promises;
const path = require('path');
const puppeteer = require('puppeteer');

class VijaySalesCategoryScraper {
  constructor() {
    this.baseUrl = 'https://www.vijaysales.com';
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
      console.log('Vijay Sales Category scraper initialized successfully');
      return true;
    } catch (error) {
      console.error('Error initializing Vijay Sales Category scraper:', error);
      throw error;
    }
  }

  async scrapeCategoryPage(url, usePuppeteer = true) {
    try {
      console.log(`Starting to scrape Vijay Sales category page: ${url}`);
      
      // Validate URL
      if (!url || !url.includes('vijaysales.com')) {
        throw new Error('Invalid Vijay Sales URL provided');
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
      console.error('Error scraping Vijay Sales category page:', error);
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
        headless: 'new',
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
        await page.waitForSelector('.product-card', { 
          timeout: 15000 
        });
        console.log('Product cards found!');
      } catch (error) {
        console.log('Product cards not found within timeout, continuing with available content');
      }
      
      // Additional wait for any dynamic content
      await page.waitForTimeout(3000);
      
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

      // Extract category name from page title
      categoryData.categoryName = this.extractCategoryName($, url);

      // Extract breadcrumbs
      categoryData.breadcrumbs = this.extractBreadcrumbs($);

      // Extract products
      categoryData.products = this.extractProducts($);
      categoryData.totalProducts = categoryData.products.length;

      // Extract filters
      categoryData.filters = this.extractFilters($);

      // Extract pagination info
      categoryData.pagination = this.extractPagination($);

      return categoryData;

    } catch (error) {
      console.error('Error extracting category data:', error);
      throw error;
    }
  }

  extractCategoryName($, url = '') {
    try {
      // Try to extract from page title
      const pageTitle = $('title').text().trim();
      if (pageTitle && pageTitle !== 'Vijay Sales') {
        // Remove common suffixes like "| Vijay Sales"
        const cleanTitle = pageTitle.replace(/\s*\|\s*Vijay Sales.*$/i, '').trim();
        if (cleanTitle && cleanTitle.length > 0) {
          return cleanTitle;
        }
      }

      // Try to extract from h1 tag
      const h1Title = $('h1').first().text().trim();
      if (h1Title && h1Title.length > 0) {
        return h1Title;
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
        '.navigation-breadcrumb',
        '.breadcrumb-nav'
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

  extractProducts($) {
    try {
      const products = [];
      
      // Extract products from product cards
      $('.product-card').each((index, element) => {
        try {
          const $product = $(element);
          const product = this.extractProductData($product);
          if (product && product.productName) {
            products.push(product);
          }
        } catch (error) {
          console.error(`Error extracting product ${index}:`, error);
        }
      });

      // If no products found with .product-card, try alternative selectors
      if (products.length === 0) {
        $('.product-item, .product, [data-product-id]').each((index, element) => {
          try {
            const $product = $(element);
            const product = this.extractProductData($product);
            if (product && product.productName) {
              products.push(product);
            }
          } catch (error) {
            console.error(`Error extracting product ${index}:`, error);
          }
        });
      }

      console.log(`Extracted ${products.length} products`);
      return products;
    } catch (error) {
      console.error('Error extracting products:', error);
      return [];
    }
  }

  extractProductData($product) {
    try {
      const product = {
        productId: '',
        productName: '',
        brand: '',
        sellingPrice: '',
        actualPrice: '',
        discount: '',
        discountAmount: '',
        productImage: '',
        productUrl: '',
        rating: 0,
        reviewCount: 0,
        availability: 'Available',
        category: '',
        subCategory: '',
        offers: [],
        scrapedAt: new Date().toISOString()
      };

      // Extract product name/title
      product.productName = this.extractProductName($product);
      
      // Extract product ID from URL or data attributes
      product.productId = this.extractProductId($product);
      
      // Extract brand
      product.brand = this.extractBrand($product);
      
      // Extract pricing information
      const pricing = this.extractPricing($product);
      product.sellingPrice = pricing.sellingPrice;
      product.actualPrice = pricing.actualPrice;
      product.discount = pricing.discount;
      product.discountAmount = pricing.discountAmount;
      
      // Extract product image
      product.productImage = this.extractProductImage($product);
      
      // Extract product URL
      product.productUrl = this.extractProductUrl($product);
      
      // Extract rating and reviews
      const ratingData = this.extractRatingData($product);
      product.rating = ratingData.rating;
      product.reviewCount = ratingData.reviewCount;
      
      // Extract offers
      product.offers = this.extractOffers($product);

      return product;
    } catch (error) {
      console.error('Error extracting product data:', error);
      return null;
    }
  }

  extractProductName($product) {
    try {
      const nameSelectors = [
        '.product-card__title',
        '.product-title',
        '.product-name',
        'h3',
        'h4',
        '.title',
        'a[data-href]'
      ];

      for (const selector of nameSelectors) {
        const element = $product.find(selector).first();
        if (element.length > 0) {
          let name = element.text().trim();
          if (name && name.length > 0) {
            // Clean up duplicate text and extra whitespace
            name = name.replace(/\s+/g, ' ').trim();
            // Remove duplicate lines and duplicate text
            const lines = name.split('\n').map(line => line.trim()).filter(line => line.length > 0);
            if (lines.length > 0) {
              let cleanName = lines[0];
              // Remove duplicate text patterns
              const words = cleanName.split(' ');
              const uniqueWords = [];
              const seen = new Set();
              
              for (const word of words) {
                if (!seen.has(word.toLowerCase())) {
                  uniqueWords.push(word);
                  seen.add(word.toLowerCase());
                }
              }
              
              return uniqueWords.join(' ');
            }
            return name;
          }
        }
      }

      // Try to extract from link text
      const link = $product.find('a').first();
      if (link.length > 0) {
        const linkText = link.text().trim();
        if (linkText && linkText.length > 0) {
          // Clean up duplicate text and extra whitespace
          const cleanedText = linkText.replace(/\s+/g, ' ').trim();
          const lines = cleanedText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
          if (lines.length > 0) {
            return lines[0]; // Return the first non-empty line
          }
          return cleanedText;
        }
      }

      return '';
    } catch (error) {
      console.error('Error extracting product name:', error);
      return '';
    }
  }

  extractProductId($product) {
    try {
      // Try to extract from data attributes
      const dataId = $product.attr('data-product-id') || $product.attr('data-id');
      if (dataId) {
        return dataId;
      }

      // Try to extract from URL
      const link = $product.find('a').first();
      if (link.length > 0) {
        const href = link.attr('href') || link.attr('data-href');
        if (href && href.includes('/p/')) {
          const urlParts = href.split('/p/')[1];
          if (urlParts) {
            const productId = urlParts.split('/')[0];
            return productId;
          }
        }
      }

      return '';
    } catch (error) {
      console.error('Error extracting product ID:', error);
      return '';
    }
  }

  extractBrand($product) {
    try {
      // Try to extract brand from product name
      const productName = this.extractProductName($product);
      if (productName) {
        // Common brand patterns
        const brandPatterns = [
          /^([A-Z][a-zA-Z\s&]+?)\s+/,
          /^([A-Z][a-zA-Z\s&]+?)\s*[0-9]/,
          /^([A-Z][a-zA-Z\s&]+?)\s*[A-Z]/
        ];

        for (const pattern of brandPatterns) {
          const match = productName.match(pattern);
          if (match && match[1]) {
            return match[1].trim();
          }
        }
      }

      return '';
    } catch (error) {
      console.error('Error extracting brand:', error);
      return '';
    }
  }

  extractPricing($product) {
    try {
      const pricing = {
        sellingPrice: '',
        actualPrice: '',
        discount: '',
        discountAmount: ''
      };

      // Extract current/selling price - look for the first price in the product card
      const priceText = $product.text();
      
      // Find all price patterns in the text
      const priceMatches = priceText.match(/₹[0-9,]+/g);
      if (priceMatches && priceMatches.length > 0) {
        // First price is usually the selling price
        pricing.sellingPrice = priceMatches[0];
        
        // If there are multiple prices, the second one might be MRP
        if (priceMatches.length > 1) {
          pricing.actualPrice = priceMatches[1];
        }
      }

      // Also look for discount percentage
      const discountMatch = priceText.match(/([0-9]+)%\s*Off/i);
      if (discountMatch) {
        pricing.discount = `${discountMatch[1]}%`;
      }

      // Calculate discount amount if both prices are available
      if (pricing.sellingPrice && pricing.actualPrice) {
        const sellingPriceNum = this.extractPriceNumber(pricing.sellingPrice);
        const actualPriceNum = this.extractPriceNumber(pricing.actualPrice);
        
        if (sellingPriceNum && actualPriceNum && actualPriceNum > sellingPriceNum) {
          const discountAmount = actualPriceNum - sellingPriceNum;
          
          if (!pricing.discount) {
            const discountPercentage = Math.round((discountAmount / actualPriceNum) * 100);
            pricing.discount = `${discountPercentage}%`;
          }
          
          pricing.discountAmount = `₹${discountAmount.toLocaleString('en-IN')}`;
        }
      }

      return pricing;
    } catch (error) {
      console.error('Error extracting pricing:', error);
      return { sellingPrice: '', actualPrice: '', discount: '', discountAmount: '' };
    }
  }

  extractPriceNumber(priceText) {
    try {
      const priceMatch = priceText.match(/₹?([0-9,]+)/);
      if (priceMatch) {
        return parseInt(priceMatch[1].replace(/,/g, ''));
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  extractProductImage($product) {
    try {
      const imageSelectors = [
        '.product-card__image img',
        '.product-image img',
        'img'
      ];

      for (const selector of imageSelectors) {
        const element = $product.find(selector).first();
        if (element.length > 0) {
          const src = element.attr('src') || element.attr('data-src');
          if (src) {
            // Convert relative URLs to absolute
            if (src.startsWith('//')) {
              return `https:${src}`;
            } else if (src.startsWith('/')) {
              return `${this.baseUrl}${src}`;
            } else if (src.startsWith('http')) {
              return src;
            }
          }
        }
      }

      return '';
    } catch (error) {
      console.error('Error extracting product image:', error);
      return '';
    }
  }

  extractProductUrl($product) {
    try {
      const link = $product.find('a').first();
      if (link.length > 0) {
        const href = link.attr('href') || link.attr('data-href');
        if (href) {
          // Convert relative URLs to absolute
          if (href.startsWith('//')) {
            return `https:${href}`;
          } else if (href.startsWith('/')) {
            return `${this.baseUrl}${href}`;
          } else if (href.startsWith('http')) {
            return href;
          }
        }
      }

      return '';
    } catch (error) {
      console.error('Error extracting product URL:', error);
      return '';
    }
  }

  extractRatingData($product) {
    try {
      const ratingData = {
        rating: 0,
        reviewCount: 0
      };

      // Extract rating
      const ratingSelectors = [
        '.rating',
        '.stars',
        '.product-rating'
      ];

      for (const selector of ratingSelectors) {
        const element = $product.find(selector).first();
        if (element.length > 0) {
          const ratingText = element.text().trim();
          const ratingMatch = ratingText.match(/([0-9.]+)/);
          if (ratingMatch) {
            ratingData.rating = parseFloat(ratingMatch[1]);
            break;
          }
        }
      }

      // Extract review count
      const reviewSelectors = [
        '.reviews',
        '.review-count',
        '.product-reviews'
      ];

      for (const selector of reviewSelectors) {
        const element = $product.find(selector).first();
        if (element.length > 0) {
          const reviewText = element.text().trim();
          const reviewMatch = reviewText.match(/([0-9]+)/);
          if (reviewMatch) {
            ratingData.reviewCount = parseInt(reviewMatch[1]);
            break;
          }
        }
      }

      return ratingData;
    } catch (error) {
      console.error('Error extracting rating data:', error);
      return { rating: 0, reviewCount: 0 };
    }
  }

  extractOffers($product) {
    try {
      const offers = [];
      
      const offerSelectors = [
        '.offer',
        '.discount',
        '.promo',
        '.deal'
      ];

      for (const selector of offerSelectors) {
        $product.find(selector).each(function() {
          const offerText = $(this).text().trim();
          if (offerText && offerText.length > 0) {
            offers.push(offerText);
          }
        });
      }

      return offers;
    } catch (error) {
      console.error('Error extracting offers:', error);
      return [];
    }
  }

  extractFilters($) {
    try {
      const filters = {};
      
      // Extract filter categories
      $('.filter, .facet').each(function() {
        const filterName = $(this).find('.filter-title, .facet-title').text().trim();
        if (filterName) {
          const filterOptions = [];
          $(this).find('.filter-option, .facet-option').each(function() {
            const optionText = $(this).text().trim();
            if (optionText) {
              filterOptions.push(optionText);
            }
          });
          if (filterOptions.length > 0) {
            filters[filterName] = filterOptions;
          }
        }
      });

      return filters;
    } catch (error) {
      console.error('Error extracting filters:', error);
      return {};
    }
  }

  extractPagination($) {
    try {
      const pagination = {
        currentPage: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false
      };

      // Extract pagination info
      const paginationElement = $('.pagination, .pager').first();
      if (paginationElement.length > 0) {
        // Extract current page
        const currentPageElement = paginationElement.find('.current, .active').first();
        if (currentPageElement.length > 0) {
          const currentPageText = currentPageElement.text().trim();
          const currentPageMatch = currentPageText.match(/([0-9]+)/);
          if (currentPageMatch) {
            pagination.currentPage = parseInt(currentPageMatch[1]);
          }
        }

        // Check for next/previous pages
        pagination.hasNextPage = paginationElement.find('.next, .next-page').length > 0;
        pagination.hasPreviousPage = paginationElement.find('.prev, .previous-page').length > 0;
      }

      return pagination;
    } catch (error) {
      console.error('Error extracting pagination:', error);
      return { currentPage: 1, totalPages: 1, hasNextPage: false, hasPreviousPage: false };
    }
  }

  async saveToJson(categoryData, url) {
    try {
      // Create scraped_data directory if it doesn't exist
      const scrapedDir = path.join(__dirname, '..', 'scraped_data');
      await fs.mkdir(scrapedDir, { recursive: true });

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `vijay-sales-category-${timestamp}.json`;
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
      console.log('Vijay Sales Category scraper closed successfully');
    } catch (error) {
      console.error('Error closing Vijay Sales Category scraper:', error);
    }
  }
}

module.exports = VijaySalesCategoryScraper;
