/**
 * Universal Client-Side Console Logger & Vite HMR Bridge for Workspace (@workspace/logger/client).
 * Provides styled DevTools badges, sensitive data masking, route tracing,
 * automatic fetch interception, ring buffer export, breadcrumbs, and live terminal stream forwarding.
 */

export type LogLevel = 'DEBUG' | 'INFO' | 'ACTION' | 'WARN' | 'ERROR' | 'SILENT';

export interface LogPayload {
  level: Exclude<LogLevel, 'SILENT'>;
  module: string;
  message: string;
  timestamp?: string;
  detail?: unknown;
}

export interface BreadcrumbItem {
  timestamp: string;
  category: string;
  message: string;
  data?: unknown;
}

const BADGE_STYLES: Record<string, string> = {
  default: 'background: #0284C7; color: #FFFFFF; font-weight: 700; padding: 2px 7px; border-radius: 4px; font-size: 11px;',
  API: 'background: #0284C7; color: #FFFFFF; font-weight: 700; padding: 2px 7px; border-radius: 4px; font-size: 11px;',
  APP: 'background: #2563EB; color: #FFFFFF; font-weight: 700; padding: 2px 7px; border-radius: 4px; font-size: 11px;',
  AUTH: 'background: #0D9488; color: #FFFFFF; font-weight: 700; padding: 2px 7px; border-radius: 4px; font-size: 11px;',
  ROUTER: 'background: #6366F1; color: #FFFFFF; font-weight: 700; padding: 2px 7px; border-radius: 4px; font-size: 11px;',
  WEBSOCKET: 'background: #D97706; color: #FFFFFF; font-weight: 700; padding: 2px 7px; border-radius: 4px; font-size: 11px;',
  DATABASE: 'background: #16A34A; color: #FFFFFF; font-weight: 700; padding: 2px 7px; border-radius: 4px; font-size: 11px;',
  UI: 'background: #0D9488; color: #FFFFFF; font-weight: 700; padding: 2px 7px; border-radius: 4px; font-size: 11px;',
  PERF: 'background: #7C3AED; color: #FFFFFF; font-weight: 700; padding: 2px 7px; border-radius: 4px; font-size: 11px;',
  STATE: 'background: #8B5CF6; color: #FFFFFF; font-weight: 700; padding: 2px 7px; border-radius: 4px; font-size: 11px;',
  EVENT: 'background: #EC4899; color: #FFFFFF; font-weight: 700; padding: 2px 7px; border-radius: 4px; font-size: 11px;',
  WARN: 'background: #D97706; color: #FFFFFF; font-weight: 700; padding: 2px 7px; border-radius: 4px; font-size: 11px;',
  ERROR: 'background: #DC2626; color: #FFFFFF; font-weight: 700; padding: 2px 7px; border-radius: 4px; font-size: 11px;',
};

const SENSITIVE_KEYS = new Set(['password', 'token', 'authorization', 'secret', 'apikey', 'api_key', 'cookie']);

export function maskSensitiveData(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'string') {
    let cleaned = obj.replace(/data:(audio|image|video)\/[a-zA-Z0-9.+_-]+;base64,[A-Za-z0-9+/=]{20,}/g, 'data:$1/... [base64 data]');
    if (cleaned.length > 300) {
      cleaned = cleaned.slice(0, 300) + '... [truncated]';
    }
    return cleaned;
  }
  if (typeof obj === 'object') {
    if (Array.isArray(obj)) {
      return obj.map(maskSensitiveData);
    }
    const copy: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(obj as Record<string, unknown>)) {
      if (SENSITIVE_KEYS.has(key.toLowerCase())) {
        copy[key] = '********';
      } else {
        copy[key] = maskSensitiveData(val);
      }
    }
    return copy;
  }
  return obj;
}

const activeTimers = new Map<string, number>();
const MAX_HISTORY = 300;
const logHistory: LogPayload[] = [];
const breadcrumbs: BreadcrumbItem[] = [];

let currentLogLevel: LogLevel = 'DEBUG';

