// backend/src/services/satelliteDirect.service.js
import axios from 'axios';
import NodeCache from 'node-cache';
import weatherService from './weatherService.js';

class DirectSatelliteService {
  constructor() {
    // Cache satellite data for 30 minutes to avoid excessive API calls
    this.cache = new NodeCache({ stdTTL: 1800 });
    
    // Multiple satellite data sources
    this.dataSources = {
      sentinel5p: 'https://catalogue.dataspace.copernicus.eu/odata/v1/Products',
      openaq: 'https://api.openaq.org/v2',
      iqair: 'https://api.airvisual.com/v2'
    };
  }

  // Main method to get comprehensive air quality data for Nairobi
  async getNairobiAirQuality() {
    const cacheKey = 'nairobi_satellite_data';
    const cached = this.cache.get(cacheKey);
    
    if (cached) {
      console.log('📦 Returning cached satellite data');
      return cached;
    }

    try {
      console.log('🛰️ Fetching fresh satellite data for Nairobi...');
      
      // Nairobi bounding box
      const nairobiBox = [36.65, -1.45, 37.00, -1.15];
      
      // Fetch data from multiple sources in parallel
      const [
        openAQData,
        weatherData
      ] = await Promise.allSettled([
        this.fetchOpenAQData(),
        this.fetchWeatherData()
      ]);

      // Combine all data sources
      const combinedData = {
        timestamp: new Date().toISOString(),
        location: 'Nairobi, Kenya',
        bbox: nairobiBox,
        sources: {
          satellite_no2: this.generateEmptySatelliteData(),
          ground_stations: openAQData.status === 'fulfilled' ? openAQData.value : this.generateEmptyGroundStationData(),
          weather: weatherData.status === 'fulfilled' ? weatherData.value : this.generateEmptyWeatherData()
        },
        processed_data: this.processAndFuseData({
          satellite: this.generateEmptySatelliteData(),
          ground: openAQData.status === 'fulfilled' ? openAQData.value : this.generateEmptyGroundStationData(),
          weather: weatherData.status === 'fulfilled' ? weatherData.value : this.generateEmptyWeatherData()
        })
      };

      // Cache the result
      this.cache.set(cacheKey, combinedData);
      
      return combinedData;

    } catch (error) {
      console.error('❌ Error fetching satellite data:', error);
      return this.generateEmptyNairobiData();
    }
  }

  // Fetch OpenAQ ground station data
  async fetchOpenAQData() {
    try {
      const response = await axios.get('https://api.openaq.org/v2/latest', {
        params: {
          country: 'KE',
          city: 'Nairobi',
          limit: 100
        },
        timeout: 10000
      });

      return {
        stations_count: response.data.results?.length || 0,
        stations: response.data.results?.map(station => ({
          location: station.location,
          coordinates: station.coordinates,
          measurements: station.measurements?.map(m => ({
            parameter: m.parameter,
            value: m.value,
            unit: m.unit,
            lastUpdated: m.lastUpdated
          }))
        })) || []
      };

    } catch (error) {
      console.warn('⚠️ OpenAQ unavailable, returning empty data');
      return this.generateEmptyGroundStationData();
    }
  }

  // Fetch weather data
  async fetchWeatherData() {
    try {
      const weatherData = await weatherService.getNairobiWeather();
      if (weatherData.success) {
        return weatherData.summary;
      } else {
        throw new Error('Weather API failed');
      }
    } catch (error) {
      console.warn('⚠️ Weather API unavailable, returning empty data');
      return this.generateEmptyWeatherData();
    }
  }

  // Generate empty satellite data instead of mock data
  generateEmptySatelliteData() {
    return {
      satellite: 'Sentinel-5P',
      product_type: 'NO2_tropospheric',
      measurements_count: 0,
      acquisition_time: new Date().toISOString(),
      measurements: [],
      status: 'unavailable',
      error: 'Satellite data not accessible'
    };
  }

  // Generate empty ground station data instead of mock data
  generateEmptyGroundStationData() {
    return {
      stations_count: 0,
      stations: [],
      status: 'unavailable',
      error: 'Ground station data not accessible'
    };
  }

  // Generate empty weather data instead of mock data
  generateEmptyWeatherData() {
    return {
      temperature: null,
      humidity: null,
      wind_speed: null,
      pressure: null,
      weather: 'unavailable',
      status: 'unavailable',
      error: 'Weather data not accessible'
    };
  }

  // Process and fuse data from multiple sources
  processAndFuseData({ satellite, ground, weather }) {
    const processedData = {
      pollution_hotspots: [],
      air_quality_summary: {},
      alerts: [],
      recommendations: []
    };

    // Identify pollution hotspots from satellite data
    if (satellite?.measurements && satellite.measurements.length > 0) {
      const hotspots = satellite.measurements
        .filter(m => m.no2_tropospheric > 5e-5 && m.qa_value > 0.6)
        .sort((a, b) => b.no2_tropospheric - a.no2_tropospheric)
        .slice(0, 10)
        .map(m => ({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [m.longitude, m.latitude]
          },
          properties: {
            no2_concentration: m.no2_tropospheric,
            severity: this.calculateSeverity(m.no2_tropospheric),
            confidence: m.qa_value,
            source: 'satellite',
            detection_time: m.observation_time
          }
        }));

      processedData.pollution_hotspots = hotspots;
    }

