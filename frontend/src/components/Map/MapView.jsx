import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, LayersControl } from 'react-leaflet';
import { 
  MapPin, 
  Wind, 
  AlertTriangle, 
  Thermometer, 
  Droplets, 
  Eye,
  RefreshCw,
  Layers,
  Settings,
  Download,
  Share
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useSocket } from '../../context/SocketContext';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const MapView = () => {
  const { measurements, hotspots, dashboardData, refreshSpecificData, loading } = useData();
  const { isConnected, requestDataUpdate } = useSocket();
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [mapLayers, setMapLayers] = useState({
    measurements: true,
    hotspots: true,
    heatmap: false,
    weather: true
  });
  const [mapStyle, setMapStyle] = useState('streets');
  const mapRef = useRef(null);

  // Nairobi center coordinates
  const nairobiCenter = [-1.2921, 36.8219];
  const mapBounds = [[-1.45, 36.65], [-1.15, 37.00]];

  useEffect(() => {
    // Auto-refresh data every 5 minutes
    const interval = setInterval(() => {
      if (mapLayers.measurements) refreshSpecificData('measurements');
      if (mapLayers.hotspots) refreshSpecificData('hotspots');
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [mapLayers, refreshSpecificData]);

  const getMarkerColor = (pm25Value) => {
    if (!pm25Value) return '#6b7280'; // gray
    if (pm25Value <= 15) return '#10b981'; // green
    if (pm25Value <= 25) return '#f59e0b'; // yellow
    if (pm25Value <= 35) return '#f97316'; // orange
    if (pm25Value <= 55) return '#ef4444'; // red
    return '#8b5cf6'; // purple
  };

  const getHotspotColor = (severity) => {
    switch (severity) {
      case 'critical': return '#dc2626';
      case 'high': return '#ea580c';
      case 'moderate': return '#d97706';
      case 'low': return '#65a30d';
      default: return '#6b7280';
    }
  };

  const getMarkerSize = (value, max = 100) => {
    const normalizedValue = Math.min(value / max, 1);
    return 10 + (normalizedValue * 20); // Size between 10-30px
  };

  const handleLocationClick = (location) => {
    setSelectedLocation(location);
  };

  const handleRefresh = () => {
    refreshSpecificData('measurements');
    refreshSpecificData('hotspots');
    requestDataUpdate();
  };

  const toggleLayer = (layerName) => {
    setMapLayers(prev => ({
      ...prev,
      [layerName]: !prev[layerName]
    }));
  };

  const exportMapData = () => {
    const data = {
      measurements: measurements.map(m => ({
        location: m.properties.name,
        coordinates: m.geometry.coordinates,
        pm25: m.properties.pm25,
        timestamp: m.properties.timestamp
      })),
      hotspots: hotspots.map(h => ({
        location: h.properties.location_name,
        coordinates: h.geometry.coordinates,
        severity: h.properties.severity,
        value: h.properties.value
      })),
      exportTime: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nairobi-air-quality-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const shareMap = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'UNEP Air Quality Map - Nairobi',
          text: 'Real-time air quality monitoring for Nairobi, Kenya',
          url: window.location.href
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('Map link copied to clipboard!');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-lg border-b border-gray-200 p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <MapPin className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Interactive Air Quality Map</h1>
              <p className="text-sm text-gray-600">Real-time monitoring • Nairobi, Kenya</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
              <span className="text-sm text-gray-600">
                {isConnected ? 'Live Updates' : 'Offline'}
              </span>
            </div>

            <button
              onClick={handleRefresh}
              disabled={loading}
              className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={exportMapData}
              className="bg-green-600 text-white p-2 rounded-lg hover:bg-green-700"
              title="Export Data"
            >
              <Download className="w-4 h-4" />
            </button>

            <button
              onClick={shareMap}
              className="bg-purple-600 text-white p-2 rounded-lg hover:bg-purple-700"
              title="Share Map"
            >
              <Share className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Map Controls */}
          <div className="space-y-4">
            {/* Layer Controls */}
            <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <Layers className="w-5 h-5 mr-2" />
                Map Layers
              </h3>
              <div className="space-y-3">
                {Object.entries(mapLayers).map(([layer, enabled]) => (
                  <label key={layer} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={enabled}
                      onChange={() => toggleLayer(layer)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 capitalize">
                      {layer.replace('_', ' ')}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Current Stats */}
            <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Current Status</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Monitoring Points</span>
                  <span className="font-medium">{measurements.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Active Hotspots</span>
                  <span className="font-medium text-red-600">{hotspots.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Avg PM2.5</span>
                  <span className="font-medium">
                    {dashboardData?.air_quality?.pm25?.current?.toFixed(1) || 'N/A'} μg/m³
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Air Quality</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    dashboardData?.overview?.air_quality_status === 'Good' 
                      ? 'bg-green-100 text-green-800'
                      : dashboardData?.overview?.air_quality_status === 'Moderate'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {dashboardData?.overview?.air_quality_status || 'Unknown'}
                  </span>
                </div>
              </div>
            </div>

            {/* Legend */}
            <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Legend</h3>
              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-700 mb-2">PM2.5 Levels (μg/m³)</div>
                <div className="space-y-1">
                  {[
                    { range: '0-15', color: '#10b981', label: 'Good' },
                    { range: '15-25', color: '#f59e0b', label: 'Moderate' },
                    { range: '25-35', color: '#f97316', label: 'Unhealthy for Sensitive' },
                    { range: '35-55', color: '#ef4444', label: 'Unhealthy' },
                    { range: '55+', color: '#8b5cf6', label: 'Very Unhealthy' }
                  ].map((item, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: item.color }}
                      ></div>
                      <span className="text-xs text-gray-600">{item.range}</span>
                      <span className="text-xs text-gray-500">({item.label})</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Selected Location Info */}
            {selectedLocation && (
              <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Selected Location</h3>
                <div className="space-y-2">
                  <div className="font-medium text-gray-900">{selectedLocation.name}</div>
                  <div className="text-sm text-gray-600">
                    PM2.5: {selectedLocation.pm25?.toFixed(1) || 'N/A'} μg/m³
                  </div>
                  <div className="text-sm text-gray-600">
                    Source: {selectedLocation.source}
                  </div>
                  <div className="text-sm text-gray-600">
                    Updated: {new Date(selectedLocation.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Map Container */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
              <MapContainer
                center={nairobiCenter}
                zoom={11}
                style={{ height: '600px', width: '100%' }}
                bounds={mapBounds}
                ref={mapRef}
              >
                <LayersControl position="topright">
                  <LayersControl.BaseLayer checked name="OpenStreetMap">
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                  </LayersControl.BaseLayer>
                  
                  <LayersControl.BaseLayer name="Satellite">
                    <TileLayer
                      attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
                      url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                    />
                  </LayersControl.BaseLayer>

                  {/* Measurement Points Layer */}
                  {mapLayers.measurements && (
                    <LayersControl.Overlay checked name="Monitoring Stations">
                      <>
                        {measurements.map((measurement, index) => (
                          <CircleMarker
                            key={`measurement-${index}`}
                            center={[
                              measurement.geometry.coordinates[1],
                              measurement.geometry.coordinates[0]
                            ]}
                            radius={getMarkerSize(measurement.properties.pm25 || 0, 60)}
                            fillColor={getMarkerColor(measurement.properties.pm25)}
                            color="white"
                            weight={2}
                            fillOpacity={0.7}
                            eventHandlers={{
                              click: () => handleLocationClick(measurement.properties)
                            }}
                          >
                            <Popup>
                              <div className="p-2">
                                <h4 className="font-semibold text-gray-900">
                                  {measurement.properties.name}
                                </h4>
                                <div className="mt-2 space-y-1 text-sm">
                                  <div className="flex justify-between">
                                    <span>PM2.5:</span>
                                    <span className="font-medium">
                                      {measurement.properties.pm25?.toFixed(1) || 'N/A'} μg/m³
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>PM10:</span>
                                    <span className="font-medium">
                                      {measurement.properties.pm10?.toFixed(1) || 'N/A'} μg/m³
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>NO2:</span>
                                    <span className="font-medium">
                                      {measurement.properties.no2?.toFixed(1) || 'N/A'} μg/m³
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Source:</span>
                                    <span className="font-medium">
                                      {measurement.properties.source}
                                    </span>
                                  </div>
                                  <div className="text-xs text-gray-500 mt-2">
                                    Updated: {new Date(measurement.properties.timestamp).toLocaleString()}
                                  </div>
                                </div>
                              </div>
                            </Popup>
                          </CircleMarker>
                        ))}
                      </>
                    </LayersControl.Overlay>
                  )}

                  {/* Hotspots Layer */}
                  {mapLayers.hotspots && (
                    <LayersControl.Overlay checked name="Pollution Hotspots">
                      <>
                        {hotspots.map((hotspot, index) => (
                          <CircleMarker
                            key={`hotspot-${index}`}
                            center={[
                              hotspot.geometry.coordinates[1],
                              hotspot.geometry.coordinates[0]
                            ]}
                            radius={getMarkerSize(hotspot.properties.value || 30, 100)}
                            fillColor={getHotspotColor(hotspot.properties.severity)}
                            color="#ffffff"
                            weight={3}
                            fillOpacity={0.8}
                            eventHandlers={{
                              click: () => handleLocationClick(hotspot.properties)
                            }}
                          >
                            <Popup>
                              <div className="p-2">
                                <h4 className="font-semibold text-gray-900 flex items-center">
                                  <AlertTriangle className="w-4 h-4 mr-1 text-red-500" />
                                  {hotspot.properties.location_name || 'Pollution Hotspot'}
                                </h4>
                                <div className="mt-2 space-y-1 text-sm">
                                  <div className="flex justify-between">
                                    <span>Severity:</span>
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                                      hotspot.properties.severity === 'critical' 
                                        ? 'bg-red-100 text-red-800'
                                        : hotspot.properties.severity === 'high'
                                        ? 'bg-orange-100 text-orange-800'
                                        : hotspot.properties.severity === 'moderate'
                                        ? 'bg-yellow-100 text-yellow-800'
                                        : 'bg-green-100 text-green-800'
                                    }`}>
                                      {hotspot.properties.severity}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Value:</span>
                                    <span className="font-medium">
                                      {hotspot.properties.value?.toFixed(1) || 'N/A'}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Type:</span>
                                    <span className="font-medium">
                                      {hotspot.properties.type || 'Air Pollution'}
                                    </span>
                                  </div>
                                  <div className="text-xs text-gray-500 mt-2">
                                    Detected: {new Date(hotspot.properties.timestamp || Date.now()).toLocaleString()}
                                  </div>
                                </div>
                              </div>
                            </Popup>
                          </CircleMarker>
                        ))}
                      </>
                    </LayersControl.Overlay>
                  )}

                  {/* Weather Layer */}
                  {mapLayers.weather && dashboardData?.weather && (
                    <LayersControl.Overlay name="Weather Info">
                      <Marker position={nairobiCenter}>
                        <Popup>
                          <div className="p-2">
                            <h4 className="font-semibold text-gray-900 flex items-center">
                              <Thermometer className="w-4 h-4 mr-1" />
                              Weather Conditions
                            </h4>
                            <div className="mt-2 space-y-1 text-sm">
                              <div className="flex justify-between">
                                <span>Temperature:</span>
                                <span className="font-medium">
                                  {dashboardData.weather.temperature?.toFixed(1) || 'N/A'}°C
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>Humidity:</span>
                                <span className="font-medium">
                                  {dashboardData.weather.humidity?.toFixed(0) || 'N/A'}%
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>Wind Speed:</span>
                                <span className="font-medium">
                                  {dashboardData.weather.wind_speed?.toFixed(1) || 'N/A'} m/s
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>Pressure:</span>
                                <span className="font-medium">
                                  {dashboardData.weather.pressure?.toFixed(0) || 'N/A'} hPa
                                </span>
                              </div>
                            </div>
                          </div>
                        </Popup>
                      </Marker>
                    </LayersControl.Overlay>
                  )}
                </LayersControl>
              </MapContainer>
            </div>

            {/* Map Footer */}
            <div className="mt-4 bg-white rounded-xl shadow-lg p-4 border border-gray-200">
              <div className="flex justify-between items-center text-sm text-gray-600">
                <div>
                  Last updated: {new Date().toLocaleString()}
                </div>
                <div className="flex items-center space-x-4">
                  <span>Data sources: UNEP, Local Monitoring Stations</span>
                  <span>•</span>
                  <span>Updates every 15 minutes</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapView;