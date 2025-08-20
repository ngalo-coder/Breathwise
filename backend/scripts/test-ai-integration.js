// scripts/test-ai-integration.js
// Test script for AI service integration

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../.env');

console.log('Loading environment variables from:', envPath);
console.log('Current working directory:', process.cwd());

dotenv.config({ path: envPath });

console.log('Environment variables loaded:');
console.log('OPENROUTER_API_KEY:', process.env.OPENROUTER_API_KEY ? '✅ Present' : '❌ Missing');

import aiPolicyService from '../src/services/aiPolicyService.js';
import enhancedSatelliteService from '../src/services/enhancedSatelliteService.js';
import enhancedWeatherService from '../src/services/enhancedWeatherService.js';

// Update the API key in the AIPolicyService instance after environment variables are loaded
if (process.env.OPENROUTER_API_KEY) {
  aiPolicyService.updateApiKey(process.env.OPENROUTER_API_KEY);
  console.log('✅ AIPolicyService API key updated');
} else {
  console.log('❌ AIPolicyService API key not available');
}

class AIIntegrationTester {
  constructor() {
    this.testResults = {
      openrouter_connection: false,
      weather_api: false,
      satellite_service: false,
      ai_analysis: false,
      smart_hotspots: false,
      early_warnings: false,
      policy_recommendations: false
    };
  }

  async runAllTests() {
    console.log('🧪 Starting AI Integration Tests...\n');
    
    try {
      // Test 1: OpenRouter Connection
      await this.testOpenRouterConnection();
      
      // Test 2: Weather API Integration
      await this.testWeatherAPI();
      
      // Test 3: Satellite Service
      await this.testSatelliteService();
      
      // Test 4: AI Analysis
      await this.testAIAnalysis();
      
      // Test 5: Smart Hotspots
      await this.testSmartHotspots();
      
      // Test 6: Early Warnings
      await this.testEarlyWarnings();
      
      // Test 7: Policy Recommendations
      await this.testPolicyRecommendations();
      
      // Summary
      this.printTestSummary();
      
    } catch (error) {
      console.error('❌ Test suite failed:', error);
      process.exit(1);
    }
  }

  async testOpenRouterConnection() {
    console.log('🔗 Testing OpenRouter API connection...');
    
    try {
      if (!process.env.OPENROUTER_API_KEY) {
        throw new Error('OPENROUTER_API_KEY not configured');
      }

      const testPrompt = 'Respond with "OpenRouter connection successful" if you can read this.';
      const response = await aiPolicyService.callOpenRouter(testPrompt, {
        model: 'anthropic/claude-3.5-sonnet',
        max_tokens: 50,
        temperature: 0.1
      });

      if (response && response.toLowerCase().includes('successful')) {
        console.log('✅ OpenRouter connection: PASSED');
        this.testResults.openrouter_connection = true;
      } else {
        throw new Error(`Unexpected response: ${response}`);
      }
    } catch (error) {
      console.log('❌ OpenRouter connection: FAILED');
      console.log(`   Error: ${error.message}`);
    }
  }

  async testWeatherAPI() {
    console.log('\n🌤️ Testing Weather API integration...');
    
    try {
      const weatherData = await enhancedWeatherService.getNairobiWeatherAndAirQuality();
      
      if (weatherData.success && weatherData.locations && weatherData.locations.length > 0) {
        console.log('✅ Weather API: PASSED');
        console.log(`   Retrieved data for ${weatherData.locations.length} locations`);
        console.log(`   Data source: ${weatherData.data_source}`);
        console.log(`   Has air quality: ${weatherData.has_air_quality}`);
        this.testResults.weather_api = true;
      } else {
        throw new Error('No weather data retrieved');
      }
    } catch (error) {
      console.log('❌ Weather API: FAILED');
      console.log(`   Error: ${error.message}`);
    }
  }

