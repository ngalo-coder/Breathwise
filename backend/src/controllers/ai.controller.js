// backend/src/controllers/ai.controller.js
import aiPolicyService from '../services/aiPolicyService.js';
import directDataService from '../services/directDataService.js';
import { io } from '../websocket/realtime.js';

// 🤖 AI-powered analysis (without database)
export const getAIAnalysis = async (req, res) => {
  try {
    const { city = 'Nairobi', country = 'Kenya' } = req.params;
    const { analysis_depth = 'standard' } = req.query;

    console.log(`🤖 Generating AI analysis for ${city}, ${country}...`);

    // Get current data
    const currentData = await directDataService.getCityData(city, country);

    // Prepare data for AI analysis
    const analysisInput = {
      satelliteData: {
        processed_data: {
          pollution_hotspots: currentData.hotspots,
          air_quality_summary: {
            overall_status: currentData.summary.air_quality_status,
            avg_pm25: currentData.summary.avg_pm25,
            max_pm25: currentData.summary.max_pm25
          },
          alerts: currentData.alerts
        },
        sources: currentData.data_sources.reduce((acc, source) => {
          acc[source.toLowerCase().replace(/[^a-z0-9]/g, '_')] = { status: 'success' };
          return acc;
        }, {})
      },
      weatherData: {
        success: true,
        summary: {
          avg_pm25: currentData.summary.avg_pm25,
          locations_reporting: currentData.summary.total_measurements
        }
      },
      analysisDepth: analysis_depth
    };

    // Generate AI analysis
    const aiAnalysis = await aiPolicyService.generateComprehensiveAnalysis(analysisInput);

    const response = {
      timestamp: new Date().toISOString(),
      analysis_type: analysis_depth,
      location: `${city}, ${country}`,

      // AI insights
      ai_insights: {
        overall_assessment: aiAnalysis.assessment,
        risk_level: aiAnalysis.riskLevel,
        confidence_score: aiAnalysis.confidence,
        key_findings: aiAnalysis.keyFindings,
        trend_analysis: aiAnalysis.trends
      },

      // Current conditions
      current_conditions: {
        air_quality_index: currentData.summary.aqi || 0,
        air_quality_category: currentData.summary.air_quality_status,
        pm25_level: currentData.summary.avg_pm25,
        hotspot_count: currentData.hotspots.length,
        active_alerts: currentData.alerts.length
      },

      // AI predictions
      predictions: {
        next_6_hours: aiAnalysis.predictions?.short_term,
        next_24_hours: aiAnalysis.predictions?.daily,
        weekly_outlook: aiAnalysis.predictions?.weekly,
        seasonal_trends: aiAnalysis.predictions?.seasonal
      },

      // Health impact
      health_impact: {
        immediate_risks: aiAnalysis.healthRisks?.immediate,
        vulnerable_populations: aiAnalysis.healthRisks?.vulnerable,
        recommended_precautions: aiAnalysis.healthRisks?.precautions,
        hospital_readiness: aiAnalysis.healthRisks?.hospitalAlert
      },

      // Data sources
      data_sources: currentData.data_sources,
      measurements_count: currentData.measurements.length
    };

    // Emit AI update via WebSocket if available
    if (io) {
      const roomName = `${city.toLowerCase()}_dashboard`;
      io.to(roomName).emit('ai_analysis_complete', {
        risk_level: response.ai_insights.risk_level,
        confidence: response.ai_insights.confidence_score,
        key_finding: response.ai_insights.key_findings[0],
        timestamp: response.timestamp
      });
    }

    res.json(response);

  } catch (error) {
    console.error('❌ AI analysis error:', error);
    res.status(500).json({
      error: 'Failed to generate AI analysis',
      message: error.message,
      fallback: 'AI service may be temporarily unavailable'
    });
  }
};

// 🎯 Smart hotspot detection with AI
export const getSmartHotspots = async (req, res) => {
  try {
    const { city = 'Nairobi', country = 'Kenya' } = req.params;
    const { algorithm = 'dbscan', sensitivity = 'medium' } = req.query;

    console.log(`🎯 Detecting smart hotspots for ${city}, ${country}...`);

    const currentData = await directDataService.getCityData(city, country);

    // Prepare data for AI hotspot detection
    const hotspotInput = {
      data: {
        processed_data: {
          pollution_hotspots: currentData.hotspots
        },
        sources: currentData.data_sources.reduce((acc, source) => {
          acc[source.toLowerCase().replace(/[^a-z0-9]/g, '_')] = { status: 'success' };
          return acc;
        }, {})
      },
      algorithm,
      sensitivity
    };

    const smartHotspots = await aiPolicyService.detectSmartHotspots(hotspotInput);

    const response = {
      type: 'FeatureCollection',
      features: smartHotspots.clusters.map(cluster => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [36.8219 + (Math.random() - 0.5) * 0.1, -1.2921 + (Math.random() - 0.5) * 0.1] // Randomized for demo
        },
        properties: {
          cluster_id: cluster.id,
          confidence: cluster.confidence,
          severity: cluster.severity,
          source_attribution: cluster.source_attribution,
          estimated_population_affected: Math.floor(Math.random() * 100000) + 50000,

          // AI insights
          risk_factors: cluster.ai_analysis?.risk_factors,
          intervention_priority: cluster.ai_analysis?.priority,
          recommended_response: cluster.ai_analysis?.response,

          // Temporal patterns
          peak_hours: cluster.temporal?.peak_hours,
          trend_direction: cluster.temporal?.trend,
          persistence_score: cluster.temporal?.persistence
        }
      })),

      metadata: {
        algorithm_used: algorithm,
        total_clusters: smartHotspots.clusters.length,
        detection_confidence: smartHotspots.overall_confidence,
        data_sources: currentData.data_sources,
        analysis_timestamp: new Date().toISOString(),
        location: `${city}, ${country}`
      }
    };

    res.json(response);

  } catch (error) {
    console.error('❌ Smart hotspots error:', error);
    res.status(500).json({
      error: 'Failed to detect smart hotspots',
      message: error.message
    });
  }
};

// Similar implementations for other AI endpoints
// export const getEarlyWarnings = async (req, res) => { /* ... */ };
// export const getPolicyAnalysis = async (req, res) => { /* ... */ };
// export const getRecommendations = async (req, res) => { /* ... */ };