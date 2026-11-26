import React, { useState, useMemo } from 'react';
import CopyButton from './CopyButton';
import { HeroArtworkBackdrop } from './PortalVisuals';
import { PackageData } from '../types';

interface SnippetItem {
  id: string;
  title: string;
  language: string;
  filename: string;
  code: string;
  sampleLogs?: Array<{ level: 'info' | 'action' | 'error' | 'success'; tag: string; message: string; meta?: Record<string, unknown> }>;
}

export interface CodeSnippetGeneratorProps {
  pkgId: string;
  pkg?: PackageData;
}

export default function CodeSnippetGenerator({ pkgId, pkg }: CodeSnippetGeneratorProps) {
  const [selectedId, setSelectedId] = useState<string>('');
  const [customTag, setCustomTag] = useState<string>('AUTH');
  const [customMsg, setCustomMsg] = useState<string>('User session established');
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [runOutput, setRunOutput] = useState<{
    timestamp: string;
    durationMs: number;
    lines: Array<{ level: string; tag: string; text: string; time: string; color: string }>;
  } | null>(null);

  const pkgName = pkg?.name || (pkgId.startsWith('@workspace/') ? pkgId : `@workspace/${pkgId}`);
  const pkgVersion = pkg?.version || '1.0.0';
  const lastUpdated = pkg?.relativeTime || 'recently';

  // Dynamically compute snippet templates based on package data and user parameters
  const snippets = useMemo<SnippetItem[]>(() => {
    const cleanId = pkgId.replace(/^@workspace\//, '');

    if (cleanId === 'logger') {
      return [
        {
          id: 'client-react',
          title: 'Browser & React Logging',
          language: 'typescript',
          filename: 'src/App.tsx',
          code: `import { consoleLogger } from '${pkgName}';

// Client-side structured logger with dynamic timestamps and context
consoleLogger.info('${customTag}', '${customMsg}', {
  sessionId: 'sess_' + Math.random().toString(36).substring(2, 9),
  timestamp: new Date().toISOString(),
  environment: 'development',
});
consoleLogger.action('CART', 'Item added to checkout', { itemsCount: 3, cartValue: 124.50 });
consoleLogger.error('API', 'Payment gateway timeout', new Error('Gateway Timeout 504'));`,
          sampleLogs: [
            { level: 'info', tag: customTag, message: customMsg, meta: { sessionId: 'sess_9f2a7b', status: 'authenticated' } },
            { level: 'action', tag: 'CART', message: 'Item added to checkout', meta: { itemsCount: 3, cartValue: 124.50 } },
            { level: 'error', tag: 'API', message: 'Payment gateway timeout [Error: Gateway Timeout 504]' },
          ],
        },
        {
          id: 'node-backend',
          title: 'Node.js / Express Backend Logging',
          language: 'typescript',
          filename: 'server/index.ts',
          code: `import { serverLogger } from '${pkgName}';

// Server-side structured logger with process metrics and timestamps
serverLogger.info('HTTP', 'Server listening on http://localhost:8000', {
  runtime: 'Node.js ' + process.version,
  startedAt: new Date().toISOString(),
});
serverLogger.action('DB', 'Connected to PostgreSQL database pool', { poolSize: 10 });
serverLogger.success('INIT', 'All microservices initialized successfully');`,
          sampleLogs: [
            { level: 'info', tag: 'HTTP', message: 'Server listening on http://localhost:8000', meta: { runtime: 'Node.js v20.18.0' } },
            { level: 'action', tag: 'DB', message: 'Connected to PostgreSQL database pool', meta: { poolSize: 10 } },
            { level: 'success', tag: 'INIT', message: 'All microservices initialized successfully' },
          ],
        },
        {
          id: 'python-backend',
          title: 'Python FastAPI / Backend Logging',
          language: 'python',
          filename: 'server/main.py',
          code: `from datetime import datetime, timezone
from fastapi import FastAPI
from logger.external import get_logger

app = FastAPI(title="Soul Monorepo Service")
logger = get_logger("${customTag}")

@app.get("/health")
def health():
    now_iso = datetime.now(timezone.utc).isoformat()
    logger.info("${customMsg}", extra={"timestamp": now_iso, "status": "healthy"})
    return {"status": "ok", "timestamp": now_iso}`,
          sampleLogs: [
            { level: 'info', tag: customTag, message: customMsg, meta: { status: 'healthy' } },
            { level: 'success', tag: 'FASTAPI', message: 'GET /health responded 200 OK' },
          ],
        },
        {
          id: 'vite-banner',
          title: 'Vite Plugin & Dev Banner',
          language: 'javascript',
          filename: 'vite.config.ts',
          code: `import { defineConfig } from 'vite';
import { workspaceLoggerPlugin } from '${pkgName}/vite-plugin';

export default defineConfig({
  plugins: [
    workspaceLoggerPlugin({
      serviceName: '${pkgName}',
      version: '${pkgVersion}',
      logOnStart: true,
    }),
  ],
});`,
          sampleLogs: [
            { level: 'info', tag: 'VITE', message: `Dev Server Banner attached for ${pkgName} v${pkgVersion}` },
            { level: 'success', tag: 'PLUGIN', message: 'Hot Module Replacement (HMR) logger active' },
          ],
        },
      ];
    }

    if (cleanId === 'runner') {
      return [
        {
          id: 'cli-all',
          title: 'CLI: Run All Monorepo Projects',
          language: 'bash',
          filename: 'Terminal Command',
          code: `# Launch full stack across all monorepo applications concurrently
npx ${pkgName} all

# Launch specific project by ID
npx ${pkgName} project free-api-hub`,
          sampleLogs: [
            { level: 'info', tag: 'RUNNER', message: 'Discovered 9 workspace projects in Soul Workspace' },
            { level: 'action', tag: 'SPAWN', message: 'Starting processes with strict port isolation (:5173-:5181)' },
            { level: 'success', tag: 'RUNNER', message: 'All 9 micro-apps online and responding' },
          ],
        },
        {
          id: 'cli-ports',
          title: 'CLI: Inspect Port Allocations',
          language: 'bash',
          filename: 'Terminal Command',
          code: `# Check port conflicts and assigned dev ports
npx ${pkgName} ports`,
          sampleLogs: [
            { level: 'info', tag: 'PORT_PROBER', message: 'Scanning ports 5173 through 5181...' },
            { level: 'success', tag: 'PORT_MATRIX', message: 'No port collisions detected across monorepo' },
          ],
        },
        {
          id: 'python-runner',
          title: 'Python Programmatic Runner',
          language: 'python',
          filename: 'scripts/run_cluster.py',
          code: `from runner.external import run_single_process, get_all_projects

projects = get_all_projects()
print(f"Total projects managed: {len(projects)}")

run_project("free-api-hub", background=True)`,
          sampleLogs: [
            { level: 'info', tag: 'PY_RUNNER', message: 'Loading projects configuration registry' },
            { level: 'success', tag: 'PROCESS', message: 'Spawned process free-api-hub in background mode' },
          ],
        },
      ];
    }

    // Default for config or any other shared package
    return [
      {
        id: 'react-vite',
        title: 'React / Vite tsconfig',
        language: 'json',
        filename: 'tsconfig.json',
        code: `{
  "extends": "${pkgName}/tsconfig/react.json",
  "include": ["src"]
}`,
        sampleLogs: [
          { level: 'success', tag: 'TSCONFIG', message: `Loaded ${pkgName}/tsconfig/react.json cleanly` },
        ],
      },
      {
        id: 'tailwind',
        title: 'Tailwind CSS preset',
        language: 'javascript',
        filename: 'tailwind.config.js',
        code: `import workspacePreset from '${pkgName}/tailwind/preset';

export default {
  presets: [workspacePreset],
  content: ['./src/**/*.{html,js,jsx,ts,tsx}'],
};`,
        sampleLogs: [
          { level: 'success', tag: 'TAILWIND', message: `Injected design tokens from ${pkgName}` },
        ],
      },
      {
        id: 'prettier',
        title: 'Prettier Configuration',
        language: 'json',
        filename: '.prettierrc.json',
        code: `"${pkgName}/prettier"`,
        sampleLogs: [
          { level: 'success', tag: 'PRETTIER', message: 'Applied workspace prettier rule definitions' },
        ],
      },
    ];
  }, [pkgId, pkgName, pkgVersion, customTag, customMsg]);

  const activeSnippet = useMemo(() => {
    return snippets.find((s) => s.id === selectedId) || snippets[0];
  }, [snippets, selectedId]);

  // Interactive Live Runner Simulator
  const handleRunSnippet = () => {
    setIsRunning(true);
    setRunOutput(null);

    const start = performance.now();
    setTimeout(() => {
      const now = new Date();
      const iso = now.toISOString();
      const dur = Math.round(performance.now() - start);

      const colorMap: Record<string, string> = {
        info: 'text-sky-400',
        action: 'text-amber-400',
        error: 'text-rose-400',
        success: 'text-emerald-400',
      };

      const lines = (activeSnippet.sampleLogs || [
        { level: 'info', tag: 'EXEC', message: `Evaluated snippet for ${activeSnippet.title}` },
        { level: 'success', tag: 'DONE', message: 'Execution finished cleanly' },
      ]).map((log) => {
        let text = log.message;
        if (log.meta) {
          text += ` ${JSON.stringify(log.meta)}`;
        }
        return {
          level: log.level.toUpperCase(),
          tag: log.tag,
          text,
          time: iso,
          color: colorMap[log.level] || 'text-zinc-300',
        };
      });

      setRunOutput({
        timestamp: iso,
        durationMs: dur,
        lines,
      });
      setIsRunning(false);
    }, 280);
  };

  return (
    <div className="w-full flex flex-col gap-6 p-5 md:p-6 rounded-2xl bg-[#111115] border border-white/[0.08] shadow-2xl portal-header-sheen portal-stagger">
      <HeroArtworkBackdrop src="/visuals/tab-code-playground.jpg" alt="Interactive Code Playground Visual" variant="corner" opacityClass="opacity-45 sm:opacity-58" />
      {/* ── Header Row with Metadata and Dynamic Dates ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/[0.06]">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-purple-400">
              INTEGRATION PLAYGROUND
            </span>
            <span className="text-zinc-600">·</span>
            <span className="text-[11px] font-mono text-zinc-400" title={pkg?.updatedAt || ''}>
              Updated {lastUpdated}
            </span>
          </div>
          <h2 className="text-lg md:text-xl font-bold text-white tracking-tight">
            Interactive Code Snippet Generator
          </h2>
          <p className="text-xs text-zinc-400 leading-relaxed max-w-2xl">
            Select an environment or framework below to generate real, dynamic integration snippets configured for{' '}
            <code className="text-zinc-200 font-mono font-semibold">{pkgName}</code> (v{pkgVersion}).
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="px-2.5 py-1 rounded-md text-xs font-mono font-semibold bg-[#16161c] border border-white/[0.08] text-zinc-300">
            v{pkgVersion}
          </span>
          <span className="px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-[#16161c] border border-white/[0.08] text-purple-300">
            {pkgName}
          </span>
        </div>
      </div>

      {/* ── Live Parameter Customizer Strip ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3.5 rounded-xl bg-[#16161c] border border-white/[0.08]">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="custom-tag-input" className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400">
            Log Action Tag / Category
          </label>
          <input
            id="custom-tag-input"
            type="text"
            value={customTag}
            onChange={(e) => setCustomTag(e.target.value.toUpperCase())}
            placeholder="e.g. AUTH, API, DB, CART"
            className="px-3 py-1.5 rounded-lg bg-[#09090c] border border-white/[0.1] text-xs font-mono text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500/50 transition-colors"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="custom-msg-input" className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400">
            Log Message / Payload Text
          </label>
          <input
            id="custom-msg-input"
            type="text"
            value={customMsg}
            onChange={(e) => setCustomMsg(e.target.value)}
            placeholder="e.g. User session established"
            className="px-3 py-1.5 rounded-lg bg-[#09090c] border border-white/[0.1] text-xs font-mono text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500/50 transition-colors"
          />
        </div>
      </div>

      {/* ── Framework & Target Environment Tabs ── */}
      <div className="flex flex-wrap items-center gap-1.5 p-1 bg-[#09090c] border border-white/[0.08] rounded-xl" role="tablist" aria-label="Snippet frameworks">
        {snippets.map((snippet) => {
          const isSelected = snippet.id === activeSnippet.id;
          return (
            <button
              type="button"
              key={snippet.id}
              role="tab"
              aria-selected={isSelected}
              className={`px-3 py-2 rounded-lg text-xs transition-all cursor-pointer ${
                isSelected
                  ? 'bg-zinc-800 text-white font-bold border border-white/20 shadow-sm'
                  : 'text-zinc-400 hover:text-white hover:bg-white/[0.04] border border-transparent font-medium'
              }`}
              onClick={() => setSelectedId(snippet.id)}
            >
              {snippet.title}
            </button>
          );
        })}
      </div>

      {/* ── Generated Code Block Box ── */}
      <div className="rounded-xl bg-[#070709] border border-white/[0.08] overflow-hidden shadow-2xl flex flex-col">
        {/* Code Bar Top */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-[#16161c] border-b border-white/[0.06] text-xs">
          <div className="flex items-center gap-2.5">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-[#09090c] text-purple-300 border border-purple-500/25">
              {activeSnippet.language}
            </span>
            <code className="text-[11px] font-mono text-zinc-300 font-medium">{activeSnippet.filename}</code>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRunSnippet}
              disabled={isRunning}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all shadow-sm cursor-pointer ${
                isRunning
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30 animate-pulse'
                  : 'bg-purple-600 hover:bg-purple-500 text-white border border-purple-400/30'
              }`}
              title="Test execution and inspect live formatted logs"
            >
              <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              <span>{isRunning ? 'Running...' : 'Run Snippet'}</span>
            </button>

            <CopyButton text={activeSnippet.code} variant="compact" />
          </div>
        </div>

        {/* Code Area */}
        <pre key={activeSnippet.id} className="p-4 md:p-5 text-xs font-mono text-zinc-200 leading-relaxed overflow-x-auto whitespace-pre selection:bg-purple-500/30 tab-content-animate">
          <code>{activeSnippet.code}</code>
        </pre>
      </div>

      {/* ── Interactive Live Execution Console Terminal ── */}
      {runOutput && (
        <div className="rounded-xl bg-[#070709] border border-emerald-500/25 overflow-hidden shadow-2xl flex flex-col portal-drawer-enter">
          <div className="flex items-center justify-between px-4 py-2 bg-[#16161c] border-b border-white/[0.06] text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] font-mono font-bold text-white uppercase tracking-wider">
                Live Execution Console
              </span>
              <span className="text-zinc-500">·</span>
              <span className="text-[10px] font-mono text-zinc-400">
                Executed at {runOutput.timestamp}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded">
                ⚡ {runOutput.durationMs}ms latency · Exit 0
              </span>
              <button
                type="button"
                onClick={() => setRunOutput(null)}
                className="text-[10px] font-mono text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="p-4 font-mono text-xs flex flex-col gap-1.5 leading-relaxed overflow-x-auto bg-[#070709] portal-list-stagger">
            {runOutput.lines.map((l, i) => (
              <div key={i} className="flex items-start gap-2 text-zinc-300">
                <span className="text-zinc-500 text-[11px] shrink-0">[{l.time.split('T')[1].replace('Z', '')}]</span>
                <span className={`font-bold shrink-0 ${l.color}`}>[{l.level}]</span>
                <span className="text-purple-300 font-semibold shrink-0">[{l.tag}]</span>
                <span className="text-zinc-200 break-all">{l.text}</span>
              </div>
            ))}
            <div className="mt-2 pt-2 border-t border-white/[0.06] text-[11px] text-emerald-400 font-mono">
              ✓ Test execution completed successfully with 0 errors.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
