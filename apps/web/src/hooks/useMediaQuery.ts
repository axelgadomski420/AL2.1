import { useState, useEffect } from 'react';

/**
 * Custom hook for tracking media query matches
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    
    // Update state with current match
    setMatches(mediaQuery.matches);

    // Listen for changes
    const handler = () => setMatches(mediaQuery.matches);
    mediaQuery.addEventListener('change', handler);

    return () => mediaQuery.removeEventListener('change', handler);
  }, [query]);

  return matches;
}

/**
 * Hook for checking if screen is mobile
 */
export function useIsMobile(): boolean {
  return useMediaQuery('(max-width: 768px)');
}

/**
 * Hook for checking if screen is tablet
 */
export function useIsTablet(): boolean {
  return useMediaQuery('(min-width: 769px) and (max-width: 1024px)');
}

/**
 * Hook for checking if screen is desktop
 */
export function useIsDesktop(): boolean {
  return useMediaQuery('(min-width: 1025px)');
}

/**
 * Hook for checking dark mode preference
 */
export function usePrefersDarkMode(): boolean {
  return useMediaQuery('(prefers-color-scheme: dark)');
}

/**
 * Hook for checking reduced motion preference
 */
export function usePrefersReducedMotion(): boolean {
  return useMediaQuery('(prefers-reduced-motion: reduce)');
}

/**
 * Hook for checking if running in PWA mode
 */
export function useIsPWA(): boolean {
  const [isPWA, setIsPWA] = useState(false);

  useEffect(() => {
    // Check if running as PWA
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const hasStandalone = window.navigator.standalone;
    setIsPWA(isStandalone || hasStandalone);
  }, []);

  return isPWA;
}

/**
 * Hook for checking if running in mobile app (Capacitor)
 */
export function useIsMobileApp(): boolean {
  const [isMobileApp, setIsMobileApp] = useState(false);

  useEffect(() => {
    // Check for Capacitor
    const isCapacitor = (window as unknown as { Capacitor?: unknown }).Capacitor !== undefined;
    setIsMobileApp(isCapacitor);
  }, []);

  return isMobileApp;
}
