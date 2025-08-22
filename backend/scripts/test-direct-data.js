import DirectDataService from '../src/services/directDataService.js';

async function testDirectData() {
  try {
    const city = 'Nairobi';
    const result = await DirectDataService.fetchWAQIData(city);
    console.log(`WAQI Data for ${city}:`, JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Error fetching WAQI data:', error.message);
  }
}

testDirectData();