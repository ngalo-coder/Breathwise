import React, { useState, useEffect, useRef } from 'react';
import { 
  Activity, 
  Wind, 
  AlertTriangle, 
  TrendingUp, 
  MapPin, 
  RefreshCw, 
  Zap, 
  Shield, 
  Brain,
  Eye,
  Cloud,
  Thermometer,
  Droplets,
  Gauge,
  Navigation,
  Calendar,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  Settings,
  Download,
  Share,
  Bell,
  Info,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useSocket } from '../../context/SocketContext';
import MapView from '../Map/MapView';
import AnalyticsView from '../Analytics/Analytics';

const AirQualityDashboard = () => {
  // State management
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedLocation, setSelectedLocation] = useState(null);

  // Context data
  const { 
    dashboardData, 
    measurements, 
    hotspots, 
    alerts, 
    aiAnalysis, 
    loading, 
    lastUpdate,
    refreshAllData,
    refreshSpecificData 
  } = useData();

  const { 
    isConnected, 
    requestDataUpdate,
    connectionStatus 
  } = useSocket();

  // Auto-refresh data every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      if (isConnected) {
        refreshAllData();
      }
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [isConnected, refreshAllData]);

  const handleRefresh = async () => {
    await refreshAllData();
    requestDataUpdate();
  };

  const getAQIColor = (aqi) => {
    if (!aqi) return 'text-gray-600 bg-gray-100';
    if (aqi <= 50) return 'text-green-600 bg-green-100';
    if (aqi <= 100) return 'text-yellow-600 bg-yellow-100';
    if (aqi <= 150) return 'text-orange-600 bg-orange-100';
    if (aqi <= 200) return 'text-red-600 bg-red-100';
    return 'text-purple-600 bg-purple-100';
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-100 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-100 border-orange-200';
      case 'moderate': return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-100 border-green-200';
      default: return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'improving': return <ArrowDown className="w-4 h-4 text-green-500" />;
      case 'worsening': return <ArrowUp className="w-4 h-4 text-red-500" />;
      default: return <Minus className="w-4 h-4 text-gray-500" />;
    }
  };

  const getAirQualityEmoji = (status) => {
    switch (status?.toLowerCase()) {
      case 'good': return '😊';
      case 'moderate': return '😐';
      case 'unhealthy for sensitive': return '😷';
      case 'unhealthy': return '😨';
      case 'very unhealthy': return '🚨';
      case 'hazardous': return '☠️';
      default: return '😐';
    }
  };

  const getHealthMessage = (status) => {
    switch (status?.toLowerCase()) {
      case 'good': return 'Air quality is excellent - perfect for outdoor activities';
      case 'moderate': return 'Air quality is acceptable for most people';
      case 'unhealthy for sensitive': return 'Sensitive groups should limit outdoor activities';
      case 'unhealthy': return 'Everyone should limit outdoor activities';
      case 'very unhealthy': return 'Avoid outdoor activities - health warnings in effect';
      case 'hazardous': return 'Emergency conditions - stay indoors';
      default: return 'Air quality monitoring in progress';
    }
  };

  const exportDashboardData = () => {
    const exportData = {
      timestamp: new Date().toISOString(),
      dashboard: dashboardData,
      measurements: measurements,
      hotspots: hotspots,
      alerts: alerts,
      ai_analysis: aiAnalysis
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nairobi-air-quality-dashboard-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const shareDashboard = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'UNEP Air Quality Dashboard - Nairobi',
          text: `Current AQI: ${dashboardData?.overview?.current_aqi || 'N/A'} - ${dashboardData?.overview?.air_quality_status || 'Unknown'}`,
          url: window.location.href
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Dashboard link copied to clipboard!');
    }
  };

  if (loading && !dashboardData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading air quality data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Wind className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">UNEP Air Quality Platform</h1>
                <p className="text-sm text-gray-600">
                  Real-time monitoring for {dashboardData?.location || 'Nairobi, Kenya'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
                <span className="text-sm text-gray-600">
                  {isConnected ? 'Live' : 'Disconnected'}
                </span>
              </div>

              {lastUpdate && (
                <span className="text-xs text-gray-500">
                  Updated: {new Date(lastUpdate).toLocaleTimeString()}
                </span>
              )}
              
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>

              <button
                onClick={exportDashboardData}
                className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700"
                title="Export Data"
              >
                <Download className="w-4 h-4" />
              </button>

              <button
                onClick={shareDashboard}
                className="bg-purple-600 text-white px-3 py-2 rounded-lg hover:bg-purple-700"
                title="Share Dashboard"
              >
                <Share className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          {/* Navigation */}
          <nav className="flex space-x-8 -mb-px">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: Activity },
              { id: 'map', label: 'Map', icon: MapPin },
              { id: 'analytics', label: 'Analytics', icon: TrendingUp },
              { id: 'alerts', label: 'Alerts', icon: Bell },
              { id: 'policy', label: 'Policy', icon: Shield }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Status Banner */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="text-4xl">
                    {getAirQualityEmoji(dashboardData?.overview?.air_quality_status)}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {dashboardData?.overview?.air_quality_status || 'Loading...'}
                    </h2>
                    <p className="text-gray-600">
                      {getHealthMessage(dashboardData?.overview?.air_quality_status)}
                    </p>
                    {dashboardData?.overview?.dominant_pollutant && (
                      <p className="text-sm text-gray-500 mt-1">
                        Primary pollutant: {dashboardData.overview.dominant_pollutant}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="text-right">
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getAQIColor(dashboardData?.overview?.current_aqi)}`}>
                    AQI {dashboardData?.overview?.current_aqi || 'N/A'}
                  </div>
                  <div className="flex items-center mt-2 text-sm text-gray-500">
                    {getTrendIcon(dashboardData?.air_quality?.trend_direction)}
                    <span className="ml-1">
                      PM2.5: {dashboardData?.overview?.pm25_level?.toFixed(1) || 'N/A'} μg/m³
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Real-time Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                <div className="flex items-center">
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <Activity className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Active Sources</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {dashboardData?.realtime_metrics?.active_sources || measurements.length || 0}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                <div className="flex items-center">
                  <div className="bg-green-100 p-3 rounded-lg">
                    <MapPin className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Measurements</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {dashboardData?.realtime_metrics?.total_measurements || measurements.length || 0}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                <div className="flex items-center">
                  <div className="bg-orange-100 p-3 rounded-lg">
                    <AlertTriangle className="w-6 h-6 text-orange-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Hotspots</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {dashboardData?.realtime_metrics?.pollution_hotspots || hotspots.length || 0}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                <div className="flex items-center">
                  <div className="bg-red-100 p-3 rounded-lg">
                    <Bell className="w-6 h-6 text-red-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Active Alerts</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {dashboardData?.realtime_metrics?.active_alerts || alerts.length || 0}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Air Quality Details */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Gauge className="w-5 h-5 mr-2" />
                  Air Quality Breakdown
                </h3>
                <div className="space-y-4">
                  {dashboardData?.air_quality?.pm25 && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">PM2.5</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              dashboardData.air_quality.pm25.current <= 15 ? 'bg-green-400' :
                              dashboardData.air_quality.pm25.current <= 35 ? 'bg-yellow-400' :
                              dashboardData.air_quality.pm25.current <= 55 ? 'bg-orange-400' : 'bg-red-400'
                            }`}
                            style={{ width: `${Math.min((dashboardData.air_quality.pm25.current / 75) * 100, 100)}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">
                          {dashboardData.air_quality.pm25.current.toFixed(1)} μg/m³
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {dashboardData?.air_quality?.pm10 && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">PM10</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              dashboardData.air_quality.pm10.current <= 50 ? 'bg-green-400' :
                              dashboardData.air_quality.pm10.current <= 100 ? 'bg-yellow-400' :
                              dashboardData.air_quality.pm10.current <= 150 ? 'bg-orange-400' : 'bg-red-400'
                            }`}
                            style={{ width: `${Math.min((dashboardData.air_quality.pm10.current / 200) * 100, 100)}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">
                          {dashboardData.air_quality.pm10.current.toFixed(1)} μg/m³
                        </span>
                      </div>
                    </div>
                  )}

                  {dashboardData?.air_quality?.no2 && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">NO2</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-400 h-2 rounded-full" 
                            style={{ width: `${Math.min((dashboardData.air_quality.no2.current / 100) * 100, 100)}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">
                          {dashboardData.air_quality.no2.current.toFixed(1)} μg/m³
                        </span>
                      </div>
                    </div>
                  )}

                  {dashboardData?.air_quality?.o3 && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">O3</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-purple-400 h-2 rounded-full" 
                            style={{ width: `${Math.min((dashboardData.air_quality.o3.current / 200) * 100, 100)}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">
                          {dashboardData.air_quality.o3.current.toFixed(1)} μg/m³
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Brain className="w-5 h-5 mr-2" />
                  AI Insights
                </h3>
                {aiAnalysis?.ai_insights ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Risk Level</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(aiAnalysis.ai_insights.risk_level)}`}>
                        {aiAnalysis.ai_insights.risk_level}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Confidence</span>
                      <span className="text-sm font-medium">
                        {Math.round((aiAnalysis.ai_insights.confidence_score || 0) * 100)}%
                      </span>
                    </div>
                    <div className="text-sm text-gray-700 mt-3">
                      <p className="font-medium">Assessment:</p>
                      <p className="mt-1">{aiAnalysis.ai_insights.overall_assessment}</p>
                    </div>
                    {aiAnalysis.ai_insights.key_findings && aiAnalysis.ai_insights.key_findings.length > 0 && (
                      <div className="text-sm text-gray-700 mt-3">
                        <p className="font-medium">Key Finding:</p>
                        <p className="mt-1">{aiAnalysis.ai_insights.key_findings[0]}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-gray-500 text-sm">
                    {loading ? 'Loading AI analysis...' : 'AI analysis not available'}
                  </div>
                )}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Clock className="w-5 h-5 mr-2" />
                Recent Activity
              </h3>
              <div className="space-y-3">
                {alerts.length > 0 ? (
                  alerts.slice(0, 5).map((alert, index) => (
                    <div key={alert.id || index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`w-2 h-2 rounded-full ${
                          alert.severity === 'critical' ? 'bg-red-400' :
                          alert.severity === 'high' ? 'bg-orange-400' :
                          alert.severity === 'moderate' ? 'bg-yellow-400' : 'bg-green-400'
                        }`}></div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{alert.message}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(alert.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                      <button 
                        onClick={() => setActiveTab('alerts')}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        View
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-400" />
                    <p>No recent alerts - air quality is stable</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'map' && (
          <MapView />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsView />
        )}

        {activeTab === 'alerts' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Active Alerts</h2>
              <button
                onClick={() => refreshSpecificData('alerts')}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Refresh Alerts</span>
              </button>
            </div>

            {alerts.length > 0 ? (
              alerts.map((alert, index) => (
                <div key={alert.id || index} className={`bg-white rounded-xl shadow-lg p-6 border-l-4 ${getSeverityColor(alert.severity)}`}>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="w-5 h-5" />
                        <h3 className="text-lg font-semibold text-gray-900">
                          {alert.type?.replace('_', ' ').toUpperCase() || 'AIR QUALITY ALERT'}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(alert.severity)}`}>
                          {alert.severity}
                        </span>
                      </div>
                      <p className="text-gray-700 mt-2">{alert.message}</p>
                      
                      {alert.current_value && alert.threshold && (
                        <div className="mt-3 text-sm">
                          <p className="text-gray-600">
                            Current: <span className="font-medium">{alert.current_value} μg/m³</span> | 
                            Threshold: <span className="font-medium">{alert.threshold} μg/m³</span>
                          </p>
                        </div>
                      )}

                      {alert.actions && alert.actions.length > 0 && (
                        <div className="mt-3">
                          <p className="text-sm font-medium text-gray-900">Recommended Actions:</p>
                          <ul className="list-disc list-inside text-sm text-gray-600 mt-1">
                            {alert.actions.map((action, actionIndex) => (
                              <li key={actionIndex}>{action}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                    <div className="text-right text-sm text-gray-500">
                      {new Date(alert.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200 text-center">
                <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-400" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Active Alerts</h3>
                <p className="text-gray-600">All air quality parameters are within normal ranges.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'policy' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Shield className="w-5 h-5 mr-2" />
                Policy Recommendations
              </h2>
              <div className="space-y-4">
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">Implement Emergency Air Quality Measures</h3>
                      <p className="text-gray-600 mt-1">
                        Current data indicates air quality levels requiring immediate policy intervention
                      </p>
                      <div className="flex items-center space-x-4 mt-3 text-sm">
                        <span className="bg-red-100 text-red-800 px-2 py-1 rounded">High Priority</span>
                        <span className="text-gray-500">Expected Impact: 20-30% reduction</span>
                      </div>
                      <div className="mt-3 text-sm text-gray-600">
                        <p className="font-medium">Suggested Actions:</p>
                        <ul className="list-disc list-inside mt-1">
                          <li>Implement vehicle restrictions during peak hours</li>
                          <li>Increase monitoring in industrial areas</li>
                          <li>Issue public health advisories</li>
                        </ul>
                      </div>
                    </div>
                    <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                      View Details
                    </button>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">Enhance Industrial Monitoring</h3>
                      <p className="text-gray-600 mt-1">
                        Strengthen oversight of industrial emissions based on hotspot analysis
                      </p>
                      <div className="flex items-center space-x-4 mt-3 text-sm">
                        <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded">Medium Priority</span>
                        <span className="text-gray-500">Expected Impact: 15-25% reduction</span>
                      </div>
                      <div className="mt-3 text-sm text-gray-600">
                        <p className="font-medium">Suggested Actions:</p>
                        <ul className="list-disc list-inside mt-1">
                          <li>Deploy additional sensors in industrial zones</li>
                          <li>Implement stricter emission standards</li>
                          <li>Establish regular compliance audits</li>
                        </ul>
                      </div>
                    </div>
                    <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                      View Details
                    </button>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">Public Transportation Enhancement</h3>
                      <p className="text-gray-600 mt-1">
                        Reduce vehicle emissions through improved public transit infrastructure
                      </p>
                      <div className="flex items-center space-x-4 mt-3 text-sm">
                        <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Long-term</span>
                        <span className="text-gray-500">Expected Impact: 30-40% reduction</span>
                      </div>
                      <div className="mt-3 text-sm text-gray-600">
                        <p className="font-medium">Suggested Actions:</p>
                        <ul className="list-disc list-inside mt-1">
                          <li>Expand bus rapid transit network</li>
                          <li>Introduce electric public transport</li>
                          <li>Create dedicated cycling lanes</li>
                        </ul>
                      </div>
                    </div>
                    <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                      View Details
                    </button>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">Green Space Development</h3>
                      <p className="text-gray-600 mt-1">
                        Increase urban vegetation to improve air quality and reduce pollution
                      </p>
                      <div className="flex items-center space-x-4 mt-3 text-sm">
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded">Sustainable</span>
                        <span className="text-gray-500">Expected Impact: 10-20% improvement</span>
                      </div>
                      <div className="mt-3 text-sm text-gray-600">
                        <p className="font-medium">Suggested Actions:</p>
                        <ul className="list-disc list-inside mt-1">
                          <li>Plant trees in high-pollution areas</li>
                          <li>Create urban parks and green corridors</li>
                          <li>Mandate green building standards</li>
                        </ul>
                      </div>
                    </div>
                    <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                      View Details
                    </button>
                  </div>
                </div>
              </div>

              {/* Policy Analytics */}
              <div className="mt-6 bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Policy Impact Analytics</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {aiAnalysis?.policy_recommendations?.estimated_impact || '25%'}
                    </div>
                    <div className="text-sm text-gray-600">Estimated Improvement</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {aiAnalysis?.policy_recommendations?.cost_benefit_ratio || '3.2:1'}
                    </div>
                    <div className="text-sm text-gray-600">Cost-Benefit Ratio</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {aiAnalysis?.policy_recommendations?.timeline || '6-12'}
                    </div>
                    <div className="text-sm text-gray-600">Months to Impact</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Weather Impact Analysis */}
            {dashboardData?.weather && (
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Cloud className="w-5 h-5 mr-2" />
                  Weather Impact on Air Quality
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <Thermometer className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <div className="text-lg font-semibold text-gray-900">
                      {dashboardData.weather.temperature?.toFixed(1) || 'N/A'}°C
                    </div>
                    <div className="text-sm text-gray-600">Temperature</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <Droplets className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <div className="text-lg font-semibold text-gray-900">
                      {dashboardData.weather.humidity?.toFixed(0) || 'N/A'}%
                    </div>
                    <div className="text-sm text-gray-600">Humidity</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <Wind className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                    <div className="text-lg font-semibold text-gray-900">
                      {dashboardData.weather.wind_speed?.toFixed(1) || 'N/A'} m/s
                    </div>
                    <div className="text-sm text-gray-600">Wind Speed</div>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <Gauge className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                    <div className="text-lg font-semibold text-gray-900">
                      {dashboardData.weather.pressure?.toFixed(0) || 'N/A'} hPa
                    </div>
                    <div className="text-sm text-gray-600">Pressure</div>
                  </div>
                </div>
                
                {dashboardData.weather.impact_assessment && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Weather Impact:</span> {dashboardData.weather.impact_assessment}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Data Sources</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>UNEP Monitoring Network</li>
                <li>OpenAQ Global Platform</li>
                <li>IQAir Air Quality Data</li>
                <li>WeatherAPI.com</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Standards</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>WHO Air Quality Guidelines</li>
                <li>US EPA AQI Standards</li>
                <li>Kenya Environmental Standards</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Updates</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>Real-time: Every 15 minutes</li>
                <li>Forecasts: Every 6 hours</li>
                <li>AI Analysis: Every hour</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Contact</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>support@unep-airquality.org</li>
                <li>Emergency: +254-xxx-xxxx</li>
                <li>Technical Support</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-200 mt-8 pt-8 text-center text-sm text-gray-500">
            <p>&copy; 2025 UNEP Air Quality Platform. Real-time environmental monitoring for sustainable development.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AirQualityDashboard;