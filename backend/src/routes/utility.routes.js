import express from 'express';
import { clearCache, testApis } from '../controllers/utility.controller.js';

const router = express.Router();

router.post('/cache/clear', clearCache);
router.get('/test-apis', testApis);

export default router;
