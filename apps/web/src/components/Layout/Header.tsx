import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { generateInitials } from '@al/shared';

interface HeaderProps {
  onMenuClick: () => void;
}

const Header = ({ onMenuClick }: HeaderProps) => {
  const { user } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Get page title based on route
  const getPageTitle = () => {
    const path = location.pathname;
    if (path.startsWith('/chat')) return 'Czat';
    if (path.startsWith('/projects')) return 'Projekty';
    if (path.startsWith('/memory')) return 'Pamięć';
    if (path.startsWith('/files')) return 'Pliki';
    if (path.startsWith('/tasks')) return 'Zadania';
    if (path.startsWith('/integrations')) return 'Integracje';
    if (path.startsWith('/settings')) return 'Ustawienia';
    return 'AL';
  };

  const handleProfileClick = () => {
    setShowProfileMenu(!showProfileMenu);
  };

  const handleLogout = async () => {
    const { logout } = useAuthStore.getState();
    await logout();
    navigate('/login');
    setShowProfileMenu(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-primary-900/95 backdrop-blur-sm border-b border-primary-800 z-40">
      <div className="flex items-center justify-between h-full px-4 md:px-6">
        {/* Left side - Menu button (mobile only) */}
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="md:hidden text-primary-300 hover:text-primary-50 text-2xl"
            aria-label="Otwórz menu"
          >
            ☰
          </button>
          
          {/* Title */}
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold text-primary-50">{getPageTitle()}</h1>
            {/* Status indicator */}
            <span className="hidden sm:inline-block px-2 py-1 bg-green-600/20 text-green-400 text-xs rounded-full">
              Online
            </span>
          </div>
        </div>

        {/* Right side - Actions and Profile */}
        <div className="flex items-center gap-3">
          {/* Quick actions (desktop) */}
          <div className="hidden md:flex items-center gap-2">
            <button
              className="p-2 rounded-lg bg-primary-800 hover:bg-primary-700 text-primary-300 hover:text-primary-50 transition-colors"
              aria-label="Nowa konwersacja"
            >
              <span className="text-xl">+</span>
            </button>
            <button
              className="p-2 rounded-lg bg-primary-800 hover:bg-primary-700 text-primary-300 hover:text-primary-50 transition-colors"
              aria-label="Szukaj"
            >
              <span className="text-xl">🔍</span>
            </button>
          </div>

          {/* Profile */}
          <div className="relative">
            <button
              onClick={handleProfileClick}
              className="flex items-center gap-2 p-2 rounded-lg bg-primary-800 hover:bg-primary-700 transition-colors"
              aria-label="Profil użytkownika"
              aria-expanded={showProfileMenu}
            >
              <div className="w-8 h-8 bg-accent-600 rounded-full flex items-center justify-center font-bold text-white text-sm">
                {user ? generateInitials(user.name || user.email) : '?'}
              </div>
              <span className="hidden md:inline text-primary-50 font-medium">{user?.name || user?.email}</span>
              <span className="hidden md:inline text-primary-400">›</span>
            </button>

            {/* Profile Menu */}
            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-primary-800 border border-primary-700 rounded-xl shadow-lg py-2 z-50">
                <div className="px-4 py-2 border-b border-primary-700">
                  <div className="font-semibold text-primary-50">{user?.name || user?.email}</div>
                  <div className="text-sm text-primary-400">{user?.email}</div>
                </div>
                <div className="py-2">
                  <button
                    onClick={() => {
                      navigate('/settings');
                      setShowProfileMenu(false);
                    }}
                    className="w-full px-4 py-2 text-left text-primary-300 hover:bg-primary-700 hover:text-primary-50 transition-colors flex items-center gap-3"
                  >
                    <span>⚙️</span>
                    <span>Ustawienia</span>
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-2 text-left text-red-400 hover:bg-red-600/20 transition-colors flex items-center gap-3"
                  >
                    <span>🔒</span>
                    <span>Wyloguj się</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
