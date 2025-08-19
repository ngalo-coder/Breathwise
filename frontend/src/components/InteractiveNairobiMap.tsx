
import React, { useEffect, useRef, useState } from 'react';
import { Paper, Typography, Box, Chip, Alert } from '@mui/material';
import Map from '@arcgis/core/Map';
import MapView from '@arcgis/core/views/MapView';
import Graphic from '@arcgis/core/Graphic';
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer';
import Point from '@arcgis/core/geometry/Point';
import SimpleMarkerSymbol from '@arcgis/core/symbols/SimpleMarkerSymbol';
import PopupTemplate from '@arcgis/core/PopupTemplate';

interface AirQualityZone {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  pm25: number;
  status: string;
  color: string;
}

const getAQIColor = (pm25: number): string => {
  if (pm25 <= 15) return '#4CAF50'; // Good - Green
  if (pm25 <= 25) return '#FFEB3B'; // Moderate - Yellow
  if (pm25 <= 35) return '#FF9800'; // Unhealthy for Sensitive - Orange
  if (pm25 <= 55) return '#F44336'; // Unhealthy - Red
  return '#9C27B0'; // Very Unhealthy - Purple
};

const InteractiveNairobiMap: React.FC = () => {
  const mapDiv = useRef<HTMLDivElement>(null);
  const [zones, setZones] = useState<AirQualityZone[]>([]);
  const [selectedZone, setSelectedZone] = useState<AirQualityZone | null>(null);

  useEffect(() => {
    // Fetch monitoring zones
    fetch('http://localhost:8001/api/air/nairobi-zones')
      .then(res => res.json())
      .then(data => {
        const formattedZones = data.map((zone: any) => ({
          id: zone.id,
          name: zone.name,
          latitude: zone.latitude,
          longitude: zone.longitude,
          pm25: zone.pm25,
          status: zone.status,
          color: getAQIColor(zone.pm25)
        }));
        setZones(formattedZones);
      })
      .catch(err => console.error('Error fetching zones:', err));
  }, []);

  useEffect(() => {
    if (!mapDiv.current || zones.length === 0) return;

    // Create map
    const map = new Map({
      basemap: 'streets-navigation-vector'
    });

    // Create map view centered on Nairobi
    const view = new MapView({
      container: mapDiv.current,
      map: map,
      center: [36.8219, -1.2921], // Nairobi coordinates
      zoom: 11
    });

    // Create graphics layer for air quality zones
    const graphicsLayer = new GraphicsLayer();
    map.add(graphicsLayer);

    // Add zone markers
    zones.forEach(zone => {
      const point = new Point({
        longitude: zone.longitude,
        latitude: zone.latitude
      });

      const markerSymbol = new SimpleMarkerSymbol({
        color: zone.color,
        size: 20,
        outline: {
          color: 'white',
          width: 2
        }
      });

      const popupTemplate = new PopupTemplate({
        title: zone.name,
        content: `
          <div style="padding: 10px;">
            <p><strong>PM2.5:</strong> ${zone.pm25} μg/m³</p>
            <p><strong>Status:</strong> ${zone.status}</p>
            <p><strong>WHO Guideline:</strong> 15 μg/m³</p>
            <p style="color: ${zone.pm25 > 35 ? 'red' : zone.pm25 > 15 ? 'orange' : 'green'}">
              ${zone.pm25 > 35 ? '⚠️ Health Alert' : zone.pm25 > 15 ? '⚠️ Above WHO Guideline' : '✅ Good Air Quality'}
            </p>
          </div>
        `
      });

      const graphic = new Graphic({
        geometry: point,
        symbol: markerSymbol,
        popupTemplate: popupTemplate,
        attributes: zone
      });

      graphicsLayer.add(graphic);
    });

    // Handle click events
    view.on('click', (event) => {
      view.hitTest(event).then(response => {
        if (response.results.length > 0) {
          const graphic = response.results[0].graphic;
          if (graphic.attributes) {
            setSelectedZone(graphic.attributes);
          }
        }
      });
    });

    return () => {
      view.destroy();
    };
  }, [zones]);

  return (
    <Paper elevation={3} sx={{ p: 2, height: '600px' }}>
      <Typography variant="h6" gutterBottom>
        🗺️ Interactive Nairobi Air Quality Map
      </Typography>
      
      <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
        <Chip label="🟢 Good (0-15)" size="small" />
        <Chip label="🟡 Moderate (15-25)" size="small" />
        <Chip label="🟠 Unhealthy (25-35)" size="small" />
        <Chip label="🔴 Unhealthy (35-55)" size="small" />
        <Chip label="🟣 Very Unhealthy (55+)" size="small" />
      </Box>

      <div 
        ref={mapDiv} 
        style={{ 
          height: '450px', 
          width: '100%', 
          border: '1px solid #ddd',
          borderRadius: '4px'
        }} 
      />

      {selectedZone && (
        <Alert severity="info" sx={{ mt: 2 }}>
          <Typography variant="body2">
            <strong>Selected:</strong> {selectedZone.name} - PM2.5: {selectedZone.pm25} μg/m³ ({selectedZone.status})
          </Typography>
        </Alert>
      )}
    </Paper>
  );
};

export default InteractiveNairobiMap;
