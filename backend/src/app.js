// backend/src/app.js
// Simplified app without database dependencies

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';

// Import simplified routes
import simpleRoutes from './routes/simple.routes.js';
import directDataService from './services/directDataService.js';

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);

// --- CORS ORIGIN SETUP FOR MULTIPLE ENVIRONMENTS ---
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://unep-air-quality.vercel.app',
  'https://breathwise.vercel.app',
  'https://unep-air-quality-platform.netlify.app', // Netlify frontend
  process.env.FRONTEND_URL
].filter(Boolean);

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  },
  pingTimeout: 60000,
  pingInterval: 25000
});

// Security middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https:"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https:", "wss:"]
    }
  }
}));

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-API-Key']
};

app.use(cors(corsOptions));

// Logging
if (process.env.NODE_ENV === 'production') {
  app.use(morgan('combined'));
} else {
  app.use(morgan(':method :url :status :response-time ms'));
}

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 1000,
  message: {
    error: 'Too many requests from this IP',
    message: 'Please try again later',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === '/health'
});

app.use('/api/', limiter);

// Enhanced health check
app.get('/health', async (req, res) => {
  try {
    // Test API connectivity
    const cacheStats = directDataService.getCacheStats();

    res.json({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      version: '2.1.0-simplified',
      mode: 'direct_api_mode',
      environment: process.env.NODE_ENV || 'development',
      uptime: Math.floor(process.uptime()),
      services: {
        cache: {
          status: 'active',
          keys_count: cacheStats.keys?.length || 0
        },
        websocket: {
          status: 'active',
          connected_clients: io.sockets.sockets.size
        },
        apis: {
          weatherapi: process.env.WEATHERAPI_KEY ? 'configured' : 'not_configured',
          openaq: process.env.OPENAQ_API_KEY ? 'configured' : 'optional',
          iqair: process.env.IQAIR_API_KEY ? 'configured' : 'optional',
          waqi: process.env.WAQI_TOKEN ? 'configured' : 'optional',
          openrouter: process.env.OPENROUTER_API_KEY ? 'configured' : 'ai_disabled'
        }
      },
      features: {
        database_required: false,
        real_time_apis: true,
        ai_analysis: !!process.env.OPENROUTER_API_KEY,
        caching: true,
        websockets: true
      }
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// API Routes - All data comes directly from APIs
app.use('/api', simpleRoutes);

// Manual cache refresh endpoint
app.post('/api/cache/clear', (req, res) => {
  try {
    directDataService.clearCache();
    res.json({
      success: true,
      message: 'Cache cleared successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to clear cache',
      message: error.message
    });
  }
});

// Test API connectivity
app.get('/api/test-apis', async (req, res) => {
  try {
    console.log('🧪 Testing API connectivity...');

    const testResults = {
      weatherapi: false,
      openaq: false,
      iqair: false,
      waqi: false
    };

    // Test WeatherAPI
    if (process.env.WEATHERAPI_KEY) {
      try {
        const response = await fetch(
          `https://api.weatherapi.com/v1/current.json?key=${process.env.WEATHERAPI_KEY}&q=Nairobi,KE&aqi=yes`,
          { timeout: 5000 }
        );
        testResults.weatherapi = response.ok;
      } catch (error) {
        console.warn('WeatherAPI test failed:', error.message);
      }
    }

    // Test OpenAQ
    try {
      const headers = process.env.OPENAQ_API_KEY ? { 'X-API-Key': process.env.OPENAQ_API_KEY } : {};
      const response = await fetch(
        'https://api.openaq.org/v2/latest?country=KE&limit=1',
        { headers, timeout: 5000 }
      );
      testResults.openaq = response.ok;
    } catch (error) {
      console.warn('OpenAQ test failed:', error.message);
    }

    // Test IQAir
    if (process.env.IQAIR_API_KEY) {
      try {
        const response = await fetch(
          `https://api.airvisual.com/v2/nearest_city?lat=-1.2921&lon=36.8219&key=${process.env.IQAIR_API_KEY}`,
          { timeout: 5000 }
        );
        testResults.iqair = response.ok;
      } catch (error) {
        console.warn('IQAir test failed:', error.message);
      }
    }

    // Test WAQI
    if (process.env.WAQI_TOKEN) {
      try {
        const response = await fetch(
          `https://api.waqi.info/feed/nairobi/?token=${process.env.WAQI_TOKEN}`,
          { timeout: 5000 }
        );
        testResults.waqi = response.ok;
      } catch (error) {
        console.warn('WAQI test failed:', error.message);
      }
    }

    const workingAPIs = Object.values(testResults).filter(Boolean).length;
    const totalConfigured = Object.entries(testResults).filter(([key, _]) => {
      const envVars = {
        weatherapi: process.env.WEATHERAPI_KEY,
        openaq: true, // Always available
        iqair: process.env.IQAIR_API_KEY,
        waqi: process.env.WAQI_TOKEN
      };
      return envVars[key];
    }).length;

    res.json({
      success: workingAPIs > 0,
      apis_tested: testResults,
      summary: {
        working_apis: workingAPIs,
        total_configured: totalConfigured,
        success_rate: totalConfigured > 0 ? `${Math.round((workingAPIs / totalConfigured) * 100)}%` : '0%'
      },
      recommendations: generateAPIRecommendations(testResults),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ API test error:', error);
    res.status(500).json({
      error: 'Failed to test APIs',
      message: error.message
    });
  }
});

// Root endpoint with documentation
app.get('/', (req, res) => {
  res.json({
    message: 'UNEP Air Quality Platform - Simplified Mode',
    description: 'Direct API integration without database dependencies',
    version: '2.1.0-simplified',
    mode: 'hackathon_ready',
    features: [
      'Real-time air quality data from multiple APIs',
      'AI-powered analysis (if OpenRouter configured)',
      'Smart hotspot detection',
      'WebSocket real-time updates',
      'No database setup required'
    ],
    quick_start: {
      '1': 'Set WEATHERAPI_KEY in .env (required)',
      '2': 'Set OPENROUTER_API_KEY for AI features (optional)',
      '3': 'npm install && npm start',
      '4': 'Visit /api/nairobi for live data'
    },
    endpoints: {
      core: {
        nairobi_data: 'GET /api/nairobi',
        measurements: 'GET /api/measurements',
        hotspots: 'GET /api/hotspots',
        alerts: 'GET /api/alerts',
        dashboard: 'GET /api/dashboard'
      },
      ai_powered: {
        ai_analysis: 'GET /api/ai/analysis',
        smart_hotspots: 'GET /api/ai/hotspots'
      },
      utilities: {
        refresh_data: 'POST /api/refresh',
        location_data: 'GET /api/location?lat=-1.29&lon=36.82',
        test_apis: 'GET /api/test-apis',
        health: 'GET /health'
      }
    },
    data_sources: [
      'WeatherAPI.com (Premium air quality + weather)',
      'OpenAQ (Global air quality network)',
      'IQAir (Commercial air quality)',
      'WAQI (World Air Quality Index)'
    ],
    websocket: {
      endpoint: `ws://localhost:${process.env.PORT || 8000}`,
      events: ['data_update', 'ai_analysis_complete', 'data_refreshed']
    },
    setup_guide: '/setup',
    github: 'https://github.com/ngalo-coder/breathwise'
  });
});

// Setup guide endpoint
app.get('/setup', (req, res) => {
  res.json({
    title: 'UNEP Air Quality Platform - Quick Setup Guide',
    description: 'Get started in 5 minutes without database setup',
    requirements: {
      required: [
        'Node.js 18+',
        'WeatherAPI.com API key (free)'
      ],
      optional: [
        'OpenRouter API key (for AI features)',
        'OpenAQ API key (enhanced data)',
        'IQAir API key (premium data)',
        'WAQI token (additional coverage)'
      ]
    },
    steps: [
      {
        step: 1,
        title: 'Get WeatherAPI Key',
        description: 'Sign up at https://www.weatherapi.com/signup.aspx',
        details: 'Free tier includes 1 million calls/month + air quality data'
      },
      {
        step: 2,
        title: 'Configure Environment',
        command: 'cp .env.example .env',
        edit: 'Add WEATHERAPI_KEY=your_key_here'
      },
      {
        step: 3,
        title: 'Install Dependencies',
        command: 'npm install'
      },
      {
        step: 4,
        title: 'Start Server',
        command: 'npm start',
        note: 'Development mode: npm run dev'
      },
      {
        step: 5,
        title: 'Test Setup',
        test: 'curl http://localhost:8000/api/nairobi',
        verify: 'Should return live Nairobi air quality data'
      }
    ],
    optional_enhancements: {
      ai_features: {
        description: 'Add AI-powered analysis and recommendations',
        setup: 'Sign up at OpenRouter.ai and add OPENROUTER_API_KEY to .env',
        benefit: 'Enables intelligent analysis, early warnings, and policy recommendations'
      },
      enhanced_data: {
        description: 'Add more data sources for better coverage',
        apis: {
          openaq: 'Free registration at OpenAQ.org',
          iqair: 'Premium service at IQAir.com',
          waqi: 'Free token at waqi.info'
        }
      }
    },
    troubleshooting: {
      'No data returned': 'Check API keys in .env file',
      'CORS errors': 'Verify FRONTEND_URL in .env and allowedOrigins in app.js',
      'Timeout errors': 'Check internet connection and API status',
      'AI features not working': 'Verify OPENROUTER_API_KEY configuration'
    },
    support: {
      documentation: 'Full API docs at /',
      test_endpoint: '/api/test-apis',
      health_check: '/health',
      github_issues: 'https://github.com/ngalo-coder/breathwise/issues'
    }
  });
});

// Enhanced Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);

  socket.join('nairobi_dashboard');

  socket.emit('connection_status', {
    status: 'connected',
    message: 'Connected to UNEP Air Quality Platform (Simplified Mode)',
    timestamp: new Date().toISOString(),
    server_info: {
      version: '2.1.0-simplified',
      mode: 'direct_api',
      features: ['real_time_data', 'ai_analysis', 'smart_alerts'],
      database_required: false
    }
  });

  // Handle real-time data requests
  socket.on('request_data_update', async () => {
    try {
      const data = await directDataService.getNairobiData();
      socket.emit('data_update', {
        measurements_count: data.measurements.length,
        avg_pm25: data.summary.avg_pm25,
        air_quality_status: data.summary.air_quality_status,
        active_sources: data.data_sources.length,
        timestamp: data.timestamp
      });
    } catch (error) {
      socket.emit('error', { message: 'Failed to get data update' });
    }
  });

  // Handle cache refresh requests
  socket.on('request_refresh', async () => {
    try {
      directDataService.clearCache();
      socket.emit('refresh_complete', { 
        message: 'Cache cleared - next request will fetch fresh data',
        timestamp: new Date().toISOString() 
      });
    } catch (error) {
      socket.emit('error', { message: 'Failed to refresh cache' });
    }
  });

  socket.on('disconnect', (reason) => {
    console.log(`🔌 Client disconnected: ${socket.id}, reason: ${reason}`);
  });

  socket.on('error', (error) => {
    console.error('🔌 Socket error:', error);
  });
});

// Automatic data refresh every 15 minutes
setInterval(async () => {
  try {
    console.log('🔄 Automatic cache refresh...');
    directDataService.clearCache();

    // Fetch fresh data
    const freshData = await directDataService.getNairobiData();

    // Notify all connected clients
    io.to('nairobi_dashboard').emit('auto_refresh', {
      timestamp: freshData.timestamp,
      measurements_count: freshData.measurements.length,
      sources_active: freshData.data_sources.length,
      message: 'Data automatically refreshed'
    });

  } catch (error) {
    console.error('❌ Auto refresh error:', error);
  }
}, 15 * 60 * 1000); // 15 minutes

// Error handling middleware
app.use((err, req, res, next) => {
  const errorId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

  console.error('❌ Application Error:', {
    id: errorId,
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  const message = process.env.NODE_ENV === 'production' 
    ? 'Internal server error' 
    : err.message;

  res.status(err.status || 500).json({
    error: message,
    error_id: errorId,
    timestamp: new Date().toISOString(),
    path: req.path,
    mode: 'simplified'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
    available_routes: {
      core: ['/api/nairobi', '/api/measurements', '/api/hotspots', '/api/alerts'],
      ai: ['/api/ai/analysis', '/api/ai/hotspots'],
      utils: ['/api/dashboard', '/api/test-apis', '/health']
    },
    documentation: 'Visit / for full API documentation',
    setup_guide: '/setup',
    timestamp: new Date().toISOString()
  });
});

// Helper function for API recommendations
function generateAPIRecommendations(testResults) {
  const recommendations = [];

  if (!testResults.weatherapi) {
    recommendations.push({
      priority: 'high',
      message: 'WeatherAPI.com is required for air quality data',
      action: 'Get free API key at https://www.weatherapi.com/signup.aspx'
    });
  }

  if (!testResults.openaq && !testResults.iqair && !testResults.waqi) {
    recommendations.push({
      priority: 'medium',
      message: 'Consider adding additional data sources for better coverage',
      action: 'Register for OpenAQ (free) or other premium services'
    });
  }

  if (Object.values(testResults).every(result => result === false)) {
    recommendations.push({
      priority: 'critical',
      message: 'No working API connections found',
      action: 'Check internet connection and API key configurations'
    });
  }

  return recommendations;
}

const PORT = process.env.PORT || 8000;

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 UNEP Air Quality Platform (Simplified) running on port ${PORT}`);
  console.log(`📊 Mode: Direct API integration (no database required)`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌤️  WeatherAPI: ${process.env.WEATHERAPI_KEY ? '✅ Configured' : '❌ Required'}`);
  console.log(`🤖 AI Service: ${process.env.OPENROUTER_API_KEY ? '✅ Enabled' : '⚠️ Disabled'}`);
  console.log(`🗺️  Health check: http://localhost:${PORT}/health`);
  console.log(`📚 Setup guide: http://localhost:${PORT}/setup`);
  console.log(`🧪 Test APIs: http://localhost:${PORT}/api/test-apis`);
  console.log(`📡 Live data: http://localhost:${PORT}/api/nairobi`);
  console.log(`⚡ Ready for hackathon deployment!`);
});

// Graceful shutdown
const gracefulShutdown = (signal) => {
  console.log(`\n🛑 Received ${signal}, shutting down gracefully...`);

  server.close(() => {
    console.log('🛑 HTTP server closed');

    io.close(() => {
      console.log('🛑 WebSocket server closed');
      console.log('🛑 Process terminated');
      process.exit(0);
    });
  });

  setTimeout(() => {
    console.error('🚨 Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Export io for use in services
export { io };