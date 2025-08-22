/**
 * @swagger
 * tags:
 *   name: AI Analysis
 *   description: AI-powered analysis endpoints
 */
import express from 'express';
import {
  getAIAnalysis,
  getSmartHotspots  
} from '../controllers/ai.controller.js';

import rateLimit from 'express-rate-limit';

// Rate limiting for AI endpoints (more expensive operations)
const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs
  message: {
    error: 'Too many AI requests',
    message: 'Please try again after 15 minutes'
  }
});

const router = express.Router();

/**
 * @swagger
 * /{city}/analysis:
 *   get:
 *     summary: Get AI analysis for a city
 *     tags: [AI Analysis]
 *     parameters:
 *       - in: path
 *         name: city
 *         required: true
 *         schema:
 *           type: string
 *         description: City name
 *     responses:
 *       200:
 *         description: AI analysis data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
router.get('/:city/analysis', aiLimiter, getAIAnalysis);

/**
 * @swagger
 * /{city}/smart-hotspots:
 *   get:
 *     summary: Get smart hotspots for a city
 *     tags: [AI Analysis]
 *     parameters:
 *       - in: path
 *         name: city
 *         required: true
 *         schema:
 *           type: string
 *         description: City name
 *     responses:
 *       200:
 *         description: Smart hotspots data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
router.get('/:city/smart-hotspots', aiLimiter, getSmartHotspots);

// Other routes with Swagger annotations...

// router.get('/:city/early-warnings', aiLimiter, getEarlyWarnings);
// router.get('/:city/policy-analysis', aiLimiter, getPolicyAnalysis);
// router.get('/:city/recommendations', aiLimiter, getRecommendations);

export default router;