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
  TableRow
} from '@mui/material';
import axios from 'axios';

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

const NairobiDashboard: React.FC = () => {
  const [zones, setZones] = useState<MonitoringZone[]>([]);
  const [policies, setPolicies] = useState<PolicyRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
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

    } catch (err) {
      setError('Failed to fetch dashboard data');
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
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

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Loading Nairobi Air Quality Data...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
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
      <Typography variant="h4" gutterBottom>
        🌍 UNEP Nairobi Air Quality Dashboard
      </Typography>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Average PM2.5
              </Typography>
              <Typography variant="h4" color={avgPM25 > 35 ? 'error' : 'primary'}>
                {avgPM25.toFixed(1)} μg/m³
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
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Policy Recommendations
              </Typography>
              <Typography variant="h4" color="warning">
                {policies.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Monitoring Zones Table */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              📍 Monitoring Zones
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Zone ID</TableCell>
                    <TableCell>PM2.5 (μg/m³)</TableCell>
                    <TableCell>AQI</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Last Updated</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {zones.map((zone) => (
                    <TableRow key={zone.id}>
                      <TableCell>{zone.id}</TableCell>
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
        </Grid>

        {/* Policy Recommendations */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              📋 Policy Recommendations
            </Typography>
            {policies.length === 0 ? (
              <Alert severity="info">
                No policy recommendations available. Import intervention zone data to see recommendations.
              </Alert>
            ) : (
              policies.slice(0, 5).map((policy) => (
                <Card key={policy.id} sx={{ mb: 2 }}>
                  <CardContent sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="subtitle2" noWrap>
                        {policy.title}
                      </Typography>
                      <Chip 
                        label={policy.priority} 
                        color={getPriorityColor(policy.priority) as any}
                        size="small"
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Impact: {policy.expected_impact_percent}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Cost: ${policy.cost_estimate?.toLocaleString()}
                    </Typography>
                  </CardContent>
                </Card>
              ))
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Instructions */}
      <Paper sx={{ p: 2, mt: 3, bgcolor: 'grey.50' }}>
        <Typography variant="h6" gutterBottom>
          🚀 Next Steps
        </Typography>
        <Typography variant="body2" paragraph>
          1. Run the data import script: <code>python import_nairobi_data.py</code>
        </Typography>
        <Typography variant="body2" paragraph>
          2. Refresh this page to see your real Nairobi monitoring data
        </Typography>
        <Typography variant="body2">
          3. The dashboard will show air quality zones, policy recommendations, and intervention areas
        </Typography>
      </Paper>
    </Box>
  );
};

export default NairobiDashboard;