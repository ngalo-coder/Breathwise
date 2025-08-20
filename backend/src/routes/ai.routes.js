// backend/src/routes/ai.routes.js
// AI-powered routes for enhanced air quality analysis

import express from 'express';
import { 
  getAIAnalysis,
  getSmartHotspots,
  getEarlyWarnings,
  getPolicyEffectiveness,
  getAIDashboard
} from '../controllers/aiEnhancedAir.controller.js';

const router = express.Router();

// 🤖 AI-powered comprehensive analysis
router.get('/analysis', getAIAnalysis);

// 🎯 Smart hotspot detection with ML
router.get('/hotspots/smart', getSmartHotspots);

// 🚨 Intelligent early warning system
router.get('/warnings', getEarlyWarnings);

// 📊 Policy effectiveness analysis
router.get('/policy/effectiveness', getPolicyEffectiveness);

// 🌟 AI-powered dashboard
router.get('/dashboard', getAIDashboard);

export default router;