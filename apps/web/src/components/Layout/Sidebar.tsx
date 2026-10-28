import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { generateInitials } from '@al/shared';

interface SidebarProps {
  onClose?: () => void;
  isMobile?: boolean;
}

const navItems = [
  { to: '/chat', icon: '💬', label: 'Czat' },
  { to: '/projects', icon: '📁', label: 'Projekty' },
  { to: '/memory', icon: '🧠', label: 'Pamięć' },
  { to: '/files', icon: '📄', label: 'Pliki' },
  { to: '/tasks', icon: '✅', label: 'Zadania' },
  { to: '/integrations', icon: '🔗', label: 'Integracje' },
  { to: '/settings', icon: '⚙️', label: 'Ustawienia' },
];

const Sidebar = ({ onClose, isMobile = false }: SidebarProps) => {
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    onClose?.();
  };

  return (
    <aside
      className={`
        h-full flex flex-col
        bg-primary-950 border-r border-primary-800/40
        ${isMobile ? 'w-full' : 'w-64'}
      `}
    >
      {/* === Główne menu – avatar AL === */}
      <div className="relative px-4 pt-5 pb-4 border-b border-primary-800/40">
        <div className="flex flex-col items-center text-center">
          {/* Avatar */}
          <div className="relative mb-3">
            <div className="w-20 h-20 rounded-2xl overflow-hidden ring-2 ring-accent-500/40 shadow-glow">
              <img
                src="/al-avatar.png"
                alt="AL"
                className="w-full h-full object-cover object-top"
                onError={(e) => {
                  // fallback gdy plik jeszcze nie leży lokalnie
                  (e.target as HTMLImageElement).src =
                    'https://i.ibb.co/N6jNxrdj/IMG-4438.png';
                }}
              />
            </div>
            {/* mała zielona kropka statusu */}
            <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-success-500 rounded-full border-2 border-primary-950" />
          </div>

          <div className="font-semibold text-primary-50 tracking-tight text-lg">
            AL
          </div>
          <div className="text-xs text-primary-400 mt-0.5">
            Asystent · Axel
          </div>
        </div>

        {isMobile && (
          <button
            onClick={onClose}
            className="absolute top-4 right-3 btn-icon text-primary-400 hover:text-primary-50"
            aria-label="Zamknij"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Nawigacja */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.to === '/chat'}
                onClick={onClose}
                className={({ isActive }) =>
                  `nav-item ${isActive ? 'nav-item-active' : ''}`
                }
              >
                <span className="text-lg leading-none w-6 text-center">{item.icon}</span>
                <span className="text-sm">{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Stopka użytkownika */}
      <div className="p-3 border-t border-primary-800/40 shrink-0">
        <div className="flex items-center gap-3 px-2 py-2 rounded-xl">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-accent-500 to-accent-700 flex items-center justify-center text-white text-sm font-semibold shrink-0">
            {user ? generateInitials(user.name || user.email) : '?'}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium text-primary-50 truncate">
              {user?.name || user?.email || 'Użytkownik'}
            </div>
            <div className="text-2xs text-primary-400 truncate">
              {user?.email}
            </div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="mt-1 w-full nav-item text-red-400/90 hover:text-red-400 hover:bg-red-500/10"
        >
          <span className="text-base w-6 text-center">↪</span>
          <span className="text-sm">Wyloguj</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
