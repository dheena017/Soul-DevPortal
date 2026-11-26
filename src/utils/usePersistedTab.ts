import { useCallback, useEffect, useState } from 'react';

export function usePersistedTab<T extends string>(
  storageKey: string,
  defaultTab: T,
  allowedTabs?: readonly T[]
): [T, (next: T) => void] {
  const readStored = useCallback((): T => {
    if (typeof window === 'undefined') return defaultTab;
    try {
      const saved = window.sessionStorage.getItem(storageKey) as T | null;
      if (saved && (!allowedTabs || allowedTabs.includes(saved))) {
        return saved;
      }
    } catch {
      // ignore storage errors
    }
    return defaultTab;
  }, [storageKey, defaultTab, allowedTabs]);

  const [tab, setTabState] = useState<T>(readStored);

  useEffect(() => {
    setTabState(readStored());
  }, [readStored]);

  const setTab = useCallback(
    (next: T) => {
      setTabState(next);
      try {
        window.sessionStorage.setItem(storageKey, next);
      } catch {
        // ignore storage errors
      }
    },
    [storageKey]
  );

  return [tab, setTab];
}
