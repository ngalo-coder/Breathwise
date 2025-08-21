import React, { useState, useEffect } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box, CircularProgress, Typography } from '@mui/material';
import { io, Socket } from 'socket.io-client';
import { DataProvider } from './context/DataContext';
import { UIProvider } from './context/UIContext';
import Dashboard from './pages/Dashboard';
import { API_BASE_URL, WS_URL } from './config';

// Define theme with environmental colors
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2', // Blue
      light: '#4791db',
      dark: '#115293',
    },
    secondary: {
      main: '#4caf50', // Green
      light: '#80e27e',
      dark: '#087f23',
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
    info: {
      main: '#2196f3', // Blue for information
    },
    background: {
      default: '#f5f7fa',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
      fontSize: '2.5rem',
    },
    h2: {
      fontWeight: 600,
      fontSize: '2rem',
    },
    h3: {
      fontWeight: 600,
      fontSize: '1.75rem',
    },
    h4: {
      fontWeight: 600,
      fontSize: '1.5rem',
    },
    h5: {
      fontWeight: 500,
      fontSize: '1.25rem',
    },
    h6: {
      fontWeight: 500,
      fontSize: '1rem',
    },
    subtitle1: {
      fontWeight: 500,
    },
    subtitle2: {
      fontWeight: 500,
    },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 4px 20px 0 rgba(0,0,0,0.05)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 500,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 6,
        },
      },
    },
  },
});

function App() {
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Initialize socket connection
    try {
      const socketInstance = io(WS_URL);

      socketInstance.on('connect', () => {
        console.log('WebSocket connected');
        socketInstance.emit('join', 'nairobi_dashboard');
      });

      socketInstance.on('connect_error', (err) => {
        console.error('WebSocket connection error:', err);
        setError('Unable to establish real-time connection. Some features may be limited.');
      });

      setSocket(socketInstance);

      // Cleanup on unmount
      return () => {
        socketInstance.disconnect();
      };
    } catch (err) {
      console.error('Socket initialization error:', err);
      setError('Real-time connection failed. Using polling instead.');
    }
  }, []);

  // Check API connection
  useEffect(() => {
    const checkAPIConnection = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/air/summary`);
        if (!response.ok) {
          throw new Error(`API responded with status: ${response.status}`);
        }
        // API is available
        setLoading(false);
      } catch (err) {
        console.error('API connection error:', err);
        setLoading(false);
        setError('Unable to connect to the API. Please check your connection.');
      }
    };

    checkAPIConnection();
  }, []);

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          bgcolor: 'background.default'
        }}
      >
        <CircularProgress size={60} />
        <Typography variant="h5" sx={{ mt: 3 }}>
          Loading BreathWise Platform...
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Connecting to environmental data sources
        </Typography>
      </Box>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <UIProvider>
        <DataProvider socket={socket} initialError={error}>
          <Dashboard />
        </DataProvider>
      </UIProvider>
    </ThemeProvider>
  );
}

export default App;