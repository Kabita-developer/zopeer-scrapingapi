const axios = require('axios');

async function testNykaaCategoryFix() {
    try {
        console.log('🧪 Testing Nykaa Category URL Fix...\n');
        
        const baseUrl = 'http://localhost:3333';
        const testUrl = 'http://nykaa.com/clearance-sale/c/861?intcmp=oz%2Cclearance-native%2C1%2Cclearance-sale&redirectpath=slug&transaction_id=d724dfffd5842b962854a6de55d1ecfe';
        
        // Test the fixed API endpoint
        console.log('📤 Testing POST /api/nykaa/scrape with category URL...');
        console.log(`URL: ${testUrl}\n`);
        
        const response = await axios.post(`${baseUrl}/api/nykaa/scrape`, {
            url: testUrl,
            usePuppeteer: true
        });
        
        console.log('✅ Response received:');
        console.log(`   Status: ${response.status}`);
        console.log(`   Success: ${response.data.success}`);
        console.log(`   Message: ${response.data.message}`);
        
        if (response.data.success) {
            console.log(`   Category Title: ${response.data.data.categoryTitle || 'N/A'}`);
            console.log(`   Total Products: ${response.data.data.totalProducts || 0}`);
            console.log(`   Products Found: ${response.data.data.products?.length || 0}`);
            
            if (response.data.data.products && response.data.data.products.length > 0) {
                console.log('\n📦 Sample Product:');
                const sampleProduct = response.data.data.products[0];
                console.log(`   Title: ${sampleProduct.title || 'N/A'}`);
                console.log(`   Brand: ${sampleProduct.brand || 'N/A'}`);
                console.log(`   Selling Price: ₹${sampleProduct.sellingPrice || 'N/A'}`);
                console.log(`   MRP: ₹${sampleProduct.mrp || 'N/A'}`);
                console.log(`   Discount: ${sampleProduct.discount || 0}%`);
                console.log(`   Rating: ${sampleProduct.rating || 'N/A'}`);
            }
        }
        
        console.log(`\n⏱️  Timestamp: ${response.data.timestamp}`);
        
    } catch (error) {
        console.error('❌ Error testing Nykaa category fix:');
        if (error.response) {
            console.error(`   Status: ${error.response.status}`);
            console.error(`   Error: ${error.response.data.error || 'Unknown error'}`);
            console.error(`   Message: ${error.response.data.message || 'No message'}`);
        } else {
            console.error(`   Error: ${error.message}`);
        }
    }
}

// Run the test
testNykaaCategoryFix();
