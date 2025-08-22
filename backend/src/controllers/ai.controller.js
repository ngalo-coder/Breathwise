// backend/src/controllers/ai.controller.js
import aiPolicyService from '../services/aiPolicyService.js';

export const getAIAnalysis = async (req, res) => {
  try {
    const { city } = req.params;
    const { depth = 'comprehensive' } = req.query;
    
    // Get data from your existing services
    const cityData = await directDataService.getCityData(city, 'Kenya');
    const weatherData = await weatherService.getCurrentWeather(city);
    
    const analysis = await aiPolicyService.generateComprehensiveAnalysis({
      satelliteData: cityData,
      weatherData: weatherData,
      analysisDepth: depth
    });
    
    res.json({
      success: true,
      data: analysis,
      metadata: {
        city,
        generated_at: new Date().toISOString(),
        analysis_depth: depth
      }
    });
    
  } catch (error) {
    console.error('AI Analysis error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate AI analysis',
      message: error.message
    });
  }
};

export const getSmartHotspots = async (req, res) => {
  try {
    const { city } = req.params;
    const { algorithm = 'dbscan', sensitivity = 'medium' } = req.query;
    
    const cityData = await directDataService.getCityData(city, 'Kenya');
    
    const smartHotspots = await aiPolicyService.detectSmartHotspots({
      data: cityData,
      algorithm: algorithm,
      sensitivity: sensitivity
    });
    
    res.json({
      success: true,
      data: smartHotspots,
      metadata: {
        city,
        algorithm,
        sensitivity,
        generated_at: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Smart hotspots error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate smart hotspots',
      message: error.message
    });
  }
};

// Similar implementations for other AI endpoints
// export const getEarlyWarnings = async (req, res) => { /* ... */ };
// export const getPolicyAnalysis = async (req, res) => { /* ... */ };
// export const getRecommendations = async (req, res) => { /* ... */ };