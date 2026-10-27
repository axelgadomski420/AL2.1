import { v4 as uuidv4 } from 'uuid';

// UUID utilities
export const generateId = (): string => uuidv4();

// Date utilities
export const now = (): Date => new Date();

export const toISO = (date: Date): string => date.toISOString();

export const fromISO = (dateString: string): Date => new Date(dateString);

export const formatDate = (date: Date, locale = 'pl-PL'): string => {
  return date.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const formatDateTime = (date: Date, locale = 'pl-PL'): string => {
  return date.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatRelativeTime = (date: Date, locale = 'pl-PL'): string => {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return `${diffInSeconds}s temu`;
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m temu`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}h temu`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays}d temu`;
  }

  return formatDate(date, locale);
};

export const isToday = (date: Date): boolean => {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
};

export const isYesterday = (date: Date): boolean => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return (
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear()
  );
};

// String utilities
export const truncate = (str: string, length: number): string => {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
};

export const capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export const capitalizeWords = (str: string): string => {
  return str.split(' ').map(capitalize).join(' ');
};

export const slugify = (str: string): string => {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

export const escapeHtml = (str: string): string => {
  const htmlEntities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };
  return str.replace(/[&<>"']/g, (char) => htmlEntities[char]);
};

export const sanitizeHtml = (str: string): string => {
  return str.replace(/<[^>]*>/g, '');
};

export const stripMarkdown = (str: string): string => {
  return str
    .replace(/^[\s\n\r]*|[\s\n\r]*$/g, '')
    .replace(/^#+\s+/gm, '')
    .replace(/^>\s+/gm, '')
    .replace(/^`+|`+$/g, '')
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/_/g, '')
    .replace(/!\\[([^\]]+)\\]\\(([^)]+)\\)/g, '$1')
    .replace(/\[([^\]]+)\\]\\(([^)]+)\\)/g, '$1');
};

export const countWords = (str: string): number => {
  return str.trim().split(/\s+/).filter(Boolean).length;
};

export const countTokens = (str: string): number => {
  // Simple token counting approximation (4 characters ~ 1 token)
  return Math.ceil(str.length / 4);
};

export const generateInitials = (name: string): string => {
  const words = name.trim().split(/\s+/);
  if (words.length === 0) return '?';
  if (words.length === 1) return words[0].charAt(0).toUpperCase();
  return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
};

// Number utilities
export const formatNumber = (num: number, locale = 'pl-PL'): string => {
  return num.toLocaleString(locale);
};

export const formatBytes = (bytes: number, decimals = 2): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

export const formatPercentage = (value: number, decimals = 1): string => {
  return `${value.toFixed(decimals)}%`;
};

// Array utilities
export const chunk = <T>(array: T[], size: number): T[][] => {
  const result: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
};

export const groupBy = <T, K extends keyof T>(array: T[], key: K): Record<string, T[]> => {
  return array.reduce((acc, item) => {
    const groupKey = String(item[key]);
    if (!acc[groupKey]) {
      acc[groupKey] = [];
    }
    acc[groupKey].push(item);
    return acc;
  }, {} as Record<string, T[]>);
};

export const uniqueBy = <T, K extends keyof T>(array: T[], key: K): T[] => {
  const seen = new Set<string>();
  return array.filter((item) => {
    const keyValue = String(item[key]);
    if (seen.has(keyValue)) {
      return false;
    }
    seen.add(keyValue);
    return true;
  });
};

export const shuffle = <T>(array: T[]): T[] => {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

// Object utilities
export const deepClone = <T>(obj: T): T => {
  return JSON.parse(JSON.stringify(obj));
};

export const deepMerge = <T extends Record<string, unknown>, U extends Record<string, unknown>>(
  target: T,
  source: U
): T & U => {
  const result = { ...target };
  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      const sourceValue = source[key];
      const targetValue = result[key];

      if (
        sourceValue !== null &&
        typeof sourceValue === 'object' &&
        !Array.isArray(sourceValue) &&
        targetValue !== null &&
        typeof targetValue === 'object' &&
        !Array.isArray(targetValue)
      ) {
        result[key] = deepMerge(
          targetValue as Record<string, unknown>,
          sourceValue as Record<string, unknown>
        ) as unknown;
      } else {
        result[key] = sourceValue as unknown;
      }
    }
  }
  return result as T & U;
};

export const pick = <T extends Record<string, unknown>, K extends keyof T>(
  obj: T,
  keys: K[]
): Pick<T, K> => {
  const result = {} as Pick<T, K>;
  for (const key of keys) {
    if (obj[key] !== undefined) {
      result[key] = obj[key];
    }
  }
  return result;
};

export const omit = <T extends Record<string, unknown>, K extends keyof T>(
  obj: T,
  keys: K[]
): Omit<T, K> => {
  const result = { ...obj };
  for (const key of keys) {
    delete result[key];
  }
  return result as Omit<T, K>;
};

// URL utilities
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const getDomain = (url: string): string => {
  try {
    return new URL(url).hostname;
  } catch {
    return '';
  }
};

export const getPathname = (url: string): string => {
  try {
    return new URL(url).pathname;
  } catch {
    return '';
  }
};

export const joinUrl = (base: string, path: string): string => {
  const baseUrl = new URL(base);
  const pathUrl = new URL(path, base);
  return pathUrl.href;
};

export const addQueryParams = (url: string, params: Record<string, string | number | boolean>): string => {
  const urlObj = new URL(url);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      urlObj.searchParams.set(key, String(value));
    }
  }
  return urlObj.href;
};

// File utilities
export const getFileExtension = (filename: string): string => {
  return filename.slice((filename.lastIndexOf('.') + 1 || filename.length) - filename.length);
};

export const getFileNameWithoutExtension = (filename: string): string => {
  return filename.replace(/\.[^.]*$/, '');
};

export const getFileType = (mimeType: string): 'text' | 'image' | 'audio' | 'video' | 'other' => {
  if (mimeType.startsWith('text/') || mimeType.startsWith('application/json') || mimeType.startsWith('application/javascript')) {
    return 'text';
  }
  if (mimeType.startsWith('image/')) {
    return 'image';
  }
  if (mimeType.startsWith('audio/')) {
    return 'audio';
  }
  if (mimeType.startsWith('video/')) {
    return 'video';
  }
  return 'other';
};

// Color utilities
export const lightenColor = (color: string, amount: number): string => {
  // Simple implementation for hex colors
  if (!color.startsWith('#')) return color;
  
  const num = parseInt(color.replace('#', ''), 16);
  const r = Math.min(255, (num >> 16) + amount);
  const g = Math.min(255, ((num >> 8) & 0x00ff) + amount);
  const b = Math.min(255, (num & 0x0000ff) + amount);
  
  return `#${(r * 256 * 256 + g * 256 + b).toString(16).padStart(6, '0')}`;
};

export const darkenColor = (color: string, amount: number): string => {
  if (!color.startsWith('#')) return color;
  
  const num = parseInt(color.replace('#', ''), 16);
  const r = Math.max(0, (num >> 16) - amount);
  const g = Math.max(0, ((num >> 8) & 0x00ff) - amount);
  const b = Math.max(0, (num & 0x0000ff) - amount);
  
  return `#${(r * 256 * 256 + g * 256 + b).toString(16).padStart(6, '0')}`;
};

// Storage utilities
export const getFromStorage = <T>(key: string, defaultValue?: T): T | undefined => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
};

