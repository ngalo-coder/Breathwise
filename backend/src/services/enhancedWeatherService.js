// backend/src/services/enhancedWeatherService.js
// Enhanced Weather Service with WeatherAPI.com + Open-Meteo + Air Quality Data

class EnhancedWeatherService {
  constructor() {
    this.weatherApiKey = process.env.WEATHERAPI_KEY;
    this.primaryAPI = 'weatherapi'; // Primary: WeatherAPI.com
    this.backupAPI = 'openmeteo';   // Backup: Open-Meteo
    this.maxRetries = 2;
  }

  // 🌟 Main method - Get comprehensive weather + air quality for Nairobi
  async getNairobiWeatherAndAirQuality() {
    const locations = [
      { name: 'Nairobi CBD', lat: -1.2921, lon: 36.8219 },
      { name: 'Westlands', lat: -1.2676, lon: 36.8094 },
      { name: 'Embakasi', lat: -1.3231, lon: 36.9081 },
      { name: 'Karen', lat: -1.3194, lon: 36.7073 },
      { name: 'Industrial Area', lat: -1.3031, lon: 36.8592 },
      { name: 'Kileleshwa', lat: -1.2697, lon: 36.7736 },
      { name: 'Kasarani', lat: -1.2205, lon: 36.8968 },
      { name: 'Eastlands', lat: -1.2921, lon: 36.8917 }
    ];

    try {
      // Try WeatherAPI.com first (includes air quality!)
      if (this.weatherApiKey) {
        console.log('🌤️ Using WeatherAPI.com (Primary)');
        return await this.getWeatherAPIData(locations);
      } else {
        console.log('⚠️ WeatherAPI key not found, using Open-Meteo');
        return await this.getOpenMeteoData(locations);
      }
    } catch (error) {
      console.warn('❌ Primary weather API failed, trying backup...', error.message);
      
      // Fallback to Open-Meteo
      try {
        return await this.getOpenMeteoData(locations);
      } catch (backupError) {
        console.error('❌ All weather APIs failed:', backupError.message);
        return this.generateFallbackData(locations);
      }
    }
  }

  // 🌟 WeatherAPI.com - Premium data with air quality included
  async getWeatherAPIData(locations) {
    const weatherData = [];
    
    for (const location of locations) {
      try {
        const response = await fetch(
          `https://api.weatherapi.com/v1/current.json?key=${this.weatherApiKey}&q=${location.lat},${location.lon}&aqi=yes`,
          { timeout: 10000 }
        );
        
        if (!response.ok) {
          throw new Error(`WeatherAPI HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // 🎯 Extract comprehensive data including air quality
        weatherData.push({
          location: location.name,
          coordinates: { lat: location.lat, lon: location.lon },
          
          // Weather data
          temperature: data.current.temp_c,
          humidity: data.current.humidity,
          pressure: data.current.pressure_mb,
          wind_speed: data.current.wind_kph / 3.6, // Convert to m/s
          wind_direction: data.current.wind_degree,
          weather_description: data.current.condition.text,
          visibility: data.current.vis_km,
          uv_index: data.current.uv,
          
          // 🌟 AIR QUALITY DATA - This is the game changer!
          air_quality: {
            pm25: data.current.air_quality.pm2_5,
            pm10: data.current.air_quality.pm10,
            no2: data.current.air_quality.no2,
            o3: data.current.air_quality.o3,
            co: data.current.air_quality.co,
            so2: data.current.air_quality.so2,
            aqi_us: data.current.air_quality['us-epa-index'],
            aqi_uk: data.current.air_quality['gb-defra-index']
          },
          
          data_source: 'WeatherAPI.com',
          timestamp: new Date().toISOString(),
          quality: 'high'
        });
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.warn(`❌ WeatherAPI failed for ${location.name}:`, error.message);
        // Continue with next location
      }
    }

    if (weatherData.length === 0) {
      throw new Error('WeatherAPI: No data retrieved for any location');
    }

    return {
      success: true,
      locations: weatherData,
      summary: this.calculateComprehensiveSummary(weatherData),
      data_source: 'WeatherAPI.com',
      has_air_quality: true,
      quality: 'premium',
      timestamp: new Date().toISOString()
    };
  }

  // 🌟 Open-Meteo - Free, unlimited, excellent quality
  async getOpenMeteoData(locations) {
    const weatherData = [];
    
    for (const location of locations) {
      try {
        // Weather data from Open-Meteo
        const weatherResponse = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${location.lat}&longitude=${location.lon}&current=temperature_2m,relative_humidity_2m,surface_pressure,wind_speed_10m,wind_direction_10m,weather_code,visibility,uv_index`,
          { timeout: 10000 }
        );
        
        // Air quality data from Open-Meteo (separate endpoint)
        const airQualityResponse = await fetch(
          `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${location.lat}&longitude=${location.lon}&current=pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone,european_aqi`,
          { timeout: 10000 }
        );
        
        if (!weatherResponse.ok || !airQualityResponse.ok) {
          throw new Error(`Open-Meteo HTTP error: ${weatherResponse.status}/${airQualityResponse.status}`);
        }
        
        const weatherData_raw = await weatherResponse.json();
        const airQualityData = await airQualityResponse.json();
        
        // 🎯 Combine weather + air quality data
        weatherData.push({
          location: location.name,
          coordinates: { lat: location.lat, lon: location.lon },
          
          // Weather data
          temperature: weatherData_raw.current.temperature_2m,
          humidity: weatherData_raw.current.relative_humidity_2m,
          pressure: weatherData_raw.current.surface_pressure,
          wind_speed: weatherData_raw.current.wind_speed_10m,
          wind_direction: weatherData_raw.current.wind_direction_10m,
          weather_description: this.getWeatherDescription(weatherData_raw.current.weather_code),
          visibility: weatherData_raw.current.visibility / 1000, // Convert to km
          uv_index: weatherData_raw.current.uv_index,
          
          // 🌟 AIR QUALITY DATA from Open-Meteo
          air_quality: {
            pm25: airQualityData.current.pm2_5,
            pm10: airQualityData.current.pm10,
            no2: airQualityData.current.nitrogen_dioxide,
            o3: airQualityData.current.ozone,
            co: airQualityData.current.carbon_monoxide,
            so2: airQualityData.current.sulphur_dioxide,
            aqi_eu: airQualityData.current.european_aqi
          },
          
          data_source: 'Open-Meteo',
          timestamp: new Date().toISOString(),
          quality: 'high'
        });
        
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 50));
        
      } catch (error) {
        console.warn(`❌ Open-Meteo failed for ${location.name}:`, error.message);
        // Continue with next location
      }
    }

