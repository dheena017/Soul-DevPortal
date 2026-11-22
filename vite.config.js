import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { workspaceLoggerPlugin } from './Soul-DevPortal-Packages/logger/src/vite-plugin.ts';

const virtualModuleId = 'virtual:workspace-packages';
const resolvedVirtualModuleId = `\0${virtualModuleId}`;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packagesRoot = path.resolve(__dirname, 'Soul-DevPortal-Packages');
const docsRoot = path.resolve(__dirname, 'Soul-DevPortal-Docs');
const workspaceRoot = __dirname;

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return null;
  }
}

function markdownBlocks(markdown) {
  if (!markdown) return [];
  const lines = markdown.replace(/^\uFEFF/, '').split(/\r?\n/);
  const blocks = [];
  let inCode = false;
  let codeLanguage = '';
  let codeLines = [];
  let codeIndent = 0;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const trimmed = line.trim();

    if (trimmed.startsWith('```')) {
      if (inCode) {
        blocks.push({ type: 'code', language: codeLanguage, text: codeLines.join('\n') });
        codeLines = [];
        codeLanguage = '';
        inCode = false;
        codeIndent = 0;
      } else {
        inCode = true;
        codeLanguage = trimmed.slice(3).trim();
        codeIndent = line.indexOf('`');
      }
      continue;
    }

    if (inCode) {
      if (codeIndent > 0 && line.startsWith(' '.repeat(codeIndent))) {
        codeLines.push(line.slice(codeIndent));
      } else {
        codeLines.push(line);
      }
      continue;
    }

    const heading = line.match(/^(#{1,4})\s+(.+)$/);
    if (heading) {
      blocks.push({ type: `h${heading[1].length}`, text: heading[2].replace(/[*_]/g, '') });
      continue;
    }

    const nextLine = lines[index + 1] || '';
    if (/^\|?.+\|.+\|?$/.test(line) && /^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?$/.test(nextLine)) {
      const parseCells = (value) => value
        .trim()
        .replace(/^\|/, '')
        .replace(/\|$/, '')
        .split('|')
        .map((cell) => cell.trim());
      const headers = parseCells(line);
      const rows = [];
      index += 2;
      while (index < lines.length && /^\|?.*\|.*\|?$/.test(lines[index]) && lines[index].trim()) {
        rows.push(parseCells(lines[index]));
        index += 1;
      }
      index -= 1;
      blocks.push({ type: 'table', headers, rows });
      continue;
    }

    if (!line.trim()) continue;
    if (/^-{3,}$/.test(line.trim())) continue;

    const quote = line.match(/^>\s*(.+)$/);
    if (quote) {
      blocks.push({ type: 'quote', text: quote[1].replace(/\*\*(.+)\*\*/, '$1') });
      continue;
    }

    const bullet = line.match(/^\s*[-*]\s+(.+)$/);
    if (bullet) {
      blocks.push({ type: 'list', text: bullet[1] });
      continue;
    }

    const ordered = line.match(/^\s*\d+[.)]\s+(.+)$/);
    if (ordered) {
      const number = Number(line.match(/^\s*(\d+)[.)]/)?.[1] || 1);
      blocks.push({ type: 'ordered', text: ordered[1], number });
      continue;
    }

    blocks.push({ type: 'p', text: line.trim() });
  }

  if (inCode) blocks.push({ type: 'code', language: codeLanguage, text: codeLines.join('\n') });
  return blocks;
}

function extractPythonExports(directory) {
  if (!fs.existsSync(directory)) return { module: null, exports: [] };
  const entries = fs.readdirSync(directory);
  const initFile = entries.find((entry) => entry.startsWith('workspace_') && fs.statSync(path.join(directory, entry)).isDirectory());
  if (!initFile) return { module: null, exports: [] };

  const initPath = path.join(directory, initFile, '__init__.py');
  let exports = [];
  if (fs.existsSync(initPath)) {
    const source = fs.readFileSync(initPath, 'utf8');
    const allMatch = source.match(/__all__\s*=\s*\[([\s\S]*?)\]/);
    if (allMatch) {
      exports = [...allMatch[1].matchAll(/["']([^"']+)["']/g)].map((match) => match[1]);
    } else {
      exports = [...source.matchAll(/^(?:from\s+\S+\s+import\s+(.+)|import\s+(\S+))/gm)]
        .flatMap((match) => (match[1] || match[2]).split(',').map((item) => item.trim().replace(/[()[\]{}]/g, '').split(' as ')[0]));
    }
  }
  return { module: initFile, exports };
}

