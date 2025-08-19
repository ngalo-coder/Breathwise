
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Alert,
  Typography,
  Box,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Snackbar
} from '@mui/material';
import { Warning, LocationOn, People, LocalHospital } from '@mui/icons-material';

interface EmergencyAlert {
  id: string;
  zone: string;
  severity: 'critical' | 'high' | 'moderate';
  pm25_level: number;
  message: string;
  actions: string[];
  affected_population: number;
  timestamp: string;
}

const EmergencyAlertSystem: React.FC = () => {
  const [alerts, setAlerts] = useState<EmergencyAlert[]>([]);
  const [activeAlert, setActiveAlert] = useState<EmergencyAlert | null>(null);
  const [showSnackbar, setShowSnackbar] = useState(false);

  useEffect(() => {
    // Simulate real-time alerts
    const checkForAlerts = () => {
      const mockAlert: EmergencyAlert = {
        id: `alert_${Date.now()}`,
        zone: 'Embakasi Industrial Zone',
        severity: 'critical',
        pm25_level: 125.8,
        message: 'EMERGENCY: PM2.5 levels exceeded 125 μg/m³ - Immediate action required!',
        actions: [
          'Close all windows and doors',
          'Avoid outdoor activities',
          'Use air purifiers if available',
          'Seek medical attention if experiencing breathing difficulties',
          'Implement emergency traffic restrictions'
        ],
        affected_population: 45000,
        timestamp: new Date().toISOString()
      };

      // Randomly trigger alerts for demo
      if (Math.random() > 0.85) {
        setAlerts(prev => [mockAlert, ...prev.slice(0, 4)]);
        setActiveAlert(mockAlert);
        setShowSnackbar(true);
      }
    };

    const interval = setInterval(checkForAlerts, 10000); // Check every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return '#f44336';
      case 'high': return '#ff9800';
      case 'moderate': return '#ffeb3b';
      default: return '#757575';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return '🚨';
      case 'high': return '⚠️';
      case 'moderate': return '⚡';
      default: return 'ℹ️';
    }
  };

  const handleCloseAlert = () => {
    setActiveAlert(null);
  };

  const handleAcknowledgeAlert = () => {
    // In real app, this would send acknowledgment to backend
    console.log('Alert acknowledged:', activeAlert?.id);
    setActiveAlert(null);
    setShowSnackbar(false);
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <>
      {/* Emergency Alert Dialog */}
      <Dialog 
        open={!!activeAlert} 
        onClose={handleCloseAlert}
        maxWidth="md"
        fullWidth
      >
        {activeAlert && (
          <>
            <DialogTitle sx={{ 
              backgroundColor: getSeverityColor(activeAlert.severity),
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}>
              <Warning />
              {getSeverityIcon(activeAlert.severity)} EMERGENCY AIR QUALITY ALERT
            </DialogTitle>
            
            <DialogContent sx={{ mt: 2 }}>
              <Alert severity="error" sx={{ mb: 2 }}>
                <Typography variant="h6">
                  {activeAlert.message}
                </Typography>
              </Alert>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body1" gutterBottom>
                  <LocationOn sx={{ verticalAlign: 'middle', mr: 1 }} />
                  <strong>Location:</strong> {activeAlert.zone}
                </Typography>
                <Typography variant="body1" gutterBottom>
                  <strong>PM2.5 Level:</strong> {activeAlert.pm25_level} μg/m³ 
                  <Chip 
                    label={`${Math.round((activeAlert.pm25_level / 15) * 100)}% above WHO guideline`}
                    color="error"
                    size="small"
                    sx={{ ml: 1 }}
                  />
                </Typography>
                <Typography variant="body1" gutterBottom>
                  <People sx={{ verticalAlign: 'middle', mr: 1 }} />
                  <strong>Affected Population:</strong> ~{activeAlert.affected_population.toLocaleString()} people
                </Typography>
                <Typography variant="body1">
                  <strong>Time:</strong> {formatTime(activeAlert.timestamp)}
                </Typography>
              </Box>

              <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                🚨 Immediate Actions Required:
              </Typography>
              <List>
                {activeAlert.actions.map((action, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <LocalHospital color="error" />
                    </ListItemIcon>
                    <ListItemText primary={action} />
                  </ListItem>
                ))}
              </List>
            </DialogContent>

            <DialogActions>
              <Button onClick={handleCloseAlert} color="inherit">
                Close
              </Button>
              <Button 
                onClick={handleAcknowledgeAlert} 
                variant="contained" 
                color="error"
                startIcon={<Warning />}
              >
                Acknowledge & Take Action
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Snackbar for quick notifications */}
      <Snackbar
        open={showSnackbar}
        autoHideDuration={6000}
        onClose={() => setShowSnackbar(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setShowSnackbar(false)} 
          severity="error"
          sx={{ width: '100%' }}
        >
          🚨 Emergency air quality alert in {activeAlert?.zone}!
        </Alert>
      </Snackbar>

      {/* Recent Alerts Summary */}
      {alerts.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            📋 Recent Alerts
          </Typography>
          {alerts.slice(0, 3).map((alert) => (
            <Alert 
              key={alert.id}
              severity="warning"
              sx={{ mb: 1 }}
            >
              <Typography variant="body2">
                <strong>{alert.zone}:</strong> PM2.5 {alert.pm25_level} μg/m³ at {formatTime(alert.timestamp)}
              </Typography>
            </Alert>
          ))}
        </Box>
      )}
    </>
  );
};

export default EmergencyAlertSystem;