  async testSatelliteService() {
    console.log('\n🛰️ Testing Satellite service integration...');
    
    try {
      const satelliteData = await enhancedSatelliteService.getNairobiComprehensiveData();
      
      if (satelliteData && satelliteData.sources) {
        const activeSources = Object.values(satelliteData.sources).filter(s => s.status === 'success').length;
        const totalSources = Object.keys(satelliteData.sources).length;
        
        console.log('✅ Satellite service: PASSED');
        console.log(`   Active sources: ${activeSources}/${totalSources}`);
        console.log(`   Data quality: ${satelliteData.processed_data?.data_fusion_summary?.data_quality || 'unknown'}`);
        this.testResults.satellite_service = true;
      } else {
        throw new Error('No satellite data retrieved');
      }
    } catch (error) {
      console.log('❌ Satellite service: FAILED');
      console.log(`   Error: ${error.message}`);
    }
  }

  async testAIAnalysis() {
    console.log('\n🤖 Testing AI analysis generation...');
    
    try {
      const mockSatelliteData = {
        processed_data: {
          pollution_hotspots: [
            { properties: { severity: 'high', source: 'satellite' } }
          ],
          air_quality_summary: { overall_status: 'moderate' }
        },
        sources: { satellite_no2: { status: 'success' } }
      };
      
      const mockWeatherData = {
        success: true,
        summary: { avg_pm25: 35, avg_wind_speed: 2.1 }
      };

      const analysis = await aiPolicyService.generateComprehensiveAnalysis({
        satelliteData: mockSatelliteData,
        weatherData: mockWeatherData,
        analysisDepth: 'standard'
      });

      if (analysis && analysis.assessment && analysis.riskLevel) {
        console.log('✅ AI analysis: PASSED');
        console.log(`   Risk level: ${analysis.riskLevel}`);
        console.log(`   Confidence: ${analysis.confidence}`);
        console.log(`   Key findings: ${analysis.keyFindings?.length || 0}`);
        this.testResults.ai_analysis = true;
      } else {
        throw new Error('Invalid analysis response');
      }
    } catch (error) {
      console.log('❌ AI analysis: FAILED');
      console.log(`   Error: ${error.message}`);
    }
  }

  async testSmartHotspots() {
    console.log('\n🎯 Testing smart hotspot detection...');
    
    try {
      const mockData = {
        processed_data: {
          pollution_hotspots: [
            {
              geometry: { type: 'Point', coordinates: [36.8219, -1.2921] },
              properties: { severity: 'high', confidence: 0.8, source: 'satellite' }
            }
          ]
        },
        sources: { satellite_no2: { status: 'success' } }
      };

      const smartHotspots = await aiPolicyService.detectSmartHotspots({
        data: mockData,
        algorithm: 'dbscan',
        sensitivity: 'medium'
      });

      if (smartHotspots && smartHotspots.clusters) {
        console.log('✅ Smart hotspots: PASSED');
        console.log(`   Clusters detected: ${smartHotspots.clusters.length}`);
        console.log(`   Overall confidence: ${smartHotspots.overall_confidence}`);
        this.testResults.smart_hotspots = true;
      } else {
        throw new Error('No hotspot clusters generated');
      }
    } catch (error) {
      console.log('❌ Smart hotspots: FAILED');
      console.log(`   Error: ${error.message}`);
    }
  }

  async testEarlyWarnings() {
    console.log('\n🚨 Testing early warning generation...');
    
    try {
      const mockSatelliteData = {
        processed_data: {
          air_quality_summary: { overall_status: 'unhealthy' },
          pollution_hotspots: [{ properties: { severity: 'critical' } }]
        }
      };
      
      const mockWeatherData = {
        success: true,
        summary: { avg_wind_speed: 1.2, dominant_weather: 'clear' }
      };

      const warnings = await aiPolicyService.generateEarlyWarnings({
        satelliteData: mockSatelliteData,
        weatherData: mockWeatherData,
        warningTypes: ['health_emergency', 'pollution_episode'],
        timeHorizon: '24h'
      });

      if (warnings && warnings.active_warnings) {
        console.log('✅ Early warnings: PASSED');
        console.log(`   Warnings generated: ${warnings.active_warnings.length}`);
        console.log(`   Overall risk: ${warnings.overall_risk}`);
        this.testResults.early_warnings = true;
      } else {
        throw new Error('No warnings generated');
      }
    } catch (error) {
      console.log('❌ Early warnings: FAILED');
      console.log(`   Error: ${error.message}`);
    }
  }

