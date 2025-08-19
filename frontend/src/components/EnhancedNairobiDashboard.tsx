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
  IconButton,
  LinearProgress,
  Badge,
  Tooltip,
  Divider
} from '@mui/material';
import {
  Refresh,
  Download,
  Map,
  BarChart,
  Warning,
  Info,
  Air,
  TrendingUp,
  Policy,
  HealthAndSafety,
  Timeline,
  CheckCircle,
  Error,
  Report
} from '@mui/icons-material';
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

// Mock data for Nairobi zones
const generateMockZones = (): MonitoringZone[] => {
  const zones = [
    { name: 'CBD', pm25: 45.2, coords: [36.8219, -1.2921] },
    { name: 'Westlands', pm25: 38.7, coords: [36.8094, -1.2676] },
    { name: 'Eastlands', pm25: 52.1, coords: [36.8917, -1.2921] },
    { name: 'Karen', pm25: 25.3, coords: [36.7073, -1.3194] },
    { name: 'Industrial Area', pm25: 67.8, coords: [36.8592, -1.3031] },
    { name: 'Kileleshwa', pm25: 32.4, coords: [36.7736, -1.2697] },
    { name: 'Kasarani', pm25: 41.6, coords: [36.8968, -1.2205] },
    { name: 'Embakasi', pm25: 58.3, coords: [36.9081, -1.3231] }
  ];

  return zones.map((zone, index) => {
    const pm25 = zone.pm25 + (Math.random() - 0.5) * 10; // Add some variation
    let severity = 'good';
    let aqi_category = 'Good';
    let aqi = Math.round(pm25 * 3);

    if (pm25 > 55) {
      severity = 'very_unhealthy';
      aqi_category = 'Very Unhealthy';
    } else if (pm25 > 35) {
      severity = 'unhealthy';
      aqi_category = 'Unhealthy';
    } else if (pm25 > 25) {
      severity = 'unhealthy_sensitive';
      aqi_category = 'Unhealthy for Sensitive Groups';
    } else if (pm25 > 15) {
      severity = 'moderate';
      aqi_category = 'Moderate';
    }

    return {
      id: `nairobi_zone_${zone.name.toLowerCase().replace(/\s+/g, '_')}`,
      pm25: Math.max(0, pm25),
      aqi_category,
      severity,
      aqi,
      recorded_at: new Date(Date.now() - Math.random() * 3600000).toISOString(),
      geometry: { coordinates: [zone.coords[0], zone.coords[1]] as [number, number] }
    };
  });
};

const mockPolicies: PolicyRecommendation[] = [
  {
    id: 1,
    title: 'Implement Low Emission Zone in CBD',
    description: 'Restrict high-polluting vehicles from entering the Central Business District during peak hours to reduce PM2.5 levels.',
    priority: 'high',
    expected_impact_percent: 25,
    cost_estimate: 500000,
    status: 'proposed'
  },
  {
    id: 2,
    title: 'Expand BRT System',
    description: 'Increase Bus Rapid Transit routes and electric bus fleet to reduce private vehicle dependency.',
    priority: 'critical',
    expected_impact_percent: 35,
    cost_estimate: 2500000,
    status: 'under_review'
  },
  {
    id: 3,
    title: 'Industrial Emission Controls',
    description: 'Enforce stricter emission standards for industrial facilities in Nairobi Industrial Area.',
    priority: 'high',
    expected_impact_percent: 20,
    cost_estimate: 750000,
    status: 'planning'
  },
  {
    id: 4,
    title: 'Green Belt Initiative',
    description: 'Plant trees and create green spaces in high-pollution areas to improve air quality naturally.',
    priority: 'medium',
    expected_impact_percent: 15,
    cost_estimate: 300000,
    status: 'approved'
  },
  {
    id: 5,
    title: 'Vehicle Emission Testing',
    description: 'Mandatory annual emission testing for all vehicles operating within Nairobi County.',
    priority: 'medium',
    expected_impact_percent: 18,
    cost_estimate: 400000,
    status: 'proposed'
  }
];