export const setToStorage = <T>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    console.error('Failed to save to localStorage');
  }
};

export const removeFromStorage = (key: string): void => {
  try {
    localStorage.removeItem(key);
  } catch {
    console.error('Failed to remove from localStorage');
  }
};

export const clearStorage = (): void => {
  try {
    localStorage.clear();
  } catch {
    console.error('Failed to clear localStorage');
  }
};

// Session Storage utilities
export const getFromSessionStorage = <T>(key: string, defaultValue?: T): T | undefined => {
  try {
    const item = sessionStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
};

export const setToSessionStorage = <T>(key: string, value: T): void => {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    console.error('Failed to save to sessionStorage');
  }
};

// Debounce utility
export const debounce = <F extends (...args: Parameters<F>) => ReturnType<F>>(
  func: F,
  wait: number
): (...args: Parameters<F>) => void => {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<F>) => {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Throttle utility
export const throttle = <F extends (...args: Parameters<F>) => ReturnType<F>>(
  func: F,
  limit: number
): (...args: Parameters<F>) => ReturnType<F> | undefined => {
  let inThrottle = false;

  return (...args: Parameters<F>) => {
    if (!inThrottle) {
      inThrottle = true;
      const result = func(...args);
      setTimeout(() => (inThrottle = false), limit);
      return result;
    }
    return undefined;
  };
};

// Retry utility
export const retry = async <T>(
  operation: () => Promise<T>,
  options: {
    maxRetries?: number;
    delay?: number;
    backoff?: number;
    shouldRetry?: (error: unknown) => boolean;
  } = {}
): Promise<T> => {
  const {
    maxRetries = 3,
    delay = 1000,
    backoff = 2,
    shouldRetry = () => true,
  } = options;

  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt === maxRetries || !shouldRetry(error)) {
        throw error;
      }
      const waitTime = delay * Math.pow(backoff, attempt);
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }
  }

  throw lastError;
};

