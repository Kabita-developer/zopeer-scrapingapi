const axios = require('axios');

async function testVijaySalesCategoryAPI() {
  try {
    console.log('🚀 Testing Vijay Sales Category API...\n');
    
    const baseUrl = 'http://localhost:3000';
    const testUrl = 'https://www.vijaysales.com/c/home-appliances?PRICE=499.00to47561.00&SORT=Popular';
    
    // Test POST endpoint
    console.log('📤 Testing POST /api/vijay-sales-category/scrape-category...');
    const postResponse = await axios.post(`${baseUrl}/api/vijay-sales-category/scrape-category`, {
      url: testUrl,
      usePuppeteer: false // Use axios for faster testing
    });
    
    console.log('✅ POST Response:');
    console.log(`   Status: ${postResponse.status}`);
    console.log(`   Success: ${postResponse.data.success}`);
    console.log(`   Message: ${postResponse.data.message}`);
    console.log(`   Total Products: ${postResponse.data.data.totalProducts}`);
    console.log(`   Category Name: ${postResponse.data.data.categoryName}`);
    
    if (postResponse.data.data.products && postResponse.data.data.products.length > 0) {
      const sampleProduct = postResponse.data.data.products[0];
      console.log('\n🛍️ Sample Product:');
      console.log(`   ID: ${sampleProduct.productId}`);
      console.log(`   Name: ${sampleProduct.productName}`);
      console.log(`   Brand: ${sampleProduct.brand}`);
      console.log(`   Selling Price: ${sampleProduct.sellingPrice}`);
      console.log(`   Actual Price: ${sampleProduct.actualPrice}`);
      console.log(`   Discount: ${sampleProduct.discount}`);
      console.log(`   Discount Amount: ${sampleProduct.discountAmount}`);
      console.log(`   Image: ${sampleProduct.productImage}`);
      console.log(`   URL: ${sampleProduct.productUrl}`);
    }
    
    // Test GET endpoint
    console.log('\n📥 Testing GET /api/vijay-sales-category/scrape-category...');
    const getResponse = await axios.get(`${baseUrl}/api/vijay-sales-category/scrape-category`, {
      params: {
        url: testUrl,
        usePuppeteer: false
      }
    });
    
    console.log('✅ GET Response:');
    console.log(`   Status: ${getResponse.status}`);
    console.log(`   Success: ${getResponse.data.success}`);
    console.log(`   Total Products: ${getResponse.data.data.totalProducts}`);
    
    // Test health endpoint
    console.log('\n🏥 Testing Health Endpoint...');
    const healthResponse = await axios.get(`${baseUrl}/api/vijay-sales-category/health`);
    console.log('✅ Health Response:');
    console.log(`   Status: ${healthResponse.data.status}`);
    console.log(`   Service: ${healthResponse.data.service}`);
    
    // Test history endpoint
    console.log('\n📚 Testing History Endpoint...');
    const historyResponse = await axios.get(`${baseUrl}/api/vijay-sales-category/history`);
    console.log('✅ History Response:');
    console.log(`   Count: ${historyResponse.data.count}`);
    console.log(`   Message: ${historyResponse.data.message}`);
    
    console.log('\n🎉 All API tests completed successfully!');
    
  } catch (error) {
    console.error('❌ API Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the test
if (require.main === module) {
  testVijaySalesCategoryAPI();
}

module.exports = testVijaySalesCategoryAPI;
