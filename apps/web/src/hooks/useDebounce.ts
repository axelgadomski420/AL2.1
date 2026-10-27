import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook for debouncing a value
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Custom hook for debouncing a function
 */
export function useDebouncedCallback<T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay: number
): (...args: Parameters<T>) => void {
  const [timer, setTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  const debouncedFn = useCallback(
    (...args: Parameters<T>) => {
      if (timer) {
        clearTimeout(timer);
      }
      setTimer(
        setTimeout(() => {
          callback(...args);
        }, delay)
      );
    },
    [callback, delay, timer]
  );

  useEffect(() => {
    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [timer]);

  return debouncedFn;
}

/**
 * Custom hook for throttling a function
 */
export function useThrottle<T extends (...args: unknown[]) => unknown>(
  callback: T,
  limit: number
): (...args: Parameters<T>) => ReturnType<T> | undefined {
  const [inThrottle, setInThrottle] = useState(false);

  const throttledFn = useCallback(
    (...args: Parameters<T>) => {
      if (!inThrottle) {
        const result = callback(...args);
        setInThrottle(true);
        setTimeout(() => setInThrottle(false), limit);
        return result;
      }
      return undefined;
    },
    [callback, inThrottle, limit]
  );

  return throttledFn;
}
