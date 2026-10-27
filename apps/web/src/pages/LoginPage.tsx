import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { z } from 'zod';
import { LoginSchema, RegisterSchema } from '@al/shared';

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, login, register, isLoading, error, clearError } = useAuthStore();
  
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    confirmPassword: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/chat';
      navigate(from, { replace: true });
    }
  }, [user, navigate, location]);

  // Clear error on mode change
  useEffect(() => {
    clearError();
    setFormErrors({});
    setFormData({
      email: '',
      password: '',
      name: '',
      confirmPassword: '',
    });
  }, [isLoginMode, clearError]);

  // Clear error when form changes
  useEffect(() => {
    if (error) {
      clearError();
    }
  }, [formData, clearError, error]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = (): boolean => {
    const schema = isLoginMode ? LoginSchema : RegisterSchema;
    const result = schema.safeParse(formData);
    
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.errors.forEach(err => {
        const path = err.path[0] as string;
        errors[path] = err.message;
      });
      setFormErrors(errors);
      return false;
    }
    
    setFormErrors({});
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      let success;
      if (isLoginMode) {
        success = await login(formData.email, formData.password);
      } else {
        success = await register(formData.email, formData.password, formData.name);
      }

      if (success) {
        const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/chat';
        navigate(from, { replace: true });
      }
    } catch (err) {
      // Error is handled by the store
    }
  };

  const toggleMode = () => {
    setIsLoginMode(!isLoginMode);
    clearError();
  };

  return (
    <div className="min-h-screen bg-primary-900 flex flex-col">
      {/* Header */}
      <header className="p-6">
        <div className="max-w-md mx-auto text-center">
          <div className="w-20 h-20 bg-accent-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl font-bold text-white">AL</span>
          </div>
          <h1 className="text-2xl font-bold text-primary-50">AL</h1>
          <p className="text-primary-400 mt-1">Osobisty Asystent AI dla Axela</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-6">
        <div className="max-w-md mx-auto w-full">
          {/* Form Card */}
          <div className="card bg-primary-800/50 border-primary-700">
            <div className="flex gap-4 mb-6">
              <button
                type="button"
                onClick={() => setIsLoginMode(true)}
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
                  isLoginMode
                    ? 'bg-accent-600/20 text-accent-500'
                    : 'text-primary-400 hover:bg-primary-700/50'
                }`}
              >
                Logowanie
              </button>
              <button
                type="button"
                onClick={() => setIsLoginMode(false)}
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
                  !isLoginMode
                    ? 'bg-accent-600/20 text-accent-500'
                    : 'text-primary-400 hover:bg-primary-700/50'
                }`}
              >
                Rejestracja
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Error Message */}
              {error && (
                <div className="p-4 bg-red-600/20 border border-red-500 rounded-lg">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              {/* Name Field (Register only) */}
              {!isLoginMode && (
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-primary-300 mb-2">
                    Imię i nazwisko
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Axel"
                    className={`input ${formErrors.name ? 'input-error' : ''}`}
                    disabled={isLoading}
                  />
                  {formErrors.name && (
                    <p className="mt-1 text-sm text-red-400">{formErrors.name}</p>
                  )}
                </div>
              )}

              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-primary-300 mb-2">
                  Adres e-mail
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="axel@example.com"
                  autoComplete="email"
                  className={`input ${formErrors.email ? 'input-error' : ''}`}
                  disabled={isLoading}
                />
                {formErrors.email && (
                  <p className="mt-1 text-sm text-red-400">{formErrors.email}</p>
                )}
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-primary-300 mb-2">
                  Hasło
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder={isLoginMode ? 'Wpisz hasło' : 'Min. 8 znaków'}
                    autoComplete={isLoginMode ? 'current-password' : 'new-password'}
                    className={`input ${formErrors.password ? 'input-error' : ''} pr-12`}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-primary-400 hover:text-primary-50"
                    aria-label={showPassword ? 'Ukryj hasło' : 'Pokaż hasło'}
                  >
                    {showPassword ? '👁️' : '🔒'}
                  </button>
                </div>
                {formErrors.password && (
                  <p className="mt-1 text-sm text-red-400">{formErrors.password}</p>
                )}
              </div>

              {/* Confirm Password Field (Register only) */}
              {!isLoginMode && (
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-primary-300 mb-2">
                    Powtórz hasło
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Powtórz hasło"
                    autoComplete="new-password"
                    className={`input ${formErrors.confirmPassword ? 'input-error' : ''}`}
                    disabled={isLoading}
                  />
                  {formErrors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-400">{formErrors.confirmPassword}</p>
                  )}
                </div>
              )}

              {/* Remember Me (Login only) */}
              {isLoginMode && (
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-primary-600 bg-primary-800 text-accent-500 focus:ring-accent-500"
                    disabled={isLoading}
                  />
                  <span className="text-sm text-primary-300">Zapamiętaj mnie</span>
                </label>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="btn btn-primary w-full py-3 text-lg font-semibold"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="spinner h-5 w-5 border-2" />
                    {isLoginMode ? 'Logowanie...' : 'Rejestrowanie...'}
                  </span>
                ) : isLoginMode ? (
                  'Zaloguj się'
                ) : (
                  'Zarejestruj się'
                )}
              </button>
            </form>

            {/* Toggle Mode */}
            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={toggleMode}
                className="text-primary-400 hover:text-primary-50 transition-colors"
              >
                {isLoginMode ? 'Nie masz konta? Zarejestruj się' : 'Masz już konto? Zaloguj się'}
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-sm text-primary-500">
              AL Assistant v{import.meta.env.VITE_APP_VERSION || '1.0.0'}
            </p>
            <p className="text-xs text-primary-600 mt-2">
              <Link to="/" className="hover:text-primary-400">Polityka prywatności</Link>
              {' · '}
              <Link to="/" className="hover:text-primary-400">Regulamin</Link>
            </p>
          </div>
        </div>
      </main>

      {/* Background Pattern */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-900 via-primary-800 to-primary-900" />
        <div className="absolute opacity-5" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '60px 60px',
        }} />
      </div>
    </div>
  );
};

export default LoginPage;
