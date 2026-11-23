/**
 * Universal Node.js / Server Logger & Middleware for Workspace (@workspace/logger/server).
 * Provides strict 5-column ANSI formatting, Request-ID tracing, sensitive data masking,
 * structured JSON cloud mode, AI/DB telemetry, and Unicode terminal banners for Node.js runtimes.
 */

declare const process: any;

export type NodeLogLevel = 'DEBUG' | 'INFO' | 'ACTION' | 'WARN' | 'ERROR' | 'SUCCESS';

export interface ServerLoggerOptions {
  scope?: string;
  useColor?: boolean;
  minLevel?: NodeLogLevel;
  format?: 'ansi' | 'json';
}

export interface NodeBannerOptions {
  title?: string;
  port?: number;
  host?: string;
  aiEngine?: string;
  dbInfo?: string;
  framework?: string;
  extraLines?: Array<[string, string]>;
}

export const ANSI = {
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
  GEMINI: ANSI.brightMagenta,
  HTTP: ANSI.cyan,
  ROUTER: ANSI.brightCyan,
  AUTH: ANSI.brightGreen,
  SECURITY: ANSI.brightRed,
  SERVER: ANSI.brightCyan,
  SYSTEM: ANSI.gray,
  CONFIG: ANSI.brightYellow,
};

const SENSITIVE_KEYS = new Set([
  'password',
  'token',
  'authorization',
  'secret',
  'apikey',
  'api_key',
  'cookie',
  'set-cookie',
]);

