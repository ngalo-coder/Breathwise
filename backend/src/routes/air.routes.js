import express from 'express';
import { getHotspots, getMeasurements, getNairobiZones, triggerAdvancedAnalysis } from '../controllers/enhancedAir.controller.js';

const router = express.Router();

// Get pollution hotspots within bounding box
router.get('/hotspots', getHotspots);

// Get air quality measurements
router.get('/measurements', getMeasurements);

// Get Nairobi monitoring zones
router.get('/nairobi-zones', getNairobiZones);

// Trigger hotspot analysis
router.post('/analyze', triggerAdvancedAnalysis);

export default router;