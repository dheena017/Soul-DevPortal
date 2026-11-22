/**
 * @workspace/logger
 * Universal 5-column logging, DevTools HMR bridge, and terminal presentation.
 */

export * from './client.js';
export { consoleLogger, default } from './client.js';
export { workspaceLoggerPlugin, viteTerminalLogger } from './vite-plugin.js';
