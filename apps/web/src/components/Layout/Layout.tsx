import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { useAuthStore } from '../../store/authStore';

const Layout = () => {
  const { user, checkAuth } = useAuthStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Check authentication on mount
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Close sidebar on route change
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  if (!user) {
    return null; // Auth route will handle redirection
  }

  return (
    <div className="min-h-screen bg-primary-900">
      {/* Mobile Sidebar */}
      {isSidebarOpen && (
        <Sidebar onClose={() => setIsSidebarOpen(false)} isMobile={true} />
      )}

      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Header */}
      <Header onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />

      {/* Main Content */}
      <main className="pt-16 md:pl-64 min-h-screen">
        <div className="p-4 md:p-6">
          <Outlet />
        </div>
      </main>

      {/* Safe area bottom padding for mobile */}
      <div className="h-16 md:h-0" />
    </div>
  );
};

export default Layout;
