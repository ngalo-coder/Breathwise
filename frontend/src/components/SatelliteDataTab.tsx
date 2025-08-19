// frontend/src/components/SatelliteDataTab.tsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Chip,
  Alert,
  CircularProgress,
  Button,
  LinearProgress
} from '@mui/material';
import { Satellite, Refresh, TrendingUp } from '@mui/icons-material';
import axios from 'axios';

const SatelliteDataTab: React.FC = () => {
  const [satelliteData, setSatelliteData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSatelliteData();
  }, []);

  const fetchSatelliteData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get('/api/satellite/nairobi', {
        timeout: 10000
      });
      
      setSatelliteData(response.data);
      console.log('✅ Satellite data loaded:', response.data);
      
    } catch (err: any) {
      console.error('❌ Failed to fetch satellite data:', err);
      setError(err.response?.data?.message || 'Failed to fetch satellite data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Loading Satellite Data...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        <Typography variant="h6">Satellite Data Error</Typography>
        <Typography variant="body2">{error}</Typography>
        <Button onClick={fetchSatelliteData} sx={{ mt: 1 }}>
          Retry
        </Button>
      </Alert>
    );
  }

  const data = satelliteData;
  const summary = data?.processed_data?.air_quality_summary || {};

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Satellite sx={{ color: 'primary.main', mr: 2 }} />
        <Typography variant="h5">
          🛰️ Satellite Air Quality Monitoring
        </Typography>
        <Button
          startIcon={<Refresh />}
          onClick={fetchSatelliteData}
          sx={{ ml: 'auto' }}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>

      <Alert severity="success" sx={{ mb: 3 }}>
        <Typography variant="body2">
          <strong>Satellite Integration Active:</strong> Real-time data from Sentinel-5P, ground stations, and weather APIs.
          Last update: {new Date(data?.timestamp).toLocaleString()}
        </Typography>
      </Alert>

      <Grid container spacing={3}>
        {/* Summary Cards */}
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Satellite Measurements
              </Typography>
              <Typography variant="h4" color="primary">
                {data?.sources?.satellite_no2?.measurements_count || 0}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                NO2 observations
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Ground Stations
              </Typography>
              <Typography variant="h4" color="info.main">
                {data?.sources?.ground_stations?.stations_count || 0}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Active monitors
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Pollution Hotspots
              </Typography>
              <Typography variant="h4" color="warning.main">
                {data?.processed_data?.pollution_hotspots?.length || 0}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                AI detected
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Active Alerts
              </Typography>
              <Typography variant="h4" color="error.main">
                {data?.processed_data?.alerts?.length || 0}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Require attention
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Air Quality Summary */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                📊 Current Air Quality Summary
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <Box>
                    <Typography variant="body2" color="textSecondary">
                      Average PM2.5
                    </Typography>
                    <Typography variant="h5" color={summary.avg_pm25 > 35 ? 'error' : 'primary'}>
                      {summary.avg_pm25?.toFixed(1) || 'N/A'} μg/m³
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={Math.min((summary.avg_pm25 || 0) / 60 * 100, 100)}
                      sx={{ mt: 1 }}
                    />
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box>
                    <Typography variant="body2" color="textSecondary">
                      Temperature
                    </Typography>
                    <Typography variant="h5" color="info.main">
                      {summary.temperature?.toFixed(1) || 'N/A'}°C
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      Humidity: {summary.humidity?.toFixed(0) || 'N/A'}%
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box>
                    <Typography variant="body2" color="textSecondary">
                      Overall Status
                    </Typography>
                    <Chip
                      label={summary.overall_status?.replace('_', ' ') || 'Unknown'}
                      color={summary.overall_status === 'good' ? 'success' : 
                             summary.overall_status === 'moderate' ? 'info' : 'error'}
                      sx={{ mt: 1 }}
                    />
                    <Typography variant="caption" color="textSecondary" display="block">
                      {summary.weather_conditions || 'Clear'}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Policy Recommendations */}
        {data?.processed_data?.recommendations?.length > 0 && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  🤖 AI Policy Recommendations
                </Typography>
                {data.processed_data.recommendations.map((rec: any, index: number) => (
                  <Alert
                    key={index}
                    severity={rec.priority === 'critical' ? 'error' : 'warning'}
                    sx={{ mb: 2 }}
                  >
                    <Typography variant="subtitle1" fontWeight="bold">
                      {rec.title}
                    </Typography>
                    <Typography variant="body2">
                      {rec.description}
                    </Typography>
                    <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                      <Chip
                        label={`Impact: ${rec.estimated_impact}`}
                        size="small"
                        color="info"
                      />
                      <Chip
                        label={`Timeline: ${rec.timeline}`}
                        size="small"
                        color="default"
                      />
                    </Box>
                  </Alert>
                ))}
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default SatelliteDataTab;