function extractTypeScriptExports(directory) {
  const srcRoot = path.join(directory, 'src');
  if (!fs.existsSync(srcRoot)) return [];
  const names = new Set();

  for (const file of fs.readdirSync(srcRoot).filter((entry) => entry.endsWith('.ts') || entry.endsWith('.tsx'))) {
    const source = fs.readFileSync(path.join(srcRoot, file), 'utf8');
    for (const match of source.matchAll(/export\s+(?:const|let|var|function|class|interface|type|enum)\s+([A-Za-z_$][\w$]*)/g)) names.add(match[1]);
    for (const match of source.matchAll(/export\s+\{([^}]+)\}/g)) {
      for (const item of match[1].split(',')) names.add(item.trim().split(/\s+as\s+/)[0].replace(/\s+from\s+.*/, '').trim());
    }
  }
  return [...names].filter(Boolean);
}

function countLinesAndFiles(dir) {
  let fileCount = 0;
  let lineCount = 0;
  let byteCount = 0;

  function walk(current) {
    if (!fs.existsSync(current)) return;
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === '__pycache__' || entry.name === 'dist') continue;
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile()) {
        fileCount += 1;
        try {
          const content = fs.readFileSync(fullPath, 'utf8');
          lineCount += content.split('\n').length;
          byteCount += Buffer.byteLength(content, 'utf8');
        } catch {
          // binary or inaccessible file
        }
      }
    }
  }

  walk(dir);
  return { fileCount, lineCount, byteCount };
}

function createPackageData(directory) {
  const name = path.basename(directory);
  const manifest = readJson(path.join(directory, 'package.json')) || {};
  const pyprojectPath = path.join(directory, 'pyproject.toml');
  let pythonName = null;
  if (fs.existsSync(pyprojectPath)) {
    const match = fs.readFileSync(pyprojectPath, 'utf8').match(/^name\s*=\s*"([^"]+)"/m);
    pythonName = match?.[1] || null;
  }
  const python = extractPythonExports(directory);
  const readmePath = path.join(directory, 'README.md');
  const readme = fs.existsSync(readmePath) ? fs.readFileSync(readmePath, 'utf8') : '';
  const exportsMap = manifest.exports && typeof manifest.exports === 'object'
    ? Object.keys(manifest.exports)
    : ['.'];

  return {
    id: name,
    name: manifest.name || name,
    displayName: manifest.name || name,
    hasNpmManifest: fs.existsSync(path.join(directory, 'package.json')),
    hasPythonManifest: fs.existsSync(pyprojectPath),
    description: manifest.description || '',
    version: manifest.version || '1.0.0',
    license: manifest.license || 'MIT',
    pythonName,
    pythonModule: python.module,
    pythonExports: python.exports,
    typeScriptExports: extractTypeScriptExports(directory),
    exports: exportsMap,
    scripts: manifest.scripts || {},
    readmeBlocks: markdownBlocks(readme),
  };
}

