// backend/src/services/directDataService.js
// Direct API data fetching without database dependency

import axios from 'axios';
import NodeCache from 'node-cache';
import aiPolicyService from './aiPolicyService.js';

class DirectDataService {
  constructor() {
    // Cache for 15 minutes to avoid excessive API calls
    this.cache = new NodeCache({ stdTTL: 900, checkperiod: 120 });
    this.apis = {
      weatherapi: process.env.WEATHERAPI_KEY,
      openaq: process.env.OPENAQ_API_KEY,
      iqair: process.env.IQAIR_API_KEY,
      waqi: process.env.WAQI_TOKEN
    };
    
    // API configuration
    this.config = {
      timeout: 10000,
      retries: 2,
      retryDelay: 1000
    };
  }
async enhanceWithAIInsights(cityData) {
  try {
    const aiAnalysis = await aiPolicyService.generateQuickAnalysis();
    
    return {
      ...cityData,
      ai_insights: {
        ...aiAnalysis,
        generated_at: new Date().toISOString()
      }
    };
  } catch (error) {
    console.error('AI enhancement failed, returning basic data:', error);
    return cityData; // Return original data if AI fails
  }
}

  

  // 🌟 Get all air quality data for a city
  async getCityData(city = 'Nairobi', country = 'Kenya') {
  const cacheKey = `${city.toLowerCase().replace(/ /g, '_')}_${country.toLowerCase()}_complete_data`;
  const cached = this.cache.get(cacheKey);
  
  if (cached) {
    console.log('📦 Returning cached data for', city);
    
    // Enhance cached data with AI insights if enabled
    if (process.env.AI_ENABLED === 'true') {
      try {
        const enhancedData = await this.enhanceWithAIInsights(cached, city, country);
        return enhancedData;
      } catch (aiError) {
        console.warn('⚠️ AI enhancement failed for cached data, returning original:', aiError.message);
        return cached;
      }
    }
    
    return cached;
  }

  try {
    console.log(`🌍 Fetching live ${city}, ${country} air quality data...`);
    
    // Fetch data from all sources in parallel with retry logic
    const [weatherData, iqairData, waqiData] = await Promise.allSettled([
      this.fetchWithRetry(() => this.fetchWeatherAPIData(city, country)),
      this.fetchWithRetry(() => this.fetchIQAirData(city, country)),
      this.fetchWithRetry(() => this.fetchWAQIData(city))
    ]);

    // Process results
    const combinedData = {
      timestamp: new Date().toISOString(),
      location: `${city}, ${country}`,
      coordinates: this.getCityCoordinates(city, country),
      
      // Process all data sources
      measurements: this.processMeasurements(
        weatherData, 
        {status: 'fulfilled', value: []}, // Empty OpenAQ data
        iqairData, 
        waqiData
      ),
      summary: {},
      hotspots: [],
      alerts: [],
      data_sources: this.getActiveSources(weatherData, {status: 'fulfilled', value: []}, iqairData, waqiData),
      health_advisory: {},
      warnings: ["OpenAQ API is deprecated and no longer available"],
      ai_insights: null // Placeholder for AI insights
    };

    // Generate summary statistics
    combinedData.summary = this.calculateSummary(combinedData.measurements);
    
    // Identify hotspots
    combinedData.hotspots = this.identifyHotspots(combinedData.measurements);
    
    // Generate alerts
    combinedData.alerts = this.generateAlerts(combinedData.summary, combinedData.hotspots);
    
    // Generate health advisory
    combinedData.health_advisory = this.generateHealthAdvisory(combinedData.summary);
    
    // Enhance with AI insights if enabled
    if (process.env.AI_ENABLED === 'true') {
      try {
        await this.enhanceWithAIInsights(combinedData, city, country);
      } catch (aiError) {
        console.warn('⚠️ AI enhancement failed:', aiError.message);
        // Continue without AI insights
        combinedData.ai_insights = {
          status: 'unavailable',
          message: 'AI analysis temporarily unavailable',
          timestamp: new Date().toISOString()
        };
      }
    }

    // Cache the result
    this.cache.set(cacheKey, combinedData);
    
    console.log(`✅ Data compiled: ${combinedData.measurements.length} measurements from ${combinedData.data_sources.length} sources`);
    return combinedData;

  } catch (error) {
    console.error('❌ Error fetching data:', error);
    
    // Get emergency fallback and try to enhance with AI if enabled
    const fallbackData = this.getEmergencyFallback(city, country);
    
    if (process.env.AI_ENABLED === 'true') {
      try {
        await this.enhanceWithAIInsights(fallbackData, city, country);
      } catch (aiError) {
        console.warn('⚠️ AI enhancement failed for fallback data:', aiError.message);
      }
    }
    
    return fallbackData;
  }
}

// New helper method to enhance data with AI insights
async enhanceWithAIInsights(data, city, country) {
  // Only proceed if we have meaningful data to analyze
  if (data.measurements.length === 0 && data.hotspots.length === 0) {
    console.log('⚠️ Skipping AI enhancement: insufficient data');
    data.ai_insights = {
      status: 'skipped',
      message: 'Insufficient data for AI analysis',
      timestamp: new Date().toISOString()
    };
    return data;
  }

  try {
    console.log('🧠 Enhancing data with AI insights...');
    
    // Get weather data for context if not already available
    let weatherData = {};
    try {
      weatherData = await this.fetchWeatherAPIData(city, country);
    } catch (weatherError) {
      console.warn('⚠️ Weather data unavailable for AI context:', weatherError.message);
    }
    
    // Generate AI analysis
    const aiAnalysis = await aiPolicyService.generateComprehensiveAnalysis({
      satelliteData: data,
      weatherData: weatherData,
      analysisDepth: process.env.AI_ANALYSIS_DEPTH || 'comprehensive'
    });
    
    // Add AI insights to the data
    data.ai_insights = {
      ...aiAnalysis,
      generated_at: new Date().toISOString(),
      model: process.env.PREFERRED_AI_MODEL || 'anthropic/claude-3.5-sonnet'
    };
    
    console.log('✅ AI enhancement completed');
    return data;
    
  } catch (error) {
    console.error('❌ AI enhancement failed:', error);
    throw error; // Re-throw to let caller handle
  }
}