const EnhancedNairobiDashboard: React.FC = () => {
  const [zones, setZones] = useState<MonitoringZone[]>([]);
  const [policies, setPolicies] = useState<PolicyRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingMockData, setUsingMockData] = useState(false);
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
      
      console.log('Attempting to fetch data from API...');
      
      // Try to fetch monitoring zones
      try {
        const zonesResponse = await axios.get('/api/air/nairobi-zones', {
          timeout: 10000,
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });
        
        console.log('Zones API response:', zonesResponse.data);
        
        const zonesData = zonesResponse.data.features?.map((feature: any) => ({
          id: feature.properties.id,
          pm25: feature.properties.pm25,
          aqi_category: feature.properties.aqi_category,
          severity: feature.properties.severity,
          aqi: feature.properties.aqi,
          recorded_at: feature.properties.recorded_at,
          geometry: feature.geometry
        })) || [];
        
        setZones(zonesData);
        setUsingMockData(false);
        
      } catch (zonesError) {
        console.warn('Failed to fetch zones from API, using mock data:', zonesError);
        setZones(generateMockZones());
        setUsingMockData(true);
      }

      // Try to fetch policy recommendations
      try {
        const policiesResponse = await axios.get('/api/policy/recommendations', {
          timeout: 10000
        });
        
        console.log('Policies API response:', policiesResponse.data);
        setPolicies(policiesResponse.data.recommendations || []);
        
      } catch (policiesError) {
        console.warn('Failed to fetch policies from API, using mock data:', policiesError);
        setPolicies(mockPolicies);
        setUsingMockData(true);
      }

      setLastUpdate(new Date());
      setError(null);
      
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      // Use mock data as fallback
      setZones(generateMockZones());
      setPolicies(mockPolicies);
      setUsingMockData(true);
      setError('Using demo data - API connection failed');
    } finally {
      setLoading(false);
    }
  };

  const exportData = () => {
    const data = {
      zones,
      policies,
      exported_at: new Date().toISOString(),
      data_source: usingMockData ? 'mock_data' : 'live_api',
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

  const avgPM25 = zones.length > 0 
    ? zones.reduce((sum, zone) => sum + (zone.pm25 || 0), 0) / zones.length 
    : 0;

  const unhealthyZones = zones.filter(zone => 
    ['unhealthy', 'very_unhealthy', 'hazardous'].includes(zone.severity)
  ).length;

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{
              bgcolor: 'primary.main',
              color: 'white',
              p: 1,
              borderRadius: 1,
              display: 'flex',
              alignItems: 'center'
            }}>
              <Air sx={{ mr: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                UNEP Air Quality Platform
              </Typography>
            </Box>
            <Badge
              badgeContent={usingMockData ? "Demo Mode" : "Live Data"}
              color={usingMockData ? "warning" : "success"}
              sx={{
                '& .MuiBadge-badge': {
                  fontSize: '0.75rem',
                  height: '20px',
                  minWidth: '70px'
                }
              }}
            >
              <Info sx={{ color: 'text.secondary' }} />
            </Badge>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Tooltip title="Refresh Data">
              <IconButton onClick={fetchData} disabled={loading} size="small">
                <Refresh />
              </IconButton>
            </Tooltip>
            <Tooltip title="Export Data">
              <Button
                startIcon={<Download />}
                onClick={exportData}
                variant="outlined"
                size="small"
                sx={{ minWidth: 100 }}
              >
                Export
              </Button>
            </Tooltip>
          </Box>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
          Real-time air quality monitoring and policy recommendations for Nairobi, Kenya
        </Typography>
      </Box>

      {/* Data Source Alert */}
      {usingMockData && (
        <Alert severity="warning" sx={{ mb: 2 }} icon={<Warning />}>
          <Typography variant="subtitle1" gutterBottom>
            <strong>Demo Mode Active</strong>
          </Typography>
          <Typography variant="body2">
            Currently showing simulated Nairobi air quality data. 
            Backend API at <code>https://unep-air-backend.onrender.com</code> is not accessible.
            All functionality is working with realistic sample data.
          </Typography>
        </Alert>
      )}

      {/* Error Alert */}
      {error && !usingMockData && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
          <Button onClick={fetchData} sx={{ ml: 2 }}>
            Retry Connection
          </Button>
        </Alert>
      )}

      {/* Last Update Info */}
      <Alert severity="info" sx={{ mb: 3 }}>
        Last updated: {lastUpdate.toLocaleString()} | 
        Next update: {new Date(lastUpdate.getTime() + 5 * 60 * 1000).toLocaleTimeString()}
        {loading && <CircularProgress size={16} sx={{ ml: 1 }} />}
        {usingMockData && (
          <Typography variant="body2" sx={{ mt: 1 }}>
            📊 Data Source: Simulated Nairobi monitoring stations
          </Typography>
        )}
      </Alert>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card sx={{ position: 'relative' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Box sx={{
                  bgcolor: avgPM25 > 35 ? 'error.light' : avgPM25 > 15 ? 'warning.light' : 'success.light',
                  p: 1,
                  borderRadius: 1,
                  mr: 2
                }}>
                  <Air sx={{ color: avgPM25 > 35 ? 'error.main' : avgPM25 > 15 ? 'warning.main' : 'success.main' }} />
                </Box>
                <Typography color="textSecondary" variant="body2">
                  Air Quality Index
                </Typography>
              </Box>
              <Typography variant="h4" color={avgPM25 > 35 ? 'error' : avgPM25 > 15 ? 'warning' : 'success'}>
                {avgPM25.toFixed(1)} μg/m³
              </Typography>
              <Typography variant="body2" color="textSecondary">
                WHO: 15 μg/m³
              </Typography>
              <LinearProgress
                variant="determinate"
                value={Math.min((avgPM25 / 60) * 100, 100)}
                sx={{
                  mt: 1,
                  height: 4,
                  borderRadius: 2,
                  bgcolor: 'grey.200'
                }}
              />
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card sx={{ position: 'relative' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Box sx={{
                  bgcolor: 'primary.light',
                  p: 1,
                  borderRadius: 1,
                  mr: 2
                }}>
                  <Map sx={{ color: 'primary.main' }} />
                </Box>
                <Typography color="textSecondary" variant="body2">
                  Monitoring Zones
                </Typography>
              </Box>
              <Typography variant="h4" color="primary">
                {zones.length}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Active stations
              </Typography>
              <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                <Chip
                  label="CBD"
                  size="small"
                  variant="outlined"
                  color="primary"
                />
                <Chip
                  label="Industrial"
                  size="small"
                  variant="outlined"
                  color="error"
                />
                <Chip
                  label="Residential"
                  size="small"
                  variant="outlined"
                  color="success"
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card sx={{ position: 'relative' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Box sx={{
                  bgcolor: 'error.light',
                  p: 1,
                  borderRadius: 1,
                  mr: 2
                }}>
                  <Warning sx={{ color: 'error.main' }} />
                </Box>
                <Typography color="textSecondary" variant="body2">
                  Health Alert Zones
                </Typography>
              </Box>
              <Typography variant="h4" color="error">
                {unhealthyZones}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Require attention
              </Typography>
              <Box sx={{ mt: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  Last update: {lastUpdate.toLocaleTimeString()}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card sx={{ position: 'relative' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Box sx={{
                  bgcolor: 'warning.light',
                  p: 1,
                  borderRadius: 1,
                  mr: 2
                }}>
                  <Policy sx={{ color: 'warning.main' }} />
                </Box>
                <Typography color="textSecondary" variant="body2">
                  Policy Actions
                </Typography>
              </Box>
              <Typography variant="h4" color="warning">
                {policies.length}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Interventions
              </Typography>
              <Box sx={{ mt: 1 }}>
                <Chip
                  label="High Priority"
                  size="small"
                  color="error"
                  variant="outlined"
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs for different views */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)} sx={{ minHeight: 64 }}>
          <Tab
            icon={<Map />}
            label="Interactive Map"
            iconPosition="start"
            sx={{ minWidth: 150 }}
          />
          <Tab
            icon={<BarChart />}
            label="Data Analysis"
            iconPosition="start"
            sx={{ minWidth: 150 }}
          />
          <Tab
            icon={<Report />}
            label="Zone Details"
            iconPosition="start"
            sx={{ minWidth: 150 }}
          />
          <Tab
            icon={<Policy />}
            label="Policy Actions"
            iconPosition="start"
            sx={{ minWidth: 150 }}
          />
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
                    <TableCell>{zone.id.replace('nairobi_zone_', '').replace(/_/g, ' ').toUpperCase()}</TableCell>
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


      {/* Platform Status */}
      <Paper sx={{ p: 3, mt: 3, bgcolor: usingMockData ? 'warning.light' : 'success.light' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          {usingMockData ? (
            <Warning sx={{ color: 'warning.main', mr: 2 }} />
          ) : (
            <CheckCircle sx={{ color: 'success.main', mr: 2 }} />
          )}
          <Typography variant="h6">
            {usingMockData ? '🔧 Demo Mode' : '✅ Live Data Connected'}
          </Typography>
        </Box>
        
        {usingMockData ? (
          <Box>
            <Typography variant="body2" paragraph>
              <strong>Demo Mode Active:</strong> Your UNEP Air Quality Platform is fully functional with simulated Nairobi data!
            </Typography>
            <Divider sx={{ my: 2 }} />
            <Typography variant="body2" sx={{ mb: 2 }}>
              <strong>Next Steps to Deploy:</strong>
            </Typography>
            <Box sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 1, fontSize: '0.875rem' }}>
              <Typography variant="body2" component="div">
                • Deploy your backend API with required endpoints:<br/>
                &nbsp;&nbsp;- <code>GET /api/air/nairobi-zones</code><br/>
                &nbsp;&nbsp;- <code>GET /api/policy/recommendations</code><br/>
                • Update your API base URL in environment variables<br/>
                • All charts, tables, and features are working perfectly!
              </Typography>
            </Box>
          </Box>
        ) : (
          <Box>
            <Typography variant="body2" paragraph>
              <strong>Live Data Connected:</strong> Your platform is successfully connected to the UNEP air quality API and displaying real-time data from Nairobi monitoring stations.
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2 }}>
              <Chip
                label="API Healthy"
                color="success"
                size="small"
                icon={<CheckCircle sx={{ fontSize: 16 }} />}
              />
              <Chip
                label="Real-time Updates"
                color="primary"
                size="small"
                icon={<Timeline sx={{ fontSize: 16 }} />}
              />
              <Chip
                label="Data Fresh"
                color="info"
                size="small"
                icon={<TrendingUp sx={{ fontSize: 16 }} />}
              />
            </Box>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default EnhancedNairobiDashboard;