import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';
import toast from 'react-hot-toast';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [lastUpdate, setLastUpdate] = useState(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  useEffect(() => {
    initializeSocket();

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  const initializeSocket = () => {
    const serverUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:8001';
    
    const newSocket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: true,
    });

    newSocket.on('connect', () => {
      console.log('📡 Connected to WebSocket server');
      setIsConnected(true);
      setConnectionStatus('connected');
      reconnectAttempts.current = 0;
      toast.success('Connected to real-time updates');
    });

    newSocket.on('disconnect', (reason) => {
      console.log('🔌 Disconnected from WebSocket server:', reason);
      setIsConnected(false);
      setConnectionStatus('disconnected');
      toast.error('Lost connection to real-time updates');
    });

    newSocket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error);
      setConnectionStatus('error');
      
      if (reconnectAttempts.current < maxReconnectAttempts) {
        reconnectAttempts.current += 1;
        setTimeout(() => {
          console.log(`🔄 Reconnection attempt ${reconnectAttempts.current}/${maxReconnectAttempts}`);
          newSocket.connect();
        }, 1000 * reconnectAttempts.current);
      } else {
        toast.error('Failed to connect to real-time updates');
      }
    });

    // Real-time data updates
    newSocket.on('realtime_update', (data) => {
      console.log('📊 Real-time update received:', data);
      setLastUpdate(new Date());
      
      // Emit custom event for components to listen to
      window.dispatchEvent(new CustomEvent('realtimeUpdate', { detail: data }));
    });

    // Critical alerts
    newSocket.on('critical_alert', (data) => {
      console.log('🚨 Critical alert received:', data);
      toast.error(`Critical Alert: ${data.alerts?.[0]?.message || 'Emergency situation detected'}`, {
        duration: 10000,
        style: {
          background: '#dc2626',
          color: 'white',
          fontWeight: 'bold',
        },
      });
      
      window.dispatchEvent(new CustomEvent('criticalAlert', { detail: data }));
    });

    // Data refresh notifications
    newSocket.on('data_refreshed', (data) => {
      console.log('🔄 Data refresh notification:', data);
      toast.success('Data refreshed successfully');
      window.dispatchEvent(new CustomEvent('dataRefreshed', { detail: data }));
    });

    // AI analysis completion
    newSocket.on('ai_analysis_complete', (data) => {
      console.log('🤖 AI analysis complete:', data);
      toast.success('AI analysis updated');
      window.dispatchEvent(new CustomEvent('aiAnalysisComplete', { detail: data }));
    });

    // Connection status updates
    newSocket.on('connection_status', (data) => {
      console.log('📶 Connection status:', data);
      toast.info(data.message);
    });

    setSocket(newSocket);
  };

  const reconnect = () => {
    if (socket) {
      socket.connect();
    } else {
      initializeSocket();
    }
  };

  const requestDataUpdate = () => {
    if (socket && isConnected) {
      socket.emit('request_data_update');
    }
  };

  const requestRefresh = () => {
    if (socket && isConnected) {
      socket.emit('request_refresh');
      toast.loading('Refreshing data...', { duration: 2000 });
    }
  };

  const value = {
    socket,
    isConnected,
    connectionStatus,
    lastUpdate,
    reconnect,
    requestDataUpdate,
    requestRefresh,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};