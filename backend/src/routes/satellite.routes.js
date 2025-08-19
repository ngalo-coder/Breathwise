import express from 'express';
import { io } from '../app.js';

const router = express.Router();

// Mock satellite data for testing
const mockSatelliteData = {
  timestamp: new Date().toISOString(),
  satellites: [
    {
      id: 'sat-001',
      name: 'Sentinel-5P',
      status: 'active',
      last_contact: new Date().toISOString(),
      data_quality: 'excellent',
      coverage_area: 'Nairobi Region'
    },
    {
      id: 'sat-002', 
      name: 'NASA Aura',
      status: 'active',
      last_contact: new Date(Date.now() - 3600000).toISOString(),
      data_quality: 'good',
      coverage_area: 'East Africa'
    }
  ]
};

// Get satellite status
router.get('/status', (req, res) => {
  try {
    res.json({
      success: true,
      data: mockSatelliteData,
      message: 'Satellite data retrieved successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve satellite data',
      details: error.message
    });
  }
});

// Get real-time satellite updates (Socket.IO)
router.get('/realtime', (req, res) => {
  try {
    // Emit real-time data to connected clients
    io.emit('satellite_update', mockSatelliteData);
    
    res.json({
      success: true,
      message: 'Real-time satellite update sent',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to send real-time update',
      details: error.message
    });
  }
});

// Get satellite coverage for specific area
router.get('/coverage/:area', (req, res) => {
  try {
    const { area } = req.params;
    
    const coverageData = {
      area,
      satellites: mockSatelliteData.satellites.filter(sat => 
        sat.coverage_area.toLowerCase().includes(area.toLowerCase())
      ),
      timestamp: new Date().toISOString(),
      coverage_percentage: Math.floor(Math.random() * 40) + 60 // 60-100%
    };
    
    res.json({
      success: true,
      data: coverageData,
      message: `Coverage data for ${area} retrieved successfully`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve coverage data',
      details: error.message
    });
  }
});

// Health check for satellite service
router.get('/health', (req, res) => {
  const healthStatus = {
    service: 'satellite',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    active_satellites: mockSatelliteData.satellites.filter(sat => sat.status === 'active').length,
    total_satellites: mockSatelliteData.satellites.length,
    uptime: Math.floor(process.uptime())
  };
  
  res.json(healthStatus);
});

export default router;