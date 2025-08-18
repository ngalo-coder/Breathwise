import { io } from '../app.js';

// Mock data for deployment without database
const mockNairobiZones = {
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {"type": "Point", "coordinates": [36.8172, -1.2864]},
      "properties": {
        "id": "nairobi_zone_1",
        "pm25": 45.2,
        "source_type": "monitoring_station",
        "recorded_at": new Date().toISOString(),
        "quality_flag": 2,
        "aqi_category": "Unhealthy for Sensitive Groups",
        "severity": "unhealthy_sensitive",
        "aqi": 112
      }
    },
    {
      "type": "Feature",
      "geometry": {"type": "Point", "coordinates": [36.8581, -1.3128]},
      "properties": {
        "id": "nairobi_zone_2",
        "pm25": 67.3,
        "source_type": "monitoring_station",
        "recorded_at": new Date().toISOString(),
        "quality_flag": 2,
        "aqi_category": "Unhealthy",
        "severity": "unhealthy",
        "aqi": 158
      }
    },
    {
      "type": "Feature",
      "geometry": {"type": "Point", "coordinates": [36.8089, -1.2630]},
      "properties": {
        "id": "nairobi_zone_3",
        "pm25": 32.1,
        "source_type": "monitoring_station",
        "recorded_at": new Date().toISOString(),
        "quality_flag": 1,
        "aqi_category": "Moderate",
        "severity": "moderate",
        "aqi": 94
      }
    },
    {
      "type": "Feature",
      "geometry": {"type": "Point", "coordinates": [36.8833, -1.3167]},
      "properties": {
        "id": "nairobi_zone_4",
        "pm25": 89.5,
        "source_type": "monitoring_station",
        "recorded_at": new Date().toISOString(),
        "quality_flag": 3,
        "aqi_category": "Very Unhealthy",
        "severity": "very_unhealthy",
        "aqi": 185
      }
    },
    {
      "type": "Feature",
      "geometry": {"type": "Point", "coordinates": [36.7083, -1.3197]},
      "properties": {
        "id": "nairobi_zone_5",
        "pm25": 18.7,
        "source_type": "monitoring_station",
        "recorded_at": new Date().toISOString(),
        "quality_flag": 1,
        "aqi_category": "Good",
        "severity": "good",
        "aqi": 62
      }
    }
  ],
  "metadata": {
    "total_zones": 5,
    "city": "Nairobi",
    "country": "Kenya",
    "generated_at": new Date().toISOString()
  }
};

export const getHotspots = async (req, res) => {
  try {
    // Filter for hotspots (PM2.5 > 35)
    const hotspotFeatures = mockNairobiZones.features.filter(
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
    res.json(mockNairobiZones);
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
    // Return all zones as measurements
    const measurementsResponse = {
      type: 'FeatureCollection',
      features: mockNairobiZones.features.map(feature => ({
        ...feature,
        properties: {
          ...feature.properties,
          pm10: feature.properties.pm25 * 1.8, // Estimate PM10
          no2: Math.random() * 40 + 10, // Mock NO2 data
          so2: Math.random() * 20 + 5   // Mock SO2 data
        }
      })),
      metadata: {
        total_measurements: mockNairobiZones.features.length,
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
    if (io) {
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
    }

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