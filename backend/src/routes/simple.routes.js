/**
 * @swagger
 * components:
 *   schemas:
 *     CityData:
 *       type: object
 *       properties:
 *         timestamp:
 *           type: string
 *           format: date-time
 *         location:
 *           type: string
 *         coordinates:
 *           type: object
 *           properties:
 *             lat:
 *               type: number
 *             lon:
 *               type: number
 *         measurements:
 *           type: array
 *           items:
 *             type: object
 *         summary:
 *           type: object
 *         hotspots:
 *           type: array
 *           items:
 *             type: object
 *         alerts:
 *           type: array
 *           items:
 *             type: object
 *         data_sources:
 *           type: array
 *           items:
 *             type: string
 *         health_advisory:
 *           type: object
 *         metadata:
 *           type: object
 *           properties:
 *             api_sources:
 *               type: array
 *               items:
 *                 type: string
 *             cache_used:
 *               type: boolean
 *             processing_time:
 *               type: string
 *             next_update:
 *               type: string
 *               format: date-time
 */

import express from 'express';
import { param } from 'express-validator';
import rateLimit from 'express-rate-limit';
import {
  getCityData,
  getMeasurements,
  getHotspots,
  getAlerts,
  getAIAnalysis,
  getSmartHotspots,
  getDashboard,
  refreshData,
  getLocationData
} from '../controllers/simple.controller.js';

/**
 * @swagger
 * tags:
 *   name: Air Quality
 *   description: Air quality data endpoints
 */
const router = express.Router();

// Rate limiting for resource-intensive operations
const analysisLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many analysis requests from this IP, please try again after 15 minutes'
});

// Input validation
const validateCity = [
  param('city')
    .isAlpha('en-US', {ignore: ' -'})
    .withMessage('City name can only contain letters, spaces, and hyphens')
    .isLength({ min: 2, max: 50 })
    .withMessage('City name must be between 2-50 characters')
];

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     tags: [Air Quality]
 *     responses:
 *       200:
 *         description: API is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 service:
 *                   type: string
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    service: 'Air Quality API',
    timestamp: new Date().toISOString()
  });
});

/**
 * @swagger
 * /geo/location:
 *   get:
 *     summary: Get data for specific coordinates
 *     tags: [Air Quality]
 *     parameters:
 *       - in: query
 *         name: lat
 *         required: true
 *         schema:
 *           type: number
 *         description: Latitude
 *       - in: query
 *         name: lon
 *         required: true
 *         schema:
 *           type: number
 *         description: Longitude
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: Location name
 *     responses:
 *       200:
 *         description: Location data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
router.get('/geo/location', getLocationData);

/**
 * @swagger
 * /{city}:
 *   get:
 *     summary: Get comprehensive city air quality data
 *     tags: [Air Quality]
 *     parameters:
 *       - in: path
 *         name: city
 *         required: true
 *         schema:
 *           type: string
 *         description: City name
 *     responses:
 *       200:
 *         description: Comprehensive city data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CityData'
 */
router.get('/:city', validateCity, getCityData);

// Other route annotations...

export default router;