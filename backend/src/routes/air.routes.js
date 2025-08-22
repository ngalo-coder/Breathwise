import express from 'express';
import { param } from 'express-validator';
import {
  getCityData,
  getMeasurements,
  getHotspots,
  getAlerts,
  getDashboard,
  refreshData,
  getLocationData,
  getNairobiZones,
  triggerAnalysis
} from '../controllers/air.controller.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Air Quality
 *   description: Core endpoints for retrieving air quality data.
 */

// Input validation
const validateCity = [
  param('city')
    .isAlpha('en-US', { ignore: ' -' })
    .withMessage('City name can only contain letters, spaces, and hyphens')
    .isLength({ min: 2, max: 50 })
    .withMessage('City name must be between 2-50 characters')
];

/**
 * @swagger
 * /api/{city}:
 *   get:
 *     summary: Get comprehensive data for a city
 *     tags: [Air Quality]
 *     description: Retrieves a complete air quality dataset for a specified city, including measurements, summary, hotspots, alerts, and health advisories.
 *     parameters:
 *       - in: path
 *         name: city
 *         required: true
 *         schema:
 *           type: string
 *           default: Nairobi
 *         description: The name of the city.
 *     responses:
 *       200:
 *         description: A comprehensive city data object.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CityData'
 */
router.get('/:city', validateCity, getCityData);

/**
 * @swagger
 * /api/measurements:
 *   get:
 *     summary: Get air quality measurements
 *     tags: [Air Quality]
 *     description: Returns a GeoJSON FeatureCollection of all air quality measurement points. Supports filtering by bounding box and pollutants.
 *     parameters:
 *       - in: query
 *         name: bbox
 *         schema:
 *           type: string
 *         description: A bounding box to filter the measurements, formatted as `minLon,minLat,maxLon,maxLat`.
 *       - in: query
 *         name: pollutants
 *         schema:
 *           type: string
 *         description: A comma-separated list of pollutants to filter by (e.g., `pm25,no2`).
 *     responses:
 *       200:
 *         description: A GeoJSON FeatureCollection of measurements.
 */
router.get('/measurements', getMeasurements);

/**
 * @swagger
 * /api/hotspots:
 *   get:
 *     summary: Get pollution hotspots
 *     tags: [Air Quality]
 *     description: Returns a GeoJSON FeatureCollection of identified pollution hotspots.
 *     parameters:
 *       - in: query
 *         name: severity
 *         schema:
 *           type: string
 *           enum: [all, moderate, high, critical]
 *           default: moderate
 *         description: The minimum severity level of hotspots to return.
 *     responses:
 *       200:
 *         description: A GeoJSON FeatureCollection of hotspots.
 */
router.get('/hotspots', getHotspots);

/**
 * @swagger
 * /api/alerts:
 *   get:
 *     summary: Get active air quality alerts
 *     tags: [Air Quality]
 *     description: Returns a list of active air quality alerts for the default city.
 *     responses:
 *       200:
 *         description: An array of alert objects.
 */
router.get('/alerts', getAlerts);

/**
 * @swagger
 * /api/dashboard:
 *   get:
 *     summary: Get dashboard data
 *     tags: [Air Quality]
 *     description: Retrieves a pre-formatted data object suitable for populating a dashboard view.
 *     responses:
 *       200:
 *         description: A dashboard data object.
 */
router.get('/dashboard', getDashboard);

/**
 * @swagger
 * /api/refresh:
 *   post:
 *     summary: Refresh data for the default city
 *     tags: [Air Quality]
 *     description: Manually triggers a data refresh for the default city, clearing the cache.
 *     responses:
 *       200:
 *         description: A confirmation message.
 */
router.post('/refresh', refreshData);

/**
 * @swagger
 * /api/geo/location:
 *   get:
 *     summary: Get data for a specific coordinate
 *     tags: [Air Quality]
 *     description: Retrieves air quality and weather data for a specific latitude and longitude.
 *     parameters:
 *       - in: query
 *         name: lat
 *         required: true
 *         schema:
 *           type: number
 *         description: Latitude.
 *       - in: query
 *         name: lon
 *         required: true
 *         schema:
 *           type: number
 *         description: Longitude.
 *     responses:
 *       200:
 *         description: A location data object.
 */
router.get('/geo/location', getLocationData);

/**
 * @swagger
 * /api/nairobi-zones:
 *   get:
 *     summary: Get Nairobi monitoring zones
 *     tags: [Air Quality]
 *     description: Retrieves a GeoJSON FeatureCollection of monitoring zones specifically for Nairobi.
 *     responses:
 *       200:
 *         description: A GeoJSON FeatureCollection of Nairobi zones.
 */
router.get('/nairobi-zones', getNairobiZones);

/**
 * @swagger
 * /api/analyze:
 *   post:
 *     summary: Trigger a hotspot analysis
 *     tags: [Air Quality]
 *     description: Initiates a server-side analysis of pollution hotspots, which will emit results via WebSocket.
 *     responses:
 *       200:
 *         description: A confirmation that the analysis has started.
 */
router.post('/analyze', triggerAnalysis);

export default router;