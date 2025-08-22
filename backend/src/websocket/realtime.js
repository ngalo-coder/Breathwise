
// websocket/realtime.js
// This module handles real-time updates for air quality data using WebSockets
const WebSocket = require('ws');
const { getLatestZoneData, getPolicyAlerts } = require('../services/dataService');

class RealTimeService {
  constructor() {
    this.wss = null;
    this.clients = new Set();
    this.updateInterval = null;
  }

  initialize(server) {
    this.wss = new WebSocket.Server({ server });
    
    this.wss.on('connection', (ws) => {
      console.log('Client connected to real-time updates');
      this.clients.add(ws);
      
      // Send initial data
      this.sendToClient(ws, 'zones', getLatestZoneData());
      this.sendToClient(ws, 'alerts', getPolicyAlerts());
      
      ws.on('close', () => {
        console.log('Client disconnected');
        this.clients.delete(ws);
      });
      
      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.clients.delete(ws);
      });
    });
    
    // Start periodic updates every 30 seconds
    this.startPeriodicUpdates();
  }

  startPeriodicUpdates() {
    this.updateInterval = setInterval(() => {
      this.broadcastUpdate('zones', getLatestZoneData());
      this.broadcastUpdate('alerts', getPolicyAlerts());
    }, 30000); // 30 seconds
  }

  sendToClient(ws, type, data) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type, data, timestamp: new Date().toISOString() }));
    }
  }

  broadcastUpdate(type, data) {
    const message = JSON.stringify({ 
      type, 
      data, 
      timestamp: new Date().toISOString(),
      isUpdate: true 
    });
    
    this.clients.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message);
      }
    });
  }

  stop() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    if (this.wss) {
      this.wss.close();
    }
  }
}

module.exports = RealTimeService;
