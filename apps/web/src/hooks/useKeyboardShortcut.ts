import { useEffect, useCallback } from 'react';

/**
 * Custom hook for handling keyboard shortcuts
 */
export function useKeyboardShortcut(
  keys: string | string[],
  callback: () => void,
  options: {
    ctrlKey?: boolean;
    shiftKey?: boolean;
    altKey?: boolean;
    metaKey?: boolean;
    preventDefault?: boolean;
  } = {}
): void {
  const {
    ctrlKey = false,
    shiftKey = false,
    altKey = false,
    metaKey = false,
    preventDefault = true,
  } = options;

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const pressedKeys = Array.isArray(keys) ? keys : [keys];
      const keyPressed = pressedKeys.some(key => event.key === key);

      if (keyPressed &&
          event.ctrlKey === ctrlKey &&
          event.shiftKey === shiftKey &&
          event.altKey === altKey &&
          event.metaKey === metaKey) {
        if (preventDefault) {
          event.preventDefault();
        }
        callback();
      }
    },
    [keys, callback, ctrlKey, shiftKey, altKey, metaKey, preventDefault]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
}

/**
 * Predefined shortcut hooks
 */

export function useCtrlS(callback: () => void): void {
  useKeyboardShortcut('s', callback, { ctrlKey: true, preventDefault: true });
}

export function useCtrlEnter(callback: () => void): void {
  useKeyboardShortcut('Enter', callback, { ctrlKey: true, preventDefault: true });
}

export function useEscape(callback: () => void): void {
  useKeyboardShortcut('Escape', callback, { preventDefault: false });
}

export function useEnter(callback: () => void): void {
  useKeyboardShortcut('Enter', callback, { preventDefault: true });
}

export function useArrowUp(callback: () => void): void {
  useKeyboardShortcut('ArrowUp', callback, { preventDefault: true });
}

export function useArrowDown(callback: () => void): void {
  useKeyboardShortcut('ArrowDown', callback, { preventDefault: true });
}

export function useCmdK(callback: () => void): void {
  useKeyboardShortcut('k', callback, { metaKey: true, preventDefault: true });
}

export function useCtrlK(callback: () => void): void {
  useKeyboardShortcut('k', callback, { ctrlKey: true, preventDefault: true });
}
