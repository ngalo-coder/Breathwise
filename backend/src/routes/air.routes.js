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

// Input validation
const validateCity = [
  param('city')
    .isAlpha('en-US', { ignore: ' -' })
    .withMessage('City name can only contain letters, spaces, and hyphens')
    .isLength({ min: 2, max: 50 })
    .withMessage('City name must be between 2-50 characters')
];

// --- Core Air Quality Data Routes ---

// Get comprehensive data for a specific city
router.get('/:city', validateCity, getCityData);

// Get air quality measurements (supports geojson)
router.get('/measurements', getMeasurements);

// Get pollution hotspots
router.get('/hotspots', getHotspots);

// Get active alerts
router.get('/alerts', getAlerts);

// --- Dashboard and Utility Routes ---

// Get data formatted for a dashboard view
router.get('/dashboard', getDashboard);

// Trigger a manual data refresh for the default city
router.post('/refresh', refreshData);

// Get data for a specific lat/lon coordinate
router.get('/geo/location', getLocationData);


// --- Specialized and Analysis Routes ---

// Get monitoring zones for Nairobi
router.get('/nairobi-zones', getNairobiZones);

// Trigger a hotspot analysis
router.post('/analyze', triggerAnalysis);

export default router;