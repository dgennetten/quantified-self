const axios = require('axios');

async function testOuraData() {
  try {
    console.log('🔍 Testing Oura Data...\n');
    
    // Test the debug endpoint
    const response = await axios.get('http://localhost:3001/api/dashboard/debug', {
      headers: {
        'Authorization': 'Bearer YOUR_JWT_TOKEN_HERE' // You'll need to replace this with a valid token
      }
    });
    
    console.log('✅ Debug response:');
    console.log(JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

// Instructions for use
console.log('📝 Instructions:');
console.log('1. First, login to your app and get a JWT token');
console.log('2. Replace "YOUR_JWT_TOKEN_HERE" in this script with your actual token');
console.log('3. Run: node test-oura.js');
console.log('\n---\n');

// Uncomment the line below after you've added your token
// testOuraData(); 