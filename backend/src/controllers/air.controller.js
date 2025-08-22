import directDataService from '../services/directDataService.js';
import { io } from '../websocket/realtime.js';
import {
  getAirQualityEmoji,
  getHealthMessage,
  getTrendIndicator,
  getQuickRecommendation,
  generateRecommendedActions
} from '../utils/airQualityUtils.js';

// 🌍 Get comprehensive city air quality data
export const getCityData = async (req, res) => {
  try {
    const { city = 'Nairobi', country = 'Kenya' } = req.params;
    console.log(`🌍 Fetching comprehensive ${city}, ${country} data...`);
    const data = await directDataService.getCityData(city, country);

    if (io) {
      const roomName = `${city.toLowerCase()}_dashboard`;
      io.to(roomName).emit('data_update', {
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
    console.error('❌ City data error:', error);
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
    const { city = 'Nairobi', country = 'Kenya' } = req.params;
    const { format = 'geojson', bbox, pollutants } = req.query;
    console.log(`📊 Fetching ${city}, ${country} air quality measurements...`);
    const data = await directDataService.getCityData(city, country);
    let measurements = data.measurements;

    if (pollutants) {
      const requestedPollutants = pollutants.split(',');
      measurements = measurements.filter(m => {
        return requestedPollutants.some(pollutant =>
          m.properties[pollutant] != null
        );
      });
    }

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
        features: measurements.map(measurement => ({
          ...measurement,
          properties: {
            ...measurement.properties,
            pm10: measurement.properties.pm10 || (measurement.properties.pm25 ? Math.round((measurement.properties.pm25 * 1.8) * 10) / 10 : null),
            no2: measurement.properties.no2 || (measurement.properties.pm25 ? Math.round((measurement.properties.pm25 * 0.7) * 10) / 10 : null),
            so2: measurement.properties.so2 || (measurement.properties.pm25 ? Math.round((measurement.properties.pm25 * 0.3) * 10) / 10 : null),
            o3: measurement.properties.o3 || (measurement.properties.pm25 ? Math.round((measurement.properties.pm25 * 0.5) * 10) / 10 : null)
          }
        })),
        metadata: {
          total_measurements: measurements.length,
          bbox: bbox || `${city} area`,
          pollutants_included: pollutants || 'all available',
          data_sources: data.data_sources,
          generated_at: data.timestamp
        }
      });
    } else {
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
    const { city = 'Nairobi', country = 'Kenya' } = req.params;
    const { severity = 'moderate', format = 'geojson' } = req.query;
    console.log(`🔥 Fetching pollution hotspots for ${city}, ${country}...`);
    const data = await directDataService.getCityData(city, country);
    let hotspots = data.hotspots;

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
          data_sources: data.data_sources,
          location: `${city}, ${country}`
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
          generated_at: data.timestamp,
          location: `${city}, ${country}`
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
    const { city = 'Nairobi', country = 'Kenya' } = req.params;
    const { severity, limit = 20 } = req.query;
    console.log(`🚨 Fetching active alerts for ${city}, ${country}...`);
    const data = await directDataService.getCityData(city, country);
    let alerts = data.alerts;

    if (severity) {
      alerts = alerts.filter(alert => alert.severity === severity);
    }
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
        alert_types: [...new Set(alerts.map(a => a.type))],
        location: `${city}, ${country}`
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

// 📊 Comprehensive dashboard
export const getDashboard = async (req, res) => {
  try {
    const { city = 'Nairobi', country = 'Kenya' } = req.params;
    console.log(`📊 Building comprehensive dashboard for ${city}, ${country}...`);
    const currentData = await directDataService.getCityData(city, country);

    const dashboard = {
      timestamp: new Date().toISOString(),
      location: `${city}, ${country}`,
      overview: {
        air_quality_status: currentData.summary.air_quality_status,
        current_aqi: currentData.summary.aqi || 0,
        pm25_level: currentData.summary.avg_pm25,
        dominant_pollutant: currentData.summary.avg_pm25 > 25 ? 'PM2.5' : 'Within limits'
      },
      realtime_metrics: {
        total_measurements: currentData.measurements.length,
        active_sources: currentData.data_sources.length,
        pollution_hotspots: currentData.hotspots.length,
        active_alerts: currentData.alerts.length,
        last_update: currentData.timestamp
      },
      air_quality: {
        pm25: { current: currentData.summary.avg_pm25, max: currentData.summary.max_pm25, min: currentData.summary.min_pm25, status: currentData.summary.air_quality_status },
        no2: { current: currentData.summary.avg_no2, max: currentData.summary.max_no2 },
        aqi: { value: currentData.summary.aqi || 0, category: currentData.summary.air_quality_status }
      },
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
      alerts_summary: {
        total: currentData.alerts.length,
        by_severity: {
          critical: currentData.alerts.filter(a => a.severity === 'critical').length,
          high: currentData.alerts.filter(a => a.severity === 'high').length,
          medium: currentData.alerts.filter(a => a.severity === 'medium').length
        },
        latest_alert: currentData.alerts[0] || null
      },
      data_health: {
        sources_active: currentData.data_sources.length,
        expected_sources: 3,
        data_freshness: 'current',
        coverage_completeness: Math.min(currentData.data_sources.length / 3, 1) * 100
      },
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
    const { city = 'Nairobi', country = 'Kenya' } = req.params;
    console.log(`🔄 Manual data refresh triggered for ${city}, ${country}...`);
    directDataService.clearCache();
    const freshData = await directDataService.getCityData(city, country);

    if (io) {
      const roomName = `${city.toLowerCase()}_dashboard`;
      io.to(roomName).emit('data_refreshed', {
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
      return res.status(400).json({ error: 'Missing coordinates', message: 'Please provide lat and lon parameters' });
    }
    console.log(`📍 Fetching data for location: ${lat}, ${lon}`);
    const locationData = await directDataService.getLocationData(parseFloat(lat), parseFloat(lon), name || 'Custom Location');
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

// Retrieves monitoring zones for Nairobi
export const getNairobiZones = async (req, res) => {
  try {
    console.log('Fetching Nairobi monitoring zones');
    const cityData = await directDataService.getCityData('Nairobi', 'Kenya');
    const zones = {
      type: 'FeatureCollection',
      features: cityData.measurements.map(measurement => ({
        type: 'Feature',
        geometry: measurement.geometry,
        properties: {
          id: measurement.id,
          name: measurement.properties.name,
          source: measurement.properties.source,
          pm25: measurement.properties.pm25,
          quality: measurement.properties.quality,
          timestamp: measurement.properties.timestamp
        }
      }))
    };
    res.json({
      success: true,
      data: zones,
      metadata: {
        count: zones.features.length,
        generated_at: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Nairobi zones retrieval error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch Nairobi monitoring zones',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

// Triggers analysis of air quality data
export const triggerAnalysis = async (req, res) => {
  try {
    console.log('Triggering air quality analysis');
    const analysisId = `analysis_${Date.now()}`;
    const { city = 'Nairobi', country = 'Kenya' } = req.body;
    const cityData = await directDataService.getCityData(city, country);

    if (io) {
      io.to('nairobi_dashboard').emit('analysis_started', {
        analysis_id: analysisId,
        status: 'processing',
        timestamp: new Date().toISOString(),
        data: {
          measurements_count: cityData.measurements.length,
          hotspots_count: cityData.hotspots.length
        }
      });

      setTimeout(() => {
        const criticalAreas = cityData.hotspots.filter(h => h.properties.severity === 'critical').map(h => h.properties.location_name);
        const results = {
          hotspots_found: cityData.hotspots.length,
          priority_zones: criticalAreas.length,
          critical_areas: criticalAreas,
          recommended_actions: generateRecommendedActions(cityData),
          health_advisory: cityData.health_advisory
        };
        io.to('nairobi_dashboard').emit('analysis_complete', {
          analysis_id: analysisId,
          results: results,
          status: 'completed',
          timestamp: new Date().toISOString()
        });
      }, 2000);
    }

    res.json({
      success: true,
      analysis_id: analysisId,
      status: 'started',
      message: `Air quality analysis initiated for ${city}, ${country}`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Analysis trigger error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to trigger analysis',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
};
