import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Alert,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  Divider,
  Grid,
  Badge
} from '@mui/material';
import {
  Air,
  Map,
  Warning,
  CheckCircle,
  Info,
  TrendingUp,
  LocationOn,
  Refresh
} from '@mui/icons-material';

interface AirQualityMapProps {
  zones: any[];
}

const AirQualityMap: React.FC<AirQualityMapProps> = ({ zones }) => {
  // Calculate statistics
  const avgPM25 = zones.reduce((sum, z) => sum + (z.properties?.pm25 || z.pm25 || 0), 0) / zones.length;
  const criticalZones = zones.filter(z => (z.properties?.pm25 || z.pm25 || 0) > 35).length;
  const safeZones = zones.filter(z => (z.properties?.pm25 || z.pm25 || 0) <= 15).length;

  // Zone categories
  const zoneCategories = [
    { label: 'Critical (>35)', count: zones.filter(z => (z.properties?.pm25 || z.pm25 || 0) > 35).length, color: 'error', icon: <Warning /> },
    { label: 'Unhealthy (25-35)', count: zones.filter(z => (z.properties?.pm25 || z.pm25 || 0) > 25 && (z.properties?.pm25 || z.pm25 || 0) <= 35).length, color: 'warning', icon: <Info /> },
    { label: 'Moderate (15-25)', count: zones.filter(z => (z.properties?.pm25 || z.pm25 || 0) > 15 && (z.properties?.pm25 || z.pm25 || 0) <= 25).length, color: 'info', icon: <TrendingUp /> },
    { label: 'Good (≤15)', count: zones.filter(z => (z.properties?.pm25 || z.pm25 || 0) <= 15).length, color: 'success', icon: <CheckCircle /> }
  ].filter(cat => cat.count > 0);

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Header */}
      <Card sx={{ bgcolor: 'primary.light' }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Box sx={{
              bgcolor: 'primary.main',
              color: 'white',
              p: 1,
              borderRadius: 1,
              mr: 2,
              display: 'flex',
              alignItems: 'center'
            }}>
              <Map sx={{ mr: 1 }} />
            </Box>
            <Box>
              <Typography variant="h6" color="primary">
                Nairobi Air Quality Zones
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Real-time monitoring across {zones.length} zones
              </Typography>
            </Box>
          </Box>
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="primary">
                  {avgPM25.toFixed(1)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Avg PM2.5 (μg/m³)
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={Math.min((avgPM25 / 60) * 100, 100)}
                  sx={{ mt: 1, height: 4, borderRadius: 2 }}
                />
              </Box>
            </Grid>
            <Grid item xs={12} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color={criticalZones > 0 ? 'error' : 'success'}>
                  {criticalZones}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Critical Zones
                </Typography>
                {criticalZones > 0 && (
                  <Warning sx={{ color: 'error.main', mt: 1 }} />
                )}
              </Box>
            </Grid>
            <Grid item xs={12} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="info">
                  {safeZones}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Safe Zones
                </Typography>
                <CheckCircle sx={{ color: 'success.main', mt: 1 }} />
              </Box>
            </Grid>
            <Grid item xs={12} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Badge
                  badgeContent="Live"
                  color="success"
                  sx={{
                    '& .MuiBadge-badge': {
                      fontSize: '0.75rem',
                      height: '20px',
                      minWidth: '50px'
                    }
                  }}
                >
                  <LocationOn sx={{ color: 'primary.main', fontSize: 32 }} />
                </Badge>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Active Monitoring
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Map Visualization */}
      <Paper sx={{ p: 3, flex: 1, minHeight: 400 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Map sx={{ color: 'primary.main', mr: 2 }} />
          <Typography variant="h6" gutterBottom>
            Interactive Map View
          </Typography>
        </Box>
        
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            <strong>Map Enhancement:</strong> Interactive mapping with ArcGIS integration will provide detailed zone visualizations,
            pollution hotspots, and real-time data overlays. Current view shows zone statistics and categorization.
          </Typography>
        </Alert>

        {/* Map Visualization Area */}
        <Box sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          height: 300,
          bgcolor: 'grey.50',
          borderRadius: 2,
          border: '2px dashed',
          borderColor: 'grey.300',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Simulated Map Background */}
          <Box sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 25%, #90caf9 50%, #64b5f6 75%, #42a5f5 100%)',
            opacity: 0.3
          }} />
          
          <Box sx={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
            <Typography variant="h5" color="text.secondary" gutterBottom>
              🗺️ Nairobi City Map
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              {zones.length} monitoring zones active
            </Typography>
            
            {/* Zone Markers */}
            <Box sx={{ position: 'relative', width: 300, height: 200 }}>
              {/* Simulated zone markers */}
              {zones.slice(0, 8).map((zone, index) => {
                const pm25 = zone.properties?.pm25 || zone.pm25 || 0;
                const angle = (index / 8) * 2 * Math.PI;
                const radius = 60 + Math.random() * 40;
                const x = 150 + Math.cos(angle) * radius;
                const y = 100 + Math.sin(angle) * radius;
                
                return (
                  <Box
                    key={index}
                    sx={{
                      position: 'absolute',
                      left: x - 12,
                      top: y - 12,
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      border: '2px solid white',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      fontWeight: 'bold',
                      color: 'white',
                      bgcolor: pm25 > 35 ? 'error.main' :
                               pm25 > 25 ? 'warning.main' :
                               pm25 > 15 ? 'info.main' : 'success.main',
                      cursor: 'pointer',
                      transition: 'transform 0.2s',
                      '&:hover': {
                        transform: 'scale(1.2)'
                      }
                    }}
                    title={`${zone.properties?.name || zone.name || `Zone ${index + 1}`}: ${pm25} μg/m³`}
                  >
                    {index + 1}
                  </Box>
                );
              })}
            </Box>
          </Box>
        </Box>

        {/* Zone Categories Legend */}
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle2" gutterBottom sx={{ mb: 2 }}>
            Air Quality Categories
          </Typography>
          <Grid container spacing={1}>
            {zoneCategories.map((category, index) => (
              <Grid item xs={12} sm={6} key={index}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{
                    width: 16,
                    height: 16,
                    borderRadius: '50%',
                    bgcolor: `${category.color}.main`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {category.icon}
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" fontWeight="medium">
                      {category.label}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {category.count} zones
                    </Typography>
                  </Box>
                  <Chip
                    label={category.count}
                    size="small"
                    color={category.color as any}
                    variant="outlined"
                  />
                </Box>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Paper>

      {/* Platform Status */}
      <Card sx={{ bgcolor: 'success.light' }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <CheckCircle sx={{ color: 'success.main', mr: 2 }} />
            <Typography variant="h6">
              Map Platform Status
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">
            Enhanced mapping capabilities will include: ArcGIS integration, real-time pollution heatmaps,
            zone boundary visualization, and interactive data exploration tools. All core functionality
            is currently operational with zone-based data analysis.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default AirQualityMap;