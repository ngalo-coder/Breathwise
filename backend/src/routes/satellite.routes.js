// backend/src/routes/satellite.routes.js
import express from 'express';
import enhancedSatelliteService from '../services/enhancedSatelliteService.js';
import { io } from '../app.js';

const router = express.Router();

// Get comprehensive Nairobi satellite air quality data
router.get('/nairobi', async (req, res) => {
  try {
    console.log('🛰️ Fetching Nairobi satellite data...');

    const satelliteData = await enhancedSatelliteService.getNairobiComprehensiveData();

    // Emit real-time update via WebSocket
    if (io) {
      io.to('nairobi_dashboard').emit('satellite_data_update', {
        timestamp: satelliteData.timestamp,
        hotspots_count: satelliteData.processed_data.pollution_hotspots.length,
        alerts_count: satelliteData.processed_data.alerts.length,
        air_quality_status: satelliteData.processed_data.air_quality_summary.overall_status
      });
    }

    res.json({
      status: 'success',
      ...satelliteData
    });

  } catch (error) {
    console.error('❌ Satellite data fetch error:', error);
    res.status(500).json({
      error: 'Failed to fetch satellite data',
      message: error.message
    });
  }
});

// Get pollution hotspots detected by satellite
router.get('/hotspots', async (req, res) => {
  try {
    const { severity = 'moderate' } = req.query;

    const satelliteData = await enhancedSatelliteService.getNairobiComprehensiveData();

    // Filter hotspots by severity
    let hotspots = satelliteData.processed_data.pollution_hotspots;

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

    res.json({
      type: 'FeatureCollection',
      features: hotspots,
      metadata: {
        total_hotspots: hotspots.length,
        severity_filter: severity,
        data_sources: ['Sentinel-5P', 'Ground Stations', 'Weather API'],
        generated_at: satelliteData.timestamp
      }
    });

  } catch (error) {
    console.error('❌ Hotspots fetch error:', error);
    res.status(500).json({
      error: 'Failed to fetch pollution hotspots',
      message: error.message
    });
  }
});

// Get active air quality alerts
router.get('/alerts', async (req, res) => {
  try {
    const { severity } = req.query;

    const satelliteData = await enhancedSatelliteService.getNairobiComprehensiveData();

    let alerts = satelliteData.processed_data.alerts;

    // Filter by severity if specified
    if (severity) {
      alerts = alerts.filter(alert => alert.severity === severity);
    }

    res.json({
      alerts,
      metadata: {
        total_alerts: alerts.length,
        severity_filter: severity || 'all',
        generated_at: satelliteData.timestamp
      }
    });

  } catch (error) {
    console.error('❌ Alerts fetch error:', error);
    res.status(500).json({
      error: 'Failed to fetch alerts',
      message: error.message
    });
  }
});

// Get AI-generated policy recommendations
router.get('/recommendations', async (req, res) => {
  try {
    const satelliteData = await enhancedSatelliteService.getNairobiComprehensiveData();

    const recommendations = satelliteData.processed_data.recommendations;

    res.json({
      recommendations,
      metadata: {
        total_recommendations: recommendations.length,
        based_on: {
          pollution_hotspots: satelliteData.processed_data.pollution_hotspots.length,
          air_quality_data: !!satelliteData.processed_data.air_quality_summary,
          satellite_observations: satelliteData.sources.satellite_no2?.measurements_count || 0
        },
        generated_at: satelliteData.timestamp
      }
    });

  } catch (error) {
    console.error('❌ Recommendations fetch error:', error);
    res.status(500).json({
      error: 'Failed to fetch recommendations',
      message: error.message
    });
  }
});

// Get satellite NO2 measurements in GeoJSON format
router.get('/no2', async (req, res) => {
  try {
    const { format = 'geojson' } = req.query;

    const satelliteData = await enhancedSatelliteService.getNairobiComprehensiveData();
    const no2Data = satelliteData.sources.satellite_no2;

    if (!no2Data || !no2Data.measurements) {
      return res.status(404).json({
        error: 'No NO2 satellite data available',
        message: 'Satellite observations not found for current time period'
      });
    }

    if (format === 'geojson') {
      // Return as GeoJSON features
      const features = no2Data.measurements.map(measurement => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [measurement.longitude, measurement.latitude]
        },
        properties: {
          no2_tropospheric: measurement.no2_tropospheric,
          qa_value: measurement.qa_value,
          cloud_fraction: measurement.cloud_fraction,
          observation_time: measurement.observation_time,
          // Convert to more familiar units
          no2_ppb: measurement.no2_tropospheric * 2.69e10, // Rough conversion to ppb
          quality_flag: measurement.qa_value > 0.7 ? 'good' : measurement.qa_value > 0.5 ? 'moderate' : 'poor'
        }
      }));

      res.json({
        type: 'FeatureCollection',
        features,
        metadata: {
          satellite: no2Data.satellite,
          product_type: no2Data.product_type,
          acquisition_time: no2Data.acquisition_time,
          measurements_count: features.length
        }
      });

    } else {
      // Return raw measurements
      res.json({
        satellite: no2Data.satellite,
        product_type: no2Data.product_type,
        acquisition_time: no2Data.acquisition_time,
        measurements_count: no2Data.measurements.length,
        measurements: no2Data.measurements
      });
    }

  } catch (error) {
    console.error('❌ NO2 data fetch error:', error);
    res.status(500).json({
      error: 'Failed to fetch NO2 data',
      message: error.message
    });
  }
});

