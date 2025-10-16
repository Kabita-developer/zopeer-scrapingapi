const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const axios = require('axios');
const path = require('path');
const fs = require('fs');

class AjioCategoriesScraper {
    constructor() {
        this.baseUrl = 'https://www.ajio.com';
        this.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
    }

    async scrapeCategory(url, usePuppeteer = true) {
        try {
            console.log(`Scraping Ajio category: ${url}`);
            
            let html;
            
            if (usePuppeteer) {
                try {
                    html = await this.scrapeWithPuppeteer(url);
                } catch (puppeteerError) {
                    console.log('Puppeteer scraping failed, trying Axios as fallback:', puppeteerError.message);
                    html = await this.scrapeWithAxios(url);
                }
            } else {
                html = await this.scrapeWithAxios(url);
            }

            if (!html) {
                throw new Error('Failed to fetch page content');
            }

            const $ = cheerio.load(html);
            
            // Debug: Check what selectors are present on the page
            console.log('Page content analysis:');
            console.log('- Items container:', $('.items').length > 0 ? 'Found' : 'Not found');
            console.log('- Product grid:', $('.product-grid').length > 0 ? 'Found' : 'Not found');
            console.log('- Product list:', $('.product-list').length > 0 ? 'Found' : 'Not found');
            console.log('- Preview images:', $('.preview-image').length);
            
            // Save HTML for debugging if needed
            const debugDir = path.join(__dirname, '../scrspedhtml');
            if (!fs.existsSync(debugDir)) {
                fs.mkdirSync(debugDir, { recursive: true });
            }
            const debugFilePath = path.join(debugDir, 'ajio-debug.html');
            fs.writeFileSync(debugFilePath, html);
            console.log('Debug HTML saved to:', debugFilePath);
            
            const products = this.extractProducts($);
            
            return {
                url: url,
                scrapedAt: new Date().toISOString(),
                totalProducts: products.length,
                products: products,
                metadata: {
                    category: this.extractCategoryInfo($, url),
                    pagination: this.extractPaginationInfo($)
                }
            };

        } catch (error) {
            console.error('Error in Ajio categories scraping:', error);
            // Save the HTML even on error for debugging
            try {
                const debugDir = path.join(__dirname, '../scrspedhtml');
                if (!fs.existsSync(debugDir)) {
                    fs.mkdirSync(debugDir, { recursive: true });
                }
                const debugFilePath = path.join(debugDir, 'ajio-error-debug.html');
                if (html) {
                    fs.writeFileSync(debugFilePath, html);
                    console.log('Error state HTML saved to:', debugFilePath);
                }
            } catch (fsError) {
                console.error('Error saving debug HTML:', fsError);
            }
            throw error;
        }
    }

