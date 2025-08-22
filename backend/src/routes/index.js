import express from 'express';
import airRoutes from './air.routes.js';
import aiRoutes from './ai.routes.js';
import utilityRoutes from './utility.routes.js';

const router = express.Router();

// Mount the AI routes under the /ai prefix
router.use('/ai', aiRoutes);

// Mount the air quality data routes at the root of the api
router.use('/', airRoutes);

// Mount the utility routes at the root of the api
router.use('/', utilityRoutes);

export default router;
