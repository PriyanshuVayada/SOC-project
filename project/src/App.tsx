/**
 * Main Application Component
 * 
 * Root component that handles authentication state, routing,
 * and provides the main dashboard layout with context providers.
 */

import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { SocketProvider } from './contexts/SocketContext';
import { LoginForm } from './components/LoginForm';
import { Header } from './components/Layout/Header';
import { Sidebar } from './components/Layout/Sidebar';
import { Overview } from './components/Dashboard/Overview';
import { ThreatMonitoring } from './components/Dashboard/ThreatMonitoring';
import { IncidentResponse } from './components/Dashboard/IncidentResponse';
import { SecurityAnalytics } from './components/Dashboard/SecurityAnalytics';

// Dashboard content component that requires authentication
function DashboardContent() {
  const [activeSection, setActiveSection] = useState('overview');

  const renderContent = () => {
    switch (activeSection) {
      case 'overview':
        return <Overview />;
      case 'monitoring':
        return <ThreatMonitoring />;
      case 'incidents':
        return <IncidentResponse />;
      case 'analytics':
        return <SecurityAnalytics />;
      case 'assets':
        return <SecurityAnalytics />;
      case 'playbooks':
        return <IncidentResponse />;
      case 'compliance':
        return <SecurityAnalytics />;
      case 'threat-intel':
        return <SecurityAnalytics />;
      case 'users':
        return (
          <div className="p-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-8 text-center border border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                User Management
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                User management functionality will be implemented here.
              </p>
            </div>
          </div>
        );
      case 'settings':
        return (
          <div className="p-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-8 text-center border border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                System Settings
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                System configuration settings will be implemented here.
              </p>
            </div>
          </div>
        );
      default:
        return <Overview />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <Sidebar 
        activeSection={activeSection} 
        onSectionChange={setActiveSection} 
      />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

// Main app component with authentication check
function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading SOC Dashboard...</p>
        </div>
      </div>
    );
  }

  return isAuthenticated ? <DashboardContent /> : <LoginForm />;
}

// Root App component with all providers
function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SocketProvider>
          <AppContent />
        </SocketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;