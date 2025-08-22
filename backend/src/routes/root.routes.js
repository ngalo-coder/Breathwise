import express from 'express';
import { getRoot, getSetup } from '../controllers/root.controller.js';

const router = express.Router();

router.get('/', getRoot);
router.get('/setup', getSetup);

export default router;
