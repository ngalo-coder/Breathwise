import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  ToggleButtonGroup,
  ToggleButton,
  Chip,
  CircularProgress,
  useTheme,
  SelectChangeEvent,
  Divider,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  ZAxis
} from 'recharts';
import {
  Timeline,
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  BubbleChart,
  ShowChart,
  Download,
  Refresh,
  Info
} from '@mui/icons-material';
import { AirQualityZone } from '../context/DataContext';

// Props interface
interface EnhancedDataChartsProps {
  zones: AirQualityZone[];
  weatherData?: any;
  satelliteData?: any[];
  selectedZone?: string | null;
  onZoneSelect?: (zoneId: string | null) => void;
  height?: string | number;
  loading?: boolean;
  onRefresh?: () => void;
}

// Chart types
type ChartType = 'time-series' | 'comparison' | 'distribution' | 'correlation' | 'forecast';

// Time range options
type TimeRange = '24h' | '7d' | '30d' | '90d' | 'all';

const EnhancedDataCharts: React.FC<EnhancedDataChartsProps> = ({
  zones,
  weatherData,
  satelliteData,
  selectedZone,
  onZoneSelect,
  height = 'auto',
  loading = false,
  onRefresh
}) => {
  const theme = useTheme();

  // State
  const [chartType, setChartType] = useState<ChartType>('time-series');
  const [timeRange, setTimeRange] = useState<TimeRange>('7d');
  const [selectedMetric, setSelectedMetric] = useState<string>('pm25');
  const [selectedZones, setSelectedZones] = useState<string[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);

  // Colors for charts
  const chartColors = [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    theme.palette.error.main,
    theme.palette.warning.main,
    theme.palette.info.main,
    theme.palette.success.main,
    '#9c27b0', // purple
    '#795548', // brown
    '#607d8b', // blue-grey
    '#ff5722', // deep orange
  ];

  // AQI category colors
  const categoryColors = {
    'Good': '#4caf50',
    'Moderate': '#ffeb3b',
    'Unhealthy for Sensitive Groups': '#ff9800',
    'Unhealthy': '#f44336',
    'Very Unhealthy': '#9c27b0',
    'Hazardous': '#7e0023'
  };

  // Handle chart type change
  const handleChartTypeChange = (
    event: React.MouseEvent<HTMLElement>,
    newChartType: ChartType | null
  ) => {
    if (newChartType !== null) {
      setChartType(newChartType);
    }
  };

  // Handle time range change
  const handleTimeRangeChange = (event: SelectChangeEvent) => {
    setTimeRange(event.target.value as TimeRange);
  };

  // Handle metric change
  const handleMetricChange = (event: SelectChangeEvent) => {
    setSelectedMetric(event.target.value);
  };

  // Handle zone selection
  const handleZoneSelection = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    setSelectedZones(typeof value === 'string' ? value.split(',') : value);
  };

  // Handle zone click in chart
  const handleZoneClick = (data: any) => {
    if (onZoneSelect && data.zoneId) {
      onZoneSelect(data.zoneId);
    }
  };

  // Generate time series data
  const generateTimeSeriesData = () => {
    // In a real app, this would fetch historical data from the API
    // For now, we'll generate mock time series data based on current values

    const timePoints = {
      '24h': 24,
      '7d': 7,
      '30d': 30,
      '90d': 90,
      'all': 180
    };

    const points = timePoints[timeRange];
    const interval = timeRange === '24h' ? 'hour' : 'day';

    const filteredZones = selectedZones.length > 0
      ? zones.filter(zone => selectedZones.includes(zone.id))
      : selectedZone
        ? zones.filter(zone => zone.id === selectedZone)
        : zones.slice(0, 3); // Default to first 3 zones if none selected

    const now = new Date();
    const data = [];

    for (let i = points; i >= 0; i--) {
      const date = new Date(now);
      if (interval === 'hour') {
        date.setHours(date.getHours() - i);
      } else {
        date.setDate(date.getDate() - i);
      }

      const timePoint: any = {
        time: date.toISOString(),
        label: interval === 'hour'
          ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : date.toLocaleDateString([], { month: 'short', day: 'numeric' })
      };

      // Add data for each zone
      filteredZones.forEach(zone => {
        // Generate realistic time series with some randomness but following a pattern
        const basePM25 = zone.pm25;
        const hourOfDay = date.getHours();

        // Daily pattern - higher in morning and evening (rush hours)
        const timeOfDayFactor = (hourOfDay >= 7 && hourOfDay <= 9) || (hourOfDay >= 17 && hourOfDay <= 19)
          ? 1.2 // Rush hours
          : (hourOfDay >= 23 || hourOfDay <= 5)
            ? 0.7 // Night time
            : 1.0; // Regular hours

        // Weekly pattern - lower on weekends
        const dayOfWeek = date.getDay();
        const weekdayFactor = (dayOfWeek === 0 || dayOfWeek === 6) ? 0.8 : 1.0;

        // Random variation
        const randomFactor = 0.9 + Math.random() * 0.2;

        // Calculate value with all factors
        const value = basePM25 * timeOfDayFactor * weekdayFactor * randomFactor;

        // Add to data point
        timePoint[`${zone.id}_${selectedMetric}`] = parseFloat(value.toFixed(1));
        timePoint[`${zone.id}_name`] = zone.name || zone.id.replace('nairobi_zone_', '').replace(/_/g, ' ');
        timePoint[`${zone.id}_id`] = zone.id;
      });

      data.push(timePoint);
    }

    return data;
  };

  // Generate comparison data
  const generateComparisonData = () => {
    return zones.map(zone => ({
      name: zone.name || zone.id.replace('nairobi_zone_', '').replace(/_/g, ' '),
      zoneId: zone.id,
      pm25: zone.pm25,
      aqi: zone.aqi,
      category: zone.aqi_category,
      severity: zone.severity
    }));
  };

  // Generate distribution data
  const generateDistributionData = () => {
    const categories = ['Good', 'Moderate', 'Unhealthy for Sensitive Groups', 'Unhealthy', 'Very Unhealthy', 'Hazardous'];
    const counts = categories.map(category => ({
      name: category,
      value: zones.filter(zone => zone.aqi_category === category).length
    })).filter(item => item.value > 0);

    return counts;
  };

  // Generate correlation data
  const generateCorrelationData = () => {
    // In a real app, this would use actual weather data correlated with air quality
    // For now, we'll generate mock correlation data

    return zones.map(zone => {
      // Generate mock weather data for each zone
      const temperature = 20 + Math.random() * 10;
      const humidity = 40 + Math.random() * 40;
      const windSpeed = Math.random() * 20;

      return {
        name: zone.name || zone.id.replace('nairobi_zone_', '').replace(/_/g, ' '),
        zoneId: zone.id,
        pm25: zone.pm25,
        temperature,
        humidity,
        windSpeed,
        size: zone.aqi
      };
    });
  };

  // Generate forecast data
  const generateForecastData = () => {
    // In a real app, this would fetch forecast data from the API
    // For now, we'll generate mock forecast data based on current values

    const now = new Date();
    const data = [];

    const filteredZones = selectedZones.length > 0
      ? zones.filter(zone => selectedZones.includes(zone.id))
      : selectedZone
        ? zones.filter(zone => zone.id === selectedZone)
        : zones.slice(0, 1); // Default to first zone if none selected

    if (filteredZones.length === 0) return [];

    const zone = filteredZones[0];
    const basePM25 = zone.pm25;

    // Generate 7-day forecast
    for (let i = 0; i < 7; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() + i);

      // Weekly pattern - lower on weekends
      const dayOfWeek = date.getDay();
      const weekdayFactor = (dayOfWeek === 0 || dayOfWeek === 6) ? 0.8 : 1.0;

      // Random variation with trend
      const trendFactor = 1.0 + (i - 3) * 0.05; // Slight trend up or down
      const randomFactor = 0.9 + Math.random() * 0.2;

      // Calculate forecasted value
      const forecastedValue = basePM25 * weekdayFactor * trendFactor * randomFactor;

      // Calculate confidence interval
      const confidenceFactor = 0.1 + (i * 0.05); // Wider confidence interval further in the future
      const lowerBound = forecastedValue * (1 - confidenceFactor);
      const upperBound = forecastedValue * (1 + confidenceFactor);

      data.push({
        day: date.toLocaleDateString([], { weekday: 'short' }),
        date: date.toLocaleDateString([], { month: 'short', day: 'numeric' }),
        forecasted: parseFloat(forecastedValue.toFixed(1)),
        lowerBound: parseFloat(lowerBound.toFixed(1)),
        upperBound: parseFloat(upperBound.toFixed(1)),
        zoneId: zone.id,
        zoneName: zone.name || zone.id.replace('nairobi_zone_', '').replace(/_/g, ' ')
      });
    }

    return data;
  };

  // Update chart data when inputs change
  useEffect(() => {
    if (zones.length === 0) return;

    let data: any[] = [];

    switch (chartType) {
      case 'time-series':
        data = generateTimeSeriesData();
        break;
      case 'comparison':
        data = generateComparisonData();
        break;
      case 'distribution':
        data = generateDistributionData();
        break;
      case 'correlation':
        data = generateCorrelationData();
        break;
      case 'forecast':
        data = generateForecastData();
        break;
    }

    setChartData(data);
  }, [zones, chartType, timeRange, selectedMetric, selectedZones, selectedZone]);

  // Render time series chart
  const renderTimeSeriesChart = () => {
    if (chartData.length === 0) return null;

    const filteredZones = selectedZones.length > 0
      ? zones.filter(zone => selectedZones.includes(zone.id))
      : selectedZone
        ? zones.filter(zone => zone.id === selectedZone)
        : zones.slice(0, 3);

    return (
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 12 }}
            interval="preserveStartEnd"
          />
          <YAxis
            label={{
              value: selectedMetric === 'pm25' ? 'PM2.5 (μg/m³)' : 'AQI',
              angle: -90,
              position: 'insideLeft'
            }}
          />
          <RechartsTooltip
            formatter={(value: number, name: string) => {
              const parts = name.split('_');
              const zoneId = parts[0];
              const zoneName = chartData[0][`${zoneId}_name`];
              return [value, zoneName];
            }}
            labelFormatter={(label) => `Time: ${label}`}
          />
          <Legend
            formatter={(value: string) => {
              const parts = value.split('_');
              const zoneId = parts[0];
              const zoneName = chartData[0][`${zoneId}_name`];
              return zoneName;
            }}
          />
          {filteredZones.map((zone, index) => (
            <Line
              key={zone.id}
              type="monotone"
              dataKey={`${zone.id}_${selectedMetric}`}
              stroke={chartColors[index % chartColors.length]}
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{
                r: 6,
                onClick: () => handleZoneClick({ zoneId: zone.id })
              }}
              name={zone.id}
            />
          ))}
          {/* WHO guideline reference line */}
          {selectedMetric === 'pm25' && (
            <Line
              type="monotone"
              dataKey={() => 15}
              stroke="#4caf50"
              strokeDasharray="5 5"
              strokeWidth={2}
              dot={false}
              activeDot={false}
              name="WHO Guideline"
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    );
  };

  // Render comparison chart
  const renderComparisonChart = () => {
    if (chartData.length === 0) return null;

    const filteredData = selectedZones.length > 0
      ? chartData.filter(item => selectedZones.includes(item.zoneId))
      : chartData;

    const sortedData = [...filteredData].sort((a, b) => b.pm25 - a.pm25);

    return (
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={sortedData} margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 12 }}
            interval={0}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis
            label={{
              value: selectedMetric === 'pm25' ? 'PM2.5 (μg/m³)' : 'AQI',
              angle: -90,
              position: 'insideLeft'
            }}
          />
          <RechartsTooltip
            formatter={(value: number, name: string) => [value, name === 'pm25' ? 'PM2.5 (μg/m³)' : 'AQI']}
            labelFormatter={(label) => `Zone: ${label}`}
          />
          <Legend />
          <Bar
            dataKey={selectedMetric}
            name={selectedMetric === 'pm25' ? 'PM2.5 (μg/m³)' : 'AQI'}
            onClick={handleZoneClick}
            cursor="pointer"
          >
            {sortedData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={
                  selectedMetric === 'pm25'
                    ? entry.pm25 > 55 ? categoryColors['Very Unhealthy'] :
                      entry.pm25 > 35 ? categoryColors['Unhealthy'] :
                      entry.pm25 > 25 ? categoryColors['Unhealthy for Sensitive Groups'] :
                      entry.pm25 > 15 ? categoryColors['Moderate'] :
                      categoryColors['Good']
                    : chartColors[index % chartColors.length]
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  };

  // Render distribution chart
  const renderDistributionChart = () => {
    if (chartData.length === 0) return null;

    return (
      <ResponsiveContainer width="100%" height={400}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={150}
            fill="#8884d8"
            dataKey="value"
            nameKey="name"
            label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={categoryColors[entry.name as keyof typeof categoryColors] || chartColors[index % chartColors.length]}
              />
            ))}
          </Pie>
          <RechartsTooltip
            formatter={(value: number, name: string) => [`${value} zones`, name]}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    );
  };

  // Render correlation chart
  const renderCorrelationChart = () => {
    if (chartData.length === 0) return null;

    const filteredData = selectedZones.length > 0
      ? chartData.filter(item => selectedZones.includes(item.zoneId))
      : chartData;

    return (
      <ResponsiveContainer width="100%" height={400}>
        <ScatterChart margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            type="number"
            dataKey="temperature"
            name="Temperature"
            unit="°C"
            label={{ value: 'Temperature (°C)', position: 'bottom', offset: 0 }}
          />
          <YAxis
            type="number"
            dataKey="pm25"
            name="PM2.5"
            unit=" μg/m³"
            label={{ value: 'PM2.5 (μg/m³)', angle: -90, position: 'insideLeft' }}
          />
          <ZAxis
            type="number"
            dataKey="size"
            range={[50, 400]}
            name="AQI"
          />
          <RechartsTooltip
            cursor={{ strokeDasharray: '3 3' }}
            formatter={(value: number, name: string) => {
              if (name === 'PM2.5') return [`${value} μg/m³`, name];
              if (name === 'Temperature') return [`${value}°C`, name];
              if (name === 'AQI') return [value, 'AQI'];
              return [value, name];
            }}
          />
          <Legend />
          <Scatter
            name="Zones"
            data={filteredData}
            fill="#8884d8"
            onClick={handleZoneClick}
            cursor="pointer"
          >
            {filteredData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={
                  entry.pm25 > 55 ? categoryColors['Very Unhealthy'] :
                  entry.pm25 > 35 ? categoryColors['Unhealthy'] :
                  entry.pm25 > 25 ? categoryColors['Unhealthy for Sensitive Groups'] :
                  entry.pm25 > 15 ? categoryColors['Moderate'] :
                  categoryColors['Good']
                }
              />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    );
  };

  // Render forecast chart
  const renderForecastChart = () => {
    if (chartData.length === 0) return null;

    return (
      <ResponsiveContainer width="100%" height={400}>
        <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="day"
            tick={{ fontSize: 12 }}
          />
          <YAxis
            label={{
              value: 'PM2.5 (μg/m³)',
              angle: -90,
              position: 'insideLeft'
            }}
          />
          <RechartsTooltip
            formatter={(value: number) => [`${value} μg/m³`, 'PM2.5']}
            labelFormatter={(label) => `${chartData.find(d => d.day === label)?.date}`}
          />
          <Legend />
          <Area
            type="monotone"
            dataKey="upperBound"
            stroke="transparent"
            fill={theme.palette.primary.light}
            fillOpacity={0.2}
            name="Upper Bound"
          />
          <Area
            type="monotone"
            dataKey="lowerBound"
            stroke="transparent"
            fill={theme.palette.primary.light}
            fillOpacity={0}
            name="Lower Bound"
          />
          <Line
            type="monotone"
            dataKey="forecasted"
            stroke={theme.palette.primary.main}
            strokeWidth={3}
            dot={{ r: 5, fill: theme.palette.primary.main }}
            activeDot={{ r: 8 }}
            name="Forecast"
          />
        </AreaChart>
      </ResponsiveContainer>
    );
  };

  // Render chart based on type
  const renderChart = () => {
    if (loading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
          <CircularProgress />
        </Box>
      );
    }

    if (zones.length === 0) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
          <Typography variant="body1" color="text.secondary">
            No data available
          </Typography>
        </Box>
      );
    }

    switch (chartType) {
      case 'time-series':
        return renderTimeSeriesChart();
      case 'comparison':
        return renderComparisonChart();
      case 'distribution':
        return renderDistributionChart();
      case 'correlation':
        return renderCorrelationChart();
      case 'forecast':
        return renderForecastChart();
      default:
        return null;
    }
  };

  // Render chart controls
  const renderChartControls = () => {
    return (
      <Grid container spacing={2} alignItems="center" sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <ToggleButtonGroup
            value={chartType}
            exclusive
            onChange={handleChartTypeChange}
            aria-label="chart type"
            size="small"
            sx={{ flexWrap: 'wrap' }}
          >
            <ToggleButton value="time-series" aria-label="time series">
              <Timeline sx={{ mr: 1 }} />
              Time Series
            </ToggleButton>
            <ToggleButton value="comparison" aria-label="comparison">
              <BarChartIcon sx={{ mr: 1 }} />
              Comparison
            </ToggleButton>
            <ToggleButton value="distribution" aria-label="distribution">
              <PieChartIcon sx={{ mr: 1 }} />
              Distribution
            </ToggleButton>
            <ToggleButton value="correlation" aria-label="correlation">
              <BubbleChart sx={{ mr: 1 }} />
              Correlation
            </ToggleButton>
            <ToggleButton value="forecast" aria-label="forecast">
              <ShowChart sx={{ mr: 1 }} />
              Forecast
            </ToggleButton>
          </ToggleButtonGroup>
        </Grid>

        <Grid item xs={12} md={6} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          {onRefresh && (
            <Tooltip title="Refresh Data">
              <IconButton onClick={onRefresh} disabled={loading} size="small">
                <Refresh />
              </IconButton>
            </Tooltip>
          )}

          <Tooltip title="Export Chart">
            <IconButton size="small">
              <Download />
            </IconButton>
          </Tooltip>

          <Tooltip title="Chart Information">
            <IconButton size="small">
              <Info />
            </IconButton>
          </Tooltip>
        </Grid>

        <Grid item xs={12}>
          <Divider sx={{ my: 1 }} />
        </Grid>
      </Grid>
    );
  };

  // Main render
  return (
    <Paper sx={{ p: 3, height, borderRadius: 2 }}>
      <Typography variant="h6" gutterBottom>
        Air Quality Data Analysis
      </Typography>

      {renderChartControls()}

      {renderChart()}

      {chartType === 'time-series' && (
        <Box sx={{ mt: 2 }}>
          <Chip
            label="WHO Guideline: 15 μg/m³"
            size="small"
            color="success"
            variant="outlined"
            sx={{ mr: 1 }}
          />
          <Typography variant="caption" color="text.secondary">
            Data shown represents {timeRange === '24h' ? 'hourly' : 'daily'} averages
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default EnhancedDataCharts;