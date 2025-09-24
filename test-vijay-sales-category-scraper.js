const VijaySalesCategoryScraper = require('./utilities/vijaySalesCategoryScraper');

async function testVijaySalesCategoryScraper() {
  const scraper = new VijaySalesCategoryScraper();
  
  try {
    console.log('🚀 Starting Vijay Sales Category Scraper Test...\n');
    
    // Test URL from the user's request
    const testUrl = 'https://www.vijaysales.com/c/home-appliances?PRICE=499.00to47561.00&SORT=Popular';
    
    console.log('📋 Test URL:', testUrl);
    console.log('⏳ Scraping category page...\n');
    
    // Test category page scraping
    const categoryData = await scraper.scrapeCategoryPage(testUrl);
    
    console.log('✅ Category Scraping Results:');
    console.log(`   📂 Category Name: ${categoryData.categoryName}`);
    console.log(`   🔗 Category URL: ${categoryData.categoryUrl}`);
    console.log(`   📦 Total Products: ${categoryData.totalProducts}`);
    console.log(`   🍞 Breadcrumbs: ${categoryData.breadcrumbs ? categoryData.breadcrumbs.length : 0} items`);
    
    if (categoryData.breadcrumbs && categoryData.breadcrumbs.length > 0) {
      console.log('\n🍞 Breadcrumb Navigation:');
      categoryData.breadcrumbs.forEach((breadcrumb, index) => {
        console.log(`   ${index + 1}. ${breadcrumb.name} ${breadcrumb.url ? `(${breadcrumb.url})` : ''}`);
      });
    }
    
    if (categoryData.products && categoryData.products.length > 0) {
      console.log('\n🛍️ Sample Product Data:');
      const sampleProduct = categoryData.products[0];
      console.log(`   🆔 Product ID: ${sampleProduct.productId}`);
      console.log(`   📝 Name: ${sampleProduct.productName}`);
      console.log(`   🏢 Brand: ${sampleProduct.brand}`);
      console.log(`   💰 Selling Price: ${sampleProduct.sellingPrice}`);
      console.log(`   💸 Actual Price: ${sampleProduct.actualPrice}`);
      console.log(`   🎯 Discount: ${sampleProduct.discount}`);
      console.log(`   💵 Discount Amount: ${sampleProduct.discountAmount}`);
      console.log(`   🖼️  Image: ${sampleProduct.productImage}`);
      console.log(`   🔗 URL: ${sampleProduct.productUrl}`);
      console.log(`   ⭐ Rating: ${sampleProduct.rating}`);
      console.log(`   📊 Reviews: ${sampleProduct.reviewCount}`);
      console.log(`   📦 Availability: ${sampleProduct.availability}`);
      console.log(`   🏷️  Category: ${sampleProduct.category}`);
      console.log(`   🏷️  Sub Category: ${sampleProduct.subCategory}`);
      
      if (sampleProduct.offers && sampleProduct.offers.length > 0) {
        console.log(`   🎁 Offers: ${sampleProduct.offers.join(', ')}`);
      }
    }
    
    // Show product statistics
    if (categoryData.products && categoryData.products.length > 0) {
      const products = categoryData.products;
      const withDiscountCount = products.filter(p => p.discount && p.discount !== '').length;
      const withRatingCount = products.filter(p => p.rating && p.rating > 0).length;
      const withOffersCount = products.filter(p => p.offers && p.offers.length > 0).length;
      const availableCount = products.filter(p => p.availability === 'Available' || p.availability === 'In Stock').length;
      
      console.log('\n📊 Product Statistics:');
      console.log(`   🎯 Products with Discount: ${withDiscountCount}`);
      console.log(`   ⭐ Products with Rating: ${withRatingCount}`);
      console.log(`   🎁 Products with Offers: ${withOffersCount}`);
      console.log(`   📦 Available Products: ${availableCount}`);
      
      // Show price range
      const prices = products.filter(p => p.sellingPrice).map(p => {
        const priceStr = p.sellingPrice.replace(/[₹,]/g, '');
        return parseFloat(priceStr);
      }).filter(price => !isNaN(price));
      
      if (prices.length > 0) {
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
        
        console.log(`   💰 Price Range: ₹${minPrice.toLocaleString('en-IN')} - ₹${maxPrice.toLocaleString('en-IN')}`);
        console.log(`   💰 Average Price: ₹${avgPrice.toLocaleString('en-IN')}`);
      }
      
      // Show discount statistics
      const discounts = products.filter(p => p.discount && p.discount !== '').map(p => {
        const discountStr = p.discount.replace('%', '');
        return parseFloat(discountStr);
      }).filter(discount => !isNaN(discount));
      
      if (discounts.length > 0) {
        const maxDiscount = Math.max(...discounts);
        const avgDiscount = discounts.reduce((a, b) => a + b, 0) / discounts.length;
        
        console.log(`   🎯 Maximum Discount: ${maxDiscount}%`);
        console.log(`   🎯 Average Discount: ${avgDiscount.toFixed(1)}%`);
      }
    }
    
    // Show filters if available
    if (categoryData.filters && Object.keys(categoryData.filters).length > 0) {
      console.log('\n🔍 Available Filters:');
      Object.keys(categoryData.filters).forEach(filterKey => {
        console.log(`   ${filterKey}: ${JSON.stringify(categoryData.filters[filterKey])}`);
      });
    }
    
    // Show pagination if available
    if (categoryData.pagination && Object.keys(categoryData.pagination).length > 0) {
      console.log('\n📄 Pagination Info:');
      Object.keys(categoryData.pagination).forEach(paginationKey => {
        console.log(`   ${paginationKey}: ${JSON.stringify(categoryData.pagination[paginationKey])}`);
      });
    }
    
    console.log('\n🎉 Test completed successfully!');
    console.log(`📁 Data saved to: scraped_data/vijay-sales-category-*.json`);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    await scraper.close();
    console.log('\n🔒 Scraper closed.');
  }
}

// Run the test
if (require.main === module) {
  testVijaySalesCategoryScraper();
}

module.exports = testVijaySalesCategoryScraper;
