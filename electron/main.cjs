const { app, BrowserWindow, Menu, Tray, dialog, ipcMain, nativeTheme, shell } = require('electron');
const { spawn, execFileSync } = require('node:child_process');
const fs = require('node:fs');
const http = require('node:http');
const net = require('node:net');
const path = require('node:path');

const BACKEND_HOST = '127.0.0.1';
const DEV_BACKEND_PORT = 8008;
const DEV_VITE_PORT = 5181;
const DESKTOP_CLIENT_PORT_START = 5281;
const DESKTOP_CLIENT_PORT_END = 5299;
const DESKTOP_BACKEND_PORT_START = 18008;
const DESKTOP_BACKEND_PORT_END = 18025;
const IS_DEV = process.argv.includes('--dev') || process.env.SOUL_DESKTOP_DEV === '1';
const IS_SMOKE = process.argv.includes('--smoke');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
};

let mainWindow = null;
let tray = null;
let staticServer = null;
let spawnedBackend = null;
let spawnedVite = null;
let backendWatchdog = null;
let backendStartPromise = null;
let activeBackendPort = DESKTOP_BACKEND_PORT_START;
let activeClientPort = DESKTOP_CLIENT_PORT_START;
let isQuitting = false;

function isFullWorkspaceDir(dir) {
  try {
    return (
      Boolean(dir) &&
      fs.existsSync(path.join(dir, 'projects.json')) &&
      fs.existsSync(path.join(dir, 'Soul-DevPortal-Projects'))
    );
  } catch {
    return false;
  }
}

function isStandaloneWorkspaceDir(dir) {
  try {
    return (
      Boolean(dir) &&
      fs.existsSync(path.join(dir, 'projects.json')) &&
      fs.existsSync(path.join(dir, 'server', 'main.py')) &&
      fs.existsSync(path.join(dir, 'Soul-DevPortal-Packages'))
    );
  } catch {
    return false;
  }
}

function resolveWorkspaceRoot() {
  const envRoot = process.env.SOUL_WORKSPACE_ROOT;
  if (envRoot && (isFullWorkspaceDir(envRoot) || isStandaloneWorkspaceDir(envRoot))) {
    return path.resolve(envRoot);
  }

  const devRoot = path.resolve(__dirname, '..');
  if (isFullWorkspaceDir(devRoot)) {
    return devRoot;
  }

  const probeStarts = [
    path.dirname(app.getPath('exe')),
    process.cwd(),
  ];
  for (const startDir of probeStarts) {
    let cur = startDir;
    for (let i = 0; i < 6; i += 1) {
      if (isFullWorkspaceDir(cur)) return cur;
      const parent = path.dirname(cur);
      if (parent === cur) break;
      cur = parent;
    }
  }

  // Check common user-relative checkout folders without hardcoding any username
  try {
    const homeDir = app.getPath('home');
    const commonRelatives = [
      'Soul-DevPortal',
      path.join('Projects', 'Soul-DevPortal'),
      path.join('Desktop', 'Soul-DevPortal'),
      path.join('Documents', 'Soul-DevPortal'),
      path.join('dev', 'Soul-DevPortal'),
      path.join('Code', 'Soul-DevPortal'),
    ];
    for (const rel of commonRelatives) {
      const candidate = path.join(homeDir, rel);
      if (isFullWorkspaceDir(candidate)) {
        return candidate;
      }
    }
  } catch {
    // Ignore home probe failures
  }

  // Standalone packaged app fallback: extraResources ships server/, Packages/, Docs/, and projects.json
  if (process.resourcesPath && isStandaloneWorkspaceDir(process.resourcesPath)) {
    return process.resourcesPath;
  }
  if (isStandaloneWorkspaceDir(devRoot)) {
    return devRoot;
  }
  return process.resourcesPath && fs.existsSync(path.join(process.resourcesPath, 'server', 'main.py'))
    ? process.resourcesPath
    : devRoot;
}

function resolveServerDir(workspaceRoot) {
  const localServer = path.join(workspaceRoot, 'server');
  if (fs.existsSync(path.join(localServer, 'main.py'))) {
    return localServer;
  }
  if (process.resourcesPath) {
    const resServer = path.join(process.resourcesPath, 'server');
    if (fs.existsSync(path.join(resServer, 'main.py'))) {
      return resServer;
    }
  }
  return localServer;
}