export function maskSensitive(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'string') {
    let cleaned = obj.replace(/(?:sk-[A-Za-z0-9_-]{10,}|AIza[A-Za-z0-9_-]{20,})/g, '***REDACTED***');
    if (cleaned.length > 400) return cleaned.slice(0, 400) + '... [truncated]';
    return cleaned;
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
  private format: 'ansi' | 'json';

  constructor(options: ServerLoggerOptions = {}) {
    this.scope = (options.scope || 'NODE    ').padEnd(8).slice(0, 8);
    this.minLevel = options.minLevel || 'DEBUG';
    const envFormat = typeof process !== 'undefined' && process.env ? process.env.LOG_FORMAT : undefined;
    this.format = options.format || (envFormat?.toLowerCase() === 'json' ? 'json' : 'ansi');
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

    const maskedDetail = detail !== undefined ? maskSensitive(detail) : undefined;
    const tag = (module.toUpperCase() || 'APP').slice(0, 14);

    if (this.format === 'json') {
      const payload: Record<string, unknown> = {
        timestamp: new Date().toISOString(),
        level,
        scope: this.scope.trim(),
        module: tag,
        message: typeof message === 'string' ? message : String(message),
      };
      if (maskedDetail !== undefined) payload.detail = maskedDetail;
      if (typeof process !== 'undefined' && process.stdout && typeof process.stdout.write === 'function') {
        process.stdout.write(JSON.stringify(payload) + '\n');
      } else {
        console.log(JSON.stringify(payload));
      }
      return;
    }

    const now = new Date().toLocaleTimeString('en-US', { hour12: false });
    const colTime = `${ANSI.gray}[${now}]${ANSI.reset}`;
    const colScope = `${ANSI.brightCyan}[${this.scope}]${ANSI.reset}`;
    const colBadge = LEVEL_BADGES[level] || `[${level.padEnd(7)}]`;

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

    const detailStr = maskedDetail !== undefined ? `\n${JSON.stringify(maskedDetail, null, 2)}` : '';
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

  /**
   * Logs an AI / LLM inference call with timing and token count.
   */
  ai(
    model: string,
    options: {
      durationMs?: number;
      promptTokens?: number;
      completionTokens?: number;
      status?: 'OK' | 'FAILED';
    } = {}
  ) {
    const { durationMs = 0, promptTokens, completionTokens, status = 'OK' } = options;
    const tokens: string[] = [];
    if (promptTokens !== undefined) tokens.push(`Prompt: ${promptTokens} tokens`);
    if (completionTokens !== undefined) tokens.push(`Completion: ${completionTokens} tokens`);
    const tokenStr = tokens.length > 0 ? ` │ ${tokens.join(', ')}` : '';
    const durStr = ` │ Duration: ${durationMs.toFixed(1)}ms`;
    const msg = `AI Inference [${model}] ──► ${status}${tokenStr}${durStr}`;

    if (status === 'OK') {
      this.info('AI', msg);
    } else {
      this.error('AI', msg);
    }
  }

  /**
   * Logs a database query with duration and row count.
   */
  db(
    query: string,
    options: {
      durationMs?: number;
      rows?: number;
      dbName?: string;
    } = {}
  ) {
    const { durationMs = 0, rows, dbName = 'database' } = options;
    const cleanSql = query.replace(/\s+/g, ' ').trim().slice(0, 120);
    const slowPrefix = durationMs >= 200 ? `${ANSI.bgRed} SLOW QUERY ${ANSI.reset} ` : '';
    const rowsStr = rows !== undefined ? ` │ ${rows} rows` : '';
    const msg = `${slowPrefix}[${dbName.toUpperCase()}] ${cleanSql} │ Time: ${durationMs.toFixed(1)}ms${rowsStr}`;

    if (durationMs >= 200) {
      this.warn('DATABASE', msg);
    } else {
      this.info('DATABASE', msg);
    }
  }

  /**
   * Starts a high-resolution execution timer.
   */
  timer(label: string) {
    const start = performance.now();
    return {
      end: (endOptions: { module?: string; message?: string } = {}) => {
        const duration = performance.now() - start;
        const mod = endOptions.module || 'PERF';
        const msg = endOptions.message || `Timer [${label}]`;
        this.info(mod, `${msg} │ Duration: ${duration.toFixed(2)}ms`);
        return duration;
      },
    };
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

    const mColors: Record<string, string> = {
      GET: ANSI.brightCyan,
      POST: ANSI.brightGreen,
      PUT: ANSI.brightYellow,
      DELETE: ANSI.brightRed,
      PATCH: ANSI.brightMagenta,
    };
    const mColor = mColors[method] || ANSI.white;

    logger.info('HTTP', `──► [INBOUND ] ${mColor}${ANSI.bold}${method.padEnd(6)}${ANSI.reset} ${path} [ID: #${reqId}]`);

    res.on('finish', () => {
      const duration = performance.now() - start;
      const status = res.statusCode || 200;

      let arrow: string;
      let level: NodeLogLevel;

      if (status < 300) {
        arrow = `${ANSI.brightGreen}${ANSI.bold}◄── [OUTBOUND]${ANSI.reset}`;
        level = 'INFO';
      } else if (status < 400) {
        arrow = `${ANSI.brightCyan}${ANSI.bold}◄── [OUTBOUND]${ANSI.reset}`;
        level = 'INFO';
      } else if (status < 500) {
        arrow = `${ANSI.brightYellow}${ANSI.bold}◄── [CLIENT ERR]${ANSI.reset}`;
        level = 'WARN';
      } else {
        arrow = `${ANSI.brightRed}${ANSI.bold}◄── [FAILED  ]${ANSI.reset}`;
        level = 'ERROR';
      }

      const durColor = duration < 100 ? ANSI.brightGreen : duration < 500 ? ANSI.brightYellow : ANSI.brightRed;
      const durStr = `${durColor}${duration.toFixed(1)}ms${ANSI.reset}`;

      logger.log(
        level,
        'HTTP',
        `${arrow} ${status} ${mColor}${ANSI.bold}${method.padEnd(6)}${ANSI.reset} ${path} │ Duration: ${durStr} [ID: #${reqId}]`
      );
    });

    next();
  };
}

/**
 * Renders a double-line Unicode terminal card for Node.js servers.
 */
export function printNodeServerBanner(options: NodeBannerOptions = {}) {
  const {
    title = 'WORKSPACE  —  NODE.JS API SERVER (STANDALONE)',
    port = 3000,
    host = '127.0.0.1',
    aiEngine = 'Google Gemini 2.5 Flash',
    dbInfo = 'SQLite Database',
    framework = 'Node.js Express / Fastify',
    extraLines = [],
  } = options;

  const width = 80;
  const innerWidth = width - 4;

  const topBorder = `${ANSI.brightMagenta}╔${'═'.repeat(width - 2)}╗${ANSI.reset}`;
  const bottomBorder = `${ANSI.brightMagenta}╚${'═'.repeat(width - 2)}╝${ANSI.reset}`;
  const midBorder = `${ANSI.brightMagenta}╠${'═'.repeat(width - 2)}╣${ANSI.reset}`;

  const padCenter = (text: string) => {
    const rawLen = text.replace(/\x1b\[[0-9;]*m/g, '').length;
    const left = Math.max(0, Math.floor((innerWidth - rawLen) / 2));
    const right = Math.max(0, innerWidth - rawLen - left);
    return `${ANSI.brightMagenta}║ ${ANSI.reset}${' '.repeat(left)}${text}${' '.repeat(right)}${ANSI.brightMagenta} ║${ANSI.reset}`;
  };

  const renderRow = (label: string, value: string, valColor = ANSI.brightGreen) => {
    const labelFormatted = `${ANSI.dim}${label.padEnd(16)}${ANSI.reset}`;
    const valueFormatted = `${valColor}${value}${ANSI.reset}`;
    const content = `${labelFormatted}  ${valueFormatted}`;
    const rawLen = 16 + 2 + value.length;
    const rightPad = Math.max(0, innerWidth - rawLen);
    return `${ANSI.brightMagenta}║ ${ANSI.reset}${content}${' '.repeat(rightPad)}${ANSI.brightMagenta} ║${ANSI.reset}`;
  };

  const lines = [
    topBorder,
    padCenter(`${ANSI.bold}${title}${ANSI.reset}`),
    midBorder,
    renderRow('Runtime Mode', 'Node.js Standalone Backend Server', ANSI.brightCyan),
    renderRow('Framework', framework, ANSI.brightGreen),
    renderRow('Local URL', `http://${host}:${port}/`, ANSI.brightWhite),
    renderRow('Health Probe', `http://${host}:${port}/health`, ANSI.cyan),
    renderRow('AI Engine', aiEngine, ANSI.brightMagenta),
    renderRow('Persistence', dbInfo, ANSI.green),
  ];

  for (const [k, v] of extraLines) {
    lines.push(renderRow(k, v, ANSI.brightYellow));
  }

  lines.push(bottomBorder);
  console.log(lines.join('\n'));
}

export default serverLogger;
