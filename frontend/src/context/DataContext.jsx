import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { apiService } from '../services/apiService';
import toast from 'react-hot-toast';

const DataContext = createContext();

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

// Action types
const actionTypes = {
  SET_LOADING: 'SET_LOADING',
  SET_DASHBOARD_DATA: 'SET_DASHBOARD_DATA',
  SET_MEASUREMENTS: 'SET_MEASUREMENTS',
  SET_HOTSPOTS: 'SET_HOTSPOTS',
  SET_ALERTS: 'SET_ALERTS',
  SET_AI_ANALYSIS: 'SET_AI_ANALYSIS',
  SET_POLICY_RECOMMENDATIONS: 'SET_POLICY_RECOMMENDATIONS',
  SET_ERROR: 'SET_ERROR',
  UPDATE_REALTIME: 'UPDATE_REALTIME',
  ADD_ALERT: 'ADD_ALERT',
  CLEAR_ERROR: 'CLEAR_ERROR',
};

// Initial state
const initialState = {
  loading: true,
  error: null,
  dashboardData: null,
  measurements: [],
  hotspots: [],
  alerts: [],
  aiAnalysis: null,
  policyRecommendations: [],
  lastUpdate: null,
};

// Reducer function
const dataReducer = (state, action) => {
  switch (action.type) {
    case actionTypes.SET_LOADING:
      return { ...state, loading: action.payload };
    
    case actionTypes.SET_DASHBOARD_DATA:
      return { ...state, dashboardData: action.payload, lastUpdate: new Date() };
    
    case actionTypes.SET_MEASUREMENTS:
      return { ...state, measurements: action.payload };
    
    case actionTypes.SET_HOTSPOTS:
      return { ...state, hotspots: action.payload };
    
    case actionTypes.SET_ALERTS:
      return { ...state, alerts: action.payload };
    
    case actionTypes.SET_AI_ANALYSIS:
      return { ...state, aiAnalysis: action.payload };
    
    case actionTypes.SET_POLICY_RECOMMENDATIONS:
      return { ...state, policyRecommendations: action.payload };
    
    case actionTypes.SET_ERROR:
      return { ...state, error: action.payload, loading: false };
    
    case actionTypes.UPDATE_REALTIME:
      return {
        ...state,
        dashboardData: {
          ...state.dashboardData,
          realtime_metrics: action.payload.data_summary,
          air_quality: { ...state.dashboardData?.air_quality, ...action.payload.air_quality }
        },
        lastUpdate: new Date()
      };
    
    case actionTypes.ADD_ALERT:
      return {
        ...state,
        alerts: [action.payload, ...state.alerts]
      };
    
    case actionTypes.CLEAR_ERROR:
      return { ...state, error: null };
    
    default:
      return state;
  }
};

