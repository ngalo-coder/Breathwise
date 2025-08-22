import React, { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { useSocket } from '../../context/SocketContext';
import AirQualityChart from './AirQualityChart';
import MapView from '../Map/MapView';
import Analytics from '../Analytics/Analytics';
import Alerts from '../Alerts/Alerts';

const AirQualityDashboard = () => {
  const {
    dashboardData,
    measurements,
    alerts,
    aiAnalysis,
    loading,
    refreshData,
    refreshSpecificData,
    triggerAIAnalysis
  } = useData();
  
  const {
    socket,
    isConnected,
    requestDataUpdate,
    requestRefresh
  } = useSocket();
  
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  
  useEffect(() => {
    // Initial data load
    refreshData();
    
    // Set up auto-refresh interval
    const interval = setInterval(() => {
      refreshSpecificData('dashboard');
    }, 300000); // 5 minutes
    
    return () => clearInterval(interval);
  }, []);
  
  useEffect(() => {
    if (socket) {
      // Listen for real-time data updates
      socket.on('realtime_update', (data) => {
        refreshSpecificData('dashboard');
        setLastUpdated(new Date());
      });
      
      socket.on('data_update', (data) => {
        refreshSpecificData('measurements');
      });
      
      socket.on('new_alert', () => {
        refreshSpecificData('alerts');
      });
      
      socket.on('ai_analysis_complete', () => {
        refreshSpecificData('ai');
      });
      
      return () => {
        socket.off('realtime_update');
        socket.off('data_update');
        socket.off('new_alert');
        socket.off('ai_analysis_complete');
      };
    }
  }, [socket]);
  
  const handleRefresh = () => {
    refreshData();
    requestDataUpdate();
    setLastUpdated(new Date());
  };
  
  const handleAIAnalysis = () => {
    triggerAIAnalysis('comprehensive');
  };
  
  const getAQIColor = (aqi) => {
    if (!aqi) return 'bg-gray-200';
    if (aqi <= 50) return 'bg-green-500';
    if (aqi <= 100) return 'bg-yellow-400';
    if (aqi <= 150) return 'bg-orange-500';
    if (aqi <= 200) return 'bg-red-500';
    if (aqi <= 300) return 'bg-purple-600';
    return 'bg-rose-900';
  };
  
  const getAQIText = (aqi) => {
    if (!aqi) return 'Unknown';
    if (aqi <= 50) return 'Good';
    if (aqi <= 100) return 'Moderate';
    if (aqi <= 150) return 'Unhealthy for Sensitive Groups';
    if (aqi <= 200) return 'Unhealthy';
    if (aqi <= 300) return 'Very Unhealthy';
    return 'Hazardous';
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-unep-light/30 to-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <div className="bg-unep-primary p-1.5 rounded-md mr-2">
                  <span className="text-white font-bold">🌬️</span>
                </div>
                <span className="text-xl font-bold text-gray-900">UNEP Air Quality</span>
                <span className="ml-2 bg-unep-primary/10 text-unep-primary text-xs px-2 py-0.5 rounded-full">Nairobi</span>
              </div>
              <nav className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <button 
                  onClick={() => setActiveTab('dashboard')}
                  className={`${
                    activeTab === 'dashboard' 
                      ? 'border-unep-primary text-gray-900' 
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                >
                  Dashboard
                </button>
                <button 
                  onClick={() => setActiveTab('map')}
                  className={`${
                    activeTab === 'map' 
                      ? 'border-unep-primary text-gray-900' 
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                >
                  Map View
                </button>
                <button 
                  onClick={() => setActiveTab('analytics')}
                  className={`${
                    activeTab === 'analytics' 
                      ? 'border-unep-primary text-gray-900' 
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                >
                  Analytics
                </button>
                <button 
                  onClick={() => setActiveTab('alerts')}
                  className={`${
                    activeTab === 'alerts' 
                      ? 'border-unep-primary text-gray-900' 
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                >
                  Alerts
                  {alerts.length > 0 && (
                    <span className="ml-1 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                      {alerts.length}
                    </span>
                  )}
                </button>
              </nav>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:items-center">
              <button 
                onClick={refreshData}
                className="bg-white p-1.5 rounded-full text-gray-500 hover:text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-unep-primary"
              >
                🔄
              </button>
            </div>
            <div className="-mr-2 flex items-center sm:hidden">
              <button 
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-unep-primary"
              >
                <span className="sr-only">Open main menu</span>
                ☰
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      {showMobileMenu && (
        <div className="sm:hidden">
          <div className="pt-2 pb-3 space-y-1">
            <button
              onClick={() => {
                setActiveTab('dashboard');
                setShowMobileMenu(false);
              }}
              className={`${
                activeTab === 'dashboard'
                  ? 'bg-unep-primary/10 border-unep-primary text-unep-primary'
                  : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
              } block pl-3 pr-4 py-2 border-l-4 text-base font-medium w-full text-left`}
            >
              Dashboard
            </button>
            <button
              onClick={() => {
                setActiveTab('map');
                setShowMobileMenu(false);
              }}
              className={`${
                activeTab === 'map'
                  ? 'bg-unep-primary/10 border-unep-primary text-unep-primary'
                  : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
              } block pl-3 pr-4 py-2 border-l-4 text-base font-medium w-full text-left`}
            >
              Map View
            </button>
            <button
              onClick={() => {
                setActiveTab('analytics');
                setShowMobileMenu(false);
              }}
              className={`${
                activeTab === 'analytics'
                  ? 'bg-unep-primary/10 border-unep-primary text-unep-primary'
                  : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
              } block pl-3 pr-4 py-2 border-l-4 text-base font-medium w-full text-left`}
            >
              Analytics
            </button>
            <button
              onClick={() => {
                setActiveTab('alerts');
                setShowMobileMenu(false);
              }}
              className={`${
                activeTab === 'alerts'
                  ? 'bg-unep-primary/10 border-unep-primary text-unep-primary'
                  : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
              } block pl-3 pr-4 py-2 border-l-4 text-base font-medium w-full text-left`}
            >
              Alerts
              {alerts.length > 0 && (
                <span className="ml-1 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                  {alerts.length}
                </span>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading && (
          <div className="fixed top-0 left-0 w-full h-1 z-50">
            <div className="bg-unep-primary h-full animate-pulse-slow"></div>
          </div>
        )}
        
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            {/* Connection Status */}
            <div className={`flex items-center justify-between px-4 py-2 rounded-lg ${isConnected ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-2 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className={`text-sm font-medium ${isConnected ? 'text-green-700' : 'text-red-700'}`}>
                  {isConnected ? 'Connected to real-time updates' : 'Disconnected from server'}
                </span>
              </div>
              <div className="text-xs text-gray-500">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </div>
            </div>
            
            {/* Quick Stats Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-unep-primary flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">AQI</p>
                  <p className="text-2xl font-bold text-gray-800">{dashboardData?.overview?.current_aqi || 'N/A'}</p>
                </div>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getAQIColor(dashboardData?.overview?.current_aqi)}`}>
                  <span className="text-white">🌡️</span>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-green-500 flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">PM2.5</p>
                  <p className="text-2xl font-bold text-gray-800">{dashboardData?.overview?.pm25_level?.toFixed(1) || 'N/A'}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <span className="text-green-500">💨</span>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-yellow-500 flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Sources</p>
                  <p className="text-2xl font-bold text-gray-800">{dashboardData?.realtime_metrics?.active_sources || measurements.length || 0}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                  <span className="text-yellow-500">📊</span>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-red-500 flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Alerts</p>
                  <p className="text-2xl font-bold text-gray-800">{dashboardData?.realtime_metrics?.active_alerts || alerts.length || 0}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                  <span className="text-red-500">🔔</span>
                </div>
              </div>
            </div>

            {/* Status Banner */}
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-unep-primary bg-gradient-to-r from-white to-unep-light/10">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div className="flex items-start">
                  <div className={`${getAQIColor(dashboardData?.overview?.current_aqi)} p-3 rounded-lg mr-4`}>
                    <span className="text-white">🌡️</span>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      Current Air Quality: {getAQIText(dashboardData?.overview?.current_aqi)}
                    </h2>
                    <p className="text-gray-600 mt-1">
                      {dashboardData?.overview?.summary || 'Air quality data is being analyzed. Check back soon for detailed information.'}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        🕒 Updated {dashboardData?.overview?.last_updated || 'recently'}
                      </span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        📍 {dashboardData?.overview?.location || 'Nairobi'}
                      </span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        📊 {dashboardData?.overview?.data_sources || 'Multiple'} data sources
                      </span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 md:mt-0 flex space-x-2">
                  <button
                    onClick={handleRefresh}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-unep-primary"
                  >
                    🔄 Refresh
                  </button>
                  <button
                    onClick={handleAIAnalysis}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-unep-primary hover:bg-unep-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-unep-primary"
                  >
                    🤖 AI Analysis
                  </button>
                </div>
              </div>
            </div>

            {/* Main Dashboard Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column - Charts */}
              <div className="lg:col-span-2 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {dashboardData?.air_quality?.pm25 && (
                    <AirQualityChart 
                      data={{
                        values: measurements.map(m => m.properties?.pm25).filter(Boolean),
                        labels: measurements.map(m => m.properties?.location || 'Unknown').filter(Boolean)
                      }}
                      type="line"
                      title="PM2.5 Levels"
                      pollutant="pm25"
                    />
                  )}
                  
                  {dashboardData?.air_quality?.pm10 && (
                    <AirQualityChart 
                      data={{
                        values: measurements.map(m => m.properties?.pm10).filter(Boolean),
                        labels: measurements.map(m => m.properties?.location || 'Unknown').filter(Boolean)
                      }}
                      type="bar"
                      title="PM10 Levels"
                      pollutant="pm10"
                    />
                  )}
                </div>
              </div>
              
              {/* Right Column - Info Panels */}
              <div className="space-y-6">
                {/* AI Insights Panel */}
                <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-unep-secondary hover:shadow-card-hover transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                      <span className="mr-2 text-unep-secondary">🤖</span>
                      AI Insights
                    </h3>
                    <button
                      onClick={handleAIAnalysis}
                      className="bg-unep-secondary/10 px-2 py-1 rounded text-xs text-unep-secondary font-medium hover:bg-unep-secondary/20"
                    >
                      Refresh
                    </button>
                  </div>
                  
                  {aiAnalysis ? (
                    <div className="space-y-3">
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-gray-700">
                          <span className="font-medium">Risk Level:</span> {aiAnalysis.riskLevel || 'Moderate'}
                        </p>
                        <div className="mt-1 flex justify-between items-center">
                          <span className="text-xs text-gray-500">AI Analysis</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            aiAnalysis.riskLevel === 'critical' ? 'bg-red-100 text-red-800' :
                            aiAnalysis.riskLevel === 'high' ? 'bg-orange-100 text-orange-800' :
                            aiAnalysis.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {aiAnalysis.riskLevel || 'Moderate'}
                          </span>
                        </div>
                      </div>
                      
                      {aiAnalysis.keyFindings && aiAnalysis.keyFindings.length > 0 && (
                        <div className="p-3 bg-purple-50 rounded-lg">
                          <p className="text-sm font-medium text-gray-700 mb-1">Key Findings:</p>
                          <ul className="text-sm text-gray-600 space-y-1 pl-4 list-disc">
                            {aiAnalysis.keyFindings.slice(0, 2).map((finding, index) => (
                              <li key={index}>{finding}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">
                        Click "AI Analysis" to generate insights based on current air quality data.
                      </p>
                    </div>
                  )}
                </div>
                
                {/* Recent Activity */}
                <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-unep-green hover:shadow-card-hover transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                      <span className="mr-2 text-unep-green">📊</span>
                      Recent Activity
                    </h3>
                    <div className="bg-unep-green/10 px-2 py-1 rounded text-xs text-unep-green font-medium">
                      Live
                    </div>
                  </div>
                  
                  {alerts && alerts.length > 0 ? (
                    <div className="space-y-3">
                      {alerts.slice(0, 2).map((alert, index) => (
                        <div key={index} className="flex items-start">
                          <div className={`h-8 w-8 rounded-full flex items-center justify-center mr-3 ${
                            alert.severity === 'critical' ? 'bg-red-100 text-red-600' :
                            alert.severity === 'high' ? 'bg-orange-100 text-orange-600' :
                            alert.severity === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                            'bg-green-100 text-green-600'
                          }`}>
                            <span>{alert.type === 'health_emergency' ? '🚨' :
                                  alert.type === 'air_pollution' ? '💨' :
                                  alert.type === 'pollution_hotspot' ? '🔥' : '⚠️'}</span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{alert.message || 'Alert triggered'}</p>
                            <p className="text-xs text-gray-500">{alert.affected_area || 'Nairobi area'}</p>
                            <p className="text-xs text-gray-400 mt-1">
                              {new Date(alert.timestamp).toLocaleTimeString() || '15 minutes ago'}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-start">
                      <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center mr-3">
                        <span className="text-gray-600">✓</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">No active alerts</p>
                        <p className="text-xs text-gray-500">Air quality is within normal parameters</p>
                        <p className="text-xs text-gray-400 mt-1">Updated {lastUpdated.toLocaleTimeString()}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'map' && (
          <MapView />
        )}
        
        {activeTab === 'analytics' && (
          <Analytics />
        )}
        
        {activeTab === 'alerts' && (
          <Alerts />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-unep-primary/10 to-unep-secondary/10 border-t border-unep-primary/20 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-center">
            <div className="bg-unep-primary p-2 rounded-lg shadow-md mr-3">
              <span className="text-white">🌬️</span>
            </div>
            <h3 className="text-lg font-bold text-unep-primary">UNEP Air Quality Platform</h3>
          </div>
          <p className="text-sm text-center text-gray-600 mt-4">© 2025 UNEP Air Quality Platform. Real-time environmental monitoring for sustainable development.</p>
        </div>
      </footer>
    </div>
  );
};

export default AirQualityDashboard;