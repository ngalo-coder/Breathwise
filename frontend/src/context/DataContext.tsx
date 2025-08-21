import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Socket } from 'socket.io-client';
import { API_BASE_URL, API_ENDPOINTS, WS_EVENTS, REFRESH_INTERVALS } from '../config';

// Types
export interface AirQualityZone {
  id: string;
  name: string;
  pm25: number;
  aqi: number;
  aqi_category: string;
  severity: string;
  recorded_at: string;
  geometry: {
    coordinates: [number, number];
  };
}

export interface PolicyRecommendation {
  id: number;
  title: string;
  description: string;
  priority: string;
  expected_impact_percent: number;
  cost_estimate: number;
  status: string;
}

export interface Alert {
  id: string;
  zone: string;
  severity: 'critical' | 'high' | 'moderate';
  pm25_level: number;
  message: string;
  actions: string[];
  affected_population: number;
  timestamp: string;
}

export interface AIInsight {
  id: string;
  type: string;
  title: string;
  description: string;
  confidence: number;
  source: string;
  timestamp: string;
  related_zones?: string[];
  recommendations?: string[];
}

export interface WeatherData {
  location: string;
  temperature: number;
  humidity: number;
  wind_speed: number;
  wind_direction: string;
  precipitation: number;
  weather_condition: string;
  timestamp: string;
}

export interface SatelliteData {
  id: string;
  type: string;
  source: string;
  coordinates: [number, number];
  value: number;
  timestamp: string;
  quality: number;
}

export interface DataContextType {
  // Air quality data
  airQualityZones: AirQualityZone[];
  policyRecommendations: PolicyRecommendation[];
  alerts: Alert[];
  aiInsights: AIInsight[];
  weatherData: WeatherData | null;
  satelliteData: SatelliteData[];

  // Selected data
  selectedZone: string | null;
  setSelectedZone: (zoneId: string | null) => void;
  selectedTimeRange: string;
  setSelectedTimeRange: (range: string) => void;

  // Data state
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;

  // Actions
  refreshData: () => Promise<void>;
  exportData: () => void;
}

// Create context with default values
const DataContext = createContext<DataContextType>({
  airQualityZones: [],
  policyRecommendations: [],
  alerts: [],
  aiInsights: [],
  weatherData: null,
  satelliteData: [],

  selectedZone: null,
  setSelectedZone: () => {},
  selectedTimeRange: '24h',
  setSelectedTimeRange: () => {},

  loading: false,
  error: null,
  lastUpdated: null,

  refreshData: async () => {},
  exportData: () => {},
});

// Provider props
interface DataProviderProps {
  children: ReactNode;
  socket: Socket | null;
  initialError: string | null;
}

