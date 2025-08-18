import db from '../config/database.js';
import dataService from '../services/dataService.js';
import { io } from '../app.js';

export const getHotspots = async (req, res) => {
  const { bbox } = req.query; // Expected format: "minx,miny,maxx,maxy"
  
  try {
    // Parse bounding box if provided
    let bboxArray = null;
    if (bbox) {
      bboxArray = bbox.split(',').map(Number);
      if (bboxArray.length !== 4 || bboxArray.some(isNaN)) {
        return res.status(400).json({ 
          error: 'Invalid bounding box format',
          format: 'bbox=minx,miny,maxx,maxy'
        });
      }
    }

    // Get hotspots from data service
    const hotspots = await dataService.getNairobiHotspots(bboxArray);
    res.json(hotspots);

  } catch (error) {
    console.error('Hotspots query error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch hotspots',
      message: error.message 
    });
  }
};

export const getMeasurements = async (req, res) => {
  const { 
    bbox, 
    start_time, 
    end_time, 
    source_type,
    limit = 1000 
  } = req.query;

  try {
    let query = `
      SELECT 
        ST_AsGeoJSON(geom)::json AS geometry,
        pm25, pm10, no2, so2,
        source_type,
        recorded_at,
        quality_flag
      FROM air_measurements 
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 0;

    if (bbox) {
      const bboxArray = bbox.split(',').map(Number);
      query += ` AND geom && ST_MakeEnvelope($${++paramCount}, $${++paramCount}, $${++paramCount}, $${++paramCount}, 4326)`;
      params.push(...bboxArray);
    }

    if (start_time) {
      query += ` AND recorded_at >= $${++paramCount}`;
      params.push(start_time);
    }

    if (end_time) {
      query += ` AND recorded_at <= $${++paramCount}`;
      params.push(end_time);
    }

    if (source_type) {
      query += ` AND source_type = $${++paramCount}`;
      params.push(source_type);
    }

    query += ` ORDER BY recorded_at DESC LIMIT $${++paramCount}`;
    params.push(parseInt(limit));

    const result = await db.query(query, params);

    const features = result.rows.map(row => ({
      type: 'Feature',
      geometry: row.geometry,
      properties: {
        pm25: row.pm25,
        pm10: row.pm10,
        no2: row.no2,
        so2: row.so2,
        source_type: row.source_type,
        recorded_at: row.recorded_at,
        quality_flag: row.quality_flag,
        aqi: calculateAQI(row.pm25)
      }
    }));

    res.json({
      type: 'FeatureCollection',
      features,
      metadata: {
        total_measurements: features.length,
        query_params: req.query,
        generated_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Measurements query error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch measurements',
      message: error.message 
    });
  }
};

export const getNairobiZones = async (req, res) => {
  try {
    // Get monitoring zones from data service
    const zones = await dataService.getNairobiMonitoringZones();
    res.json(zones);

  } catch (error) {
    console.error('Nairobi zones query error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch Nairobi monitoring zones',
      message: error.message 
    });
  }
};

export const triggerAnalysis = async (req, res) => {
  const { bbox, analysis_type = 'hotspot' } = req.body;

  try {
    // This would trigger a Celery task in production
    // For now, we'll simulate the analysis
    
    const analysisId = `analysis_${Date.now()}`;
    
    // Emit real-time update
    io.to('nairobi_dashboard').emit('analysis_started', {
      analysis_id: analysisId,
      type: analysis_type,
      bbox,
      status: 'processing'
    });

    // Simulate processing delay
    setTimeout(() => {
      io.to('nairobi_dashboard').emit('analysis_complete', {
        analysis_id: analysisId,
        type: analysis_type,
        results: {
          hotspots_found: Math.floor(Math.random() * 10) + 1,
          priority_zones: Math.floor(Math.random() * 5) + 1,
          recommended_actions: [
            'Implement traffic restrictions in CBD',
            'Increase industrial monitoring',
            'Deploy mobile air quality units'
          ]
        },
        status: 'completed'
      });
    }, 3000);

    res.json({
      analysis_id: analysisId,
      status: 'started',
      estimated_completion: '2-3 minutes',
      message: 'Analysis started. You will receive real-time updates via WebSocket.'
    });

  } catch (error) {
    console.error('Analysis trigger error:', error);
    res.status(500).json({ 
      error: 'Failed to trigger analysis',
      message: error.message 
    });
  }
};

// Helper functions
function getSeverityLevel(pm25) {
  if (pm25 <= 15) return 'good';
  if (pm25 <= 25) return 'moderate';
  if (pm25 <= 35) return 'unhealthy_sensitive';
  if (pm25 <= 55) return 'unhealthy';
  if (pm25 <= 150) return 'very_unhealthy';
  return 'hazardous';
}

function getHealthImpact(pm25) {
  if (pm25 <= 15) return 'Good';
  if (pm25 <= 25) return 'Moderate';
  if (pm25 <= 35) return 'Unhealthy for Sensitive Groups';
  if (pm25 <= 55) return 'Unhealthy';
  if (pm25 <= 150) return 'Very Unhealthy';
  return 'Hazardous';
}

function calculateAQI(pm25) {
  if (!pm25) return 0;
  // Simplified AQI calculation for PM2.5
  if (pm25 <= 15) return Math.round((50 / 15) * pm25);
  if (pm25 <= 25) return Math.round(50 + ((100 - 50) / (25 - 15)) * (pm25 - 15));
  if (pm25 <= 35) return Math.round(100 + ((150 - 100) / (35 - 25)) * (pm25 - 25));
  if (pm25 <= 55) return Math.round(150 + ((200 - 150) / (55 - 35)) * (pm25 - 35));
  if (pm25 <= 150) return Math.round(200 + ((300 - 200) / (150 - 55)) * (pm25 - 55));
  return Math.min(500, Math.round(300 + ((500 - 300) / (500 - 150)) * (pm25 - 150)));
}