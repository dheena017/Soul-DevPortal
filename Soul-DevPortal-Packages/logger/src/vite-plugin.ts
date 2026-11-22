/**
 * Universal Vite Logger Plugin for Workspace (@workspace/logger/vite).
 * Automatically captures client-side console events via Vite HMR and
 * the /__client_log endpoint, piping them cleanly to the terminal runner.
 */

export interface ViteLoggerOptions {
  /** HMR channel name to listen on. Defaults to 'workspace:client-log'. */
  channel?: string;
  /** Tag prefix to prepend when printing to terminal. Defaults to '[CLIENT_LOG]'. */
  tag?: string;
}

export function workspaceLoggerPlugin(options: ViteLoggerOptions = {}) {
  const channel = options.channel || 'workspace:client-log';
  const tag = options.tag || '[CLIENT_LOG]';

  return {
    name: 'workspace-terminal-logger',
    configureServer(server: any) {
      const handlePayload = (data: any) => {
        if (!data || !data.module) return;
        const level = data.level || 'INFO';
        const mod = data.module;
        const msg = String(data.message || '').slice(0, 350);
        console.log(`${tag} ${level}|${mod}|${msg}`);
      };

      // 1. Listen on configured Vite HMR channels
      server.ws.on(channel, handlePayload);
      server.ws.on('client:log', handlePayload);
      if (channel !== 'workspace:client-log') {
        server.ws.on('workspace:client-log', handlePayload);
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
