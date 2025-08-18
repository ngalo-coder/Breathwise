import fs from 'fs';
import path from 'path';
import { io } from '../app.js';

// Read mock data files
const readMockData = (filename) => {
  try {
    const filePath = path.join(process.cwd(), '..', filename);
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading mock data ${filename}:`, error);
    return null;
  }
};

export const getPolicyRecommendations = async (req, res) => {
  try {
    const policyData = readMockData('mock_policy_recommendations.json');
    
    if (!policyData) {
      return res.status(500).json({ 
        error: 'Mock policy data not available',
        message: 'Could not read mock_policy_recommendations.json file'
      });
    }

    const { priority, status = 'pending', limit = 10 } = req.query;

    let recommendations = policyData.recommendations;

    // Apply filters
    if (priority) {
      recommendations = recommendations.filter(r => r.priority === priority);
    }

    if (status && status !== 'pending') {
      recommendations = recommendations.filter(r => r.status === status);
    }

    // Apply limit
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
    console.error('Policy recommendations mock error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch policy recommendations',
      message: error.message 
    });
  }
};

export const simulatePolicyImpact = async (req, res) => {
  try {
    const { policy_id } = req.body;

    // Mock simulation results
    const simulation = {
      policy_id,
      policy_title: "Mock Policy Simulation",
      simulation_results: {
        baseline_pm25: 45.2,
        projected_pm25: 32.1,
        impact_percent: 29.0,
        affected_population: 15000,
        health_benefits: {
          avoided_deaths: 3,
          avoided_hospital_visits: 45,
          economic_benefit_usd: 125000
        },
        implementation_timeline: {
          preparation_days: 15,
          rollout_days: 30,
          full_effect_days: 90
        },
        confidence_level: 0.75
      },
      generated_at: new Date().toISOString()
    };

    // Emit real-time update
    io.to('nairobi_dashboard').emit('simulation_complete', {
      policy_id,
      simulation_results: simulation.simulation_results
    });

    res.json(simulation);

  } catch (error) {
    console.error('Policy simulation mock error:', error);
    res.status(500).json({ 
      error: 'Failed to simulate policy impact',
      message: error.message 
    });
  }
};

export const getActiveAlerts = async (req, res) => {
  try {
    // Mock active alerts
    const alerts = [
      {
        id: 1,
        alert_type: 'pollution_spike',
        location: { type: 'Point', coordinates: [36.8833, -1.3167] },
        severity: 'critical',
        message: 'Very unhealthy air quality detected in Embakasi - PM2.5: 89.5 μg/m³',
        pm25_level: 89.5,
        triggered_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        status: 'active',
        time_since: '2 hours ago'
      },
      {
        id: 2,
        alert_type: 'policy_trigger',
        location: { type: 'Point', coordinates: [36.8172, -1.2864] },
        severity: 'high',
        message: 'Traffic restriction policy should be activated in CBD - PM2.5: 45.2 μg/m³',
        pm25_level: 45.2,
        triggered_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
        status: 'active',
        time_since: '30 minutes ago'
      },
      {
        id: 3,
        alert_type: 'health_advisory',
        location: { type: 'Point', coordinates: [36.8581, -1.3128] },
        severity: 'medium',
        message: 'Air quality unhealthy for sensitive groups in Industrial Area - PM2.5: 67.3 μg/m³',
        pm25_level: 67.3,
        triggered_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // 1 hour ago
        status: 'active',
        time_since: '1 hour ago'
      }
    ];

    const { severity, limit = 20 } = req.query;

    let filteredAlerts = alerts;
    if (severity) {
      filteredAlerts = alerts.filter(alert => alert.severity === severity);
    }

    filteredAlerts = filteredAlerts.slice(0, parseInt(limit));

    res.json({
      alerts: filteredAlerts,
      metadata: {
        total_active: filteredAlerts.length,
        severity_filter: severity,
        generated_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Active alerts mock error:', error);
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

    // Mock approval response
    const updatedPolicy = {
      id: parseInt(id),
      title: "Mock Policy Update",
      status: status,
      updated_at: new Date().toISOString()
    };

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
    console.error('Policy approval mock error:', error);
    res.status(500).json({ 
      error: 'Failed to update policy status',
      message: error.message 
    });
  }
};

export const getDashboardStats = async (req, res) => {
  try {
    // Mock dashboard statistics
    const dashboard = {
      air_quality: {
        total_measurements: 5,
        avg_pm25: 50.56,
        max_pm25: 89.5,
        unhealthy_readings: 3,
        very_unhealthy_readings: 1,
        source_types: 1,
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
        medium: 1,
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
    console.error('Dashboard stats mock error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch dashboard statistics',
      message: error.message 
    });
  }
};