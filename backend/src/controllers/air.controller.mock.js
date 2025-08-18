import fs from 'fs';
import path from 'path';
import { io } from '../app.js';

// Read mock data files
const readMockData = (filename) => {
  try {
    const filePath = path.join(process.cwd(), '..', filename);
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading mock data ${filename}:`, error);
    return null;
  }
};

export const getHotspots = async (req, res) => {
  try {
    // For hotspots, we'll use the same zones data but filter for higher PM2.5
    const zonesData = readMockData('mock_nairobi_zones.json');
    
    if (!zonesData) {
      return res.status(500).json({ error: 'Mock data not available' });
    }

    // Filter for hotspots (PM2.5 > 35)
    const hotspotFeatures = zonesData.features.filter(
      feature => feature.properties.pm25 > 35
    );

    const hotspotsResponse = {
      type: 'FeatureCollection',
      features: hotspotFeatures.map(feature => ({
        ...feature,
        properties: {
          ...feature.properties,
          pm25_avg: feature.properties.pm25,
          reading_count: 1,
          latest_reading: feature.properties.recorded_at,
          health_impact: feature.properties.aqi_category
        }
      })),
      metadata: {
        total_hotspots: hotspotFeatures.length,
        bbox: [36.70, -1.40, 37.12, -1.15],
        city: 'Nairobi',
        generated_at: new Date().toISOString()
      }
    };

    res.json(hotspotsResponse);

  } catch (error) {
    console.error('Hotspots mock error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch hotspots',
      message: error.message 
    });
  }
};

export const getNairobiZones = async (req, res) => {
  try {
    const zonesData = readMockData('mock_nairobi_zones.json');
    
    if (!zonesData) {
      return res.status(500).json({ 
        error: 'Mock data not available',
        message: 'Could not read mock_nairobi_zones.json file'
      });
    }

    res.json(zonesData);

  } catch (error) {
    console.error('Nairobi zones mock error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch Nairobi monitoring zones',
      message: error.message 
    });
  }
};

export const getMeasurements = async (req, res) => {
  try {
    const zonesData = readMockData('mock_nairobi_zones.json');
    
    if (!zonesData) {
      return res.status(500).json({ error: 'Mock data not available' });
    }

    // Return all zones as measurements
    const measurementsResponse = {
      type: 'FeatureCollection',
      features: zonesData.features.map(feature => ({
        ...feature,
        properties: {
          ...feature.properties,
          pm10: feature.properties.pm25 * 1.8, // Estimate PM10
          no2: Math.random() * 40 + 10, // Mock NO2 data
          so2: Math.random() * 20 + 5   // Mock SO2 data
        }
      })),
      metadata: {
        total_measurements: zonesData.features.length,
        query_params: req.query,
        generated_at: new Date().toISOString()
      }
    };

    res.json(measurementsResponse);

  } catch (error) {
    console.error('Measurements mock error:', error);
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

    // Simulate processing
    setTimeout(() => {
      io.to('nairobi_dashboard').emit('analysis_complete', {
        analysis_id: analysisId,
        results: {
          hotspots_found: 3,
          priority_zones: 2,
          recommended_actions: [
            'Implement traffic restrictions in CBD',
            'Increase industrial monitoring in Embakasi',
            'Deploy mobile air quality units in Dandora'
          ]
        },
        status: 'completed'
      });
    }, 2000);

    res.json({
      analysis_id: analysisId,
      status: 'started',
      message: 'Analysis started with mock data'
    });

  } catch (error) {
    console.error('Analysis trigger error:', error);
    res.status(500).json({ 
      error: 'Failed to trigger analysis',
      message: error.message 
    });
  }
};