    async scrapeWithPuppeteer(url) {
        let browser;
        let page;
        
        try {
            console.log('Launching Puppeteer...');
            browser = await puppeteer.launch({
                headless: 'new',
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--no-first-run',
                    '--no-zygote',
                    '--disable-gpu',
                    '--window-size=1920,1080',
                    '--disable-blink-features=AutomationControlled',
                    '--disable-features=VizDisplayCompositor'
                ]
            });

            page = await browser.newPage();
            
            // Set a realistic desktop user agent
            const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
            await page.setUserAgent(userAgent);
            
            // Set viewport
            await page.setViewport({ 
                width: 1920, 
                height: 1080,
                deviceScaleFactor: 1
            });
            
            // Set realistic headers
            await page.setExtraHTTPHeaders({
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                'Accept-Language': 'en-GB,en-US;q=0.9,en;q=0.8',
                'Accept-Encoding': 'gzip, deflate, br',
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache',
                'DNT': '1',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'none',
                'Sec-Fetch-User': '?1'
            });

            // Remove webdriver property to avoid detection
            await page.evaluateOnNewDocument(() => {
                Object.defineProperty(navigator, 'webdriver', {
                    get: () => undefined,
                });
            });

            console.log('Navigating to URL with extended timeout...', url);
            
            // First, try to navigate to the URL
            const response = await page.goto(url, { 
                waitUntil: ['networkidle0', 'domcontentloaded'],
                timeout: 90000 // 90 second timeout
            });

            // Check if we were redirected to cart or other unwanted pages
            const currentUrl = page.url();
            console.log('Current URL after navigation:', currentUrl);
            
            if (currentUrl.includes('/cart') || currentUrl.includes('/login') || currentUrl.includes('/signin')) {
                throw new Error(`Page redirected to ${currentUrl} instead of category page. This might be due to anti-bot measures.`);
            }

            // Check if we're on the right page by looking for category indicators
            const pageTitle = await page.title();
            console.log('Page title:', pageTitle);
            
            if (pageTitle.includes('Shopping Bag') || pageTitle.includes('Cart') || pageTitle.includes('Login')) {
                throw new Error(`Page title indicates we're on ${pageTitle} instead of category page.`);
            }

            // Handle cookie consent and popups
            console.log('Checking for overlays and popups...');
            const overlaySelectors = [
                '[class*="cookie"]',
                '[class*="popup"]',
                '[class*="modal"]',
                '[class*="newsletter"]',
                '[class*="dialog"]',
                'button[class*="close"]',
                '[aria-label*="close"]',
                '[title*="close"]'
            ];

            for (const selector of overlaySelectors) {
                try {
                    const elements = await page.$$(selector);
                    for (const element of elements) {
                        if (await element.isVisible()) {
                            await element.click().catch(() => {});
                            console.log(`Clicked overlay/popup: ${selector}`);
                            await page.waitForTimeout(500);
                        }
                    }
                } catch (e) {
                    console.log(`No overlay found for selector: ${selector}`);
                }
            }

            // Wait a bit for the page to fully load
            await page.waitForTimeout(3000);

            // Define all possible product selectors for Ajio
            const productSelectors = [
                '.rilrtl-products-list-item',
                '.item',
                '.items .item',
                '.product-grid .item',
                '.product-list .item',
                '[data-test="product-card"]',
                '.preview-image',
                '.product-tile',
                '.prod',
                '.rilrtl-products',
                '.product-grid',
                '.items'
            ];

            console.log('Waiting for product elements...');
            let foundSelector = null;
            let productCount = 0;

            // Try each selector with a small wait
            for (const selector of productSelectors) {
                try {
                    await page.waitForSelector(selector, { timeout: 5000 });
                    const elements = await page.$$(selector);
                    if (elements.length > 0) {
                        console.log(`Found ${elements.length} products with selector: ${selector}`);
                        foundSelector = selector;
                        productCount = elements.length;
                        break;
                    }
                } catch (e) {
                    console.log(`Selector ${selector} not found or timeout`);
                }
            }

            // If no standard selectors work, try heuristic approach
            if (!foundSelector) {
                console.log('No standard selectors matched, trying heuristic approach...');
                const productsFound = await page.evaluate(() => {
                    const products = [];
                    document.querySelectorAll('*').forEach(el => {
                        // Look for elements containing both an image and price (₹)
                        if (el.querySelector('img') && 
                            el.textContent.includes('₹') &&
                            !products.includes(el) && 
                            !el.closest('header') && 
                            !el.closest('footer') &&
                            !el.closest('nav')) {
                            products.push(el);
                        }
                    });
                    return products.length;
                });
                console.log(`Found ${productsFound} potential products using heuristic approach`);
                productCount = productsFound;
            }

            // If still no products found, check if we're on the right page
            if (productCount === 0) {
                const pageContent = await page.content();
                if (pageContent.includes('Shopping Bag') || pageContent.includes('Your cart is empty')) {
                    throw new Error('Page appears to be a cart page instead of category page. The URL might be invalid or the page might be redirecting.');
                }
                
                // Check for common error messages
                const errorMessages = await page.evaluate(() => {
                    const errorSelectors = [
                        '.error-message',
                        '.no-products',
                        '.empty-state',
                        '[class*="error"]',
                        '[class*="empty"]'
                    ];
                    
                    for (const selector of errorSelectors) {
                        const element = document.querySelector(selector);
                        if (element && element.textContent.trim()) {
                            return element.textContent.trim();
                        }
                    }
                    return null;
                });
                
                if (errorMessages) {
                    throw new Error(`Page shows error message: ${errorMessages}`);
                }
                
                throw new Error('No products found on the page. The page structure might have changed or the URL might be invalid.');
            }

            // Scroll to trigger lazy loading
            console.log('Starting progressive scroll to trigger lazy loading...');
            await this.scrollPage(page);
            
            // Wait for any lazy-loaded images
            console.log('Waiting for images to load...');
            await page.waitForFunction(() => {
                const images = document.querySelectorAll('img');
                return Array.from(images).every(img => img.complete);
            }, { timeout: 10000 }).catch(() => console.log('Some images may not have loaded'));

            // Save the final HTML for debugging
            console.log('Saving debug HTML...');
            const html = await page.content();
            const debugDir = path.join(__dirname, '../scrspedhtml');
            if (!fs.existsSync(debugDir)) {
                fs.mkdirSync(debugDir, { recursive: true });
            }
            const debugFilePath = path.join(debugDir, 'ajio-debug.html');
            fs.writeFileSync(debugFilePath, html);
            console.log('Debug HTML saved to:', debugFilePath);

            // Take a screenshot for visual debugging
            const screenshotPath = path.join(debugDir, 'ajio-screenshot.png');
            await page.screenshot({ 
                path: screenshotPath, 
                fullPage: true 
            });
            console.log('Screenshot saved to:', screenshotPath);

            return html;

        } catch (error) {
            console.error('Puppeteer scraping error:', error);
            if (page) {
                try {
                    const errorHtml = await page.content();
                    const debugDir = path.join(__dirname, '../scrspedhtml');
                    if (!fs.existsSync(debugDir)) {
                        fs.mkdirSync(debugDir, { recursive: true });
                    }
                    const errorPath = path.join(debugDir, 'ajio-error.html');
                    fs.writeFileSync(errorPath, errorHtml);
                    console.log('Error state HTML saved to:', errorPath);
                    
                    // Take error screenshot
                    const errorScreenshot = path.join(debugDir, 'ajio-error.png');
                    await page.screenshot({ 
                        path: errorScreenshot, 
                        fullPage: true 
                    });
                    console.log('Error screenshot saved to:', errorScreenshot);
                } catch (e) {
                    console.error('Failed to save error debug files:', e);
                }
            }
            throw error;
        } finally {
            if (browser) {
                await browser.close();
            }
        }
    }

    async scrapeWithAxios(url) {
        try {
            const response = await axios.get(url, {
                headers: {
                    'User-Agent': this.userAgent,
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.5',
                    'Accept-Encoding': 'gzip, deflate, br',
                    'DNT': '1',
                    'Connection': 'keep-alive',
                    'Upgrade-Insecure-Requests': '1',
                },
                timeout: 30000
            });

            return response.data;

        } catch (error) {
            console.error('Axios scraping error:', error);
            throw error;
        }
    }

    async scrollPage(page) {
        try {
            console.log('Starting auto-scroll process...');
            
            // Scroll to bottom to load all products
            await page.evaluate(async () => {
                await new Promise((resolve) => {
                    let lastHeight = 0;
                    let unchangedCount = 0;
                    const distance = 200;
                    const maxUnchangedCount = 10; // If height doesn't change for this many iterations, we're done
                    
                    const timer = setInterval(() => {
                        const scrollHeight = document.body.scrollHeight;
                        window.scrollBy(0, distance);
                        
                        // Check if the height has changed
                        if (lastHeight === scrollHeight) {
                            unchangedCount++;
                            if (unchangedCount >= maxUnchangedCount) {
                                clearInterval(timer);
                                resolve();
                            }
                        } else {
                            unchangedCount = 0;
                            lastHeight = scrollHeight;
                        }
                    }, 200); // Slightly slower scroll for better loading
                });
            });

            // Wait for any lazy-loaded images
            console.log('Waiting for lazy-loaded content...');
            await page.waitForTimeout(5000);

        } catch (error) {
            console.error('Error scrolling page:', error);
        }
    }

    extractProducts($) {
        const products = [];
        
        // Find product containers - Ajio uses various selectors
        const productSelectors = [
            '.rilrtl-products-list-item',
            '.item',
            '.items .item',
            '.product-grid .item',
            '.product-list .item',
            '[data-test="product-card"]',
            '.preview-image',
            '.products-list li',
            '.grid-item',
            '.product-item'
        ];

        let productElements = $();
        
        for (const selector of productSelectors) {
            productElements = $(selector);
            if (productElements.length > 0) {
                console.log(`Found ${productElements.length} products using selector: ${selector}`);
                break;
            }
        }

        if (productElements.length === 0) {
            console.log('No products found with standard selectors, trying alternative approach...');
            // Try to find any element that looks like a product
            productElements = $('*[class*="item"]').filter(function() {
                return $(this).find('img').length > 0 && 
                       ($(this).find('*[class*="price"]').length > 0 || 
                        $(this).text().includes('₹'));
            });
        }

        if (productElements.length === 0) {
            console.log('Still no products found, trying broader search...');
            // Last resort: find any element with image and price text
            productElements = $('*').filter(function() {
                const $el = $(this);
                return $el.find('img').length > 0 && 
                       $el.text().includes('₹') &&
                       !$el.closest('header').length &&
                       !$el.closest('footer').length &&
                       !$el.closest('nav').length;
            });
        }

        console.log(`Processing ${productElements.length} potential product elements...`);

        productElements.each((index, element) => {
            try {
                const product = this.extractProductData($, $(element));
                if (product && product.title && product.sellingPrice) {
                    products.push(product);
                }
            } catch (error) {
                console.error(`Error extracting product ${index}:`, error);
            }
        });

        console.log(`Successfully extracted ${products.length} products`);
        return products;
    }

    extractProductData($, productElement) {
        try {
            const product = {};
            
            // Log the HTML of the product element for debugging
            console.log('Processing product element:', productElement.html().substring(0, 200) + '...');

            // Extract product title
            const titleSelectors = [
                '.nameCls',
                '.product-name',
                '.brand + .nameCls',
                '[aria-label*="Product image of"]',
                'h3',
                'h4',
                '.title',
                '.brand-name',
                '.name',
                'img[title]',
                '[data-test="name"]',
                '.product-title',
                '.item-title'
            ];

            for (const selector of titleSelectors) {
                const titleElement = productElement.find(selector);
                if (titleElement.length > 0) {
                    product.title = titleElement.text().trim();
                    break;
                }
            }

            // If no title found, try to get from img alt
            if (!product.title) {
                const imgAlt = productElement.find('img').attr('alt');
                if (imgAlt && imgAlt.includes('Product image of')) {
                    product.title = imgAlt.replace('Product image of ', '').trim();
                }
            }

            // If still no title, try to extract from any text that looks like a product name
            if (!product.title) {
                const allText = productElement.text();
                const lines = allText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
                // Look for the longest line that doesn't contain price symbols or common UI text
                for (const line of lines) {
                    if (line.length > 10 && 
                        !line.includes('₹') && 
                        !line.includes('OFF') && 
                        !line.includes('Add to') &&
                        !line.includes('Wishlist') &&
                        !line.includes('Quick View')) {
                        product.title = line;
                        break;
                    }
                }
            }

            // Extract brand
            const brandSelectors = [
                '.brand',
                '.brand strong',
                '.product-brand'
            ];

            for (const selector of brandSelectors) {
                const brandElement = productElement.find(selector);
                if (brandElement.length > 0) {
                    product.brand = brandElement.text().trim();
                    break;
                }
            }

            // Extract selling price
            const sellingPriceSelectors = [
                '.price strong',
                '.current-price',
                '.selling-price',
                '.price',
                '.net-price',
                '.final-price',
                '[class*="price"]'
            ];

            for (const selector of sellingPriceSelectors) {
                const priceElement = productElement.find(selector);
                if (priceElement.length > 0) {
                    const priceText = priceElement.text().trim();
                    const priceMatch = priceText.match(/₹[\d,]+/);
                    if (priceMatch) {
                        product.sellingPrice = priceMatch[0];
                        break;
                    }
                }
            }

            // If no price found with selectors, search in all text
            if (!product.sellingPrice) {
                const allText = productElement.text();
                const priceMatches = allText.match(/₹[\d,]+/g);
                if (priceMatches && priceMatches.length > 0) {
                    // Take the first price found (usually the selling price)
                    product.sellingPrice = priceMatches[0];
                }
            }

            // Extract original price (MRP)
            const originalPriceSelectors = [
                '.original-price',
                '.mrp',
                '.strike',
                's',
                '.crossed-price'
            ];

            for (const selector of originalPriceSelectors) {
                const originalPriceElement = productElement.find(selector);
                if (originalPriceElement.length > 0) {
                    const priceText = originalPriceElement.text().trim();
                    const priceMatch = priceText.match(/₹[\d,]+/);
                    if (priceMatch) {
                        product.originalPrice = priceMatch[0];
                        break;
                    }
                }
            }

            // Extract discount
            if (product.sellingPrice && product.originalPrice) {
                const sellingPriceNum = parseFloat(product.sellingPrice.replace(/[₹,]/g, ''));
                const originalPriceNum = parseFloat(product.originalPrice.replace(/[₹,]/g, ''));
                
                if (originalPriceNum > sellingPriceNum) {
                    const discountAmount = originalPriceNum - sellingPriceNum;
                    const discountPercentage = Math.round((discountAmount / originalPriceNum) * 100);
                    product.discount = `${discountPercentage}% OFF`;
                    product.discountAmount = `₹${discountAmount.toLocaleString()}`;
                }
            }

            // Try to extract discount from text
            if (!product.discount) {
                const discountText = productElement.text();
                const discountMatch = discountText.match(/(\d+)%\s*off/i);
                if (discountMatch) {
                    product.discount = `${discountMatch[1]}% OFF`;
                }
            }

            // Extract rating
            const ratingSelectors = [
                '.rating',
                '[class*="rating"]',
                '.stars',
                '[aria-label*="star rating"]'
            ];

            for (const selector of ratingSelectors) {
                const ratingElement = productElement.find(selector);
                if (ratingElement.length > 0) {
                    const ratingText = ratingElement.text().trim();
                    const ratingMatch = ratingText.match(/(\d+\.?\d*)/);
                    if (ratingMatch) {
                        product.rating = parseFloat(ratingMatch[1]);
                        break;
                    }
                    
                    // Try to get from aria-label
                    const ariaLabel = ratingElement.attr('aria-label');
                    if (ariaLabel) {
                        const ariaRatingMatch = ariaLabel.match(/(\d+\.?\d*)\s*star/);
                        if (ariaRatingMatch) {
                            product.rating = parseFloat(ariaRatingMatch[1]);
                            break;
                        }
                    }
                }
            }

            // Extract product image
            const imgElement = productElement.find('img').first();
            if (imgElement.length > 0) {
                product.imageUrl = imgElement.attr('src') || imgElement.attr('data-src');
                
                if (product.imageUrl && !product.imageUrl.startsWith('http')) {
                    product.imageUrl = this.baseUrl + product.imageUrl;
                }
            }

            // Extract product URL
            const linkElement = productElement.find('a').first();
            if (linkElement.length > 0) {
                product.productUrl = linkElement.attr('href');
                
                if (product.productUrl && !product.productUrl.startsWith('http')) {
                    product.productUrl = this.baseUrl + product.productUrl;
                }
            }

            // Extract product ID from URL or data attributes
            if (product.productUrl) {
                const idMatch = product.productUrl.match(/\/(\d+)/);
                if (idMatch) {
                    product.productId = idMatch[1];
                }
            }

            // Extract additional attributes from data attributes
            const dataTest = productElement.attr('data-test');
            if (dataTest) {
                product.dataTest = dataTest;
            }

            // Clean up the data
            Object.keys(product).forEach(key => {
                if (typeof product[key] === 'string') {
                    product[key] = product[key].trim();
                }
            });

            return product;

        } catch (error) {
            console.error('Error extracting product data:', error);
            return null;
        }
    }

    extractCategoryInfo($, url) {
        try {
            const category = {};
            
            // Extract category title
            const categoryTitleSelectors = [
                'h1',
                '.category-title',
                '.page-title',
                'title'
            ];

            for (const selector of categoryTitleSelectors) {
                const titleElement = $(selector);
                if (titleElement.length > 0) {
                    category.title = titleElement.text().trim();
                    break;
                }
            }

            // Extract breadcrumb
            const breadcrumbSelectors = [
                '.breadcrumb',
                '.breadcrumbs',
                '[aria-label="Breadcrumb"]'
            ];

            for (const selector of breadcrumbSelectors) {
                const breadcrumbElement = $(selector);
                if (breadcrumbElement.length > 0) {
                    category.breadcrumb = breadcrumbElement.text().trim();
                    break;
                }
            }

            // Extract filters applied
            const filterElements = $('.filter, .applied-filter');
            if (filterElements.length > 0) {
                category.appliedFilters = filterElements.map((i, el) => $(el).text().trim()).get();
            }

            return category;

        } catch (error) {
            console.error('Error extracting category info:', error);
            return {};
        }
    }

    extractPaginationInfo($) {
        try {
            const pagination = {};
            
            // Extract total pages
            const paginationSelectors = [
                '.pagination',
                '.page-numbers',
                '[data-test="pagination"]'
            ];

            for (const selector of paginationSelectors) {
                const paginationElement = $(selector);
                if (paginationElement.length > 0) {
                    const pageLinks = paginationElement.find('a, button');
                    pagination.totalPages = pageLinks.length;
                    break;
                }
            }

            // Extract current page
            const currentPageElement = $('.pagination .active, .current-page');
            if (currentPageElement.length > 0) {
                pagination.currentPage = parseInt(currentPageElement.text().trim());
            }

            return pagination;

        } catch (error) {
            console.error('Error extracting pagination info:', error);
            return {};
        }
    }
}

module.exports = new AjioCategoriesScraper();
