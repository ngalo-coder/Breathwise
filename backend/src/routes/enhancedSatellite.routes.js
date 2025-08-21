// backend/src/routes/enhancedSatellite.routes.js
// Updated satellite routes with enhanced real data integration

import express from 'express';
import enhancedSatelliteService from '../services/enhancedSatelliteService.js';
import enhancedWeatherService from '../services/enhancedWeatherService.js';
import { io } from '../app.js';

const router = express.Router();

// 🌟 Get comprehensive Nairobi data (replaces /nairobi endpoint)
router.get('/nairobi', async (req, res) => {
  try {
    console.log('🛰️ Fetching comprehensive Nairobi satellite + weather data...');

    const comprehensiveData = await enhancedSatelliteService.getNairobiComprehensiveData();

    // Emit real-time update via WebSocket
    if (io) {
      io.to('nairobi_dashboard').emit('satellite_data_update', {
        timestamp: comprehensiveData.timestamp,
        hotspots_count: comprehensiveData.processed_data?.pollution_hotspots?.length || 0,
        alerts_count: comprehensiveData.processed_data?.alerts?.length || 0,
        air_quality_status: comprehensiveData.processed_data?.air_quality_summary?.overall_status || 'unknown',
        data_quality: comprehensiveData.processed_data?.data_fusion_summary?.data_quality || 'unknown'
      });
    }

    res.json({
      status: 'success',
      ...comprehensiveData
    });

  } catch (error) {
    console.error('❌ Comprehensive satellite data fetch error:', error);
    res.status(500).json({
      error: 'Failed to fetch comprehensive satellite data',
      message: error.message,
      fallback_available: true
    });
  }
});

// 🌟 Get enhanced pollution hotspots with multi-source detection
router.get('/hotspots', async (req, res) => {
  try {
    const {
      severity = 'moderate',
      sources = 'all',
      include_ground_truth = true,
      format = 'geojson'
    } = req.query;

    console.log(`🔥 Fetching enhanced pollution hotspots (severity: ${severity}, sources: ${sources})`);

    const comprehensiveData = await enhancedSatelliteService.getNairobiComprehensiveData();

    let hotspots = comprehensiveData.processed_data?.pollution_hotspots || [];

    // Filter by severity
    if (severity !== 'all') {
      const severityLevels = {
        'low': ['low'],
        'moderate': ['low', 'moderate'],
        'high': ['low', 'moderate', 'high'],
        'critical': ['low', 'moderate', 'high', 'critical']
      };

      const allowedSeverities = severityLevels[severity] || ['moderate', 'high', 'critical'];
      hotspots = hotspots.filter(h => allowedSeverities.includes(h.properties.severity));
    }

    // Filter by data source
    if (sources !== 'all') {
      hotspots = hotspots.filter(h => h.properties.source === sources);
    }

    // Add ground truth correlation if requested
    if (include_ground_truth === 'true') {
      hotspots = await enhanceHotspotsWithGroundTruth(hotspots, comprehensiveData);
    }

    const response = {
      type: 'FeatureCollection',
      features: hotspots,
      metadata: {
        total_hotspots: hotspots.length,
        severity_filter: severity,
        sources_filter: sources,
        data_sources: Object.keys(comprehensiveData.sources || {}),
        confidence_level: comprehensiveData.processed_data?.data_fusion_summary?.integration_confidence || 0,
        satellite_detections: hotspots.filter(h => h.properties.source === 'satellite').length,
        ground_confirmations: hotspots.filter(h => h.properties.source === 'ground_station').length,
        generated_at: new Date().toISOString()
      }
    };

    res.json(response);

  } catch (error) {
    console.error('❌ Enhanced hotspots fetch error:', error);
    res.status(500).json({
      error: 'Failed to fetch enhanced pollution hotspots',
      message: error.message
    });
  }
});

