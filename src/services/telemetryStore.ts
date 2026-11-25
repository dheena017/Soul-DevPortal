import { useEffect, useSyncExternalStore } from 'react';
import { fetchBackendHealthStatus, fetchSystemLive } from './api';
import { SystemLiveSnapshot } from '../types';

export interface TelemetryStoreState {
  isBackendLive: boolean;
  backendPort: number;
  liveTelemetry: SystemLiveSnapshot | null;
}

let state: TelemetryStoreState = {
  isBackendLive: false,
  backendPort:
    typeof window !== 'undefined' && window.soulDesktop?.isDesktop ? 18008 : 8008,
  liveTelemetry: null,
};

const listeners = new Set<() => void>();
let subscribersCount = 0;
let healthTimer: number | undefined;
let liveTimer: number | undefined;

function emit() {
  listeners.forEach((fn) => fn());
}

async function pollHealth() {
  if (subscribersCount <= 0) return;
  if (typeof document !== 'undefined' && document.hidden) {
    healthTimer = window.setTimeout(pollHealth, 5000);
    return;
  }
  const health = await fetchBackendHealthStatus();
  if (subscribersCount <= 0) return;
  const changed =
    state.isBackendLive !== health.live ||
    (health.port ? state.backendPort !== health.port : false);
  if (changed) {
    state = {
      ...state,
      isBackendLive: health.live,
      backendPort: health.port || state.backendPort,
    };
    emit();
    if (health.live && liveTimer === undefined) {
      void pollLive();
    }
  }
  healthTimer = window.setTimeout(pollHealth, health.live ? 15000 : 2000);
}

async function pollLive() {
  if (subscribersCount <= 0) return;
  if (!state.isBackendLive) {
    liveTimer = undefined;
    return;
  }
  if (typeof document === 'undefined' || !document.hidden) {
    const snap = await fetchSystemLive();
    if (subscribersCount > 0 && snap) {
      state = { ...state, liveTelemetry: snap };
      emit();
    }
  }
  liveTimer = window.setTimeout(pollLive, 6000);
}

function startPolling() {
  if (healthTimer === undefined) {
    void pollHealth();
  }
  if (state.isBackendLive && liveTimer === undefined) {
    void pollLive();
  }
}

function stopPolling() {
  if (healthTimer !== undefined) {
    window.clearTimeout(healthTimer);
    healthTimer = undefined;
  }
  if (liveTimer !== undefined) {
    window.clearTimeout(liveTimer);
    liveTimer = undefined;
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  subscribersCount += 1;
  if (subscribersCount === 1) startPolling();
  return () => {
    listeners.delete(listener);
    subscribersCount = Math.max(0, subscribersCount - 1);
    if (subscribersCount === 0) stopPolling();
  };
}

function getSnapshot(): TelemetryStoreState {
  return state;
}

/**
 * Shared subscription hook keeping backend health & telemetry polling outside App root state,
 * preventing page-wide React re-renders every few seconds while Header and GlobalStatusBar stay synced.
 */
export function useSharedTelemetry(enabled = true): TelemetryStoreState {
  const snap = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  useEffect(() => {
    if (!enabled) return;
    startPolling();
  }, [enabled]);
  return snap;
}
