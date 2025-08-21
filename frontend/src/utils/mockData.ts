// Mock data generators for demo mode

import {
  AirQualityZone,
  PolicyRecommendation,
  Alert,
  AIInsight,
  WeatherData,
  SatelliteData
} from '../context/DataContext';

// Generate mock air quality zones
const generateMockZones = (): AirQualityZone[] => {
  const zones = [
    { name: 'CBD', pm25: 45.2, coords: [36.8219, -1.2921] },
    { name: 'Westlands', pm25: 38.7, coords: [36.8094, -1.2676] },
    { name: 'Eastlands', pm25: 52.1, coords: [36.8917, -1.2921] },
    { name: 'Karen', pm25: 25.3, coords: [36.7073, -1.3194] },
    { name: 'Industrial Area', pm25: 67.8, coords: [36.8592, -1.3031] },
    { name: 'Kileleshwa', pm25: 32.4, coords: [36.7736, -1.2697] },
    { name: 'Kasarani', pm25: 41.6, coords: [36.8968, -1.2205] },
    { name: 'Embakasi', pm25: 58.3, coords: [36.9081, -1.3231] }
  ];

  return zones.map((zone, index) => {
    const pm25 = zone.pm25 + (Math.random() - 0.5) * 10; // Add some variation
    let severity = 'good';
    let aqi_category = 'Good';
    let aqi = Math.round(pm25 * 3);

    if (pm25 > 55) {
      severity = 'very_unhealthy';
      aqi_category = 'Very Unhealthy';
    } else if (pm25 > 35) {
      severity = 'unhealthy';
      aqi_category = 'Unhealthy';
    } else if (pm25 > 25) {
      severity = 'unhealthy_sensitive';
      aqi_category = 'Unhealthy for Sensitive Groups';
    } else if (pm25 > 15) {
      severity = 'moderate';
      aqi_category = 'Moderate';
    }

    return {
      id: `nairobi_zone_${zone.name.toLowerCase().replace(/\s+/g, '_')}`,
      name: zone.name,
      pm25: Math.max(0, pm25),
      aqi_category,
      severity,
      aqi,
      recorded_at: new Date(Date.now() - Math.random() * 3600000).toISOString(),
      geometry: { coordinates: [zone.coords[0], zone.coords[1]] as [number, number] }
    };
  });
};

// Generate mock policy recommendations
const generateMockPolicies = (): PolicyRecommendation[] => {
  return [
    {
      id: 1,
      title: 'Implement Low Emission Zone in CBD',
      description: 'Restrict high-polluting vehicles from entering the Central Business District during peak hours to reduce PM2.5 levels.',
      priority: 'high',
      expected_impact_percent: 25,
      cost_estimate: 500000,
      status: 'proposed'
    },
    {
      id: 2,
      title: 'Expand BRT System',
      description: 'Increase Bus Rapid Transit routes and electric bus fleet to reduce private vehicle dependency.',
      priority: 'critical',
      expected_impact_percent: 35,
      cost_estimate: 2500000,
      status: 'under_review'
    },
    {
      id: 3,
      title: 'Industrial Emission Controls',
      description: 'Enforce stricter emission standards for industrial facilities in Nairobi Industrial Area.',
      priority: 'high',
      expected_impact_percent: 20,
      cost_estimate: 750000,
      status: 'planning'
    },
    {
      id: 4,
      title: 'Green Belt Initiative',
      description: 'Plant trees and create green spaces in high-pollution areas to improve air quality naturally.',
      priority: 'medium',
      expected_impact_percent: 15,
      cost_estimate: 300000,
      status: 'approved'
    },
    {
      id: 5,
      title: 'Vehicle Emission Testing',
      description: 'Mandatory annual emission testing for all vehicles operating within Nairobi County.',
      priority: 'medium',
      expected_impact_percent: 18,
      cost_estimate: 400000,
      status: 'proposed'
    }
  ];
};