// 🌟 Get intelligent air quality alerts with context
router.get('/alerts', async (req, res) => {
  try {
    const {
      severity,
      include_recommendations = true,
      time_window = '24h'
    } = req.query;

    console.log(`🚨 Fetching intelligent alerts (severity: ${severity || 'all'})`);

    const comprehensiveData = await enhancedSatelliteService.getNairobiComprehensiveData();

    let alerts = comprehensiveData.processed_data?.alerts || [];

    // Filter by severity if specified
    if (severity) {
      alerts = alerts.filter(alert => alert.severity === severity);
    }

    // Filter by time window
    const timeWindowMs = parseTimeWindow(time_window);
    const cutoffTime = new Date(Date.now() - timeWindowMs);
    alerts = alerts.filter(alert => new Date(alert.timestamp) > cutoffTime);

    // Enhance alerts with recommendations if requested
    if (include_recommendations === 'true') {
      const recommendations = comprehensiveData.processed_data?.recommendations || [];
      alerts = alerts.map(alert => ({
        ...alert,
        related_recommendations: recommendations.filter(rec =>
          rec.priority === alert.severity || rec.type.includes(alert.type)
        ).slice(0, 3)
      }));
    }

    res.json({
      alerts,
      metadata: {
        total_alerts: alerts.length,
        severity_filter: severity || 'all',
        time_window,
        data_confidence: comprehensiveData.processed_data?.data_fusion_summary?.integration_confidence || 0,
        generated_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Intelligent alerts fetch error:', error);
    res.status(500).json({
      error: 'Failed to fetch intelligent alerts',
      message: error.message
    });
  }
});

// 🌟 Get AI-powered policy recommendations with impact analysis
router.get('/recommendations', async (req, res) => {
  try {
    const {
      priority_filter,
      include_impact_analysis = true,
      format = 'detailed'
    } = req.query;

    console.log('🤖 Fetching AI-powered policy recommendations...');

    const comprehensiveData = await enhancedSatelliteService.getNairobiComprehensiveData();

    let recommendations = comprehensiveData.processed_data?.recommendations || [];

    // Filter by priority if specified
    if (priority_filter) {
      recommendations = recommendations.filter(rec => rec.priority === priority_filter);
    }

    // Enhance with impact analysis if requested
    if (include_impact_analysis === 'true') {
      recommendations = await enhanceRecommendationsWithImpact(recommendations, comprehensiveData);
    }

    const response = {
      recommendations,
      metadata: {
        total_recommendations: recommendations.length,
        priority_filter: priority_filter || 'all',
        based_on: {
          pollution_hotspots: comprehensiveData.processed_data?.pollution_hotspots?.length || 0,
          air_quality_data: !!comprehensiveData.processed_data?.air_quality_summary,
          satellite_observations: comprehensiveData.sources?.satellite_no2?.measurements_count || 0,
          weather_correlation: !!comprehensiveData.sources?.weather_data
        },
        confidence_score: comprehensiveData.processed_data?.data_fusion_summary?.integration_confidence || 0,
        generated_at: new Date().toISOString()
      }
    };

    res.json(response);

  } catch (error) {
    console.error('❌ AI recommendations fetch error:', error);
    res.status(500).json({
      error: 'Failed to fetch AI recommendations',
      message: error.message
    });
  }
});

// 🌟 Get enhanced NO2 measurements with quality assessment
router.get('/no2', async (req, res) => {
  try {
    const {
      format = 'geojson',
      quality_threshold = 0.5,
      include_uncertainty = false
    } = req.query;

    console.log(`📡 Fetching enhanced NO2 measurements (format: ${format})`);

    const comprehensiveData = await enhancedSatelliteService.getNairobiComprehensiveData();
    const no2Data = comprehensiveData.sources?.satellite_no2;

    if (!no2Data || !no2Data.measurements) {
      return res.status(404).json({
        error: 'No NO2 satellite data available',
        message: 'Satellite observations not found for current time period',
        data_sources_attempted: Object.keys(comprehensiveData.sources || {})
      });
    }

    // Filter by quality threshold
    const qualityFilteredMeasurements = no2Data.measurements.filter(
      m => m.qa_value >= parseFloat(quality_threshold)
    );

    if (format === 'geojson') {
      const features = qualityFilteredMeasurements.map(measurement => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [measurement.longitude, measurement.latitude]
        },
        properties: {
          no2_tropospheric: measurement.no2_tropospheric,
          no2_ppb: measurement.no2_tropospheric * 2.69e10, // Conversion to ppb
          qa_value: measurement.qa_value,
          cloud_fraction: measurement.cloud_fraction,
          observation_time: measurement.observation_time,
          quality_flag: measurement.qa_value > 0.7 ? 'high' :
                       measurement.qa_value > 0.5 ? 'medium' : 'low',
          ...(include_uncertainty === 'true' && measurement.no2_tropospheric_uncertainty && {
            uncertainty: measurement.no2_tropospheric_uncertainty,
            uncertainty_percent: (measurement.no2_tropospheric_uncertainty / measurement.no2_tropospheric * 100).toFixed(1)
          })
        }
      }));

      res.json({
        type: 'FeatureCollection',
        features,
        metadata: {
          satellite: no2Data.satellite,
          product_type: no2Data.product_type,
          acquisition_time: no2Data.acquisition_time,
          measurements_count: features.length,
          total_available: no2Data.measurements.length,
          quality_threshold,
          quality_filtered: no2Data.measurements.length - features.length,
          average_qa: (features.reduce((sum, f) => sum + f.properties.qa_value, 0) / features.length).toFixed(3)
        }
      });

    } else {
      // Return raw measurements
      res.json({
        satellite: no2Data.satellite,
        product_type: no2Data.product_type,
        acquisition_time: no2Data.acquisition_time,
        measurements_count: qualityFilteredMeasurements.length,
        measurements: qualityFilteredMeasurements,
        quality_statistics: {
          avg_qa_value: (qualityFilteredMeasurements.reduce((sum, m) => sum + m.qa_value, 0) / qualityFilteredMeasurements.length).toFixed(3),
          high_quality_count: qualityFilteredMeasurements.filter(m => m.qa_value > 0.7).length,
          medium_quality_count: qualityFilteredMeasurements.filter(m => m.qa_value > 0.5 && m.qa_value <= 0.7).length
        }
      });
    }

  } catch (error) {
    console.error('❌ Enhanced NO2 data fetch error:', error);
    res.status(500).json({
      error: 'Failed to fetch enhanced NO2 data',
      message: error.message
    });
  }
});

