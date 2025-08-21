import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import AirQualityDashboard from './components/Dashboard/AirQualityDashboard';
import MapView from './components/Map/MapView';
import Analytics from './components/Analytics/Analytics';
import Alerts from './components/Alerts/Alerts';
import Policy from './components/Policy/Policy';
import { SocketProvider } from './context/SocketContext';
import { DataProvider } from './context/DataContext';
// import './App.css';

function App() {
  return (
    <div className="App">
      <SocketProvider>
        <DataProvider>
          <Router>
            <Routes>
              <Route path="/" element={<AirQualityDashboard />} />
              <Route path="/dashboard" element={<AirQualityDashboard />} />
              <Route path="/map" element={<MapView />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/alerts" element={<Alerts />} />
              <Route path="/policy" element={<Policy />} />
            </Routes>
          </Router>
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                style: {
                  background: '#10b981',
                },
              },
              error: {
                duration: 5000,
                style: {
                  background: '#ef4444',
                },
              },
            }}
          />
        </DataProvider>
      </SocketProvider>
    </div>
  );
}

export default App;