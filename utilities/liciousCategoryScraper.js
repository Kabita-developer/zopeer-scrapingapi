const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const path = require('path');
const fs = require('fs');

class LiciousCategoryScraper {
    constructor() {
        this.baseUrl = 'https://www.licious.in';
        this.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36';
    }

    async scrapeCategory(url) {
        let browser;
        let page;
        try {
            console.log('Starting Licious category scraping for:', url);
            browser = await this.initializeBrowser();
            page = await this.setupPage(browser);
            const html = await this.fetchPageContent(page, url);
            const products = await this.extractProducts(html);

            return {
                url: url,
                scrapedAt: new Date().toISOString(),
                totalProducts: products.length,
                products: products
            };
        } catch (error) {
            console.error('Error scraping Licious category:', error);
            throw error;
        } finally {
            if (browser) await browser.close();
        }
    }

    async initializeBrowser() {
        return await puppeteer.launch({
            headless: 'new',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--ignore-certificate-errors',
                '--disable-web-security',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--disable-gpu',
                '--window-size=1920,1080',
                '--disable-infobars',
                '--disable-notifications',
                '--no-first-run',
                '--disable-extensions'
            ]
        });
    }

    async setupPage(browser) {
        const page = await browser.newPage();
        
        await page.setViewport({ 
            width: 1920, 
            height: 1080,
            deviceScaleFactor: 1
        });

        await page.setUserAgent(this.userAgent);
        
        await page.setExtraHTTPHeaders({
            'Accept-Language': 'en-GB,en-US;q=0.9,en;q=0.8',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
            'sec-ch-ua': '"Chromium";v="121", "Google Chrome";v="121"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"Windows"',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Sec-Fetch-User': '?1',
            'Upgrade-Insecure-Requests': '1'
        });

        return page;
    }

    async fetchPageContent(page, url) {
        console.log('Navigating to URL with extended timeout:', url);
        
        await page.goto(url, { 
            waitUntil: ['networkidle0', 'domcontentloaded', 'load'],
            timeout: 90000
        });

        // Handle any initial popups or overlays
        const overlaySelectors = [
            '[class*="popup"]',
            '[class*="modal"]',
            '[class*="overlay"]',
            'button[class*="close"]',
            '[aria-label*="close"]'
        ];

        for (const selector of overlaySelectors) {
            try {
                const elements = await page.$$(selector);
                for (const element of elements) {
                    if (await element.isVisible()) {
                        await element.click().catch(() => {});
                        console.log(`Closed overlay with selector: ${selector}`);
                        await page.waitForTimeout(500);
                    }
                }
            } catch (e) {}
        }

        // Wait for product elements
        const productSelectors = [
            '.product-card',
            '.product-item',
            '[data-test="product-card"]',
            '[class*="ProductCard"]',
            '[class*="product-tile"]',
            '.item-product'
        ];

        console.log('Waiting for product elements...');
        let foundSelector = null;

        for (const selector of productSelectors) {
            try {
                await page.waitForSelector(selector, { 
                    timeout: 10000,
                    visible: true 
                });
                console.log(`Found products with selector: ${selector}`);
                foundSelector = selector;
                break;
            } catch (e) {
                console.log(`Selector ${selector} not found`);
            }
        }

        if (!foundSelector) {
            console.log('No standard selectors found, trying alternative approach...');
            await page.waitForFunction(() => {
                const elements = document.querySelectorAll('*');
                return Array.from(elements).some(el => 
                    el.textContent.includes('₹') && 
                    el.querySelector('img') &&
                    !el.closest('header') &&
                    !el.closest('footer')
                );
            }, { timeout: 15000 }).catch(e => console.log('Alternative detection timeout'));
        }

        await this.autoScroll(page);

        const html = await page.content();
        await this.saveDebugFiles(html, page);

        return html;
    }

    async autoScroll(page) {
        console.log('Starting progressive scroll to load all content...');
        
        await page.evaluate(async () => {
            await new Promise((resolve) => {
                let lastHeight = 0;
                let unchangedCount = 0;
                const maxUnchangedCount = 5;
                
                const timer = setInterval(() => {
                    const scrollHeight = document.body.scrollHeight;
                    const viewportHeight = window.innerHeight;
                    
                    window.scrollBy(0, viewportHeight / 2);
                    
                    if (scrollHeight === lastHeight) {
                        unchangedCount++;
                        if (unchangedCount >= maxUnchangedCount) {
                            clearInterval(timer);
                            resolve();
                        }
                    } else {
                        unchangedCount = 0;
                        lastHeight = scrollHeight;
                    }
                }, 500);
            });
        });
        
        console.log('Waiting for lazy-loaded content...');
        await page.waitForFunction(() => {
            const images = document.querySelectorAll('img');
            return Array.from(images).every(img => img.complete);
        }, { timeout: 10000 }).catch(() => console.log('Some images may not have loaded'));
        
        await page.waitForTimeout(3000);
    }

    async extractProducts(html) {
        const $ = cheerio.load(html);
        const products = [];

        await this.saveHtmlToFile(html);

        const productCards = $('.product-card, .product-item, [data-test="product-card"]');

        productCards.each((_, element) => {
            try {
                const card = $(element);
                const product = this.extractProductData($, card);
                if (product.title && product.sellingPrice) {
                    products.push(product);
                }
            } catch (error) {
                console.error('Error extracting product data:', error);
            }
        });

        return products;
    }

    extractProductData($, card) {
        const product = {};

        try {
            product.title = card.find('.product-name, .title, h3, h2').first().text().trim();

            const priceElement = card.find('.price, .product-price');
            product.sellingPrice = this.extractPrice(priceElement.find('.discounted-price, .selling-price').text());
            product.actualPrice = this.extractPrice(priceElement.find('.original-price, .actual-price').text());

            const discountText = card.find('.discount, .offer-tag').text().trim();
            product.discount = discountText || null;

            const ratingText = card.find('.rating, .product-rating').text().trim();
            product.rating = ratingText ? parseFloat(ratingText) : null;

            const img = card.find('img').first();
            product.imageUrl = img.attr('src') || img.attr('data-src');

            const link = card.find('a').first();
            product.productUrl = new URL(link.attr('href'), this.baseUrl).toString();

        } catch (error) {
            console.error('Error extracting product fields:', error);
        }

        return product;
    }

    extractPrice(priceStr) {
        if (!priceStr) return null;
        const matches = priceStr.match(/\d+(\.\d+)?/);
        return matches ? parseFloat(matches[0]) : null;
    }

    async saveDebugFiles(html, page) {
        try {
            const debugDir = path.join(__dirname, '../scrspedhtml');
            if (!fs.existsSync(debugDir)) {
                fs.mkdirSync(debugDir, { recursive: true });
            }

            fs.writeFileSync(
                path.join(debugDir, 'liciousCategoried.html'),
                html
            );

            await page.screenshot({
                path: path.join(debugDir, 'licious-screenshot.png'),
                fullPage: true
            });
        } catch (error) {
            console.error('Error saving debug files:', error);
        }
    }

    saveHtmlToFile(html) {
        try {
            const debugDir = path.join(__dirname, '../scrspedhtml');
            if (!fs.existsSync(debugDir)) {
                fs.mkdirSync(debugDir, { recursive: true });
            }
            fs.writeFileSync(path.join(debugDir, 'liciousCategoried.html'), html);
        } catch (error) {
            console.error('Error saving HTML file:', error);
        }
    }
}

module.exports = new LiciousCategoryScraper();