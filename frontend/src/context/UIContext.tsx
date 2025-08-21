import React, { createContext, useContext, useState, ReactNode } from 'react';

// Types
export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  title?: string;
  autoHide?: boolean;
  duration?: number;
}

export interface UIContextType {
  // Theme
  darkMode: boolean;
  toggleDarkMode: () => void;

  // Layout
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;

  // Active view
  activeView: string;
  setActiveView: (view: string) => void;

  // Notifications
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;

  // Modal
  modalOpen: boolean;
  modalContent: ReactNode | null;
  openModal: (content: ReactNode) => void;
  closeModal: () => void;

  // Map controls
  mapControls: {
    showHotspots: boolean;
    showZones: boolean;
    showSatellite: boolean;
    showLabels: boolean;
  };
  toggleMapControl: (control: keyof UIContextType['mapControls']) => void;

  // Chart controls
  chartTimeRange: string;
  setChartTimeRange: (range: string) => void;
}

// Create context with default values
const UIContext = createContext<UIContextType>({
  darkMode: false,
  toggleDarkMode: () => {},

  sidebarOpen: true,
  toggleSidebar: () => {},
  setSidebarOpen: () => {},

  activeView: 'dashboard',
  setActiveView: () => {},

  notifications: [],
  addNotification: () => {},
  removeNotification: () => {},
  clearNotifications: () => {},

  modalOpen: false,
  modalContent: null,
  openModal: () => {},
  closeModal: () => {},

  mapControls: {
    showHotspots: true,
    showZones: true,
    showSatellite: false,
    showLabels: true,
  },
  toggleMapControl: () => {},

  chartTimeRange: '7d',
  setChartTimeRange: () => {},
});

// Provider props
interface UIProviderProps {
  children: ReactNode;
}

// Provider component
export const UIProvider: React.FC<UIProviderProps> = ({ children }) => {
  // Theme state
  const [darkMode, setDarkMode] = useState<boolean>(false);

  // Layout state
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);

  // Active view state
  const [activeView, setActiveView] = useState<string>('dashboard');

  // Notifications state
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Modal state
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [modalContent, setModalContent] = useState<ReactNode | null>(null);

  // Map controls state
  const [mapControls, setMapControls] = useState({
    showHotspots: true,
    showZones: true,
    showSatellite: false,
    showLabels: true,
  });

  // Chart controls state
  const [chartTimeRange, setChartTimeRange] = useState<string>('7d');

  // Toggle dark mode
  const toggleDarkMode = () => {
    setDarkMode(prev => !prev);
  };

  // Toggle sidebar
  const toggleSidebar = () => {
    setSidebarOpen(prev => !prev);
  };

  // Add notification
  const addNotification = (notification: Omit<Notification, 'id'>) => {
    const id = `notification-${Date.now()}`;
    const newNotification: Notification = {
      ...notification,
      id,
      autoHide: notification.autoHide !== false,
      duration: notification.duration || 5000,
    };

    setNotifications(prev => [newNotification, ...prev]);

    // Auto-hide notification if enabled
    if (newNotification.autoHide) {
      setTimeout(() => {
        removeNotification(id);
      }, newNotification.duration);
    }
  };

  // Remove notification
  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  // Clear all notifications
  const clearNotifications = () => {
    setNotifications([]);
  };

  // Open modal
  const openModal = (content: ReactNode) => {
    setModalContent(content);
    setModalOpen(true);
  };

  // Close modal
  const closeModal = () => {
    setModalOpen(false);
    setModalContent(null);
  };

  // Toggle map control
  const toggleMapControl = (control: keyof typeof mapControls) => {
    setMapControls(prev => ({
      ...prev,
      [control]: !prev[control],
    }));
  };

  // Context value
  const value: UIContextType = {
    darkMode,
    toggleDarkMode,

    sidebarOpen,
    toggleSidebar,
    setSidebarOpen,

    activeView,
    setActiveView,

    notifications,
    addNotification,
    removeNotification,
    clearNotifications,

    modalOpen,
    modalContent,
    openModal,
    closeModal,

    mapControls,
    toggleMapControl,

    chartTimeRange,
    setChartTimeRange,
  };

  return (
    <UIContext.Provider value={value}>
      {children}
    </UIContext.Provider>
  );
};

// Custom hook for using the UI context
export const useUI = () => useContext(UIContext);

export default UIContext;