
import React, { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Box,
  Chip,
  LinearProgress,
  Alert
} from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

interface PredictionData {
  zone: string;
  current_pm25: number;
  predicted_24h: number;
  predicted_48h: number;
  predicted_week: number;
  confidence: number;
  trend: string;
  risk_level: string;
}

const PredictiveAnalytics: React.FC = () => {
  const [predictions, setPredictions] = useState<PredictionData[]>([]);
  const [trendData, setTrendData] = useState<any[]>([]);

  useEffect(() => {
    // Generate mock predictive data (in real app, this would call ML API)
    const mockPredictions: PredictionData[] = [
      {
        zone: 'CBD',
        current_pm25: 45.2,
        predicted_24h: 42.8,
        predicted_48h: 38.5,
        predicted_week: 35.2,
        confidence: 85,
        trend: 'improving',
        risk_level: 'high'
      },
      {
        zone: 'Embakasi',
        current_pm25: 89.5,
        predicted_24h: 92.1,
        predicted_48h: 85.3,
        predicted_week: 78.9,
        confidence: 78,
        trend: 'worsening',
        risk_level: 'critical'
      },
      {
        zone: 'Westlands',
        current_pm25: 32.1,
        predicted_24h: 28.9,
        predicted_48h: 26.4,
        predicted_week: 24.1,
        confidence: 92,
        trend: 'improving',
        risk_level: 'moderate'
      },
      {
        zone: 'Karen',
        current_pm25: 18.7,
        predicted_24h: 17.2,
        predicted_48h: 16.8,
        predicted_week: 15.9,
        confidence: 95,
        trend: 'stable',
        risk_level: 'low'
      }
    ];

    setPredictions(mockPredictions);

    // Generate trend data for chart
    const generateTrendData = () => {
      const days = ['Today', '24h', '48h', '72h', '4d', '5d', '6d', '7d'];
      return days.map((day, index) => ({
        day,
        CBD: 45.2 - (index * 1.5),
        Embakasi: 89.5 + (index * 0.5) - (index > 2 ? (index - 2) * 2 : 0),
        Westlands: 32.1 - (index * 1.2),
        Karen: 18.7 - (index * 0.4),
        WHO_Guideline: 15
      }));
    };

    setTrendData(generateTrendData());
  }, []);

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'critical': return '#f44336';
      case 'high': return '#ff9800';
      case 'moderate': return '#ffeb3b';
      case 'low': return '#4caf50';
      default: return '#757575';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return '📈 ↗️';
      case 'worsening': return '📉 ↘️';
      case 'stable': return '📊 →';
      default: return '📊';
    }
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        🔮 AI-Powered Predictive Analytics
      </Typography>
      
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          <strong>ML Model Active:</strong> Using weather patterns, traffic data, and historical trends to predict air quality changes.
        </Typography>
      </Alert>

      <Grid container spacing={3}>
        {/* Prediction Cards */}
        {predictions.map((prediction) => (
          <Grid item xs={12} md={6} key={prediction.zone}>
            <Card elevation={3}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">{prediction.zone}</Typography>
                  <Chip 
                    label={prediction.risk_level.toUpperCase()}
                    sx={{ 
                      backgroundColor: getRiskColor(prediction.risk_level),
                      color: 'white'
                    }}
                    size="small"
                  />
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Current PM2.5: <strong>{prediction.current_pm25} μg/m³</strong>
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    24h Prediction: <strong>{prediction.predicted_24h} μg/m³</strong>
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Weekly Trend: <strong>{prediction.predicted_week} μg/m³</strong> {getTrendIcon(prediction.trend)}
                  </Typography>
                </Box>

                <Box sx={{ mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Model Confidence: {prediction.confidence}%
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={prediction.confidence} 
                    sx={{ mt: 1 }}
                  />
                </Box>

                {prediction.risk_level === 'critical' && (
                  <Alert severity="error" sx={{ mt: 2 }}>
                    <Typography variant="caption">
                      ⚠️ Critical Alert: Immediate intervention recommended
                    </Typography>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}

        {/* Trend Chart */}
        <Grid item xs={12}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              📈 7-Day Air Quality Predictions
            </Typography>
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="WHO_Guideline" stroke="#4caf50" fill="#4caf50" fillOpacity={0.1} />
                <Line type="monotone" dataKey="Karen" stroke="#4caf50" strokeWidth={2} />
                <Line type="monotone" dataKey="Westlands" stroke="#ff9800" strokeWidth={2} />
                <Line type="monotone" dataKey="CBD" stroke="#f44336" strokeWidth={2} />
                <Line type="monotone" dataKey="Embakasi" stroke="#9c27b0" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default PredictiveAnalytics;
