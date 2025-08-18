import React from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import EnhancedNairobiDashboard from './components/EnhancedNairobiDashboard';

// UNEP-inspired theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2', // Blue
    },
    secondary: {
      main: '#4caf50', // Green
    },
    error: {
      main: '#f44336', // Red for unhealthy air quality
    },
    warning: {
      main: '#ff9800', // Orange for moderate air quality
    },
    success: {
      main: '#4caf50', // Green for good air quality
    },
  },
  typography: {
    h4: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 500,
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <EnhancedNairobiDashboard />
    </ThemeProvider>
  );
}

export default App;