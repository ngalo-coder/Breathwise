import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  CircularProgress,
  Button,
  IconButton,
  Collapse,
  useTheme,
  alpha,
  Tooltip,
  Grid
} from '@mui/material';
import {
  Insights,
  Recommend,
  HealthAndSafety,
  Warning,
  Info,
  TrendingUp,
  TrendingDown,
  TrendingFlat,
  ExpandMore,
  ExpandLess,
  Refresh,
  LocationOn,
  AccessTime,
  Masks,
  DirectionsBike,
  DirectionsCar,
  Park,
  AcUnit,
  Thermostat,
  Opacity,
  Air,
  Lightbulb
} from '@mui/icons-material';
import { AirQualityZone } from '../context/DataContext';

// Props interface
interface AIInsightsPanelProps {
  zones: AirQualityZone[];
  selectedZone?: string | null;
  weatherData?: any;
  loading?: boolean;
  onRefresh?: () => void;
  height?: string | number;
}

// Insight type
interface Insight {
  id: string;
  type: 'pattern' | 'anomaly' | 'forecast' | 'health' | 'recommendation';
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  icon: React.ReactNode;
  timestamp: string;
  source?: string;
  relatedZones?: string[];
  trend?: 'improving' | 'worsening' | 'stable';
  actions?: {
    text: string;
    icon: React.ReactNode;
    onClick?: () => void;
  }[];
}

