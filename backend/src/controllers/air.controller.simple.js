import db from '../config/database.js';
import { io } from '../app.js';

export const getHotspots = async (req, res) => {
  try {
    // Simple query for Nairobi hotspots
    const query = `
      SELECT 
        ST_AsGeoJSON(geom)::json AS geometry,
        pm25,
        source_type,
        recorded_at
      FROM air_measurements 
      WHERE geom && ST_MakeEnvelope(36.70, -1.40, 37.12, -1.15, 4326)
        AND pm25 > 25
      ORDER BY pm25 DESC
      LIMIT 20
    `;

    const result = await db.query(query);

    const features = result.rows.map(row => ({
      type: 'Feature',
      geometry: row.geometry,
      properties: {
        pm25_avg: row.pm25,
        source_type: row.source_type,
        severity: getSeverityLevel(row.pm25),
        health_impact: getHealthImpact(row.pm25),
        aqi: calculateAQI(row.pm25)
      }
    }));

    res.json({
      type: 'FeatureCollection',
      features,
      metadata: {
        total_hotspots: features.length,
        city: 'Nairobi',
        generated_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Hotspots query error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch hotspots',
      message: error.message 
    });
  }
};

export const getNairobiZones = async (req, res) => {
  try {
    const query = `
      SELECT 
        ST_AsGeoJSON(geom)::json AS geometry,
        pm25,
        source_type,
        recorded_at,
        quality_flag
      FROM air_measurements 
      WHERE source_type = 'monitoring_station'
        AND geom && ST_MakeEnvelope(36.70, -1.40, 37.12, -1.15, 4326)
      ORDER BY recorded_at DESC
    `;

    const result = await db.query(query);

    const features = result.rows.map((row, index) => ({
      type: 'Feature',
      geometry: row.geometry,
      properties: {
        id: `nairobi_zone_${index + 1}`,
        pm25: row.pm25,
        source_type: row.source_type,
        recorded_at: row.recorded_at,
        quality_flag: row.quality_flag,
        aqi_category: getHealthImpact(row.pm25),
        severity: getSeverityLevel(row.pm25),
        aqi: calculateAQI(row.pm25)
      }
    }));

    res.json({
      type: 'FeatureCollection',
      features,
      metadata: {
        total_zones: features.length,
        city: 'Nairobi',
        country: 'Kenya',
        generated_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Nairobi zones query error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch Nairobi monitoring zones',
      message: error.message 
    });
  }
};

export const getMeasurements = async (req, res) => {
  try {
    // Simple query without complex parameters
    const query = `
      SELECT 
        ST_AsGeoJSON(geom)::json AS geometry,
        pm25, pm10, no2, so2,
        source_type,
        recorded_at,
        quality_flag
      FROM air_measurements 
      WHERE geom && ST_MakeEnvelope(36.70, -1.40, 37.12, -1.15, 4326)
      ORDER BY recorded_at DESC
      LIMIT 100
    `;

    const result = await db.query(query);

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

export const triggerAnalysis = async (req, res) => {
  try {
    const analysisId = `analysis_${Date.now()}`;
    
    // Emit real-time update
    io.to('nairobi_dashboard').emit('analysis_started', {
      analysis_id: analysisId,
      status: 'processing'
    });

    res.json({
      analysis_id: analysisId,
      status: 'started',
      message: 'Analysis started successfully'
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
  if (!pm25) return 'unknown';
  if (pm25 <= 15) return 'good';
  if (pm25 <= 25) return 'moderate';
  if (pm25 <= 35) return 'unhealthy_sensitive';
  if (pm25 <= 55) return 'unhealthy';
  if (pm25 <= 150) return 'very_unhealthy';
  return 'hazardous';
}

function getHealthImpact(pm25) {
  if (!pm25) return 'No Data';
  if (pm25 <= 15) return 'Good';
  if (pm25 <= 25) return 'Moderate';
  if (pm25 <= 35) return 'Unhealthy for Sensitive Groups';
  if (pm25 <= 55) return 'Unhealthy';
  if (pm25 <= 150) return 'Very Unhealthy';
  return 'Hazardous';
}

function calculateAQI(pm25) {
  if (!pm25) return 0;
  if (pm25 <= 15) return Math.round((50 / 15) * pm25);
  if (pm25 <= 25) return Math.round(50 + ((100 - 50) / (25 - 15)) * (pm25 - 15));
  if (pm25 <= 35) return Math.round(100 + ((150 - 100) / (35 - 25)) * (pm25 - 25));
  if (pm25 <= 55) return Math.round(150 + ((200 - 150) / (55 - 35)) * (pm25 - 35));
  if (pm25 <= 150) return Math.round(200 + ((300 - 200) / (150 - 55)) * (pm25 - 55));
  return Math.min(500, Math.round(300 + ((500 - 300) / (500 - 150)) * (pm25 - 150)));
}