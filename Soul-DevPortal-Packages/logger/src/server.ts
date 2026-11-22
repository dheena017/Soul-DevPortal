/**
 * Universal Node.js / Server Logger & Express Middleware for Workspace (@workspace/logger/server).
 * Provides strict 5-column ANSI formatting, Request-ID tracing, sensitive data masking,
 * latency measurement, and server startup banners for Node.js runtimes.
 */

export type NodeLogLevel = 'DEBUG' | 'INFO' | 'ACTION' | 'WARN' | 'ERROR' | 'SUCCESS';

export interface ServerLoggerOptions {
  scope?: string;
  useColor?: boolean;
  minLevel?: NodeLogLevel;
}

const ANSI = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  underline: '\x1b[4m',

  // Foreground
  gray: '\x1b[90m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',

  brightRed: '\x1b[91m',
  brightGreen: '\x1b[92m',
  brightYellow: '\x1b[93m',
  brightBlue: '\x1b[94m',
  brightMagenta: '\x1b[95m',
  brightCyan: '\x1b[96m',
  brightWhite: '\x1b[97m',

  // Badges (Background + Foreground)
  bgGray: '\x1b[100m\x1b[97m\x1b[1m',
  bgBlue: '\x1b[44m\x1b[97m\x1b[1m',
  bgMagenta: '\x1b[45m\x1b[97m\x1b[1m',
  bgYellow: '\x1b[43m\x1b[30m\x1b[1m',
  bgRed: '\x1b[41m\x1b[97m\x1b[1m',
  bgGreen: '\x1b[42m\x1b[30m\x1b[1m',
};

const LEVEL_BADGES: Record<NodeLogLevel, string> = {
  DEBUG: `${ANSI.bgGray} DEBUG ${ANSI.reset}`,
  INFO: `${ANSI.bgBlue}  INFO ${ANSI.reset}`,
  ACTION: `${ANSI.bgMagenta} ACTION${ANSI.reset}`,
  WARN: `${ANSI.bgYellow}  WARN ${ANSI.reset}`,
  ERROR: `${ANSI.bgRed} ERROR ${ANSI.reset}`,
  SUCCESS: `${ANSI.bgGreen}  DONE ${ANSI.reset}`,
};

const MODULE_COLORS: Record<string, string> = {
  DATABASE: ANSI.brightGreen,
  SQL: ANSI.green,
  AI: ANSI.brightMagenta,
  HTTP: ANSI.cyan,
  ROUTER: ANSI.brightCyan,
  AUTH: ANSI.brightGreen,
  SECURITY: ANSI.brightRed,
  SERVER: ANSI.brightCyan,
  SYSTEM: ANSI.gray,
  CONFIG: ANSI.brightYellow,
};

const SENSITIVE_KEYS = new Set(['password', 'token', 'authorization', 'secret', 'apikey', 'api_key', 'cookie']);

export function maskSensitive(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'string') {
    if (obj.length > 400) return obj.slice(0, 400) + '... [truncated]';
    return obj;
  }
  if (typeof obj === 'object') {
    if (Array.isArray(obj)) return obj.map(maskSensitive);
    const copy: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      if (SENSITIVE_KEYS.has(k.toLowerCase())) {
        copy[k] = '********';
      } else {
        copy[k] = maskSensitive(v);
      }
    }
    return copy;
  }
  return obj;
}

export class ServerLogger {
  private scope: string;
  private minLevel: NodeLogLevel;

  constructor(options: ServerLoggerOptions = {}) {
    this.scope = (options.scope || 'NODE    ').padEnd(8).slice(0, 8);
    this.minLevel = options.minLevel || 'DEBUG';
  }

  private shouldLog(level: NodeLogLevel): boolean {
    const ranks: Record<NodeLogLevel, number> = {
      DEBUG: 0,
      INFO: 1,
      ACTION: 2,
      SUCCESS: 2,
      WARN: 3,
      ERROR: 4,
    };
    return (ranks[level] ?? 0) >= (ranks[this.minLevel] ?? 0);
  }

  log(level: NodeLogLevel, module: string, message: string, detail?: unknown) {
    if (!this.shouldLog(level)) return;

    const now = new Date().toLocaleTimeString('en-US', { hour12: false });
    const colTime = `${ANSI.gray}[${now}]${ANSI.reset}`;
    const colScope = `${ANSI.brightCyan}[${this.scope}]${ANSI.reset}`;
    const colBadge = LEVEL_BADGES[level] || `[${level.padEnd(7)}]`;

    const tag = (module.toUpperCase() || 'APP').slice(0, 14);
    const tagColor = MODULE_COLORS[tag] || ANSI.cyan;
    const colTag = `${tagColor}${ANSI.bold}[${tag.padEnd(14)}]${ANSI.reset}`;

    let msg = message;
    if (level === 'ERROR') {
      msg = `${ANSI.brightRed}${message}${ANSI.reset}`;
    } else if (level === 'WARN') {
      msg = `${ANSI.brightYellow}${message}${ANSI.reset}`;
    } else if (level === 'SUCCESS') {
      msg = `${ANSI.brightGreen}${message}${ANSI.reset}`;
    }

    const detailStr = detail !== undefined ? `\n${JSON.stringify(maskSensitive(detail), null, 2)}` : '';
    console.log(`${colTime} ${colScope} ${colBadge} ${colTag} ${msg}${detailStr}`);
  }

  debug(module: string, message: string, detail?: unknown) {
    this.log('DEBUG', module, message, detail);
  }

  info(module: string, message: string, detail?: unknown) {
    this.log('INFO', module, message, detail);
  }

  action(module: string, message: string, detail?: unknown) {
    this.log('ACTION', module, message, detail);
  }

  warn(module: string, message: string, detail?: unknown) {
    this.log('WARN', module, message, detail);
  }

  error(module: string, message: string, detail?: unknown) {
    this.log('ERROR', module, message, detail);
  }

  success(module: string, message: string, detail?: unknown) {
    this.log('SUCCESS', module, message, detail);
  }
}

export const serverLogger = new ServerLogger();

/**
 * Universal Express / Connect middleware for 5-column request logging.
 */
export function expressLoggingMiddleware(options: { serviceName?: string } = {}) {
  const logger = new ServerLogger({ scope: options.serviceName || 'HTTP    ' });

  return (req: any, res: any, next: () => void) => {
    const reqId = req.headers['x-request-id'] || Math.random().toString(36).slice(2, 10);
    req.requestId = reqId;
    res.setHeader('x-request-id', reqId);

    const start = performance.now();
    const method = req.method || 'GET';
    const path = req.originalUrl || req.url || '/';

    logger.info('HTTP', `──► [INBOUND ] ${method} ${path} [ID: #${reqId}]`);

    res.on('finish', () => {
      const duration = performance.now() - start;
      const status = res.statusCode;
      const level: NodeLogLevel = status >= 500 ? 'ERROR' : status >= 400 ? 'WARN' : 'INFO';
      const arrow = status >= 400 ? '◄── [FAILED  ]' : '◄── [OUTBOUND]';

      logger.log(
        level,
        'HTTP',
        `${arrow} ${status} ${method} ${path} │ Duration: ${duration.toFixed(1)}ms [ID: #${reqId}]`
      );
    });

    next();
  };
}

export default serverLogger;
