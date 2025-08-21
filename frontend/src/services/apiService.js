import axios from 'axios';

// Create axios instance with default config
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8001/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    console.log(`🌐 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`);
    return response.data;
  },
  (error) => {
    console.error('❌ API Response Error:', error.response?.data || error.message);
    
    // Handle specific error cases
    if (error.response?.status === 404) {
      throw new Error('Endpoint not found');
    } else if (error.response?.status === 500) {
      throw new Error('Server error - please try again later');
    } else if (error.code === 'ECONNABORTED') {
      throw new Error('Request timeout - please check your connection');
    } else if (!error.response) {
      throw new Error('Network error - please check your connection');
    }
    
    throw new Error(error.response?.data?.message || error.message || 'An error occurred');
  }
);

export const apiService = {
  // Dashboard endpoints
  getDashboard: () => api.get('/dashboard'),
  getNairobiData: () => api.get('/nairobi'),
  
  // Air quality measurements
  getMeasurements: (params = {}) => api.get('/measurements', { params }),
  getHotspots: (params = {}) => api.get('/hotspots', { params }),
  getAlerts: (params = {}) => api.get('/alerts', { params }),
  
  // AI-powered endpoints
  getAIAnalysis: (params = {}) => api.get('/ai/analysis', { params }),
  getSmartHotspots: (params = {}) => api.get('/ai/hotspots', { params }),
  getEarlyWarnings: (params = {}) => api.get('/ai/warnings', { params }),
  
  // Policy endpoints
  getPolicyRecommendations: (params = {}) => api.get('/policy/recommendations', { params }),
  getPolicyEffectiveness: (params = {}) => api.get('/ai/policy/effectiveness', { params }),
  simulatePolicyImpact: (data) => api.post('/policy/simulate', data),
  
  // Location-specific data
  getLocationData: (lat, lon, name) => api.get('/location', {
    params: { lat, lon, name }
  }),
  
  // Data refresh
  refreshData: () => api.post('/refresh'),
  
  // System health
  getHealth: () => api.get('/health', { baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8001' }),
  testAPIs: () => api.get('/test-apis'),
  
  // Cache management
  clearCache: () => api.post('/cache/clear'),
  
  // Enhanced satellite endpoints
  getSatelliteData: () => api.get('/satellite/nairobi'),
  getSatelliteHotspots: (params = {}) => api.get('/satellite/hotspots', { params }),
  getSatelliteAlerts: (params = {}) => api.get('/satellite/alerts', { params }),
  getSatelliteRecommendations: (params = {}) => api.get('/satellite/recommendations', { params }),
  getSatelliteNO2: (params = {}) => api.get('/satellite/no2', { params }),
  getSatelliteSummary: (params = {}) => api.get('/satellite/summary', { params }),
  refreshSatelliteData: () => api.post('/satellite/refresh'),
  
  // Weather data
  getWeatherData: () => api.get('/weather/nairobi'),
  
  // Analytics endpoints (for future expansion)
  getAnalytics: (params = {}) => api.get('/analytics', { params }),
  getTrends: (params = {}) => api.get('/analytics/trends', { params }),
  getCorrelations: (params = {}) => api.get('/analytics/correlations', { params }),
};

// Utility functions for common operations
export const dataUtils = {
  // Format API responses for components
  formatDashboardData: (data) => ({
    ...data,
    lastUpdate: new Date(data.timestamp || Date.now()),
    formattedUpdate: new Date(data.timestamp || Date.now()).toLocaleString(),
  }),
  
  formatMeasurements: (measurements) => 
    measurements.map(m => ({
      ...m,
      properties: {
        ...m.properties,
        formattedTime: new Date(m.properties.timestamp).toLocaleString(),
        aqiCategory: getAQICategory(m.properties.pm25),
        severityColor: getSeverityColor(m.properties.pm25),
      }
    })),
  
  formatHotspots: (hotspots) =>
    hotspots.map(h => ({
      ...h,
      properties: {
        ...h.properties,
        formattedTime: new Date(h.properties.detection_time).toLocaleString(),
        severityColor: getSeverityColor(h.properties.value, h.properties.pollutant),
        urgencyLevel: getUrgencyLevel(h.properties.severity),
      }
    })),
  
  formatAlerts: (alerts) =>
    alerts.map(a => ({
      ...a,
      formattedTime: new Date(a.timestamp).toLocaleString(),
      timeAgo: getTimeAgo(a.timestamp),
      severityColor: getSeverityColor(a.current_value, 'PM2.5'),
      icon: getAlertIcon(a.type),
    })),
  
  // Calculate statistics
  calculateStats: (measurements) => {
    if (!measurements.length) return null;
    
    const pm25Values = measurements
      .map(m => m.properties?.pm25)
      .filter(val => val != null);
    
    const no2Values = measurements
      .map(m => m.properties?.no2)
      .filter(val => val != null);
    
    return {
      pm25: {
        avg: pm25Values.length ? pm25Values.reduce((sum, val) => sum + val, 0) / pm25Values.length : null,
        max: pm25Values.length ? Math.max(...pm25Values) : null,
        min: pm25Values.length ? Math.min(...pm25Values) : null,
        count: pm25Values.length,
      },
      no2: {
        avg: no2Values.length ? no2Values.reduce((sum, val) => sum + val, 0) / no2Values.length : null,
        max: no2Values.length ? Math.max(...no2Values) : null,
        min: no2Values.length ? Math.min(...no2Values) : null,
        count: no2Values.length,
      },
      totalMeasurements: measurements.length,
    };
  },
  
  // Group data by criteria
  groupByLocation: (measurements) => {
    return measurements.reduce((groups, measurement) => {
      const location = measurement.properties?.name || 'Unknown';
      if (!groups[location]) groups[location] = [];
      groups[location].push(measurement);
      return groups;
    }, {});
  },
  
  groupBySource: (measurements) => {
    return measurements.reduce((groups, measurement) => {
      const source = measurement.properties?.source || 'Unknown';
      if (!groups[source]) groups[source] = [];
      groups[source].push(measurement);
      return groups;
    }, {});
  },
  
  // Filter functions
  filterByTimeRange: (data, hours = 24) => {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return data.filter(item => {
      const timestamp = item.properties?.timestamp || item.timestamp;
      return new Date(timestamp) >= cutoff;
    });
  },
  
  filterBySeverity: (data, minSeverity = 'moderate') => {
    const severityOrder = ['low', 'moderate', 'high', 'critical'];
    const minIndex = severityOrder.indexOf(minSeverity);
    
    return data.filter(item => {
      const severity = item.properties?.severity || item.severity;
      const itemIndex = severityOrder.indexOf(severity);
      return itemIndex >= minIndex;
    });
  },
  
  filterByPollutant: (measurements, pollutant, threshold) => {
    return measurements.filter(m => {
      const value = m.properties?.[pollutant];
      return value != null && value >= threshold;
    });
  },
};

// Helper functions
function getAQICategory(pm25) {
  if (!pm25) return 'Unknown';
  if (pm25 <= 15) return 'Good';
  if (pm25 <= 25) return 'Moderate';
  if (pm25 <= 35) return 'Unhealthy for Sensitive Groups';
  if (pm25 <= 55) return 'Unhealthy';
  return 'Very Unhealthy';
}

function getSeverityColor(value, pollutant = 'PM2.5') {
  if (!value) return 'gray';
  
  if (pollutant === 'PM2.5') {
    if (value <= 15) return 'green';
    if (value <= 25) return 'yellow';
    if (value <= 35) return 'orange';
    if (value <= 55) return 'red';
    return 'purple';
  }
  
  // Default severity colors
  if (value <= 20) return 'green';
  if (value <= 40) return 'yellow';
  if (value <= 60) return 'orange';
  return 'red';
}

function getUrgencyLevel(severity) {
  switch (severity) {
    case 'critical': return 5;
    case 'high': return 4;
    case 'moderate': return 3;
    case 'low': return 2;
    default: return 1;
  }
}

function getTimeAgo(timestamp) {
  const now = new Date();
  const time = new Date(timestamp);
  const diffMs = now - time;
  
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffMinutes < 60) return `${diffMinutes} minutes ago`;
  if (diffHours < 24) return `${diffHours} hours ago`;
  return `${diffDays} days ago`;
}

function getAlertIcon(type) {
  switch (type) {
    case 'health_emergency': return '🚨';
    case 'air_pollution': return '💨';
    case 'pollution_hotspot': return '🔥';
    case 'system': return '⚙️';
    case 'data_quality': return '📊';
    default: return '⚠️';
  }
}

// Error handling utilities
export const errorHandler = {
  isNetworkError: (error) => {
    return !error.response && (error.code === 'ECONNABORTED' || error.message.includes('Network Error'));
  },
  
  isServerError: (error) => {
    return error.response && error.response.status >= 500;
  },
  
  isClientError: (error) => {
    return error.response && error.response.status >= 400 && error.response.status < 500;
  },
  
  getUserMessage: (error) => {
    if (errorHandler.isNetworkError(error)) {
      return 'Connection failed. Please check your internet connection.';
    }
    
    if (errorHandler.isServerError(error)) {
      return 'Server is temporarily unavailable. Please try again later.';
    }
    
    if (error.response?.status === 404) {
      return 'The requested data was not found.';
    }
    
    return error.message || 'An unexpected error occurred.';
  },
  
  shouldRetry: (error) => {
    return errorHandler.isNetworkError(error) || errorHandler.isServerError(error);
  },
};

export default api;