// Get comprehensive air quality summary
router.get('/summary', async (req, res) => {
  try {
    const satelliteData = await enhancedSatelliteService.getNairobiComprehensiveData();

    const summary = {
      timestamp: satelliteData.timestamp,
      location: satelliteData.location,
      air_quality: satelliteData.processed_data.air_quality_summary,
      pollution_sources: {
        satellite_hotspots: satelliteData.processed_data.pollution_hotspots.filter(
          h => h.properties.source === 'satellite'
        ).length,
        ground_stations: satelliteData.sources.ground_stations?.stations_count || 0
      },
      alerts: {
        critical: satelliteData.processed_data.alerts.filter(a => a.severity === 'critical').length,
        high: satelliteData.processed_data.alerts.filter(a => a.severity === 'high').length,
        moderate: satelliteData.processed_data.alerts.filter(a => a.severity === 'moderate').length
      },
      recommendations_available: satelliteData.processed_data.recommendations.length,
      data_freshness: {
        satellite_data: satelliteData.sources.satellite_no2?.acquisition_time,
        ground_data: satelliteData.sources.ground_stations?.stations?.[0]?.measurements?.[0]?.lastUpdated,
        weather_data: satelliteData.timestamp
      }
    };

    res.json(summary);

  } catch (error) {
    console.error('❌ Summary fetch error:', error);
    res.status(500).json({
      error: 'Failed to fetch air quality summary',
      message: error.message
    });
  }
});

// Force refresh satellite data (clear cache)
router.post('/refresh', async (req, res) => {
  try {
    console.log('🔄 Forcing satellite data refresh...');

    // Clear cache to force fresh data fetch
    enhancedSatelliteService.clearCache();

    // Fetch fresh data
    const freshData = await enhancedSatelliteService.getNairobiComprehensiveData();

    // Emit real-time update
    if (io) {
      io.to('nairobi_dashboard').emit('satellite_data_refreshed', {
        timestamp: freshData.timestamp,
        hotspots_count: freshData.processed_data.pollution_hotspots.length,
        message: 'Satellite data refreshed successfully'
      });
    }

    res.json({
      message: 'Satellite data refreshed successfully',
      timestamp: freshData.timestamp,
      cache_stats: enhancedSatelliteService.getCacheStats(),
      hotspots_detected: freshData.processed_data.pollution_hotspots.length,
      alerts_generated: freshData.processed_data.alerts.length
    });

  } catch (error) {
    console.error('❌ Refresh error:', error);
    res.status(500).json({
      error: 'Failed to refresh satellite data',
      message: error.message
    });
  }
});

// Get cache statistics (for debugging/monitoring)
router.get('/cache/stats', async (req, res) => {
  try {
    const stats = enhancedSatelliteService.getCacheStats();

    res.json({
      cache_stats: stats,
      cache_size: stats.keys.length,
      last_update: stats.keys.includes('nairobi_satellite_data') ? 'Data cached' : 'No cached data'
    });

  } catch (error) {
    console.error('❌ Cache stats error:', error);
    res.status(500).json({
      error: 'Failed to get cache statistics',
      message: error.message
    });
  }
});

// Health check for satellite services
router.get('/health', async (req, res) => {
  try {
    const healthCheck = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        cache: 'operational',
        satellite_api: 'operational',
        data_processing: 'operational'
      },
      last_successful_fetch: null,
      cache_info: enhancedSatelliteService.getCacheStats()
    };

    // Try to get cached data to verify system is working
    try {
      const testData = await enhancedSatelliteService.getNairobiComprehensiveData();
      healthCheck.last_successful_fetch = testData.timestamp;
      healthCheck.data_points = {
        satellite_measurements: testData.sources.satellite_no2?.measurements_count || 0,
        pollution_hotspots: testData.processed_data.pollution_hotspots.length,
        active_alerts: testData.processed_data.alerts.length
      };
    } catch (testError) {
      healthCheck.services.satellite_api = 'degraded';
      healthCheck.status = 'degraded';
      healthCheck.error = testError.message;
    }

    const statusCode = healthCheck.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(healthCheck);

  } catch (error) {
    console.error('❌ Health check error:', error);
    res.status(503).json({
      status: 'unhealthy',
      error: 'Health check failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

export default router;