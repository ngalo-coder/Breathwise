#!/usr/bin/env python3
"""
Quick Wins Implementation Helper
Provides immediate enhancements you can add to your working dashboard
"""

def create_arcgis_map_component():
    """Create ArcGIS map component for interactive visualization"""
    
    map_component = '''import React, { useEffect, useRef, useState } from 'react';
import WebMap from '@arcgis/core/WebMap';
import MapView from '@arcgis/core/views/MapView';
import FeatureLayer from '@arcgis/core/layers/FeatureLayer';
import { Box, Paper, Typography, CircularProgress } from '@mui/material';

interface AirQualityMapProps {
  zones: any[];
}

const AirQualityMap: React.FC<AirQualityMapProps> = ({ zones }) => {
  const mapDiv = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<MapView | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!mapDiv.current) return;

    const webMap = new WebMap({
      basemap: 'streets-navigation-vector'
    });

    const mapView = new MapView({
      container: mapDiv.current,
      map: webMap,
      center: [36.817, -1.286], // Nairobi center
      zoom: 11,
      constraints: {
        minZoom: 9,
        maxZoom: 16
      }
    });

    // Create air quality layer
    const airQualityLayer = new FeatureLayer({
      source: [],
      fields: [
        { name: "OBJECTID", type: "oid" },
        { name: "pm25", type: "double" },
        { name: "aqi_category", type: "string" },
        { name: "zone_name", type: "string" }
      ],
      objectIdField: "OBJECTID",
      geometryType: "point",
      renderer: {
        type: 'simple',
        symbol: {
          type: 'simple-marker',
          size: 16,
          outline: { width: 2, color: [255, 255, 255] }
        },
        visualVariables: [{
          type: 'color',
          field: 'pm25',
          stops: [
            { value: 0, color: [0, 228, 0] },    // Green (good)
            { value: 15, color: [255, 255, 0] }, // Yellow (moderate)
            { value: 35, color: [255, 126, 0] }, // Orange (unhealthy sensitive)
            { value: 55, color: [255, 0, 0] },   // Red (unhealthy)
            { value: 150, color: [143, 63, 151] } // Purple (very unhealthy)
          ]
        }]
      },
      popupTemplate: {
        title: 'Air Quality Monitor: {zone_name}',
        content: `
          <div style="padding: 10px;">
            <p><strong>PM2.5 Level:</strong> {pm25} μg/m³</p>
            <p><strong>Health Impact:</strong> {aqi_category}</p>
            <p><strong>WHO Guideline:</strong> 15 μg/m³ (annual)</p>
            <div style="margin-top: 10px; padding: 8px; background: #f0f0f0; border-radius: 4px;">
              <small>Click for detailed policy recommendations</small>
            </div>
          </div>
        `
      }
    });

    webMap.add(airQualityLayer);
    setView(mapView);
    setLoading(false);

    return () => mapView.destroy();
  }, []);

  // Update layer when zones data changes
  useEffect(() => {
    if (view && zones.length > 0) {
      const layer = view.map.layers.getItemAt(0) as FeatureLayer;
      if (layer) {
        const features = zones.map((zone, index) => ({
          geometry: {
            type: 'point',
            longitude: zone.geometry.coordinates[0],
            latitude: zone.geometry.coordinates[1]
          },
          attributes: {
            OBJECTID: index + 1,
            pm25: zone.properties.pm25,
            aqi_category: zone.properties.aqi_category,
            zone_name: zone.properties.id.replace('nairobi_zone_', 'Zone ')
          }
        }));

        layer.applyEdits({ 
          deleteFeatures: [{ where: "1=1" }],
          addFeatures: features 
        });
      }
    }
  }, [zones, view]);

  return (
    <Paper sx={{ height: 500, position: 'relative' }}>
      <Typography variant="h6" sx={{ p: 2, pb: 0 }}>
        🗺️ Nairobi Air Quality Map
      </Typography>
      {loading && (
        <Box sx={{ 
          position: 'absolute', 
          top: '50%', 
          left: '50%', 
          transform: 'translate(-50%, -50%)',
          zIndex: 1000
        }}>
          <CircularProgress />
        </Box>
      )}
      <div ref={mapDiv} style={{ height: '450px', width: '100%' }} />
    </Paper>
  );
};

export default AirQualityMap;'''

    with open('frontend/src/components/AirQualityMap.tsx', 'w') as f:
        f.write(map_component)
    
    print("✅ Created AirQualityMap.tsx component")

def create_charts_component():
    """Create charts component for data visualization"""
    
    charts_component = '''import React from 'react';
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
            📊 PM2.5 Levels by Zone
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
            🎯 Air Quality Distribution
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
            📈 Daily PM2.5 Trend (Average)
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

export default AirQualityCharts;'''

    with open('frontend/src/components/AirQualityCharts.tsx', 'w') as f:
        f.write(charts_component)
    
    print("✅ Created AirQualityCharts.tsx component")

def create_enhanced_dashboard():
    """Create enhanced dashboard with map and charts"""
    
    enhanced_dashboard = '''import React, { useState, useEffect } from 'react';
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

export default EnhancedNairobiDashboard;'''

    with open('frontend/src/components/EnhancedNairobiDashboard.tsx', 'w') as f:
        f.write(enhanced_dashboard)
    
    print("✅ Created EnhancedNairobiDashboard.tsx component")

def create_package_updates():
    """Update package.json with new dependencies"""
    
    print("\n📦 To add the new features, install these packages:")
    print("\nFor ArcGIS mapping:")
    print("cd frontend && npm install @arcgis/core")
    
    print("\nFor charts and visualization:")
    print("cd frontend && npm install recharts @mui/icons-material")
    
    print("\nFor enhanced UI:")
    print("cd frontend && npm install @mui/lab")

def main():
    print("🚀 UNEP Platform Quick Wins Implementation")
    print("=" * 50)
    
    print("\n1️⃣ Creating ArcGIS Map Component...")
    create_arcgis_map_component()
    
    print("\n2️⃣ Creating Charts Component...")
    create_charts_component()
    
    print("\n3️⃣ Creating Enhanced Dashboard...")
    create_enhanced_dashboard()
    
    print("\n4️⃣ Package Dependencies...")
    create_package_updates()
    
    print("\n" + "=" * 50)
    print("✅ QUICK WINS COMPONENTS CREATED!")
    print("\n🎯 Next Steps:")
    print("1. Install new dependencies (see commands above)")
    print("2. Get free ArcGIS API key: https://developers.arcgis.com")
    print("3. Add API key to frontend/.env: VITE_ARCGIS_API_KEY=your_key")
    print("4. Replace NairobiDashboard with EnhancedNairobiDashboard in App.tsx")
    print("5. Restart frontend: npm run dev")
    
    print("\n🌟 New Features Added:")
    print("   - Interactive ArcGIS map with your Nairobi zones")
    print("   - Charts and data visualization")
    print("   - Tabbed interface for different views")
    print("   - Data export functionality")
    print("   - Auto-refresh every 5 minutes")
    print("   - Enhanced mobile-responsive design")

if __name__ == "__main__":
    main()