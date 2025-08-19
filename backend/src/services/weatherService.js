// backend/src/services/weatherService.js
// Weather service integration for UNEP Air Quality Platform

class WeatherService {
  constructor() {
    this.apiKey = process.env.OPENWEATHER_API_KEY || 'bd5e378503939ddaee76f12ad7a97608';
    this.baseUrl = 'https://api.openweathermap.org/data/2.5';
  }

  // Get current weather for Nairobi and surrounding areas
  async getNairobiWeather() {
    const locations = [
      { name: 'Nairobi CBD', lat: -1.2921, lon: 36.8219 },
      { name: 'Westlands', lat: -1.2676, lon: 36.8094 },
      { name: 'Embakasi', lat: -1.3231, lon: 36.9081 },
      { name: 'Karen', lat: -1.3194, lon: 36.7073 },
      { name: 'Industrial Area', lat: -1.3031, lon: 36.8592 }
    ];

    const weatherData = [];

    for (const location of locations) {
      try {
        const weather = await this.getWeatherByCoordinates(location.lat, location.lon);
        
        if (weather.success) {
          weatherData.push({
            location: location.name,
            coordinates: { lat: location.lat, lon: location.lon },
            temperature: weather.temperature,
            humidity: weather.humidity,
            pressure: weather.pressure,
            wind_speed: weather.windSpeed,
            weather_description: weather.weather,
            timestamp: new Date().toISOString()
          });
        }
      } catch (error) {
        console.warn(`Failed to fetch weather for ${location.name}:`, error);
      }
    }

    return {
      success: true,
      locations: weatherData,
      summary: this.calculateWeatherSummary(weatherData),
      timestamp: new Date().toISOString()
    };
  }