// Timeout utility
export const timeout = <T>(promise: Promise<T>, ms: number): Promise<T> => {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Operation timed out after ${ms}ms`));
    }, ms);

    promise
      .then((result) => {
        clearTimeout(timer);
        resolve(result);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
};

// Sleep utility
export const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

// Generate random string
export const randomString = (length: number): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Generate secure random string
export const secureRandomString = (length: number): string => {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => ('0' + byte.toString(16)).slice(-2)).join('');
};

// Hash string (simple, not for security)
export const simpleHash = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
};

// Check if value is empty
export const isEmpty = (value: unknown): boolean => {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
};

// Safe JSON parse
export const safeJsonParse = <T>(json: string, defaultValue?: T): T | undefined => {
  try {
    return JSON.parse(json) as T;
  } catch {
    return defaultValue;
  }
};

// Safe JSON stringify
export const safeJsonStringify = (obj: unknown, defaultValue = '{}'): string => {
  try {
    return JSON.stringify(obj);
  } catch {
    return defaultValue;
  }
};

// Get environment variable with fallback
export const getEnv = (key: string, fallback?: string): string => {
  const value = import.meta.env[key];
  if (value === undefined || value === null || value === '') {
    return fallback || '';
  }
  return value as string;
};

// Check if running in browser
export const isBrowser = (): boolean => {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
};

// Check if running in Node.js
export const isNode = (): boolean => {
  return typeof process !== 'undefined' && process.versions != null && process.versions.node != null;
};

// Check if running in mobile app (Capacitor)
export const isMobileApp = (): boolean => {
  return isBrowser() && (window as unknown as { Capacitor?: unknown }).Capacitor !== undefined;
};

// Check if running in iOS
export const isIOS = (): boolean => {
  return isBrowser() && /iPad|iPhone|iPod/.test(navigator.userAgent);
};

// Check if running in Android
export const isAndroid = (): boolean => {
  return isBrowser() && /Android/.test(navigator.userAgent);
};

// Check if running in PWA
export const isPWA = (): boolean => {
  return isBrowser() && (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone);
};

// Check for reduced motion preference
export const prefersReducedMotion = (): boolean => {
  if (!isBrowser()) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

// Check for dark mode preference
export const prefersDarkMode = (): boolean => {
  if (!isBrowser()) return true; // Default to dark for AL
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
};

// Get system theme
export const getSystemTheme = (): 'dark' | 'light' => {
  return prefersDarkMode() ? 'dark' : 'light';
};

// Parse JWT token (without verification)
export const parseJwt = (token: string): Record<string, unknown> | null => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
};

// Check if JWT is expired
export const isJwtExpired = (token: string, leewayMs = 0): boolean => {
  const payload = parseJwt(token);
  if (!payload || typeof payload.exp !== 'number') return true;
  
  const exp = payload.exp * 1000; // Convert to milliseconds
  return Date.now() >= exp - leewayMs;
};

// Get JWT expiration time
export const getJwtExpiration = (token: string): Date | null => {
  const payload = parseJwt(token);
  if (!payload || typeof payload.exp !== 'number') return null;
  return new Date(payload.exp * 1000);
};