function isDirWritable(dirPath) {
  try {
    fs.mkdirSync(dirPath, { recursive: true });
    const probe = path.join(dirPath, `.write-test-${process.pid}`);
    fs.writeFileSync(probe, 'ok');
    fs.unlinkSync(probe);
    return true;
  } catch {
    return false;
  }
}

function checkPortOpen(port, host = BACKEND_HOST, timeoutMs = 450) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let settled = false;
    const finish = (ok) => {
      if (settled) return;
      settled = true;
      try {
        socket.destroy();
      } catch {
        // ignore
      }
      resolve(ok);
    };
    socket.setTimeout(timeoutMs);
    socket.once('connect', () => finish(true));
    socket.once('timeout', () => finish(false));
    socket.once('error', () => finish(false));
    socket.connect(port, host);
  });
}

async function waitForPort(port, maxWaitMs = 15000) {
  const deadline = Date.now() + maxWaitMs;
  while (Date.now() < deadline) {
    if (await checkPortOpen(port)) return true;
    await new Promise((r) => setTimeout(r, 250));
  }
  return false;
}

async function findFreePortInRange(startPort, endPort, fallbackPort) {
  for (let candidate = startPort; candidate <= endPort; candidate += 1) {
    if (!(await checkPortOpen(candidate))) {
      return candidate;
    }
  }
  return new Promise((resolve) => {
    const probe = net.createServer();
    probe.listen(0, BACKEND_HOST, () => {
      const addr = probe.address();
      const port = addr && typeof addr === 'object' ? addr.port : fallbackPort;
      probe.close(() => resolve(port));
    });
    probe.on('error', () => resolve(fallbackPort));
  });
}

async function findFreeBackendPort() {
  return findFreePortInRange(DESKTOP_BACKEND_PORT_START, DESKTOP_BACKEND_PORT_END, 18030);
}

function checkBackendHttp(port, timeoutMs = 900) {
  return new Promise((resolve) => {
    const req = http.get(
      {
        hostname: BACKEND_HOST,
        port,
        path: '/api/health',
        timeout: timeoutMs,
      },
      (res) => {
        res.resume();
        resolve(res.statusCode === 200);
      }
    );
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
    req.on('error', () => resolve(false));
  });
}

async function waitForBackendHealth(port, maxWaitMs = 20000) {
  const deadline = Date.now() + maxWaitMs;
  while (Date.now() < deadline && !isQuitting) {
    if (await checkBackendHttp(port)) return true;
    await new Promise((r) => setTimeout(r, 250));
  }
  return false;
}

function collectWindowsPythonPaths(baseArgs, workspaceRoot) {
  const candidates = [];
  const venvCandidates = [
    path.join(workspaceRoot, '.venv', 'Scripts', 'python.exe'),
    path.join(workspaceRoot, 'venv', 'Scripts', 'python.exe'),
  ];
  for (const pyExe of venvCandidates) {
    if (fs.existsSync(pyExe)) {
      candidates.push([pyExe, baseArgs]);
    }
  }

  candidates.push(
    ['python', baseArgs],
    ['py', ['-3', ...baseArgs]],
    ['python3', baseArgs]
  );

  try {
    const localPrograms = path.join(process.env.LOCALAPPDATA || '', 'Programs', 'Python');
    if (localPrograms && fs.existsSync(localPrograms)) {
      for (const entry of fs.readdirSync(localPrograms)) {
        const pyExe = path.join(localPrograms, entry, 'python.exe');
        if (fs.existsSync(pyExe)) {
          candidates.push([pyExe, baseArgs]);
        }
      }
    }
  } catch {
    // Ignore optional Python registry probe errors
  }
  return candidates;
}

