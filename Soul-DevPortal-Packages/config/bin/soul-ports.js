#!/usr/bin/env node
/**
 * Soul-Dev 18-Port Topology & Conflict Scanner Launcher
 * Dispatches to Soul-DevPortal-Packages/config/external/run_ports.py
 */
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const scriptPath = resolve(__dirname, '../external/run_ports.py');

const child = spawn('python', [scriptPath, ...process.argv.slice(2)], {
  stdio: 'inherit',
  cwd: process.cwd(),
});

child.on('exit', (code) => {
  process.exit(code ?? 0);
});
