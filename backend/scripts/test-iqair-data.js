import DirectDataService from '../src/services/directDataService.js';

async function testIQAirData() {
  try {
    const city = 'Nairobi';
    const result = await DirectDataService.fetchIQAirData(city);
    console.log(`IQAir Data for ${city}:`, JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Error fetching IQAir data:', error.message);
  }
}

testIQAirData();