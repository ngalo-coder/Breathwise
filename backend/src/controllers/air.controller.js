import { io } from '../app.js';
import dataService from '../services/dataService.js';

export const getHotspots = async (req, res) => {
  try {
    console.log('Fetching hotspots from database');
    
    const hotspots = await dataService.getNairobiHotspots();

    res.json(hotspots);

  } catch (error) {
    console.error('Hotspots error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch hotspots',
      message: error.message 
    });
  }
};

export const getNairobiZones = async (req, res) => {
  try {
    console.log('Fetching Nairobi zones from database');
    
    const zones = await dataService.getNairobiMonitoringZones();

    res.json(zones);

  } catch (error) {
    console.error('Nairobi zones error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch Nairobi monitoring zones',
      message: error.message 
    });
  }
};

export const getMeasurements = async (req, res) => {
  try {
    console.log('Fetching measurements from database');

    const zones = await dataService.getNairobiMonitoringZones();
    
    // Convert zones to measurements format
    const measurementsResponse = {
      type: 'FeatureCollection',
      features: zones.features.map(zone => ({
        ...zone,
        properties: {
          ...zone.properties,
          pm10: zone.properties.pm25 ? Math.round((zone.properties.pm25 * 1.8) * 10) / 10 : null,
          no2: zone.properties.pm25 ? Math.round((zone.properties.pm25 * 0.7) * 10) / 10 : null,
          so2: zone.properties.pm25 ? Math.round((zone.properties.pm25 * 0.3) * 10) / 10 : null,
          o3: zone.properties.pm25 ? Math.round((zone.properties.pm25 * 0.5) * 10) / 10 : null
        }
      })),
      metadata: {
        total_measurements: zones.features.length,
        query_params: req.query,
        generated_at: new Date().toISOString(),
        bbox: req.query.bbox || [36.70, -1.40, 37.12, -1.15]
      }
    };

    res.json(measurementsResponse);

  } catch (error) {
    console.error('Measurements error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch measurements',
      message: error.message 
    });
  }
};

export const triggerAnalysis = async (req, res) => {
  try {
    console.log('Triggering analysis');
    
    const analysisId = `analysis_${Date.now()}`;
    
    if (io) {
      io.to('nairobi_dashboard').emit('analysis_started', {
        analysis_id: analysisId,
        status: 'processing',
        timestamp: new Date().toISOString()
      });

      setTimeout(() => {
        io.to('nairobi_dashboard').emit('analysis_complete', {
          analysis_id: analysisId,
          results: {
            hotspots_found: 0,
            priority_zones: 0,
            critical_areas: [],
            recommended_actions: []
          },
          status: 'completed',
          timestamp: new Date().toISOString()
        });
      }, 2000);
    }

    res.json({
      analysis_id: analysisId,
      status: 'started',
      message: 'Hotspot analysis initiated for Nairobi region',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Analysis trigger error:', error);
    res.status(500).json({ 
      error: 'Failed to trigger analysis',
      message: error.message 
    });
  }
};