function spawnPythonBackend(workspaceRoot, serverDir, targetPort) {
  const serverEntry = path.join(serverDir, 'main.py');
  if (!fs.existsSync(serverEntry)) {
    return null;
  }

  const candidateDataDir = path.join(serverDir, 'data');
  const dataDir = isDirWritable(candidateDataDir)
    ? candidateDataDir
    : path.join(app.getPath('userData'), 'data');
  fs.mkdirSync(dataDir, { recursive: true });

  let packageJsonPath = path.join(workspaceRoot, 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    const fallbackPkgPath = path.join(dataDir, 'workspace-package.json');
    try {
      const bundledPkg = fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8');
      fs.writeFileSync(fallbackPkgPath, bundledPkg, 'utf8');
      packageJsonPath = fallbackPkgPath;
    } catch {
      // ignore if unreadable
    }
  }

  const env = {
    ...process.env,
    PYTHONUNBUFFERED: '1',
    PORT: String(targetPort),
    HOST: BACKEND_HOST,
    SOUL_WORKSPACE_ROOT: workspaceRoot,
    SOUL_DATA_DIR: dataDir,
    SOUL_PACKAGE_JSON: packageJsonPath,
  };

  const baseArgs = ['-u', serverEntry, '--port', String(targetPort), '--host', BACKEND_HOST];
  const candidates = process.platform === 'win32'
    ? collectWindowsPythonPaths(baseArgs, workspaceRoot)
    : [['python3', baseArgs], ['python', baseArgs]];

  let activeChild = null;
  const trySpawn = (index) => {
    if (index >= candidates.length || isQuitting) return null;
    const [cmd, args] = candidates[index];
    const startedAt = Date.now();
    const child = spawn(cmd, args, {
      cwd: workspaceRoot,
      env,
      windowsHide: true,
      // Drain stdio streams silently so full OS pipe buffers never block Uvicorn on Windows
      stdio: ['ignore', 'ignore', 'pipe'],
    });
    if (child.stderr) {
      const logPath = path.join(app.getPath('userData'), 'backend.log');
      try {
        fs.writeFileSync(logPath, `[${new Date().toISOString()}] spawning ${cmd} ${args.join(' ')}\n`);
      } catch {
        // ignore log write errors
      }
      child.stderr.on('data', (chunk) => {
        try {
          fs.appendFileSync(logPath, chunk.toString('utf8'));
        } catch {
          // ignore
        }
      });
    }
    activeChild = child;
    spawnedBackend = child;
    let retried = false;

    const retryNext = () => {
      if (retried || isQuitting) return;
      retried = true;
      if (spawnedBackend === child) spawnedBackend = null;
      trySpawn(index + 1);
    };

    child.on('error', () => {
      retryNext();
    });
    child.on('exit', (code) => {
      if (spawnedBackend === child) spawnedBackend = null;
      if (code && Date.now() - startedAt < 2500) {
        retryNext();
      }
    });
    return child;
  };

  return trySpawn(0) || activeChild;
}

async function ensureBackend(workspaceRoot, serverDir) {
  if (IS_DEV && (await checkBackendHttp(DEV_BACKEND_PORT))) {
    activeBackendPort = DEV_BACKEND_PORT;
    return;
  }
  if (spawnedBackend && (await checkBackendHttp(activeBackendPort))) {
    return;
  }
  if (!backendStartPromise) {
    backendStartPromise = (async () => {
      try {
        activeBackendPort = IS_DEV ? DEV_BACKEND_PORT : await findFreeBackendPort();
        spawnedBackend = spawnPythonBackend(workspaceRoot, serverDir, activeBackendPort);
        if (spawnedBackend) {
          await waitForBackendHealth(activeBackendPort, 25000);
        }
      } finally {
        backendStartPromise = null;
      }
    })();
  }
  await backendStartPromise;
}

