/**
 * @swagger
 * tags:
 *   name: Air Quality
 *   description: Air quality data endpoints
 */
import express from 'express';
import {
  getHotspots,
  getMeasurements,
  getNairobiZones,
  triggerAnalysis
} from '../controllers/air.controller.js';

/**
 * @swagger
 * /hotspots:
 *   get:
 *     summary: Get pollution hotspots
 *     tags: [Air Quality]
 *     responses:
 *       200:
 *         description: Hotspots data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
const router = express.Router();

// Air quality data routes
router.get('/hotspots', getHotspots);           // Get pollution hotspots

/**
 * @swagger
 * /measurements:
 *   get:
 *     summary: Get air quality measurements
 *     tags: [Air Quality]
 *     responses:
 *       200:
 *         description: Measurements data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
router.get('/measurements', getMeasurements);   // Get air quality measurements

/**
 * @swagger
 * /nairobi-zones:
 *   get:
 *     summary: Get Nairobi monitoring zones
 *     tags: [Air Quality]
 *     responses:
 *       200:
 *         description: Nairobi zones data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
router.get('/nairobi-zones', getNairobiZones);  // Get Nairobi monitoring zones

/**
 * @swagger
 * /analyze:
 *   post:
 *     summary: Trigger hotspot analysis
 *     tags: [Air Quality]
 *     responses:
 *       200:
 *         description: Analysis initiated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
router.post('/analyze', triggerAnalysis);       // Trigger hotspot analysis

export default router;