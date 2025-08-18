import db from '../config/database.js';

class DataService {
  
  async getNairobiHotspots(bboxArray = null) {
    try {
      // Default to Nairobi bounds if no bbox provided
      const bounds = bboxArray || [36.70, -1.40, 37.12, -1.15];
      
      const query = `
        SELECT 
          ST_AsGeoJSON(geom)::json AS geometry,
          AVG(pm25) AS pm25_avg,
          source_type,
          COUNT(*) AS reading_count,
          MAX(recorded_at) AS latest_reading
        FROM air_measurements 
        WHERE geom && ST_MakeEnvelope($1, $2, $3, $4, 4326)
          AND recorded_at > NOW() - INTERVAL '24 HOURS'
          AND pm25 IS NOT NULL
        GROUP BY geom, source_type
        HAVING AVG(pm25) > 25  -- Lower threshold to show more Nairobi data
        ORDER BY pm25_avg DESC
        LIMIT 50
      `;

      const result = await db.query(query, bounds);

      const features = result.rows.map(row => ({
        type: 'Feature',
        geometry: row.geometry,
        properties: {
          pm25_avg: Math.round(row.pm25_avg * 10) / 10,
          source_type: row.source_type,
          reading_count: row.reading_count,
          latest_reading: row.latest_reading,
          severity: this.getSeverityLevel(row.pm25_avg),
          health_impact: this.getHealthImpact(row.pm25_avg),
          aqi: this.calculateAQI(row.pm25_avg)
        }
      }));

      return {
        type: 'FeatureCollection',
        features,
        metadata: {
          total_hotspots: features.length,
          bbox: bounds,
          city: 'Nairobi',
          generated_at: new Date().toISOString()
        }
      };

    } catch (error) {
      console.error('DataService hotspots error:', error);
      throw error;
    }
  }

  async getNairobiMonitoringZones() {
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
          aqi_category: this.getHealthImpact(row.pm25),
          severity: this.getSeverityLevel(row.pm25),
          aqi: this.calculateAQI(row.pm25)
        }
      }));

      return {
        type: 'FeatureCollection',
        features,
        metadata: {
          total_zones: features.length,
          city: 'Nairobi',
          country: 'Kenya',
          generated_at: new Date().toISOString()
        }
      };

    } catch (error) {
      console.error('DataService monitoring zones error:', error);
      throw error;
    }
  }

  // Helper methods
  getSeverityLevel(pm25) {
    if (pm25 <= 15) return 'good';
    if (pm25 <= 25) return 'moderate';
    if (pm25 <= 35) return 'unhealthy_sensitive';
    if (pm25 <= 55) return 'unhealthy';
    if (pm25 <= 150) return 'very_unhealthy';
    return 'hazardous';
  }

  getHealthImpact(pm25) {
    if (pm25 <= 15) return 'Good';
    if (pm25 <= 25) return 'Moderate';
    if (pm25 <= 35) return 'Unhealthy for Sensitive Groups';
    if (pm25 <= 55) return 'Unhealthy';
    if (pm25 <= 150) return 'Very Unhealthy';
    return 'Hazardous';
  }

  calculateAQI(pm25) {
    if (!pm25) return 0;
    // Simplified AQI calculation for PM2.5
    if (pm25 <= 15) return Math.round((50 / 15) * pm25);
    if (pm25 <= 25) return Math.round(50 + ((100 - 50) / (25 - 15)) * (pm25 - 15));
    if (pm25 <= 35) return Math.round(100 + ((150 - 100) / (35 - 25)) * (pm25 - 25));
    if (pm25 <= 55) return Math.round(150 + ((200 - 150) / (55 - 35)) * (pm25 - 35));
    if (pm25 <= 150) return Math.round(200 + ((300 - 200) / (150 - 55)) * (pm25 - 55));
    return Math.min(500, Math.round(300 + ((500 - 300) / (500 - 150)) * (pm25 - 150)));
  }
}

export default new DataService();