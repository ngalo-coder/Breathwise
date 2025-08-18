import React from 'react';
import {
  Paper,
  Typography,
  Grid,
  Box
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
  Line
} from 'recharts';

interface ChartsProps {
  zones: any[];
}

const AirQualityCharts: React.FC<ChartsProps> = ({ zones }) => {
  // Prepare data for charts
  const barData = zones.map(zone => ({
    name: zone.properties.id.replace('nairobi_zone_', 'Zone '),
    pm25: zone.properties.pm25,
    aqi: zone.properties.aqi
  }));

  const pieData = [
    { name: 'Good (0-15)', value: zones.filter(z => z.properties.pm25 <= 15).length, color: '#00e400' },
    { name: 'Moderate (15-25)', value: zones.filter(z => z.properties.pm25 > 15 && z.properties.pm25 <= 25).length, color: '#ffff00' },
    { name: 'Unhealthy Sensitive (25-35)', value: zones.filter(z => z.properties.pm25 > 25 && z.properties.pm25 <= 35).length, color: '#ff7e00' },
    { name: 'Unhealthy (35-55)', value: zones.filter(z => z.properties.pm25 > 35 && z.properties.pm25 <= 55).length, color: '#ff0000' },
    { name: 'Very Unhealthy (55+)', value: zones.filter(z => z.properties.pm25 > 55).length, color: '#8f3f97' }
  ].filter(item => item.value > 0);

  // Mock trend data (in real app, this would come from historical data)
  const trendData = [
    { time: '6 AM', pm25: 35 },
    { time: '9 AM', pm25: 52 },
    { time: '12 PM', pm25: 48 },
    { time: '3 PM', pm25: 45 },
    { time: '6 PM', pm25: 58 },
    { time: '9 PM', pm25: 42 },
    { time: 'Now', pm25: zones.reduce((sum, z) => sum + z.properties.pm25, 0) / zones.length }
  ];

  return (
    <Grid container spacing={3}>
      {/* PM2.5 Levels by Zone */}
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            PM2.5 Levels by Zone
          </Typography>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip 
                formatter={(value: number) => [`${value} μg/m³`, 'PM2.5']}
              />
              <Bar dataKey="pm25" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
          <Box sx={{ mt: 1, fontSize: '0.8em', color: 'text.secondary' }}>
            WHO Guideline: 15 μg/m³ (annual average)
          </Box>
        </Paper>
      </Grid>

      {/* Air Quality Distribution */}
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Air Quality Distribution
          </Typography>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Paper>
      </Grid>

      {/* Daily Trend */}
      <Grid item xs={12}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Daily PM2.5 Trend (Average)
          </Typography>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip 
                formatter={(value: number) => [`${value.toFixed(1)} μg/m³`, 'PM2.5']}
              />
              <Line 
                type="monotone" 
                dataKey="pm25" 
                stroke="#8884d8" 
                strokeWidth={3}
                dot={{ fill: '#8884d8', strokeWidth: 2, r: 4 }}
              />
              {/* WHO Guideline Reference Line */}
              <Line 
                type="monotone" 
                dataKey={() => 15} 
                stroke="#00e400" 
                strokeDasharray="5 5"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
          <Box sx={{ mt: 1, fontSize: '0.8em', color: 'text.secondary' }}>
            Green dashed line: WHO Annual Guideline (15 μg/m³)
          </Box>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default AirQualityCharts;