  // Get weather by coordinates
  async getWeatherByCoordinates(lat, lon) {
    const url = `${this.baseUrl}/weather?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=metric`;
    
    try {
      const response = await fetch(url, { timeout: 10000 });
      const data = await response.json();
      
      if (response.ok) {
        return {
          success: true,
          temperature: data.main.temp,
          humidity: data.main.humidity,
          pressure: data.main.pressure,
          windSpeed: data.wind?.speed || 0,
          weather: data.weather[0].description,
          location: data.name,
          country: data.sys.country,
          coordinates: { lat: data.coord.lat, lon: data.coord.lon },
          visibility: data.visibility || null,
          clouds: data.clouds?.all || 0
        };
      } else {
        console.error('OpenWeatherMap API Error:', data);
        return {
          success: false,
          error: data.message,
          code: data.cod
        };
      }
    } catch (error) {
      console.error('Weather API Network Error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get weather by city name
  async getWeatherByCity(city, country = 'KE') {
    const url = `${this.baseUrl}/weather?q=${city},${country}&appid=${this.apiKey}&units=metric`;
    
    try {
      const response = await fetch(url, { timeout: 10000 });
      const data = await response.json();
      
      if (response.ok) {
        return {
          success: true,
          temperature: data.main.temp,
          humidity: data.main.humidity,
          pressure: data.main.pressure,
          windSpeed: data.wind?.speed || 0,
          weather: data.weather[0].description,
          location: data.name,
          country: data.sys.country
        };
      } else {
        return {
          success: false,
          error: data.message,
          code: data.cod
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Calculate weather summary
  calculateWeatherSummary(weatherData) {
    if (weatherData.length === 0) {
      return {
        avg_temperature: null,
        avg_humidity: null,
        avg_pressure: null,
        dominant_weather: null
      };
    }

    const avgTemp = weatherData.reduce((sum, w) => sum + w.temperature, 0) / weatherData.length;
    const avgHumidity = weatherData.reduce((sum, w) => sum + w.humidity, 0) / weatherData.length;
    const avgPressure = weatherData.reduce((sum, w) => sum + w.pressure, 0) / weatherData.length;
    
    // Find most common weather description
    const weatherCounts = {};
    weatherData.forEach(w => {
      weatherCounts[w.weather_description] = (weatherCounts[w.weather_description] || 0) + 1;
    });
    const dominantWeather = Object.keys(weatherCounts).reduce((a, b) => 
      weatherCounts[a] > weatherCounts[b] ? a : b
    );

    return {
      avg_temperature: Math.round(avgTemp * 10) / 10,
      avg_humidity: Math.round(avgHumidity),
      avg_pressure: Math.round(avgPressure),
      dominant_weather: dominantWeather,
      locations_reporting: weatherData.length
    };
  }

  // Check if weather conditions affect air quality
  analyzeAirQualityImpact(weatherData) {
    const summary = this.calculateWeatherSummary(weatherData);
    const impacts = [];

    // Low wind speed increases pollution accumulation
    const avgWindSpeed = weatherData.reduce((sum, w) => sum + (w.wind_speed || 0), 0) / weatherData.length;
    if (avgWindSpeed < 2) {
      impacts.push({
        factor: 'Low wind speed',
        effect: 'Increases pollution accumulation',
        severity: 'moderate',
        description: 'Weak winds allow pollutants to build up instead of dispersing'
      });
    }

    // High humidity can affect particulate matter
    if (summary.avg_humidity > 80) {
      impacts.push({
        factor: 'High humidity',
        effect: 'May increase PM2.5 formation',
        severity: 'low',
        description: 'High humidity can lead to secondary particulate formation'
      });
    }

    // Rain helps clear pollutants
    const hasRain = weatherData.some(w => w.weather_description.includes('rain'));
    if (hasRain) {
      impacts.push({
        factor: 'Precipitation',
        effect: 'Reduces air pollution',
        severity: 'positive',
        description: 'Rain helps wash pollutants out of the atmosphere'
      });
    }

    // High pressure systems can trap pollutants
    if (summary.avg_pressure > 1020) {
      impacts.push({
        factor: 'High pressure',
        effect: 'May trap pollutants near surface',
        severity: 'moderate',
        description: 'High pressure systems can create temperature inversions'
      });
    }

    return {
      impacts,
      overall_effect: impacts.length > 0 ? this.categorizeOverallEffect(impacts) : 'neutral'
    };
  }

  categorizeOverallEffect(impacts) {
    const positiveCount = impacts.filter(i => i.severity === 'positive').length;
    const negativeCount = impacts.filter(i => ['moderate', 'high'].includes(i.severity)).length;
    
    if (positiveCount > negativeCount) return 'improving';
    if (negativeCount > positiveCount) return 'worsening';
    return 'neutral';
  }

  // Generate mock weather data if API fails
  generateMockWeatherData() {
    return {
      success: true,
      locations: [
        {
          location: 'Nairobi CBD',
          coordinates: { lat: -1.2921, lon: 36.8219 },
          temperature: 24 + Math.random() * 6, // 24-30°C
          humidity: 50 + Math.random() * 30, // 50-80%
          pressure: 1010 + Math.random() * 15, // 1010-1025 hPa
          wind_speed: 2 + Math.random() * 6, // 2-8 m/s
          weather_description: 'partly cloudy',
          timestamp: new Date().toISOString()
        },
        {
          location: 'Westlands',
          coordinates: { lat: -1.2676, lon: 36.8094 },
          temperature: 23 + Math.random() * 5,
          humidity: 55 + Math.random() * 25,
          pressure: 1012 + Math.random() * 12,
          wind_speed: 3 + Math.random() * 5,
          weather_description: 'clear sky',
          timestamp: new Date().toISOString()
        }
      ],
      summary: {
        avg_temperature: 26.5,
        avg_humidity: 62,
        avg_pressure: 1015,
        dominant_weather: 'partly cloudy',
        locations_reporting: 2
      },
      timestamp: new Date().toISOString()
    };
  }

  // Test API key validity
  async testAPIKey() {
    try {
      const result = await this.getWeatherByCity('Nairobi', 'KE');
      return {
        valid: result.success,
        message: result.success ? 'API key is working' : result.error,
        test_data: result.success ? result : null
      };
    } catch (error) {
      return {
        valid: false,
        message: error.message,
        test_data: null
      };
    }
  }
}

export default new WeatherService();

