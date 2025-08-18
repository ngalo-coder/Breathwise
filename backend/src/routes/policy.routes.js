import express from 'express';
import { 
  getPolicyRecommendations, 
  simulatePolicyImpact, 
  getActiveAlerts,
  approvePolicyRecommendation,
  getDashboardStats
} from '../controllers/policy.controller.js';

const router = express.Router();

// Get policy recommendations
router.get('/recommendations', getPolicyRecommendations);

// Simulate policy impact
router.post('/simulate', simulatePolicyImpact);

// Get active alerts
router.get('/alerts', getActiveAlerts);

// Approve/reject policy recommendation
router.patch('/recommendations/:id', approvePolicyRecommendation);

// Get dashboard statistics
router.get('/dashboard', getDashboardStats);

export default router;