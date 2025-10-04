# The Body Shop Category Scraping API Documentation

## **Overview**
This API provides comprehensive scraping functionality for [The Body Shop India](https://www.thebodyshop.in/) category pages, extracting product data from beauty, skincare, haircare, bath & body, makeup, and fragrance categories. Based on the website structure and product offerings, it extracts detailed product information including pricing, discounts, images, ratings, and product details.

## **Features**
- ✅ **Category Page Scraping**: Extract products from The Body Shop category pages
- ✅ **Dual Fetching Methods**: Both Puppeteer (dynamic content) and Axios (static content)
- ✅ **Comprehensive Product Data**: Name, brand, pricing, images, URLs, ratings
- ✅ **Data Validation**: Input validation and error handling
- ✅ **File Storage**: Automatic JSON file saving with timestamps
- ✅ **Search Functionality**: Search products within categories
- ✅ **Category Management**: Get popular categories and subcategories

---

## **🚀 API Endpoints**

### **Base URL**: `/api/thebodyshop-category`

---

### **1. Scrape Category Page**
**Endpoint**: `POST /api/thebodyshop-category/scrape-category`

**Description**: Scrape products from a The Body Shop category page.

**Request Body**:
```json
{
  "url": "https://www.thebodyshop.in/bath-body",
  "usePuppeteer": true
}
```

**Response**:
```json
{
  "success": true,
  "message": "Category scraped successfully",
  "data": {
    "url": "https://www.thebodyshop.in/bath-body",
    "scrapedAt": "2025-01-09T10:30:00.000Z",
    "source": "The Body Shop India",
    "category": "Bath & Body",
    "categoryTitle": "Bath & Body Products",
    "breadcrumbs": [
      {"name": "Home", "url": "https://www.thebodyshop.in/"},
      {"name": "Bath & Body", "url": "https://www.thebodyshop.in/bath-body"}
    ],
    "totalProducts": 25,
    "products": [
      {
        "productId": "1234567",
        "productName": "British Rose Body Butter",
        "brand": "The Body Shop",
        "sellingPrice": "₹995",
        "actualPrice": "₹1,195",
        "discount": "17% Off",
        "discountAmount": "₹200",
        "productImage": "https://images-static.thebodyshop.in/...",
        "productUrl": "https://www.thebodyshop.in/british-rose-body-butter/p/1234567",
        "rating": 4.5,
        "reviewCount": 1250,
        "availability": "Available",
        "category": "Bath & Body",
        "subCategory": "Body Butters",
        "description": "Indulge in the delicate fragrance of British Rose...",
        "ingredients": ["Rose Water", "Shea Butter", "Cocoa Butter"],
        "offers": ["Free shipping on orders above ₹999"],
        "scrapedAt": "2025-01-09T10:30:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "hasNext": true,
      "hasPrev": false
    }
  },
  "savedTo": "thebodyshop-category-2025-01-09T10-30-00-000Z.json",
  "timestamp": "2025-01-09T10:30:00.000Z"
}
```

---

### **2. Get Category Data (GET)**
**Endpoint**: `GET /api/thebodyshop-category/category`

**Description**: Get category data by URL using query parameters.

**Query Parameters**:
- `url` (required): The Body Shop category URL
- `usePuppeteer` (optional): Use Puppeteer for dynamic content (default: true)

**Example**:
```
GET /api/thebodyshop-category/category?url=https://www.thebodyshop.in/face-skincare&usePuppeteer=true
```

**Response**: Same as POST endpoint above.

---

### **3. Search Products**
**Endpoint**: `GET /api/thebodyshop-category/search`

**Description**: Search for products within The Body Shop categories.

**Query Parameters**:
- `q` (required): Search query
- `category` (optional): Category filter
- `limit` (optional): Number of results (default: 20)

**Example**:
```
GET /api/thebodyshop-category/search?q=body butter&category=bath-body&limit=10
```

**Response**:
```json
{
  "success": true,
  "message": "Found 10 products for \"body butter\"",
  "query": "body butter",
  "category": "bath-body",
  "limit": 10,
  "results": [
    {
      "productId": "1234567",
      "productName": "British Rose Body Butter",
      "brand": "The Body Shop",
      "sellingPrice": "₹995",
      "productImage": "https://images-static.thebodyshop.in/...",
      "productUrl": "https://www.thebodyshop.in/british-rose-body-butter/p/1234567"
    }
  ],
  "timestamp": "2025-01-09T10:30:00.000Z"
}
```

---

### **4. Get Popular Categories**
**Endpoint**: `GET /api/thebodyshop-category/categories`

**Description**: Get list of popular categories and their subcategories.

**Response**:
```json
{
  "success": true,
  "message": "Categories retrieved successfully",
  "categories": [
    {
      "id": "bath-body",
      "name": "Bath & Body",
      "url": "https://www.thebodyshop.in/bath-body",
      "subcategories": [
        "Body Butters", "Body Lotions", "Shower Gels", "Soaps", "Body Scrubs", "Deodorants"
      ]
    },
    {
      "id": "face-skincare",
      "name": "Face & Skincare",
      "url": "https://www.thebodyshop.in/face-skincare",
      "subcategories": [
        "Moisturisers", "Cleansers & Toners", "Face Masks", "Serums & Essences", "Eye Care"
      ]
    },
    {
      "id": "hair",
      "name": "Hair",
      "url": "https://www.thebodyshop.in/hair",
      "subcategories": [
        "Shampoo", "Conditioner", "Hair Styling", "Hair Brushes and Combs"
      ]
    },
    {
      "id": "makeup",
      "name": "Makeup",
      "url": "https://www.thebodyshop.in/makeup",
      "subcategories": [
        "Lips", "Mascara", "Foundations & Concealers", "Eye Shadow", "Makeup Brushes"
      ]
    },
    {
      "id": "fragrance",
      "name": "Fragrance",
      "url": "https://www.thebodyshop.in/fragrance",
      "subcategories": [
        "Body Mists", "Eau De Toilette", "Eau De Parfum", "Fragrance Gifts"
      ]
    }
  ],
  "count": 5,
  "timestamp": "2025-01-09T10:30:00.000Z"
}
```

---

### **5. Scraper Management Endpoints**

#### **Get Scraper Status**
**Endpoint**: `GET /api/thebodyshop-category/status`

**Response**:
```json
{
  "success": true,
  "message": "The Body Shop scraper status",
  "initialized": true,
  "timestamp": "2025-01-09T10:30:00.000Z"
}
```

#### **Initialize Scraper**
**Endpoint**: `POST /api/thebodyshop-category/init`

#### **Cleanup Scraper**
**Endpoint**: `POST /api/thebodyshop-category/cleanup`

---

### **6. File Management Endpoints**

#### **Get All Scraped Files**
**Endpoint**: `GET /api/thebodyshop-category/files`

#### **Get Specific File**
**Endpoint**: `GET /api/thebodyshop-category/files/:filename`

#### **Delete File**
**Endpoint**: `DELETE /api/thebodyshop-category/files/:filename`

---

### **7. Health Check**
**Endpoint**: `GET /api/thebodyshop-category/health`

**Response**:
```json
{
  "status": "OK",
  "service": "The Body Shop Category Scraper",
  "timestamp": "2025-01-09T10:30:00.000Z",
  "version": "1.0.0"
}
```

---

### **8. API Documentation**
**Endpoint**: `GET /api/thebodyshop-category/docs`

**Response**: Complete API documentation in JSON format.

---

## **📊 Product Data Structure**

The API extracts comprehensive product information with the following structure:

```json
{
  "product": {
    "productId": "Product ID",
    "productName": "Product name/title",
    "brand": "The Body Shop",
    "sellingPrice": "Current selling price (₹995)",
    "actualPrice": "Original/MRP price (₹1,195)",
    "discount": "Discount percentage (17% Off)",
    "discountAmount": "Discount amount (₹200)",
    "productImage": "Product image URL",
    "productUrl": "Product page URL",
    "rating": "Product rating (4.5)",
    "reviewCount": "Number of reviews (1250)",
    "availability": "Stock availability",
    "category": "Product category",
    "subCategory": "Product subcategory",
    "description": "Product description",
    "ingredients": ["Ingredient 1", "Ingredient 2"],
    "offers": ["Special offer 1", "Special offer 2"],
    "scrapedAt": "Timestamp when scraped"
  }
}
```

---

## **🔧 Technical Features**

### **Scraping Technology**
- **Puppeteer**: Headless browser automation for dynamic content
- **Axios**: HTTP client for static content scraping
- **Cheerio**: Fast HTML parsing and DOM manipulation
- **Anti-Bot Protection**: Proper headers and user agents
- **Error Handling**: Comprehensive error handling and validation

### **Data Extraction**
- **Product Information**: Name, brand, pricing, images, URLs
- **Reviews & Ratings**: Customer feedback and ratings
- **Product Details**: Description, ingredients, categories
- **Pricing**: Current price, MRP, discount calculations
- **Availability**: Stock status and offers

### **File Management**
- **Automatic Saving**: All scraped data saved as JSON files
- **Timestamped Files**: Unique filenames with timestamps
- **File Operations**: List, retrieve, and delete scraped files

---

## **🚀 Usage Examples**

### **cURL Examples**

```bash
# Scrape category page
curl -X POST http://localhost:3333/api/thebodyshop-category/scrape-category \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.thebodyshop.in/bath-body", "usePuppeteer": true}'

# Get category data
curl "http://localhost:3333/api/thebodyshop-category/category?url=https://www.thebodyshop.in/face-skincare"

# Search products
curl "http://localhost:3333/api/thebodyshop-category/search?q=body butter&limit=10"

# Get categories
curl "http://localhost:3333/api/thebodyshop-category/categories"

# Get scraper status
curl "http://localhost:3333/api/thebodyshop-category/status"
```

### **JavaScript Examples**

```javascript
// Scrape category page
const response = await fetch('http://localhost:3333/api/thebodyshop-category/scrape-category', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    url: 'https://www.thebodyshop.in/bath-body',
    usePuppeteer: true
  })
});

const data = await response.json();
console.log(data);

// Search products
const searchResponse = await fetch('http://localhost:3333/api/thebodyshop-category/search?q=body butter&limit=10');
const searchData = await searchResponse.json();
console.log(searchData);
```

---

## **🎯 Popular Categories**

Based on [The Body Shop India website](https://www.thebodyshop.in/), the API supports these popular categories:

### **Bath & Body**
- Body Butters, Body Lotions, Shower Gels, Soaps, Body Scrubs, Deodorants

### **Face & Skincare**
- Moisturisers, Cleansers & Toners, Face Masks, Serums & Essences, Eye Care

### **Hair**
- Shampoo, Conditioner, Hair Styling, Hair Brushes and Combs

### **Makeup**
- Lips, Mascara, Foundations & Concealers, Eye Shadow, Makeup Brushes

### **Fragrance**
- Body Mists, Eau De Toilette, Eau De Parfum, Fragrance Gifts

---

## **⚠️ Error Handling**

The API provides comprehensive error handling with detailed error messages:

```json
{
  "success": false,
  "error": "Invalid URL",
  "message": "Please provide a valid The Body Shop category URL",
  "timestamp": "2025-01-09T10:30:00.000Z"
}
```

**Common Error Scenarios**:
- Invalid or missing URL
- Network timeouts
- Category not found
- Scraper initialization failures
- File system errors

---

## **🔒 Security & Rate Limiting**

- **Input Validation**: All inputs are validated before processing
- **URL Validation**: Ensures only valid The Body Shop URLs are processed
- **Error Logging**: Comprehensive error logging for debugging
- **Resource Management**: Proper cleanup of browser instances

---

## **📈 Performance**

- **Efficient Scraping**: Optimized selectors and parsing
- **Batch Processing**: Support for multiple category scraping
- **Caching**: Automatic file saving for data persistence
- **Resource Optimization**: Proper browser instance management

---

## **🔄 Integration**

The The Body Shop Category API is fully integrated with your existing scraping infrastructure and follows the same patterns as other scrapers in the project.

**Base URL**: `http://localhost:3333/api/thebodyshop-category`

**Available Endpoints**: 12 comprehensive endpoints for all scraping needs

**Data Format**: Consistent JSON structure across all endpoints

---

## **🧪 Testing**

Run the test script to verify the API functionality:

```bash
node test-thebodyshop-category-api.js
```

This will test all endpoints and provide detailed feedback on functionality.

---

This The Body Shop Category API provides everything you need to scrape product data from The Body Shop India efficiently and reliably! 🚀
