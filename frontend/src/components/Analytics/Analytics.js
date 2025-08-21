import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart as PieChartIcon,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  AlertCircle,
  Wind,
  Thermometer,
  Droplets,
  Eye
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { dataUtils } from '../../services/apiService';

const Analytics = () => {
  const { measurements, dashboardData, aiAnalysis, loading, refreshSpecificData } = useData();
  const [timeRange, setTimeRange] = useState('24h');
  const [selectedPollutant, setSelectedPollutant] = useState('pm25');
  const [chartType, setChartType] = useState('line');
  const [analyticsData, setAnalyticsData] = useState({
    trends: [],
    distribution: [],
    sources: [],
    correlations: []
  });

  useEffect(() => {
    processAnalyticsData();
  }, [measurements, timeRange, selectedPollutant]);

  const processAnalyticsData = () => {
    if (!measurements.length) return;

    // Filter data by time range
    const hoursMap = { '6h': 6, '24h': 24, '7d': 168, '30d': 720 };
    const hours = hoursMap[timeRange] || 24;
    const filteredData = dataUtils.filterByTimeRange(measurements, hours);

    // Process trends data
    const trendsData = processTrendsData(filteredData);
    
    // Process distribution data
    const distributionData = processDistributionData(filteredData);
    
    // Process sources data
    const sourcesData = processSourcesData(filteredData);
    
    // Process correlations
    const correlationsData = processCorrelationsData(filteredData);

    setAnalyticsData({
      trends: trendsData,
      distribution: distributionData,
      sources: sourcesData,
      correlations: correlationsData
    });
  };

  const processTrendsData = (data) => {
    const grouped = data.reduce((acc, measurement) => {
      const time = new Date(measurement.properties.timestamp);
      const key = timeRange === '6h' || timeRange === '24h' 
        ? time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : time.toLocaleDateString();
      
      if (!acc[key]) {
        acc[key] = { time: key, values: [], count: 0 };
      }
      
      const value = measurement.properties[selectedPollutant];
      if (value != null) {
        acc[key].values.push(value);
        acc[key].count++;
      }
      
      return acc;
    }, {});

    return Object.values(grouped)
      .map(group => ({
        time: group.time,
        [selectedPollutant]: group.values.length 
          ? group.values.reduce((sum, val) => sum + val, 0) / group.values.length 
          : 0,
        count: group.count
      }))
      .sort((a, b) => new Date(a.time) - new Date(b.time))
      .slice(-20); // Last 20 data points
  };

  const processDistributionData = (data) => {
    const ranges = selectedPollutant === 'pm25' 
      ? [
          { name: 'Good (0-15)', min: 0, max: 15, color: '#10b981' },
          { name: 'Moderate (15-25)', min: 15, max: 25, color: '#f59e0b' },
          { name: 'USG (25-35)', min: 25, max: 35, color: '#f97316' },
          { name: 'Unhealthy (35-55)', min: 35, max: 55, color: '#ef4444' },
          { name: 'Very Unhealthy (55+)', min: 55, max: 1000, color: '#8b5cf6' }
        ]
      : [
          { name: 'Low (0-20)', min: 0, max: 20, color: '#10b981' },
          { name: 'Moderate (20-40)', min: 20, max: 40, color: '#f59e0b' },
          { name: 'High (40-60)', min: 40, max: 60, color: '#f97316' },
          { name: 'Very High (60+)', min: 60, max: 1000, color: '#ef4444' }
        ];

    const distribution = ranges.map(range => {
      const count = data.filter(m => {
        const value = m.properties[selectedPollutant];
        return value >= range.min && value < range.max;
      }).length;

      return {
        name: range.name,
        value: count,
        percentage: data.length ? (count / data.length * 100).toFixed(1) : 0,
        color: range.color
      };
    });

    return distribution.filter(d => d.value > 0);
  };

  const processSourcesData = (data) => {
    const grouped = dataUtils.groupBySource(data);
    
    return Object.entries(grouped).map(([source, measurements]) => {
      const avgValue = measurements.length 
        ? measurements.reduce((sum, m) => sum + (m.properties[selectedPollutant] || 0), 0) / measurements.length
        : 0;

      return {
        source: source,
        count: measurements.length,
        avgValue: avgValue.toFixed(1),
        percentage: ((measurements.length / data.length) * 100).toFixed(1)
      };
    });
  };

  const processCorrelationsData = (data) => {
    return data.map(m => ({
      pm25: m.properties.pm25 || 0,
      temperature: m.properties.temperature || 0,
      humidity: m.properties.humidity || 0,
      windSpeed: m.properties.wind_speed || 0,
      timestamp: m.properties.timestamp
    })).filter(d => d.pm25 > 0 && d.temperature > 0);
  };

  const calculateTrend = (data) => {
    if (data.length < 2) return { direction: 'stable', percentage: 0 };
    
    const recent = data.slice(-5).reduce((sum, d) => sum + d[selectedPollutant], 0) / 5;
    const previous = data.slice(-10, -5).reduce((sum, d) => sum + d[selectedPollutant], 0) / 5;
    
    if (previous === 0) return { direction: 'stable', percentage: 0 };
    
    const change = ((recent - previous) / previous) * 100;
    
    return {
      direction: change > 5 ? 'increasing' : change < -5 ? 'decreasing' : 'stable',
      percentage: Math.abs(change).toFixed(1)
    };
  };

  const exportData = () => {
    const exportData = {
      timeRange,
      pollutant: selectedPollutant,
      analytics: analyticsData,
      summary: dataUtils.calculateStats(measurements),
      exportTime: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nairobi-analytics-${timeRange}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const trend = calculateTrend(analyticsData.trends);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-lg border-b border-gray-200 p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="bg-purple-600 p-2 rounded-lg">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Air Quality Analytics</h1>
              <p className="text-sm text-gray-600">Data trends and insights • Nairobi, Kenya</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => refreshSpecificData('measurements')}
              disabled={loading}
              className="bg-purple-600 text-white p-2 rounded-lg hover:bg-purple-700 disabled:opacity-50"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={exportData}
              className="bg-green-600 text-white p-2 rounded-lg hover:bg-green-700"
              title="Export Analytics"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4">
        {/* Controls */}
        <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-200 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Time Range</label>
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
              >
                <option value="6h">Last 6 Hours</option>
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Pollutant</label>
              <select
                value={selectedPollutant}
                onChange={(e) => setSelectedPollutant(e.target.value)}
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
              >
                <option value="pm25">PM2.5</option>
                <option value="pm10">PM10</option>
                <option value="no2">NO2</option>
                <option value="o3">O3</option>
                <option value="co">CO</option>
                <option value="so2">SO2</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Chart Type</label>
              <select
                value={chartType}
                onChange={(e) => setChartType(e.target.value)}
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
              >
                <option value="line">Line Chart</option>
                <option value="area">Area Chart</option>
                <option value="bar">Bar Chart</option>
              </select>
            </div>

            <div className="flex items-end">
              <div className="flex items-center space-x-2">
                <div className={`flex items-center space-x-1 px-3 py-2 rounded-lg ${
                  trend.direction === 'increasing' ? 'bg-red-100 text-red-700' :
                  trend.direction === 'decreasing' ? 'bg-green-100 text-green-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {trend.direction === 'increasing' ? <TrendingUp className="w-4 h-4" /> :
                   trend.direction === 'decreasing' ? <TrendingDown className="w-4 h-4" /> :
                   <BarChart3 className="w-4 h-4" />}
                  <span className="text-sm font-medium">
                    {trend.direction === 'stable' ? 'Stable' : `${trend.percentage}%`}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Analytics Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Trends Chart */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2" />
              {selectedPollutant.toUpperCase()} Trends ({timeRange})
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              {chartType === 'line' && (
                <LineChart data={analyticsData.trends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey={selectedPollutant} 
                    stroke="#8b5cf6" 
                    strokeWidth={2}
                    dot={{ fill: '#8b5cf6' }}
                  />
                </LineChart>
              )}
              {chartType === 'area' && (
                <AreaChart data={analyticsData.trends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey={selectedPollutant} 
                    stroke="#8b5cf6" 
                    fill="#8b5cf6" 
                    fillOpacity={0.3}
                  />
                </AreaChart>
              )}
              {chartType === 'bar' && (
                <BarChart data={analyticsData.trends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey={selectedPollutant} fill="#8b5cf6" />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>

          {/* Distribution Chart */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <PieChartIcon className="w-5 h-5 mr-2" />
              Air Quality Distribution
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analyticsData.distribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {analyticsData.distribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [`${value} readings`, name]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Data Sources and Correlations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Data Sources */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Wind className="w-5 h-5 mr-2" />
              Data Sources Analysis
            </h3>
            <div className="space-y-4">
              {analyticsData.sources.map((source, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900">{source.source}</div>
                    <div className="text-sm text-gray-600">{source.count} measurements</div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-gray-900">{source.avgValue} μg/m³</div>
                    <div className="text-sm text-gray-600">{source.percentage}% of data</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Weather Correlation */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Thermometer className="w-5 h-5 mr-2" />
              Weather vs PM2.5 Correlation
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={analyticsData.correlations.slice(-20)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="timestamp" tickFormatter={(value) => new Date(value).getHours() + ':00'} />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip 
                  labelFormatter={(value) => new Date(value).toLocaleString()}
                  formatter={(value, name) => [
                    name === 'pm25' ? `${value} μg/m³` : 
                    name === 'temperature' ? `${value}°C` :
                    name === 'humidity' ? `${value}%` : `${value} m/s`,
                    name.toUpperCase()
                  ]}
                />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="pm25" stroke="#ef4444" strokeWidth={2} />
                <Line yAxisId="right" type="monotone" dataKey="temperature" stroke="#f59e0b" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Summary Statistics</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {analyticsData.trends.length 
                  ? (analyticsData.trends.reduce((sum, d) => sum + d[selectedPollutant], 0) / analyticsData.trends.length).toFixed(1)
                  : '0'
                }
              </div>
              <div className="text-sm text-gray-600">Average {selectedPollutant.toUpperCase()}</div>
              <div className="text-xs text-gray-500">μg/m³</div>
            </div>

            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {analyticsData.trends.length 
                  ? Math.min(...analyticsData.trends.map(d => d[selectedPollutant])).toFixed(1)
                  : '0'
                }
              </div>
              <div className="text-sm text-gray-600">Minimum</div>
              <div className="text-xs text-gray-500">μg/m³</div>
            </div>

            <div className="text-center">
              <div className="text-3xl font-bold text-red-600 mb-2">
                {analyticsData.trends.length 
                  ? Math.max(...analyticsData.trends.map(d => d[selectedPollutant])).toFixed(1)
                  : '0'
                }
              </div>
              <div className="text-sm text-gray-600">Maximum</div>
              <div className="text-xs text-gray-500">μg/m³</div>
            </div>

            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {measurements.length}
              </div>
              <div className="text-sm text-gray-600">Total Measurements</div>
              <div className="text-xs text-gray-500">in {timeRange}</div>
            </div>
          </div>
        </div>

        {/* AI Insights */}
        {aiAnalysis && (
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 mt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <AlertCircle className="w-5 h-5 mr-2" />
              AI-Powered Insights
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Key Findings</h4>
                <ul className="space-y-1 text-sm text-gray-600">
                  {aiAnalysis.ai_insights?.key_findings?.map((finding, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <span className="text-blue-500">•</span>
                      <span>{finding}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Predictions</h4>
                <div className="space-y-2 text-sm text-gray-600">
                  <div>
                    <span className="font-medium">Next 6 hours:</span> {aiAnalysis.predictions?.next_6_hours}
                  </div>
                  <div>
                    <span className="font-medium">Next 24 hours:</span> {aiAnalysis.predictions?.next_24_hours}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Analytics;