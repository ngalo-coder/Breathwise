const axios = require('axios');

class IQAirDataFetcher {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'http://api.airvisual.com/v2';
  }

  async testAPIKey() {
    console.log('🔑 Testing IQAir API key...');
    
    if (!this.apiKey) {
      console.log('❌ No API key provided');
      return false;
    }

    try {
      // Test by getting nearest city data (which doesn't require specific location parameters)
      const testUrl = `${this.baseUrl}/nearest_city`;
      const response = await axios.get(testUrl, {
        params: {
          key: this.apiKey
        },
        timeout: 8000
      });

      if (response.data.status === 'success') {
        console.log('✅ IQAir API key is valid!');
        return true;
      } else {
        console.log(`❌ API returned error: ${response.data.data?.message || 'Unknown error'}`);
        return false;
      }
    } catch (error) {
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.log(`❌ API Error: ${error.response.status} - ${error.response.statusText}`);
        if (error.response.data && error.response.data.data) {
          console.log(`Error message: ${error.response.data.data.message}`);
        }
      } else if (error.request) {
        // The request was made but no response was received
        console.log('❌ No response received from IQAir API');
      } else {
        // Something happened in setting up the request that triggered an Error
        console.log(`❌ Request error: ${error.message}`);
      }
      return false;
    }
  }

  async getCityData(city = 'Nairobi', state = 'Nairobi', country = 'Kenya') {
    if (!this.apiKey) {
      console.log('❌ No API key provided');
      return null;
    }

    try {
      console.log(`🌍 Fetching air quality data for ${city}, ${state}, ${country}...`);
      
      const url = `${this.baseUrl}/city`;
      const response = await axios.get(url, {
        params: {
          city: city,
          state: state,
          country: country,
          key: this.apiKey
        },
        timeout: 8000
      });

      if (response.data.status === 'success') {
        console.log('✅ Data retrieved successfully!');
        return response.data.data;
      } else {
        console.log(`❌ API returned error: ${response.data.data?.message || 'Unknown error'}`);
        return null;
      }
    } catch (error) {
      console.log(`❌ Error fetching city data: ${error.message}`);
      return null;
    }
  }
}

// Your IQAir API key
const IQAIR_API_KEY = "1bf487a8-c436-4aaa-8719-a74e6244c233";

// Create fetcher instance
const fetcher = new IQAirDataFetcher(IQAIR_API_KEY);

// Main function to test the API
async function main() {
  // First test if the API key is valid
  const isValid = await fetcher.testAPIKey();
  
  if (!isValid) {
    console.log('❌ API key test failed. Please check your API key.');
    return;
  }
  
  // If valid, try to get data for Nairobi
  const cityData = await fetcher.getCityData('Nairobi', 'Nairobi', 'Kenya');
  
  if (cityData) {
    console.log('\n' + '='.repeat(60));
    console.log('AIR QUALITY DATA FOR NAIROBI');
    console.log('='.repeat(60));
    
    console.log(`City: ${cityData.city}`);
    console.log(`Current AQI: ${cityData.current.pollution.aqius} (US标准)`);
    console.log(`Main pollutant: ${cityData.current.pollution.mainus}`);
    
    // Display weather information if available
    if (cityData.current.weather) {
      console.log(`Temperature: ${cityData.current.weather.tp}°C`);
      console.log(`Humidity: ${cityData.current.weather.hu}%`);
      console.log(`Wind Speed: ${cityData.current.weather.ws} m/s`);
    }
    
    console.log(`Last updated: ${new Date(cityData.current.pollution.ts).toLocaleString()}`);
  } else {
    console.log('❌ Could not retrieve data for Nairobi. Trying with a different approach...');
    
    // Try to get data by coordinates (Nairobi approximate coordinates)
    try {
      const coordinatesUrl = `${fetcher.baseUrl}/nearest_city`;
      const response = await axios.get(coordinatesUrl, {
        params: {
          lat: -1.2921,
          lon: 36.8219,
          key: fetcher.apiKey
        },
        timeout: 8000
      });
      
      if (response.data.status === 'success') {
        const data = response.data.data;
        console.log('\n' + '='.repeat(60));
        console.log('AIR QUALITY DATA FOR NEAREST LOCATION TO NAIROBI');
        console.log('='.repeat(60));
        
        console.log(`City: ${data.city}`);
        console.log(`Country: ${data.country}`);
        console.log(`Current AQI: ${data.current.pollution.aqius} (US标准)`);
        console.log(`Main pollutant: ${data.current.pollution.mainus}`);
        
        if (data.current.weather) {
          console.log(`Temperature: ${data.current.weather.tp}°C`);
          console.log(`Humidity: ${data.current.weather.hu}%`);
        }
      }
    } catch (error) {
      console.log('❌ Could not retrieve data by coordinates either.');
    }
  }
}

// Run the main function
main();