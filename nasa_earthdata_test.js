const axios = require('axios');

// Your NASA Earthdata token
const NASA_EARTHDATA_TOKEN = "eyJ0eXAiOiJKV1QiLCJvcmlnaW4iOiJFYXJ0aGRhdGEgTG9naW4iLCJzaWciOiJlZGxqd3RwdWJrZXlfb3BzIiwiYWxnIjoiUlMyNTYifQ.eyJ0eXBlIjoiVXNlciIsInVpZCI6Im90aWVub2RvbWluaWMiLCJleHAiOjE3NjA5MTgzOTksImlhdCI6MTc1NTY4NTg4MSwiaXNzIjoiaHR0cHM6Ly91cnMuZWFydGhkYXRhLm5hc2EuZ292IiwiaWRlbnRpdHlfcHJvdmlkZXIiOiJlZGxfb3BzIiwiYWNyIjoiZWRsIiwiYXNzdXJhbmNlX2xldmVsIjozfQ.GQ_p5zEIyPW5JyzLiXzMJgZ2WIDQGlJxjm-IebHsmTE8KiXV7IY-M2faZ58PBzBchWpElEvl2qLXz_ZwrQYHT4aZcc75MK1ltRwr7h8kXPJw2TQ_8cC9jMQjyKf-59QMT7HQnr1Yh4O2RXROv4jB-BMdO1bJGGU8mYOiVWAMF3lvh4Ijo_PTHxESwXUGGGJFrCVJ_JAiXrKlF5sTtEYCgP38teht0mJEbuoiWPptw-OLXxW_uYMKjd_1ADCIVGYsRzHqnY0EDTZ0RfegYODNV0_V3D1i7xV398GrK3h3qDqom_lHjdv4wQE_oPeayLJIy7ZKQuemWJ37DxnaRYrphA";

async function testNasaEarthdataToken() {
    console.log("🔑 Testing NASA Earthdata token...");
    
    if (!NASA_EARTHDATA_TOKEN) {
        console.log("❌ No token provided");
        return false;
    }
    
    // NASA Earthdata API endpoint for user profile
    const url = "https://urs.earthdata.nasa.gov/api/users/otienodominic";
    
    const headers = {
        "Authorization": `Bearer ${NASA_EARTHDATA_TOKEN}`,
        "Accept": "application/json"
    };
    
    try {
        const response = await axios.get(url, { headers, timeout: 10000 });
        
        if (response.status === 200) {
            console.log("✅ NASA Earthdata token is valid!");
            const userData = response.data;
            console.log(`User ID: ${userData.uid}`);
            console.log(`Email: ${userData.email}`);
            console.log(`First Name: ${userData.first_name}`);
            console.log(`Last Name: ${userData.last_name}`);
            return true;
        } else {
            console.log(`❌ Token validation failed with status code: ${response.status}`);
            console.log(`Response: ${response.data}`);
            return false;
        }
    } catch (error) {
        if (error.response) {
            console.log(`❌ Error: ${error.response.status} - ${error.response.statusText}`);
            console.log(`Response: ${JSON.stringify(error.response.data)}`);
        } else if (error.request) {
            console.log("❌ No response received from server");
        } else {
            console.log(`❌ Error: ${error.message}`);
        }
        return false;
    }
}

async function searchEarthdata() {
    console.log("\n🌍 Searching for Earthdata...");
    
    // Search for MODIS data as an example
    const searchUrl = "https://cmr.earthdata.nasa.gov/search/collections.json";
    
    const params = {
        keyword: "MODIS",
        page_size: 3
    };
    
    const headers = {
        "Authorization": `Bearer ${NASA_EARTHDATA_TOKEN}`,
        "Accept": "application/json"
    };
    
    try {
        const response = await axios.get(searchUrl, { params, headers, timeout: 10000 });
        
        if (response.status === 200) {
            const data = response.data;
            console.log("✅ Earthdata search successful!");
            console.log(`Found ${data.hits} collections matching 'MODIS'`);
            
            // Display first few results
            data.feed.entry.slice(0, 3).forEach((item, index) => {
                console.log(`\n${index + 1}. ${item.title}`);
                console.log(`   ID: ${item.id}`);
                console.log(`   Updated: ${item.updated}`);
            });
            return true;
        } else {
            console.log(`❌ Search failed with status code: ${response.status}`);
            return false;
        }
    } catch (error) {
        if (error.response) {
            console.log(`❌ Error: ${error.response.status} - ${error.response.statusText}`);
        } else if (error.request) {
            console.log("❌ No response received from server");
        } else {
            console.log(`❌ Error: ${error.message}`);
        }
        return false;
    }
}

async function main() {
    // Test the token
    const tokenValid = await testNasaEarthdataToken();
    
    // If token is valid, try to search for data
    if (tokenValid) {
        await searchEarthdata();
    }
}

// Run the main function
main();