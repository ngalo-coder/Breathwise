const axios = require('axios');

class WAQIDataFetcher {
  constructor(token) {
    this.token = token;
  }

  async fetchWAQIData(city = 'Nairobi') {
    if (!this.token) {
      console.warn('⚠️ No WAQI token provided');
      return [];
    }

    try {
      const searchUrl = 'https://api.waqi.info/search/';
      const params = {
        token: this.token,
        keyword: city
      };

      console.log(`🔍 Searching for stations in ${city}...`);
      const searchResponse = await axios.get(searchUrl, { params, timeout: 8000 });
      
      if (searchResponse.data.status !== 'ok') {
        console.warn(`❌ Search API error: ${searchResponse.data.message || 'Unknown error'}`);
        return [];
      }

      const data = searchResponse.data.data;

      if (!data || data.length === 0) {
        console.warn(`⚠️ WAQI search for ${city} returned no results`);
        return [];
      }

      console.log(`✅ Found ${data.length} stations`);
      const stationId = data[0].uid;
      
      if (!stationId) {
        console.warn('⚠️ No station ID found');
        return [];
      }

      const feedUrl = `https://api.waqi.info/feed/@${stationId}/`;
      const feedParams = { token: this.token };

      console.log(`📡 Fetching data for station ${stationId}...`);
      const feedResponse = await axios.get(feedUrl, { params: feedParams, timeout: 8000 });
      
      if (feedResponse.data.status !== 'ok') {
        console.warn(`❌ Feed API error: ${feedResponse.data.message || 'Unknown error'}`);
        return [];
      }

      const feedData = feedResponse.data.data;

      const result = {
        station: data[0].station.name,
        location: feedData.city.name,
        coordinates: feedData.city.geo,
        aqi: feedData.aqi,
        measurements: feedData.iaqi,
        time: feedData.time,
        source: 'WAQI'
      };

      console.log('✅ Data fetched successfully!');
      return [result];
      
    } catch (error) {
      if (error.code === 'ECONNABORTED') {
        console.warn('❌ Request timed out');
      } else if (error.response) {
        console.warn(`❌ API error: ${error.response.status} - ${error.response.statusText}`);
      } else {
        console.warn(`❌ Error fetching WAQI data for ${city}:`, error.message);
      }
      return [];
    }
  }
}

// Your WAQI token
const WAQI_TOKEN = "215c4c7d39d4fe45d4e9af3e15dc5929d426ae4d";

// Create fetcher instance
const fetcher = new WAQIDataFetcher(WAQI_TOKEN);

// Fetch and display data
async function main() {
  console.log('🌍 Fetching air quality data for Nairobi...');
  const result = await fetcher.fetchWAQIData('Nairobi');
  
  if (result.length > 0) {
    console.log('\n' + '='.repeat(60));
    console.log('AIR QUALITY DATA FOR NAIROBI');
    console.log('='.repeat(60));
    
    const data = result[0];
    console.log(`Station: ${data.station}`);
    console.log(`Location: ${data.location}`);
    console.log(`AQI: ${data.aqi}`);
    
    if (data.coordinates && data.coordinates.length === 2) {
      console.log(`Coordinates: ${data.coordinates[0]}, ${data.coordinates[1]}`);
    }
    
    if (data.measurements) {
      console.log('\nMeasurements:');
      for (const [param, values] of Object.entries(data.measurements)) {
        if (values && typeof values === 'object' && 'v' in values) {
          console.log(`  - ${param}: ${values.v}`);
        }
      }
    }
    
    if (data.time && data.time.s) {
      console.log(`\nLast updated: ${data.time.s}`);
    }
    
    console.log(`Source: ${data.source}`);
  } else {
    console.log('❌ No data received');
  }
}

// Run the main function
main();