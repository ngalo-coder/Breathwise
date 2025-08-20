import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Grid, 
  Paper, 
  Typography, 
  AppBar, 
  Toolbar, 
  IconButton, 
  Drawer, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText, 
  Divider, 
  Badge, 
  Chip, 
  Tabs, 
  Tab, 
  Alert, 
  Snackbar,
  CircularProgress,
  useTheme,
  useMediaQuery,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Tooltip,
  LinearProgress
} from '@mui/material';
import { 
  Menu as MenuIcon, 
  Dashboard as DashboardIcon, 
  Map as MapIcon, 
  BarChart as ChartIcon, 
  Insights as InsightsIcon, 
  Notifications as NotificationsIcon, 
  Settings as SettingsIcon, 
  Refresh as RefreshIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Air as AirIcon,
  Satellite as SatelliteIcon,
  Policy as PolicyIcon,
  Compare as CompareIcon,
  FilterAlt as FilterIcon,
  LocationCity as CityIcon,
  MyLocation as LocationIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material';
import { useData } from '../context/DataContext';
import { useUI } from '../context/UIContext';
import EnhancedLeafletMap from '../components/EnhancedLeafletMap';
import EnhancedDataCharts from '../components/EnhancedDataCharts';
import AIInsightsPanel from '../components/AIInsightsPanel';
import EmergencyAlertSystem from '../components/EmergencyAlertSystem';

// Dashboard tabs
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`dashboard-tabpanel-${index}`}
      aria-labelledby={`dashboard-tab-${index}`}
      {...other}
      style={{ height: '100%' }}
    >
      {value === index && (
        <Box sx={{ height: '100%' }}>
          {children}
        </Box>
      )}
    </div>
  );
};

const a11yProps = (index: number) => {
  return {
    id: `dashboard-tab-${index}`,
    'aria-controls': `dashboard-tabpanel-${index}`,
  };
};

