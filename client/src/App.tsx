import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Global Core Architecture Providers
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

// Presentation Layer / UI Pages
import LandingLayout from './pages/LandingLayout'; // 🚀 FIXED: Absolute Default Import Handshake
import { DashboardPage } from './pages/DashboardPage';
import { RoomPage } from './pages/RoomPage';

/**
 * 🛡️ System Design Pattern: Cryptographic Route Gatekeeper Guard Wrapper
 */
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex justify-center items-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

/**
 * 🗺️ Core Client Navigation Layout Router Engine
 */
const AppContent: React.FC = () => {
  return (
    <Router>
      <Toaster 
        position="top-right"
        toastOptions={{
          style: {
            background: 'rgba(15, 23, 42, 0.9)',
            color: '#fff',
            border: '1px solid #1e293b',
          },
        }}
      />
      
      <Routes>
        {/* 🚀 Central Unified Landing Shell Gateway */}
        <Route path="/" element={<LandingLayout view="login" />} />
        <Route path="/register" element={<LandingLayout view="register" />} />

        {/* 🔒 Secure Multi-User Real-Time Workspaces Enclosure Boundary */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          } 
        />

        {/* 🔒 Secure Real-Time Multi-User Collaboration Workspaces Room Engine Link */}
        <Route 
          path="/room/:roomId" 
          element={
            <ProtectedRoute>
              <RoomPage />
            </ProtectedRoute>
          } 
        />

        {/* Fallback Catch-All Redirect Strategy Constraint */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </AuthProvider>
  );
}