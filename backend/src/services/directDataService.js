// backend/src/services/directDataService.js
// Direct API data fetching without database dependency

import axios from 'axios';
import NodeCache from 'node-cache';

class DirectDataService {
  constructor() {
    // Cache for 15 minutes to avoid excessive API calls
    this.cache = new NodeCache({ stdTTL: 900 });
    this.apis = {
      weatherapi: process.env.WEATHERAPI_KEY,
      openaq: process.env.OPENAQ_API_KEY,
      iqair: process.env.IQAIR_API_KEY,
      waqi: process.env.WAQI_TOKEN
    };
  }

  // 🌟 Get all Nairobi air quality data in one call
  async getNairobiData() {
    const cacheKey = 'nairobi_complete_data';
    const cached = this.cache.get(cacheKey);

    if (cached) {
      console.log('📦 Returning cached data');
      return cached;
    }

    try {
      console.log('🌍 Fetching live Nairobi air quality data...');

      // Parallel API calls for speed
      const [weatherData, openaqData, iqairData, waqiData] = await Promise.allSettled([
        this.fetchWeatherAPIData(),
        this.fetchOpenAQData(),
        this.fetchIQAirData(),
        this.fetchWAQIData()
      ]);

      const combinedData = {
        timestamp: new Date().toISOString(),
        location: 'Nairobi, Kenya',
        coordinates: { lat: -1.2921, lon: 36.8219 },

        // Process all data sources
        measurements: this.processMeasurements(weatherData, openaqData, iqairData, waqiData),
        summary: {},
        hotspots: [],
        alerts: [],
        data_sources: this.getActiveSources(weatherData, openaqData, iqairData, waqiData)
      };

      // Generate summary statistics
      combinedData.summary = this.calculateSummary(combinedData.measurements);

      // Identify hotspots
      combinedData.hotspots = this.identifyHotspots(combinedData.measurements);

      // Generate alerts
      combinedData.alerts = this.generateAlerts(combinedData.summary, combinedData.hotspots);

      // Cache the result
      this.cache.set(cacheKey, combinedData);

      console.log(`✅ Data compiled: ${combinedData.measurements.length} measurements from ${combinedData.data_sources.length} sources`);
      return combinedData;

    } catch (error) {
      console.error('❌ Error fetching data:', error);
      return this.getEmergencyFallback();
    }
  }

  // 🌤️ WeatherAPI.com - Premium air quality data
  async fetchWeatherAPIData() {
    if (!this.apis.weatherapi) return null;

    const locations = [
      { name: 'Nairobi CBD', coords: '-1.2921,36.8219' },
      { name: 'Westlands', coords: '-1.2676,36.8094' },
      { name: 'Embakasi', coords: '-1.3231,36.9081' },
      { name: 'Karen', coords: '-1.3194,36.7073' },
      { name: 'Industrial Area', coords: '-1.3031,36.8592' }
    ];

    const results = [];

    for (const location of locations) {
      try {
        const response = await axios.get(
          `https://api.weatherapi.com/v1/current.json?key=${this.apis.weatherapi}&q=${location.coords}&aqi=yes`,
          { timeout: 10000 }
        );

        const data = response.data;
        results.push({
          location: location.name,
          coordinates: {
            lat: data.location.lat,
            lon: data.location.lon
          },
          air_quality: {
            pm25: data.current.air_quality?.pm2_5,
            pm10: data.current.air_quality?.pm10,
            no2: data.current.air_quality?.no2,
            o3: data.current.air_quality?.o3,
            co: data.current.air_quality?.co,
            so2: data.current.air_quality?.so2,
            aqi_us: data.current.air_quality?.['us-epa-index'],
            aqi_uk: data.current.air_quality?.['gb-defra-index']
          },
          weather: {
            temperature: data.current.temp_c,
            humidity: data.current.humidity,
            wind_speed: data.current.wind_kph / 3.6, // Convert to m/s
            pressure: data.current.pressure_mb,
            condition: data.current.condition.text
          },
          source: 'WeatherAPI.com',
          quality: 'premium',
          timestamp: new Date().toISOString()
        });

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.warn(`⚠️ WeatherAPI failed for ${location.name}:`, error.message);
      }
    }

    return results;
  }

