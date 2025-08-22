// backend/src/app.js
// Simplified app without database dependencies

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createServer } from 'http';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import { initWebSocket } from './websocket/realtime.js';

let io;

// Import simplified routes
import rootRoutes from './routes/root.routes.js';
import apiRoutes from './routes/index.js';
import { getHealth } from './controllers/utility.controller.js';
// Using CommonJS require for swaggerSpec
// Using ES module import syntax consistently
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './config/swagger.js';

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);

// --- CORS ORIGIN SETUP FOR MULTIPLE ENVIRONMENTS ---
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5173', // <-- Add this line
  'https://unep-air-quality.vercel.app',
  'https://breathwise.vercel.app',
  'https://unep-air-quality-platform.netlify.app',
  process.env.FRONTEND_URL
].filter(Boolean);

io = initWebSocket(server, allowedOrigins);

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

// Swagger documentation route
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { explorer: true }));

app.get('/health', getHealth);

// API Routes - All data comes directly from APIs
app.use('/api', apiRoutes);
app.use('/', rootRoutes);

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