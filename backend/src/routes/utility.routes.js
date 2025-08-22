import express from 'express';
import { clearCache, testApis } from '../controllers/utility.controller.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Utility
 *   description: Utility and health check endpoints.
 */

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Get API health status
 *     tags: [Utility]
 *     description: Provides a detailed health check of the API and its connected services, including cache, websockets, and external APIs. Note: This endpoint is defined at the root level, not under `/api`.
 *     responses:
 *       200:
 *         description: A JSON object with the health status.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: healthy
 *       503:
 *          description: The service is unavailable.
 */

/**
 * @swagger
 * /api/cache/clear:
 *   post:
 *     summary: Clear the server cache
 *     tags: [Utility]
 *     description: Manually clears the in-memory cache for all API data. The next API call will fetch fresh data from the external sources.
 *     responses:
 *       200:
 *         description: A JSON object confirming the cache was cleared.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Cache cleared successfully
 */
router.post('/cache/clear', clearCache);

/**
 * @swagger
 * /api/test-apis:
 *   get:
 *     summary: Test connectivity to external APIs
 *     tags: [Utility]
 *     description: Performs a live test of the connectivity to all configured external data source APIs (WeatherAPI, OpenAQ, etc.) and returns the status of each.
 *     responses:
 *       200:
 *         description: A JSON object with the test results.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 apis_tested:
 *                   type: object
 */
router.get('/test-apis', testApis);


export default router;