// 🌟 Get comprehensive air quality summary with correlations
router.get('/summary', async (req, res) => {
  try {
    const { include_weather_correlation = true } = req.query;

    console.log('📊 Generating comprehensive air quality summary...');

    const comprehensiveData = await enhancedSatelliteService.getNairobiComprehensiveData();

    let weatherCorrelation = null;
    if (include_weather_correlation === 'true') {
      try {
        const weatherData = await enhancedWeatherService.getNairobiWeatherAndAirQuality();
        weatherCorrelation = await enhancedWeatherService.analyzeWeatherAirQualityCorrelation(weatherData.locations || []);
      } catch (weatherError) {
        console.warn('⚠️ Weather correlation analysis failed:', weatherError.message);
      }
    }

    const summary = {
      timestamp: comprehensiveData.timestamp,
      location: comprehensiveData.location,
      air_quality: comprehensiveData.processed_data?.air_quality_summary || {},
      pollution_sources: {
        satellite_hotspots: comprehensiveData.processed_data?.pollution_hotspots?.filter(
          h => h.properties.source === 'satellite'
        ).length || 0,
        ground_confirmed: comprehensiveData.processed_data?.pollution_hotspots?.filter(
          h => h.properties.source === 'ground_station'
        ).length || 0,
        total_sources_detected: comprehensiveData.processed_data?.pollution_hotspots?.length || 0
      },
      alerts: {
        critical: comprehensiveData.processed_data?.alerts?.filter(a => a.severity === 'critical').length || 0,
        high: comprehensiveData.processed_data?.alerts?.filter(a => a.severity === 'high').length || 0,
        moderate: comprehensiveData.processed_data?.alerts?.filter(a => a.severity === 'moderate').length || 0,
        total: comprehensiveData.processed_data?.alerts?.length || 0
      },
      recommendations: {
        available: comprehensiveData.processed_data?.recommendations?.length || 0,
        critical_priority: comprehensiveData.processed_data?.recommendations?.filter(r => r.priority === 'critical').length || 0,
        high_priority: comprehensiveData.processed_data?.recommendations?.filter(r => r.priority === 'high').length || 0
      },
      data_quality: comprehensiveData.processed_data?.data_fusion_summary || {},
      data_freshness: {
        satellite_data: comprehensiveData.sources?.satellite_no2?.acquisition_time,
        ground_data: getLatestGroundDataTime(comprehensiveData.sources),
        weather_data: comprehensiveData.sources?.weather_data?.timestamp
      },
      ...(weatherCorrelation && { weather_correlation: weatherCorrelation })
    };

    res.json(summary);

  } catch (error) {
    console.error('❌ Comprehensive summary fetch error:', error);
    res.status(500).json({
      error: 'Failed to fetch comprehensive air quality summary',
      message: error.message
    });
  }
});