export const DataProvider = ({ children }) => {
  const [state, dispatch] = useReducer(dataReducer, initialState);

  useEffect(() => {
    loadInitialData();
    setupRealtimeListeners();
  }, []);

  const loadInitialData = async () => {
    dispatch({ type: actionTypes.SET_LOADING, payload: true });
    
    try {
      // Load all data in parallel
      const [
        dashboardData,
        measurements,
        hotspots,
        alerts,
        aiAnalysis,
        policyRecommendations
      ] = await Promise.allSettled([
        apiService.getDashboard(),
        apiService.getMeasurements(),
        apiService.getHotspots(),
        apiService.getAlerts(),
        apiService.getAIAnalysis(),
        apiService.getPolicyRecommendations()
      ]);

      // Process results
      if (dashboardData.status === 'fulfilled') {
        dispatch({ type: actionTypes.SET_DASHBOARD_DATA, payload: dashboardData.value });
      }

      if (measurements.status === 'fulfilled') {
        dispatch({ type: actionTypes.SET_MEASUREMENTS, payload: measurements.value.features || [] });
      }

      if (hotspots.status === 'fulfilled') {
        dispatch({ type: actionTypes.SET_HOTSPOTS, payload: hotspots.value.features || [] });
      }

      if (alerts.status === 'fulfilled') {
        dispatch({ type: actionTypes.SET_ALERTS, payload: alerts.value.alerts || [] });
      }

      if (aiAnalysis.status === 'fulfilled') {
        dispatch({ type: actionTypes.SET_AI_ANALYSIS, payload: aiAnalysis.value });
      }

      if (policyRecommendations.status === 'fulfilled') {
        dispatch({ type: actionTypes.SET_POLICY_RECOMMENDATIONS, payload: policyRecommendations.value.recommendations || [] });
      }

    } catch (error) {
      console.error('Error loading initial data:', error);
      dispatch({ type: actionTypes.SET_ERROR, payload: error.message });
      toast.error('Failed to load data. Please try again.');
    } finally {
      dispatch({ type: actionTypes.SET_LOADING, payload: false });
    }
  };

  const setupRealtimeListeners = () => {
    // Listen for real-time updates
    window.addEventListener('realtimeUpdate', (event) => {
      dispatch({ type: actionTypes.UPDATE_REALTIME, payload: event.detail });
    });

    // Listen for critical alerts
    window.addEventListener('criticalAlert', (event) => {
      const alertData = event.detail;
      if (alertData.alerts && alertData.alerts.length > 0) {
        alertData.alerts.forEach(alert => {
          dispatch({ type: actionTypes.ADD_ALERT, payload: alert });
        });
      }
    });

    // Listen for data refresh
    window.addEventListener('dataRefreshed', () => {
      loadInitialData();
    });

    // Listen for AI analysis completion
    window.addEventListener('aiAnalysisComplete', (event) => {
      // Refresh AI analysis data
      apiService.getAIAnalysis().then(data => {
        dispatch({ type: actionTypes.SET_AI_ANALYSIS, payload: data });
      }).catch(console.error);
    });
  };

  const refreshData = async () => {
    await loadInitialData();
    toast.success('Data refreshed successfully');
  };

  const refreshSpecificData = async (dataType) => {
    dispatch({ type: actionTypes.CLEAR_ERROR });
    
    try {
      let data;
      switch (dataType) {
        case 'dashboard':
          data = await apiService.getDashboard();
          dispatch({ type: actionTypes.SET_DASHBOARD_DATA, payload: data });
          break;
        case 'measurements':
          data = await apiService.getMeasurements();
          dispatch({ type: actionTypes.SET_MEASUREMENTS, payload: data.features || [] });
          break;
        case 'hotspots':
          data = await apiService.getHotspots();
          dispatch({ type: actionTypes.SET_HOTSPOTS, payload: data.features || [] });
          break;
        case 'alerts':
          data = await apiService.getAlerts();
          dispatch({ type: actionTypes.SET_ALERTS, payload: data.alerts || [] });
          break;
        case 'ai':
          data = await apiService.getAIAnalysis();
          dispatch({ type: actionTypes.SET_AI_ANALYSIS, payload: data });
          break;
        case 'policy':
          data = await apiService.getPolicyRecommendations();
          dispatch({ type: actionTypes.SET_POLICY_RECOMMENDATIONS, payload: data.recommendations || [] });
          break;
        default:
          throw new Error(`Unknown data type: ${dataType}`);
      }
      
      toast.success(`${dataType.charAt(0).toUpperCase() + dataType.slice(1)} data updated`);
    } catch (error) {
      console.error(`Error refreshing ${dataType} data:`, error);
      dispatch({ type: actionTypes.SET_ERROR, payload: error.message });
      toast.error(`Failed to refresh ${dataType} data`);
    }
  };

  const clearError = () => {
    dispatch({ type: actionTypes.CLEAR_ERROR });
  };

  const getLocationData = async (lat, lon, name) => {
    try {
      const data = await apiService.getLocationData(lat, lon, name);
      return data;
    } catch (error) {
      console.error('Error getting location data:', error);
      toast.error('Failed to get location data');
      throw error;
    }
  };

  const triggerAIAnalysis = async (analysisType = 'comprehensive') => {
    try {
      dispatch({ type: actionTypes.CLEAR_ERROR });
      toast.loading('Generating AI analysis...', { duration: 2000 });
      
      const data = await apiService.getAIAnalysis({ analysis_depth: analysisType });
      dispatch({ type: actionTypes.SET_AI_ANALYSIS, payload: data });
      
      toast.success('AI analysis completed');
      return data;
    } catch (error) {
      console.error('Error triggering AI analysis:', error);
      toast.error('Failed to generate AI analysis');
      throw error;
    }
  };

  const value = {
    ...state,
    refreshData,
    refreshSpecificData,
    clearError,
    getLocationData,
    triggerAIAnalysis,
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};