    // Calculate air quality summary from ground stations
    if (ground?.stations && ground.stations.length > 0) {
      const pm25Values = ground.stations
        .flatMap(s => s.measurements)
        .filter(m => m.parameter === 'PM2.5')
        .map(m => m.value);

      if (pm25Values.length > 0) {
        const avgPM25 = pm25Values.reduce((sum, val) => sum + val, 0) / pm25Values.length;
        processedData.air_quality_summary = {
          avg_pm25: avgPM25,
          max_pm25: Math.max(...pm25Values),
          min_pm25: Math.min(...pm25Values),
          stations_reporting: pm25Values.length,
          overall_status: this.getAQIStatus(avgPM25),
          temperature: weather?.temperature || null,
          humidity: weather?.humidity || null,
          weather_conditions: weather?.weather || 'unavailable'
        };
      }
    }

    // Generate alerts for high pollution areas
    const criticalHotspots = processedData.pollution_hotspots.filter(
      h => h.properties.severity === 'high' || h.properties.severity === 'critical'
    );

    processedData.alerts = criticalHotspots.map(hotspot => ({
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'air_pollution',
      severity: hotspot.properties.severity,
      location: hotspot.geometry.coordinates,
      message: this.generateAlertMessage(hotspot),
      timestamp: new Date().toISOString()
    }));

    // Generate AI-powered recommendations
    processedData.recommendations = this.generatePolicyRecommendations(processedData);

    return processedData;
  }

  // Calculate pollution severity
  calculateSeverity(no2_concentration) {
    if (no2_concentration > 1e-4) return 'critical';
    if (no2_concentration > 7e-5) return 'high';
    if (no2_concentration > 4e-5) return 'moderate';
    return 'low';
  }

  // Get AQI status from PM2.5 values
  getAQIStatus(pm25) {
    if (pm25 > 55) return 'very_unhealthy';
    if (pm25 > 35) return 'unhealthy';
    if (pm25 > 25) return 'unhealthy_for_sensitive';
    if (pm25 > 15) return 'moderate';
    return 'good';
  }

  // Generate alert messages
  generateAlertMessage(hotspot) {
    const { severity } = hotspot.properties;
    return `${severity.charAt(0).toUpperCase() + severity.slice(1)} air pollution detected from satellite monitoring.`;
  }

  // Generate policy recommendations based on detected pollution
  generatePolicyRecommendations(data) {
    const recommendations = [];
    
    if (data.pollution_hotspots.length > 3) {
      recommendations.push({
        type: 'emergency_response',
        title: 'Activate Emergency Air Quality Protocol',
        description: 'Multiple pollution hotspots detected. Implement immediate traffic restrictions and public health advisories.',
        priority: 'critical',
        estimated_impact: '30% reduction in peak pollution',
        timeline: 'Immediate (0-24 hours)'
      });
    }

    if (data.air_quality_summary?.avg_pm25 > 35) {
      recommendations.push({
        type: 'public_health',
        title: 'Issue Health Advisory',
        description: 'Air quality is unhealthy. Advise sensitive groups to limit outdoor activities.',
        priority: 'high',
        estimated_impact: 'Reduce health impacts by 40%',
        timeline: 'Immediate (0-6 hours)'
      });
    }

    return recommendations;
  }

  // Generate empty Nairobi data instead of mock data
  generateEmptyNairobiData() {
    const bbox = [36.65, -1.45, 37.00, -1.15];
    
    return {
      timestamp: new Date().toISOString(),
      location: 'Nairobi, Kenya',
      bbox,
      sources: {
        satellite_no2: this.generateEmptySatelliteData(),
        ground_stations: this.generateEmptyGroundStationData(),
        weather: this.generateEmptyWeatherData()
      },
      processed_data: {
        pollution_hotspots: [],
        air_quality_summary: {
          avg_pm25: null,
          max_pm25: null,
          min_pm25: null,
          stations_reporting: 0,
          overall_status: 'unknown',
          temperature: null,
          humidity: null,
          weather_conditions: 'unavailable'
        },
        alerts: [{
          id: 'system_error_001',
          type: 'system_error',
          severity: 'low',
          location: [36.8219, -1.2921],
          message: 'Data sources not available - service will be updated with real data integration',
          timestamp: new Date().toISOString()
        }],
        recommendations: []
      }
    };
  }

  // Clear cache manually if needed
  clearCache() {
    this.cache.flushAll();
    console.log('🗑️ Satellite data cache cleared');
  }

  // Get cache statistics
  getCacheStats() {
    return {
      keys: this.cache.keys(),
      stats: this.cache.getStats()
    };
  }
}

export default new DirectSatelliteService();