function spawnViteDevServer(workspaceRoot) {
  const viteBin = path.join(workspaceRoot, 'node_modules', 'vite', 'bin', 'vite.js');
  if (!fs.existsSync(viteBin)) {
    return null;
  }
  const child = spawn(process.execPath, [viteBin, '--port', String(DEV_VITE_PORT)], {
    cwd: workspaceRoot,
    env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' },
    windowsHide: true,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  child.on('exit', () => {
    if (spawnedVite === child) spawnedVite = null;
  });
  return child;
}

function proxyApiRequest(req, res) {
  const targetPort = activeBackendPort;
  const proxyReq = http.request(
    {
      hostname: BACKEND_HOST,
      port: targetPort,
      path: req.url,
      method: req.method,
      headers: {
        ...req.headers,
        host: `${BACKEND_HOST}:${targetPort}`,
      },
    },
    (proxyRes) => {
      res.writeHead(proxyRes.statusCode || 502, proxyRes.headers);
      proxyRes.pipe(res);
    }
  );

  proxyReq.on('error', () => {
    if (!res.headersSent) {
      res.writeHead(503, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ detail: `Soul FastAPI backend is starting on :${targetPort}` }));
    } else if (!res.writableEnded) {
      res.end();
    }
  });

  // In Node 20+, GET req emits 'close' after headers are read; only abort on premature client response close
  res.on('close', () => {
    if (!res.writableEnded && !proxyReq.destroyed) {
      proxyReq.destroy();
    }
  });

  if (req.method === 'GET' || req.method === 'HEAD') {
    proxyReq.end();
  } else {
    req.pipe(proxyReq);
  }
}

function startStaticAppServer(distDir) {
  return findFreePortInRange(DESKTOP_CLIENT_PORT_START, DESKTOP_CLIENT_PORT_END, 5300).then(
    (preferredPort) =>
      new Promise((resolve, reject) => {
        const resolvedDist = path.resolve(distDir);
        const server = http.createServer((req, res) => {
          if (!req.url) {
            res.writeHead(400);
            res.end();
            return;
          }

          if (req.url === '/api' || req.url.startsWith('/api/')) {
            proxyApiRequest(req, res);
            return;
          }

          let pathname = '/';
          try {
            pathname = decodeURIComponent(req.url.split('?')[0] || '/');
          } catch {
            pathname = '/';
          }
          if (pathname === '/') pathname = '/index.html';

          const targetPath = path.resolve(resolvedDist, `.${pathname}`);
          if (!targetPath.startsWith(resolvedDist)) {
            res.writeHead(403);
            res.end('Forbidden');
            return;
          }

          let fileToServe = targetPath;
          if (!fs.existsSync(fileToServe) || fs.statSync(fileToServe).isDirectory()) {
            fileToServe = path.join(resolvedDist, 'index.html');
          }

          fs.readFile(fileToServe, (err, content) => {
            if (err) {
              res.writeHead(404);
              res.end('Not found');
              return;
            }
            const ext = path.extname(fileToServe).toLowerCase();
            const mime = MIME_TYPES[ext] || 'application/octet-stream';
            res.writeHead(200, {
              'Content-Type': mime,
              'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=31536000',
            });
            res.end(content);
          });
        });

        server.on('error', reject);
        server.listen(preferredPort, BACKEND_HOST, () => {
          const addr = server.address();
          if (addr && typeof addr === 'object') {
            activeClientPort = addr.port;
            resolve({ server, port: addr.port });
          } else {
            reject(new Error('Failed to bind local desktop app server'));
          }
        });
      })
  );
}

function navigateWindow(hash) {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  if (mainWindow.isMinimized()) mainWindow.restore();
  mainWindow.focus();
  mainWindow.webContents.send('soul:navigate', hash);
}

function killChildTree(child) {
  if (!child || child.killed || !child.pid) return;
  try {
    if (process.platform === 'win32') {
      execFileSync('taskkill', ['/PID', String(child.pid), '/T', '/F'], {
        windowsHide: true,
        stdio: 'ignore',
      });
    } else {
      child.kill('SIGTERM');
    }
  } catch {
    // ignore cleanup error
  }
}

