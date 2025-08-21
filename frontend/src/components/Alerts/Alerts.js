import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Bell,
  Clock,
  MapPin,
  Filter,
  Search,
  RefreshCw,
  Download,
  Settings,
  CheckCircle,
  XCircle,
  AlertCircle,
  Info,
  ChevronDown,
  ChevronRight,
  Calendar
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useSocket } from '../../context/SocketContext';
import toast from 'react-hot-toast';

const Alerts = () => {
  const { alerts, refreshSpecificData, loading } = useData();
  const { isConnected } = useSocket();
  const [filteredAlerts, setFilteredAlerts] = useState([]);
  const [filters, setFilters] = useState({
    severity: 'all',
    type: 'all',
    status: 'active',
    timeRange: '24h'
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [sortBy, setSortBy] = useState('timestamp');
  const [expandedAlerts, setExpandedAlerts] = useState(new Set());

  useEffect(() => {
    applyFilters();
  }, [alerts, filters, searchTerm, sortBy]);

  useEffect(() => {
    // Listen for real-time critical alerts
    const handleCriticalAlert = (event) => {
      const alertData = event.detail;
      if (alertData.alerts && alertData.alerts.length > 0) {
        toast.error(`New Critical Alert: ${alertData.alerts[0].message}`, {
          duration: 10000,
          style: {
            background: '#dc2626',
            color: 'white',
            fontWeight: 'bold',
          },
        });
      }
    };

    window.addEventListener('criticalAlert', handleCriticalAlert);
    return () => window.removeEventListener('criticalAlert', handleCriticalAlert);
  }, []);

  const applyFilters = () => {
    let filtered = [...alerts];

    // Filter by severity
    if (filters.severity !== 'all') {
      filtered = filtered.filter(alert => alert.severity === filters.severity);
    }

    // Filter by type
    if (filters.type !== 'all') {
      filtered = filtered.filter(alert => alert.type === filters.type);
    }

    // Filter by status (assuming alerts have status property)
    if (filters.status !== 'all') {
      filtered = filtered.filter(alert => 
        (alert.status || 'active') === filters.status
      );
    }

    // Filter by time range
    const now = new Date();
    const timeRangeHours = {
      '1h': 1,
      '6h': 6,
      '24h': 24,
      '7d': 168,
      '30d': 720
    };
    const hours = timeRangeHours[filters.timeRange] || 24;
    const cutoff = new Date(now.getTime() - hours * 60 * 60 * 1000);
    
    filtered = filtered.filter(alert => 
      new Date(alert.timestamp) >= cutoff
    );

    // Apply search
    if (searchTerm) {
      filtered = filtered.filter(alert =>
        alert.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        alert.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (alert.affected_area && alert.affected_area.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Sort alerts
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'timestamp':
          return new Date(b.timestamp) - new Date(a.timestamp);
        case 'severity':
          const severityOrder = { 'critical': 4, 'high': 3, 'medium': 2, 'low': 1 };
          return (severityOrder[b.severity] || 0) - (severityOrder[a.severity] || 0);
        case 'type':
          return a.type.localeCompare(b.type);
        default:
          return new Date(b.timestamp) - new Date(a.timestamp);
      }
    });

    setFilteredAlerts(filtered);
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'high':
        return <AlertCircle className="w-5 h-5 text-orange-500" />;
      case 'medium':
        return <Info className="w-5 h-5 text-yellow-500" />;
      case 'low':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      default:
        return <Info className="w-5 h-5 text-gray-500" />;
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical':
        return 'border-red-200 bg-red-50';
      case 'high':
        return 'border-orange-200 bg-orange-50';
      case 'medium':
        return 'border-yellow-200 bg-yellow-50';
      case 'low':
        return 'border-green-200 bg-green-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const getSeverityBadgeColor = (severity) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'health_emergency':
        return '🚨';
      case 'air_pollution':
        return '💨';
      case 'pollution_hotspot':
        return '🔥';
      case 'system':
        return '⚙️';
      case 'data_quality':
        return '📊';
      default:
        return '⚠️';
    }
  };

  const getTimeAgo = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now - time;
    
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const toggleAlertExpansion = (alertId) => {
    const newExpanded = new Set(expandedAlerts);
    if (newExpanded.has(alertId)) {
      newExpanded.delete(alertId);
    } else {
      newExpanded.add(alertId);
    }
    setExpandedAlerts(newExpanded);
  };

  const acknowledgeAlert = (alertId) => {
    // In a real app, this would make an API call
    toast.success('Alert acknowledged');
    console.log('Acknowledging alert:', alertId);
  };

  const dismissAlert = (alertId) => {
    // In a real app, this would make an API call
    toast.success('Alert dismissed');
    console.log('Dismissing alert:', alertId);
  };

  const exportAlerts = () => {
    const exportData = {
      filters,
      alerts: filteredAlerts,
      totalAlerts: alerts.length,
      exportTime: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nairobi-alerts-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-lg border-b border-gray-200 p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="bg-red-600 p-2 rounded-lg">
              <Bell className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Air Quality Alerts</h1>
              <p className="text-sm text-gray-600">
                Real-time monitoring and notifications • 
                <span className={`ml-1 ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
                  {isConnected ? 'Live' : 'Offline'}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <span className="text-sm text-gray-600">
              {filteredAlerts.length} of {alerts.length} alerts
            </span>

            <button
              onClick={() => refreshSpecificData('alerts')}
              disabled={loading}
              className="bg-red-600 text-white p-2 rounded-lg hover:bg-red-700 disabled:opacity-50"
              title="Refresh Alerts"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={exportAlerts}
              className="bg-green-600 text-white p-2 rounded-lg hover:bg-green-700"
              title="Export Alerts"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4">
        {/* Alert Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {['critical', 'high', 'medium', 'low'].map((severity) => {
            const count = alerts.filter(alert => alert.severity === severity).length;
            return (
              <div key={severity} className="bg-white rounded-xl shadow-lg p-4 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {getSeverityIcon(severity)}
                    <span className="font-medium text-gray-900 capitalize">{severity}</span>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-sm font-medium ${getSeverityBadgeColor(severity)}`}>
                    {count}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-200 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
              <select
                value={filters.severity}
                onChange={(e) => setFilters({ ...filters, severity: e.target.value })}
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
              >
                <option value="all">All Severities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={filters.type}
                onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
              >
                <option value="all">All Types</option>
                <option value="health_emergency">Health Emergency</option>
                <option value="air_pollution">Air Pollution</option>
                <option value="pollution_hotspot">Pollution Hotspot</option>
                <option value="system">System</option>
                <option value="data_quality">Data Quality</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="acknowledged">Acknowledged</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Time Range</label>
              <select
                value={filters.timeRange}
                onChange={(e) => setFilters({ ...filters, timeRange: e.target.value })}
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
              >
                <option value="1h">Last Hour</option>
                <option value="6h">Last 6 Hours</option>
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
              >
                <option value="timestamp">Time</option>
                <option value="severity">Severity</option>
                <option value="type">Type</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search alerts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 rounded-lg border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Alerts List */}
        <div className="space-y-4">
          {filteredAlerts.length === 0 ? (
            <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200 text-center">
              <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No alerts found</h3>
              <p className="text-gray-600">
                {alerts.length === 0 
                  ? 'No alerts have been generated yet.' 
                  : 'Try adjusting your filters to see more alerts.'
                }
              </p>
            </div>
          ) : (
            filteredAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`bg-white rounded-xl shadow-lg border-l-4 ${getSeverityColor(alert.severity)} transition-all duration-200`}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className="flex-shrink-0">
                        <div className="text-2xl">{getTypeIcon(alert.type)}</div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-2">
                          {getSeverityIcon(alert.severity)}
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityBadgeColor(alert.severity)}`}>
                            {alert.severity.toUpperCase()}
                          </span>
                          <span className="text-sm text-gray-500">
                            {alert.type.replace('_', ' ').toUpperCase()}
                          </span>
                          <span className="text-sm text-gray-500">•</span>
                          <span className="text-sm text-gray-500">{getTimeAgo(alert.timestamp)}</span>
                        </div>
                        
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {alert.message}
                        </h3>
                        
                        {alert.affected_area && (
                          <div className="flex items-center space-x-1 text-sm text-gray-600 mb-2">
                            <MapPin className="w-4 h-4" />
                            <span>{alert.affected_area}</span>
                          </div>
                        )}
                        
                        {alert.current_value && alert.threshold && (
                          <div className="text-sm text-gray-600 mb-2">
                            Current: {alert.current_value} μg/m³ (Threshold: {alert.threshold} μg/m³)
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => toggleAlertExpansion(alert.id)}
                        className="p-1 text-gray-400 hover:text-gray-600"
                      >
                        {expandedAlerts.has(alert.id) ? (
                          <ChevronDown className="w-5 h-5" />
                        ) : (
                          <ChevronRight className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>
                  
                  {/* Expanded Content */}
                  {expandedAlerts.has(alert.id) && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      {alert.actions && alert.actions.length > 0 && (
                        <div className="mb-4">
                          <h4 className="font-medium text-gray-900 mb-2">Recommended Actions:</h4>
                          <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                            {alert.actions.map((action, index) => (
                              <li key={index}>{action}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-500">
                          Alert ID: {alert.id} • Created: {new Date(alert.timestamp).toLocaleString()}
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => acknowledgeAlert(alert.id)}
                            className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                          >
                            Acknowledge
                          </button>
                          <button
                            onClick={() => dismissAlert(alert.id)}
                            className="px-3 py-1 bg-gray-600 text-white text-sm rounded-md hover:bg-gray-700"
                          >
                            Dismiss
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Alerts;