// 🌟 Force refresh all data sources with progress tracking
router.post('/refresh', async (req, res) => {
  try {
    const { priority = 'normal', sources = 'all' } = req.body;

    console.log(`🔄 Forcing comprehensive data refresh (priority: ${priority}, sources: ${sources})...`);

    // Clear caches to force fresh data fetch
    enhancedSatelliteService.clearCache();

    // Emit refresh start event
    if (io) {
      io.to('nairobi_dashboard').emit('data_refresh_started', {
        timestamp: new Date().toISOString(),
        priority,
        sources,
        estimated_completion: new Date(Date.now() + 45000).toISOString() // 45 seconds
      });
    }

    // Fetch fresh data
    const refreshPromise = enhancedSatelliteService.getNairobiComprehensiveData();

    // Handle async refresh completion
    refreshPromise.then(freshData => {
      if (io) {
        io.to('nairobi_dashboard').emit('data_refresh_complete', {
          timestamp: freshData.timestamp,
          hotspots_count: freshData.processed_data?.pollution_hotspots?.length || 0,
          alerts_count: freshData.processed_data?.alerts?.length || 0,
          data_quality: freshData.processed_data?.data_fusion_summary?.data_quality || 'unknown',
          message: 'All data sources refreshed successfully'
        });
      }
    }).catch(error => {
      console.error('❌ Async refresh failed:', error);
      if (io) {
        io.to('nairobi_dashboard').emit('data_refresh_failed', {
          timestamp: new Date().toISOString(),
          error: error.message
        });
      }
    });

    res.json({
      message: 'Comprehensive data refresh initiated',
      priority,
      sources,
      cache_stats: enhancedSatelliteService.getCacheStats(),
      estimated_completion: new Date(Date.now() + 45000).toISOString(),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Refresh initialization error:', error);
    res.status(500).json({
      error: 'Failed to initiate data refresh',
      message: error.message
    });
  }
});

// 🌟 Get cache statistics and data source health
router.get('/cache/stats', async (req, res) => {
  try {
    const cacheStats = enhancedSatelliteService.getCacheStats();
    const healthCheck = await enhancedSatelliteService.healthCheck();

    res.json({
      cache_stats: cacheStats,
      cache_size: cacheStats.keys?.length || 0,
      last_update: cacheStats.keys?.includes('nairobi_comprehensive_data') ? 'Data cached' : 'No cached data',
      service_health: healthCheck,
      performance_metrics: {
        cache_hit_rate: cacheStats.stats?.hits / (cacheStats.stats?.hits + cacheStats.stats?.misses) || 0,
        cache_efficiency: cacheStats.keys?.length > 0 ? 'optimal' : 'cold'
      }
    });

  } catch (error) {
    console.error('❌ Cache stats error:', error);
    res.status(500).json({
      error: 'Failed to get cache statistics',
      message: error.message
    });
  }
});

// 🌟 Comprehensive health check for all satellite services
router.get('/health', async (req, res) => {
  try {
    const { detailed = false } = req.query;

    const healthCheck = await enhancedSatelliteService.healthCheck();

    let weatherHealth = null;
    if (detailed === 'true') {
      try {
        weatherHealth = await enhancedWeatherService.getServiceStatus();
      } catch (weatherError) {
        weatherHealth = { error: weatherError.message };
      }
    }

    const overallHealth = {
      status: healthCheck.overall_health,
      timestamp: new Date().toISOString(),
      services: {
        satellite_integration: {
          status: healthCheck.overall_health,
          services: healthCheck.services,
          data_fusion_capability: healthCheck.overall_health === 'good' ? 'operational' : 'limited'
        },
        ...(weatherHealth && { weather_integration: weatherHealth })
      },
      last_successful_fetch: null,
      cache_info: enhancedSatelliteService.getCacheStats(),
      performance_indicators: {
        data_sources_available: Object.values(healthCheck.services).filter(s => s.status === 'operational').length,
        total_data_sources: Object.keys(healthCheck.services).length,
        integration_confidence: calculateIntegrationConfidence(healthCheck.services)
      }
    };

    // Try to get sample data to verify system is working
    try {
      const testData = await enhancedSatelliteService.getNairobiComprehensiveData();
      overallHealth.last_successful_fetch = testData.timestamp;
      overallHealth.sample_data_points = {
        satellite_measurements: testData.sources?.satellite_no2?.measurements_count || 0,
        pollution_hotspots: testData.processed_data?.pollution_hotspots?.length || 0,
        active_alerts: testData.processed_data?.alerts?.length || 0
      };
    } catch (testError) {
      overallHealth.services.satellite_integration.status = 'degraded';
      overallHealth.error = testError.message;
    }

    const statusCode = overallHealth.status === 'good' ? 200 :
                      overallHealth.status === 'degraded' ? 206 : 503;

    res.status(statusCode).json(overallHealth);

  } catch (error) {
    console.error('❌ Comprehensive health check error:', error);
    res.status(503).json({
      status: 'unhealthy',
      error: 'Health check failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 🌟 Get data source comparison and validation
router.get('/validation', async (req, res) => {
  try {
    console.log('🔍 Performing data source validation and comparison...');

    const comprehensiveData = await enhancedSatelliteService.getNairobiComprehensiveData();

    const validation = {
      data_sources: {},
      cross_validation: {},
      quality_assessment: {},
      recommendations: []
    };

    // Validate each data source
    if (comprehensiveData.sources) {
      Object.entries(comprehensiveData.sources).forEach(([source, data]) => {
        validation.data_sources[source] = {
          status: data.status || 'unknown',
          data_points: getDataPointCount(data),
          quality: assessSourceQuality(data),
          last_update: getSourceLastUpdate(data)
        };
      });
    }

    // Cross-validate PM2.5 measurements between sources
    validation.cross_validation = performCrossValidation(comprehensiveData.sources);

    // Overall quality assessment
    validation.quality_assessment = {
      overall_score: calculateOverallQualityScore(validation.data_sources),
      reliability: assessDataReliability(validation.cross_validation),
      completeness: assessDataCompleteness(validation.data_sources)
    };

    // Generate recommendations for data quality improvement
    validation.recommendations = generateDataQualityRecommendations(validation);

    res.json({
      validation,
      timestamp: new Date().toISOString(),
      metadata: {
        validation_method: 'multi_source_cross_validation',
        confidence_level: 0.85
      }
    });

  } catch (error) {
    console.error('❌ Data validation error:', error);
    res.status(500).json({
      error: 'Failed to perform data validation',
      message: error.message
    });
  }
});

// 🔧 Helper Functions

async function enhanceHotspotsWithGroundTruth(hotspots, comprehensiveData) {
  return hotspots.map(hotspot => {
    // Add ground truth correlation
    const nearbyGroundStations = findNearbyGroundStations(
      hotspot.geometry.coordinates,
      comprehensiveData.sources
    );

    return {
      ...hotspot,
      properties: {
        ...hotspot.properties,
        ground_truth_correlation: nearbyGroundStations.length > 0 ? 'confirmed' : 'unconfirmed',
        nearby_ground_stations: nearbyGroundStations.length,
        validation_score: calculateValidationScore(hotspot, nearbyGroundStations)
      }
    };
  });
}

async function enhanceRecommendationsWithImpact(recommendations, comprehensiveData) {
  return recommendations.map(rec => ({
    ...rec,
    impact_analysis: {
      affected_hotspots: comprehensiveData.processed_data?.pollution_hotspots?.filter(
        h => h.properties.severity === 'high' || h.properties.severity === 'critical'
      ).length || 0,
      estimated_population_benefit: estimatePopulationBenefit(rec, comprehensiveData),
      environmental_impact_score: calculateEnvironmentalImpact(rec),
      implementation_feasibility: assessImplementationFeasibility(rec)
    }
  }));
}

function parseTimeWindow(timeWindow) {
  const value = parseInt(timeWindow);
  const unit = timeWindow.slice(-1);

  switch (unit) {
    case 'h': return value * 60 * 60 * 1000;
    case 'd': return value * 24 * 60 * 60 * 1000;
    case 'w': return value * 7 * 24 * 60 * 60 * 1000;
    default: return 24 * 60 * 60 * 1000; // Default 24 hours
  }
}

function getLatestGroundDataTime(sources) {
  const groundSources = ['openaq_data', 'iqair_data', 'waqi_data'];
  let latestTime = null;

  groundSources.forEach(source => {
    if (sources[source]?.stations) {
      sources[source].stations.forEach(station => {
        if (station.measurements) {
          station.measurements.forEach(measurement => {
            if (measurement.lastUpdated) {
              const measurementTime = new Date(measurement.lastUpdated);
              if (!latestTime || measurementTime > latestTime) {
                latestTime = measurementTime;
              }
            }
          });
        }
      });
    }
  });

  return latestTime?.toISOString() || null;
}

function calculateIntegrationConfidence(services) {
  const operationalCount = Object.values(services).filter(s => s.status === 'operational').length;
  const totalCount = Object.keys(services).length;
  return totalCount > 0 ? operationalCount / totalCount : 0;
}

function findNearbyGroundStations(coordinates, sources) {
  const [lon, lat] = coordinates;
  const nearby = [];
  const maxDistance = 0.05; // ~5km radius

  if (sources.openaq_data?.stations) {
    sources.openaq_data.stations.forEach(station => {
      if (station.coordinates) {
        const distance = calculateDistance(
          lat, lon,
          station.coordinates.latitude,
          station.coordinates.longitude
        );
        if (distance <= maxDistance) {
          nearby.push({
            source: 'OpenAQ',
            name: station.location,
            distance: distance * 111, // Convert to km
            measurements: station.measurements
          });
        }
      }
    });
  }

  return nearby;
}

function calculateDistance(lat1, lon1, lat2, lon2) {
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  return 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function calculateValidationScore(hotspot, nearbyStations) {
  if (nearbyStations.length === 0) return 0.3; // Low confidence without ground truth

  // Check if nearby stations confirm high pollution
  const confirmatoryStations = nearbyStations.filter(station => {
    const pm25Measurement = station.measurements.find(m => m.parameter === 'pm25');
    return pm25Measurement && pm25Measurement.value > 35;
  });

  return Math.min(0.5 + (confirmatoryStations.length * 0.3), 1.0);
}

function estimatePopulationBenefit(recommendation, comprehensiveData) {
  // Simplified population benefit estimation
  const hotspotCount = comprehensiveData.processed_data?.pollution_hotspots?.length || 0;
  const basePopulation = 4500000; // Nairobi metro area

  if (recommendation.priority === 'critical') {
    return Math.floor(basePopulation * 0.3); // 30% of population
  } else if (recommendation.priority === 'high') {
    return Math.floor(basePopulation * 0.2); // 20% of population
  } else {
    return Math.floor(basePopulation * 0.1); // 10% of population
  }
}

function calculateEnvironmentalImpact(recommendation) {
  // Simplified environmental impact scoring (0-1 scale)
  const impactFactors = {
    'emergency_policy': 0.9,
    'traffic_management': 0.7,
    'industrial_monitoring': 0.8,
    'public_health': 0.6
  };

  return impactFactors[recommendation.type] || 0.5;
}

function assessImplementationFeasibility(recommendation) {
  // Simplified feasibility assessment
  const feasibilityFactors = {
    'critical': 0.8, // High urgency, likely to be implemented
    'high': 0.7,
    'medium': 0.5,
    'low': 0.3
  };

  return feasibilityFactors[recommendation.priority] || 0.5;
}

function getDataPointCount(data) {
  if (data.measurements) return data.measurements.length;
  if (data.stations) return data.stations.length;
  if (data.locations) return data.locations.length;
  return 0;
}

function assessSourceQuality(data) {
  if (data.quality) return data.quality;
  if (data.data_quality) return data.data_quality;
  if (data.status === 'success') return 'good';
  return 'unknown';
}

function getSourceLastUpdate(data) {
  if (data.timestamp) return data.timestamp;
  if (data.acquisition_time) return data.acquisition_time;
  return new Date().toISOString();
}

function performCrossValidation(sources) {
  const validation = {
    pm25_correlation: 'unknown',
    no2_correlation: 'unknown',
    temperature_correlation: 'unknown',
    consistency_score: 0
  };

  // Extract PM2.5 values from different sources
  const pm25Sources = [];

  if (sources.openaq_data?.stations) {
    const pm25Values = sources.openaq_data.stations
      .flatMap(s => s.measurements)
      .filter(m => m.parameter === 'pm25')
      .map(m => m.value);
    if (pm25Values.length > 0) {
      pm25Sources.push({
        source: 'OpenAQ',
        values: pm25Values,
        avg: pm25Values.reduce((sum, val) => sum + val, 0) / pm25Values.length
      });
    }
  }

  if (sources.weather_data?.locations) {
    const pm25Values = sources.weather_data.locations
      .map(l => l.air_quality?.pm25)
      .filter(pm25 => pm25 != null);
    if (pm25Values.length > 0) {
      pm25Sources.push({
        source: 'WeatherAPI',
        values: pm25Values,
        avg: pm25Values.reduce((sum, val) => sum + val, 0) / pm25Values.length
      });
    }
  }

  // Calculate correlation if we have multiple sources
  if (pm25Sources.length >= 2) {
    const avgDifference = Math.abs(pm25Sources[0].avg - pm25Sources[1].avg);
    validation.pm25_correlation = avgDifference < 10 ? 'good' :
                                 avgDifference < 20 ? 'moderate' : 'poor';
    validation.consistency_score = Math.max(0, 1 - (avgDifference / 50));
  }

  return validation;
}

function calculateOverallQualityScore(dataSources) {
  const sources = Object.values(dataSources);
  if (sources.length === 0) return 0;

  const qualityScores = sources.map(source => {
    switch (source.quality) {
      case 'high': case 'real': case 'premium': return 1.0;
      case 'good': case 'medium': return 0.8;
      case 'moderate': case 'simulated_realistic': return 0.6;
      case 'low': case 'fallback': return 0.3;
      default: return 0.1;
    }
  });

  return qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length;
}

function assessDataReliability(crossValidation) {
  if (crossValidation.consistency_score > 0.8) return 'high';
  if (crossValidation.consistency_score > 0.6) return 'medium';
  if (crossValidation.consistency_score > 0.3) return 'low';
  return 'poor';
}

function assessDataCompleteness(dataSources) {
  const expectedSources = ['satellite_no2', 'openaq_data', 'weather_data'];
  const availableSources = Object.keys(dataSources).filter(
    source => dataSources[source].status === 'success'
  );

  const completeness = availableSources.length / expectedSources.length;

  if (completeness >= 0.8) return 'complete';
  if (completeness >= 0.6) return 'mostly_complete';
  if (completeness >= 0.4) return 'partial';
  return 'limited';
}

function generateDataQualityRecommendations(validation) {
  const recommendations = [];

  if (validation.quality_assessment.overall_score < 0.7) {
    recommendations.push({
      type: 'data_quality_improvement',
      priority: 'high',
      message: 'Overall data quality is below optimal threshold',
      action: 'Register for additional API keys to improve data coverage'
    });
  }

  if (validation.quality_assessment.reliability === 'poor') {
    recommendations.push({
      type: 'data_reliability',
      priority: 'high',
      message: 'Cross-validation shows poor data consistency',
      action: 'Investigate data source discrepancies and calibration'
    });
  }

  if (validation.quality_assessment.completeness === 'limited') {
    recommendations.push({
      type: 'data_coverage',
      priority: 'medium',
      message: 'Limited data source coverage detected',
      action: 'Enable additional data sources for better coverage'
    });
  }

  return recommendations;
}

export default router;