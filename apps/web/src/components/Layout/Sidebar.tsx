import { NavLink, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useState, useEffect } from 'react';
import { generateInitials } from '@al/shared';

interface SidebarProps {
  onClose?: () => void;
  isMobile?: boolean;
}

const Sidebar = ({ onClose, isMobile = false }: SidebarProps) => {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Close sidebar on mobile when route changes
  useEffect(() => {
    if (isMobile && onClose) {
      onClose();
    }
  }, [location, isMobile, onClose]);

  const navItems = [
    { to: '/chat', icon: '💬', label: 'Czat', exact: true },
    { to: '/projects', icon: '📁', label: 'Projekty' },
    { to: '/memory', icon: '🧠', label: 'Pamięć' },
    { to: '/files', icon: '📄', label: 'Pliki' },
    { to: '/tasks', icon: '✅', label: 'Zadania' },
    { to: '/integrations', icon: '🔗', label: 'Integracje' },
    { to: '/settings', icon: '⚙️', label: 'Ustawienia' },
  ];

  const handleLogout = async () => {
    await logout();
    if (isMobile && onClose) {
      onClose();
    }
  };

  if (isMobile) {
    return (
      <div className="fixed inset-0 bg-primary-900/95 backdrop-blur-sm z-50 flex flex-col md:hidden">
        <div className="flex items-center justify-between p-4 border-b border-primary-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-accent-600 rounded-full flex items-center justify-center font-bold text-white">
              {user ? generateInitials(user.name || user.email) : 'AL'}
            </div>
            <div>
              <div className="font-semibold text-primary-50">{user?.name || user?.email}</div>
              <div className="text-sm text-primary-400">AL Assistant</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-primary-300 hover:text-primary-50 text-2xl"
            aria-label="Zamknij menu"
          >
            ×
          </button>
        </div>
        
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {navItems.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  exact={item.exact}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-accent-600/20 text-accent-500'
                        : 'text-primary-300 hover:bg-primary-800 hover:text-primary-50'
                    }`
                  }
                  onClick={onClose}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span className="font-medium">{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-4 border-t border-primary-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-primary-300 hover:bg-primary-800 hover:text-primary-50 transition-colors"
          >
            <span className="text-xl">🔒</span>
            <span className="font-medium">Wyloguj się</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <aside className={`fixed left-0 top-0 bottom-0 w-64 bg-primary-900 border-r border-primary-800 flex flex-col z-50 transition-all duration-300 ${isCollapsed ? 'w-20' : ''}`}>
      {/* Logo */}
      <div className="p-4 border-b border-primary-800">
        {!isCollapsed ? (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-accent-600 rounded-lg flex items-center justify-center font-bold text-white text-xl">
              AL
            </div>
            <div>
              <div className="font-bold text-primary-50">AL</div>
              <div className="text-xs text-primary-400">Asystent AI</div>
            </div>
          </div>
        ) : (
          <div className="w-10 h-10 bg-accent-600 rounded-lg flex items-center justify-center font-bold text-white text-xl mx-auto">
            AL
          </div>
        )}
      </div>

      {/* User Profile */}
      <div className="p-4 border-b border-primary-800 hidden md:block">
        {!isCollapsed ? (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-accent-600 rounded-full flex items-center justify-center font-bold text-white text-sm">
              {user ? generateInitials(user.name || user.email) : '?'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-primary-50 truncate">{user?.name || user?.email}</div>
              <div className="text-xs text-primary-400">Online</div>
            </div>
          </div>
        ) : (
          <div className="w-10 h-10 bg-accent-600 rounded-full flex items-center justify-center font-bold text-white text-sm mx-auto">
            {user ? generateInitials(user.name || user.email).charAt(0) : '?'}
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                exact={item.exact}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-accent-600/20 text-accent-500'
                      : 'text-primary-300 hover:bg-primary-800 hover:text-primary-50'
                  }`
                }
              >
                <span className="text-xl">{item.icon}</span>
                {!isCollapsed && <span className="font-medium">{item.label}</span>}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Bottom Section */}
      <div className="p-4 border-t border-primary-800">
        {!isCollapsed ? (
          <>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-primary-300 hover:bg-primary-800 hover:text-primary-50 transition-colors"
            >
              <span className="text-xl">🔒</span>
              <span className="font-medium">Wyloguj się</span>
            </button>
            <div className="mt-4 text-xs text-primary-500 text-center">
              v{import.meta.env.VITE_APP_VERSION || '1.0.0'}
            </div>
          </>
        ) : (
          <button
            onClick={handleLogout}
            className="w-10 h-10 bg-primary-800 rounded-lg flex items-center justify-center text-primary-300 hover:bg-primary-700 hover:text-primary-50 transition-colors mx-auto"
            aria-label="Wyloguj się"
          >
            <span className="text-lg">🔒</span>
          </button>
        )}
      </div>

      {/* Collapse Toggle */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 bg-primary-800 p-2 rounded-r-lg cursor-pointer hover:bg-primary-700 transition-colors" onClick={() => setIsCollapsed(!isCollapsed)}>
        <span className={`transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`}>
          {isCollapsed ? '›' : '‹'}
        </span>
      </div>
    </aside>
  );
};

export default Sidebar;
