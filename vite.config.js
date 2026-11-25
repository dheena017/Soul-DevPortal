import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { workspaceLoggerPlugin } from './Soul-DevPortal-Packages/logger/external/client/vite-plugin.ts';

const virtualModuleId = 'virtual:workspace-packages';
const resolvedVirtualModuleId = `\0${virtualModuleId}`;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packagesRoot = path.resolve(__dirname, 'Soul-DevPortal-Packages');
const docsRoot = path.resolve(__dirname, 'Soul-DevPortal-Docs');
const workspaceRoot = __dirname;

function formatRelativeTime(date) {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return `${Math.max(1, diffSec)}s`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 30) return `${diffDay}d`;
  const diffMonth = Math.floor(diffDay / 30);
  return `${diffMonth}mo`;
}

function getPathGitMeta(targetPath) {
  try {
    if (fs.existsSync(targetPath)) {
      try {
        const out = execFileSync('git', ['log', '-n', '1', '--pretty=format:%cI|%cr|%h', '--', targetPath], {
          encoding: 'utf8',
          stdio: ['ignore', 'pipe', 'ignore'],
        }).trim();
        if (out) {
          const [iso, rel, hash] = out.split('|');
          const date = new Date(iso);
          return { updatedAt: iso, relativeTime: formatRelativeTime(date), commitHash: hash };
        }
      } catch (e) {}
      const stat = fs.statSync(targetPath);
      let mtime = stat.mtime;
      if (stat.isDirectory()) {
        try {
          const files = fs.readdirSync(targetPath);
          for (const f of files.slice(0, 15)) {
            const fileStat = fs.statSync(path.join(targetPath, f));
            if (fileStat.mtime > mtime) {
              mtime = fileStat.mtime;
            }
          }
        } catch (e) {}
      }
      return { updatedAt: mtime.toISOString(), relativeTime: formatRelativeTime(mtime), commitHash: null };
    }
  } catch (e) {}
  return { updatedAt: new Date().toISOString(), relativeTime: '21h', commitHash: null };
}

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
    if (/^(?:<\/?(?:div|center|p|span|section|article|header|footer|details|summary|figure|figcaption)\b[^>]*>|<!--[\s\S]*-->)$/i.test(line.trim())) continue;
    if (/^(?:-{3,}|\*{3,}|_{3,}|<hr\s*\/?>)$/i.test(line.trim())) {
      blocks.push({ type: 'hr' });
      continue;
    }

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
  const resolveDocFiles = (relPaths) => {
    const parts = [];
    for (const rel of relPaths) {
      const p = path.join(docsRoot, rel);
      if (fs.existsSync(p)) {
        parts.push(fs.readFileSync(p, 'utf8'));
      }
    }
    return parts.join('\n\n---\n\n');
  };

  // Crawl all markdown files in Soul-DevPortal-Docs into docsBlocksMap and docsHierarchy
  const docsBlocksMap = {};
  const docsHierarchy = [];

  if (fs.existsSync(docsRoot)) {
    try {
      const catDirs = fs.readdirSync(docsRoot, { withFileTypes: true })
        .filter((d) => d.isDirectory() && !d.name.startsWith('.'));

      for (const catDir of catDirs) {
        const catId = catDir.name;
        const catPath = path.join(docsRoot, catId);
        const categoryEntry = {
          id: catId,
          title: catId.split('-').slice(1).join(' ').replace(/\b\w/g, (c) => c.toUpperCase()) || catId,
          topics: [],
          rootTabs: [],
        };

        const items = fs.readdirSync(catPath, { withFileTypes: true });
        for (const item of items) {
          if (item.isDirectory() && !item.name.startsWith('.')) {
            const topicId = item.name;
            const topicPath = path.join(catPath, topicId);
            const topicEntry = {
              id: topicId,
              title: topicId.replace(/^project-/, '').replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
              tabs: [],
            };
            const topicFiles = fs.readdirSync(topicPath, { withFileTypes: true })
              .filter((f) => f.isFile() && f.name.endsWith('.md'));

            for (const tf of topicFiles) {
              const relPath = `${catId}/${topicId}/${tf.name}`;
              const fullPath = path.join(topicPath, tf.name);
              try {
                const content = fs.readFileSync(fullPath, 'utf8');
                const blocks = markdownBlocks(content);
                docsBlocksMap[relPath] = blocks;
                topicEntry.tabs.push({
                  id: tf.name.replace('.md', ''),
                  label: tf.name === 'main.md' ? 'Specification' : tf.name === 'rules.md' ? 'Rules & Invariants' : tf.name.replace('.md', ''),
                  filename: tf.name,
                  relativePath: relPath,
                  headings: blocks.filter((b) => b.type === 'h2' || b.type === 'h3'),
                });
              } catch (e) {}
            }
            categoryEntry.topics.push(topicEntry);
          } else if (item.isFile() && item.name.endsWith('.md')) {
            const relPath = `${catId}/${item.name}`;
            const fullPath = path.join(catPath, item.name);
            try {
              const content = fs.readFileSync(fullPath, 'utf8');
              const blocks = markdownBlocks(content);
              docsBlocksMap[relPath] = blocks;
              categoryEntry.rootTabs.push({
                id: item.name.replace('.md', ''),
                label: item.name.replace('.md', '').replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
                filename: item.name,
                relativePath: relPath,
                headings: blocks.filter((b) => b.type === 'h2' || b.type === 'h3'),
              });
            } catch (e) {}
          }
        }
        docsHierarchy.push(categoryEntry);
      }
    } catch (e) {}
  }

  const guide = resolveDocFiles([
    '02-packages-architecture/main.md',
  ]);
  const portGuide = resolveDocFiles([
    '03-networking-and-ports/main.md',
  ]);
  const techStack = resolveDocFiles([
    '01-project-architecture/main.md',
  ]);
  const projectRules = resolveDocFiles([
    '01-project-architecture/golden-rules.md',
  ]);
  const cheatsheet = resolveDocFiles([
    '04-cheatsheets/main.md',
  ]);

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

    // Extract real recursive directory file tree
    let fileTree = [];
    if (fs.existsSync(projDir)) {
      try {
        const walk = (dir, prefix = '') => {
          const entries = fs.readdirSync(dir, { withFileTypes: true });
          for (const entry of entries) {
            const name = entry.name;
            if (
              name.startsWith('.git') ||
              name === 'node_modules' ||
              name === '__pycache__' ||
              name === '.venv' ||
              name === 'dist' ||
              name === '.vscode' ||
              name === '.vite'
            ) {
              continue;
            }
            const relPath = prefix ? `${prefix}/${name}` : name;
            if (entry.isDirectory()) {
              fileTree.push(`${relPath}/`);
              walk(path.join(dir, name), relPath);
            } else {
              fileTree.push(relPath);
            }
          }
        };
        walk(projDir);
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

    // API endpoints defined in metadata (authoritative routing provided by FastAPI server)
    const apiEndpoints = metaJson.apiEndpoints || [];

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
      apiEndpoints,
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
    docsHierarchy,
    docsBlocksMap,
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

function cleanReactPlugin() {
  const plugins = react({ disableOxcRecommendation: true });
  return plugins.map((p) => {
    if (p.name === 'vite:react-babel') {
      return {
        ...p,
        config() {
          return {
            oxc: {
              jsx: {
                runtime: 'automatic',
              },
            },
            optimizeDeps: {
              rolldownOptions: {},
            },
          };
        },
      };
    }
    return p;
  });
}

export default defineConfig({
  resolve: {
    alias: {
      '@workspace/logger': path.resolve(packagesRoot, 'logger', 'external', 'client', 'index.ts'),
      '@workspace/config/tailwind/tokens': path.resolve(packagesRoot, 'config', 'external', 'presets', 'tailwind', 'tokens.js'),
      '@workspace/config/tailwind/preset': path.resolve(packagesRoot, 'config', 'external', 'presets', 'tailwind', 'preset.js'),
      '@workspace/config': path.resolve(packagesRoot, 'config', 'external', 'presets', 'tailwind', 'tokens.js'),
      '@workspace/runner': path.resolve(packagesRoot, 'runner'),
    },
  },
  plugins: [
    tailwindcss(),
    cleanReactPlugin(),
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

          const generatedPath = path.resolve(__dirname, 'server', 'exporters', 'data', 'workspace.json');
          if (fs.existsSync(generatedPath)) {
            return `export default ${fs.readFileSync(generatedPath, 'utf8')};`;
          }
          return `export default ${JSON.stringify(getWorkspaceData())};`;
        }
      },
      handleHotUpdate({ file, server }) {
        // Ignore database, WAL, logs, pycache, and binary files
        if (
          file.endsWith('.db') ||
          file.endsWith('.db-shm') ||
          file.endsWith('.db-wal') ||
          file.endsWith('.sqlite') ||
          file.endsWith('.sqlite3') ||
          file.endsWith('.log') ||
          file.includes('__pycache__') ||
          file.includes(path.join('server', 'data')) ||
          file.includes('.vite')
        ) {
          return [];
        }

        // Only reload virtual module if documentation, manifest, or package metadata changed
        const isDoc = file.includes('Soul-DevPortal-Docs') && file.endsWith('.md');
        const isManifest = file.endsWith('projects.json') || file.endsWith('package.json');
        const isPkgMeta =
          (file.includes('Soul-DevPortal-Packages') || file.includes('Soul-DevPortal-Projects')) &&
          (file.endsWith('package.json') || file.endsWith('metadata.json') || file.endsWith('README.md') || file.endsWith('pyproject.toml'));

        if (isDoc || isManifest || isPkgMeta) {
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
    host: true,
    port: 5181,
    watch: {
      ignored: [
        '**/*.db',
        '**/*.db-wal',
        '**/*.db-shm',
        '**/*.sqlite',
        '**/*.sqlite3',
        '**/*.log',
        '**/__pycache__/**',
        '**/server/data/**',
        '**/node_modules/**',
        '**/.git/**',
      ],
    },
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
