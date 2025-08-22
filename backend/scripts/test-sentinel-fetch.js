import EnhancedSatelliteService from '../src/services/enhancedSatelliteService.js';

async function testSentinelFetch() {
  try {
    const bbox = [36.65, -1.45, 37.00, -1.15]; // Nairobi bounding box
    const result = await EnhancedSatelliteService.fetchSentinelData(bbox);
    console.log('Sentinel data fetch result:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Error fetching Sentinel data:', error.message);
  }
}

testSentinelFetch();