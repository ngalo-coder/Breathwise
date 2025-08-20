// backend/src/routes/simple.routes.js
// Simplified routes that work without database

import express from 'express';
import {
  getNairobiData,
  getMeasurements,
  getHotspots,
  getAlerts,
  getAIAnalysis,
  getSmartHotspots,
  getDashboard,
  refreshData,
  getLocationData
} from '../controllers/simple.controller.js';

const router = express.Router();

// 🌍 Core air quality endpoints
router.get('/nairobi', getNairobiData);                    // Complete Nairobi data
router.get('/measurements', getMeasurements);              // Air quality measurements
router.get('/hotspots', getHotspots);                     // Pollution hotspots
router.get('/alerts', getAlerts);                         // Active alerts

// 🤖 AI-powered endpoints  
router.get('/ai/analysis', getAIAnalysis);                // AI analysis
router.get('/ai/hotspots', getSmartHotspots);            // Smart hotspot detection

// 📊 Dashboard and utilities
router.get('/dashboard', getDashboard);                   // Comprehensive dashboard
router.post('/refresh', refreshData);                     // Manual data refresh
router.get('/location', getLocationData);                 // Specific location data

export default router;