function getWorkspaceData() {
  const packageDirectories = fs.existsSync(packagesRoot)
    ? fs.readdirSync(packagesRoot, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .filter((entry) => !entry.name.startsWith('.') && entry.name !== 'Web')
      .map((entry) => path.join(packagesRoot, entry.name))
      .filter((directory) => fs.existsSync(path.join(directory, 'package.json')) || fs.existsSync(path.join(directory, 'pyproject.toml')))
      .map(createPackageData)
      .sort((a, b) => a.displayName.localeCompare(b.displayName))
    : [];

  const rootPackage = readJson(path.join(workspaceRoot, 'package.json')) || {};
  const guidePath = path.join(docsRoot, 'PACKAGES_DESIGN_GUIDE.md');
  const guide = fs.existsSync(guidePath) ? fs.readFileSync(guidePath, 'utf8') : '';

  const portGuidePath = path.join(docsRoot, 'PROJECTS_PORT_AND_FRAMEWORK_GUIDE.md');
  const portGuide = fs.existsSync(portGuidePath) ? fs.readFileSync(portGuidePath, 'utf8') : '';

  const techStackPath = path.join(docsRoot, 'TECH_STACK.md');
  const techStack = fs.existsSync(techStackPath) ? fs.readFileSync(techStackPath, 'utf8') : '';

  const projectRulesPath = path.join(docsRoot, 'PROJECTS_RULES_AND_STANDARDS_GUIDE.md');
  const projectRules = fs.existsSync(projectRulesPath) ? fs.readFileSync(projectRulesPath, 'utf8') : '';

  const cheatsheetPath = path.join(docsRoot, 'MONOREPO_COMPLIANCE_CHEATSHEET.md');
  const cheatsheet = fs.existsSync(cheatsheetPath) ? fs.readFileSync(cheatsheetPath, 'utf8') : '';

  const projectsRaw = readJson(path.join(workspaceRoot, 'projects.json')) || {};
  const projectsList = Object.entries(projectsRaw).map(([pid, spec]) => {
    const projDir = path.join(workspaceRoot, 'Soul-DevPortal-Projects', pid);
    const pkgJson = fs.existsSync(path.join(projDir, 'package.json'))
      ? readJson(path.join(projDir, 'package.json')) || {}
      : {};
    const metaJson = fs.existsSync(path.join(projDir, 'metadata.json'))
      ? readJson(path.join(projDir, 'metadata.json')) || {}
      : {};
    const readmeFile = path.join(projDir, 'README.md');
    const readmeContent = fs.existsSync(readmeFile) ? fs.readFileSync(readmeFile, 'utf8') : '';

    // Extract directory file tree
    let fileTree = [];
    if (fs.existsSync(projDir)) {
      try {
        fileTree = fs.readdirSync(projDir)
          .filter((f) => !f.startsWith('.') && f !== 'node_modules' && f !== '__pycache__' && f !== '.git' && f !== '.vscode' && f !== '.vite')
          .map((f) => {
            const isDir = fs.statSync(path.join(projDir, f)).isDirectory();
            return isDir ? `${f}/` : f;
          });
      } catch (e) {}
    }

    // Extract env variable keys from .env.example and metadata
    const envKeysSet = new Set(metaJson.configuration || []);
    const envExamplePath = path.join(projDir, '.env.example');
    if (fs.existsSync(envExamplePath)) {
      try {
        const envLines = fs.readFileSync(envExamplePath, 'utf8').split('\n');
        for (const line of envLines) {
          const m = line.match(/^\s*([A-Z0-9_]+)\s*=/);
          if (m) envKeysSet.add(m[1]);
        }
      } catch (e) {}
    }

    // Extract database tables from schema sql if present
    const tables = [];
    const schemaSqlPath = path.join(projDir, 'database_schema.sql');
    if (fs.existsSync(schemaSqlPath)) {
      try {
        const sql = fs.readFileSync(schemaSqlPath, 'utf8');
        for (const m of sql.matchAll(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([A-Za-z0-9_]+)/gi)) {
          tables.push(m[1]);
        }
      } catch (e) {}
    }

    // Project logo discovery
    let logo = null;
    const logoPngPath = path.join(workspaceRoot, 'public/project-logos', `${pid}.png`);
    const logoSvgPath = path.join(workspaceRoot, 'public/project-logos', `${pid}.svg`);
    if (fs.existsSync(logoSvgPath)) logo = `/project-logos/${pid}.svg`;
    else if (fs.existsSync(logoPngPath)) logo = `/project-logos/${pid}.png`;

    return {
      id: pid,
      title: spec.title || metaJson.name || pid,
      logo,
      frontendPort: spec.frontend_port || null,
      backendPort: spec.backend_port || null,
      frontendActive: false,
      backendActive: false,
      frontendCmd: Array.isArray(spec.frontend_cmd) ? spec.frontend_cmd.join(' ') : spec.frontend_cmd || '',
      backendCmd: Array.isArray(spec.backend_cmd) ? spec.backend_cmd.join(' ') : spec.backend_cmd || null,
      framework: spec.framework || 'Web Application',
      dbInfo: spec.db_info || 'Local Storage',
      aiEngine: spec.ai_engine || 'N/A',
      description: metaJson.description || pkgJson.description || '',
      version: pkgJson.version || '1.0.0',
      features: metaJson.features || [],
      apiEndpoints: metaJson.apiEndpoints || [],
      localServices: metaJson.localServices || {
        frontend: spec.frontend_port ? `http://localhost:${spec.frontend_port}` : undefined,
        backend: spec.backend_port ? `http://localhost:${spec.backend_port}` : undefined,
      },
      configuration: Array.from(envKeysSet),
      envKeys: Array.from(envKeysSet),
      fileTree,
      tables,
      scripts: pkgJson.scripts || {},
      dependencies: pkgJson.dependencies || {},
      devDependencies: pkgJson.devDependencies || {},
      readmeBlocks: markdownBlocks(readmeContent),
    };
  });

  const metrics = countLinesAndFiles(packagesRoot);
  const totalSymbols = packageDirectories.reduce(
    (acc, pkg) => acc + (pkg.typeScriptExports?.length || 0) + (pkg.pythonExports?.length || 0),
    0
  );

  return {
    packages: packageDirectories,
    projects: projectsList,
    rootScripts: rootPackage.scripts || {},
    rootWorkspaces: rootPackage.workspaces || ['packages/*'],
    guideBlocks: markdownBlocks(guide),
    portGuideBlocks: markdownBlocks(portGuide),
    techStackBlocks: markdownBlocks(techStack),
    projectRulesBlocks: markdownBlocks(projectRules),
    cheatsheetBlocks: markdownBlocks(cheatsheet),
    stats: {
      packagesCount: packageDirectories.length,
      projectsCount: projectsList.length,
      totalFiles: metrics.fileCount,
      totalLines: metrics.lineCount,
      totalSymbols,
      totalBytes: metrics.byteCount,
    },
  };
}

export default defineConfig({
  resolve: {
    alias: {
      '@workspace/logger': path.resolve(packagesRoot, 'logger', 'src', 'index.ts'),
      '@workspace/config': path.resolve(packagesRoot, 'config'),
      '@workspace/runner': path.resolve(packagesRoot, 'runner'),
    },
  },
  plugins: [
    tailwindcss(),
    react(),
    workspaceLoggerPlugin(),
    {
      name: 'workspace-package-data',
      resolveId(id) {
        if (id === virtualModuleId) return resolvedVirtualModuleId;
      },
      load(id) {
        if (id === resolvedVirtualModuleId) {
          // Watch documentation markdown files and project registries
          if (fs.existsSync(docsRoot)) {
            const docFiles = fs.readdirSync(docsRoot).filter((f) => f.endsWith('.md'));
            for (const docFile of docFiles) {
              this.addWatchFile(path.join(docsRoot, docFile));
            }
          }
          this.addWatchFile(path.join(workspaceRoot, 'projects.json'));
          this.addWatchFile(path.join(workspaceRoot, 'package.json'));

          const generatedPath = path.resolve(__dirname, 'backend', 'exporters', 'data', 'workspace.json');
          if (fs.existsSync(generatedPath)) {
            return `export default ${fs.readFileSync(generatedPath, 'utf8')};`;
          }
          return `export default ${JSON.stringify(getWorkspaceData())};`;
        }
      },
      handleHotUpdate({ file, server }) {
        if (
          file.includes('Soul-DevPortal-Docs') ||
          file.endsWith('projects.json') ||
          file.includes('Soul-DevPortal-Packages') ||
          file.includes('Soul-DevPortal-Projects')
        ) {
          const mod = server.moduleGraph.getModuleById(resolvedVirtualModuleId);
          if (mod) {
            server.moduleGraph.invalidateModule(mod);
          }
          server.ws.send({
            type: 'full-reload',
            path: '*',
          });
        }
      },
    },
  ],
  server: {
    port: 5181,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8008',
        changeOrigin: true,
      },
    },
    fs: {
      allow: [workspaceRoot],
    },
  },
});