const AIInsightsPanel: React.FC<AIInsightsPanelProps> = ({
  zones,
  selectedZone,
  weatherData,
  loading = false,
  onRefresh,
  height = 'auto'
}) => {
  const theme = useTheme();
  
  // State
  const [insights, setInsights] = useState<Insight[]>([]);
  const [expandedInsights, setExpandedInsights] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'patterns' | 'health' | 'recommendations'>('all');
  
  // Toggle insight expansion
  const toggleInsight = (insightId: string) => {
    setExpandedInsights(prev => 
      prev.includes(insightId)
        ? prev.filter(id => id !== insightId)
        : [...prev, insightId]
    );
  };
  
  // Filter insights based on active tab
  const filteredInsights = insights.filter(insight => {
    if (activeTab === 'all') return true;
    if (activeTab === 'patterns') return insight.type === 'pattern' || insight.type === 'anomaly' || insight.type === 'forecast';
    if (activeTab === 'health') return insight.type === 'health';
    if (activeTab === 'recommendations') return insight.type === 'recommendation';
    return true;
  });
  
  // Generate insights based on data
  useEffect(() => {
    if (zones.length === 0 || loading) return;
    
    // This would normally be an API call to an AI service
    // For now, we'll generate mock insights based on the data
    
    const generatedInsights: Insight[] = [];
    
    // Get the selected zone or use the worst air quality zone
    const targetZone = selectedZone
      ? zones.find(zone => zone.id === selectedZone)
      : [...zones].sort((a, b) => b.aqi - a.aqi)[0];
    
    if (!targetZone) return;
    
    // Current date for timestamps
    const now = new Date();
    const timestamp = now.toISOString();
    
    // Pattern insights
    if (targetZone.aqi > 100) {
      generatedInsights.push({
        id: 'pattern-1',
        type: 'pattern',
        title: 'Elevated Pollution Levels Detected',
        description: `${targetZone.name || targetZone.id} is experiencing unhealthy air quality levels with an AQI of ${targetZone.aqi}. This is primarily due to elevated PM2.5 concentrations of ${targetZone.pm25} μg/m³, which is ${Math.round(targetZone.pm25 / 15)} times the WHO guideline.`,
        severity: 'high',
        icon: <Warning color="error" />,
        timestamp,
        relatedZones: [targetZone.id],
        trend: 'worsening',
        actions: [
          {
            text: 'View detailed analysis',
            icon: <Insights />,
          },
          {
            text: 'Set up alerts for this zone',
            icon: <Notifications />,
          }
        ]
      });
    }
    
    // Find zones with similar patterns
    const similarZones = zones.filter(zone => 
      zone.id !== targetZone.id && 
      Math.abs(zone.aqi - targetZone.aqi) < 20
    );
    
    if (similarZones.length > 0) {
      generatedInsights.push({
        id: 'pattern-2',
        type: 'pattern',
        title: 'Similar Air Quality Patterns Detected',
        description: `We've detected similar air quality patterns in ${similarZones.length} other zones. This suggests a regional pollution event affecting multiple areas.`,
        severity: 'medium',
        icon: <TrendingFlat color="warning" />,
        timestamp,
        relatedZones: similarZones.map(zone => zone.id),
        trend: 'stable',
        actions: [
          {
            text: 'Compare these zones',
            icon: <CompareArrows />,
          }
        ]
      });
    }
    
    // Time-based patterns (mock data - would be based on historical analysis)
    const hourOfDay = now.getHours();
    if (hourOfDay >= 7 && hourOfDay <= 9) {
      generatedInsights.push({
        id: 'pattern-3',
        type: 'pattern',
        title: 'Morning Rush Hour Pattern',
        description: 'Current pollution levels align with typical morning rush hour patterns. Traffic emissions are a major contributor to the current air quality conditions.',
        severity: 'medium',
        icon: <DirectionsCar color="warning" />,
        timestamp,
        trend: 'worsening',
        actions: [
          {
            text: 'View traffic patterns',
            icon: <Map />,
          }
        ]
      });
    } else if (hourOfDay >= 17 && hourOfDay <= 19) {
      generatedInsights.push({
        id: 'pattern-4',
        type: 'pattern',
        title: 'Evening Rush Hour Pattern',
        description: 'Current pollution levels align with typical evening rush hour patterns. Consider delaying outdoor activities until after 8 PM when levels typically decrease.',
        severity: 'medium',
        icon: <DirectionsCar color="warning" />,
        timestamp,
        trend: 'worsening',
        actions: [
          {
            text: 'View historical trends',
            icon: <Timeline />,
          }
        ]
      });
    }
    
    // Weather correlation insights
    if (weatherData) {
      const windSpeed = weatherData.wind?.speed || 0;
      const temperature = weatherData.main?.temp || 0;
      const humidity = weatherData.main?.humidity || 0;
      
      if (windSpeed < 5 && targetZone.aqi > 100) {
        generatedInsights.push({
          id: 'pattern-5',
          type: 'pattern',
          title: 'Low Wind Speed Contributing to Pollution',
          description: `Current low wind speeds (${windSpeed} m/s) are limiting pollutant dispersion, contributing to the elevated pollution levels in your area.`,
          severity: 'medium',
          icon: <Air color="warning" />,
          timestamp,
          trend: 'stable',
          actions: [
            {
              text: 'View weather forecast',
              icon: <WbSunny />,
            }
          ]
        });
      }
      
      if (temperature > 30) {
        generatedInsights.push({
          id: 'pattern-6',
          type: 'pattern',
          title: 'High Temperature Impact',
          description: `Current high temperatures (${temperature}°C) are accelerating photochemical reactions, potentially increasing ozone formation and secondary pollutants.`,
          severity: 'medium',
          icon: <Thermostat color="error" />,
          timestamp,
          trend: 'worsening',
          actions: [
            {
              text: 'View ozone levels',
              icon: <AirplanemodeActive />,
            }
          ]
        });
      }
    }
    
    // Health insights
    if (targetZone.aqi > 150) {
      generatedInsights.push({
        id: 'health-1',
        type: 'health',
        title: 'Significant Health Risk Alert',
        description: 'Current air quality poses significant health risks. Everyone may begin to experience health effects, and sensitive groups may experience more serious effects.',
        severity: 'critical',
        icon: <HealthAndSafety color="error" />,
        timestamp,
        relatedZones: [targetZone.id],
        trend: 'worsening',
        actions: [
          {
            text: 'View health recommendations',
            icon: <Healing />,
          }
        ]
      });
    } else if (targetZone.aqi > 100) {
      generatedInsights.push({
        id: 'health-2',
        type: 'health',
        title: 'Health Advisory for Sensitive Groups',
        description: 'Members of sensitive groups may experience health effects. The general public is less likely to be affected.',
        severity: 'high',
        icon: <HealthAndSafety color="warning" />,
        timestamp,
        relatedZones: [targetZone.id],
        trend: 'stable',
        actions: [
          {
            text: 'View health recommendations',
            icon: <Healing />,
          }
        ]
      });
    }
    
    // Long-term exposure insight
    generatedInsights.push({
      id: 'health-3',
      type: 'health',
      title: 'Long-term Exposure Analysis',
      description: `Based on historical data, residents in ${targetZone.name || targetZone.id} have been exposed to PM2.5 levels exceeding WHO guidelines for approximately 65% of the past month. Long-term exposure at these levels is associated with increased risk of respiratory and cardiovascular conditions.`,
      severity: 'medium',
      icon: <AccessTime color="warning" />,
      timestamp,
      relatedZones: [targetZone.id],
      trend: 'stable',
      actions: [
        {
          text: 'View long-term trends',
          icon: <Timeline />,
        }
      ]
    });
    
    // Recommendations
    if (targetZone.aqi > 150) {
      generatedInsights.push({
        id: 'recommendation-1',
        type: 'recommendation',
        title: 'Limit Outdoor Activities',
        description: 'We recommend limiting outdoor activities, especially for sensitive groups including children, elderly, and those with respiratory conditions.',
        severity: 'high',
        icon: <Recommend color="error" />,
        timestamp,
        actions: [
          {
            text: 'Find indoor activities',
            icon: <Weekend />,
          }
        ]
      });
      
      generatedInsights.push({
        id: 'recommendation-2',
        type: 'recommendation',
        title: 'Use Air Purifiers',
        description: 'Consider using air purifiers with HEPA filters in your home to reduce indoor pollution levels.',
        severity: 'medium',
        icon: <AcUnit color="info" />,
        timestamp,
        actions: [
          {
            text: 'Learn about air purifiers',
            icon: <Info />,
          }
        ]
      });
      
      generatedInsights.push({
        id: 'recommendation-3',
        type: 'recommendation',
        title: 'Wear Masks Outdoors',
        description: 'If outdoor activities are necessary, consider wearing N95 or KN95 masks to reduce exposure to fine particulate matter.',
        severity: 'high',
        icon: <Masks color="warning" />,
        timestamp,
        actions: [
          {
            text: 'Learn about mask effectiveness',
            icon: <Info />,
          }
        ]
      });
    } else if (targetZone.aqi > 100) {
      generatedInsights.push({
        id: 'recommendation-4',
        type: 'recommendation',
        title: 'Reduce Strenuous Outdoor Activities',
        description: 'Sensitive individuals should reduce prolonged or heavy exertion outdoors. Consider rescheduling outdoor activities to times when air quality is better.',
        severity: 'medium',
        icon: <DirectionsBike color="warning" />,
        timestamp,
        actions: [
          {
            text: 'View hourly forecast',
            icon: <AccessTime />,
          }
        ]
      });
    } else {
      generatedInsights.push({
        id: 'recommendation-5',
        type: 'recommendation',
        title: 'Enjoy Outdoor Activities',
        description: 'Current air quality is suitable for outdoor activities. This is a good time to enjoy parks and outdoor exercise.',
        severity: 'low',
        icon: <Park color="success" />,
        timestamp,
        actions: [
          {
            text: 'Find nearby parks',
            icon: <LocationOn />,
          }
        ]
      });
    }
    
    // Alternative transportation recommendation
    if (hourOfDay >= 7 && hourOfDay <= 9 || hourOfDay >= 17 && hourOfDay <= 19) {
      generatedInsights.push({
        id: 'recommendation-6',
        type: 'recommendation',
        title: 'Consider Alternative Transportation',
        description: 'To reduce emissions during peak hours, consider using public transportation, carpooling, or cycling for your commute.',
        severity: 'medium',
        icon: <DirectionsBike color="info" />,
        timestamp,
        actions: [
          {
            text: 'View public transit options',
            icon: <DirectionsTransit />,
          }
        ]
      });
    }
    
    // Energy saving recommendation
    generatedInsights.push({
      id: 'recommendation-7',
      type: 'recommendation',
      title: 'Reduce Energy Consumption',
      description: 'Reducing energy consumption, especially during peak hours, can help decrease air pollution from power plants. Consider adjusting your thermostat and using energy-efficient appliances.',
      severity: 'low',
      icon: <Lightbulb color="info" />,
      timestamp,
      actions: [
        {
          text: 'Energy saving tips',
          icon: <Info />,
        }
      ]
    });
    
    // Forecast insights
    const dayOfWeek = now.getDay();
    if (dayOfWeek === 5) { // Friday
      generatedInsights.push({
        id: 'forecast-1',
        type: 'forecast',
        title: 'Weekend Air Quality Forecast',
        description: 'Based on historical patterns and current conditions, we predict improved air quality over the weekend due to reduced traffic emissions. Saturday morning is expected to have the best air quality of the week.',
        severity: 'low',
        icon: <TrendingDown color="success" />,
        timestamp,
        trend: 'improving',
        actions: [
          {
            text: 'View weekend forecast',
            icon: <DateRange />,
          }
        ]
      });
    }
    
    // Set insights with a slight delay to simulate AI processing
    setTimeout(() => {
      setInsights(generatedInsights);
      // Expand the first insight by default
      if (generatedInsights.length > 0) {
        setExpandedInsights([generatedInsights[0].id]);
      }
    }, 1000);
  }, [zones, selectedZone, weatherData, loading]);
  
  // Render severity indicator
  const renderSeverityIndicator = (severity: Insight['severity']) => {
    const colors = {
      low: theme.palette.success.main,
      medium: theme.palette.warning.main,
      high: theme.palette.error.main,
      critical: theme.palette.error.dark
    };
    
    const labels = {
      low: 'Low',
      medium: 'Medium',
      high: 'High',
      critical: 'Critical'
    };
    
    return (
      <Chip 
        label={labels[severity]} 
        size="small" 
        sx={{ 
          bgcolor: alpha(colors[severity], 0.1),
          color: colors[severity],
          fontWeight: 'bold',
          fontSize: '0.7rem'
        }}
      />
    );
  };
  
  // Render trend indicator
  const renderTrendIndicator = (trend?: Insight['trend']) => {
    if (!trend) return null;
    
    const icons = {
      improving: <TrendingDown color="success" fontSize="small" />,
      worsening: <TrendingUp color="error" fontSize="small" />,
      stable: <TrendingFlat color="info" fontSize="small" />
    };
    
    const labels = {
      improving: 'Improving',
      worsening: 'Worsening',
      stable: 'Stable'
    };
    
    return (
      <Chip 
        icon={icons[trend]} 
        label={labels[trend]} 
        size="small" 
        sx={{ fontSize: '0.7rem' }}
      />
    );
  };
  
  // Render type indicator
  const renderTypeIndicator = (type: Insight['type']) => {
    const colors = {
      pattern: theme.palette.info.main,
      anomaly: theme.palette.warning.main,
      forecast: theme.palette.primary.main,
      health: theme.palette.error.main,
      recommendation: theme.palette.success.main
    };
    
    const labels = {
      pattern: 'Pattern',
      anomaly: 'Anomaly',
      forecast: 'Forecast',
      health: 'Health',
      recommendation: 'Recommendation'
    };
    
    return (
      <Chip 
        label={labels[type]} 
        size="small" 
        sx={{ 
          bgcolor: alpha(colors[type], 0.1),
          color: colors[type],
          fontSize: '0.7rem'
        }}
      />
    );
  };
  
  // Render insights list
  const renderInsightsList = () => {
    if (loading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
          <CircularProgress size={40} />
          <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
            Analyzing environmental data...
          </Typography>
        </Box>
      );
    }
    
    if (filteredInsights.length === 0) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
          <Typography variant="body2" color="text.secondary">
            No insights available for the selected criteria.
          </Typography>
        </Box>
      );
    }
    
    return (
      <List sx={{ width: '100%' }}>
        {filteredInsights.map((insight) => (
          <React.Fragment key={insight.id}>
            <ListItem 
              alignItems="flex-start" 
              sx={{ 
                flexDirection: 'column',
                bgcolor: expandedInsights.includes(insight.id) 
                  ? alpha(theme.palette.primary.main, 0.05)
                  : 'transparent',
                borderRadius: 1,
                mb: 1
              }}
            >
              <Box sx={{ 
                display: 'flex', 
                width: '100%', 
                alignItems: 'flex-start',
                cursor: 'pointer'
              }}
              onClick={() => toggleInsight(insight.id)}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  {insight.icon}
                </ListItemIcon>
                
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Typography variant="subtitle1" component="div" sx={{ fontWeight: 'bold' }}>
                        {insight.title}
                      </Typography>
                      
                      <IconButton 
                        edge="end" 
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleInsight(insight.id);
                        }}
                      >
                        {expandedInsights.includes(insight.id) ? <ExpandLess /> : <ExpandMore />}
                      </IconButton>
                    </Box>
                  }
                  secondary={
                    <Box sx={{ mt: 0.5 }}>
                      <Box sx={{ display: 'flex', gap: 0.5, mb: 1, flexWrap: 'wrap' }}>
                        {renderTypeIndicator(insight.type)}
                        {renderSeverityIndicator(insight.severity)}
                        {insight.trend && renderTrendIndicator(insight.trend)}
                      </Box>
                    </Box>
                  }
                />
              </Box>
              
              <Collapse in={expandedInsights.includes(insight.id)} timeout="auto" unmountOnExit sx={{ width: '100%', pl: 5 }}>
                <Box sx={{ my: 1 }}>
                  <Typography variant="body2" color="text.secondary" paragraph sx={{ mb: 2 }}>
                    {insight.description}
                  </Typography>
                  
                  {insight.actions && insight.actions.length > 0 && (
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                      {insight.actions.map((action, index) => (
                        <Button
                          key={index}
                          size="small"
                          variant="outlined"
                          startIcon={action.icon}
                          onClick={action.onClick}
                          sx={{ borderRadius: 4 }}
                        >
                          {action.text}
                        </Button>
                      ))}
                    </Box>
                  )}
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(insight.timestamp).toLocaleString()}
                    </Typography>
                    
                    {insight.relatedZones && insight.relatedZones.length > 0 && (
                      <Tooltip title="Related zones">
                        <Chip
                          icon={<LocationOn fontSize="small" />}
                          label={`${insight.relatedZones.length} zone${insight.relatedZones.length > 1 ? 's' : ''}`}
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: '0.7rem' }}
                        />
                      </Tooltip>
                    )}
                  </Box>
                </Box>
              </Collapse>
            </ListItem>
            <Divider component="li" />
          </React.Fragment>
        ))}
      </List>
    );
  };
  
  // Render filter tabs
  const renderFilterTabs = () => {
    return (
      <Box sx={{ display: 'flex', gap: 1, mb: 2, overflowX: 'auto', pb: 1 }}>
        <Chip
          label="All Insights"
          icon={<Insights />}
          onClick={() => setActiveTab('all')}
          color={activeTab === 'all' ? 'primary' : 'default'}
          variant={activeTab === 'all' ? 'filled' : 'outlined'}
        />
        <Chip
          label="Patterns & Forecasts"
          icon={<Timeline />}
          onClick={() => setActiveTab('patterns')}
          color={activeTab === 'patterns' ? 'primary' : 'default'}
          variant={activeTab === 'patterns' ? 'filled' : 'outlined'}
        />
        <Chip
          label="Health Impacts"
          icon={<HealthAndSafety />}
          onClick={() => setActiveTab('health')}
          color={activeTab === 'health' ? 'primary' : 'default'}
          variant={activeTab === 'health' ? 'filled' : 'outlined'}
        />
        <Chip
          label="Recommendations"
          icon={<Recommend />}
          onClick={() => setActiveTab('recommendations')}
          color={activeTab === 'recommendations' ? 'primary' : 'default'}
          variant={activeTab === 'recommendations' ? 'filled' : 'outlined'}
        />
      </Box>
    );
  };
  
  // Main render
  return (
    <Paper sx={{ p: 3, height, borderRadius: 2, overflow: 'hidden' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" gutterBottom sx={{ mb: 0 }}>
          AI-Powered Insights
        </Typography>
        
        {onRefresh && (
          <Tooltip title="Refresh Insights">
            <IconButton onClick={onRefresh} disabled={loading} size="small">
              <Refresh />
            </IconButton>
          </Tooltip>
        )}
      </Box>
      
      <Typography variant="body2" color="text.secondary" paragraph>
        Intelligent analysis of environmental data to provide actionable insights and recommendations.
      </Typography>
      
      {renderFilterTabs()}
      
      <Divider sx={{ mb: 2 }} />
      
      <Box sx={{ maxHeight: 'calc(100% - 150px)', overflow: 'auto' }}>
        {renderInsightsList()}
      </Box>
    </Paper>
  );
};

export default AIInsightsPanel;

// Missing icon imports
import { 
  Notifications, 
  CompareArrows, 
  Map, 
  Timeline, 
  WbSunny, 
  AirplanemodeActive, 
  Healing, 
  Weekend, 
  DirectionsTransit, 
  DateRange 
} from '@mui/icons-material';