  async testPolicyRecommendations() {
    console.log('\n📋 Testing policy recommendations...');
    
    try {
      const mockCurrentConditions = {
        air_quality_index: { value: 150, category: 'Unhealthy' },
        dominant_pollutants: [{ pollutant: 'PM2.5', level: 45 }]
      };
      
      const mockPredictions = {
        next_24_hours: 'Continued unhealthy levels expected'
      };

      const recommendations = await aiPolicyService.generateSmartRecommendations({
        currentConditions: mockCurrentConditions,
        predictions: mockPredictions,
        historicalData: {}
      });

      if (recommendations && recommendations.recommendations && recommendations.recommendations.length > 0) {
        console.log('✅ Policy recommendations: PASSED');
        console.log(`   Recommendations: ${recommendations.recommendations.length}`);
        console.log(`   Categories: ${[...new Set(recommendations.recommendations.map(r => r.category))].join(', ')}`);
        this.testResults.policy_recommendations = true;
      } else {
        throw new Error('No recommendations generated');
      }
    } catch (error) {
      console.log('❌ Policy recommendations: FAILED');
      console.log(`   Error: ${error.message}`);
    }
  }

  printTestSummary() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 AI INTEGRATION TEST SUMMARY');
    console.log('='.repeat(60));
    
    const totalTests = Object.keys(this.testResults).length;
    const passedTests = Object.values(this.testResults).filter(result => result).length;
    const successRate = (passedTests / totalTests * 100).toFixed(1);
    
    console.log(`\nOverall Success Rate: ${passedTests}/${totalTests} (${successRate}%)\n`);
    
    Object.entries(this.testResults).forEach(([test, passed]) => {
      const status = passed ? '✅ PASSED' : '❌ FAILED';
      const testName = test.replace(/_/g, ' ').toUpperCase();
      console.log(`${status} - ${testName}`);
    });
    
    console.log('\n' + '='.repeat(60));
    
    if (passedTests === totalTests) {
      console.log('🎉 All tests passed! AI integration is fully functional.');
      process.exit(0);
    } else if (passedTests >= totalTests * 0.7) {
      console.log('⚠️  Most tests passed. Some features may have limited functionality.');
      process.exit(0);
    } else {
      console.log('🚨 Multiple test failures. Please check your configuration.');
      console.log('\nTroubleshooting tips:');
      console.log('1. Verify all API keys are configured in .env file');
      console.log('2. Check internet connectivity');
      console.log('3. Ensure API quotas are not exceeded');
      console.log('4. Review error messages above for specific issues');
      process.exit(1);
    }
  }

  async performanceTest() {
    console.log('\n⚡ Running performance tests...');
    
    const tests = [
      { name: 'AI Analysis', test: () => this.testAIAnalysis() },
      { name: 'Weather API', test: () => this.testWeatherAPI() },
      { name: 'Satellite Service', test: () => this.testSatelliteService() }
    ];
    
    for (const { name, test } of tests) {
      const startTime = Date.now();
      try {
        await test();
        const duration = Date.now() - startTime;
        console.log(`   ${name}: ${duration}ms`);
      } catch (error) {
        console.log(`   ${name}: FAILED (${error.message})`);
      }
    }
  }
}

// Run tests if called directly (cross-platform)
const isDirect = process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'));
if (isDirect) {
  const tester = new AIIntegrationTester();
  const args = process.argv.slice(2);
  if (args.includes('--performance')) {
    await tester.performanceTest();
  } else {
    await tester.runAllTests();
  }
}