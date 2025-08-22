import directDataService from '../services/directDataService.js';
import { generateAPIRecommendations } from '../utils/apiUtils.js';
import { io } from '../websocket/realtime.js';

// Enhanced health check
export const getHealth = async (req, res) => {
  try {
    const cacheStats = directDataService.getCacheStats();

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '2.1.0-simplified',
      mode: 'direct_api_mode',
      environment: process.env.NODE_ENV || 'development',
      uptime: Math.floor(process.uptime()),
      services: {
        cache: {
          status: 'active',
          keys_count: cacheStats.keys?.length || 0
        },
        websocket: {
          status: 'active',
          connected_clients: io.sockets.sockets.size
        },
        apis: {
          weatherapi: process.env.WEATHERAPI_KEY ? 'configured' : 'not_configured',
          openaq: process.env.OPENAQ_API_KEY ? 'configured' : 'optional',
          iqair: process.env.IQAIR_API_KEY ? 'configured' : 'optional',
          waqi: process.env.WAQI_TOKEN ? 'configured' : 'optional',
          openrouter: process.env.OPENROUTER_API_KEY ? 'configured' : 'ai_disabled'
        }
      },
      features: {
        database_required: false,
        real_time_apis: true,
        ai_analysis: !!process.env.OPENROUTER_API_KEY,
        caching: true,
        websockets: true
      }
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

// Manual cache refresh endpoint
export const clearCache = (req, res) => {
  try {
    directDataService.clearCache();
    res.json({
      success: true,
      message: 'Cache cleared successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to clear cache',
      message: error.message
    });
  }
};

// Test API connectivity
export const testApis = async (req, res) => {
  try {
    console.log('🧪 Testing API connectivity...');

    const testResults = {
      weatherapi: false,
      openaq: false,
      iqair: false,
      waqi: false
    };

    // Test WeatherAPI
    if (process.env.WEATHERAPI_KEY) {
      try {
        const response = await fetch(
          `https://api.weatherapi.com/v1/current.json?key=${process.env.WEATHERAPI_KEY}&q=Nairobi,KE&aqi=yes`,
          { timeout: 5000 }
        );
        testResults.weatherapi = response.ok;
      } catch (error) {
        console.warn('WeatherAPI test failed:', error.message);
      }
    }

    // Test OpenAQ
    try {
      const headers = process.env.OPENAQ_API_KEY ? { 'X-API-Key': process.env.OPENAQ_API_KEY } : {};
      const response = await fetch(
        'https://api.openaq.org/v2/latest?country=KE&limit=1',
        { headers, timeout: 5000 }
      );
      testResults.openaq = response.ok;
    } catch (error) {
      console.warn('OpenAQ test failed:', error.message);
    }

    // Test IQAir
    if (process.env.IQAIR_API_KEY) {
      try {
        const response = await fetch(
          `https://api.airvisual.com/v2/nearest_city?lat=-1.2921&lon=36.8219&key=${process.env.IQAIR_API_KEY}`,
          { timeout: 5000 }
        );
        testResults.iqair = response.ok;
      } catch (error) {
        console.warn('IQAir test failed:', error.message);
      }
    }

    // Test WAQI
    if (process.env.WAQI_TOKEN) {
      try {
        const response = await fetch(
          `https://api.waqi.info/feed/nairobi/?token=${process.env.WAQI_TOKEN}`,
          { timeout: 5000 }
        );
        testResults.waqi = response.ok;
      } catch (error) {
        console.warn('WAQI test failed:', error.message);
      }
    }

    const workingAPIs = Object.values(testResults).filter(Boolean).length;
    const totalConfigured = Object.entries(testResults).filter(([key, _]) => {
      const envVars = {
        weatherapi: process.env.WEATHERAPI_KEY,
        openaq: true, // Always available
        iqair: process.env.IQAIR_API_KEY,
        waqi: process.env.WAQI_TOKEN
      };
      return envVars[key];
    }).length;

    res.json({
      success: workingAPIs > 0,
      apis_tested: testResults,
      summary: {
        working_apis: workingAPIs,
        total_configured: totalConfigured,
        success_rate: totalConfigured > 0 ? `${Math.round((workingAPIs / totalConfigured) * 100)}%` : '0%'
      },
      recommendations: generateAPIRecommendations(testResults),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ API test error:', error);
    res.status(500).json({
      error: 'Failed to test APIs',
      message: error.message
    });
  }
};
