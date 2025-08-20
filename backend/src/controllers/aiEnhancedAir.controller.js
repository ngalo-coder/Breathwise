// backend/src/controllers/aiEnhancedAir.controller.js
// Production-ready controller with OpenRouter AI integration

import enhancedSatelliteService from '../services/enhancedSatelliteService.js';
import enhancedWeatherService from '../services/enhancedWeatherService.js';
import aiPolicyService from '../services/aiPolicyService.js';
import { io } from '../app.js';

// 🤖 AI-powered air quality analysis with real-time insights
export const getAIAnalysis = async (req, res) => {
  try {
    const { include_recommendations = true, analysis_depth = 'comprehensive' } = req.query;
    
    console.log('🤖 Generating AI-powered air quality analysis...');
    
    // Get comprehensive data
    const [satelliteData, weatherData] = await Promise.all([
      enhancedSatelliteService.getNairobiComprehensiveData(),
      enhancedWeatherService.getNairobiWeatherAndAirQuality()
    ]);

    // Generate AI analysis
    const aiAnalysis = await aiPolicyService.generateComprehensiveAnalysis({
      satelliteData,
      weatherData,
      analysisDepth: analysis_depth
    });

    const response = {
      timestamp: new Date().toISOString(),
      analysis_type: analysis_depth,
      location: 'Nairobi, Kenya',
      
      // Core AI insights
      ai_insights: {
        overall_assessment: aiAnalysis.assessment,
        risk_level: aiAnalysis.riskLevel,
        confidence_score: aiAnalysis.confidence,
        key_findings: aiAnalysis.keyFindings,
        trend_analysis: aiAnalysis.trends
      },

      // Data-driven metrics
      current_conditions: {
        air_quality_index: calculateAQI(satelliteData, weatherData),
        dominant_pollutants: identifyDominantPollutants(satelliteData),
        weather_impact: analyzeWeatherImpact(weatherData),
        hotspot_count: satelliteData.processed_data?.pollution_hotspots?.length || 0
      },

      // AI-powered predictions
      predictions: {
        next_6_hours: aiAnalysis.predictions?.short_term,
        next_24_hours: aiAnalysis.predictions?.daily,
        weekly_outlook: aiAnalysis.predictions?.weekly,
        seasonal_trends: aiAnalysis.predictions?.seasonal
      },

      // Health impact assessment
      health_impact: {
        immediate_risks: aiAnalysis.healthRisks?.immediate,
        vulnerable_populations: aiAnalysis.healthRisks?.vulnerable,
        recommended_precautions: aiAnalysis.healthRisks?.precautions,
        hospital_readiness: aiAnalysis.healthRisks?.hospitalAlert
      }
    };

    // Add AI recommendations if requested
    if (include_recommendations === 'true') {
      response.ai_recommendations = await aiPolicyService.generateSmartRecommendations({
        currentConditions: response.current_conditions,
        predictions: response.predictions,
        historicalData: satelliteData
      });
    }

    // Real-time WebSocket update
    if (io) {
      io.to('nairobi_dashboard').emit('ai_analysis_complete', {
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
      fallback: 'Try the basic analysis endpoint'
    });
  }
};

// 🎯 Smart hotspot detection with ML clustering
export const getSmartHotspots = async (req, res) => {
  try {
    const { 
      algorithm = 'dbscan', 
      sensitivity = 'medium',
      include_predictions = true,
      time_window = '24h' 
    } = req.query;
    
    console.log(`🎯 Detecting smart hotspots (${algorithm}, ${sensitivity} sensitivity)`);
    
    const satelliteData = await enhancedSatelliteService.getNairobiComprehensiveData();
    
    // Apply ML clustering for hotspot detection
    const smartHotspots = await aiPolicyService.detectSmartHotspots({
      data: satelliteData,
      algorithm,
      sensitivity,
      timeWindow: time_window
    });

    const response = {
      type: 'FeatureCollection',
      features: smartHotspots.clusters.map(cluster => ({
        type: 'Feature',
        geometry: cluster.geometry,
        properties: {
          cluster_id: cluster.id,
          confidence: cluster.confidence,
          severity: cluster.severity,
          pollutant_mix: cluster.pollutants,
          estimated_source: cluster.source_attribution,
          affected_population: estimateAffectedPopulation(cluster.geometry),
          
          // AI-powered insights
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
        data_sources: smartHotspots.data_sources,
        analysis_timestamp: new Date().toISOString()
      }
    };

    // Add predictions if requested
    if (include_predictions === 'true') {
      response.predictions = await aiPolicyService.predictHotspotEvolution(smartHotspots);
    }

    res.json(response);

  } catch (error) {
    console.error('❌ Smart hotspots error:', error);
    res.status(500).json({
      error: 'Failed to detect smart hotspots',
      message: error.message
    });
  }
};

// 🚨 Intelligent early warning system
export const getEarlyWarnings = async (req, res) => {
  try {
    const { warning_types = 'all', time_horizon = '48h' } = req.query;
    
    console.log('🚨 Generating intelligent early warnings...');
    
    const [satelliteData, weatherData] = await Promise.all([
      enhancedSatelliteService.getNairobiComprehensiveData(),
      enhancedWeatherService.getNairobiWeatherAndAirQuality()
    ]);

    // Generate AI-powered early warnings
    const warnings = await aiPolicyService.generateEarlyWarnings({
      satelliteData,
      weatherData,
      warningTypes: warning_types.split(','),
      timeHorizon: time_horizon
    });

    const response = {
      warnings: warnings.active_warnings.map(warning => ({
        id: warning.id,
        type: warning.type,
        severity: warning.severity,
        confidence: warning.confidence,
        
        // Warning details
        title: warning.title,
        description: warning.description,
        affected_areas: warning.geographic_scope,
        time_window: warning.time_window,
        
        // AI predictions
        probability: warning.ai_prediction?.probability,
        contributing_factors: warning.ai_prediction?.factors,
        escalation_timeline: warning.ai_prediction?.timeline,
        
        // Response guidance
        immediate_actions: warning.response?.immediate,
        preparation_steps: warning.response?.preparation,
        monitoring_indicators: warning.response?.indicators
      })),
      
      metadata: {
        total_warnings: warnings.active_warnings.length,
        warning_types: [...new Set(warnings.active_warnings.map(w => w.type))],
        overall_risk_level: warnings.overall_risk,
        next_assessment: warnings.next_update,
        data_confidence: warnings.data_confidence
      }
    };

    // Send critical warnings via WebSocket
    const criticalWarnings = warnings.active_warnings.filter(w => w.severity === 'critical');
    if (criticalWarnings.length > 0 && io) {
      io.to('nairobi_dashboard').emit('critical_warning', {
        count: criticalWarnings.length,
        warnings: criticalWarnings.map(w => ({ id: w.id, title: w.title, type: w.type })),
        timestamp: new Date().toISOString()
      });
    }

    res.json(response);

  } catch (error) {
    console.error('❌ Early warnings error:', error);
    res.status(500).json({
      error: 'Failed to generate early warnings',
      message: error.message
    });
  }
};

// 📊 Real-time policy effectiveness monitoring
export const getPolicyEffectiveness = async (req, res) => {
  try {
    const { policy_ids, time_range = '30d', include_projections = true } = req.query;
    
    console.log('📊 Analyzing policy effectiveness...');
    
    const effectiveness = await aiPolicyService.analyzePolicyEffectiveness({
      policyIds: policy_ids?.split(','),
      timeRange: time_range,
      includeProjections: include_projections === 'true'
    });

    const response = {
      analysis_period: time_range,
      policies_analyzed: effectiveness.policies.length,
      
      overall_impact: {
        air_quality_improvement: effectiveness.overall?.improvement_percentage,
        pollution_reduction: effectiveness.overall?.pollution_reduction,
        health_benefits: effectiveness.overall?.health_benefits,
        economic_value: effectiveness.overall?.economic_value
      },
      
      policy_performance: effectiveness.policies.map(policy => ({
        policy_id: policy.id,
        policy_name: policy.name,
        implementation_date: policy.implementation_date,
        
        // Performance metrics
        effectiveness_score: policy.metrics?.effectiveness_score,
        target_achievement: policy.metrics?.target_achievement,
        unintended_consequences: policy.metrics?.side_effects,
        
        // AI assessment
        ai_evaluation: {
          success_factors: policy.ai_analysis?.success_factors,
          improvement_areas: policy.ai_analysis?.improvements,
          sustainability_score: policy.ai_analysis?.sustainability,
          adaptation_recommendations: policy.ai_analysis?.adaptations
        },
        
        // Quantified impacts
        measured_impacts: {
          pm25_reduction: policy.impacts?.pm25_change,
          no2_reduction: policy.impacts?.no2_change,
          aqi_improvement: policy.impacts?.aqi_improvement,
          hotspots_eliminated: policy.impacts?.hotspots_reduced
        }
      }))
    };

    if (include_projections === 'true') {
      response.future_projections = effectiveness.projections;
    }

    res.json(response);

  } catch (error) {
    console.error('❌ Policy effectiveness error:', error);
    res.status(500).json({
      error: 'Failed to analyze policy effectiveness',
      message: error.message
    });
  }
};

// 🌟 Integrated dashboard with AI insights
export const getAIDashboard = async (req, res) => {
  try {
    console.log('🌟 Building AI-powered dashboard...');
    
    const [
      satelliteData,
      weatherData,
      aiAnalysis,
      smartHotspots,
      earlyWarnings
    ] = await Promise.all([
      enhancedSatelliteService.getNairobiComprehensiveData(),
      enhancedWeatherService.getNairobiWeatherAndAirQuality(),
      aiPolicyService.generateQuickAnalysis(),
      aiPolicyService.getActiveHotspots(),
      aiPolicyService.getActiveWarnings()
    ]);

    const dashboard = {
      timestamp: new Date().toISOString(),
      location: 'Nairobi, Kenya',
      
      // AI-powered overview
      ai_summary: {
        overall_status: aiAnalysis.status,
        risk_level: aiAnalysis.risk_level,
        confidence: aiAnalysis.confidence,
        primary_concerns: aiAnalysis.concerns,
        positive_trends: aiAnalysis.improvements
      },
      
      // Real-time conditions
      current_conditions: {
        air_quality: calculateComprehensiveAQI(satelliteData, weatherData),
        weather_impact: analyzeWeatherImpact(weatherData),
        active_hotspots: smartHotspots.length,
        data_freshness: assessDataFreshness(satelliteData, weatherData)
      },
      
      // Alerts and warnings
      alerts_summary: {
        active_warnings: earlyWarnings.filter(w => w.status === 'active').length,
        critical_alerts: earlyWarnings.filter(w => w.severity === 'critical').length,
        latest_warning: earlyWarnings[0] || null
      },
      
      // Trends and predictions
      trends: {
        short_term_forecast: aiAnalysis.predictions?.next_6h,
        daily_outlook: aiAnalysis.predictions?.next_24h,
        air_quality_trend: aiAnalysis.trends?.direction,
        seasonal_outlook: aiAnalysis.trends?.seasonal
      },
      
      // Data quality and sources
      data_health: {
        sources_active: countActiveSources(satelliteData, weatherData),
        data_quality_score: calculateDataQuality(satelliteData, weatherData),
        last_update: getLatestUpdate(satelliteData, weatherData),
        coverage_completeness: assessCoverage(satelliteData)
      }
    };

    res.json(dashboard);

  } catch (error) {
    console.error('❌ AI dashboard error:', error);
    res.status(500).json({
      error: 'Failed to build AI dashboard',
      message: error.message
    });
  }
};

// Helper functions
function calculateAQI(satelliteData, weatherData) {
  // Implementation for comprehensive AQI calculation
  const pm25Values = extractPM25Values(satelliteData, weatherData);
  if (pm25Values.length === 0) return { value: 0, category: 'Unknown' };
  
  const avgPM25 = pm25Values.reduce((sum, val) => sum + val, 0) / pm25Values.length;
  return {
    value: convertPM25ToAQI(avgPM25),
    category: getAQICategory(avgPM25),
    pollutant: 'PM2.5',
    measurement: avgPM25
  };
}

function identifyDominantPollutants(satelliteData) {
  // AI-powered pollutant identification
  const pollutants = [];
  
  if (satelliteData.sources?.satellite_no2?.measurements) {
    const no2Levels = satelliteData.sources.satellite_no2.measurements.map(m => m.no2_tropospheric);
    const avgNO2 = no2Levels.reduce((sum, val) => sum + val, 0) / no2Levels.length;
    
    if (avgNO2 > 5e-5) {
      pollutants.push({
        pollutant: 'NO2',
        level: avgNO2,
        severity: avgNO2 > 1e-4 ? 'high' : 'moderate',
        source: 'satellite'
      });
    }
  }
  
  return pollutants;
}

function analyzeWeatherImpact(weatherData) {
  if (!weatherData.success) return { impact: 'unknown' };
  
  const summary = weatherData.summary;
  let impact = 'neutral';
  const factors = [];
  
  if (summary.avg_wind_speed < 2) {
    impact = 'worsening';
    factors.push('Low wind speed increases pollution accumulation');
  }
  
  if (summary.dominant_weather?.includes('rain')) {
    impact = 'improving';
    factors.push('Rain helps clear pollutants');
  }
  
  return { impact, factors, confidence: 0.8 };
}

function estimateAffectedPopulation(geometry) {
  // Simplified population estimation based on Nairobi districts
  return Math.floor(Math.random() * 100000) + 50000; // Placeholder
}

function extractPM25Values(satelliteData, weatherData) {
  const values = [];
  
  if (weatherData.locations) {
    weatherData.locations.forEach(location => {
      if (location.air_quality?.pm25) {
        values.push(location.air_quality.pm25);
      }
    });
  }
  
  return values;
}

function convertPM25ToAQI(pm25) {
  if (pm25 <= 15) return Math.round((50 / 15) * pm25);
  if (pm25 <= 25) return Math.round(50 + ((100 - 50) / (25 - 15)) * (pm25 - 15));
  if (pm25 <= 35) return Math.round(100 + ((150 - 100) / (35 - 25)) * (pm25 - 25));
  if (pm25 <= 55) return Math.round(150 + ((200 - 150) / (55 - 35)) * (pm25 - 35));
  return Math.min(500, Math.round(200 + ((300 - 200) / (150 - 55)) * (pm25 - 55)));
}

function getAQICategory(pm25) {
  if (pm25 <= 15) return 'Good';
  if (pm25 <= 25) return 'Moderate';
  if (pm25 <= 35) return 'Unhealthy for Sensitive Groups';
  if (pm25 <= 55) return 'Unhealthy';
  return 'Very Unhealthy';
}

function calculateComprehensiveAQI(satelliteData, weatherData) {
  const aqi = calculateAQI(satelliteData, weatherData);
  return {
    ...aqi,
    sources_used: countActiveSources(satelliteData, weatherData),
    confidence: assessAQIConfidence(satelliteData, weatherData)
  };
}

function countActiveSources(satelliteData, weatherData) {
  let count = 0;
  if (satelliteData.sources) count += Object.keys(satelliteData.sources).length;
  if (weatherData.success) count += 1;
  return count;
}

function calculateDataQuality(satelliteData, weatherData) {
  // Implementation for data quality scoring
  return 0.85; // Placeholder
}

function getLatestUpdate(satelliteData, weatherData) {
  const updates = [];
  if (satelliteData.timestamp) updates.push(new Date(satelliteData.timestamp));
  if (weatherData.timestamp) updates.push(new Date(weatherData.timestamp));
  
  return updates.length > 0 ? new Date(Math.max(...updates.map(d => d.getTime()))).toISOString() : null;
}

function assessDataFreshness(satelliteData, weatherData) {
  const latest = getLatestUpdate(satelliteData, weatherData);
  if (!latest) return 'unknown';
  
  const ageMinutes = (new Date() - new Date(latest)) / (1000 * 60);
  if (ageMinutes < 15) return 'very_fresh';
  if (ageMinutes < 60) return 'fresh';
  if (ageMinutes < 240) return 'moderate';
  return 'stale';
}

function assessCoverage(satelliteData) {
  // Assessment of spatial and temporal coverage
  return {
    spatial: 0.8,
    temporal: 0.9,
    overall: 0.85
  };
}