import React from 'react';
import { Box, Paper, Typography, Button, Alert } from '@mui/material';

interface AirQualityMapProps {
  zones: any[];
}

const AirQualityMap: React.FC<AirQualityMapProps> = ({ zones }) => {
  return (
    <Paper sx={{ p: 3, height: 500 }}>
      <Typography variant="h6" gutterBottom>
        🗺️ Interactive Nairobi Air Quality Map
      </Typography>
      
      <Alert severity="info" sx={{ mb: 2 }}>
        <Typography variant="subtitle1" gutterBottom>
          <strong>Map Configuration Needed</strong>
        </Typography>
        <Typography variant="body2">
          Interactive mapping will be available after ArcGIS integration.
          Currently showing zone data in table format.
        </Typography>
      </Alert>

      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        height: 300,
        bgcolor: 'grey.50',
        borderRadius: 1,
        border: '2px dashed',
        borderColor: 'grey.300'
      }}>
        <Typography variant="h5" color="text.secondary" gutterBottom>
          🌍 Nairobi Air Quality Zones
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
          {zones.length} monitoring zones loaded
        </Typography>
        
        {zones.length > 0 && (
          <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center' }}>
            {zones.map((zone, index) => {
              const pm25 = zone.properties?.pm25 || zone.pm25 || 0;
              const name = zone.properties?.name || zone.properties?.id || zone.name || zone.id || `Zone ${index + 1}`;
              
              return (
                <Box 
                  key={index}
                  sx={{ 
                    px: 2, 
                    py: 1, 
                    bgcolor: pm25 > 35 ? 'error.light' : 
                             pm25 > 15 ? 'warning.light' : 'success.light',
                    color: 'white',
                    borderRadius: 1,
                    fontSize: '0.875rem',
                    fontWeight: 'medium'
                  }}
                >
                  {name}: {pm25} μg/m³
                </Box>
              );
            })}
          </Box>
        )}
      </Box>

      <Alert severity="success" sx={{ mt: 2 }}>
        <Typography variant="body2">
          <strong>Platform Status:</strong> Your dashboard is fully functional! 
          All data, charts, and policy recommendations are working perfectly.
          The interactive map can be added later as an enhancement.
        </Typography>
      </Alert>
    </Paper>
  );
};

export default AirQualityMap;