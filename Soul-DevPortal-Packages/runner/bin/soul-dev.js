#!/usr/bin/env node
/**
 * Soul-Dev Universal Project Dev Supervisor Launcher
 * Dispatches to Soul-DevPortal-Packages/runner/external/run_dev.py
 */
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const scriptPath = resolve(__dirname, '../external/run_dev.py');

const child = spawn('python', [scriptPath, ...process.argv.slice(2)], {
  stdio: 'inherit',
  cwd: process.cwd(),
});

function handleSignal() {
  // Let python supervisor handle its own SIGINT / graceful cleanup
}

process.on('SIGINT', handleSignal);
process.on('SIGTERM', handleSignal);
if (process.platform === 'win32') {
  process.on('SIGBREAK', handleSignal);
}

child.on('exit', (code) => {
  process.exit(code ?? 0);
});
