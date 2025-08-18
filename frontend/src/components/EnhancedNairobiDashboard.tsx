import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  Chip,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  Button,
  IconButton
} from '@mui/material';
import { Refresh, Download, Map, BarChart } from '@mui/icons-material';
import axios from 'axios';
import AirQualityMap from './AirQualityMap';
import AirQualityCharts from './AirQualityCharts';

interface MonitoringZone {
  id: string;
  pm25: number;
  aqi_category: string;
  severity: string;
  aqi: number;
  recorded_at: string;
  geometry: {
    coordinates: [number, number];
  };
}

interface PolicyRecommendation {
  id: number;
  title: string;
  description: string;
  priority: string;
  expected_impact_percent: number;
  cost_estimate: number;
  status: string;
}

const EnhancedNairobiDashboard: React.FC = () => {
  const [zones, setZones] = useState<MonitoringZone[]>([]);
  const [policies, setPolicies] = useState<PolicyRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    fetchData();
    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch monitoring zones
      const zonesResponse = await axios.get('/api/air/nairobi-zones');
      const zonesData = zonesResponse.data.features.map((feature: any) => ({
        id: feature.properties.id,
        pm25: feature.properties.pm25,
        aqi_category: feature.properties.aqi_category,
        severity: feature.properties.severity,
        aqi: feature.properties.aqi,
        recorded_at: feature.properties.recorded_at,
        geometry: feature.geometry
      }));
      setZones(zonesData);

      // Fetch policy recommendations
      const policiesResponse = await axios.get('/api/policy/recommendations');
      setPolicies(policiesResponse.data.recommendations || []);

      setLastUpdate(new Date());
      setError(null);
    } catch (err) {
      setError('Failed to fetch dashboard data');
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const exportData = () => {
    const data = {
      zones,
      policies,
      exported_at: new Date().toISOString(),
      summary: {
        total_zones: zones.length,
        avg_pm25: zones.reduce((sum, z) => sum + z.pm25, 0) / zones.length,
        unhealthy_zones: zones.filter(z => z.pm25 > 35).length
      }
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nairobi-air-quality-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const getSeverityColor = (severity: string) => {
    const colors = {
      good: 'success',
      moderate: 'info',
      unhealthy_sensitive: 'warning',
      unhealthy: 'error',
      very_unhealthy: 'error',
      hazardous: 'error'
    };
    return colors[severity as keyof typeof colors] || 'default';
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      low: 'default',
      medium: 'warning',
      high: 'error',
      critical: 'error'
    };
    return colors[priority as keyof typeof colors] || 'default';
  };

  if (loading && zones.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Loading UNEP Nairobi Air Quality Data...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
        <Button onClick={fetchData} sx={{ ml: 2 }}>
          Retry
        </Button>
      </Alert>
    );
  }

  const avgPM25 = zones.length > 0 
    ? zones.reduce((sum, zone) => sum + (zone.pm25 || 0), 0) / zones.length 
    : 0;

  const unhealthyZones = zones.filter(zone => 
    ['unhealthy', 'very_unhealthy', 'hazardous'].includes(zone.severity)
  ).length;

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          🌍 UNEP Nairobi Air Quality Platform
        </Typography>
        <Box>
          <IconButton onClick={fetchData} disabled={loading}>
            <Refresh />
          </IconButton>
          <Button 
            startIcon={<Download />} 
            onClick={exportData}
            variant="outlined"
            sx={{ ml: 1 }}
          >
            Export Data
          </Button>
        </Box>
      </Box>

      {/* Last Update Info */}
      <Alert severity="info" sx={{ mb: 3 }}>
        Last updated: {lastUpdate.toLocaleString()} | 
        Next update: {new Date(lastUpdate.getTime() + 5 * 60 * 1000).toLocaleTimeString()}
        {loading && <CircularProgress size={16} sx={{ ml: 1 }} />}
      </Alert>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Average PM2.5
              </Typography>
              <Typography variant="h4" color={avgPM25 > 35 ? 'error' : avgPM25 > 15 ? 'warning' : 'success'}>
                {avgPM25.toFixed(1)} μg/m³
              </Typography>
              <Typography variant="body2" color="textSecondary">
                WHO Guideline: 15 μg/m³
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Monitoring Zones
              </Typography>
              <Typography variant="h4" color="primary">
                {zones.length}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Active monitoring stations
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Unhealthy Zones
              </Typography>
              <Typography variant="h4" color="error">
                {unhealthyZones}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Require immediate attention
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Policy Actions
              </Typography>
              <Typography variant="h4" color="warning">
                {policies.length}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Recommended interventions
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs for different views */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab icon={<Map />} label="Interactive Map" />
          <Tab icon={<BarChart />} label="Data Analysis" />
          <Tab label="Zone Details" />
          <Tab label="Policy Actions" />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      {tabValue === 0 && (
        <AirQualityMap zones={zones} />
      )}

      {tabValue === 1 && (
        <AirQualityCharts zones={zones} />
      )}

      {tabValue === 2 && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            📍 Monitoring Zone Details
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Zone</TableCell>
                  <TableCell>PM2.5 (μg/m³)</TableCell>
                  <TableCell>AQI</TableCell>
                  <TableCell>Health Impact</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Last Updated</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {zones.map((zone) => (
                  <TableRow key={zone.id}>
                    <TableCell>{zone.id.replace('nairobi_zone_', 'Zone ')}</TableCell>
                    <TableCell>
                      <strong>{zone.pm25?.toFixed(1) || 'N/A'}</strong>
                    </TableCell>
                    <TableCell>{zone.aqi}</TableCell>
                    <TableCell>
                      <Chip 
                        label={zone.aqi_category} 
                        color={getSeverityColor(zone.severity) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={zone.severity.replace('_', ' ')} 
                        variant="outlined"
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {zone.recorded_at ? 
                        new Date(zone.recorded_at).toLocaleString() : 
                        'N/A'
                      }
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {tabValue === 3 && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            📋 Policy Recommendations
          </Typography>
          {policies.length === 0 ? (
            <Alert severity="info">
              No policy recommendations available.
            </Alert>
          ) : (
            policies.map((policy) => (
              <Card key={policy.id} sx={{ mb: 2 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6">
                      {policy.title}
                    </Typography>
                    <Chip 
                      label={policy.priority} 
                      color={getPriorityColor(policy.priority) as any}
                      size="small"
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {policy.description}
                  </Typography>
                  <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid item xs={6}>
                      <Typography variant="body2">
                        <strong>Expected Impact:</strong> {policy.expected_impact_percent}%
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2">
                        <strong>Cost:</strong> ${policy.cost_estimate?.toLocaleString()}
                      </Typography>
                    </Grid>
                  </Grid>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button variant="contained" size="small" color="primary">
                      Approve
                    </Button>
                    <Button variant="outlined" size="small">
                      Simulate Impact
                    </Button>
                    <Button variant="text" size="small">
                      View Details
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            ))
          )}
        </Paper>
      )}
    </Box>
  );
};

export default EnhancedNairobiDashboard;