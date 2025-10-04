# Licious Categories API Documentation

## Overview
This API provides endpoints to scrape product data from Licious category pages. It allows you to extract detailed product information including prices, ratings, discounts, and more from any Licious category page.

## Base URL
```
http://localhost:3333/api/licious-categories
```

## Endpoints

### 1. Scrape Category Products
Scrapes all products from a specified Licious category page.

#### Request
- **URL**: `/scrape-category`
- **Method**: `POST`
- **Content-Type**: `application/json`

#### Request Body
```json
{
  "url": "https://www.licious.in/seafood"
}
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| url | string | Yes | The full URL of the Licious category page to scrape. Must be from licious.in domain. |

#### Success Response
- **Status Code**: 200 OK
- **Content Type**: `application/json`

```json
{
  "success": true,
  "message": "Licious categories scraped successfully",
  "data": {
    "url": "https://www.licious.in/seafood",
    "scrapedAt": "2025-10-04T12:00:00.000Z",
    "totalProducts": 25,
    "products": [
      {
        "title": "Freshwater Prawns - Small",
        "sellingPrice": 299,
        "actualPrice": 399,
        "discount": "25% OFF",
        "rating": 4.5,
        "imageUrl": "https://example.com/image.jpg",
        "productUrl": "https://www.licious.in/product/freshwater-prawns"
      }
      // ... more products
    ]
  },
  "totalProducts": 25,
  "savedTo": "licious-categories-2025-10-04T12-00-00-000Z.json"
}
```

#### Product Object Structure

| Field | Type | Description |
|-------|------|-------------|
| title | string | Name of the product |
| sellingPrice | number | Current selling price |
| actualPrice | number | Original price before discount |
| discount | string | Discount percentage or offer text (null if no discount) |
| rating | number | Product rating (null if no rating) |
| imageUrl | string | URL of the product image |
| productUrl | string | URL of the product detail page |

#### Error Responses

1. **Invalid URL**
   - **Status Code**: 400 Bad Request
   ```json
   {
     "success": false,
     "message": "URL is required"
   }
   ```

2. **Invalid Domain**
   - **Status Code**: 400 Bad Request
   ```json
   {
     "success": false,
     "message": "URL must be from licious.in domain"
   }
   ```

3. **No Products Found**
   - **Status Code**: 404 Not Found
   ```json
   {
     "success": false,
     "message": "No products found on the page"
   }
   ```

4. **Scraping Error**
   - **Status Code**: 500 Internal Server Error
   ```json
   {
     "success": false,
     "message": "Error scraping Licious categories",
     "error": "Error details..."
   }
   ```

### 2. Test Scraping
Tests the scraping functionality using a predefined seafood category URL.

#### Request
- **URL**: `/test-scrape`
- **Method**: `GET`

#### Success Response
Same structure as the main scraping endpoint.

## Data Storage

1. **JSON Data**
   - Scraped data is saved in JSON format
   - Location: `/scraped_data/licious-categories-{timestamp}.json`
   - Format: Full response object including all products and metadata

2. **Debug HTML**
   - Raw HTML content is saved for debugging
   - Location: `/scrspedhtml/liciousCategoried.html`
   - Screenshots: `/scrspedhtml/licious-screenshot.png`

## Example Usage

### Using cURL
```bash
curl -X POST http://localhost:3333/api/licious-categories/scrape-category \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.licious.in/seafood"}'
```

### Using JavaScript/Node.js
```javascript
const response = await fetch('http://localhost:3333/api/licious-categories/scrape-category', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    url: 'https://www.licious.in/seafood'
  })
});

const data = await response.json();
```

## Notes and Limitations

1. **Rate Limiting**
   - Implement reasonable delays between requests
   - Respect Licious.in's robots.txt and terms of service

2. **Data Accuracy**
   - Prices and availability may change frequently
   - Some products might be out of stock or unavailable

3. **Performance**
   - Response time varies based on:
     - Number of products in category
     - Network conditions
     - Server load

4. **Maintenance**
   - The scraper may need updates if Licious changes their website structure
   - Regular testing is recommended

## Support
For issues or questions, please contact the development team or raise an issue in the repository.

## Version History
- **1.0.0** (October 2025)
  - Initial release
  - Basic category scraping functionality
  - Product data extraction
  - Debug features