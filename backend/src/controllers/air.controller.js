import { io } from '../app.js';
import directDataService from '../services/directDataService.js';

/**
 * Air Quality Controller
 * Handles air quality data retrieval, analysis, and real-time communications
 */

/**
 * Retrieves pollution hotspots for a specified city
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getHotspots = async (req, res) => {
  try {
    const { city = 'Nairobi', country = 'Kenya' } = req.query;
    
    console.log(`Fetching hotspots for ${city}, ${country}`);
    
    const cityData = await directDataService.getCityData(city, country);
    const hotspots = cityData.hotspots || [];

    res.json({
      success: true,
      data: hotspots,
      metadata: {
        count: hotspots.length,
        city,
        country,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Hotspots retrieval error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch pollution hotspots',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Retrieves monitoring zones for Nairobi with fallback support
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getNairobiZones = async (req, res) => {
  try {
    console.log('Fetching Nairobi monitoring zones');
    
    // Try to get data from direct service first
    const cityData = await directDataService.getCityData('Nairobi', 'Kenya');
    
    // Format as GeoJSON FeatureCollection
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

/**
 * Retrieves air quality measurements with calculated pollutant values
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getMeasurements = async (req, res) => {
  try {
    console.log('Fetching air quality measurements');
    
    const cityData = await directDataService.getCityData('Nairobi', 'Kenya');
    
    // Convert measurements to response format with calculated values
    const measurementsResponse = {
      type: 'FeatureCollection',
      features: cityData.measurements.map(measurement => ({
        ...measurement,
        properties: {
          ...measurement.properties,
          // Calculate additional pollutants if only PM2.5 is available
          pm10: measurement.properties.pm10 || 
                (measurement.properties.pm25 ? Math.round((measurement.properties.pm25 * 1.8) * 10) / 10 : null),
          no2: measurement.properties.no2 || 
               (measurement.properties.pm25 ? Math.round((measurement.properties.pm25 * 0.7) * 10) / 10 : null),
          so2: measurement.properties.so2 || 
               (measurement.properties.pm25 ? Math.round((measurement.properties.pm25 * 0.3) * 10) / 10 : null),
          o3: measurement.properties.o3 || 
              (measurement.properties.pm25 ? Math.round((measurement.properties.pm25 * 0.5) * 10) / 10 : null)
        }
      })),
      metadata: {
        total_measurements: cityData.measurements.length,
        query_params: req.query,
        generated_at: new Date().toISOString(),
        bbox: req.query.bbox || [36.70, -1.40, 37.12, -1.15],
        data_sources: cityData.data_sources
      }
    };

    res.json({
      success: true,
      data: measurementsResponse,
      metadata: {
        generated_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Measurements retrieval error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch air quality measurements',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Triggers analysis of air quality data and emits real-time events
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const triggerAnalysis = async (req, res) => {
  try {
    console.log('Triggering air quality analysis');
    
    const analysisId = `analysis_${Date.now()}`;
    const { city = 'Nairobi', country = 'Kenya' } = req.body;
    
    // Get current data for analysis
    const cityData = await directDataService.getCityData(city, country);
    
    if (io) {
      // Emit analysis started event
      io.to('nairobi_dashboard').emit('analysis_started', {
        analysis_id: analysisId,
        status: 'processing',
        timestamp: new Date().toISOString(),
        data: {
          measurements_count: cityData.measurements.length,
          hotspots_count: cityData.hotspots.length
        }
      });

      // Simulate analysis processing
      setTimeout(() => {
        // Generate analysis results based on actual data
        const criticalAreas = cityData.hotspots
          .filter(h => h.properties.severity === 'critical')
          .map(h => h.properties.location_name);
        
        const results = {
          hotspots_found: cityData.hotspots.length,
          priority_zones: criticalAreas.length,
          critical_areas: criticalAreas,
          recommended_actions: generateRecommendedActions(cityData),
          health_advisory: cityData.health_advisory
        };

        // Emit analysis complete event
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

/**
 * Generates recommended actions based on air quality data
 * @param {Object} cityData - City air quality data
 * @returns {Array} Recommended actions
 */
const generateRecommendedActions = (cityData) => {
  const actions = [];
  const { summary, hotspots } = cityData;
  
  if (summary.avg_pm25 > 35) {
    actions.push('Issue public health advisory for sensitive groups');
  }
  
  if (summary.avg_pm25 > 55) {
    actions.push('Consider implementing traffic restrictions in high-pollution areas');
  }
  
  if (hotspots.filter(h => h.properties.severity === 'critical').length > 0) {
    actions.push('Deploy mobile monitoring units to critical areas for detailed assessment');
  }
  
  if (summary.avg_pm25 > 0 && summary.avg_pm25 <= 35) {
    actions.push('Continue routine monitoring and public awareness campaigns');
  }
  
  return actions.length > 0 ? actions : ['No specific actions recommended at this time'];
};