import { io } from '../app.js';

// Mock data that works without database - using your real Nairobi data
const mockNairobiZones = {
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {"type": "Point", "coordinates": [36.8172, -1.2864]},
      "properties": {
        "id": "nairobi_zone_1",
        "name": "Nairobi CBD",
        "pm25": 45.2,
        "source_type": "monitoring_station",
        "recorded_at": new Date().toISOString(),
        "quality_flag": 2,
        "aqi_category": "Unhealthy for Sensitive Groups",
        "severity": "unhealthy_sensitive",
        "aqi": 112,
        "data_quality": "High"
      }
    },
    {
      "type": "Feature",
      "geometry": {"type": "Point", "coordinates": [36.8581, -1.3128]},
      "properties": {
        "id": "nairobi_zone_2", 
        "name": "Industrial Area",
        "pm25": 67.3,
        "source_type": "monitoring_station",
        "recorded_at": new Date().toISOString(),
        "quality_flag": 2,
        "aqi_category": "Unhealthy",
        "severity": "unhealthy",
        "aqi": 158,
        "data_quality": "High"
      }
    },
    {
      "type": "Feature",
      "geometry": {"type": "Point", "coordinates": [36.8089, -1.2630]},
      "properties": {
        "id": "nairobi_zone_3",
        "name": "Westlands", 
        "pm25": 32.1,
        "source_type": "monitoring_station",
        "recorded_at": new Date().toISOString(),
        "quality_flag": 1,
        "aqi_category": "Moderate",
        "severity": "moderate", 
        "aqi": 94,
        "data_quality": "Medium"
      }
    },
    {
      "type": "Feature",
      "geometry": {"type": "Point", "coordinates": [36.8833, -1.3167]},
      "properties": {
        "id": "nairobi_zone_4",
        "name": "Embakasi",
        "pm25": 89.5,
        "source_type": "monitoring_station",
        "recorded_at": new Date().toISOString(),
        "quality_flag": 3,
        "aqi_category": "Very Unhealthy",
        "severity": "very_unhealthy",
        "aqi": 185,
        "data_quality": "High"
      }
    },
    {
      "type": "Feature",
      "geometry": {"type": "Point", "coordinates": [36.7083, -1.3197]},
      "properties": {
        "id": "nairobi_zone_5",
        "name": "Karen",
        "pm25": 18.7,
        "source_type": "monitoring_station", 
        "recorded_at": new Date().toISOString(),
        "quality_flag": 1,
        "aqi_category": "Good",
        "severity": "good",
        "aqi": 62,
        "data_quality": "High"
      }
    }
  ],
  "metadata": {
    "total_zones": 5,
    "city": "Nairobi",
    "country": "Kenya", 
    "generated_at": new Date().toISOString(),
    "data_source": "UNEP Mock Data - Real Nairobi Coordinates"
  }
};

export const getHotspots = async (req, res) => {
  try {
    console.log('Fetching hotspots with mock data');
    
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
    console.error('Hotspots error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch hotspots',
      message: error.message 
    });
  }
};

export const getNairobiZones = async (req, res) => {
  try {
    console.log('Fetching Nairobi zones with mock data');
    
    const zones = {
      ...mockNairobiZones,
      features: mockNairobiZones.features.map(feature => ({
        ...feature,
        properties: {
          ...feature.properties,
          pm25: Math.round((feature.properties.pm25 + (Math.random() - 0.5) * 2) * 10) / 10,
          recorded_at: new Date().toISOString()
        }
      }))
    };

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
    console.log('Fetching measurements with mock data');
    
    const measurementsResponse = {
      type: 'FeatureCollection',
      features: mockNairobiZones.features.map(feature => ({
        ...feature,
        properties: {
          ...feature.properties,
          pm10: Math.round((feature.properties.pm25 * 1.8) * 10) / 10,
          no2: Math.round((Math.random() * 40 + 10) * 10) / 10,
          so2: Math.round((Math.random() * 20 + 5) * 10) / 10,
          o3: Math.round((Math.random() * 80 + 20) * 10) / 10
        }
      })),
      metadata: {
        total_measurements: mockNairobiZones.features.length,
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
    console.log('Triggering analysis with mock data');
    
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
            hotspots_found: 3,
            priority_zones: 2,
            critical_areas: ['Embakasi', 'Industrial Area'],
            recommended_actions: [
              'Implement traffic restrictions in CBD during peak hours',
              'Increase industrial monitoring in Embakasi area', 
              'Deploy mobile air quality units in Dandora'
            ]
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