    if (weatherData.length === 0) {
      throw new Error('Open-Meteo: No data retrieved for any location');
    }

    return {
      success: true,
      locations: weatherData,
      summary: this.calculateComprehensiveSummary(weatherData),
      data_source: 'Open-Meteo',
      has_air_quality: true,
      quality: 'high',
      timestamp: new Date().toISOString()
    };
  }

  // 🌟 Calculate comprehensive summary with air quality
  calculateComprehensiveSummary(weatherData) {
    if (weatherData.length === 0) {
      return { error: 'No weather data available' };
    }

    // Weather averages
    const avgTemp = weatherData.reduce((sum, w) => sum + (w.temperature || 0), 0) / weatherData.length;
    const avgHumidity = weatherData.reduce((sum, w) => sum + (w.humidity || 0), 0) / weatherData.length;
    const avgPressure = weatherData.reduce((sum, w) => sum + (w.pressure || 0), 0) / weatherData.length;
    const avgWindSpeed = weatherData.reduce((sum, w) => sum + (w.wind_speed || 0), 0) / weatherData.length;

    // Air quality averages
    const pm25Values = weatherData.map(w => w.air_quality?.pm25).filter(v => v != null);
    const pm10Values = weatherData.map(w => w.air_quality?.pm10).filter(v => v != null);
    const no2Values = weatherData.map(w => w.air_quality?.no2).filter(v => v != null);

    const avgPM25 = pm25Values.length > 0 ? pm25Values.reduce((sum, val) => sum + val, 0) / pm25Values.length : null;
    const avgPM10 = pm10Values.length > 0 ? pm10Values.reduce((sum, val) => sum + val, 0) / pm10Values.length : null;
    const avgNO2 = no2Values.length > 0 ? no2Values.reduce((sum, val) => sum + val, 0) / no2Values.length : null;

    // Find dominant weather
    const weatherCounts = {};
    weatherData.forEach(w => {
      if (w.weather_description) {
        weatherCounts[w.weather_description] = (weatherCounts[w.weather_description] || 0) + 1;
      }
    });
    const dominantWeather = Object.keys(weatherCounts).length > 0 
      ? Object.keys(weatherCounts).reduce((a, b) => weatherCounts[a] > weatherCounts[b] ? a : b)
      : 'unknown';

    return {
      // Weather summary
      avg_temperature: Math.round(avgTemp * 10) / 10,
      avg_humidity: Math.round(avgHumidity),
      avg_pressure: Math.round(avgPressure),
      avg_wind_speed: Math.round(avgWindSpeed * 10) / 10,
      dominant_weather: dominantWeather,
      
      // 🌟 Air quality summary
      avg_pm25: avgPM25 ? Math.round(avgPM25 * 10) / 10 : null,
      avg_pm10: avgPM10 ? Math.round(avgPM10 * 10) / 10 : null,
      avg_no2: avgNO2 ? Math.round(avgNO2 * 10) / 10 : null,
      max_pm25: pm25Values.length > 0 ? Math.max(...pm25Values) : null,
      min_pm25: pm25Values.length > 0 ? Math.min(...pm25Values) : null,
      
      // Air quality status
      overall_air_quality: avgPM25 ? this.getAirQualityStatus(avgPM25) : 'unknown',
      unhealthy_locations: pm25Values.filter(pm25 => pm25 > 35).length,
      
      // Data quality
      locations_reporting: weatherData.length,
      air_quality_coverage: pm25Values.length,
      data_completeness: Math.round((pm25Values.length / weatherData.length) * 100)
    };
  }

  // Get air quality status from PM2.5
  getAirQualityStatus(pm25) {
    if (pm25 <= 15) return 'good';
    if (pm25 <= 25) return 'moderate';
    if (pm25 <= 35) return 'unhealthy_for_sensitive';
    if (pm25 <= 55) return 'unhealthy';
    return 'very_unhealthy';
  }

  // Convert weather codes to descriptions (Open-Meteo)
  getWeatherDescription(code) {
    const codes = {
      0: 'Clear sky',
      1: 'Mainly clear',
      2: 'Partly cloudy',
      3: 'Overcast',
      45: 'Fog',
      48: 'Depositing rime fog',
      51: 'Light drizzle',
      53: 'Moderate drizzle',
      55: 'Dense drizzle',
      61: 'Slight rain',
      63: 'Moderate rain',
      65: 'Heavy rain',
      71: 'Slight snow fall',
      73: 'Moderate snow fall',
      75: 'Heavy snow fall',
      80: 'Slight rain showers',
      81: 'Moderate rain showers',
      82: 'Violent rain showers',
      95: 'Thunderstorm',
      96: 'Thunderstorm with slight hail',
      99: 'Thunderstorm with heavy hail'
    };
    return codes[code] || `Weather code ${code}`;
  }

  // 🌟 Analyze air quality impact from weather
  analyzeWeatherAirQualityCorrelation(weatherData) {
    const impacts = [];
    const summary = this.calculateComprehensiveSummary(weatherData);

    // Low wind speed increases pollution accumulation
    if (summary.avg_wind_speed < 2) {
      impacts.push({
        factor: 'Low wind speed',
        effect: 'Increases pollution accumulation',
        severity: 'high',
        value: summary.avg_wind_speed,
        description: 'Weak winds (< 2 m/s) allow pollutants to build up'
      });
    }

    // High humidity affects particulate matter
    if (summary.avg_humidity > 80) {
      impacts.push({
        factor: 'High humidity',
        effect: 'May increase PM2.5 formation',
        severity: 'moderate',
        value: summary.avg_humidity,
        description: 'High humidity can lead to secondary particulate formation'
      });
    }

    // Temperature inversion effects
    if (summary.avg_temperature < 18) {
      impacts.push({
        factor: 'Cool temperature',
        effect: 'May create temperature inversion',
        severity: 'moderate',
        value: summary.avg_temperature,
        description: 'Cool air can trap pollutants near the surface'
      });
    }

    // Rain helps clear pollutants
    const hasRain = weatherData.some(w => 
      w.weather_description && w.weather_description.toLowerCase().includes('rain')
    );
    if (hasRain) {
      impacts.push({
        factor: 'Precipitation',
        effect: 'Reduces air pollution',
        severity: 'positive',
        description: 'Rain washes pollutants out of the atmosphere'
      });
    }

    // High pressure systems
    if (summary.avg_pressure > 1020) {
      impacts.push({
        factor: 'High pressure',
        effect: 'May trap pollutants',
        severity: 'moderate',
        value: summary.avg_pressure,
        description: 'High pressure systems can create stable conditions'
      });
    }

    return {
      impacts,
      overall_effect: this.categorizeOverallEffect(impacts),
      risk_level: this.calculatePollutionRisk(impacts, summary)
    };
  }

  categorizeOverallEffect(impacts) {
    const positiveCount = impacts.filter(i => i.severity === 'positive').length;
    const negativeCount = impacts.filter(i => ['moderate', 'high'].includes(i.severity)).length;
    
    if (positiveCount > negativeCount) return 'improving';
    if (negativeCount > positiveCount) return 'worsening';
    return 'stable';
  }

  calculatePollutionRisk(impacts, summary) {
    let riskScore = 0;
    
    // Weather factors
    if (summary.avg_wind_speed < 2) riskScore += 2;
    if (summary.avg_humidity > 80) riskScore += 1;
    if (summary.avg_pressure > 1020) riskScore += 1;
    
    // Air quality factors
    if (summary.avg_pm25 > 35) riskScore += 3;
    else if (summary.avg_pm25 > 25) riskScore += 2;
    else if (summary.avg_pm25 > 15) riskScore += 1;
    
    // Rain reduces risk
    const hasRain = impacts.some(i => i.factor === 'Precipitation');
    if (hasRain) riskScore -= 2;
    
    if (riskScore >= 4) return 'high';
    if (riskScore >= 2) return 'moderate';
    return 'low';
  }

  // Generate fallback data if all APIs fail
  generateFallbackData(locations) {
    console.log('🔄 Generating fallback weather data');
    
    const fallbackData = locations.slice(0, 5).map(location => ({
      location: location.name,
      coordinates: { lat: location.lat, lon: location.lon },
      temperature: 22 + Math.random() * 8, // 22-30°C
      humidity: 50 + Math.random() * 30, // 50-80%
      pressure: 1010 + Math.random() * 15, // 1010-1025 hPa
      wind_speed: 2 + Math.random() * 6, // 2-8 m/s
      weather_description: 'partly cloudy',
      air_quality: {
        pm25: 25 + Math.random() * 30, // 25-55 μg/m³
        pm10: 35 + Math.random() * 40, // 35-75 μg/m³
        no2: 15 + Math.random() * 25  // 15-40 μg/m³
      },
      data_source: 'Fallback',
      timestamp: new Date().toISOString(),
      quality: 'estimated'
    }));

    return {
      success: true,
      locations: fallbackData,
      summary: this.calculateComprehensiveSummary(fallbackData),
      data_source: 'Fallback Data',
      has_air_quality: true,
      quality: 'estimated',
      timestamp: new Date().toISOString(),
      warning: 'Using estimated data - API unavailable'
    };
  }

  // Test API keys and connectivity
  async testConnectivity() {
    const results = {
      weatherapi: { available: false, error: null },
      openmeteo: { available: false, error: null }
    };

    // Test WeatherAPI.com
    if (this.weatherApiKey) {
      try {
        const response = await fetch(
          `https://api.weatherapi.com/v1/current.json?key=${this.weatherApiKey}&q=Nairobi,KE&aqi=yes`,
          { timeout: 5000 }
        );
        
        if (response.ok) {
          results.weatherapi.available = true;
        } else {
          results.weatherapi.error = `HTTP ${response.status}`;
        }
      } catch (error) {
        results.weatherapi.error = error.message;
      }
    } else {
      results.weatherapi.error = 'API key not configured';
    }

    // Test Open-Meteo
    try {
      const response = await fetch(
        'https://api.open-meteo.com/v1/forecast?latitude=-1.2921&longitude=36.8219&current=temperature_2m',
        { timeout: 5000 }
      );
      
      if (response.ok) {
        results.openmeteo.available = true;
      } else {
        results.openmeteo.error = `HTTP ${response.status}`;
      }
    } catch (error) {
      results.openmeteo.error = error.message;
    }

    return results;
  }

  // Get service status and recommendations
  async getServiceStatus() {
    const connectivity = await this.testConnectivity();
    
    return {
      primary_service: {
        name: 'WeatherAPI.com',
        available: connectivity.weatherapi.available,
        features: ['Weather', 'Air Quality', 'UV Index', 'Visibility'],
        cost: 'Free (1M calls/month)',
        error: connectivity.weatherapi.error
      },
      backup_service: {
        name: 'Open-Meteo',
        available: connectivity.openmeteo.available,
        features: ['Weather', 'Air Quality', 'Historical Data'],
        cost: 'Free (Unlimited)',
        error: connectivity.openmeteo.error
      },
      recommendations: this.generateRecommendations(connectivity)
    };
  }

  generateRecommendations(connectivity) {
    const recommendations = [];

    if (!connectivity.weatherapi.available && !this.weatherApiKey) {
      recommendations.push({
        type: 'setup',
        priority: 'high',
        message: 'Register for WeatherAPI.com to get premium air quality data',
        action: 'Visit https://www.weatherapi.com/signup.aspx'
      });
    }

    if (!connectivity.weatherapi.available && !connectivity.openmeteo.available) {
      recommendations.push({
        type: 'connectivity',
        priority: 'critical',
        message: 'All weather services unavailable - check internet connection',
        action: 'Verify network connectivity and firewall settings'
      });
    }

    if (connectivity.openmeteo.available && !connectivity.weatherapi.available) {
      recommendations.push({
        type: 'info',
        priority: 'low',
        message: 'Currently using Open-Meteo backup service - consider WeatherAPI.com for enhanced features',
        action: 'WeatherAPI.com provides additional UV and visibility data'
      });
    }

    return recommendations;
  }
}

export default new EnhancedWeatherService();