/**
 * Universal Client-Side Console Logger & Vite HMR Bridge for Workspace.
 * Provides styled DevTools badges, sensitive data masking, route tracing,
 * unhandled exception capturing, and live terminal stream forwarding.
 */

export type LogLevel = 'DEBUG' | 'INFO' | 'ACTION' | 'WARN' | 'ERROR';

export interface LogPayload {
  level: LogLevel;
  module: string;
  message: string;
  timestamp?: string;
  detail?: unknown;
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
  WARN: 'background: #D97706; color: #FFFFFF; font-weight: 700; padding: 2px 7px; border-radius: 4px; font-size: 11px;',
  ERROR: 'background: #DC2626; color: #FFFFFF; font-weight: 700; padding: 2px 7px; border-radius: 4px; font-size: 11px;',
};

const SENSITIVE_KEYS = new Set(['password', 'token', 'authorization', 'secret', 'apikey', 'api_key', 'cookie']);

function maskSensitiveData(obj: unknown): unknown {
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

function forwardToTerminal(level: LogLevel, module: string, message: string, detail?: unknown) {
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
  log(level: LogLevel, module: string, message: string, detail?: unknown) {
    const badgeStyle = BADGE_STYLES[module.toUpperCase()] || BADGE_STYLES[level] || BADGE_STYLES.default;
    const time = new Date().toLocaleTimeString('en-US', { hour12: false });
    const masked = maskSensitiveData(detail);

    const consoleMethod = level === 'ERROR' ? console.error : level === 'WARN' ? console.warn : console.log;

    if (masked !== undefined) {
      consoleMethod(`%c[${time}]%c %c ${module.toUpperCase()} %c ${message}`, 'color: #9CA3AF;', '', badgeStyle, 'color: inherit;', masked);
    } else {
      consoleMethod(`%c[${time}]%c %c ${module.toUpperCase()} %c ${message}`, 'color: #9CA3AF;', '', badgeStyle, 'color: inherit;');
    }

    forwardToTerminal(level, module, message, masked);
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

  printDevBanner() {
    console.log(
      '%cWORKSPACE%c %cClient Logger Active%c (Vite HMR Bridge • Strict 5-Column Output)',
      'background: #2563EB; color: #FFF; font-weight: 700; padding: 2px 7px; border-radius: 4px;',
      '',
      'color: #38BDF8; font-weight: 700;',
      'color: #9CA3AF;'
    );
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

  installGlobalErrorHandlers() {
    if (typeof window === 'undefined') return;

    window.addEventListener('error', (event) => {
      consoleLogger.error('WINDOW', `Unhandled Error: ${event.message} at ${event.filename}:${event.lineno}`, event.error);
    });

    window.addEventListener('unhandledrejection', (event) => {
      consoleLogger.error('PROMISE', `Unhandled Rejection: ${event.reason}`);
    });
  },
};

export default consoleLogger;
