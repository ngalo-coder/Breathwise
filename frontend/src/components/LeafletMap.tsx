import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import { Paper, Typography, Box, Chip } from '@mui/material';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix default markers for Leaflet in React
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

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
  name?: string;
  properties?: any;
}

interface AirQualityMapProps {
  zones: MonitoringZone[];
}

const LeafletMap: React.FC<AirQualityMapProps> = ({ zones }) => {
  const [mapCenter] = useState<[number, number]>([-1.2921, 36.8219]); // Nairobi

  const getColorByPM25 = (pm25: number) => {
    if (pm25 <= 15) return '#00e400'; // Good
    if (pm25 <= 25) return '#ffff00'; // Moderate  
    if (pm25 <= 35) return '#ff7e00'; // Unhealthy for sensitive
    if (pm25 <= 55) return '#ff0000'; // Unhealthy
    return '#8f3f97'; // Very unhealthy
  };

  const getRadiusByPM25 = (pm25: number) => {
    return Math.max(500, pm25 * 50); // Minimum 500m radius
  };

  return (
    <Paper sx={{ p: 2, height: 600 }}>
      <Typography variant="h6" gutterBottom>
        🗺️ Interactive Nairobi Air Quality Map
      </Typography>
      
      <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
        <Chip label="🟢 Good (0-15)" size="small" />
        <Chip label="🟡 Moderate (15-25)" size="small" />
        <Chip label="🟠 Unhealthy Sensitive (25-35)" size="small" />
        <Chip label="🔴 Unhealthy (35-55)" size="small" />
        <Chip label="🟣 Very Unhealthy (55+)" size="small" />
      </Box>

      <MapContainer
        center={mapCenter}
        zoom={11}
        style={{ height: '450px', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {zones.map((zone, index) => {
          // Try to get coordinates from geometry, fallback to coordinates, fallback to default
          let coords: [number, number] = [36.8219, -1.2921];
          if (zone.geometry?.coordinates) {
            coords = zone.geometry.coordinates as [number, number];
          } else if ((zone as any).coordinates) {
            coords = (zone as any).coordinates as [number, number];
          }
          const lat = coords[1];
          const lng = coords[0];

          // Try to get PM2.5 from properties or direct
          const pm25 = zone.properties?.pm25 ?? zone.pm25 ?? 0;
          // Try to get name from properties or direct
          const name = zone.properties?.name || zone.name || zone.id || `Zone ${index + 1}`;
          // Try to get AQI category from properties or direct
          const aqiCategory = zone.properties?.aqi_category || zone.aqi_category || 'Unknown';

          return (
            <React.Fragment key={zone.id || index}>
              {/* Circle showing pollution area */}
              <Circle
                center={[lat, lng]}
                radius={getRadiusByPM25(pm25)}
                pathOptions={{
                  fillColor: getColorByPM25(pm25),
                  color: getColorByPM25(pm25),
                  weight: 2,
                  opacity: 0.7,
                  fillOpacity: 0.2,
                }}
              />
              
              {/* Marker with popup */}
              <Marker position={[lat, lng]}>
                <Popup>
                  <Box sx={{ p: 1 }}>
                    <Typography variant="subtitle1" fontWeight="bold">
                      {name}
                    </Typography>
                    <Typography variant="body2">
                      <strong>PM2.5:</strong> {pm25.toFixed(1)} μg/m³
                    </Typography>
                    <Typography variant="body2">
                      <strong>Status:</strong> {aqiCategory}
                    </Typography>
                    <Typography variant="body2">
                      <strong>WHO Guideline:</strong> 15 μg/m³
                    </Typography>
                    <Chip
                      label={pm25 > 35 ? '⚠️ Health Alert' : pm25 > 15 ? '⚠️ Above WHO' : '✅ Good'}
                      color={pm25 > 35 ? 'error' : pm25 > 15 ? 'warning' : 'success'}
                      size="small"
                      sx={{ mt: 1 }}
                    />
                  </Box>
                </Popup>
              </Marker>
            </React.Fragment>
          );
        })}
      </MapContainer>
    </Paper>
  );
};

export default LeafletMap;