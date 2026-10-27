import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  name?: string;
  createdAt: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthActions {
  setUser: (user: User, token: string) => void;
  clearUser: () => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, name?: string) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

type AuthStore = AuthState & AuthActions;

const API_BASE = import.meta.env.VITE_API_URL || '/api';

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // State
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: true,
      error: null,

      // Actions
      setUser: (user, token) => {
        set({
          user,
          token,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
      },

      clearUser: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });
      },

      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error, isLoading: false }),

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
          });

          if (!response.ok) {
            const error = await response.json();
            set({ error: error.message || 'Błąd logowania', isLoading: false });
            return false;
          }

          const { user, token } = await response.json();
          get().setUser(user, token);
          return true;
        } catch (err) {
          set({ error: 'Błąd połączenia z serwerem', isLoading: false });
          return false;
        }
      },

      register: async (email: string, password: string, name?: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch(`${API_BASE}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, name }),
          });

          if (!response.ok) {
            const error = await response.json();
            set({ error: error.message || 'Błąd rejestracji', isLoading: false });
            return false;
          }

          const { user, token } = await response.json();
          get().setUser(user, token);
          return true;
        } catch (err) {
          set({ error: 'Błąd połączenia z serwerem', isLoading: false });
          return false;
        }
      },

      logout: async () => {
        set({ isLoading: true });
        try {
          const { token } = get();
          if (token) {
            await fetch(`${API_BASE}/auth/logout`, {
              method: 'POST',
              headers: { Authorization: `Bearer ${token}` },
            });
          }
        } catch (err) {
          // Ignore logout errors
        } finally {
          get().clearUser();
        }
      },

      checkAuth: async () => {
        set({ isLoading: true });
        try {
          const { token } = get();
          if (!token) {
            set({ isLoading: false });
            return;
          }

          const response = await fetch(`${API_BASE}/auth/me`, {
            method: 'GET',
            headers: { Authorization: `Bearer ${token}` },
          });

          if (!response.ok) {
            get().clearUser();
            return;
          }

          const { user } = await response.json();
          set({ user, isAuthenticated: true, isLoading: false });
        } catch (err) {
          get().clearUser();
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
