import React from 'react';
import {
  Paper,
  Typography,
  Grid,
  Box,
  Card,
  CardContent,
  Chip,
  Alert,
  LinearProgress,
  Divider
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import {
  Air,
  Warning,
  CheckCircle,
  TrendingUp,
  Info,
  HealthAndSafety,
  Timeline
} from '@mui/icons-material';

interface ChartsProps {
  zones: any[];
}

const AirQualityCharts: React.FC<ChartsProps> = ({ zones }) => {
  // Calculate overall statistics
  const avgPM25 = zones.reduce((sum, z) => sum + (z.properties?.pm25 || z.pm25 || 0), 0) / zones.length;
  const maxPM25 = Math.max(...zones.map(z => z.properties?.pm25 || z.pm25 || 0));
  const minPM25 = Math.min(...zones.map(z => z.properties?.pm25 || z.pm25 || 0));
  
  // Prepare data for charts
  const barData = zones.map(zone => ({
    name: zone.properties?.id?.replace('nairobi_zone_', '') || zone.id?.replace('nairobi_zone_', '') || `Zone ${zones.indexOf(zone) + 1}`,
    pm25: zone.properties?.pm25 || zone.pm25 || 0,
    aqi: zone.properties?.aqi || zone.aqi || Math.round((zone.properties?.pm25 || zone.pm25 || 0) * 3),
    zoneType: zone.properties?.type || 'residential'
  }));

  const pieData = [
    { name: 'Good (0-15)', value: zones.filter(z => (z.properties?.pm25 || z.pm25 || 0) <= 15).length, color: '#00e400', health: 'Safe' },
    { name: 'Moderate (15-25)', value: zones.filter(z => (z.properties?.pm25 || z.pm25 || 0) > 15 && (z.properties?.pm25 || z.pm25 || 0) <= 25).length, color: '#ffff00', health: 'Acceptable' },
    { name: 'Unhealthy Sensitive (25-35)', value: zones.filter(z => (z.properties?.pm25 || z.pm25 || 0) > 25 && (z.properties?.pm25 || z.pm25 || 0) <= 35).length, color: '#ff7e00', health: 'Sensitive Groups' },
    { name: 'Unhealthy (35-55)', value: zones.filter(z => (z.properties?.pm25 || z.pm25 || 0) > 35 && (z.properties?.pm25 || z.pm25 || 0) <= 55).length, color: '#ff0000', health: 'Unhealthy' },
    { name: 'Very Unhealthy (55+)', value: zones.filter(z => (z.properties?.pm25 || z.pm25 || 0) > 55).length, color: '#8f3f97', health: 'Very Unhealthy' }
  ].filter(item => item.value > 0);

  // Mock trend data (in real app, this would come from historical data)
  const trendData = [
    { time: '6 AM', pm25: 35, temp: 22, humidity: 65 },
    { time: '9 AM', pm25: 52, temp: 25, humidity: 60 },
    { time: '12 PM', pm25: 48, temp: 28, humidity: 55 },
    { time: '3 PM', pm25: 45, temp: 30, humidity: 50 },
    { time: '6 PM', pm25: 58, temp: 27, humidity: 58 },
    { time: '9 PM', pm25: 42, temp: 24, humidity: 62 },
    { time: 'Now', pm25: avgPM25, temp: 26, humidity: 56 }
  ];

  // Radar chart data for zone comparison
  const radarData = [
    { subject: 'PM2.5', A: avgPM25, fullMark: 60 },
    { subject: 'Temperature', A: 26, fullMark: 40 },
    { subject: 'Humidity', A: 56, fullMark: 100 },
    { subject: 'Airflow', A: 45, fullMark: 100 },
    { subject: 'Pollution', A: (avgPM25 / 60) * 100, fullMark: 100 }
  ];

  // Health impact assessment
  const healthImpact = zones.filter(z => (z.properties?.pm25 || z.pm25 || 0) > 35).length > 0 ? 'High' :
                       zones.filter(z => (z.properties?.pm25 || z.pm25 || 0) > 25).length > 0 ? 'Moderate' : 'Low';

  return (
    <Grid container spacing={3}>
      {/* Statistics Overview */}
      <Grid item xs={12}>
        <Card sx={{ bgcolor: 'primary.light' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Air sx={{ color: 'primary.main', mr: 2 }} />
              <Typography variant="h6" color="primary">
                Air Quality Statistics Overview
              </Typography>
            </Box>
            <Grid container spacing={2}>
              <Grid item xs={12} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="success.main">
                    {avgPM25.toFixed(1)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Average PM2.5 (μg/m³)
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min((avgPM25 / 60) * 100, 100)}
                    sx={{ mt: 1, height: 6, borderRadius: 3 }}
                  />
                </Box>
              </Grid>
              <Grid item xs={12} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="error.main">
                    {maxPM25.toFixed(1)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Highest PM2.5 (μg/m³)
                  </Typography>
                  <Chip
                    label="Critical Zone"
                    color="error"
                    size="small"
                    sx={{ mt: 1 }}
                  />
                </Box>
              </Grid>
              <Grid item xs={12} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="info.main">
                    {minPM25.toFixed(1)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Lowest PM2.5 (μg/m³)
                  </Typography>
                  <Chip
                    label="Clean Zone"
                    color="success"
                    size="small"
                    sx={{ mt: 1 }}
                  />
                </Box>
              </Grid>
              <Grid item xs={12} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color={healthImpact === 'High' ? 'error' : healthImpact === 'Moderate' ? 'warning' : 'success'}>
                    {healthImpact}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Health Impact
                  </Typography>
                  {healthImpact === 'High' ? (
                    <Warning sx={{ color: 'error.main', mt: 1 }} />
                  ) : healthImpact === 'Moderate' ? (
                    <Info sx={{ color: 'warning.main', mt: 1 }} />
                  ) : (
                    <CheckCircle sx={{ color: 'success.main', mt: 1 }} />
                  )}
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>

      {/* PM2.5 Levels by Zone */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <TrendingUp sx={{ color: 'primary.main', mr: 2 }} />
              <Typography variant="h6" gutterBottom>
                PM2.5 Levels by Zone
              </Typography>
            </Box>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip
                  formatter={(value: number, name: string) => {
                    if (name === 'pm25') return [`${value} μg/m³`, 'PM2.5'];
                    return [value, name];
                  }}
                />
                <Bar
                  dataKey="pm25"
                  fill="#8884d8"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
            <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 12, height: 12, bgcolor: '#00e400' }} />
                <Typography variant="caption">Good (≤15)</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 12, height: 12, bgcolor: '#ffff00' }} />
                <Typography variant="caption">Moderate (15-25)</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 12, height: 12, bgcolor: '#ff7e00' }} />
                <Typography variant="caption">Unhealthy Sensitive (25-35)</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 12, height: 12, bgcolor: '#ff0000' }} />
                <Typography variant="caption">Unhealthy (&gt;35)</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Air Quality Distribution */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <HealthAndSafety sx={{ color: 'primary.main', mr: 2 }} />
              <Typography variant="h6" gutterBottom>
                Air Quality Distribution
              </Typography>
            </Box>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value, percent }) => `${name}: ${value} (${((percent || 0) * 100).toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number, name: string, props) => [
                    `${value} zones`,
                    name,
                    `Health: ${props.payload.health}`
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {pieData.map((item, index) => (
                <Chip
                  key={index}
                  label={item.name}
                  size="small"
                  sx={{
                    bgcolor: item.color,
                    color: 'white',
                    border: 'none'
                  }}
                />
              ))}
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Daily Trend */}
      <Grid item xs={12} md={8}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Timeline sx={{ color: 'primary.main', mr: 2 }} />
              <Typography variant="h6" gutterBottom>
                Daily PM2.5 Trend (24 Hours)
              </Typography>
            </Box>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip
                  formatter={(value: number, name: string) => {
                    if (name === 'pm25') return [`${value.toFixed(1)} μg/m³`, 'PM2.5'];
                    if (name === 'temp') return [`${value}°C`, 'Temperature'];
                    if (name === 'humidity') return [`${value}%`, 'Humidity'];
                    return [value, name];
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="pm25"
                  stroke="#8884d8"
                  fill="#8884d8"
                  fillOpacity={0.3}
                  strokeWidth={3}
                />
                {/* WHO Guideline Reference Line */}
                <Line
                  type="monotone"
                  dataKey={() => 15}
                  stroke="#00e400"
                  strokeDasharray="5 5"
                  strokeWidth={2}
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                Green dashed line: WHO Annual Guideline (15 μg/m³)
              </Typography>
            </Alert>
          </CardContent>
        </Card>
      </Grid>

      {/* Environmental Factors */}
      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Info sx={{ color: 'primary.main', mr: 2 }} />
              <Typography variant="h6" gutterBottom>
                Environmental Factors
              </Typography>
            </Box>
            <ResponsiveContainer width="100%" height={250}>
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" />
                <PolarRadiusAxis angle={90} domain={[0, 100]} />
                <Radar
                  name="Current"
                  dataKey="A"
                  stroke="#8884d8"
                  fill="#8884d8"
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
              </RadarChart>
            </ResponsiveContainer>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              <Chip
                label={`Avg Temp: 26°C`}
                size="small"
                color="primary"
                variant="outlined"
              />
              <Chip
                label={`Humidity: 56%`}
                size="small"
                color="info"
                variant="outlined"
              />
              <Chip
                label={`Air Quality: ${healthImpact}`}
                size="small"
                color={healthImpact === 'High' ? 'error' : healthImpact === 'Moderate' ? 'warning' : 'success'}
                variant="outlined"
              />
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default AirQualityCharts;