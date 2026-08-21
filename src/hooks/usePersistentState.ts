import { useEffect, useState } from 'react';

export function usePersistentState<T>(
  key: string,
  initialValue: T | (() => T)
) {
  const [state, setState] = useState<T>(() => {
    const fallback = typeof initialValue === 'function'
      ? (initialValue as () => T)()
      : initialValue;

    if (typeof window === 'undefined') {
      return fallback;
    }

    try {
      const storedValue = window.localStorage.getItem(key);
      return storedValue ? (JSON.parse(storedValue) as T) : fallback;
    } catch {
      return fallback;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(state));
    } catch {
      // ignore storage write failures
    }
  }, [key, state]);

  return [state, setState] as const;
}