// Generate mock alerts
const generateMockAlerts = (): Alert[] => {
  const zones = ['Embakasi Industrial Zone', 'CBD', 'Westlands', 'Industrial Area'];
  const severities: ('critical' | 'high' | 'moderate')[] = ['critical', 'high', 'moderate'];
  const messages = [
    'EMERGENCY: PM2.5 levels exceeded 125 μg/m³ - Immediate action required!',
    'WARNING: Air quality deteriorating rapidly in this area',
    'ALERT: Unhealthy air quality levels detected',
    'NOTICE: Air quality approaching unhealthy levels'
  ];
  const actions = [
    'Close all windows and doors',
    'Avoid outdoor activities',
    'Use air purifiers if available',
    'Seek medical attention if experiencing breathing difficulties',
    'Implement emergency traffic restrictions',
    'Wear masks when outdoors',
    'Reduce strenuous outdoor activities',
    'Stay updated with air quality reports'
  ];

  return Array(3).fill(null).map((_, index) => {
    const severity = severities[Math.min(index, severities.length - 1)];
    const zone = zones[Math.floor(Math.random() * zones.length)];
    const pm25Level = severity === 'critical' ? 125 + Math.random() * 50 :
                     severity === 'high' ? 75 + Math.random() * 50 :
                     35 + Math.random() * 40;

    return {
      id: `alert_${Date.now()}_${index}`,
      zone,
      severity,
      pm25_level: pm25Level,
      message: messages[Math.floor(Math.random() * messages.length)],
      actions: actions.slice(0, 3 + Math.floor(Math.random() * 5)),
      affected_population: Math.floor(Math.random() * 50000) + 10000,
      timestamp: new Date(Date.now() - Math.random() * 86400000).toISOString()
    };
  });
};

// Generate mock AI insights
const generateMockInsights = (): AIInsight[] => {
  return [
    {
      id: 'insight_1',
      type: 'trend',
      title: 'Industrial Area Pollution Spike',
      description: 'PM2.5 levels in the Industrial Area have increased by 28% over the past week, correlating with increased factory activity.',
      confidence: 0.87,
      source: 'ai_analysis',
      timestamp: new Date(Date.now() - 12 * 3600000).toISOString(),
      related_zones: ['nairobi_zone_industrial_area'],
      recommendations: ['Implement temporary emission controls', 'Increase monitoring frequency']
    },
    {
      id: 'insight_2',
      type: 'pattern',
      title: 'Morning Traffic Pollution Pattern',
      description: 'A consistent pattern of elevated pollution levels between 7-9 AM in CBD and Westlands correlates with peak traffic hours.',
      confidence: 0.92,
      source: 'ai_analysis',
      timestamp: new Date(Date.now() - 24 * 3600000).toISOString(),
      related_zones: ['nairobi_zone_cbd', 'nairobi_zone_westlands'],
      recommendations: ['Implement congestion charging', 'Promote public transport use']
    },
    {
      id: 'insight_3',
      type: 'correlation',
      title: 'Weather Impact on Air Quality',
      description: 'Low wind speeds (<5 km/h) are strongly correlated with 40% higher PM2.5 concentrations across all monitoring zones.',
      confidence: 0.89,
      source: 'ai_analysis',
      timestamp: new Date(Date.now() - 36 * 3600000).toISOString(),
      recommendations: ['Issue air quality alerts during low wind conditions', 'Adjust activity recommendations based on wind forecast']
    },
    {
      id: 'insight_4',
      type: 'prediction',
      title: 'Weekend Air Quality Improvement',
      description: 'Based on current trends and weather forecast, air quality is predicted to improve by 30% over the weekend.',
      confidence: 0.78,
      source: 'ai_prediction',
      timestamp: new Date(Date.now() - 6 * 3600000).toISOString()
    }
  ];
};

// Generate mock weather data
const generateMockWeather = (): WeatherData => {
  return {
    location: 'Nairobi, Kenya',
    temperature: 22 + Math.random() * 8,
    humidity: 50 + Math.random() * 30,
    wind_speed: 2 + Math.random() * 10,
    wind_direction: ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.floor(Math.random() * 8)],
    precipitation: Math.random() * 5,
    weather_condition: ['Clear', 'Partly Cloudy', 'Cloudy', 'Light Rain', 'Thunderstorm'][Math.floor(Math.random() * 5)],
    timestamp: new Date().toISOString()
  };
};

// Generate mock satellite data
const generateMockSatelliteData = (): SatelliteData[] => {
  const baseCoords = [36.82, -1.29]; // Nairobi center

  return Array(15).fill(null).map((_, index) => {
    const offsetLat = (Math.random() - 0.5) * 0.2;
    const offsetLon = (Math.random() - 0.5) * 0.2;

    return {
      id: `satellite_data_${index}`,
      type: ['NO2', 'PM25', 'O3'][Math.floor(Math.random() * 3)],
      source: ['satellite', 'ground_station'][Math.floor(Math.random() * 2)],
      coordinates: [baseCoords[0] + offsetLon, baseCoords[1] + offsetLat],
      value: 10 + Math.random() * 90,
      timestamp: new Date(Date.now() - Math.random() * 86400000).toISOString(),
      quality: 0.5 + Math.random() * 0.5
    };
  });
};

// Main function to generate all mock data
export const generateMockAirQualityData = () => {
  return {
    zones: generateMockZones(),
    policies: generateMockPolicies(),
    alerts: generateMockAlerts(),
    insights: generateMockInsights(),
    weather: generateMockWeather(),
    satellite: generateMockSatelliteData()
  };
};