// API and WebSocket configuration

// Base URLs
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
export const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3001';

// API Endpoints
export const API_ENDPOINTS = {
  // Air quality endpoints
  AIR: {
    NAIROBI_ZONES: '/api/air/nairobi-zones',
    HOTSPOTS: '/api/air/hotspots',
    MEASUREMENTS: '/api/air/measurements',
    ANALYZE: '/api/air/analyze',
    SUMMARY: '/api/air/summary',
  },
  
  // Satellite data endpoints
  SATELLITE: {
    NAIROBI: '/api/satellite/nairobi',
    HOTSPOTS: '/api/satellite/hotspots',
    ALERTS: '/api/satellite/alerts',
    RECOMMENDATIONS: '/api/satellite/recommendations',
    NO2: '/api/satellite/no2',
    SUMMARY: '/api/satellite/summary',
    REFRESH: '/api/satellite/refresh',
    VALIDATION: '/api/satellite/validation',
    HEALTH: '/api/satellite/health',
  },
  
  // AI-powered endpoints
  AI: {
    ANALYSIS: '/api/ai/analysis',
    SMART_HOTSPOTS: '/api/ai/hotspots/smart',
    WARNINGS: '/api/ai/warnings',
    POLICY_EFFECTIVENESS: '/api/ai/policy/effectiveness',
    DASHBOARD: '/api/ai/dashboard',
  },
  
  // Policy endpoints
  POLICY: {
    RECOMMENDATIONS: '/api/policy/recommendations',
    SIMULATE: '/api/policy/simulate',
    ALERTS: '/api/policy/alerts',
    DASHBOARD: '/api/policy/dashboard',
  },
};

// WebSocket Events
export const WS_EVENTS = {
  JOIN_ROOM: 'join',
  LEAVE_ROOM: 'leave',
  DATA_UPDATE: 'data_update',
  SATELLITE_DATA_UPDATE: 'satellite_data_update',
  AI_ANALYSIS_COMPLETE: 'ai_analysis_complete',
  CRITICAL_WARNING: 'critical_warning',
  DATA_REFRESH_STARTED: 'data_refresh_started',
  DATA_REFRESH_COMPLETE: 'data_refresh_complete',
  DATA_REFRESH_FAILED: 'data_refresh_failed',
};

// Map Configuration
export const MAP_CONFIG = {
  NAIROBI_CENTER: [36.8219, -1.2921],
  DEFAULT_ZOOM: 11,
  MAX_ZOOM: 18,
  MIN_ZOOM: 9,
};

// Data Refresh Intervals (in milliseconds)
export const REFRESH_INTERVALS = {
  DASHBOARD: 5 * 60 * 1000, // 5 minutes
  AIR_QUALITY: 10 * 60 * 1000, // 10 minutes
  SATELLITE: 30 * 60 * 1000, // 30 minutes
  ALERTS: 2 * 60 * 1000, // 2 minutes
};