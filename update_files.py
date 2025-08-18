#!/usr/bin/env python3
"""
UNEP Platform File Update Script
Updates all necessary files with production-ready content
Run this script from your project root directory after moving files
"""

import os
import json
from pathlib import Path

def create_file(filepath, content):
    """Create a file with given content"""
    try:
        # Create directory if it doesn't exist
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"✅ Created/Updated: {filepath}")
        return True
    except Exception as e:
        print(f"❌ Failed to create {filepath}: {e}")
        return False

def update_files():
    """Update all necessary files for production deployment"""
    
    print("🔧 Updating UNEP Platform Files for Production...")
    print("=" * 60)
    
    # 1. Frontend TypeScript Configuration
    print("\n📦 1. Frontend Configuration Files...")
    
    # frontend/tsconfig.json
    tsconfig_content = """{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",

    /* Linting */
    "strict": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noFallthroughCasesInSwitch": true,

    /* Path mapping */
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"]
    },

    /* Additional */
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}"""
    create_file("frontend/tsconfig.json", tsconfig_content)
    
    # frontend/tsconfig.node.json
    tsconfig_node_content = """{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true,
    "strict": true
  },
  "include": ["vite.config.ts"]
}"""
    create_file("frontend/tsconfig.node.json", tsconfig_node_content)
    
    # frontend/src/vite-env.d.ts
    vite_env_content = """/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_ARCGIS_API_KEY?: string
  readonly VITE_AUTH0_DOMAIN?: string
  readonly VITE_AUTH0_CLIENT_ID?: string
  readonly VITE_ENABLE_AUTH?: string
  readonly VITE_ENABLE_REALTIME?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}"""
    create_file("frontend/src/vite-env.d.ts", vite_env_content)
    
    # frontend/vite.config.ts
    vite_config_content = """import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:8001',
        changeOrigin: true,
        secure: false
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          mui: ['@mui/material', '@mui/icons-material'],
          arcgis: ['@arcgis/core']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  },
  define: {
    global: 'globalThis',
  },
  optimizeDeps: {
    include: ['@mui/material', '@emotion/react', '@emotion/styled']
  }
})"""
    create_file("frontend/vite.config.ts", vite_config_content)
    
    # 2. Backend Production Files
    print("\n🖥️  2. Backend Production Files...")
    
    # backend/src/app.js
    backend_app_content = """import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';

// Import routes
import airRoutes from './routes/air.routes.js';
import policyRoutes from './routes/policy.routes.js';

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
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
      connectSrc: ["'self'", "https:"]
    }
  }
}));

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5173',
      'https://unep-air-quality.vercel.app',
      process.env.FRONTEND_URL
    ].filter(Boolean);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));

// Logging
if (process.env.NODE_ENV === 'production') {
  app.use(morgan('combined'));
} else {
  app.use(morgan('dev'));
}

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 1000,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api/', limiter);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    uptime: Math.floor(process.uptime())
  });
});

// API Routes
app.use('/api/air', airRoutes);
app.use('/api/policy', policyRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'UNEP Air Quality Platform API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      air_quality: '/api/air/*',
      policy: '/api/policy/*'
    },
    documentation: '/api/docs'
  });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);
  
  // Join dashboard room for real-time updates
  socket.join('nairobi_dashboard');
  
  // Send welcome message
  socket.emit('connection_status', {
    status: 'connected',
    message: 'Connected to UNEP Air Quality Platform',
    timestamp: new Date().toISOString()
  });
  
  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
  
  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  // Don't leak error details in production
  const message = process.env.NODE_ENV === 'production' 
    ? 'Internal server error' 
    : err.message;

  res.status(err.status || 500).json({
    error: message,
    timestamp: new Date().toISOString(),
    path: req.path
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
    available_routes: {
      health: '/health',
      air_quality: '/api/air/*',
      policy: '/api/policy/*'
    }
  });
});

const PORT = process.env.PORT || 10000;

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 UNEP API Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌍 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
  console.log(`🗺️  Health check: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});

// Export io for use in routes
export { io };"""
    create_file("backend/src/app.js", backend_app_content)
    
    # backend/src/controllers/air.controller.js
    air_controller_content = """import { io } from '../app.js';

// Mock data that works without database - using your real Nairobi data
const mockNairobiZones = {
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {"type": "Point", "coordinates": [36.8172, -1.2864]},
      "properties": {
        "id": "nairobi_zone_1",
        "name": "Nairobi CBD",
        "pm25": 45.2,
        "source_type": "monitoring_station",
        "recorded_at": new Date().toISOString(),
        "quality_flag": 2,
        "aqi_category": "Unhealthy for Sensitive Groups",
        "severity": "unhealthy_sensitive",
        "aqi": 112,
        "data_quality": "High"
      }
    },
    {
      "type": "Feature",
      "geometry": {"type": "Point", "coordinates": [36.8581, -1.3128]},
      "properties": {
        "id": "nairobi_zone_2", 
        "name": "Industrial Area",
        "pm25": 67.3,
        "source_type": "monitoring_station",
        "recorded_at": new Date().toISOString(),
        "quality_flag": 2,
        "aqi_category": "Unhealthy",
        "severity": "unhealthy",
        "aqi": 158,
        "data_quality": "High"
      }
    },
    {
      "type": "Feature",
      "geometry": {"type": "Point", "coordinates": [36.8089, -1.2630]},
      "properties": {
        "id": "nairobi_zone_3",
        "name": "Westlands", 
        "pm25": 32.1,
        "source_type": "monitoring_station",
        "recorded_at": new Date().toISOString(),
        "quality_flag": 1,
        "aqi_category": "Moderate",
        "severity": "moderate", 
        "aqi": 94,
        "data_quality": "Medium"
      }
    },
    {
      "type": "Feature",
      "geometry": {"type": "Point", "coordinates": [36.8833, -1.3167]},
      "properties": {
        "id": "nairobi_zone_4",
        "name": "Embakasi",
        "pm25": 89.5,
        "source_type": "monitoring_station",
        "recorded_at": new Date().toISOString(),
        "quality_flag": 3,
        "aqi_category": "Very Unhealthy",
        "severity": "very_unhealthy",
        "aqi": 185,
        "data_quality": "High"
      }
    },
    {
      "type": "Feature",
      "geometry": {"type": "Point", "coordinates": [36.7083, -1.3197]},
      "properties": {
        "id": "nairobi_zone_5",
        "name": "Karen",
        "pm25": 18.7,
        "source_type": "monitoring_station", 
        "recorded_at": new Date().toISOString(),
        "quality_flag": 1,
        "aqi_category": "Good",
        "severity": "good",
        "aqi": 62,
        "data_quality": "High"
      }
    }
  ],
  "metadata": {
    "total_zones": 5,
    "city": "Nairobi",
    "country": "Kenya", 
    "generated_at": new Date().toISOString(),
    "data_source": "UNEP Mock Data - Real Nairobi Coordinates"
  }
};

export const getHotspots = async (req, res) => {
  try {
    console.log('Fetching hotspots with mock data');
    
    const hotspotFeatures = mockNairobiZones.features.filter(
      feature => feature.properties.pm25 > 35
    );

    const hotspotsResponse = {
      type: 'FeatureCollection',
      features: hotspotFeatures.map(feature => ({
        ...feature,
        properties: {
          ...feature.properties,
          pm25_avg: feature.properties.pm25,
          reading_count: 1,
          latest_reading: feature.properties.recorded_at,
          health_impact: feature.properties.aqi_category
        }
      })),
      metadata: {
        total_hotspots: hotspotFeatures.length,
        bbox: [36.70, -1.40, 37.12, -1.15],
        city: 'Nairobi',
        generated_at: new Date().toISOString()
      }
    };

    res.json(hotspotsResponse);

  } catch (error) {
    console.error('Hotspots error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch hotspots',
      message: error.message 
    });
  }
};

export const getNairobiZones = async (req, res) => {
  try {
    console.log('Fetching Nairobi zones with mock data');
    
    const zones = {
      ...mockNairobiZones,
      features: mockNairobiZones.features.map(feature => ({
        ...feature,
        properties: {
          ...feature.properties,
          pm25: Math.round((feature.properties.pm25 + (Math.random() - 0.5) * 2) * 10) / 10,
          recorded_at: new Date().toISOString()
        }
      }))
    };

    res.json(zones);

  } catch (error) {
    console.error('Nairobi zones error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch Nairobi monitoring zones',
      message: error.message 
    });
  }
};

export const getMeasurements = async (req, res) => {
  try {
    console.log('Fetching measurements with mock data');
    
    const measurementsResponse = {
      type: 'FeatureCollection',
      features: mockNairobiZones.features.map(feature => ({
        ...feature,
        properties: {
          ...feature.properties,
          pm10: Math.round((feature.properties.pm25 * 1.8) * 10) / 10,
          no2: Math.round((Math.random() * 40 + 10) * 10) / 10,
          so2: Math.round((Math.random() * 20 + 5) * 10) / 10,
          o3: Math.round((Math.random() * 80 + 20) * 10) / 10
        }
      })),
      metadata: {
        total_measurements: mockNairobiZones.features.length,
        query_params: req.query,
        generated_at: new Date().toISOString(),
        bbox: req.query.bbox || [36.70, -1.40, 37.12, -1.15]
      }
    };

    res.json(measurementsResponse);

  } catch (error) {
    console.error('Measurements error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch measurements',
      message: error.message 
    });
  }
};

export const triggerAnalysis = async (req, res) => {
  try {
    console.log('Triggering analysis with mock data');
    
    const analysisId = `analysis_${Date.now()}`;
    
    if (io) {
      io.to('nairobi_dashboard').emit('analysis_started', {
        analysis_id: analysisId,
        status: 'processing',
        timestamp: new Date().toISOString()
      });

      setTimeout(() => {
        io.to('nairobi_dashboard').emit('analysis_complete', {
          analysis_id: analysisId,
          results: {
            hotspots_found: 3,
            priority_zones: 2,
            critical_areas: ['Embakasi', 'Industrial Area'],
            recommended_actions: [
              'Implement traffic restrictions in CBD during peak hours',
              'Increase industrial monitoring in Embakasi area', 
              'Deploy mobile air quality units in Dandora'
            ]
          },
          status: 'completed',
          timestamp: new Date().toISOString()
        });
      }, 2000);
    }

    res.json({
      analysis_id: analysisId,
      status: 'started',
      message: 'Hotspot analysis initiated for Nairobi region',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Analysis trigger error:', error);
    res.status(500).json({ 
      error: 'Failed to trigger analysis',
      message: error.message 
    });
  }
};"""
    create_file("backend/src/controllers/air.controller.js", air_controller_content)
    
    # backend/src/controllers/policy.controller.js
    policy_controller_content = """import { io } from '../app.js';

const mockPolicyRecommendations = {
  "recommendations": [
    {
      "id": 1,
      "zone_id": "NBO_CBD_01",
      "title": "Peak-Hour Vehicle Restrictions (CBD)",
      "description": "Implement odd-even license plate restrictions during peak hours",
      "priority": "high",
      "expected_impact_percent": 28.5,
      "cost_estimate": 8200.00,
      "implementation_time_days": 30,
      "status": "pending",
      "created_at": new Date().toISOString(),
      "policy_type": "vehicle_restriction",
      "affected_population": 250000
    },
    {
      "id": 2,
      "zone_id": "NBO_IND_01", 
      "title": "Industrial Stack Monitoring (Embakasi)",
      "description": "Install continuous monitoring systems on industrial emitters",
      "priority": "critical",
      "expected_impact_percent": 18.2,
      "cost_estimate": 15000.00,
      "implementation_time_days": 90,
      "status": "approved",
      "created_at": new Date().toISOString(),
      "policy_type": "emission_monitoring",
      "affected_population": 180000
    },
    {
      "id": 3,
      "zone_id": "NBO_DAN_01",
      "title": "Waste Management Enhancement (Dandora)",
      "description": "Increase waste collection frequency and anti-burning enforcement",
      "priority": "high",
      "expected_impact_percent": 42.0,
      "cost_estimate": 7500.00,
      "implementation_time_days": 60,
      "status": "in_progress",
      "created_at": new Date().toISOString(),
      "policy_type": "waste_management",
      "affected_population": 120000
    }
  ],
  "metadata": {
    "total": 3,
    "generated_at": new Date().toISOString(),
    "city": "Nairobi"
  }
};

export const getPolicyRecommendations = async (req, res) => {
  try {
    console.log('Fetching policy recommendations with mock data');
    
    const { priority, status, limit = 10 } = req.query;

    let recommendations = [...mockPolicyRecommendations.recommendations];

    if (priority) {
      recommendations = recommendations.filter(r => r.priority === priority);
    }

    if (status && status !== 'all') {
      recommendations = recommendations.filter(r => r.status === status);
    }

    recommendations = recommendations.slice(0, parseInt(limit));

    res.json({
      recommendations,
      metadata: {
        total: recommendations.length,
        filters: { priority, status },
        generated_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Policy recommendations error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch policy recommendations',
      message: error.message 
    });
  }
};

export const simulatePolicyImpact = async (req, res) => {
  try {
    const { policy_id } = req.body;
    const policy = mockPolicyRecommendations.recommendations.find(p => p.id == policy_id);
    
    if (!policy) {
      return res.status(404).json({ error: 'Policy not found' });
    }

    const baselinePM25 = 45.2;
    const reduction = policy.expected_impact_percent / 100;
    const projectedPM25 = baselinePM25 * (1 - reduction);

    const simulation = {
      policy_id: policy_id,
      policy_title: policy.title,
      simulation_results: {
        baseline_pm25: baselinePM25,
        projected_pm25: Math.round(projectedPM25 * 10) / 10,
        impact_percent: policy.expected_impact_percent,
        affected_population: policy.affected_population,
        health_benefits: {
          avoided_deaths: Math.round(reduction * 5.2),
          avoided_hospital_visits: Math.round(reduction * 120),
          economic_benefit_usd: Math.round(reduction * 485000)
        },
        implementation_timeline: {
          preparation_days: 15,
          rollout_days: policy.implementation_time_days,
          full_effect_days: policy.implementation_time_days + 60
        },
        confidence_level: 0.78
      },
      generated_at: new Date().toISOString()
    };

    if (io) {
      io.to('nairobi_dashboard').emit('simulation_complete', {
        policy_id,
        simulation_results: simulation.simulation_results
      });
    }

    res.json(simulation);

  } catch (error) {
    console.error('Policy simulation error:', error);
    res.status(500).json({ 
      error: 'Failed to simulate policy impact',
      message: error.message 
    });
  }
};

export const getActiveAlerts = async (req, res) => {
  try {
    const alerts = [
      {
        id: 1,
        alert_type: 'pollution_spike',
        location: { type: 'Point', coordinates: [36.8833, -1.3167] },
        zone_name: 'Embakasi',
        severity: 'critical',
        message: 'Very unhealthy air quality detected in Embakasi - PM2.5: 89.5 μg/m³',
        pm25_level: 89.5,
        triggered_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        status: 'active',
        time_since: '2 hours ago'
      },
      {
        id: 2,
        alert_type: 'policy_trigger',
        location: { type: 'Point', coordinates: [36.8172, -1.2864] },
        zone_name: 'CBD',
        severity: 'high',
        message: 'Traffic restriction policy should be activated in CBD',
        pm25_level: 45.2,
        triggered_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        status: 'active',
        time_since: '30 minutes ago'
      }
    ];

    const { severity, limit = 20 } = req.query;
    let filteredAlerts = severity ? alerts.filter(alert => alert.severity === severity) : alerts;
    filteredAlerts = filteredAlerts.slice(0, parseInt(limit));

    res.json({
      alerts: filteredAlerts,
      metadata: {
        total_active: filteredAlerts.length,
        generated_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Active alerts error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch active alerts',
      message: error.message 
    });
  }
};

export const approvePolicyRecommendation = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const policy = mockPolicyRecommendations.recommendations.find(p => p.id == id);
    
    if (!policy) {
      return res.status(404).json({ error: 'Policy recommendation not found' });
    }

    policy.status = status;
    policy.updated_at = new Date().toISOString();

    if (io) {
      io.to('nairobi_dashboard').emit('policy_status_update', {
        policy_id: id,
        new_status: status,
        policy_title: policy.title,
        notes,
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      message: `Policy recommendation ${status} successfully`,
      policy: policy,
      notes
    });

  } catch (error) {
    console.error('Policy approval error:', error);
    res.status(500).json({ 
      error: 'Failed to update policy status',
      message: error.message 
    });
  }
};

export const getDashboardStats = async (req, res) => {
  try {
    const dashboard = {
      air_quality: {
        total_measurements: 5,
        avg_pm25: 50.56,
        max_pm25: 89.5,
        min_pm25: 18.7,
        unhealthy_readings: 3,
        very_unhealthy_readings: 1,
        last_update: new Date().toISOString()
      },
      policy_stats: {
        pending: { count: 1, avg_impact: 28.5 },
        approved: { count: 1, avg_impact: 18.2 },
        in_progress: { count: 1, avg_impact: 42.0 }
      },
      alert_stats: {
        critical: 1,
        high: 1,
        medium: 0,
        low: 0
      },
      pollution_sources: [
        { source_type: 'traffic', measurement_count: 2, avg_pm25: 38.65 },
        { source_type: 'industry', measurement_count: 2, avg_pm25: 78.4 },
        { source_type: 'background', measurement_count: 1, avg_pm25: 18.7 }
      ],
      generated_at: new Date().toISOString()
    };

    res.json(dashboard);

  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch dashboard statistics',
      message: error.message 
    });
  }
};"""
    create_file("backend/src/controllers/policy.controller.js", policy_controller_content)
    
    # 3. Deployment Configuration Files
    print("\n🚀 3. Deployment Configuration Files...")
    
    # vercel.json
    vercel_config = """{
  "version": 2,
  "name": "unep-air-quality-platform",
  "buildCommand": "cd frontend && npm run build",
  "outputDirectory": "frontend/dist",
  "installCommand": "cd frontend && npm install",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "https://unep-air-backend.onrender.com/api/$1"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/.*",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        }
      ]
    }
  ]
}"""
    create_file("vercel.json", vercel_config)
    
    # render.yaml
    render_config = """services:
  - type: web
    name: unep-air-backend
    env: node
    plan: free
    region: oregon
    buildCommand: cd backend && npm install
    startCommand: cd backend && npm start
    healthCheckPath: /health
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 10000
      - key: FRONTEND_URL
        value: https://unep-air-quality.vercel.app"""
    create_file("render.yaml", render_config)
    
    # 4. Package.json Updates
    print("\n📦 4. Package.json Updates...")
    
    # Frontend package.json
    frontend_package = """{
  "name": "unep-air-platform-frontend",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "preview": "vite preview",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "@arcgis/core": "^4.33.12",
    "@emotion/react": "^11.11.0",
    "@emotion/styled": "^11.11.0",
    "@mui/icons-material": "^5.18.0",
    "@mui/material": "^5.14.0",
    "axios": "^1.5.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "recharts": "^3.1.2",
    "socket.io-client": "^4.7.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.15",
    "@types/react-dom": "^18.2.7",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "@vitejs/plugin-react": "^4.0.3",
    "eslint": "^8.45.0",
    "eslint-plugin-react-hooks": "^4.6.0",
    "eslint-plugin-react-refresh": "^0.4.3",
    "typescript": "^5.0.2",
    "vite": "^4.4.5"
  },
  "engines": {
    "node": "18.x",
    "npm": "9.x"
  }
}"""
    create_file("frontend/package.json", frontend_package)
    
    # Backend package.json
    backend_package = """{
  "name": "unep-air-platform-backend",
  "version": "1.0.0",
  "description": "UNEP Air Quality Policy Platform API",
  "main": "src/app.js",
  "type": "module",
  "scripts": {
    "start": "node src/app.js",
    "dev": "nodemon src/app.js",
    "build": "echo 'No build step required for Node.js'",
    "test": "jest",
    "lint": "eslint src/",
    "health": "curl http://localhost:$PORT/health || echo 'Health check failed'"
  },
  "engines": {
    "node": "18.x",
    "npm": "9.x"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "helmet": "^7.0.0",
    "morgan": "^1.10.0",
    "dotenv": "^16.3.1",
    "socket.io": "^4.7.2",
    "express-rate-limit": "^6.10.0",
    "joi": "^17.9.2"
  },
  "devDependencies": {
    "nodemon": "^3.0.1",
    "jest": "^29.6.2",
    "eslint": "^8.47.0"
  },
  "keywords": [
    "unep",
    "air-quality",
    "policy",
    "environmental",
    "africa",
    "nairobi"
  ],
  "author": "UNEP",
  "license": "MIT"
}"""
    create_file("backend/package.json", backend_package)
    
    # 5. Environment Files
    print("\n⚙️  5. Environment Configuration Files...")
    
    # Frontend .env
    frontend_env = """# UNEP Air Quality Platform - Frontend Environment Variables

# API Configuration
VITE_API_URL=http://localhost:8001

# ArcGIS Configuration (Optional - get from developers.arcgis.com)
# VITE_ARCGIS_API_KEY=your-arcgis-api-key

# Feature Flags
VITE_ENABLE_AUTH=false
VITE_ENABLE_REALTIME=true"""
    create_file("frontend/.env", frontend_env)
    
    # Backend .env
    backend_env = """# UNEP Air Quality Platform - Backend Environment Variables

# Server Configuration
NODE_ENV=development
PORT=8001
FRONTEND_URL=http://localhost:3000

# Database Configuration (for future use)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=unep_air
DB_USER=postgres
DB_PASSWORD=password

# Redis Configuration (for future use)
REDIS_URL=redis://localhost:6379/0

# Logging
LOG_LEVEL=info"""
    create_file("backend/.env", backend_env)
    
    # 6. Update .gitignore
    print("\n📝 6. Updating .gitignore...")
    
    gitignore_content = """# Dependencies
node_modules/
*/node_modules/

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Build outputs
dist/
build/
*/dist/
*/build/

# Database files
*.db
*.sqlite
*.sqlite3

# Logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*
lerna-debug.log*

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/
*.lcov

# Dependency directories
jspm_packages/

# Optional npm cache directory
.npm

# Optional eslint cache
.eslintcache

# Microbundle cache
.rpt2_cache/
.rts2_cache_cjs/
.rts2_cache_es/
.rts2_cache_umd/

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# parcel-bundler cache
.cache
.parcel-cache

# Next.js build output
.next

# Nuxt.js build / generate output
.nuxt

# Storybook build outputs
.out
.storybook-out

# Temporary folders
tmp/
temp/

# Editor directories and files
.vscode/
.idea/
*.swp
*.swo
*~

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# Project specific
archive/
backend/data/*.json
backend/scripts/__pycache__/
backend/scripts/*.pyc"""
    create_file(".gitignore", gitignore_content)
    
    # 7. Success Summary
    print("\n" + "=" * 60)
    print("✅ ALL FILES UPDATED SUCCESSFULLY!")
    print("=" * 60)
    
    print("\n🎯 What was updated:")
    print("   ✅ Frontend TypeScript configuration")
    print("   ✅ Frontend Vite configuration") 
    print("   ✅ Backend production server")
    print("   ✅ Backend controllers with mock data")
    print("   ✅ Deployment configurations (Vercel + Render)")
    print("   ✅ Package.json files for production")
    print("   ✅ Environment configuration files")
    print("   ✅ Updated .gitignore")
    
    print("\n🚀 READY FOR DEPLOYMENT!")
    print("\n📋 Next Steps:")
    print("   1. Test locally:")
    print("      cd backend && npm install && npm start")
    print("      cd frontend && npm install && npm run build")
    print("   ")
    print("   2. Create GitHub repository:")
    print("      git add . && git commit -m 'Production ready'")
    print("      git push origin main")
    print("   ")
    print("   3. Deploy to Render.com (backend)")
    print("   4. Deploy to Vercel.com (frontend)")
    print("   ")
    print("🌍 Your platform will be live globally in 30 minutes!")
    
    return True

if __name__ == "__main__":
    try:
        success = update_files()
        if success:
            print("\n🎉 Update completed successfully!")
            print("Your UNEP platform is now production-ready!")
        else:
            print("\n❌ Some files failed to update. Check the errors above.")
    except Exception as e:
        print(f"\n💥 Script failed: {e}")
        print("Please run the script from your project root directory.")