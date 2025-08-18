import { io } from '../app.js';

const mockPolicyRecommendations = {
  "recommendations": [
    {
      "id": 1,
      "zone_id": "NBO_CBD_01",
      "title": "Peak-Hour Vehicle Restrictions (CBD)",
      "description": "Implement odd-even license plate restrictions during peak hours",
      "priority": "high",
      "expected_impact_percent": 28.5,
      "cost_estimate": 8200.00,
      "implementation_time_days": 30,
      "status": "pending",
      "created_at": new Date().toISOString(),
      "policy_type": "vehicle_restriction",
      "affected_population": 250000
    },
    {
      "id": 2,
      "zone_id": "NBO_IND_01", 
      "title": "Industrial Stack Monitoring (Embakasi)",
      "description": "Install continuous monitoring systems on industrial emitters",
      "priority": "critical",
      "expected_impact_percent": 18.2,
      "cost_estimate": 15000.00,
      "implementation_time_days": 90,
      "status": "approved",
      "created_at": new Date().toISOString(),
      "policy_type": "emission_monitoring",
      "affected_population": 180000
    },
    {
      "id": 3,
      "zone_id": "NBO_DAN_01",
      "title": "Waste Management Enhancement (Dandora)",
      "description": "Increase waste collection frequency and anti-burning enforcement",
      "priority": "high",
      "expected_impact_percent": 42.0,
      "cost_estimate": 7500.00,
      "implementation_time_days": 60,
      "status": "in_progress",
      "created_at": new Date().toISOString(),
      "policy_type": "waste_management",
      "affected_population": 120000
    }
  ],
  "metadata": {
    "total": 3,
    "generated_at": new Date().toISOString(),
    "city": "Nairobi"
  }
};

export const getPolicyRecommendations = async (req, res) => {
  try {
    console.log('Fetching policy recommendations with mock data');
    
    const { priority, status, limit = 10 } = req.query;

    let recommendations = [...mockPolicyRecommendations.recommendations];

    if (priority) {
      recommendations = recommendations.filter(r => r.priority === priority);
    }

    if (status && status !== 'all') {
      recommendations = recommendations.filter(r => r.status === status);
    }

    recommendations = recommendations.slice(0, parseInt(limit));

    res.json({
      recommendations,
      metadata: {
        total: recommendations.length,
        filters: { priority, status },
        generated_at: new Date().toISOString()
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
  try {
    const { policy_id } = req.body;
    const policy = mockPolicyRecommendations.recommendations.find(p => p.id == policy_id);
    
    if (!policy) {
      return res.status(404).json({ error: 'Policy not found' });
    }

    const baselinePM25 = 45.2;
    const reduction = policy.expected_impact_percent / 100;
    const projectedPM25 = baselinePM25 * (1 - reduction);

    const simulation = {
      policy_id: policy_id,
      policy_title: policy.title,
      simulation_results: {
        baseline_pm25: baselinePM25,
        projected_pm25: Math.round(projectedPM25 * 10) / 10,
        impact_percent: policy.expected_impact_percent,
        affected_population: policy.affected_population,
        health_benefits: {
          avoided_deaths: Math.round(reduction * 5.2),
          avoided_hospital_visits: Math.round(reduction * 120),
          economic_benefit_usd: Math.round(reduction * 485000)
        },
        implementation_timeline: {
          preparation_days: 15,
          rollout_days: policy.implementation_time_days,
          full_effect_days: policy.implementation_time_days + 60
        },
        confidence_level: 0.78
      },
      generated_at: new Date().toISOString()
    };

    if (io) {
      io.to('nairobi_dashboard').emit('simulation_complete', {
        policy_id,
        simulation_results: simulation.simulation_results
      });
    }

    res.json(simulation);

  } catch (error) {
    console.error('Policy simulation error:', error);
    res.status(500).json({ 
      error: 'Failed to simulate policy impact',
      message: error.message 
    });
  }
};

export const getActiveAlerts = async (req, res) => {
  try {
    const alerts = [
      {
        id: 1,
        alert_type: 'pollution_spike',
        location: { type: 'Point', coordinates: [36.8833, -1.3167] },
        zone_name: 'Embakasi',
        severity: 'critical',
        message: 'Very unhealthy air quality detected in Embakasi - PM2.5: 89.5 μg/m³',
        pm25_level: 89.5,
        triggered_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        status: 'active',
        time_since: '2 hours ago'
      },
      {
        id: 2,
        alert_type: 'policy_trigger',
        location: { type: 'Point', coordinates: [36.8172, -1.2864] },
        zone_name: 'CBD',
        severity: 'high',
        message: 'Traffic restriction policy should be activated in CBD',
        pm25_level: 45.2,
        triggered_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        status: 'active',
        time_since: '30 minutes ago'
      }
    ];

    const { severity, limit = 20 } = req.query;
    let filteredAlerts = severity ? alerts.filter(alert => alert.severity === severity) : alerts;
    filteredAlerts = filteredAlerts.slice(0, parseInt(limit));

    res.json({
      alerts: filteredAlerts,
      metadata: {
        total_active: filteredAlerts.length,
        generated_at: new Date().toISOString()
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
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const policy = mockPolicyRecommendations.recommendations.find(p => p.id == id);
    
    if (!policy) {
      return res.status(404).json({ error: 'Policy recommendation not found' });
    }

    policy.status = status;
    policy.updated_at = new Date().toISOString();

    if (io) {
      io.to('nairobi_dashboard').emit('policy_status_update', {
        policy_id: id,
        new_status: status,
        policy_title: policy.title,
        notes,
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      message: `Policy recommendation ${status} successfully`,
      policy: policy,
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
    const dashboard = {
      air_quality: {
        total_measurements: 5,
        avg_pm25: 50.56,
        max_pm25: 89.5,
        min_pm25: 18.7,
        unhealthy_readings: 3,
        very_unhealthy_readings: 1,
        last_update: new Date().toISOString()
      },
      policy_stats: {
        pending: { count: 1, avg_impact: 28.5 },
        approved: { count: 1, avg_impact: 18.2 },
        in_progress: { count: 1, avg_impact: 42.0 }
      },
      alert_stats: {
        critical: 1,
        high: 1,
        medium: 0,
        low: 0
      },
      pollution_sources: [
        { source_type: 'traffic', measurement_count: 2, avg_pm25: 38.65 },
        { source_type: 'industry', measurement_count: 2, avg_pm25: 78.4 },
        { source_type: 'background', measurement_count: 1, avg_pm25: 18.7 }
      ],
      generated_at: new Date().toISOString()
    };

    res.json(dashboard);

  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch dashboard statistics',
      message: error.message 
    });
  }
};