  // 📡 OpenAQ - Global air quality network
  async fetchOpenAQData() {
    try {
      const headers = this.apis.openaq ? { 'X-API-Key': this.apis.openaq } : {};

      const response = await axios.get(
        'https://api.openaq.org/v2/latest?country=KE&city=Nairobi&limit=50',
        { headers, timeout: 15000 }
      );

      return response.data.results?.map(station => ({
        location: station.location,
        coordinates: station.coordinates,
        measurements: station.measurements?.map(m => ({
          parameter: m.parameter,
          value: m.value,
          unit: m.unit,
          lastUpdated: m.lastUpdated
        })) || [],
        source: 'OpenAQ',
        quality: 'ground_truth'
      })) || [];

    } catch (error) {
      console.warn('⚠️ OpenAQ API failed:', error.message);
      return [];
    }
  }

  // 🏢 IQAir - Commercial air quality data
  async fetchIQAirData() {
    if (!this.apis.iqair) return null;

    try {
      const response = await axios.get(
        `https://api.airvisual.com/v2/nearest_city?lat=-1.2921&lon=36.8219&key=${this.apis.iqair}`,
        { timeout: 10000 }
      );

      const data = response.data.data;

      return {
        location: `${data.city}, ${data.state}`,
        coordinates: { lat: -1.2921, lon: 36.8219 },
        air_quality: {
          aqi_us: data.current?.pollution?.aqius,
          aqi_cn: data.current?.pollution?.aqicn,
          main_pollutant_us: data.current?.pollution?.mainus,
          main_pollutant_cn: data.current?.pollution?.maincn
        },
        weather: {
          temperature: data.current?.weather?.tp,
          pressure: data.current?.weather?.pr,
          humidity: data.current?.weather?.hu,
          wind_speed: data.current?.weather?.ws,
          wind_direction: data.current?.weather?.wd
        },
        source: 'IQAir',
        quality: 'commercial',
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.warn('⚠️ IQAir API failed:', error.message);
      return null;
    }
  }

  // 🌐 WAQI - World Air Quality Index
  async fetchWAQIData() {
    if (!this.apis.waqi) return [];

    const stations = ['nairobi', 'kenya'];
    const results = [];

    for (const station of stations) {
      try {
        const response = await axios.get(
          `https://api.waqi.info/feed/${station}/?token=${this.apis.waqi}`,
          { timeout: 8000 }
        );

        if (response.data.status === 'ok') {
          const data = response.data.data;
          results.push({
            location: data.city.name,
            coordinates: data.city.geo,
            aqi: data.aqi,
            measurements: data.iaqi,
            timestamp: data.time.iso,
            source: 'WAQI',
            quality: 'public'
          });
        }
      } catch (error) {
        console.warn(`⚠️ WAQI failed for ${station}:`, error.message);
      }
    }

    return results;
  }

  // 🔄 Process all measurements into unified format
  processMeasurements(weatherData, openaqData, iqairData, waqiData) {
    const measurements = [];

    // Process WeatherAPI data
    if (weatherData.status === 'fulfilled' && weatherData.value) {
      weatherData.value.forEach(station => {
        measurements.push({
          id: `weather_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [station.coordinates.lon, station.coordinates.lat]
          },
          properties: {
            name: station.location,
            source: station.source,
            pm25: station.air_quality?.pm25,
            pm10: station.air_quality?.pm10,
            no2: station.air_quality?.no2,
            o3: station.air_quality?.o3,
            co: station.air_quality?.co,
            so2: station.air_quality?.so2,
            aqi_us: station.air_quality?.aqi_us,
            temperature: station.weather?.temperature,
            humidity: station.weather?.humidity,
            wind_speed: station.weather?.wind_speed,
            quality: station.quality,
            timestamp: station.timestamp
          }
        });
      });
    }

    // Process OpenAQ data
    if (openaqData.status === 'fulfilled' && openaqData.value) {
      openaqData.value.forEach(station => {
        const airQuality = {};
        station.measurements.forEach(m => {
          airQuality[m.parameter] = m.value;
        });

        measurements.push({
          id: `openaq_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [station.coordinates?.longitude || 36.8219, station.coordinates?.latitude || -1.2921]
          },
          properties: {
            name: station.location,
            source: station.source,
            ...airQuality,
            quality: station.quality,
            timestamp: station.measurements[0]?.lastUpdated || new Date().toISOString()
          }
        });
      });
    }

    // Process IQAir data
    if (iqairData.status === 'fulfilled' && iqairData.value) {
      const station = iqairData.value;
      measurements.push({
        id: `iqair_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [station.coordinates.lon, station.coordinates.lat]
        },
        properties: {
          name: station.location,
          source: station.source,
          aqi_us: station.air_quality?.aqi_us,
          aqi_cn: station.air_quality?.aqi_cn,
          temperature: station.weather?.temperature,
          humidity: station.weather?.humidity,
          quality: station.quality,
          timestamp: station.timestamp
        }
      });
    }

    // Process WAQI data
    if (waqiData.status === 'fulfilled' && waqiData.value) {
      waqiData.value.forEach(station => {
        measurements.push({
          id: `waqi_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: station.coordinates || [36.8219, -1.2921]
          },
          properties: {
            name: station.location,
            source: station.source,
            aqi: station.aqi,
            pm25: station.measurements?.pm25?.v,
            pm10: station.measurements?.pm10?.v,
            no2: station.measurements?.no2?.v,
            o3: station.measurements?.o3?.v,
            quality: station.quality,
            timestamp: station.timestamp
          }
        });
      });
    }

    return measurements;
  }

  // 📊 Calculate summary statistics
  calculateSummary(measurements) {
    if (measurements.length === 0) {
      return {
        total_measurements: 0,
        avg_pm25: null,
        max_pm25: null,
        air_quality_status: 'Unknown',
        data_freshness: 'No data'
      };
    }

    const pm25Values = measurements
      .map(m => m.properties.pm25)
      .filter(pm25 => pm25 != null && !isNaN(pm25));

    const no2Values = measurements
      .map(m => m.properties.no2)
      .filter(no2 => no2 != null && !isNaN(no2));

    const summary = {
      total_measurements: measurements.length,
      active_sources: [...new Set(measurements.map(m => m.properties.source))],
      spatial_coverage: measurements.length,
      last_update: new Date().toISOString()
    };

    if (pm25Values.length > 0) {
      summary.avg_pm25 = Math.round((pm25Values.reduce((sum, val) => sum + val, 0) / pm25Values.length) * 10) / 10;
      summary.max_pm25 = Math.max(...pm25Values);
      summary.min_pm25 = Math.min(...pm25Values);
      summary.aqi = this.calculateAQI(summary.avg_pm25);
      summary.air_quality_status = this.getAQICategory(summary.avg_pm25);
      summary.unhealthy_readings = pm25Values.filter(pm25 => pm25 > 35).length;
    }

    if (no2Values.length > 0) {
      summary.avg_no2 = Math.round((no2Values.reduce((sum, val) => sum + val, 0) / no2Values.length) * 10) / 10;
      summary.max_no2 = Math.max(...no2Values);
    }

    return summary;
  }

  // 🔥 Identify pollution hotspots
  identifyHotspots(measurements) {
    const hotspots = [];

    measurements.forEach(measurement => {
      const pm25 = measurement.properties.pm25;
      const no2 = measurement.properties.no2;

      // PM2.5 hotspot criteria
      if (pm25 && pm25 > 35) {
        hotspots.push({
          type: 'Feature',
          geometry: measurement.geometry,
          properties: {
            hotspot_type: 'pm25_elevated',
            severity: pm25 > 55 ? 'critical' : pm25 > 45 ? 'high' : 'moderate',
            value: pm25,
            threshold: 35,
            pollutant: 'PM2.5',
            source: measurement.properties.source,
            location_name: measurement.properties.name,
            detection_time: new Date().toISOString()
          }
        });
      }

      // NO2 hotspot criteria
      if (no2 && no2 > 40) {
        hotspots.push({
          type: 'Feature',
          geometry: measurement.geometry,
          properties: {
            hotspot_type: 'no2_elevated',
            severity: no2 > 80 ? 'high' : 'moderate',
            value: no2,
            threshold: 40,
            pollutant: 'NO2',
            source: measurement.properties.source,
            location_name: measurement.properties.name,
            detection_time: new Date().toISOString()
          }
        });
      }
    });

    return hotspots;
  }

  // 🚨 Generate real-time alerts
  generateAlerts(summary, hotspots) {
    const alerts = [];

    // Air quality alerts
    if (summary.avg_pm25 > 55) {
      alerts.push({
        id: `alert_${Date.now()}`,
        type: 'health_emergency',
        severity: 'critical',
        message: `Very unhealthy air quality: PM2.5 at ${summary.avg_pm25} μg/m³`,
        threshold: 55,
        current_value: summary.avg_pm25,
        affected_area: 'Nairobi Metropolitan Area',
        timestamp: new Date().toISOString(),
        actions: [
          'Stay indoors',
          'Avoid outdoor activities',
          'Use air purifiers if available',
          'Wear N95 masks if must go outside'
        ]
      });
    } else if (summary.avg_pm25 > 35) {
      alerts.push({
        id: `alert_${Date.now()}`,
        type: 'air_pollution',
        severity: 'high',
        message: `Unhealthy air quality: PM2.5 at ${summary.avg_pm25} μg/m³`,
        threshold: 35,
        current_value: summary.avg_pm25,
        affected_area: 'Nairobi Metropolitan Area',
        timestamp: new Date().toISOString(),
        actions: [
          'Sensitive groups should limit outdoor activities',
          'Consider wearing masks outdoors',
          'Monitor air quality regularly'
        ]
      });
    }

    // Hotspot alerts
    const criticalHotspots = hotspots.filter(h => h.properties.severity === 'critical');
    if (criticalHotspots.length > 0) {
      alerts.push({
        id: `hotspot_alert_${Date.now()}`,
        type: 'pollution_hotspot',
        severity: 'high',
        message: `${criticalHotspots.length} critical pollution hotspot(s) detected`,
        hotspots: criticalHotspots.map(h => h.properties.location_name),
        timestamp: new Date().toISOString()
      });
    }

    return alerts;
  }

  // 🔧 Utility methods
  getActiveSources(weatherData, openaqData, iqairData, waqiData) {
    const sources = [];

    if (weatherData.status === 'fulfilled' && weatherData.value?.length > 0) {
      sources.push('WeatherAPI.com');
    }
    if (openaqData.status === 'fulfilled' && openaqData.value?.length > 0) {
      sources.push('OpenAQ');
    }
    if (iqairData.status === 'fulfilled' && iqairData.value) {
      sources.push('IQAir');
    }
    if (waqiData.status === 'fulfilled' && waqiData.value?.length > 0) {
      sources.push('WAQI');
    }

    return sources;
  }

  calculateAQI(pm25) {
    if (!pm25) return 0;
    if (pm25 <= 15) return Math.round((50 / 15) * pm25);
    if (pm25 <= 25) return Math.round(50 + ((100 - 50) / (25 - 15)) * (pm25 - 15));
    if (pm25 <= 35) return Math.round(100 + ((150 - 100) / (35 - 25)) * (pm25 - 25));
    if (pm25 <= 55) return Math.round(150 + ((200 - 150) / (55 - 35)) * (pm25 - 35));
    return Math.min(500, Math.round(200 + ((300 - 200) / (150 - 55)) * (pm25 - 55)));
  }

  getAQICategory(pm25) {
    if (!pm25) return 'Unknown';
    if (pm25 <= 15) return 'Good';
    if (pm25 <= 25) return 'Moderate';
    if (pm25 <= 35) return 'Unhealthy for Sensitive Groups';
    if (pm25 <= 55) return 'Unhealthy';
    return 'Very Unhealthy';
  }

  // 🚨 Emergency fallback when all APIs fail
  getEmergencyFallback() {
    return {
      timestamp: new Date().toISOString(),
      location: 'Nairobi, Kenya',
      coordinates: { lat: -1.2921, lon: 36.8219 },
      measurements: [],
      summary: {
        total_measurements: 0,
        air_quality_status: 'Data Unavailable',
        message: 'All data sources temporarily unavailable'
      },
      hotspots: [],
      alerts: [{
        id: 'system_alert',
        type: 'system',
        severity: 'medium',
        message: 'Air quality data sources temporarily unavailable',
        timestamp: new Date().toISOString()
      }],
      data_sources: []
    };
  }

  // 🔍 Get specific location data
  async getLocationData(lat, lon, locationName = 'Custom Location') {
    try {
      if (!this.apis.weatherapi) {
        throw new Error('WeatherAPI key required for location-specific data');
      }

      const response = await axios.get(
        `https://api.weatherapi.com/v1/current.json?key=${this.apis.weatherapi}&q=${lat},${lon}&aqi=yes`,
        { timeout: 10000 }
      );

      const data = response.data;

      return {
        location: locationName,
        coordinates: { lat: data.location.lat, lon: data.location.lon },
        air_quality: {
          pm25: data.current.air_quality?.pm2_5,
          pm10: data.current.air_quality?.pm10,
          no2: data.current.air_quality?.no2,
          o3: data.current.air_quality?.o3,
          co: data.current.air_quality?.co,
          so2: data.current.air_quality?.so2,
          aqi_us: data.current.air_quality?.['us-epa-index']
        },
        weather: {
          temperature: data.current.temp_c,
          humidity: data.current.humidity,
          wind_speed: data.current.wind_kph / 3.6,
          condition: data.current.condition.text
        },
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Location data fetch failed:', error);
      throw error;
    }
  }

  // 🗄️ Clear cache manually
  clearCache() {
    this.cache.flushAll();
    console.log('🗑️ Cache cleared');
  }

  // 📊 Get cache statistics
  getCacheStats() {
    return {
      keys: this.cache.keys(),
      stats: this.cache.getStats()
    };
  }
}

export default new DirectDataService();