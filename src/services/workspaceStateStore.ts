import { useCallback, useEffect, useRef, useState } from 'react';
import { API_BASE } from './api';

export type WorkspaceNamespace =
  | 'tasks'
  | 'notes'
  | 'habits'
  | 'bookmarks'
  | 'scratchpad'
  | 'focus'
  | 'expenses'
  | 'goals'
  | 'catalog'
  | 'schedule'
  | 'checklists';

function localStorageKey(namespace: WorkspaceNamespace): string {
  return `soul-human-${namespace}-v1`;
}

function localTimestampKey(namespace: WorkspaceNamespace): string {
  return `soul-human-${namespace}-ts-v1`;
}

function readLocalValue<T>(namespace: WorkspaceNamespace, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(localStorageKey(namespace));
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function readLocalTimestamp(namespace: WorkspaceNamespace): number {
  if (typeof window === 'undefined') return 0;
  try {
    const raw = window.localStorage.getItem(localTimestampKey(namespace));
    return raw ? Number(raw) || 0 : 0;
  } catch {
    return 0;
  }
}

function writeLocalValue<T>(namespace: WorkspaceNamespace, value: T, tsMs = Date.now()): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(localStorageKey(namespace), JSON.stringify(value));
    window.localStorage.setItem(localTimestampKey(namespace), String(tsMs));
  } catch {
    // ignore storage quota errors
  }
}

function pushStateToServer(namespace: WorkspaceNamespace, payload: unknown, keepalive = false): Promise<string | null> {
  return fetch(`${API_BASE}/workspace-tools/state/${namespace}`, {
    method: 'PUT',
    keepalive,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ data: payload }),
  })
    .then((r) => (r.ok ? r.json() : null))
    .then((res: { updatedAt?: string } | null) => res?.updatedAt || new Date().toISOString())
    .catch(() => null);
}

export interface SyncStatus {
  hydratedFromServer: boolean;
  saving: boolean;
  lastSavedAt: string | null;
}

const WORKSPACE_SYNC_EVENT = 'soul-workspace-state-sync';

interface WorkspaceSyncDetail {
  namespace: WorkspaceNamespace;
  data: unknown;
  sourceId: symbol;
}

function broadcastWorkspaceSync(namespace: WorkspaceNamespace, data: unknown, sourceId: symbol): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent<WorkspaceSyncDetail>(WORKSPACE_SYNC_EVENT, {
      detail: { namespace, data, sourceId },
    })
  );
}

/**
 * Dual-persistence React state hook backed by instant localStorage cache
 * and FastAPI SQLite WAL storage (/api/workspace-tools/state/{namespace}).
 * Always flushes pending writes on navigation/unmount and syncs live across mounted hook instances.
 */
export function useSyncedWorkspaceState<T>(
  namespace: WorkspaceNamespace,
  initialFallback: T | (() => T),
  debounceMs = 120
): [T, (updater: T | ((prev: T) => T)) => void, SyncStatus] {
  const [fallbackValue] = useState<T>(() =>
    typeof initialFallback === 'function'
      ? (initialFallback as () => T)()
      : initialFallback
  );

  const [value, setValue] = useState<T>(() => readLocalValue<T>(namespace, fallbackValue));
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    hydratedFromServer: false,
    saving: false,
    lastSavedAt: null,
  });

  const hookIdRef = useRef<symbol>(Symbol('workspace-hook'));
  const latestValueRef = useRef<T>(value);
  latestValueRef.current = value;

  const dirtyBeforeHydrateRef = useRef<boolean>(false);
  const saveTimerRef = useRef<number | null>(null);
  const pendingPayloadRef = useRef<{ hasPending: boolean; data: T }>({
    hasPending: false,
    data: value,
  });

  useEffect(() => {
    const onSiblingSync = (evt: Event) => {
      const detail = (evt as CustomEvent<WorkspaceSyncDetail>).detail;
      if (!detail || detail.namespace !== namespace || detail.sourceId === hookIdRef.current) return;
      const nextData = detail.data as T;
      latestValueRef.current = nextData;
      setValue(nextData);
    };
    window.addEventListener(WORKSPACE_SYNC_EVENT, onSiblingSync);
    return () => window.removeEventListener(WORKSPACE_SYNC_EVENT, onSiblingSync);
  }, [namespace]);

  useEffect(() => {
    let active = true;
    const localTsBeforeFetch = readLocalTimestamp(namespace);

    fetch(`${API_BASE}/workspace-tools/state/${namespace}`, {
      headers: { Accept: 'application/json' },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((res: { exists?: boolean; data?: T; updatedAt?: string } | null) => {
        if (!active) return;
        const serverTs = res?.updatedAt ? Date.parse(res.updatedAt) || 0 : 0;
        if (
          res &&
          res.exists &&
          res.data !== null &&
          res.data !== undefined &&
          !dirtyBeforeHydrateRef.current &&
          serverTs >= localTsBeforeFetch
        ) {
          latestValueRef.current = res.data;
          setValue(res.data);
          writeLocalValue(namespace, res.data, serverTs || Date.now());
          broadcastWorkspaceSync(namespace, res.data, hookIdRef.current);
          setSyncStatus({
            hydratedFromServer: true,
            saving: false,
            lastSavedAt: res.updatedAt || null,
          });
        } else {
          setSyncStatus((prev) => ({ ...prev, hydratedFromServer: true }));
          if (localTsBeforeFetch > serverTs && localTsBeforeFetch > 0) {
            void pushStateToServer(namespace, latestValueRef.current, false);
          }
        }
      })
      .catch(() => {
        if (active) {
          setSyncStatus((prev) => ({ ...prev, hydratedFromServer: true }));
        }
      });

    return () => {
      active = false;
      if (saveTimerRef.current !== null) {
        window.clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }
      if (pendingPayloadRef.current.hasPending) {
        pendingPayloadRef.current.hasPending = false;
        void pushStateToServer(namespace, pendingPayloadRef.current.data, true);
      }
    };
  }, [namespace]);

  const setSyncedValue = useCallback(
    (updater: T | ((prev: T) => T)) => {
      dirtyBeforeHydrateRef.current = true;
      const next =
        typeof updater === 'function'
          ? (updater as (p: T) => T)(latestValueRef.current)
          : updater;

      latestValueRef.current = next;
      writeLocalValue(namespace, next, Date.now());
      setValue(next);
      broadcastWorkspaceSync(namespace, next, hookIdRef.current);
      setSyncStatus((s) => ({ ...s, saving: true }));

      pendingPayloadRef.current = { hasPending: true, data: next };
      if (saveTimerRef.current !== null) {
        window.clearTimeout(saveTimerRef.current);
      }
      saveTimerRef.current = window.setTimeout(() => {
        saveTimerRef.current = null;
        if (!pendingPayloadRef.current.hasPending) return;
        const payload = pendingPayloadRef.current.data;
        pendingPayloadRef.current.hasPending = false;
        void pushStateToServer(namespace, payload, false).then((updatedAt) => {
          setSyncStatus((s) => ({
            ...s,
            saving: false,
            lastSavedAt: updatedAt || new Date().toISOString(),
          }));
        });
      }, debounceMs);
    },
    [namespace, debounceMs]
  );

  return [value, setSyncedValue, syncStatus];
}
