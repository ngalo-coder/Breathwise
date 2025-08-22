import DirectDataService from '../src/services/directDataService.js';

async function testOpenAQData() {
  try {
    const city = 'Nairobi';
    const result = await DirectDataService.fetchOpenAQData(city);
    console.log(`OpenAQ Data for ${city}:`, JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Error fetching OpenAQ data:', error.message);
  }
}

testOpenAQData();