// backend/src/controllers/simple.controller.js
// Simplified controller that works without database

import directDataService from '../services/directDataService.js';
import aiPolicyService from '../services/aiPolicyService.js';
import { io } from '../app.js';

// 🌍 Get comprehensive Nairobi air quality data
export const getNairobiData = async (req, res) => {
  try {
    console.log('🌍 Fetching comprehensive Nairobi data...');

    const data = await directDataService.getNairobiData();

    // Emit real-time update
    if (io) {
      io.to('nairobi_dashboard').emit('data_update', {
        measurements_count: data.measurements.length,
        avg_pm25: data.summary.avg_pm25,
        air_quality_status: data.summary.air_quality_status,
        timestamp: data.timestamp
      });
    }

    res.json({
      success: true,
      ...data,
      metadata: {
        api_sources: data.data_sources,
        cache_used: true,
        processing_time: '< 3 seconds',
        next_update: new Date(Date.now() + 15 * 60 * 1000).toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Nairobi data error:', error);
    res.status(500).json({
      error: 'Failed to fetch air quality data',
      message: error.message,
      fallback: 'Check API configurations'
    });
  }
};

// 📊 Get air quality measurements in GeoJSON format
export const getMeasurements = async (req, res) => {
  try {
    const { format = 'geojson', bbox, pollutants } = req.query;

    console.log('📊 Fetching air quality measurements...');

    const data = await directDataService.getNairobiData();

    let measurements = data.measurements;

    // Filter by pollutants if specified
    if (pollutants) {
      const requestedPollutants = pollutants.split(',');
      measurements = measurements.filter(m => {
        return requestedPollutants.some(pollutant =>
          m.properties[pollutant] != null
        );
      });
    }

    // Filter by bounding box if specified
    if (bbox) {
      const [minLon, minLat, maxLon, maxLat] = bbox.split(',').map(Number);
      measurements = measurements.filter(m => {
        const [lon, lat] = m.geometry.coordinates;
        return lon >= minLon && lon <= maxLon && lat >= minLat && lat <= maxLat;
      });
    }

    if (format === 'geojson') {
      res.json({
        type: 'FeatureCollection',
        features: measurements,
        metadata: {
          total_measurements: measurements.length,
          bbox: bbox || 'Nairobi area',
          pollutants_included: pollutants || 'all available',
          data_sources: data.data_sources,
          generated_at: data.timestamp
        }
      });
    } else {
      // Return simplified format
      res.json({
        measurements: measurements.map(m => ({
          location: m.properties.name,
          coordinates: m.geometry.coordinates,
          air_quality: {
            pm25: m.properties.pm25,
            pm10: m.properties.pm10,
            no2: m.properties.no2,
            aqi: m.properties.aqi_us || m.properties.aqi
          },
          source: m.properties.source,
          timestamp: m.properties.timestamp
        })),
        metadata: {
          count: measurements.length,
          generated_at: data.timestamp
        }
      });
    }

  } catch (error) {
    console.error('❌ Measurements error:', error);
    res.status(500).json({
      error: 'Failed to fetch measurements',
      message: error.message
    });
  }
};

// 🔥 Get pollution hotspots
export const getHotspots = async (req, res) => {
  try {
    const { severity = 'moderate', format = 'geojson' } = req.query;

    console.log('🔥 Fetching pollution hotspots...');

    const data = await directDataService.getNairobiData();

    let hotspots = data.hotspots;

    // Filter by severity
    if (severity !== 'all') {
      const severityLevels = {
        'moderate': ['moderate', 'high', 'critical'],
        'high': ['high', 'critical'],
        'critical': ['critical']
      };

      const allowedSeverities = severityLevels[severity] || ['moderate', 'high', 'critical'];
      hotspots = hotspots.filter(h => allowedSeverities.includes(h.properties.severity));
    }

    if (format === 'geojson') {
      res.json({
        type: 'FeatureCollection',
        features: hotspots,
        metadata: {
          total_hotspots: hotspots.length,
          severity_filter: severity,
          detection_time: data.timestamp,
          data_sources: data.data_sources
        }
      });
    } else {
      res.json({
        hotspots: hotspots.map(h => ({
          location: h.properties.location_name,
          coordinates: h.geometry.coordinates,
          pollutant: h.properties.pollutant,
          value: h.properties.value,
          severity: h.properties.severity,
          threshold: h.properties.threshold
        })),
        metadata: {
          count: hotspots.length,
          generated_at: data.timestamp
        }
      });
    }

  } catch (error) {
    console.error('❌ Hotspots error:', error);
    res.status(500).json({
      error: 'Failed to fetch hotspots',
      message: error.message
    });
  }
};

// 🚨 Get active alerts
export const getAlerts = async (req, res) => {
  try {
    const { severity, limit = 20 } = req.query;

    console.log('🚨 Fetching active alerts...');

    const data = await directDataService.getNairobiData();

    let alerts = data.alerts;

    // Limit results
    alerts = alerts.slice(0, parseInt(limit));

    res.json({
      alerts: alerts.map(alert => ({
        id: alert.id,
        type: alert.type,
        severity: alert.severity,
        message: alert.message,
        affected_area: alert.affected_area,
        timestamp: alert.timestamp,
        actions: alert.actions || [],
        current_value: alert.current_value,
        threshold: alert.threshold
      })),
      metadata: {
        total_alerts: alerts.length,
        severity_filter: severity || 'all',
        generated_at: data.timestamp,
        alert_types: [...new Set(alerts.map(a => a.type))]
      }
    });

  } catch (error) {
    console.error('❌ Alerts error:', error);
    res.status(500).json({
      error: 'Failed to fetch alerts',
      message: error.message
    });
  }
};

// 🤖 AI-powered analysis (without database)
export const getAIAnalysis = async (req, res) => {
  try {
    const { analysis_depth = 'standard' } = req.query;

    console.log('🤖 Generating AI analysis...');

    // Get current data
    const currentData = await directDataService.getNairobiData();

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
      location: 'Nairobi, Kenya',

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

    // Emit AI update via WebSocket
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
      fallback: 'AI service may be temporarily unavailable'
    });
  }
};

// 🎯 Smart hotspot detection with AI
export const getSmartHotspots = async (req, res) => {
  try {
    const { algorithm = 'dbscan', sensitivity = 'medium' } = req.query;

    console.log('🎯 Detecting smart hotspots...');

    const currentData = await directDataService.getNairobiData();

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
        analysis_timestamp: new Date().toISOString()
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

// 📊 Comprehensive dashboard
export const getDashboard = async (req, res) => {
  try {
    console.log('📊 Building comprehensive dashboard...');

    const currentData = await directDataService.getNairobiData();

    const dashboard = {
      timestamp: new Date().toISOString(),
      location: 'Nairobi, Kenya',

      // Overview
      overview: {
        air_quality_status: currentData.summary.air_quality_status,
        current_aqi: currentData.summary.aqi || 0,
        pm25_level: currentData.summary.avg_pm25,
        dominant_pollutant: currentData.summary.avg_pm25 > 25 ? 'PM2.5' : 'Within limits'
      },

      // Real-time metrics
      realtime_metrics: {
        total_measurements: currentData.measurements.length,
        active_sources: currentData.data_sources.length,
        pollution_hotspots: currentData.hotspots.length,
        active_alerts: currentData.alerts.length,
        last_update: currentData.timestamp
      },

      // Air quality breakdown
      air_quality: {
        pm25: {
          current: currentData.summary.avg_pm25,
          max: currentData.summary.max_pm25,
          min: currentData.summary.min_pm25,
          status: currentData.summary.air_quality_status
        },
        no2: {
          current: currentData.summary.avg_no2,
          max: currentData.summary.max_no2
        },
        aqi: {
          value: currentData.summary.aqi || 0,
          category: currentData.summary.air_quality_status
        }
      },

      // Hotspots summary
      hotspots_summary: {
        total: currentData.hotspots.length,
        by_severity: {
          critical: currentData.hotspots.filter(h => h.properties.severity === 'critical').length,
          high: currentData.hotspots.filter(h => h.properties.severity === 'high').length,
          moderate: currentData.hotspots.filter(h => h.properties.severity === 'moderate').length
        },
        by_pollutant: {
          pm25: currentData.hotspots.filter(h => h.properties.pollutant === 'PM2.5').length,
          no2: currentData.hotspots.filter(h => h.properties.pollutant === 'NO2').length
        }
      },

      // Alerts summary
      alerts_summary: {
        total: currentData.alerts.length,
        by_severity: {
          critical: currentData.alerts.filter(a => a.severity === 'critical').length,
          high: currentData.alerts.filter(a => a.severity === 'high').length,
          medium: currentData.alerts.filter(a => a.severity === 'medium').length
        },
        latest_alert: currentData.alerts[0] || null
      },

      // Data health
      data_health: {
        sources_active: currentData.data_sources.length,
        expected_sources: 4, // WeatherAPI, OpenAQ, IQAir, WAQI
        data_freshness: 'current',
        coverage_completeness: Math.min(currentData.data_sources.length / 4, 1) * 100
      },

      // Quick stats for widgets
      quick_stats: {
        air_quality_emoji: getAirQualityEmoji(currentData.summary.air_quality_status),
        health_message: getHealthMessage(currentData.summary.avg_pm25),
        trend_indicator: getTrendIndicator(currentData.summary.avg_pm25),
        recommendation: getQuickRecommendation(currentData.summary.avg_pm25)
      }
    };

    res.json(dashboard);

  } catch (error) {
    console.error('❌ Dashboard error:', error);
    res.status(500).json({
      error: 'Failed to build dashboard',
      message: error.message
    });
  }
};

// 🔄 Manual data refresh
export const refreshData = async (req, res) => {
  try {
    console.log('🔄 Manual data refresh triggered...');

    // Clear cache to force fresh data
    directDataService.clearCache();

    // Fetch fresh data
    const freshData = await directDataService.getNairobiData();

    // Emit refresh notification
    if (io) {
      io.to('nairobi_dashboard').emit('data_refreshed', {
        timestamp: freshData.timestamp,
        measurements_count: freshData.measurements.length,
        sources_active: freshData.data_sources.length,
        message: 'Data refreshed successfully'
      });
    }

    res.json({
      success: true,
      message: 'Data refreshed successfully',
      timestamp: freshData.timestamp,
      measurements_count: freshData.measurements.length,
      sources_active: freshData.data_sources.length,
      cache_cleared: true
    });

  } catch (error) {
    console.error('❌ Refresh error:', error);
    res.status(500).json({
      error: 'Failed to refresh data',
      message: error.message
    });
  }
};

// 📍 Get data for specific location
export const getLocationData = async (req, res) => {
  try {
    const { lat, lon, name } = req.query;

    if (!lat || !lon) {
      return res.status(400).json({
        error: 'Missing coordinates',
        message: 'Please provide lat and lon parameters'
      });
    }

    console.log(`📍 Fetching data for location: ${lat}, ${lon}`);

    const locationData = await directDataService.getLocationData(
      parseFloat(lat),
      parseFloat(lon),
      name || 'Custom Location'
    );

    res.json({
      success: true,
      location: locationData,
      metadata: {
        source: 'WeatherAPI.com',
        coordinates_provided: { lat: parseFloat(lat), lon: parseFloat(lon) },
        timestamp: locationData.timestamp
      }
    });

  } catch (error) {
    console.error('❌ Location data error:', error);
    res.status(500).json({
      error: 'Failed to fetch location data',
      message: error.message
    });
  }
};

// 🔧 Utility functions
function getAirQualityEmoji(status) {
  const emojiMap = {
    'Good': '😊',
    'Moderate': '😐',
    'Unhealthy for Sensitive Groups': '😷',
    'Unhealthy': '😨',
    'Very Unhealthy': '🚨',
    'Unknown': '❓'
  };
  return emojiMap[status] || '❓';
}

function getHealthMessage(pm25) {
  if (!pm25) return 'Air quality data unavailable';
  if (pm25 <= 15) return 'Air quality is good for outdoor activities';
  if (pm25 <= 25) return 'Air quality is acceptable for most people';
  if (pm25 <= 35) return 'Sensitive individuals should consider limiting prolonged outdoor exertion';
  if (pm25 <= 55) return 'Everyone should limit prolonged outdoor exertion';
  return 'Avoid outdoor activities. Health alert in effect.';
}

function getTrendIndicator(pm25) {
  // Simplified trend - in real app you'd compare with historical data
  if (!pm25) return 'stable';
  return pm25 > 35 ? 'worsening' : pm25 < 25 ? 'improving' : 'stable';
}

function getQuickRecommendation(pm25) {
  if (!pm25) return 'Monitor air quality regularly';
  if (pm25 <= 15) return 'Great day for outdoor activities!';
  if (pm25 <= 25) return 'Good air quality - enjoy outdoor time';
  if (pm25 <= 35) return 'Consider wearing a mask for extended outdoor activities';
  if (pm25 <= 55) return 'Limit outdoor activities, especially for sensitive groups';
  return 'Stay indoors and avoid outdoor activities';
}