  // 🔁 Retry mechanism for API calls
  async fetchWithRetry(apiCall, retries = this.config.retries, delay = this.config.retryDelay) {
    try {
      return await apiCall();
    } catch (error) {
      if (retries > 0) {
        console.log(`🔄 Retrying API call... (${retries} attempts left)`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.fetchWithRetry(apiCall, retries - 1, delay * 1.5);
      }
      throw error;
    }
  }

  

  // 🌤️ WeatherAPI.com - Premium air quality data
  async fetchWeatherAPIData(city = 'Nairobi', country = 'Kenya') {
    if (!this.apis.weatherapi) {
      console.warn('⚠️ WeatherAPI key not configured');
      return null;
    }
 
    const coords = this.getCityCoordinates(city, country);
    const coordString = `${coords.lat},${coords.lon}`;
    
    const locations = [
      { name: `${city} CBD`, coords: coordString },
      { name: `${city} West`, coords: this.getNearbyCoords(coordString, 0.02, -0.02) },
      { name: `${city} East`, coords: this.getNearbyCoords(coordString, 0.02, 0.02) },
      { name: `${city} North`, coords: this.getNearbyCoords(coordString, -0.02, 0) },
      { name: `${city} South`, coords: this.getNearbyCoords(coordString, 0.02, 0) }
    ];

    const results = [];
    
    for (const location of locations) {
      try {
        const response = await axios.get(
          `https://api.weatherapi.com/v1/current.json`,
          {
            params: {
              key: this.apis.weatherapi,
              q: location.coords,
              aqi: 'yes'
            },
            timeout: this.config.timeout
          }
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
        await new Promise(resolve => setTimeout(resolve, 200));
        
      } catch (error) {
        console.warn(`⚠️ WeatherAPI failed for ${location.name}:`, error.message);
        // Continue with other locations even if one fails
      }
    }
    
    return results.length > 0 ? results : null;
  }

  // 🏢 IQAir - Commercial air quality data
  async fetchIQAirData(city = 'Nairobi', country = 'Kenya') {
    if (!this.apis.iqair) {
      console.warn('⚠️ IQAir API key not configured');
      return null;
    }

    try {
      const state = this.getStateFromCityCountry(city, country);
      
      const response = await axios.get(
        'https://api.airvisual.com/v2/city',
        {
          params: {
            city: city,
            state: state,
            country: country,
            key: this.apis.iqair
          },
          timeout: this.config.timeout
        }
      );

      if (response.data.status === 'success') {
        const data = response.data.data;
        return {
          location: data.city,
          coordinates: data.location?.coordinates || this.getCityCoordinates(city, country),
          air_quality: data.current?.pollution,
          weather: data.current?.weather,
          source: 'IQAir',
          quality: 'commercial',
          timestamp: new Date().toISOString()
        };
      } else {
        console.warn(`⚠️ IQAir API returned error: ${response.data.data?.message || 'Unknown error'}`);
        return null;
      }
    } catch (error) {
      console.warn(`⚠️ IQAir fetch failed for ${city}:`, error.message);
      return null;
    }
  }
  
  // 🌐 WAQI - World Air Quality Index
  async fetchWAQIData(city = 'Nairobi') {
    if (!this.apis.waqi) {
      console.warn('⚠️ WAQI token not configured');
      return [];
    }

    try {
      const searchResponse = await axios.get(
        'https://api.waqi.info/search/',
        {
          params: {
            token: this.apis.waqi,
            keyword: city
          },
          timeout: this.config.timeout
        }
      );
      
      const data = searchResponse.data.data;

      if (!data || data.length === 0) {
        console.warn(`⚠️ WAQI search for ${city} returned no results`);
        return [];
      }

      // Get data from the first 3 stations
      const stationPromises = data.slice(0, 3).map(async (station) => {
        try {
          const stationId = station.uid;
          const feedResponse = await axios.get(
            `https://api.waqi.info/feed/@${stationId}/`,
            {
              params: { token: this.apis.waqi },
              timeout: this.config.timeout
            }
          );
          
          const feedData = feedResponse.data.data;
          return {
            station: station.station.name,
            location: feedData.city.name,
            coordinates: feedData.city.geo,
            aqi: feedData.aqi,
            measurements: feedData.iaqi,
            time: feedData.time,
            source: 'WAQI',
            quality: 'community'
          };
        } catch (error) {
          console.warn(`⚠️ WAQI station data fetch failed:`, error.message);
          return null;
        }
      });

      const results = await Promise.all(stationPromises);
      return results.filter(station => station !== null);
      
    } catch (error) {
      console.warn(`⚠️ WAQI fetch failed for ${city}:`, error.message);
      return [];
    }
  }

  // 🔄 Process all measurements into unified format
  processMeasurements(weatherData, openaqData, iqairData, waqiData) {
    const measurements = [];
    
    // Process WeatherAPI data
    if (weatherData.status === 'fulfilled' && weatherData.value) {
      weatherData.value.forEach(station => {
        if (!station) return;
        
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
          aqi_us: station.air_quality?.aqius,
          aqi_cn: station.air_quality?.aqicn,
          temperature: station.weather?.tp,
          humidity: station.weather?.hu,
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
            coordinates: station.coordinates || [0, 0]
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
            timestamp: station.time?.s || new Date().toISOString()
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
    
    const o3Values = measurements
      .map(m => m.properties.o3)
      .filter(o3 => o3 != null && !isNaN(o3));
    
    const summary = {
      total_measurements: measurements.length,
      active_sources: [...new Set(measurements.map(m => m.properties.source))],
      spatial_coverage: this.calculateSpatialCoverage(measurements),
      last_update: new Date().toISOString()
    };
    
    if (pm25Values.length > 0) {
      summary.avg_pm25 = Math.round((pm25Values.reduce((sum, val) => sum + val, 0) / pm25Values.length) * 10) / 10;
      summary.max_pm25 = Math.round(Math.max(...pm25Values) * 10) / 10;
      summary.min_pm25 = Math.round(Math.min(...pm25Values) * 10) / 10;
      summary.aqi = this.calculateAQI(summary.avg_pm25);
      summary.air_quality_status = this.getAQICategory(summary.aqi);
      summary.unhealthy_readings = pm25Values.filter(pm25 => pm25 > 35).length;
    }
    
    if (no2Values.length > 0) {
      summary.avg_no2 = Math.round((no2Values.reduce((sum, val) => sum + val, 0) / no2Values.length) * 10) / 10;
      summary.max_no2 = Math.round(Math.max(...no2Values) * 10) / 10;
    }
    
    if (o3Values.length > 0) {
      summary.avg_o3 = Math.round((o3Values.reduce((sum, val) => sum + val, 0) / o3Values.length) * 10) / 10;
      summary.max_o3 = Math.round(Math.max(...o3Values) * 10) / 10;
    }
    
    return summary;
  }

  // 🔥 Identify pollution hotspots
  identifyHotspots(measurements) {
    const hotspots = [];
    
    measurements.forEach(measurement => {
      const pm25 = measurement.properties.pm25;
      const no2 = measurement.properties.no2;
      const o3 = measurement.properties.o3;
      
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
      
      // O3 hotspot criteria
      if (o3 && o3 > 100) {
        hotspots.push({
          type: 'Feature',
          geometry: measurement.geometry,
          properties: {
            hotspot_type: 'o3_elevated',
            severity: o3 > 150 ? 'high' : 'moderate',
            value: o3,
            threshold: 100,
            pollutant: 'O3',
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
    
    // Air quality alerts based on PM2.5
    if (summary.avg_pm25 > 55) {
      alerts.push({
        id: `alert_pm25_${Date.now()}`,
        type: 'health_emergency',
        severity: 'critical',
        message: `Very unhealthy air quality: PM2.5 at ${summary.avg_pm25} μg/m³`,
        threshold: 55,
        current_value: summary.avg_pm25,
        affected_area: 'City-wide',
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
        id: `alert_pm25_${Date.now()}`,
        type: 'air_pollution',
        severity: 'high',
        message: `Unhealthy air quality: PM2.5 at ${summary.avg_pm25} μg/m³`,
        threshold: 35,
        current_value: summary.avg_pm25,
        affected_area: 'City-wide',
        timestamp: new Date().toISOString(),
        actions: [
          'Sensitive groups should limit outdoor activities',
          'Consider wearing masks outdoors',
          'Monitor air quality regularly'
        ]
      });
    }
    
    // NO2 alerts
    if (summary.avg_no2 > 80) {
      alerts.push({
        id: `alert_no2_${Date.now()}`,
        type: 'air_pollution',
        severity: 'high',
        message: `Elevated nitrogen dioxide levels: NO2 at ${summary.avg_no2} μg/m³`,
        threshold: 80,
        current_value: summary.avg_no2,
        affected_area: 'City-wide',
        timestamp: new Date().toISOString(),
        actions: [
          'Avoid strenuous outdoor activities',
          'Consider reducing vehicle usage',
          'Monitor air quality for changes'
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

  // 🩺 Generate health advisory
  generateHealthAdvisory(summary) {
    if (!summary.air_quality_status || summary.air_quality_status === 'Unknown') {
      return {
        level: 'unknown',
        message: 'Insufficient data to provide health advisory',
        precautions: ['Check back later for updated information']
      };
    }
    
    const aqi = summary.aqi || 0;
    
    if (aqi <= 50) {
      return {
        level: 'good',
        message: 'Air quality is satisfactory, and air pollution poses little or no risk',
        precautions: [
          'Enjoy outdoor activities',
          'Open windows for ventilation'
        ]
      };
    } else if (aqi <= 100) {
      return {
        level: 'moderate',
        message: 'Air quality is acceptable. However, there may be a risk for some people, particularly those who are unusually sensitive to air pollution',
        precautions: [
          'Unusually sensitive people should consider reducing prolonged or heavy exertion',
          'Watch for symptoms such as coughing or shortness of breath'
        ]
      };
    } else if (aqi <= 150) {
      return {
        level: 'unhealthy_sensitive',
        message: 'Members of sensitive groups may experience health effects. The general public is less likely to be affected',
        precautions: [
          'Sensitive groups should reduce prolonged or heavy exertion',
          'People with heart or lung disease, older adults, and children should limit outdoor exertion'
        ]
      };
    } else if (aqi <= 200) {
      return {
        level: 'unhealthy',
        message: 'Some members of the general public may experience health effects; members of sensitive groups may experience more serious health effects',
        precautions: [
          'Everyone should reduce prolonged or heavy exertion',
          'Sensitive groups should avoid all physical activity outdoors',
          'Move activities indoors or reschedule to a time when air quality is better'
        ]
      };
    } else {
      return {
        level: 'very_unhealthy',
        message: 'Health alert: The risk of health effects is increased for everyone',
        precautions: [
          'Everyone should avoid all physical activity outdoors',
          'Sensitive groups should remain indoors and keep activity levels low',
          'Keep windows and doors closed',
          'Use air purifiers if available'
        ]
      };
    }
  }

  // 🔧 Utility methods
  getActiveSources(weatherData, openaqData, iqairData, waqiData) {
    const sources = [];
    
    if (weatherData.status === 'fulfilled' && weatherData.value) {
      sources.push('WeatherAPI.com');
    }
    if (iqairData.status === 'fulfilled' && iqairData.value) {
      sources.push('IQAir');
    }
    if (waqiData.status === 'fulfilled' && waqiData.value && waqiData.value.length > 0) {
      sources.push('WAQI');
    }
    
    return sources;
  }

  calculateAQI(pm25) {
    if (!pm25) return 0;
    if (pm25 <= 12) return Math.round((50 / 12) * pm25);
    if (pm25 <= 35.4) return Math.round(50 + ((100 - 50) / (35.4 - 12)) * (pm25 - 12));
    if (pm25 <= 55.4) return Math.round(100 + ((150 - 100) / (55.4 - 35.4)) * (pm25 - 35.4));
    if (pm25 <= 150.4) return Math.round(150 + ((200 - 150) / (150.4 - 55.4)) * (pm25 - 55.4));
    if (pm25 <= 250.4) return Math.round(200 + ((300 - 200) / (250.4 - 150.4)) * (pm25 - 150.4));
    return Math.round(300 + ((500 - 300) / (500.4 - 250.4)) * (pm25 - 250.4));
  }

  getAQICategory(aqi) {
    if (!aqi) return 'Unknown';
    if (aqi <= 50) return 'Good';
    if (aqi <= 100) return 'Moderate';
    if (aqi <= 150) return 'Unhealthy for Sensitive Groups';
    if (aqi <= 200) return 'Unhealthy';
    if (aqi <= 300) return 'Very Unhealthy';
    return 'Hazardous';
  }

  getNearbyCoords(coords, latOffset, lonOffset) {
    const [lat, lon] = coords.split(',').map(Number);
    return `${(lat + latOffset).toFixed(4)},${(lon + lonOffset).toFixed(4)}`;
  }

  getCityCoordinates(city, country) {
    // Default coordinates for major cities
    const cityCoordinates = {
      'nairobi': { lat: -1.2921, lon: 36.8219 },
      'paris': { lat: 48.8566, lon: 2.3522 },
      'london': { lat: 51.5074, lon: -0.1278 },
      'new york': { lat: 40.7128, lon: -74.0060 },
      'tokyo': { lat: 35.6762, lon: 139.6503 }
    };
    
    const key = city.toLowerCase();
    return cityCoordinates[key] || { lat: -1.2921, lon: 36.8219 }; // Default to Nairobi
  }

  getCountryCode(country) {
    const countryCodes = {
      'kenya': 'KE',
      'france': 'FR',
      'united states': 'US',
      'united kingdom': 'GB',
      'japan': 'JP'
    };
    
    return countryCodes[country.toLowerCase()] || country;
  }

  getStateFromCityCountry(city, country) {
    // For most countries, we can use the city name as state
    // Some APIs require state information
    if (country.toLowerCase() === 'united states') {
      // Map major US cities to states
      const usCities = {
        'new york': 'New York',
        'los angeles': 'California',
        'chicago': 'Illinois',
        'houston': 'Texas',
        'phoenix': 'Arizona'
      };
      return usCities[city.toLowerCase()] || 'California';
    }
    return city;
  }

  calculateSpatialCoverage(measurements) {
    if (measurements.length <= 1) return measurements.length;
    
    // Simple heuristic based on number of measurements and their spread
    const uniqueLocations = new Set(measurements.map(m => m.properties.name));
    return Math.min(uniqueLocations.size * 2, 10); // Scale from 0-10
  }

  // 🚨 Emergency fallback when all APIs fail
  getEmergencyFallback(city, country) {
    return {
      timestamp: new Date().toISOString(),
      location: `${city}, ${country}`,
      coordinates: this.getCityCoordinates(city, country),
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
      data_sources: [],
      health_advisory: {
        level: 'unknown',
        message: 'Insufficient data to provide health advisory',
        precautions: ['Check back later for updated information']
      },
      warnings: ["OpenAQ API is deprecated and no longer available"]
    };
  }
  

  // 🔍 Get specific location data
  async getLocationData(lat, lon, locationName = 'Custom Location') {
    try {
      if (!this.apis.weatherapi) {
        throw new Error('WeatherAPI key required for location-specific data');
      }

      const response = await axios.get(
        `https://api.weatherapi.com/v1/current.json`,
        {
          params: {
            key: this.apis.weatherapi,
            q: `${lat},${lon}`,
            aqi: 'yes'
          },
          timeout: this.config.timeout
        }
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
    return { success: true, message: 'Cache cleared successfully' };
  }

  // 📊 Get cache statistics
  getCacheStats() {
    const stats = this.cache.getStats();
    return {
      keys: this.cache.keys().length,
      hits: stats.hits,
      misses: stats.misses,
      keyCount: stats.keys,
      cacheSize: 0, // node-cache doesn't provide size information
      uptime: stats.uptime
    };
  }
}

export default new DirectDataService();