const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs').promises;
const path = require('path');
const puppeteer = require('puppeteer');

class TheBodyShopCategoryScraper {
  constructor() {
    this.baseUrl = 'https://www.thebodyshop.in';
    this.headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Cache-Control': 'max-age=0'
    };
    this.browser = null;
    this.page = null;
  }

  async initialize() {
    try {
      console.log('Initializing The Body Shop Category Scraper...');
      
      // Initialize Puppeteer browser
      this.browser = await puppeteer.launch({
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
      
      this.page = await this.browser.newPage();
      
      // Set user agent and viewport
      await this.page.setUserAgent(this.headers['User-Agent']);
      await this.page.setViewport({ width: 1366, height: 768 });
      
      // Set extra headers
      await this.page.setExtraHTTPHeaders({
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      });
      
      console.log('The Body Shop Category Scraper initialized successfully');
    } catch (error) {
      console.error('Error initializing The Body Shop scraper:', error);
      throw error;
    }
  }

  async close() {
    try {
      if (this.browser) {
        await this.browser.close();
        this.browser = null;
        this.page = null;
      }
    } catch (error) {
      console.error('Error closing The Body Shop scraper:', error);
    }
  }

  async scrapeCategory(url, usePuppeteer = true) {
    try {
      if (usePuppeteer) {
        return await this.scrapeWithPuppeteer(url);
      } else {
        return await this.scrapeWithAxios(url);
      }
    } catch (error) {
      console.error('Error scraping The Body Shop category:', error);
      throw error;
    }
  }

  async scrapeWithPuppeteer(url) {
    try {
      if (!this.page) {
        await this.initialize();
      }

      console.log(`Scraping with Puppeteer: ${url}`);
      
      await this.page.goto(url, { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      });

      // Wait for content to load
      await this.page.waitForTimeout(3000);

      // Get page content
      const content = await this.page.content();
      const $ = cheerio.load(content);

      return await this.extractCategoryData($, url);
    } catch (error) {
      console.error('Error scraping with Puppeteer:', error);
      throw error;
    }
  }

  async scrapeWithAxios(url) {
    try {
      console.log(`Scraping with Axios: ${url}`);
      
      const response = await axios.get(url, {
        headers: this.headers,
        timeout: 30000
      });

      const $ = cheerio.load(response.data);
      return await this.extractCategoryData($, url);
    } catch (error) {
      console.error('Error scraping with Axios:', error);
      throw error;
    }
  }

  async extractCategoryData($, url) {
    try {
      const categoryData = {
        url: url,
        scrapedAt: new Date().toISOString(),
        source: 'The Body Shop India',
        category: this.extractCategoryName($, url),
        categoryTitle: this.extractCategoryTitle($),
        breadcrumbs: this.extractBreadcrumbs($),
        totalProducts: 0,
        products: []
      };

      // Extract products from the page
      const products = this.extractProducts($);
      categoryData.products = products;
      categoryData.totalProducts = products.length;

      // Add pagination info if available
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
      if (pageTitle && pageTitle !== 'The Body Shop') {
        const cleanTitle = pageTitle.replace(/\s*\|\s*The Body Shop.*$/i, '').trim();
        if (cleanTitle && cleanTitle.length > 0) {
          return cleanTitle;
        }
      }

      // Try to extract from h1 tag
      const h1Title = $('h1').first().text().trim();
      if (h1Title && h1Title.length > 0) {
        return h1Title;
      }

      // Try to extract from breadcrumb
      const breadcrumbTitle = $('.breadcrumb').find('a').last().text().trim();
      if (breadcrumbTitle && breadcrumbTitle.length > 0) {
        return breadcrumbTitle;
      }

      // Try to extract from URL
      if (url) {
        const urlParts = url.split('/');
        const lastPart = urlParts[urlParts.length - 1];
        if (lastPart && lastPart !== '') {
          return lastPart.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        }
      }

      return 'Category not specified';
    } catch (error) {
      console.error('Error extracting category name:', error);
      return 'Category not specified';
    }
  }

  extractCategoryTitle($) {
    try {
      // Try multiple selectors for category title
      const titleSelectors = [
        'h1',
        '.category-title',
        '.page-title',
        '.breadcrumb-current',
        'title'
      ];

      for (const selector of titleSelectors) {
        const element = $(selector).first();
        if (element.length > 0) {
          const title = element.text().trim();
          if (title && title.length > 0) {
            return title.replace(/\s*\|\s*The Body Shop.*$/i, '').trim();
          }
        }
      }

      return 'The Body Shop Category';
    } catch (error) {
      console.error('Error extracting category title:', error);
      return 'The Body Shop Category';
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
      
      // Extract products from various selectors (The Body Shop specific)
      const productSelectors = [
        '.product-item',
        '.product-card',
        '.product-listing',
        '.product-tile',
        '[data-testid="product-item"]',
        '.product-grid-item',
        '.product-list-item'
      ];

      for (const selector of productSelectors) {
        $(selector).each((index, element) => {
          try {
            const $product = $(element);
            const product = this.extractProductData($product);
            
            if (product && product.productName) {
              products.push(product);
            }
          } catch (error) {
            console.error('Error extracting product:', error);
          }
        });
        
        if (products.length > 0) break;
      }

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
        brand: 'The Body Shop',
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
        description: '',
        ingredients: [],
        offers: [],
        scrapedAt: new Date().toISOString()
      };

      // Extract product name/title
      product.productName = this.extractProductName($product);
      
      // Extract product ID from URL or data attributes
      product.productId = this.extractProductId($product);
      
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
      
      // Extract description
      product.description = this.extractDescription($product);
      
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
        '.product-name',
        '.product-title',
        '.product-name-link',
        'h3',
        'h4',
        '.title',
        'a[data-testid="product-name"]',
        '.product-link'
      ];

      for (const selector of nameSelectors) {
        const element = $product.find(selector).first();
        if (element.length > 0) {
          let name = element.text().trim();
          if (name && name.length > 0) {
            name = name.replace(/\s+/g, ' ').trim();
            return name;
          }
        }
      }

      // Try to extract from link text
      const link = $product.find('a').first();
      if (link.length > 0) {
        const linkText = link.text().trim();
        if (linkText && linkText.length > 0) {
          return linkText.replace(/\s+/g, ' ').trim();
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
      const dataId = $product.attr('data-product-id') || 
                     $product.attr('data-id') || 
                     $product.find('[data-product-id]').attr('data-product-id');
      
      if (dataId) {
        return dataId;
      }

      // Try to extract from URL
      const link = $product.find('a').first();
      if (link.length > 0) {
        const href = link.attr('href');
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

  extractPricing($product) {
    try {
      const pricing = {
        sellingPrice: '',
        actualPrice: '',
        discount: '',
        discountAmount: ''
      };

      // Extract current/selling price
      const priceSelectors = [
        '.price',
        '.selling-price',
        '.offer-price',
        '.current-price',
        '[data-testid="selling-price"]',
        '.price-current'
      ];

      for (const selector of priceSelectors) {
        const element = $product.find(selector).first();
        if (element.length > 0) {
          const priceText = element.text().trim();
          if (priceText && priceText.includes('₹')) {
            pricing.sellingPrice = priceText;
            break;
          }
        }
      }

      // Extract original price/MRP
      const mrpSelectors = [
        '.mrp',
        '.original-price',
        '.strikethrough',
        '.crossed-price',
        '[data-testid="mrp"]',
        '.price-original'
      ];

      for (const selector of mrpSelectors) {
        const element = $product.find(selector).first();
        if (element.length > 0) {
          const priceText = element.text().trim();
          if (priceText && priceText.includes('₹')) {
            pricing.actualPrice = priceText;
            break;
          }
        }
      }

      // Extract discount percentage
      const discountSelectors = [
        '.discount',
        '.off-percentage',
        '.savings',
        '[data-testid="discount"]'
      ];

      for (const selector of discountSelectors) {
        const element = $product.find(selector).first();
        if (element.length > 0) {
          const discountText = element.text().trim();
          if (discountText) {
            pricing.discount = discountText;
            break;
          }
        }
      }

      // Calculate discount if not provided but prices are available
      if (pricing.sellingPrice && pricing.actualPrice && !pricing.discount) {
        const sellingPriceNum = this.extractPriceNumber(pricing.sellingPrice);
        const actualPriceNum = this.extractPriceNumber(pricing.actualPrice);
        
        if (sellingPriceNum && actualPriceNum && actualPriceNum > sellingPriceNum) {
          const discountAmount = actualPriceNum - sellingPriceNum;
          const discountPercentage = Math.round((discountAmount / actualPriceNum) * 100);
          pricing.discount = `${discountPercentage}% Off`;
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
      const priceMatch = priceText.match(/₹?\s*([0-9,]+\.?[0-9]*)/);
      if (priceMatch) {
        return parseFloat(priceMatch[1].replace(/,/g, ''));
      }
      return null;
    } catch (error) {
      console.error('Error extracting price number:', error);
      return null;
    }
  }

  extractProductImage($product) {
    try {
      const imageSelectors = [
        'img[alt*="product"]',
        'img[alt*="thumbnail"]',
        '.product-image img',
        '.product-thumbnail img',
        '.product-img img',
        'img[src*="thebodyshop"]',
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
        const href = link.attr('href');
        if (href) {
          // Convert relative URLs to absolute
          if (href.startsWith('/')) {
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
        '.product-rating',
        '[data-testid="rating"]',
        '.star-rating'
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
        '.product-reviews',
        '[data-testid="review-count"]',
        '.rating-count'
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

  extractDescription($product) {
    try {
      const descSelectors = [
        '.product-description',
        '.description',
        '.product-summary',
        '.product-info'
      ];

      for (const selector of descSelectors) {
        const element = $product.find(selector).first();
        if (element.length > 0) {
          const desc = element.text().trim();
          if (desc && desc.length > 0) {
            return desc.replace(/\s+/g, ' ').trim();
          }
        }
      }

      return '';
    } catch (error) {
      console.error('Error extracting description:', error);
      return '';
    }
  }

  extractOffers($product) {
    try {
      const offers = [];
      
      const offerSelectors = [
        '.offer',
        '.discount',
        '.promotion',
        '.badge',
        '.tag'
      ];

      for (const selector of offerSelectors) {
        $product.find(selector).each((i, el) => {
          const offerText = $(el).text().trim();
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

  extractPagination($) {
    try {
      const pagination = {
        currentPage: 1,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
        nextUrl: '',
        prevUrl: ''
      };

      // Try to extract pagination info
      const paginationSelectors = [
        '.pagination',
        '.page-navigation',
        '.pager'
      ];

      for (const selector of paginationSelectors) {
        const paginationEl = $(selector);
        if (paginationEl.length > 0) {
          // Extract current page
          const currentPageEl = paginationEl.find('.current, .active, .selected').first();
          if (currentPageEl.length > 0) {
            const currentPageText = currentPageEl.text().trim();
            const pageMatch = currentPageText.match(/([0-9]+)/);
            if (pageMatch) {
              pagination.currentPage = parseInt(pageMatch[1]);
            }
          }

          // Check for next/previous links
          pagination.hasNext = paginationEl.find('.next, .pagination-next').length > 0;
          pagination.hasPrev = paginationEl.find('.prev, .pagination-prev').length > 0;

          break;
        }
      }

      return pagination;
    } catch (error) {
      console.error('Error extracting pagination:', error);
      return { currentPage: 1, totalPages: 1, hasNext: false, hasPrev: false, nextUrl: '', prevUrl: '' };
    }
  }

  async searchProducts(query, category = '', limit = 20) {
    try {
      // This would typically involve calling The Body Shop's search API
      // For now, return a placeholder implementation
      console.log(`Searching for "${query}" in category "${category}" with limit ${limit}`);
      
      return [];
    } catch (error) {
      console.error('Error searching products:', error);
      throw error;
    }
  }
}

module.exports = TheBodyShopCategoryScraper;
