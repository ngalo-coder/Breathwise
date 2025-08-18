import React, { useEffect, useRef, useState } from 'react';
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
    
    // Set API key if available
    const apiKey = import.meta.env.VITE_ARCGIS_API_KEY;
    if (apiKey) {
      // @ts-ignore
      window.esriConfig = { apiKey };
    }

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
            <p><strong>PM2.5 Level:</strong> {pm25} micrograms/m3</p>
            <p><strong>Health Impact:</strong> {aqi_category}</p>
            <p><strong>WHO Guideline:</strong> 15 micrograms/m3 (annual)</p>
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
        Interactive Nairobi Air Quality Map
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

export default AirQualityMap;