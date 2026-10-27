import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { generateInitials } from '@al/shared';

const SettingsPage = () => {
  const { user, logout } = useAuthStore();
  const [activeSection, setActiveSection] = useState('profile');
  const [isLoading, setIsLoading] = useState(false);

  const sections = [
    { id: 'profile', label: 'Profil', icon: '👤' },
    { id: 'appearance', label: 'Wygląd', icon: '🎨' },
    { id: 'ai', label: 'Dostawcy AI', icon: '🤖' },
    { id: 'notifications', label: 'Powiadomienia', icon: '🔔' },
    { id: 'privacy', label: 'Prywatność', icon: '🔒' },
    { id: 'about', label: 'O programie', icon: 'ℹ️' },
  ];

  const handleLogout = async () => {
    if (window.confirm('Czy na pewno chcesz się wylogować?')) {
      setIsLoading(true);
      try {
        await logout();
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-primary-50">Ustawienia</h1>
        <p className="text-primary-400 mt-1">Konfiguracja AL Assistant</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-1">
          <nav className="bg-primary-800 rounded-xl p-4">
            <ul className="space-y-2">
              {sections.map((section) => (
                <li key={section.id}>
                  <button
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center gap-3 ${
                      activeSection === section.id
                        ? 'bg-accent-600/20 text-accent-500'
                        : 'text-primary-300 hover:bg-primary-700 hover:text-primary-50'
                    }`}
                  >
                    <span>{section.icon}</span>
                    <span className="font-medium">{section.label}</span>
                  </button>
                </li>
              ))}
            </ul>
            
            <div className="mt-6 pt-4 border-t border-primary-700">
              <button
                onClick={handleLogout}
                disabled={isLoading}
                className="w-full text-left px-4 py-3 rounded-lg text-red-400 hover:bg-red-600/20 transition-colors flex items-center gap-3 disabled:opacity-50"
              >
                <span>🔒</span>
                <span className="font-medium">Wyloguj się</span>
              </button>
            </div>
          </nav>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          <div className="card">
            {activeSection === 'profile' && (
              <ProfileSection user={user} />
            )}
            {activeSection === 'appearance' && (
              <AppearanceSection />
            )}
            {activeSection === 'ai' && (
              <AISection />
            )}
            {activeSection === 'notifications' && (
              <NotificationsSection />
            )}
            {activeSection === 'privacy' && (
              <PrivacySection />
            )}
            {activeSection === 'about' && (
              <AboutSection />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

interface ProfileSectionProps {
  user: {
    id: string;
    email: string;
    name?: string;
    createdAt: Date;
  } | null;
}

const ProfileSection = ({ user }: ProfileSectionProps) => {
  const [name, setName] = useState(user?.name || '');
  const [email] = useState(user?.email || '');
  const [isEditing, setIsEditing] = useState(false);

  const handleSave = () => {
    // TODO: Implement profile update
    setIsEditing(false);
  };

  return (
    <div>
      <h2 className="text-lg font-semibold text-primary-50 mb-4">Profil</h2>
      
      <div className="flex items-center gap-6 mb-6">
        <div className="w-20 h-20 bg-accent-600 rounded-full flex items-center justify-center">
          <span className="text-3xl font-bold text-white">
            {user ? generateInitials(user.name || user.email) : '?'}
          </span>
        </div>
        <button className="btn btn-secondary text-sm">
          Zmień awatar
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-primary-300 mb-2">
            Imię i nazwisko
          </label>
          {isEditing ? (
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input"
            />
          ) : (
            <div className="px-4 py-3 bg-primary-800 rounded-lg text-primary-50">
              {name || 'Nie podano'}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-primary-300 mb-2">
            Adres e-mail
          </label>
          <div className="px-4 py-3 bg-primary-800 rounded-lg text-primary-50">
            {email}
          </div>
          <p className="text-xs text-primary-400 mt-1">
            Adres e-mail nie może zostać zmieniony
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-primary-300 mb-2">
            Data utworzenia konta
          </label>
          <div className="px-4 py-3 bg-primary-800 rounded-lg text-primary-50">
            {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('pl-PL') : 'N/A'}
          </div>
        </div>

        {isEditing ? (
          <div className="flex gap-4 pt-4">
            <button onClick={handleSave} className="btn btn-primary">
              Zapisz
            </button>
            <button onClick={() => setIsEditing(false)} className="btn btn-secondary">
              Anuluj
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            className="btn btn-ghost mt-4"
          >
            Edytuj profil
          </button>
        )}
      </div>
    </div>
  );
};

const AppearanceSection = () => {
  const [theme, setTheme] = useState<'dark' | 'light' | 'system'>('dark');
  const [language, setLanguage] = useState('pl');

  return (
    <div>
      <h2 className="text-lg font-semibold text-primary-50 mb-4">Wygląd</h2>
      
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-primary-300 mb-2">
            Motyw kolorystyczny
          </label>
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => setTheme('dark')}
              className={`p-4 rounded-lg transition-colors border-2 ${
                theme === 'dark' 
                  ? 'border-accent-500 bg-accent-600/20' 
                  : 'border-primary-700 hover:border-primary-600'
              }`}
            >
              <div className="w-12 h-8 bg-primary-900 rounded mb-2" />
              <span className="text-sm">Ciemny</span>
            </button>
            <button
              onClick={() => setTheme('light')}
              className={`p-4 rounded-lg transition-colors border-2 ${
                theme === 'light' 
                  ? 'border-accent-500 bg-accent-600/20' 
                  : 'border-primary-700 hover:border-primary-600'
              }`}
            >
              <div className="w-12 h-8 bg-white rounded mb-2" />
              <span className="text-sm">Jasny</span>
            </button>
            <button
              onClick={() => setTheme('system')}
              className={`p-4 rounded-lg transition-colors border-2 ${
                theme === 'system' 
                  ? 'border-accent-500 bg-accent-600/20' 
                  : 'border-primary-700 hover:border-primary-600'
              }`}
            >
              <div className="w-12 h-8 bg-gradient-to-r from-primary-900 to-white rounded mb-2" />
              <span className="text-sm">System</span>
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-primary-300 mb-2">
            Język
          </label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="input"
          >
            <option value="pl">Polski</option>
            <option value="en">English</option>
            <option value="de">Deutsch</option>
          </select>
        </div>
      </div>
    </div>
  );
};

const AISection = () => {
  const [providers, setProviders] = useState<{
    id: string;
    name: string;
    type: string;
    isActive: boolean;
    isVerified: boolean;
  }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Mock data for now
  useEffect(() => {
    setIsLoading(true);
    // TODO: Fetch from API
    setTimeout(() => {
      setProviders([
        { id: '1', name: 'Mistral AI', type: 'mistral', isActive: true, isVerified: true },
        { id: '2', name: 'Groq', type: 'groq', isActive: false, isVerified: false },
      ]);
      setIsLoading(false);
    }, 500);
  }, []);

  return (
    <div>
      <h2 className="text-lg font-semibold text-primary-50 mb-4">Dostawcy AI</h2>
      
      <p className="text-primary-400 text-sm mb-6">
        Zarządzaj swoimi kluczami API dla różnych dostawców sztucznej inteligencji.
      </p>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <span className="spinner h-8 w-8 border-3" />
        </div>
      ) : (
        <div className="space-y-4">
          {providers.length === 0 ? (
            <div className="empty-state py-8">
              <div className="empty-state-icon text-4xl">🤖</div>
              <div className="empty-state-title">Brak dostawców AI</div>
              <div className="empty-state-description">
                Dodaj swojego pierwszego dostawcę, aby rozpocząć korzystanie z AI.
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {providers.map((provider) => (
                <div
                  key={provider.id}
                  className="p-4 bg-primary-800 rounded-lg border border-primary-700"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-accent-600/20 rounded-lg flex items-center justify-center">
                        <span className="text-accent-500 font-bold">{provider.type.charAt(0)}</span>
                      </div>
                      <div>
                        <div className="font-semibold text-primary-50">{provider.name}</div>
                        <div className="text-sm text-primary-400">{provider.type}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {provider.isVerified && (
                        <span className="badge badge-success">Zweryfikowany</span>
                      )}
                      {provider.isActive && (
                        <span className="badge badge-info">Aktywny</span>
                      )}
                      <button className="p-2 text-primary-400 hover:text-primary-50">
                        ⚙️
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-primary-700">
            <button className="btn btn-secondary w-full">
              + Dodaj dostawcę AI
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const NotificationsSection = () => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);

  return (
    <div>
      <h2 className="text-lg font-semibold text-primary-50 mb-4">Powiadomienia</h2>
      
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <label className="block text-sm font-medium text-primary-300 mb-1">
              Powiadomienia dźwiękowe
            </label>
            <p className="text-xs text-primary-400">
              Odtwarzaj dźwięk dla nowych wiadomości
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={soundEnabled}
              onChange={(e) => setSoundEnabled(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-primary-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent-600" />
          </label>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <label className="block text-sm font-medium text-primary-300 mb-1">
              Powiadomienia przeglądarkowe
            </label>
            <p className="text-xs text-primary-400">
              Zezwól na powiadomienia systemowe
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={notificationsEnabled}
              onChange={(e) => setNotificationsEnabled(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-primary-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent-600" />
          </label>
        </div>
      </div>
    </div>
  );
};

const PrivacySection = () => {
  return (
    <div>
      <h2 className="text-lg font-semibold text-primary-50 mb-4">Prywatność</h2>
      
      <div className="space-y-6">
        <div>
          <h3 className="text-sm font-semibold text-primary-300 mb-2">Dane osobowe</h3>
          <p className="text-sm text-primary-400">
            Twoje dane osobowe są bezpiecznie przechowywane i nie są udostępniane osobom trzecim.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-primary-300 mb-2">Historia czatu</h3>
          <p className="text-sm text-primary-400">
            Wszystkie konwersacje są zapisywanie i przechowywane lokalnie na Twoim urządzeniu.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-primary-300 mb-2">Klucze API</h3>
          <p className="text-sm text-primary-400">
            Klucze API są szyfrowane i przechowywane bezpiecznie. Nigdy nie opuszczają Twojego urządzenia.
          </p>
        </div>

        <div className="pt-4">
          <button className="btn btn-danger text-sm">
            Usuń wszystkie dane
          </button>
          <p className="text-xs text-primary-500 mt-2">
            Ta akcja jest nieodwracalna i usunie wszystkie Twoje dane.
          </p>
        </div>
      </div>
    </div>
  );
};

const AboutSection = () => {
  return (
    <div>
      <h2 className="text-lg font-semibold text-primary-50 mb-4">O programie</h2>
      
      <div className="space-y-6">
        <div className="text-center">
          <div className="w-20 h-20 bg-accent-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl font-bold text-white">AL</span>
          </div>
          <h3 className="text-xl font-bold text-primary-50">AL Assistant</h3>
          <p className="text-primary-400">Osobisty Asystent AI dla Axela</p>
          <p className="text-sm text-primary-500 mt-2">Wersja 1.0.0</p>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-primary-300 mb-2">Funkcje</h3>
          <ul className="text-sm text-primary-400 space-y-1">
            <li>• Inteligentne konwersacje z AI</li>
            <li>• Obsługa wielu dostawców AI (Mistral, Groq, OpenRouter)</li>
            <li>• Zarządzanie projektami i zadaniami</li>
            <li>• Globalna pamięć kontekstowa</li>
            <li>• Przeszukiwanie historii i dokumentów</li>
            <li>• PWA - Instalowalna jako aplikacja mobilna</li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-primary-300 mb-2">Technologie</h3>
          <div className="flex flex-wrap gap-2">
            <span className="badge badge-info">React</span>
            <span className="badge badge-info">TypeScript</span>
            <span className="badge badge-info">Vite</span>
            <span className="badge badge-info">Hono</span>
            <span className="badge badge-info">Drizzle ORM</span>
            <span className="badge badge-info">Tailwind CSS</span>
            <span className="badge badge-info">Zustand</span>
          </div>
        </div>

        <div className="text-center">
          <p className="text-sm text-primary-500">
            Zbudowany z pasją dla Axela 🎵
          </p>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
