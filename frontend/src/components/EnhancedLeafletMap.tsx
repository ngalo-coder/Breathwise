import React, { useEffect, useRef, useState } from 'react';
import { Box, Paper, Typography, Chip, CircularProgress, Slider, FormControlLabel, Switch, IconButton, Tooltip } from '@mui/material';
import { LayersOutlined, MyLocation, ZoomIn, ZoomOut, Refresh, Satellite, Map as MapIcon } from '@mui/icons-material';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { AirQualityZone } from '../context/DataContext';
import { MAP_CONFIG } from '../config';

// Fix Leaflet icon issue
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

// Define default icon
let DefaultIcon = L.Icon.extend({
  options: {
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  }
});

L.Marker.prototype.options.icon = new DefaultIcon();

// Extend Leaflet namespace for heatmap plugin
declare global {
  namespace L {
    function heatLayer(latlngs: any[], options?: any): any;
  }
}

// Props interface
interface EnhancedLeafletMapProps {
  zones: AirQualityZone[];
  satelliteData?: any[];
  height?: string | number;
  onZoneSelect?: (zoneId: string) => void;
  selectedZone?: string | null;
  showControls?: boolean;
}

const EnhancedLeafletMap: React.FC<EnhancedLeafletMapProps> = ({
  zones,
  satelliteData = [],
  height = 600,
  onZoneSelect,
  selectedZone = null,
  showControls = true
}) => {
  // Refs
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const zonesLayerRef = useRef<L.LayerGroup | null>(null);
  const satelliteLayerRef = useRef<L.LayerGroup | null>(null);
  const heatmapLayerRef = useRef<any | null>(null);

  // State
  const [loading, setLoading] = useState(true);
  const [mapType, setMapType] = useState<'streets' | 'satellite'>('streets');
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [opacity, setOpacity] = useState(0.7);
  const [zoomLevel, setZoomLevel] = useState(MAP_CONFIG.DEFAULT_ZOOM);
  const [heatmapAvailable, setHeatmapAvailable] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Create map
    const map = L.map(mapContainerRef.current, {
      center: MAP_CONFIG.NAIROBI_CENTER as L.LatLngExpression,
      zoom: MAP_CONFIG.DEFAULT_ZOOM,
      zoomControl: false,
      attributionControl: true
    });

    // Add tile layer
    const streetLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
    });

    // Create layer groups
    const zonesLayer = L.layerGroup().addTo(map);
    const satelliteDataLayer = L.layerGroup().addTo(map);

    // Store refs
    mapRef.current = map;
    zonesLayerRef.current = zonesLayer;
    satelliteLayerRef.current = satelliteDataLayer;

    // Set up event listeners
    map.on('zoom', () => {
      if (mapRef.current) {
        setZoomLevel(mapRef.current.getZoom());
      }
    });

    // Check if heatmap plugin is available
    setHeatmapAvailable(typeof L.heatLayer === 'function');

    setLoading(false);

    // Cleanup
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update map type
  useEffect(() => {
    if (!mapRef.current) return;

    const map = mapRef.current;

    // Remove existing layers
    map.eachLayer(layer => {
      if (layer instanceof L.TileLayer) {
        map.removeLayer(layer);
      }
    });

    // Add selected layer
    if (mapType === 'streets') {
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);
    } else {
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
      }).addTo(map);
    }
  }, [mapType]);

  // Update zones on map
  useEffect(() => {
    if (!mapRef.current || !zonesLayerRef.current) return;

    const map = mapRef.current;
    const zonesLayer = zonesLayerRef.current;

    // Clear existing markers
    zonesLayer.clearLayers();

    // Add zone markers
    zones.forEach(zone => {
      if (!zone.geometry?.coordinates) return;

      const [longitude, latitude] = zone.geometry.coordinates;

      // Get color based on severity
      const getColor = (severity: string) => {
        switch (severity) {
          case 'good': return '#4caf50';
          case 'moderate': return '#ffeb3b';
          case 'unhealthy_sensitive': return '#ff9800';
          case 'unhealthy': return '#f44336';
          case 'very_unhealthy': return '#9c27b0';
          case 'hazardous': return '#7e0023';
          default: return '#4caf50';
        }
      };

      // Create custom marker
      const markerSize = selectedZone === zone.id ? 20 : 15;
      const circleMarker = L.circleMarker([latitude, longitude], {
        radius: markerSize,
        fillColor: getColor(zone.severity),
        color: 'white',
        weight: 2,
        opacity: 1,
        fillOpacity: opacity
      });

      // Add popup
      circleMarker.bindPopup(`
        <div style="min-width: 200px;">
          <h3 style="margin: 0 0 8px 0;">${zone.name || zone.id.replace('nairobi_zone_', '').replace(/_/g, ' ')}</h3>
          <div style="display: flex; margin-bottom: 8px;">
            <div style="width: 12px; height: 12px; border-radius: 50%; background-color: ${getColor(zone.severity)}; margin-right: 8px; margin-top: 3px;"></div>
            <div style="font-weight: bold;">${zone.aqi_category}</div>
          </div>
          <div style="margin-bottom: 4px;"><strong>PM2.5:</strong> ${zone.pm25.toFixed(1)} μg/m³</div>
          <div style="margin-bottom: 4px;"><strong>AQI:</strong> ${zone.aqi}</div>
          <div style="font-size: 0.8em; color: #666; margin-top: 8px;">
            Last updated: ${new Date(zone.recorded_at).toLocaleString()}
          </div>
        </div>
      `);

      // Add click handler
      circleMarker.on('click', () => {
        if (onZoneSelect) {
          onZoneSelect(zone.id);
        }
      });

      // Add to layer
      circleMarker.addTo(zonesLayer);
    });

    // Update heatmap if enabled
    if (showHeatmap && zones.length > 0 && heatmapAvailable) {
      updateHeatmap();
    }

    // Fit bounds if no selected zone
    if (!selectedZone && zones.length > 0) {
      const bounds = L.latLngBounds(zones.map(zone => {
        const [longitude, latitude] = zone.geometry.coordinates;
        return [latitude, longitude];
      }));
      map.fitBounds(bounds, { padding: [50, 50] });
    }

    // Center on selected zone
    if (selectedZone) {
      const selected = zones.find(zone => zone.id === selectedZone);
      if (selected && selected.geometry?.coordinates) {
        const [longitude, latitude] = selected.geometry.coordinates;
        map.setView([latitude, longitude], MAP_CONFIG.DEFAULT_ZOOM + 2);
      }
    }
  }, [zones, selectedZone, opacity, showHeatmap, onZoneSelect, heatmapAvailable]);

  // Update satellite data on map
  useEffect(() => {
    if (!mapRef.current || !satelliteLayerRef.current || !satelliteData.length) return;

    const satelliteLayer = satelliteLayerRef.current;

    // Clear existing markers
    satelliteLayer.clearLayers();

    // Add satellite data markers
    satelliteData.forEach(data => {
      if (!data.coordinates) return;

      const [longitude, latitude] = data.coordinates;

      // Create custom marker
      const marker = L.circleMarker([latitude, longitude], {
        radius: 8,
        fillColor: '#2196f3',
        color: 'white',
        weight: 1,
        opacity: 1,
        fillOpacity: 0.8
      });

      // Add popup
      marker.bindPopup(`
        <div>
          <h3 style="margin: 0 0 8px 0;">Satellite Data</h3>
          <div><strong>Type:</strong> ${data.type}</div>
          <div><strong>Value:</strong> ${data.value}</div>
          <div><strong>Quality:</strong> ${(data.quality * 100).toFixed(0)}%</div>
          <div style="font-size: 0.8em; color: #666; margin-top: 8px;">
            Recorded: ${new Date(data.timestamp).toLocaleString()}
          </div>
        </div>
      `);

      // Add to layer
      marker.addTo(satelliteLayer);
    });
  }, [satelliteData]);

  // Update heatmap
  const updateHeatmap = () => {
    if (!mapRef.current || !zones.length || !heatmapAvailable) return;

    // Remove existing heatmap
    if (heatmapLayerRef.current) {
      mapRef.current.removeLayer(heatmapLayerRef.current);
      heatmapLayerRef.current = null;
    }

    // Create heatmap data
    const heatmapData = zones.map(zone => {
      const [longitude, latitude] = zone.geometry.coordinates;
      return [latitude, longitude, zone.pm25 / 10]; // Intensity based on PM2.5
    });

    // Create heatmap layer if plugin is available
    if (typeof L.heatLayer === 'function') {
      try {
        heatmapLayerRef.current = L.heatLayer(heatmapData, {
          radius: 25,
          blur: 15,
          maxZoom: 17,
          gradient: {
            0.0: '#4caf50',
            0.3: '#ffeb3b',
            0.5: '#ff9800',
            0.7: '#f44336',
            1.0: '#9c27b0'
          }
        }).addTo(mapRef.current);
      } catch (error) {
        console.error('Error creating heatmap layer:', error);
        setHeatmapAvailable(false);
      }
    }
  };

  // Toggle heatmap
  const toggleHeatmap = () => {
    if (!heatmapAvailable) {
      console.warn('Heatmap plugin not available');
      return;
    }
    setShowHeatmap(prev => !prev);
  };

  // Toggle map type
  const toggleMapType = () => {
    setMapType(prev => prev === 'streets' ? 'satellite' : 'streets');
  };

  // Zoom controls
  const handleZoomIn = () => {
    if (mapRef.current) {
      mapRef.current.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (mapRef.current) {
      mapRef.current.zoomOut();
    }
  };

  // Center map on user location
  const centerOnUserLocation = () => {
    if (mapRef.current && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        position => {
          const { latitude, longitude } = position.coords;
          mapRef.current?.setView([latitude, longitude], MAP_CONFIG.DEFAULT_ZOOM + 2);
        },
        error => {
          console.error('Error getting user location:', error);
        }
      );
    }
  };

  // Refresh map
  const refreshMap = () => {
    if (mapRef.current) {
      mapRef.current.invalidateSize();
    }
  };

  // Handle opacity change
  const handleOpacityChange = (event: Event, newValue: number | number[]) => {
    setOpacity(newValue as number);
  };

  return (
    <Paper
      elevation={2}
      sx={{
        position: 'relative',
        height: height,
        overflow: 'hidden',
        borderRadius: 2
      }}
    >
      {loading && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            bgcolor: 'rgba(255, 255, 255, 0.7)'
          }}
        >
          <CircularProgress />
        </Box>
      )}

      {/* Map container */}
      <Box
        ref={mapContainerRef}
        sx={{
          height: '100%',
          width: '100%'
        }}
      />

      {/* Map controls */}
      {showControls && (
        <>
          {/* Zoom controls */}
          <Box
            sx={{
              position: 'absolute',
              top: 16,
              right: 16,
              zIndex: 1000,
              display: 'flex',
              flexDirection: 'column',
              gap: 1
            }}
          >
            <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
              <IconButton onClick={handleZoomIn} size="small" sx={{ p: 1 }}>
                <ZoomIn />
              </IconButton>
            </Paper>
            <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
              <IconButton onClick={handleZoomOut} size="small" sx={{ p: 1 }}>
                <ZoomOut />
              </IconButton>
            </Paper>
            <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
              <IconButton onClick={centerOnUserLocation} size="small" sx={{ p: 1 }}>
                <MyLocation />
              </IconButton>
            </Paper>
            <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
              <IconButton onClick={refreshMap} size="small" sx={{ p: 1 }}>
                <Refresh />
              </IconButton>
            </Paper>
          </Box>

          {/* Layer controls */}
          <Box
            sx={{
              position: 'absolute',
              bottom: 16,
              right: 16,
              zIndex: 1000,
              display: 'flex',
              flexDirection: 'column',
              gap: 1
            }}
          >
            <Paper
              elevation={2}
              sx={{
                p: 2,
                borderRadius: 2,
                width: 240
              }}
            >
              <Typography variant="subtitle2" gutterBottom>
                Map Controls
              </Typography>

              <Box sx={{ mb: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={mapType === 'satellite'}
                      onChange={toggleMapType}
                      size="small"
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      {mapType === 'satellite' ? <Satellite fontSize="small" /> : <MapIcon fontSize="small" />}
                      <Typography variant="body2">
                        {mapType === 'satellite' ? 'Satellite' : 'Streets'}
                      </Typography>
                    </Box>
                  }
                />
              </Box>

              {heatmapAvailable && (
                <Box sx={{ mb: 2 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={showHeatmap}
                        onChange={toggleHeatmap}
                        size="small"
                      />
                    }
                    label={
                      <Typography variant="body2">
                        Pollution Heatmap
                      </Typography>
                    }
                  />
                </Box>
              )}

              <Box sx={{ mb: 1 }}>
                <Typography variant="body2" gutterBottom>
                  Marker Opacity: {opacity.toFixed(1)}
                </Typography>
                <Slider
                  value={opacity}
                  onChange={handleOpacityChange}
                  min={0.1}
                  max={1}
                  step={0.1}
                  size="small"
                />
              </Box>
            </Paper>
          </Box>

          {/* Legend */}
          <Box
            sx={{
              position: 'absolute',
              bottom: 16,
              left: 16,
              zIndex: 1000
            }}
          >
            <Paper
              elevation={2}
              sx={{
                p: 2,
                borderRadius: 2,
                maxWidth: 240
              }}
            >
              <Typography variant="subtitle2" gutterBottom>
                Air Quality Legend
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#4caf50' }} />
                  <Typography variant="body2">Good (0-15 μg/m³)</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#ffeb3b' }} />
                  <Typography variant="body2">Moderate (15-25 μg/m³)</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#ff9800' }} />
                  <Typography variant="body2">Unhealthy for Sensitive Groups (25-35 μg/m³)</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#f44336' }} />
                  <Typography variant="body2">Unhealthy (35-55 μg/m³)</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#9c27b0' }} />
                  <Typography variant="body2">Very Unhealthy (55+ μg/m³)</Typography>
                </Box>
              </Box>

              <Box sx={{ mt: 2 }}>
                <Chip
                  label={`${zones.length} Monitoring Zones`}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
              </Box>
            </Paper>
          </Box>
        </>
      )}
    </Paper>
  );
};

export default EnhancedLeafletMap;