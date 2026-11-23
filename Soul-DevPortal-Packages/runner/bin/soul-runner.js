#!/usr/bin/env node
/**
 * Soul-Dev Universal Multi-Project & Tool Orchestrator Launcher
 * Dispatches to Soul-DevPortal-Packages/runner/external scripts
 */
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const subcommand = process.argv[2];
const extraArgs = process.argv.slice(3);

const SCRIPT_MAP = {
  all: '../external/run_all.py',
  build: '../external/run_build.py',
  lint: '../external/run_lint.py',
  typecheck: '../external/run_typecheck.py',
  install: '../external/run_install.py',
  client: '../external/run_client.py',
  server: '../external/run_server.py',
};

const scriptFile = SCRIPT_MAP[subcommand] || '../external/run_all.py';
const scriptPath = resolve(__dirname, scriptFile);
const argsToPass = SCRIPT_MAP[subcommand] ? extraArgs : process.argv.slice(2);

const child = spawn('python', [scriptPath, ...argsToPass], {
  stdio: 'inherit',
  cwd: process.cwd(),
});

function handleSignal() {
  // Let python runner handle its own SIGINT / graceful cleanup
}

process.on('SIGINT', handleSignal);
process.on('SIGTERM', handleSignal);
if (process.platform === 'win32') {
  process.on('SIGBREAK', handleSignal);
}

child.on('exit', (code) => {
  process.exit(code ?? 0);
});