const Dashboard: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));
  
  // Get data from context
  const { 
    airQualityZones, 
    policyRecommendations, 
    alerts, 
    aiInsights, 
    loading, 
    error, 
    lastUpdated, 
    refreshData,
    selectedZone,
    setSelectedZone,
    weatherData
  } = useData();
  
  // Get UI state from context
  const { 
    sidebarOpen, 
    setSidebarOpen, 
    activeView, 
    setActiveView,
    notifications,
    addNotification
  } = useUI();
  
  // Local state
  const [tabValue, setTabValue] = useState(0);
  const [alertOpen, setAlertOpen] = useState(!!error);
  const [selectedZones, setSelectedZones] = useState<string[]>([]);
  const [filterExpanded, setFilterExpanded] = useState(false);
  const [cityFilter, setCityFilter] = useState<string>('nairobi');
  
  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  // Handle sidebar toggle
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
  
  // Handle refresh
  const handleRefresh = () => {
    refreshData();
    addNotification({
      type: 'info',
      message: 'Refreshing data...',
      autoHide: true
    });
  };
  
  // Handle zone selection
  const handleZoneSelect = (zoneId: string | null) => {
    setSelectedZone(zoneId);
    
    if (zoneId) {
      const selectedZoneName = airQualityZones.find(z => z.id === zoneId)?.name || zoneId;
      addNotification({
        type: 'info',
        message: `Selected zone: ${selectedZoneName}`,
        autoHide: true
      });
    }
  };
  
  // Handle multiple zone selection
  const handleZonesChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    setSelectedZones(typeof value === 'string' ? value.split(',') : value);
  };
  
  // Handle city filter change
  const handleCityChange = (event: SelectChangeEvent) => {
    setCityFilter(event.target.value);
  };
  
  // Toggle filter expansion
  const toggleFilterExpanded = () => {
    setFilterExpanded(!filterExpanded);
  };
  
  // Show alerts as notifications
  useEffect(() => {
    if (alerts && alerts.length > 0) {
      // Find critical alerts
      const criticalAlerts = alerts.filter(alert => alert.severity === 'critical');
      
      if (criticalAlerts.length > 0) {
        criticalAlerts.forEach(alert => {
          addNotification({
            type: 'error',
            title: 'Critical Air Quality Alert',
            message: alert.message,
            autoHide: false
          });
        });
      }
    }
  }, [alerts, addNotification]);
  
  // Show error as notification
  useEffect(() => {
    if (error) {
      setAlertOpen(true);
    }
  }, [error]);
  
  // Calculate dashboard stats
  const avgPM25 = airQualityZones.length > 0 
    ? airQualityZones.reduce((sum, zone) => sum + zone.pm25, 0) / airQualityZones.length 
    : 0;
  
  const unhealthyZones = airQualityZones.filter(zone => 
    zone.severity === 'unhealthy' || zone.severity === 'very_unhealthy' || zone.severity === 'hazardous'
  ).length;
  
  const criticalAlerts = alerts.filter(alert => alert.severity === 'critical').length;
  
  // Filter zones based on city
  const filteredZones = airQualityZones.filter(zone => 
    zone.id.startsWith(cityFilter)
  );
  
  // Drawer width
  const drawerWidth = 240;
  
  // Render zone selection controls
  const renderZoneSelectionControls = () => {
    return (
      <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <FilterIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
            <Typography variant="h6">Data Filters</Typography>
          </Box>
          
          <IconButton size="small" onClick={toggleFilterExpanded}>
            {filterExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Box>
        
        {filterExpanded && (
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth size="small">
                <InputLabel id="city-select-label">City</InputLabel>
                <Select
                  labelId="city-select-label"
                  id="city-select"
                  value={cityFilter}
                  label="City"
                  onChange={handleCityChange}
                  startAdornment={<CityIcon sx={{ mr: 1, ml: -0.5 }} />}
                >
                  <MenuItem value="nairobi">Nairobi</MenuItem>
                  <MenuItem value="mombasa">Mombasa</MenuItem>
                  <MenuItem value="kisumu">Kisumu</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth size="small">
                <InputLabel id="zones-select-label">Compare Zones</InputLabel>
                <Select
                  labelId="zones-select-label"
                  id="zones-select"
                  multiple
                  value={selectedZones}
                  label="Compare Zones"
                  onChange={handleZonesChange}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {(selected as string[]).map((zoneId) => {
                        const zone = airQualityZones.find(z => z.id === zoneId);
                        return (
                          <Chip 
                            key={zoneId} 
                            label={zone?.name || zoneId} 
                            size="small" 
                          />
                        );
                      })}
                    </Box>
                  )}
                >
                  {filteredZones.map((zone) => (
                    <MenuItem key={zone.id} value={zone.id}>
                      {zone.name || zone.id}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                <Button 
                  variant="outlined" 
                  size="small" 
                  startIcon={<LocationIcon />}
                  onClick={() => handleZoneSelect(null)}
                >
                  Clear Selection
                </Button>
                
                <Button 
                  variant="contained" 
                  size="small" 
                  startIcon={<FilterIcon />}
                  onClick={() => {
                    // Apply filters
                    if (selectedZones.length > 0) {
                      handleZoneSelect(selectedZones[0]);
                    }
                  }}
                >
                  Apply Filters
                </Button>
              </Box>
            </Grid>
          </Grid>
        )}
      </Paper>
    );
  };
  
  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      {/* App Bar */}
      <AppBar 
        position="fixed" 
        sx={{ 
          zIndex: theme.zIndex.drawer + 1,
          backgroundColor: theme.palette.background.paper,
          color: theme.palette.text.primary,
          boxShadow: '0 1px 3px rgba(0,0,0,0.12)'
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={toggleSidebar}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <AirIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
            <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 'bold' }}>
              BreathWise
            </Typography>
            <Chip 
              label="Environmental Monitoring Platform" 
              size="small" 
              sx={{ ml: 2, bgcolor: theme.palette.primary.light, color: 'white' }} 
            />
          </Box>
          
          <Box sx={{ flexGrow: 1 }} />
          
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Tooltip title="Refresh Data">
              <IconButton color="inherit" onClick={handleRefresh}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Notifications">
              <IconButton color="inherit">
                <Badge badgeContent={criticalAlerts} color="error">
                  <NotificationsIcon />
                </Badge>
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Settings">
              <IconButton color="inherit">
                <SettingsIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>
      
      {/* Sidebar */}
      <Drawer
        variant={isMobile ? "temporary" : "persistent"}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            borderRight: '1px solid rgba(0,0,0,0.08)',
            boxShadow: 'none'
          },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto', mt: 2 }}>
          <List>
            <ListItem button selected={activeView === 'dashboard'} onClick={() => setActiveView('dashboard')}>
              <ListItemIcon>
                <DashboardIcon color={activeView === 'dashboard' ? 'primary' : 'inherit'} />
              </ListItemIcon>
              <ListItemText primary="Dashboard" />
            </ListItem>
            
            <ListItem button selected={activeView === 'map'} onClick={() => setActiveView('map')}>
              <ListItemIcon>
                <MapIcon color={activeView === 'map' ? 'primary' : 'inherit'} />
              </ListItemIcon>
              <ListItemText primary="Air Quality Map" />
            </ListItem>
            
            <ListItem button selected={activeView === 'charts'} onClick={() => setActiveView('charts')}>
              <ListItemIcon>
                <ChartIcon color={activeView === 'charts' ? 'primary' : 'inherit'} />
              </ListItemIcon>
              <ListItemText primary="Data Analysis" />
            </ListItem>
            
            <ListItem button selected={activeView === 'satellite'} onClick={() => setActiveView('satellite')}>
              <ListItemIcon>
                <SatelliteIcon color={activeView === 'satellite' ? 'primary' : 'inherit'} />
              </ListItemIcon>
              <ListItemText primary="Satellite Data" />
            </ListItem>
            
            <ListItem button selected={activeView === 'insights'} onClick={() => setActiveView('insights')}>
              <ListItemIcon>
                <InsightsIcon color={activeView === 'insights' ? 'primary' : 'inherit'} />
              </ListItemIcon>
              <ListItemText primary="AI Insights" />
            </ListItem>
            
            <ListItem button selected={activeView === 'policy'} onClick={() => setActiveView('policy')}>
              <ListItemIcon>
                <PolicyIcon color={activeView === 'policy' ? 'primary' : 'inherit'} />
              </ListItemIcon>
              <ListItemText primary="Policy Actions" />
            </ListItem>
            
            <ListItem button selected={activeView === 'compare'} onClick={() => setActiveView('compare')}>
              <ListItemIcon>
                <CompareIcon color={activeView === 'compare' ? 'primary' : 'inherit'} />
              </ListItemIcon>
              <ListItemText primary="Zone Comparison" />
            </ListItem>
          </List>
          
          <Divider sx={{ my: 2 }} />
          
          <Box sx={{ px: 2 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Air Quality Status
            </Typography>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="h4" color={avgPM25 > 35 ? 'error.main' : avgPM25 > 15 ? 'warning.main' : 'success.main'}>
                {avgPM25.toFixed(1)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Avg PM2.5 (μg/m³)
              </Typography>
            </Box>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Monitoring Zones
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Chip 
                  label={`${unhealthyZones} Unhealthy`} 
                  size="small" 
                  color="error" 
                  variant="outlined" 
                />
                <Chip 
                  label={`${airQualityZones.length - unhealthyZones} OK`} 
                  size="small" 
                  color="success" 
                  variant="outlined" 
                />
              </Box>
            </Box>
            
            {lastUpdated && (
              <Typography variant="caption" color="text.secondary">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </Typography>
            )}
          </Box>
        </Box>
      </Drawer>
      
      {/* Main content */}
      <Box component="main" sx={{ flexGrow: 1, p: 0, height: '100vh', overflow: 'hidden' }}>
        <Toolbar />
        
        {/* Error alert */}
        <Snackbar open={alertOpen} autoHideDuration={6000} onClose={() => setAlertOpen(false)}>
          <Alert onClose={() => setAlertOpen(false)} severity="error" sx={{ width: '100%' }}>
            {error}
          </Alert>
        </Snackbar>
        
        {/* Loading indicator */}
        {loading && (
          <Box sx={{ position: 'absolute', top: 64, left: 0, right: 0, zIndex: 9999 }}>
            <LinearProgress />
          </Box>
        )}
        
        {/* Dashboard content based on active view */}
        <Box sx={{ height: 'calc(100% - 64px)', overflow: 'auto' }}>
          {activeView === 'dashboard' && (
            <Box sx={{ p: 3 }}>
              <Typography variant="h4" gutterBottom>
                Nairobi Air Quality Dashboard
              </Typography>
              
              {/* Summary cards */}
              <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} md={3}>
                  <Paper sx={{ p: 2, height: '100%', borderRadius: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <AirIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                      <Typography variant="h6">Air Quality</Typography>
                    </Box>
                    <Typography variant="h3" color={avgPM25 > 35 ? 'error.main' : avgPM25 > 15 ? 'warning.main' : 'success.main'}>
                      {avgPM25.toFixed(1)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Average PM2.5 (μg/m³)
                    </Typography>
                  </Paper>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Paper sx={{ p: 2, height: '100%', borderRadius: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <MapIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                      <Typography variant="h6">Monitoring Zones</Typography>
                    </Box>
                    <Typography variant="h3">
                      {airQualityZones.length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Active stations
                    </Typography>
                  </Paper>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Paper sx={{ p: 2, height: '100%', borderRadius: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <WarningIcon sx={{ mr: 1, color: theme.palette.error.main }} />
                      <Typography variant="h6">Alerts</Typography>
                    </Box>
                    <Typography variant="h3" color={criticalAlerts > 0 ? 'error.main' : 'text.primary'}>
                      {criticalAlerts}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Critical alerts
                    </Typography>
                  </Paper>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Paper sx={{ p: 2, height: '100%', borderRadius: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <PolicyIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                      <Typography variant="h6">Policy Actions</Typography>
                    </Box>
                    <Typography variant="h3">
                      {policyRecommendations.length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Recommendations
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
              
              {/* Zone selection controls */}
              {renderZoneSelectionControls()}
              
              {/* Main dashboard content */}
              <Grid container spacing={3}>
                {/* Map */}
                <Grid item xs={12} lg={8}>
                  <Paper sx={{ p: 0, height: 500, borderRadius: 2, overflow: 'hidden' }}>
                    <EnhancedLeafletMap 
                      zones={filteredZones}
                      selectedZone={selectedZone}
                      onZoneSelect={handleZoneSelect}
                      height="100%"
                    />
                  </Paper>
                </Grid>
                
                {/* AI Insights */}
                <Grid item xs={12} lg={4}>
                  <AIInsightsPanel 
                    zones={filteredZones}
                    selectedZone={selectedZone}
                    weatherData={weatherData}
                    loading={loading}
                    onRefresh={handleRefresh}
                    height={500}
                  />
                </Grid>
                
                {/* Data Charts */}
                <Grid item xs={12}>
                  <EnhancedDataCharts 
                    zones={filteredZones}
                    selectedZone={selectedZone}
                    onZoneSelect={handleZoneSelect}
                    loading={loading}
                    onRefresh={handleRefresh}
                  />
                </Grid>
              </Grid>
            </Box>
          )}
          
          {activeView === 'map' && (
            <Box sx={{ p: 3, height: '100%' }}>
              <Typography variant="h4" gutterBottom>
                Interactive Air Quality Map
              </Typography>
              
              {/* Zone selection controls */}
              {renderZoneSelectionControls()}
              
              <Box sx={{ height: 'calc(100% - 150px)', minHeight: '600px' }}>
                <EnhancedLeafletMap 
                  zones={filteredZones}
                  selectedZone={selectedZone}
                  onZoneSelect={handleZoneSelect}
                  height="100%"
                  // Remove showSatelliteLayer prop as it's not in the interface
                />
              </Box>
            </Box>
          )}
          
          {activeView === 'charts' && (
            <Box sx={{ p: 3 }}>
              <Typography variant="h4" gutterBottom>
                Data Analysis
              </Typography>
              
              {/* Zone selection controls */}
              {renderZoneSelectionControls()}
              
              <EnhancedDataCharts 
                zones={filteredZones}
                selectedZone={selectedZone}
                onZoneSelect={handleZoneSelect}
                loading={loading}
                onRefresh={handleRefresh}
              />
            </Box>
          )}
          
          {activeView === 'insights' && (
            <Box sx={{ p: 3 }}>
              <Typography variant="h4" gutterBottom>
                AI-Powered Insights
              </Typography>
              
              {/* Zone selection controls */}
              {renderZoneSelectionControls()}
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={8}>
                  <AIInsightsPanel 
                    zones={filteredZones}
                    selectedZone={selectedZone}
                    weatherData={weatherData}
                    loading={loading}
                    onRefresh={handleRefresh}
                    height={700}
                  />
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <Paper sx={{ p: 3, height: 700, borderRadius: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      Selected Zone Details
                    </Typography>
                    
                    {selectedZone ? (
                      <Box>
                        {(() => {
                          const zone = airQualityZones.find(z => z.id === selectedZone);
                          if (!zone) return <Alert severity="info">No zone selected</Alert>;
                          
                          return (
                            <>
                              <Typography variant="h5" gutterBottom>
                                {zone.name || zone.id}
                              </Typography>
                              
                              <Box sx={{ mb: 3 }}>
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                  Air Quality Index
                                </Typography>
                                <Typography variant="h3" color={
                                  zone.aqi > 150 ? 'error.main' : 
                                  zone.aqi > 100 ? 'warning.main' : 
                                  'success.main'
                                }>
                                  {zone.aqi}
                                </Typography>
                                <Chip 
                                  label={zone.aqi_category} 
                                  color={
                                    zone.aqi > 150 ? 'error' : 
                                    zone.aqi > 100 ? 'warning' : 
                                    'success'
                                  } 
                                  size="small" 
                                  sx={{ mt: 1 }}
                                />
                              </Box>
                              
                              <Divider sx={{ my: 2 }} />
                              
                              <Typography variant="subtitle2" gutterBottom>
                                Pollutant Levels
                              </Typography>
                              
                              <Grid container spacing={2} sx={{ mb: 3 }}>
                                <Grid item xs={6}>
                                  <Typography variant="body2" color="text.secondary">
                                    PM2.5
                                  </Typography>
                                  <Typography variant="h6">
                                    {zone.pm25} μg/m³
                                  </Typography>
                                </Grid>
                                
                                <Grid item xs={6}>
                                  <Typography variant="body2" color="text.secondary">
                                    PM10
                                  </Typography>
                                  <Typography variant="h6">
                                    {zone.pm25 * 1.5 || '-'} μg/m³ {/* Estimate PM10 as 1.5x PM2.5 */}
                                  </Typography>
                                </Grid>
                                
                                <Grid item xs={6}>
                                  <Typography variant="body2" color="text.secondary">
                                    NO2
                                  </Typography>
                                  <Typography variant="h6">
                                    {Math.round(zone.pm25 * 0.8) || '-'} ppb {/* Estimate NO2 */}
                                  </Typography>
                                </Grid>
                                
                                <Grid item xs={6}>
                                  <Typography variant="body2" color="text.secondary">
                                    O3
                                  </Typography>
                                  <Typography variant="h6">
                                    {Math.round(zone.pm25 * 0.6) || '-'} ppb {/* Estimate O3 */}
                                  </Typography>
                                </Grid>
                              </Grid>
                              
                              <Divider sx={{ my: 2 }} />
                              
                              <Typography variant="subtitle2" gutterBottom>
                                Health Impact
                              </Typography>
                              
                              <Typography variant="body2" paragraph>
                                {zone.aqi > 150 ? 
                                  'Everyone may experience more serious health effects. Avoid outdoor activities.' :
                                  zone.aqi > 100 ?
                                  'Members of sensitive groups may experience health effects. The general public is less likely to be affected.' :
                                  'Air quality is satisfactory and poses little or no health risk.'
                                }
                              </Typography>
                              
                              <Button 
                                variant="outlined" 
                                fullWidth 
                                sx={{ mt: 2 }}
                                startIcon={<InsightsIcon />}
                              >
                                View Detailed Analysis
                              </Button>
                            </>
                          );
                        })()}
                      </Box>
                    ) : (
                      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80%' }}>
                        <Typography variant="body1" color="text.secondary">
                          Select a zone to view details
                        </Typography>
                      </Box>
                    )}
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          )}
          
          {activeView === 'compare' && (
            <Box sx={{ p: 3 }}>
              <Typography variant="h4" gutterBottom>
                Zone Comparison
              </Typography>
              
              {/* Zone selection controls */}
              {renderZoneSelectionControls()}
              
              {selectedZones.length > 0 ? (
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <EnhancedDataCharts 
                      zones={filteredZones}
                      // Pass selectedZone instead of selectedZones
                      selectedZone={selectedZones.length > 0 ? selectedZones[0] : null}
                      loading={loading}
                      onRefresh={handleRefresh}
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Paper sx={{ p: 3, borderRadius: 2 }}>
                      <Typography variant="h6" gutterBottom>
                        Comparison Results
                      </Typography>
                      
                      <Typography variant="body2" paragraph>
                        Comparing {selectedZones.length} zones. Use the charts above to analyze differences in air quality metrics.
                      </Typography>
                      
                      <Grid container spacing={2}>
                        {selectedZones.map(zoneId => {
                          const zone = airQualityZones.find(z => z.id === zoneId);
                          if (!zone) return null;
                          
                          return (
                            <Grid item xs={12} sm={6} md={4} key={zoneId}>
                              <Paper
                                sx={{
                                  p: 2,
                                  borderRadius: 2,
                                  border: `1px solid ${
                                    zone.aqi > 150 ? theme.palette.error.main :
                                    zone.aqi > 100 ? theme.palette.warning.main :
                                    theme.palette.success.main
                                  }`
                                }}
                              >
                                <Typography variant="subtitle1" gutterBottom>
                                  {zone.name || zone.id}
                                </Typography>
                                
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                  <Typography variant="body2" color="text.secondary">
                                    AQI
                                  </Typography>
                                  <Typography
                                    variant="body1"
                                    fontWeight="bold"
                                    color={
                                      zone.aqi > 150 ? 'error.main' :
                                      zone.aqi > 100 ? 'warning.main' :
                                      'success.main'
                                    }
                                  >
                                    {zone.aqi}
                                  </Typography>
                                </Box>
                                
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                  <Typography variant="body2" color="text.secondary">
                                    PM2.5
                                  </Typography>
                                  <Typography variant="body1">
                                    {zone.pm25} μg/m³
                                  </Typography>
                                </Box>
                                
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                  <Typography variant="body2" color="text.secondary">
                                    Category
                                  </Typography>
                                  <Chip
                                    label={zone.aqi_category}
                                    size="small"
                                    color={
                                      zone.aqi > 150 ? 'error' :
                                      zone.aqi > 100 ? 'warning' :
                                      'success'
                                    }
                                  />
                                </Box>
                              </Paper>
                            </Grid>
                          );
                        })}
                      </Grid>
                    </Paper>
                  </Grid>
                </Grid>
              ) : (
                <Alert severity="info" sx={{ mt: 2 }}>
                  Please select at least two zones to compare using the filters above.
                </Alert>
              )}
            </Box>
          )}
          
          {activeView === 'satellite' && (
            <Box sx={{ p: 3 }}>
              <Typography variant="h4" gutterBottom>
                Satellite Data
              </Typography>
              
              {/* Zone selection controls */}
              {renderZoneSelectionControls()}
              
              <Paper sx={{ p: 3, borderRadius: 2, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Satellite Imagery
                </Typography>
                
                <Box sx={{ height: 600 }}>
                  <EnhancedLeafletMap
                    zones={filteredZones}
                    selectedZone={selectedZone}
                    onZoneSelect={handleZoneSelect}
                    height="100%"
                    // Use standard props only
                  />
                </Box>
              </Paper>
            </Box>
          )}
          
          {activeView === 'policy' && (
            <Box sx={{ p: 3 }}>
              <Typography variant="h4" gutterBottom>
                Policy Recommendations
              </Typography>
              
              {/* Zone selection controls */}
              {renderZoneSelectionControls()}
              
              <Grid container spacing={3}>
                {policyRecommendations.length > 0 ? (
                  policyRecommendations.map((policy, index) => (
                    <Grid item xs={12} md={6} key={index}>
                      <Paper sx={{ p: 3, borderRadius: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <PolicyIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                          <Typography variant="h6">{policy.title}</Typography>
                        </Box>
                        
                        <Typography variant="body2" paragraph>
                          {policy.description}
                        </Typography>
                        
                        <Divider sx={{ my: 2 }} />
                        
                        <Typography variant="subtitle2" gutterBottom>
                          Impact Areas
                        </Typography>
                        
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                          {/* Display policy priority instead of impact areas */}
                          <Chip
                            label={`Priority: ${policy.priority}`}
                            size="small"
                            color={
                              policy.priority === 'high' ? 'error' :
                              policy.priority === 'medium' ? 'warning' :
                              'info'
                            }
                          />
                          <Chip
                            label={`Impact: ${policy.expected_impact_percent}%`}
                            size="small"
                          />
                        </Box>
                        
                        <Button
                          variant="outlined"
                          fullWidth
                          startIcon={<InfoIcon />}
                        >
                          View Details
                        </Button>
                      </Paper>
                    </Grid>
                  ))
                ) : (
                  <Grid item xs={12}>
                    <Alert severity="info">
                      No policy recommendations available at this time.
                    </Alert>
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default Dashboard;