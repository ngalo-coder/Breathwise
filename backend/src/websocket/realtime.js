import { Server } from 'socket.io';
import directDataService from '../services/directDataService.js';

let io;

export const initWebSocket = (server, allowedOrigins) => {
  io = new Server(server, {
    cors: {
      origin: allowedOrigins,
      methods: ["GET", "POST"],
      credentials: true
    },
    pingTimeout: 60000,
    pingInterval: 25000
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    socket.join('nairobi_dashboard');

    socket.emit('connection_status', {
      status: 'connected',
      message: 'Connected to UNEP Air Quality Platform (Simplified Mode)',
      timestamp: new Date().toISOString(),
      server_info: {
        version: '2.1.0-simplified',
        mode: 'direct_api',
        features: ['real_time_data', 'ai_analysis', 'smart_alerts'],
        database_required: false
      }
    });

    // Handle real-time data requests
    socket.on('request_data_update', async () => {
      try {
        const data = await directDataService.getNairobiData();
        socket.emit('data_update', {
          measurements_count: data.measurements.length,
          avg_pm25: data.summary.avg_pm25,
          air_quality_status: data.summary.air_quality_status,
          active_sources: data.data_sources.length,
          timestamp: data.timestamp
        });
      } catch (error) {
        socket.emit('error', { message: 'Failed to get data update' });
      }
    });

    // Handle cache refresh requests
    socket.on('request_refresh', async () => {
      try {
        directDataService.clearCache();
        socket.emit('refresh_complete', {
          message: 'Cache cleared - next request will fetch fresh data',
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        socket.emit('error', { message: 'Failed to refresh cache' });
      }
    });

    socket.on('disconnect', (reason) => {
      console.log(`🔌 Client disconnected: ${socket.id}, reason: ${reason}`);
    });

    socket.on('error', (error) => {
      console.error('🔌 Socket error:', error);
    });
  });

  // Automatic data refresh every 15 minutes
  setInterval(async () => {
    try {
      console.log('🔄 Automatic cache refresh...');
      directDataService.clearCache();

      // Fetch fresh data
      const freshData = await directDataService.getNairobiData();

      // Notify all connected clients
      io.to('nairobi_dashboard').emit('auto_refresh', {
        timestamp: freshData.timestamp,
        measurements_count: freshData.measurements.length,
        sources_active: freshData.data_sources.length,
        message: 'Data automatically refreshed'
      });

    } catch (error) {
      console.error('❌ Auto refresh error:', error);
    }
  }, 15 * 60 * 1000); // 15 minutes

  return io;
};

export { io };