const LOG_RANK: Record<LogLevel, number> = {
  DEBUG: 0,
  INFO: 1,
  ACTION: 2,
  WARN: 3,
  ERROR: 4,
  SILENT: 5,
};

function forwardToTerminal(level: Exclude<LogLevel, 'SILENT'>, module: string, message: string, detail?: unknown) {
  if (typeof window === 'undefined') return;

  const payload: LogPayload = {
    level,
    module,
    message,
    timestamp: new Date().toISOString(),
    detail: maskSensitiveData(detail),
  };

  // 1. Send via Vite HMR WebSocket if available
  const hot = (import.meta as unknown as { hot?: { send: (event: string, data: unknown) => void } })?.hot;
  if (hot && typeof hot.send === 'function') {
    try {
      hot.send('workspace:client-log', payload);
      return;
    } catch (_) {}
  }

  // 2. Fallback to POST /__client_log endpoint
  if (typeof fetch === 'function') {
    fetch('/__client_log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).catch(() => {});
  }
}

export const consoleLogger = {
  setLevel(level: LogLevel) {
    currentLogLevel = level;
  },

  getLevel(): LogLevel {
    return currentLogLevel;
  },

  log(level: Exclude<LogLevel, 'SILENT'>, module: string, message: string, detail?: unknown) {
    if (LOG_RANK[level] < LOG_RANK[currentLogLevel]) return;

    const time = new Date().toLocaleTimeString('en-US', { hour12: false });
    const badgeStyle = BADGE_STYLES[module.toUpperCase()] || BADGE_STYLES[level] || BADGE_STYLES.default;
    const masked = maskSensitiveData(detail);

    // Save to ring buffer
    logHistory.push({
      level,
      module,
      message,
      timestamp: new Date().toISOString(),
      detail: masked,
    });
    if (logHistory.length > MAX_HISTORY) {
      logHistory.shift();
    }

    const consoleMethod = level === 'ERROR' ? console.error : level === 'WARN' ? console.warn : console.log;

    if (masked !== undefined) {
      consoleMethod(`%c[${time}]%c %c ${module.toUpperCase()} %c ${message}`, 'color: #9CA3AF;', '', badgeStyle, 'color: inherit;', masked);
    } else {
      consoleMethod(`%c[${time}]%c %c ${module.toUpperCase()} %c ${message}`, 'color: #9CA3AF;', '', badgeStyle, 'color: inherit;');
    }

    forwardToTerminal(level, module, message, masked);
  },

  debug(module: string, message: string, detail?: unknown) {
    this.log('DEBUG', module, message, detail);
  },

  info(module: string, message: string, detail?: unknown) {
    this.log('INFO', module, message, detail);
  },

  action(module: string, message: string, detail?: unknown) {
    this.log('ACTION', module, message, detail);
  },

  warn(module: string, message: string, detail?: unknown) {
    this.log('WARN', module, message, detail);
  },

  error(module: string, message: string, detail?: unknown) {
    this.log('ERROR', module, message, detail);
  },

  success(module: string, message: string, detail?: unknown) {
    this.log('INFO', module, message, detail);
  },

  api(method: string, endpoint: string, status: number, duration: number, detail?: unknown) {
    this.apiComing(method, endpoint, status, duration, detail);
  },

  nav(from: string, to: string) {
    this.action('ROUTER', `Navigate: ${from} ──► ${to}`);
    this.breadcrumb('navigation', `Navigated from ${from} to ${to}`);
  },

  state(module: string, stateName: string, prev: unknown, next: unknown) {
    this.log('INFO', 'STATE', `State change [${stateName}]`, {
      module,
      previous: maskSensitiveData(prev),
      current: maskSensitiveData(next),
    });
  },

  event(module: string, eventName: string, payload?: unknown) {
    this.log('ACTION', 'EVENT', `Event emitted: ${eventName}`, {
      module,
      payload: maskSensitiveData(payload),
    });
    this.breadcrumb('event', `Event: ${eventName}`, payload);
  },

  time(label: string) {
    activeTimers.set(label, performance.now());
  },

  timeEnd(label: string, module = 'PERF') {
    const start = activeTimers.get(label);
    if (start !== undefined) {
      const duration = performance.now() - start;
      activeTimers.delete(label);
      this.info(module, `Timer [${label}]: ${duration.toFixed(2)}ms`);
    }
  },

  table(module: string, data: unknown[]) {
    this.info(module, `Tabular Data: ${data.length} records`);
    console.table(data);
  },

  group(title: string, fn: () => void, collapsed = true) {
    if (collapsed) console.groupCollapsed(title);
    else console.group(title);
    try {
      fn();
    } finally {
      console.groupEnd();
    }
  },

  apiSent(method: string, url: string) {
    this.info('API', `--> [SENT] ${method.toUpperCase()} ${url}`);
  },

  apiComing(method: string, url: string, status: number, duration: number, err?: unknown) {
    if (err || status >= 400) {
      this.error('API', `<-- [FAILED] ${status} ${method.toUpperCase()} ${url} (${duration.toFixed(1)}ms)`, err);
    } else {
      this.info('API', `<-- [OK] ${status} ${method.toUpperCase()} ${url} (${duration.toFixed(1)}ms)`);
    }
  },

  // ── Breadcrumbs & History ──────────────────────────────────
  breadcrumb(category: string, message: string, data?: unknown) {
    breadcrumbs.push({
      timestamp: new Date().toISOString(),
      category,
      message,
      data: maskSensitiveData(data),
    });
    if (breadcrumbs.length > 100) breadcrumbs.shift();
  },

  getBreadcrumbs(): BreadcrumbItem[] {
    return [...breadcrumbs];
  },

  clearBreadcrumbs() {
    breadcrumbs.length = 0;
  },

  getHistory(): LogPayload[] {
    return [...logHistory];
  },

  clearHistory() {
    logHistory.length = 0;
  },

  downloadLogs(filename = `workspace-logs-${Date.now()}.json`) {
    if (typeof window === 'undefined') return;
    const blob = new Blob([JSON.stringify({ logs: logHistory, breadcrumbs }, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  },

  printDevBanner() {
    console.log(
      '%cWORKSPACE%c %cClient Logger Active%c (Vite HMR Bridge • Strict 5-Column Output)',
      'background: #2563EB; color: #FFF; font-weight: 700; padding: 2px 7px; border-radius: 4px;',
      '',
      'color: #38BDF8; font-weight: 700;',
      'color: #9CA3AF;'
    );
  },

  /**
   * Automatically intercepts `window.fetch` to log all outbound requests and responses.
   */
  attachFetchInterceptor() {
    if (typeof window === 'undefined' || !(window as any).fetch) return;

    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const [input, init] = args;
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
      const method = (init?.method || 'GET').toUpperCase();

      // Don't intercept the terminal forwarder endpoint
      if (url.includes('/__client_log')) {
        return originalFetch(...args);
      }

      consoleLogger.apiSent(method, url);
      const start = performance.now();

      try {
        const response = await originalFetch(...args);
        const duration = performance.now() - start;
        consoleLogger.apiComing(method, url, response.status, duration);
        return response;
      } catch (err) {
        const duration = performance.now() - start;
        consoleLogger.apiComing(method, url, 0, duration, err);
        throw err;
      }
    };
  },

  installGlobalErrorHandlers() {
    if (typeof window === 'undefined') return;

    window.addEventListener('error', (event) => {
      consoleLogger.error('WINDOW', `Unhandled Error: ${event.message} at ${event.filename}:${event.lineno}`, event.error);
      consoleLogger.breadcrumb('error', event.message, { filename: event.filename, lineno: event.lineno });
    });

    window.addEventListener('unhandledrejection', (event) => {
      consoleLogger.error('PROMISE', `Unhandled Rejection: ${event.reason}`);
      consoleLogger.breadcrumb('error', 'Unhandled Promise Rejection', event.reason);
    });
  },
};

export default consoleLogger;
