import express from 'express';
import {
  getAIAnalysis,
  getSmartHotspots
} from '../controllers/ai.controller.js';
import rateLimit from 'express-rate-limit';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: AI Analysis
 *   description: AI-powered analysis and smart data endpoints. These endpoints are computationally intensive and have stricter rate limits.
 */

// Rate limiting for AI endpoints
const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: {
    error: 'Too many AI requests',
    message: 'Please try again after 15 minutes'
  }
});

/**
 * @swagger
 * /api/ai/{city}/analysis:
 *   get:
 *     summary: Get AI-powered analysis for a city
 *     tags: [AI Analysis]
 *     description: Generates a comprehensive AI analysis for the specified city, including risk assessment, key findings, trend analysis, and health impact predictions.
 *     parameters:
 *       - in: path
 *         name: city
 *         required: true
 *         schema:
 *           type: string
 *           default: Nairobi
 *         description: The name of the city.
 *       - in: query
 *         name: analysis_depth
 *         schema:
 *           type: string
 *           enum: [standard, comprehensive]
 *           default: standard
 *         description: The depth of the AI analysis.
 *     responses:
 *       200:
 *         description: A JSON object containing the AI analysis.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AIAnalysis'
 *       500:
 *         description: Error generating AI analysis.
 */
router.get('/:city/analysis', aiLimiter, getAIAnalysis);

/**
 * @swagger
 * /api/ai/{city}/smart-hotspots:
 *   get:
 *     summary: Get AI-detected smart hotspots for a city
 *     tags: [AI Analysis]
 *     description: Identifies and returns smart pollution hotspots for a city using AI clustering algorithms. Provides richer data than standard hotspots, including confidence scores and source attribution.
 *     parameters:
 *       - in: path
 *         name: city
 *         required: true
 *         schema:
 *           type: string
 *           default: Nairobi
 *         description: The name of the city.
 *       - in: query
 *         name: algorithm
 *         schema:
 *           type: string
 *           enum: [dbscan, kmeans]
 *           default: dbscan
 *         description: The clustering algorithm to use for hotspot detection.
 *     responses:
 *       200:
 *         description: A GeoJSON FeatureCollection of smart hotspots.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SmartHotspots'
 *       500:
 *         description: Error detecting smart hotspots.
 */
router.get('/:city/smart-hotspots', aiLimiter, getSmartHotspots);

export default router;