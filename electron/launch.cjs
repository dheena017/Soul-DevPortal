const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const electronPath = require('electron');

const rawArgs = process.argv.slice(2);
const isDetached = rawArgs.includes('--detached') || rawArgs.includes('--shortcut');
const passthroughArgs = rawArgs.filter((arg) => arg !== '--detached' && arg !== '--shortcut');

const workspaceRoot = path.resolve(__dirname, '..');
const env = { ...process.env };
delete env.ELECTRON_RUN_AS_NODE;

// If launched headless without a built dist/ and without --dev, fall back to dev mode safely
const distIndex = path.join(workspaceRoot, 'dist', 'index.html');
if (!passthroughArgs.includes('--dev') && !fs.existsSync(distIndex)) {
  passthroughArgs.push('--dev');
}

const child = spawn(electronPath, [workspaceRoot, ...passthroughArgs], {
  cwd: workspaceRoot,
  detached: isDetached,
  stdio: isDetached ? 'ignore' : 'inherit',
  env,
  windowsHide: false,
});

if (isDetached) {
  child.unref();
  process.exit(0);
}

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
});
