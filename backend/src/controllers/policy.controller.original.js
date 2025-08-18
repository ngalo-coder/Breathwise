import dataService from '../services/dataService.js';
import { io } from '../app.js';

export const getPolicyRecommendations = async (req, res) => {
  const { 
    priority, 
    status, 
    limit = 10,
    grid_id 
  } = req.query;

  try {
    // Get recommendations from data service
    const filters = {};
    if (status) filters.status = status;
    if (priority) filters.priority = priority;
    if (grid_id) filters.grid_id = grid_id;

    const result = dataService.getPolicyRecommendations(filters);
    
    // Apply limit
    const limitedRecommendations = result.recommendations.slice(0, parseInt(limit));

    res.json({
      recommendations: limitedRecommendations,
      metadata: {
        ...result.metadata,
        total: limitedRecommendations.length,
        filters: { priority, status, grid_id }
      }
    });

  } catch (error) {
    console.error('Policy recommendations error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch policy recommendations',
      message: error.message 
    });
  }
};

export const simulatePolicyImpact = async (req, res) => {
  const { policy_id, scenario_params } = req.body;

  try {
    // Get policy details
    const policyQuery = `
      SELECT pr.*, pg.geom, pg.dominant_source, pg.population_density
      FROM policy_recommendations pr
      JOIN policy_grid pg ON pr.grid_id = pg.grid_id
      WHERE pr.id = $1
    `;
    
    const policyResult = await db.query(policyQuery, [policy_id]);
    
    if (policyResult.rows.length === 0) {
      return res.status(404).json({ error: 'Policy recommendation not found' });
    }

    const policy = policyResult.rows[0];

    // Simulate impact based on policy type
    const simulation = await simulateImpact(policy, scenario_params);

    // Emit real-time update
    io.to('nairobi_dashboard').emit('simulation_complete', {
      policy_id,
      simulation_results: simulation
    });

    res.json({
      policy_id,
      policy_title: policy.title,
      simulation_results: simulation,
      generated_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('Policy simulation error:', error);
    res.status(500).json({ 
      error: 'Failed to simulate policy impact',
      message: error.message 
    });
  }
};

export const getActiveAlerts = async (req, res) => {
  const { severity, limit = 20 } = req.query;

  try {
    // Get alerts from data service
    const filters = {};
    if (severity) filters.severity = severity;

    const result = dataService.getActiveAlerts(filters);
    
    // Apply limit
    const limitedAlerts = result.alerts.slice(0, parseInt(limit));

    res.json({
      alerts: limitedAlerts,
      metadata: {
        ...result.metadata,
        total_active: limitedAlerts.length
      }
    });

  } catch (error) {
    console.error('Active alerts error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch active alerts',
      message: error.message 
    });
  }
};

export const approvePolicyRecommendation = async (req, res) => {
  const { id } = req.params;
  const { status, notes } = req.body;

  try {
    if (!['approved', 'rejected', 'implemented'].includes(status)) {
      return res.status(400).json({ 
        error: 'Invalid status',
        valid_statuses: ['approved', 'rejected', 'implemented']
      });
    }

    const updateQuery = `
      UPDATE policy_recommendations 
      SET status = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `;

    const result = await db.query(updateQuery, [status, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Policy recommendation not found' });
    }

    const updatedPolicy = result.rows[0];

    // Emit real-time update
    io.to('nairobi_dashboard').emit('policy_status_update', {
      policy_id: id,
      new_status: status,
      policy_title: updatedPolicy.title,
      notes
    });

    res.json({
      message: `Policy recommendation ${status} successfully`,
      policy: updatedPolicy,
      notes
    });

  } catch (error) {
    console.error('Policy approval error:', error);
    res.status(500).json({ 
      error: 'Failed to update policy status',
      message: error.message 
    });
  }
};

export const getDashboardStats = async (req, res) => {
  try {
    // Get dashboard stats from data service
    const dashboard = dataService.getDashboardStats();
    res.json(dashboard);

  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch dashboard statistics',
      message: error.message 
    });
  }
};

// Helper functions
async function simulateImpact(policy, scenarioParams = {}) {
  const baseImpact = policy.expected_impact_percent || 20;
  
  // Simple simulation logic based on policy type
  let simulatedImpact = baseImpact;
  
  switch (policy.policy_type) {
    case 'traffic_restriction':
      simulatedImpact = baseImpact * (scenarioParams.compliance_rate || 0.8);
      break;
    case 'industrial_monitoring':
      simulatedImpact = baseImpact * (scenarioParams.enforcement_level || 0.9);
      break;
    case 'low_emission_zone':
      simulatedImpact = baseImpact * (scenarioParams.vehicle_compliance || 0.7);
      break;
    default:
      simulatedImpact = baseImpact * 0.8;
  }

  return {
    baseline_pm25: 45.2, // Current average
    projected_pm25: 45.2 * (1 - simulatedImpact / 100),
    impact_percent: Math.round(simulatedImpact * 10) / 10,
    affected_population: policy.population_density || 10000,
    health_benefits: {
      avoided_deaths: Math.round((simulatedImpact / 100) * 2.3),
      avoided_hospital_visits: Math.round((simulatedImpact / 100) * 45),
      economic_benefit_usd: Math.round((simulatedImpact / 100) * 125000)
    },
    implementation_timeline: {
      preparation_days: 15,
      rollout_days: policy.implementation_time_days || 30,
      full_effect_days: (policy.implementation_time_days || 30) + 60
    },
    confidence_level: 0.75
  };
}

function getTimeSince(timestamp) {
  const now = new Date();
  const past = new Date(timestamp);
  const diffMs = now - past;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffMins > 0) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  return 'Just now';
}