// Provider component
export const DataProvider: React.FC<DataProviderProps> = ({
  children,
  socket,
  initialError
}) => {
  // State for air quality data
  const [airQualityZones, setAirQualityZones] = useState<AirQualityZone[]>([]);
  const [policyRecommendations, setPolicyRecommendations] = useState<PolicyRecommendation[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [aiInsights, setAiInsights] = useState<AIInsight[]>([]);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [satelliteData, setSatelliteData] = useState<SatelliteData[]>([]);

  // UI state
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState<string>('24h');

  // Data state
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(initialError);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Fetch data from API
  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch air quality zones
      const zonesResponse = await fetch(`${API_BASE_URL}${API_ENDPOINTS.AIR.NAIROBI_ZONES}`);
      if (!zonesResponse.ok) throw new Error(`Failed to fetch zones: ${zonesResponse.status}`);
      const zonesData = await zonesResponse.json();
      setAirQualityZones(zonesData.features || []);

      // Fetch policy recommendations
      const policiesResponse = await fetch(`${API_BASE_URL}${API_ENDPOINTS.POLICY.RECOMMENDATIONS}`);
      if (!policiesResponse.ok) throw new Error(`Failed to fetch policies: ${policiesResponse.status}`);
      const policiesData = await policiesResponse.json();
      setPolicyRecommendations(policiesData.recommendations || []);

      // Fetch alerts
      const alertsResponse = await fetch(`${API_BASE_URL}${API_ENDPOINTS.SATELLITE.ALERTS}`);
      if (!alertsResponse.ok) throw new Error(`Failed to fetch alerts: ${alertsResponse.status}`);
      const alertsData = await alertsResponse.json();
      setAlerts(alertsData.alerts || []);

      // Fetch AI insights
      const insightsResponse = await fetch(`${API_BASE_URL}${API_ENDPOINTS.AI.ANALYSIS}`);
      if (!insightsResponse.ok) throw new Error(`Failed to fetch insights: ${insightsResponse.status}`);
      const insightsData = await insightsResponse.json();
      setAiInsights(insightsData.ai_insights?.key_findings || []);

      // Fetch satellite data
      const satelliteResponse = await fetch(`${API_BASE_URL}${API_ENDPOINTS.SATELLITE.NO2}`);
      if (!satelliteResponse.ok) throw new Error(`Failed to fetch satellite data: ${satelliteResponse.status}`);
      const satelliteData = await satelliteResponse.json();
      setSatelliteData(satelliteData.features || []);

      // Fetch weather data
      try {
        const weatherResponse = await fetch(`${API_BASE_URL}${API_ENDPOINTS.SATELLITE.SUMMARY}?include_weather_correlation=true`);
        if (weatherResponse.ok) {
          const weatherData = await weatherResponse.json();
          if (weatherData.weather_correlation) {
            setWeatherData({
              location: 'Nairobi, Kenya',
              temperature: weatherData.weather_correlation.temperature || 0,
              humidity: weatherData.weather_correlation.humidity || 0,
              wind_speed: weatherData.weather_correlation.wind_speed || 0,
              wind_direction: weatherData.weather_correlation.wind_direction || 'N',
              precipitation: weatherData.weather_correlation.precipitation || 0,
              weather_condition: weatherData.weather_correlation.condition || 'Unknown',
              timestamp: weatherData.timestamp || new Date().toISOString()
            });
          }
        }
      } catch (weatherError) {
        console.warn('Weather data fetch failed:', weatherError);
        // Continue without weather data
      }

      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      console.error('Data fetch error:', err);
      setError(`Failed to load data: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  // Refresh data
  const refreshData = async () => {
    setError(null);
    await fetchData();
  };

  // Export data
  const exportData = () => {
    const data = {
      airQualityZones,
      policyRecommendations,
      alerts,
      aiInsights,
      weatherData,
      satelliteData,
      exported_at: new Date().toISOString(),
      data_source: 'live_api',
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `breathwise-data-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  // Initial data fetch
  useEffect(() => {
    fetchData();

    // Set up auto-refresh
    const interval = setInterval(() => {
      fetchData();
    }, REFRESH_INTERVALS.DASHBOARD);

    return () => clearInterval(interval);
  }, []);

  // WebSocket event handlers
  useEffect(() => {
    if (!socket) return;

    // Handle real-time data updates
    socket.on(WS_EVENTS.DATA_UPDATE, (data) => {
      console.log('Received data update:', data);
      if (data.zones) setAirQualityZones(data.zones);
      if (data.policies) setPolicyRecommendations(data.policies);
      if (data.alerts) setAlerts(data.alerts);
      setLastUpdated(new Date());
    });

    // Handle satellite data updates
    socket.on(WS_EVENTS.SATELLITE_DATA_UPDATE, (data) => {
      console.log('Received satellite data update:', data);
      // Update relevant state
    });

    // Handle AI analysis updates
    socket.on(WS_EVENTS.AI_ANALYSIS_COMPLETE, (data) => {
      console.log('Received AI analysis update:', data);
      // Update insights
    });

    // Handle critical warnings
    socket.on(WS_EVENTS.CRITICAL_WARNING, (data) => {
      console.log('Received critical warning:', data);
      // Add to alerts
      if (data.warnings) {
        setAlerts(prev => [...data.warnings, ...prev]);
      }
    });

    return () => {
      socket.off(WS_EVENTS.DATA_UPDATE);
      socket.off(WS_EVENTS.SATELLITE_DATA_UPDATE);
      socket.off(WS_EVENTS.AI_ANALYSIS_COMPLETE);
      socket.off(WS_EVENTS.CRITICAL_WARNING);
    };
  }, [socket]);

  // Context value
  const value: DataContextType = {
    airQualityZones,
    policyRecommendations,
    alerts,
    aiInsights,
    weatherData,
    satelliteData,

    selectedZone,
    setSelectedZone,
    selectedTimeRange,
    setSelectedTimeRange,

    loading,
    error,
    lastUpdated,

    refreshData,
    exportData,
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};

// Custom hook for using the data context
export const useData = () => useContext(DataContext);

export default DataContext;