import React, { useState } from 'react';
import { useAuth } from './hooks/useAuth';
import LoginForm from './components/Auth/LoginForm';
import Sidebar from './components/Layout/Sidebar';
import Header from './components/Layout/Header';
import Dashboard from './components/Dashboard/Dashboard';
import Categories from './components/Categories/Categories';
import Tools from './components/Tools/Tools';
import Employees from './components/Employees/Employees';
import Outward from './components/Outward/Outward';
import Inward from './components/Inward/Inward';
import History from './components/History/History';

const App: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();
  const [currentView, setCurrentView] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginForm />;
  }

  const getViewTitle = () => {
    switch (currentView) {
      case 'dashboard':
        return 'Dashboard';
      case 'categories':
        return 'Tool Categories';
      case 'tools':
        return 'Tools Management';
      case 'employees':
        return 'Employee Management';
      case 'outward':
        return 'Outward Management';
      case 'inward':
        return 'Inward Management';
      case 'history':
        return 'Tool History';
      default:
        return 'Dashboard';
    }
  };

  const getViewSubtitle = () => {
    switch (currentView) {
      case 'dashboard':
        return 'Overview of your tool inventory system';
      case 'categories':
        return 'Manage tool categories and classifications';
      case 'tools':
        return 'Add, edit, and manage your tools inventory';
      case 'employees':
        return 'Manage employee records and information';
      case 'outward':
        return 'Issue tools to employees with security verification';
      case 'inward':
        return 'Process tool returns and update inventory';
      case 'history':
        return 'View complete tool usage history and analytics';
      default:
        return 'Overview of your tool inventory system';
    }
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'categories':
        return <Categories />;
      case 'tools':
        return <Tools />;
      case 'employees':
        return <Employees />;
      case 'outward':
        return <Outward />;
      case 'inward':
        return <Inward />;
      case 'history':
        return <History />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex h-screen overflow-hidden">
        <Sidebar
          currentView={currentView}
          onViewChange={setCurrentView}
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
        />
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header
            title={getViewTitle()}
            subtitle={getViewSubtitle()}
          />
          
          <main className="flex-1 overflow-auto p-4 lg:p-6">
            {renderCurrentView()}
          </main>
        </div>
      </div>
    </div>
  );
};

export default App;