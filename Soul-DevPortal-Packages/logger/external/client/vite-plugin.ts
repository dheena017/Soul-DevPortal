/**
 * Universal Vite Logger Plugin for Workspace (@workspace/logger/vite).
 * Automatically captures client-side console events via Vite HMR and
 * the /__client_log endpoint, piping them cleanly to the terminal runner
 * with strict 5-column ANSI layout and proxy telemetry.
 */

export interface ViteLoggerOptions {
  /** HMR channel name to listen on. Defaults to 'workspace:client-log'. */
  channel?: string;
  /** Scope tag prefix to display in the 5-column layout. Defaults to 'CLIENT  '. */
  scope?: string;
  /** Minimum log level to print to terminal. Defaults to 'INFO'. */
  minLevel?: 'DEBUG' | 'INFO' | 'ACTION' | 'WARN' | 'ERROR';
  /** Print startup terminal banner on Vite server listen. Defaults to true. */
  showBanner?: boolean;
  /** Array of module names to suppress from terminal output. */
  filterModules?: string[];
}

const ANSI = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  gray: '\x1b[90m',
  cyan: '\x1b[36m',
  brightCyan: '\x1b[96m',
  brightGreen: '\x1b[92m',
  brightYellow: '\x1b[93m',
  brightRed: '\x1b[91m',
  brightMagenta: '\x1b[95m',
  brightWhite: '\x1b[97m',

  bgGray: '\x1b[100m\x1b[97m\x1b[1m',
  bgBlue: '\x1b[44m\x1b[97m\x1b[1m',
  bgMagenta: '\x1b[45m\x1b[97m\x1b[1m',
  bgYellow: '\x1b[43m\x1b[30m\x1b[1m',
  bgRed: '\x1b[41m\x1b[97m\x1b[1m',
};

const LEVEL_BADGES: Record<string, string> = {
  DEBUG: `${ANSI.bgGray} DEBUG ${ANSI.reset}`,
  INFO: `${ANSI.bgBlue}  INFO ${ANSI.reset}`,
  ACTION: `${ANSI.bgMagenta} ACTION${ANSI.reset}`,
  WARN: `${ANSI.bgYellow}  WARN ${ANSI.reset}`,
  ERROR: `${ANSI.bgRed} ERROR ${ANSI.reset}`,
};

const MODULE_COLORS: Record<string, string> = {
  API: ANSI.brightCyan,
  ROUTER: ANSI.brightMagenta,
  AUTH: ANSI.brightGreen,
  DATABASE: ANSI.brightGreen,
  WEBSOCKET: ANSI.brightYellow,
  APP: ANSI.cyan,
  PERF: ANSI.brightMagenta,
  WINDOW: ANSI.brightRed,
  PROMISE: ANSI.brightRed,
};

function format5ColumnLine(scope: string, level: string, moduleName: string, message: string): string {
  const now = new Date().toLocaleTimeString('en-US', { hour12: false });
  const colTime = `${ANSI.gray}[${now}]${ANSI.reset}`;
  const colScope = `${ANSI.brightCyan}[${scope.padEnd(8).slice(0, 8)}]${ANSI.reset}`;
  const colBadge = LEVEL_BADGES[level.toUpperCase()] || `[${level.padEnd(7)}]`;

  const tag = (moduleName.toUpperCase() || 'APP').slice(0, 14);
  const tagColor = MODULE_COLORS[tag] || ANSI.cyan;
  const colTag = `${tagColor}${ANSI.bold}[${tag.padEnd(14)}]${ANSI.reset}`;

  let msg = message;
  if (level === 'ERROR') {
    msg = `${ANSI.brightRed}${message}${ANSI.reset}`;
  } else if (level === 'WARN') {
    msg = `${ANSI.brightYellow}${message}${ANSI.reset}`;
  }

  return `${colTime} ${colScope} ${colBadge} ${colTag} ${msg}`;
}

export function workspaceLoggerPlugin(options: ViteLoggerOptions = {}) {
  const channel = options.channel || 'workspace:client-log';
  const scope = (options.scope || 'CLIENT  ').padEnd(8).slice(0, 8);
  const minLevel = options.minLevel || 'INFO';
  const filterModules = new Set(options.filterModules || []);

  const ranks: Record<string, number> = {
    DEBUG: 0,
    INFO: 1,
    ACTION: 2,
    WARN: 3,
    ERROR: 4,
  };

  return {
    name: 'workspace-terminal-logger',

    configureServer(server: any) {
      const handlePayload = (data: any) => {
        if (!data || !data.module) return;

        const level = (data.level || 'INFO').toUpperCase();
        if ((ranks[level] ?? 1) < (ranks[minLevel] ?? 1)) return;

        const mod = String(data.module || 'APP').toUpperCase();
        if (filterModules.has(mod)) return;

        const msg = String(data.message || '').slice(0, 450);
        const line = format5ColumnLine(scope, level, mod, msg);

        console.log(line);
      };

      // 1. Listen on configured Vite HMR channels
      if (server.ws) {
        server.ws.on(channel, handlePayload);
        server.ws.on('client:log', handlePayload);
        if (channel !== 'workspace:client-log') {
          server.ws.on('workspace:client-log', handlePayload);
        }
      }

      // 2. HTTP Fallback endpoint for non-HMR or polling environments
      server.middlewares.use('/__client_log', (req: any, res: any) => {
        if (req.method === 'POST') {
          let body = '';
          req.on('data', (chunk: any) => (body += chunk));
          req.on('end', () => {
            try {
              handlePayload(JSON.parse(body));
            } catch (_) {}
            res.statusCode = 204;
            res.end();
          });
        } else {
          res.statusCode = 405;
          res.end();
        }
      });
    },
  };
}

export const viteTerminalLogger = workspaceLoggerPlugin;
export default workspaceLoggerPlugin;
