const axios = require('axios');

async function testTheBodyShopCategoryAPI() {
  try {
    console.log('🧪 Testing The Body Shop Category API...\n');
    
    const baseUrl = 'http://localhost:3333';
    
    // Test different category URLs from The Body Shop India
    const testUrls = [
      'https://www.thebodyshop.in/bath-body',
      'https://www.thebodyshop.in/face-skincare',
      'https://www.thebodyshop.in/hair',
      'https://www.thebodyshop.in/makeup',
      'https://www.thebodyshop.in/fragrance'
    ];
    
    // Test POST endpoint
    console.log('📤 Testing POST /api/thebodyshop-category/scrape-category...');
    const testUrl = testUrls[0]; // Use first URL for testing
    console.log(`URL: ${testUrl}\n`);
    
    const postResponse = await axios.post(`${baseUrl}/api/thebodyshop-category/scrape-category`, {
      url: testUrl,
      usePuppeteer: true
    });
    
    console.log('✅ POST Response:');
    console.log(`   Status: ${postResponse.status}`);
    console.log(`   Success: ${postResponse.data.success}`);
    console.log(`   Message: ${postResponse.data.message}`);
    console.log(`   Category: ${postResponse.data.data?.category || 'N/A'}`);
    console.log(`   Total Products: ${postResponse.data.data?.totalProducts || 0}`);
    console.log(`   Products Found: ${postResponse.data.data?.products?.length || 0}`);
    
    if (postResponse.data.data?.products && postResponse.data.data.products.length > 0) {
      console.log('\n📦 Sample Products:');
      postResponse.data.data.products.slice(0, 3).forEach((product, index) => {
        console.log(`\n   Product ${index + 1}:`);
        console.log(`     Name: ${product.productName || 'N/A'}`);
        console.log(`     Brand: ${product.brand || 'N/A'}`);
        console.log(`     Selling Price: ${product.sellingPrice || 'N/A'}`);
        console.log(`     Actual Price: ${product.actualPrice || 'N/A'}`);
        console.log(`     Discount: ${product.discount || 'N/A'}`);
        console.log(`     Discount Amount: ${product.discountAmount || 'N/A'}`);
        console.log(`     Rating: ${product.rating || 'N/A'}`);
        console.log(`     Review Count: ${product.reviewCount || 'N/A'}`);
        console.log(`     Image: ${product.productImage ? 'Available' : 'N/A'}`);
        console.log(`     URL: ${product.productUrl ? 'Available' : 'N/A'}`);
      });
      
      // Show data quality summary
      console.log('\n📊 Data Quality Summary:');
      const totalProducts = postResponse.data.data.products.length;
      const productsWithName = postResponse.data.data.products.filter(p => p.productName).length;
      const productsWithPrice = postResponse.data.data.products.filter(p => p.sellingPrice).length;
      const productsWithImage = postResponse.data.data.products.filter(p => p.productImage).length;
      const productsWithRating = postResponse.data.data.products.filter(p => p.rating > 0).length;
      
      console.log(`   Products with Name: ${productsWithName}/${totalProducts} (${Math.round(productsWithName/totalProducts*100)}%)`);
      console.log(`   Products with Price: ${productsWithPrice}/${totalProducts} (${Math.round(productsWithPrice/totalProducts*100)}%)`);
      console.log(`   Products with Image: ${productsWithImage}/${totalProducts} (${Math.round(productsWithImage/totalProducts*100)}%)`);
      console.log(`   Products with Rating: ${productsWithRating}/${totalProducts} (${Math.round(productsWithRating/totalProducts*100)}%)`);
    }
    
    console.log(`\n⏱️  Timestamp: ${postResponse.data.timestamp}`);
    
    // Test GET endpoint
    console.log('\n📤 Testing GET /api/thebodyshop-category/category...');
    const getResponse = await axios.get(`${baseUrl}/api/thebodyshop-category/category`, {
      params: {
        url: testUrl,
        usePuppeteer: false
      }
    });
    
    console.log('✅ GET Response:');
    console.log(`   Status: ${getResponse.status}`);
    console.log(`   Success: ${getResponse.data.success}`);
    console.log(`   Products Found: ${getResponse.data.data?.products?.length || 0}`);
    
    // Test categories endpoint
    console.log('\n📤 Testing GET /api/thebodyshop-category/categories...');
    const categoriesResponse = await axios.get(`${baseUrl}/api/thebodyshop-category/categories`);
    
    console.log('✅ Categories Response:');
    console.log(`   Status: ${categoriesResponse.status}`);
    console.log(`   Success: ${categoriesResponse.data.success}`);
    console.log(`   Categories Count: ${categoriesResponse.data.count || 0}`);
    
    if (categoriesResponse.data.categories) {
      console.log('   Available Categories:');
      categoriesResponse.data.categories.forEach(category => {
        console.log(`     - ${category.name} (${category.subcategories.length} subcategories)`);
      });
    }
    
    // Test search endpoint
    console.log('\n📤 Testing GET /api/thebodyshop-category/search...');
    const searchResponse = await axios.get(`${baseUrl}/api/thebodyshop-category/search`, {
      params: {
        q: 'body butter',
        limit: 5
      }
    });
    
    console.log('✅ Search Response:');
    console.log(`   Status: ${searchResponse.status}`);
    console.log(`   Success: ${searchResponse.data.success}`);
    console.log(`   Query: ${searchResponse.data.query}`);
    console.log(`   Results: ${searchResponse.data.results?.length || 0}`);
    
    // Test status endpoint
    console.log('\n📤 Testing GET /api/thebodyshop-category/status...');
    const statusResponse = await axios.get(`${baseUrl}/api/thebodyshop-category/status`);
    
    console.log('✅ Status Response:');
    console.log(`   Status: ${statusResponse.status}`);
    console.log(`   Initialized: ${statusResponse.data.initialized}`);
    
    // Test health endpoint
    console.log('\n📤 Testing GET /api/thebodyshop-category/health...');
    const healthResponse = await axios.get(`${baseUrl}/api/thebodyshop-category/health`);
    
    console.log('✅ Health Response:');
    console.log(`   Status: ${healthResponse.status}`);
    console.log(`   Service: ${healthResponse.data.service}`);
    console.log(`   Version: ${healthResponse.data.version}`);
    
    // Test docs endpoint
    console.log('\n📤 Testing GET /api/thebodyshop-category/docs...');
    const docsResponse = await axios.get(`${baseUrl}/api/thebodyshop-category/docs`);
    
    console.log('✅ Docs Response:');
    console.log(`   Status: ${docsResponse.status}`);
    console.log(`   Title: ${docsResponse.data.title}`);
    console.log(`   Version: ${docsResponse.data.version}`);
    console.log(`   Endpoints Count: ${Object.keys(docsResponse.data.endpoints || {}).length}`);
    
    console.log('\n🎉 All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Error testing The Body Shop category API:');
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Error: ${error.response.data.error || 'Unknown error'}`);
      console.error(`   Message: ${error.response.data.message || 'No message'}`);
      if (error.response.data.details) {
        console.error(`   Details: ${error.response.data.details}`);
      }
    } else {
      console.error(`   Error: ${error.message}`);
    }
  }
}

// Run the test
testTheBodyShopCategoryAPI();