function buildAppMenu() {
  const template = [
    {
      label: 'Soul DevPortal',
      submenu: [
        { label: 'Overview Dashboard', accelerator: 'CmdOrCtrl+1', click: () => navigateWindow('overview') },
        { label: 'Projects & Applications', accelerator: 'CmdOrCtrl+2', click: () => navigateWindow('projects') },
        { label: 'Shared Packages', accelerator: 'CmdOrCtrl+3', click: () => navigateWindow('packages') },
        { label: 'Docs & Specifications', accelerator: 'CmdOrCtrl+4', click: () => navigateWindow('docs') },
        { label: 'Computer & Performance', accelerator: 'CmdOrCtrl+5', click: () => navigateWindow('computer') },
        { label: 'Developer Hub & GitHub Links', accelerator: 'CmdOrCtrl+6', click: () => navigateWindow('portal') },
        { type: 'separator' },
        { role: 'quit', label: 'Quit Soul DevPortal' },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'Open GitHub Repository',
          click: () => shell.openExternal('https://github.com/dheena017/Soul-DevPortal'),
        },
        {
          label: 'Open FastAPI Swagger',
          click: () => shell.openExternal(`http://${BACKEND_HOST}:${activeBackendPort}/docs`),
        },
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

function createTray(iconPath) {
  if (!fs.existsSync(iconPath)) return;
  try {
    tray = new Tray(iconPath);
    tray.setToolTip('Soul DevPortal Desktop');
    const contextMenu = Menu.buildFromTemplate([
      { label: 'Open Soul DevPortal', click: () => navigateWindow('overview') },
      { label: 'Computer & Performance', click: () => navigateWindow('computer') },
      { label: 'Projects & Ports', click: () => navigateWindow('projects') },
      { label: 'Developer Hub & GitHub', click: () => navigateWindow('portal') },
      { type: 'separator' },
      { label: 'Quit', click: () => { isQuitting = true; app.quit(); } },
    ]);
    tray.setContextMenu(contextMenu);
    tray.on('click', () => {
      if (!mainWindow || mainWindow.isDestroyed()) return;
      if (mainWindow.isVisible()) {
        mainWindow.focus();
      } else {
        mainWindow.show();
      }
    });
  } catch {
    // tray creation optional on headless/linux setups
  }
}

async function createMainWindow() {
  nativeTheme.themeSource = 'dark';
  const workspaceRoot = resolveWorkspaceRoot();
  const serverDir = resolveServerDir(workspaceRoot);
  const iconPng = path.join(__dirname, 'assets', 'icon.png');
  const iconIco = path.join(__dirname, 'assets', 'icon.ico');
  const windowIcon = process.platform === 'win32' && fs.existsSync(iconIco) ? iconIco : iconPng;

  buildAppMenu();

  mainWindow = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 960,
    minHeight: 640,
    title: 'Soul Workspace Developer Portal',
    backgroundColor: '#070708',
    autoHideMenuBar: true,
    show: false,
    icon: fs.existsSync(windowIcon) ? windowIcon : undefined,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  mainWindow.once('ready-to-show', () => {
    if (!IS_SMOKE && mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.show();
    }
  });

  const revealFallback = setTimeout(() => {
    if (!IS_SMOKE && mainWindow && !mainWindow.isDestroyed() && !mainWindow.isVisible()) {
      mainWindow.show();
    }
  }, 2200);

  mainWindow.on('closed', () => {
    clearTimeout(revealFallback);
    mainWindow = null;
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  // Show an immediate dark splash while booting the Desktop App's isolated FastAPI backend
  if (!IS_SMOKE && !IS_DEV) {
    const splashHtml = encodeURIComponent(
      `<!doctype html><html><body style="margin:0;background:#070708;color:#e4e4e7;font-family:system-ui,sans-serif;height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;"><div style="width:42px;height:42px;border-radius:12px;background:#111116;border:1px solid rgba(56,189,248,0.35);display:flex;align-items:center;justify-content:center;font-weight:800;color:#38bdf8;">S</div><div style="font-size:14px;font-weight:700;letter-spacing:-0.01em;">Starting Soul DevPortal Desktop</div><div style="font-size:12px;color:#94a3b8;font-family:monospace;">Booting embedded UI &amp; FastAPI backend...</div></body></html>`
    );
    await mainWindow.loadURL(`data:text/html;charset=utf-8,${splashHtml}`);
    if (!mainWindow.isVisible()) mainWindow.show();
  }

  // Always start and await the desktop app's own FastAPI backend before mounting React
  await ensureBackend(workspaceRoot, serverDir);

  if (IS_DEV) {
    if (!(await checkPortOpen(DEV_VITE_PORT))) {
      spawnedVite = spawnViteDevServer(workspaceRoot);
      await waitForPort(DEV_VITE_PORT, 15000);
    }
    await mainWindow.loadURL(`http://${BACKEND_HOST}:${DEV_VITE_PORT}/`);
  } else {
    const distDir = path.resolve(__dirname, '..', 'dist');
    if (!fs.existsSync(path.join(distDir, 'index.html'))) {
      dialog.showErrorBox(
        'Soul DevPortal Build Missing',
        'dist/index.html was not found. Run "npm run build" or "npm run desktop" first.'
      );
      app.quit();
      return;
    }
    const { server, port } = await startStaticAppServer(distDir);
    staticServer = server;
    await mainWindow.loadURL(`http://${BACKEND_HOST}:${port}/`);
  }

  if (IS_SMOKE) {
    let smokePassed = false;
    try {
      await new Promise((r) => setTimeout(r, 1500));
      const report = await mainWindow.webContents.executeJavaScript(`
        (async () => {
          const wait = (ms) => new Promise((r) => setTimeout(r, ms));
          const healthRes = await fetch('/api/health');
          const health = await healthRes.json();
          const imgs = Array.from(document.querySelectorAll('img')).map((img) => ({
            src: img.getAttribute('src'),
            complete: img.complete,
            naturalWidth: img.naturalWidth,
          }));
          window.location.hash = 'portal';
          let hasPortalHeading = false;
          for (let i = 0; i < 20; i += 1) {
            await wait(200);
            if ((document.body.innerText || '').includes('Developer Portal Hub')) {
              hasPortalHeading = true;
              break;
            }
          }
          const helpBtn = document.querySelector('[aria-label="Open desktop app installer and keyboard shortcuts"]');
          if (helpBtn) helpBtn.click();
          const probeStart = performance.now();
          let desktopInfoStatus = 0;
          try {
            const infoRes = await fetch('/api/soul-dev-portal/desktop-info');
            desktopInfoStatus = infoRes.status;
          } catch {
            desktopInfoStatus = -1;
          }
          const desktopInfoMs = Math.round(performance.now() - probeStart);
          let hasShortcutsModal = false;
          let modalCanScroll = false;
          let hasDesktopActionBtn = false;
          for (let i = 0; i < 60; i += 1) {
            await wait(150);
            const modalText = document.body.innerText || '';
            if (modalText.includes('DESKTOP APPLICATION · STANDALONE')) {
              hasShortcutsModal = true;
              const scrollBox = document.getElementById('soul-shortcuts-scroll');
              if (scrollBox) {
                const overflowY = window.getComputedStyle(scrollBox).overflowY;
                scrollBox.scrollTop = 60;
                modalCanScroll = (overflowY === 'auto' || overflowY === 'scroll') &&
                  (scrollBox.scrollHeight <= scrollBox.clientHeight || scrollBox.scrollTop > 0);
              }
              if (modalText.includes('Checking release...') || modalText.includes('Checking setup...')) {
                continue;
              }
              hasDesktopActionBtn =
                modalText.includes('Download App (.exe)') ||
                modalText.includes('Download v0.0.1 (.exe)') ||
                modalText.includes('Open Desktop App') ||
                modalText.includes('Desktop Shortcut') ||
                modalText.includes('Shortcut Ready');
              break;
            }
          }
          const doodleEl = document.querySelector('.portal-doodle-canvas') || document.querySelector('main.main');
          const hasDoodleBg = Boolean(
            doodleEl && window.getComputedStyle(doodleEl).backgroundImage.includes('soul-doodle-bg.svg')
          );
          const header = document.querySelector('header[role="banner"]');
          const helpRect = helpBtn ? helpBtn.getBoundingClientRect() : null;
          const headerFitsViewport = Boolean(
            header &&
            helpRect &&
            header.scrollWidth <= window.innerWidth + 1 &&
            helpRect.right <= window.innerWidth + 1
          );
          const statusBar = document.querySelector('footer[role="contentinfo"]');
          const statusRect = statusBar ? statusBar.getBoundingClientRect() : null;
          const hasStatusBar = Boolean(
            statusBar &&
            statusRect &&
            statusRect.height > 20 &&
            statusRect.bottom <= window.innerHeight + 1 &&
            /\\d{2}:\\d{2}:\\d{2}/.test(statusBar.innerText || '')
          );
          const closeModalBtn = document.querySelector('[aria-label="Close desktop app and shortcuts dialog"]');
          if (closeModalBtn) closeModalBtn.click();
          let clockPopoverFitsViewport = false;
          const clockBtn = statusBar ? statusBar.querySelector('button[aria-label*="Current date and time"]') : null;
          if (clockBtn) {
            clockBtn.click();
            await wait(120);
            const pop = document.querySelector('[aria-label="Date, Time and Quick Utilities"]');
            if (pop) {
              const pRect = pop.getBoundingClientRect();
              clockPopoverFitsViewport = Boolean(
                pRect.height > 180 &&
                pRect.top >= 0 &&
                pRect.left >= 0 &&
                pRect.right <= window.innerWidth + 1 &&
                pRect.bottom <= window.innerHeight + 1
              );
            }
            clockBtn.click();
          }
          return {
            isDesktop: Boolean(window.soulDesktop && window.soulDesktop.isDesktop),
            overviewImagesCount: imgs.length,
            brokenImages: imgs.filter((i) => i.naturalWidth === 0),
            healthStatus: health.status,
            clientPort: Number(window.location.port || 0),
            backendPort: health.port,
            portalTitle: document.title,
            desktopInfoStatus,
            desktopInfoMs,
            hasPortalHeading,
            hasShortcutsModal,
            hasDesktopActionBtn,
            modalCanScroll,
            headerFitsViewport,
            hasStatusBar,
            clockPopoverFitsViewport,
            hasDoodleBg,
          };
        })()
      `);
      console.log('ELECTRON_SMOKE_REPORT:', JSON.stringify(report));
      smokePassed = Boolean(
        report.isDesktop &&
        report.healthStatus === 'healthy' &&
        report.clientPort >= DESKTOP_CLIENT_PORT_START &&
        report.backendPort >= DESKTOP_BACKEND_PORT_START &&
        report.hasPortalHeading &&
        report.hasShortcutsModal &&
        report.hasDesktopActionBtn &&
        report.modalCanScroll &&
        report.headerFitsViewport &&
        report.hasStatusBar &&
        report.clockPopoverFitsViewport &&
        report.hasDoodleBg &&
        report.brokenImages.length === 0
      );
      if (smokePassed) {
        console.log('ELECTRON_SMOKE_OK');
      }
    } catch (err) {
      console.error('ELECTRON_SMOKE_FAILED:', err);
      smokePassed = false;
    } finally {
      isQuitting = true;
      killChildTree(spawnedBackend);
      spawnedBackend = null;
      killChildTree(spawnedVite);
      spawnedVite = null;
      if (staticServer) {
        try {
          staticServer.close();
        } catch {
          // ignore
        }
        staticServer = null;
      }
      app.exit(smokePassed ? 0 : 1);
    }
    return;
  }

  createTray(iconPng);

  if (!backendWatchdog) {
    backendWatchdog = setInterval(() => {
      if (isQuitting || IS_SMOKE) return;
      if (!IS_DEV && !spawnedBackend) {
        void ensureBackend(workspaceRoot, serverDir);
        return;
      }
      void checkBackendHttp(activeBackendPort).then((healthy) => {
        if (!healthy && !isQuitting && !spawnedBackend) {
          void ensureBackend(workspaceRoot, serverDir);
        }
      });
    }, 6000);
  }
}

const gotSingleInstanceLock = app.requestSingleInstanceLock();
if (!gotSingleInstanceLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
  });

  ipcMain.on('soul:navigate', (_evt, hash) => {
    navigateWindow(hash);
  });

  ipcMain.handle('soul:open-external', (_evt, url) => {
    if (typeof url === 'string' && (url.startsWith('https://') || url.startsWith('http://'))) {
      return shell.openExternal(url);
    }
    return undefined;
  });

  app.whenReady().then(createMainWindow);

  app.on('before-quit', () => {
    isQuitting = true;
    if (backendWatchdog) {
      clearInterval(backendWatchdog);
      backendWatchdog = null;
    }
    killChildTree(spawnedBackend);
    killChildTree(spawnedVite);
    if (staticServer) {
      try {
        staticServer.close();
      } catch {
        // ignore
      }
      staticServer = null;
    }
    if (tray) {
      tray.destroy();
      tray = null;
    }
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin' || isQuitting) {
      app.quit();
    }
  });
}
