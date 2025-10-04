const axios = require('axios');

async function testUpdatedNykaaCategoryAPI() {
    try {
        console.log('🧪 Testing Updated Nykaa Category API...\n');
        
        const baseUrl = 'http://localhost:3333';
        const testUrl = 'https://www.nykaa.com/best-of-beauty/c/21447?page_no=1&sort=customer_top_rated&price_range_filter=0-499&categoryId=21447&transaction_id=173d9f1371e7a2fcfec9d0aaac16fb75&intcmp=oz%2Cbudgets-buys-native%2C3%2Cbest-of-beauty&eq=desktop&discount_range_filter=70-*';
        
        // Test the Nykaa Category API endpoint
        console.log('📤 Testing POST /api/nykaa-category/scrape-category...');
        console.log(`URL: ${testUrl}\n`);
        
        const response = await axios.post(`${baseUrl}/api/nykaa-category/scrape-category`, {
            url: testUrl,
            usePuppeteer: true
        });
        
        console.log('✅ Response received:');
        console.log(`   Status: ${response.status}`);
        console.log(`   Success: ${response.data.success}`);
        console.log(`   Message: ${response.data.message}`);
        
        if (response.data.success) {
            const data = response.data.data;
            console.log(`   Category Title: ${data.categoryTitle || 'N/A'}`);
            console.log(`   Category: ${data.category || 'N/A'}`);
            console.log(`   Total Products: ${data.totalProducts || 0}`);
            console.log(`   Products Found: ${data.products?.length || 0}`);
            
            if (data.products && data.products.length > 0) {
                console.log('\n📦 Sample Products:');
                
                // Show first 3 products as examples
                data.products.slice(0, 3).forEach((product, index) => {
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
                const totalProducts = data.products.length;
                const productsWithName = data.products.filter(p => p.productName).length;
                const productsWithPrice = data.products.filter(p => p.sellingPrice).length;
                const productsWithImage = data.products.filter(p => p.productImage).length;
                const productsWithRating = data.products.filter(p => p.rating > 0).length;
                
                console.log(`   Products with Name: ${productsWithName}/${totalProducts} (${Math.round(productsWithName/totalProducts*100)}%)`);
                console.log(`   Products with Price: ${productsWithPrice}/${totalProducts} (${Math.round(productsWithPrice/totalProducts*100)}%)`);
                console.log(`   Products with Image: ${productsWithImage}/${totalProducts} (${Math.round(productsWithImage/totalProducts*100)}%)`);
                console.log(`   Products with Rating: ${productsWithRating}/${totalProducts} (${Math.round(productsWithRating/totalProducts*100)}%)`);
            }
        }
        
        console.log(`\n⏱️  Timestamp: ${response.data.timestamp}`);
        
    } catch (error) {
        console.error('❌ Error testing updated Nykaa category API:');
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
testUpdatedNykaaCategoryAPI();
