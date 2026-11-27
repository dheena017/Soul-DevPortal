import React, { useMemo, useState } from 'react';
import { PackageData, ProjectData } from '../../../types';
import { tokens } from '@workspace/config/tailwind/tokens';
import CopyButton from '../../../components/CopyButton';

export interface PackagePreviousTabProps {
  pkg: PackageData;
  allPackages?: PackageData[];
  projects?: ProjectData[];
  onSelectPackage?: (packageId: string) => void;
}

interface SimulatedLogLine {
  id: string;
  time: string;
  service: string;
  level: 'INFO' | 'OK' | 'WARN' | 'ERROR';
  tag: string;
  message: string;
}

const INITIAL_LOGGER_LINES: SimulatedLogLine[] = [
  {
    id: 'l1',
    time: '09:50:12',
    service: 'BACKEND ',
    level: 'INFO',
    tag: 'SYSTEM        ',
    message: 'Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)',
  },
  {
    id: 'l2',
    time: '09:50:13',
    service: 'SERVER  ',
    level: 'OK',
    tag: 'HEALTHCHECK   ',
    message: 'API server active at http://127.0.0.1:8000 (0.42s)',
  },
  {
    id: 'l3',
    time: '09:50:14',
    service: 'DATABASE',
    level: 'INFO',
    tag: 'SQLITE-WAL    ',
    message: 'PRAGMA journal_mode=WAL; busy_timeout=5000ms verified',
  },
  {
    id: 'l4',
    time: '09:50:16',
    service: 'HTTP    ',
    level: 'OK',
    tag: 'GET /api/data ',
    message: '200 OK · 14.2ms · 42 records serialized',
  },
  {
    id: 'l5',
    time: '09:50:18',
    service: 'AI      ',
    level: 'WARN',
    tag: 'GEMINI-2.5    ',
    message: 'Rate limit approaching (82% quota) · fallback ready',
  },
];

function levelBadgeClass(level: SimulatedLogLine['level']): string {
  if (level === 'OK') return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/35';
  if (level === 'WARN') return 'bg-amber-500/20 text-amber-300 border-amber-500/35';
  if (level === 'ERROR') return 'bg-rose-500/20 text-rose-300 border-rose-500/35';
  return 'bg-sky-500/20 text-sky-300 border-sky-400/35';
}

export default function PackagePreviousTab({
  pkg,
  allPackages = [],
  projects = [],
  onSelectPackage,
}: PackagePreviousTabProps) {
  const pkgKey = (pkg.id || '').toLowerCase();

  // Logger preview state
  const [logMode, setLogMode] = useState<'ansi' | 'json'>('ansi');
  const [logLines, setLogLines] = useState<SimulatedLogLine[]>(INITIAL_LOGGER_LINES);
  const [selectedLevel, setSelectedLevel] = useState<'ALL' | 'INFO' | 'OK' | 'WARN' | 'ERROR'>('ALL');

  // Runner preview state
  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    () => projects[0]?.id || 'apexmind-ai'
  );
  const [runnerEvents, setRunnerEvents] = useState<string[]>([
    '[09:50:01] [SUPERVISOR] Port sweep complete (all monorepo ports checked)',
    '[09:50:02] [BACKEND   ] FastAPI + Uvicorn socket bound and responding',
    '[09:50:03] [FRONTEND  ] Vite 8 HMR dev server ready',
  ]);

  const activeRunnerProject = useMemo(
    () => projects.find((p) => p.id === selectedProjectId) || projects[0],
    [projects, selectedProjectId]
  );

  const emitSampleLog = (level: SimulatedLogLine['level']) => {
    const samples: Record<SimulatedLogLine['level'], { service: string; tag: string; message: string }> = {
      INFO: { service: 'HTTP    ', tag: 'POST /api/run ', message: 'Request dispatched to FastAPI worker' },
      OK: { service: 'CACHE   ', tag: 'SYNC          ', message: 'Workspace AST cache refreshed (3.1ms)' },
      WARN: { service: 'PORT    ', tag: 'SWEEP         ', message: 'Port :8000 occupied by PID 14220 — freeing socket' },
      ERROR: { service: 'AUTH    ', tag: 'TOKEN         ', message: '401 Unauthorized · missing bearer header' },
    };
    const now = new Date().toTimeString().slice(0, 8);
    setLogLines((prev) => [
      ...prev.slice(-11),
      {
        id: `${Date.now()}`,
        time: now,
        level,
        ...samples[level],
      },
    ]);
  };

  const triggerRunnerAction = (key: string, label: string) => {
    const now = new Date().toTimeString().slice(0, 8);
    const title = activeRunnerProject?.id || 'apexmind-ai';
    setRunnerEvents((prev) => [
      ...prev.slice(-7),
      `[${now}] [HOTKEY:${key}] ${label} -> ${title}`,
    ]);
  };

  const filteredLogs = useMemo(
    () =>
      logLines.filter((l) => selectedLevel === 'ALL' || l.level === selectedLevel),
    [logLines, selectedLevel]
  );

  const tokenSwatches = useMemo(() => {
    const colors = (tokens?.colors || {}) as Record<string, any>;
    const list: Array<{ name: string; hex: string }> = [];
    for (const [k, v] of Object.entries(colors)) {
      if (typeof v === 'string' && v.startsWith('#')) {
        list.push({ name: k, hex: v });
      } else if (v && typeof v === 'object') {
        for (const [subK, subV] of Object.entries(v)) {
          if (typeof subV === 'string' && subV.startsWith('#')) {
            list.push({ name: subK === 'DEFAULT' ? k : `${k}.${subK}`, hex: subV });
          }
        }
      }
    }
    return list.slice(0, 12);
  }, []);

  return (
    <div className="flex flex-col gap-5">
      {/* ── Live Preview Banner ── */}
      <div className="neu-card bg-[#111115] border border-white/[0.08] rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400">
              LIVE PACKAGE PREVIEW IN REAL PROJECTS
            </span>
          </div>
          <h2 className="text-base sm:text-lg font-bold text-white">
            How <code className="text-purple-300">{pkg.name || `@workspace/${pkg.id}`}</code> Renders at Runtime
          </h2>
          <p className="text-xs text-zinc-400">
            Interactive simulation of this package&apos;s real output inside Soul Workspace applications.
          </p>
        </div>
        <CopyButton
          text={pkg.pythonModule ? `from ${pkg.pythonModule} import *` : `import {} from '${pkg.name}';`}
          label="Copy Import"
          variant="compact"
        />
      </div>

      {/* ── 1. @workspace/logger Live Preview ── */}
      {pkgKey === 'logger' && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          {/* Terminal 5-Column Output Preview */}
          <div className="neu-card bg-[#09090c] border border-white/[0.1] rounded-2xl overflow-hidden flex flex-col">
            <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-[#111115] border-b border-white/[0.08]">
              <span className="text-xs font-mono font-bold text-white">
                5-Column Server Terminal Output
              </span>
              <div className="flex items-center gap-1.5">
                {(['ALL', 'INFO', 'OK', 'WARN', 'ERROR'] as const).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setSelectedLevel(lvl)}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono border cursor-pointer ${
                      selectedLevel === lvl
                        ? 'bg-white/15 border-white/30 text-white font-bold'
                        : 'bg-[#16161c] border-white/[0.08] text-zinc-400 hover:text-white'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setLogMode((m) => (m === 'ansi' ? 'json' : 'ansi'))}
                  className="px-2 py-0.5 rounded bg-sky-500/15 border border-sky-400/30 text-[10px] font-mono text-sky-300 cursor-pointer"
                >
                  {logMode === 'ansi' ? 'JSON Mode' : '5-Col ANSI'}
                </button>
              </div>
            </div>

            <div className="p-4 flex flex-col gap-1.5 font-mono text-xs min-h-[260px] max-h-[320px] overflow-y-auto">
              {filteredLogs.map((line) =>
                logMode === 'json' ? (
                  <div key={line.id} className="text-[11px] text-zinc-300 break-all">
                    {JSON.stringify({
                      ts: line.time,
                      service: line.service.trim(),
                      level: line.level,
                      tag: line.tag.trim(),
                      msg: line.message,
                    })}
                  </div>
                ) : (
                  <div key={line.id} className="flex flex-wrap items-center gap-1.5 leading-relaxed">
                    <span className="text-zinc-500">[{line.time}]</span>
                    <span className="text-emerald-300">[{line.service}]</span>
                    <span className={`px-1.5 py-0.2 rounded border text-[10px] font-bold ${levelBadgeClass(line.level)}`}>
                      {line.level}
                    </span>
                    <span className="text-cyan-300">[{line.tag}]</span>
                    <span className="text-zinc-200">{line.message}</span>
                  </div>
                )
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-[#111115] border-t border-white/[0.08]">
              <span className="text-[11px] font-mono text-zinc-400">Emit live log event:</span>
              <div className="flex items-center gap-1.5">
                {(['INFO', 'OK', 'WARN', 'ERROR'] as const).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => emitSampleLog(lvl)}
                    className={`px-2.5 py-1 rounded-lg border text-[11px] font-mono font-semibold cursor-pointer ${levelBadgeClass(lvl)}`}
                  >
                    + {lvl}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Startup Banner Preview */}
          <div className="neu-card bg-[#09090c] border border-white/[0.1] rounded-2xl overflow-hidden flex flex-col">
            <div className="px-4 py-2.5 bg-[#111115] border-b border-white/[0.08] flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-white">
                Project Startup Banner (print_backend_banner)
              </span>
              <span className="text-[10px] font-mono text-emerald-300">Unicode Box Renderer</span>
            </div>
            <pre className="p-4 text-[11px] sm:text-xs font-mono text-cyan-300 overflow-x-auto leading-relaxed m-0">
{`╔══════════════════════════════════════════════════════════════════════╗
║   APEXMIND STUDIO AI — BACKEND API                                   ║
╠══════════════════════════════════════════════════════════════════════╣
║   Server API    : http://127.0.0.1:8000/ (Python 3.11.9 + FastAPI)   ║
║   OpenAPI Docs  : http://127.0.0.1:8000/docs (Swagger Interactive)   ║
║   Persistence   : SQLite (server/data/apexmind.db)                   ║
║   Logger        : @workspace/logger v1.0.0 (5-Col ANSI + Middleware) ║
╚══════════════════════════════════════════════════════════════════════╝`}
            </pre>
            <div className="px-4 pb-4 text-xs text-zinc-400">
              Every FastAPI backend and Vite client in <code className="text-zinc-200">Soul-DevPortal-Projects</code> uses this exact banner and 5-column formatter on boot.
            </div>
          </div>
        </div>
      )}

      {/* ── 2. @workspace/runner Live Preview ── */}
      {pkgKey === 'runner' && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          {/* Interactive Supervisor Preview */}
          <div className="neu-card bg-[#09090c] border border-white/[0.1] rounded-2xl overflow-hidden flex flex-col">
            <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-[#111115] border-b border-white/[0.08]">
              <span className="text-xs font-mono font-bold text-white">
                Interactive Supervisor (soul-dev)
              </span>
              <select
                value={activeRunnerProject?.id || 'apexmind-ai'}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="h-7 px-2 rounded-lg bg-[#09090c] border border-white/[0.1] text-xs font-mono text-zinc-200"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.id} (:{p.frontendPort ?? '-'} / :{p.backendPort ?? '-'})
                  </option>
                ))}
              </select>
            </div>

            <pre className="p-4 text-[11px] font-mono text-sky-300 overflow-x-auto leading-relaxed m-0 border-b border-white/[0.06]">
{`╔══════════════════════════════════════════════════════════════════════╗
║   ${(activeRunnerProject?.title || 'APEXMIND STUDIO AI').padEnd(66).slice(0, 66)} ║
╠══════════════════════════════════════════════════════════════════════╣
║   Client Tier : http://localhost:${String(activeRunnerProject?.frontendPort ?? 5173).padEnd(5)} (React 19 + Vite 8)          ║
║   Server API  : http://127.0.0.1:${String(activeRunnerProject?.backendPort ?? 8000).padEnd(5)} (Python + FastAPI)           ║
╚══════════════════════════════════════════════════════════════════════╝`}
            </pre>

            <div className="p-3 flex flex-wrap gap-1.5 border-b border-white/[0.06] bg-[#111115]/60">
              {[
                { key: 'r', label: 'Restart BE' },
                { key: 'f', label: 'Restart FE' },
                { key: 'a', label: 'Reload All' },
                { key: 'o', label: 'Open UI' },
                { key: 'b', label: 'Swagger Docs' },
                { key: 'p', label: 'Live Stats' },
              ].map((hk) => (
                <button
                  key={hk.key}
                  type="button"
                  onClick={() => triggerRunnerAction(hk.key, hk.label)}
                  className="px-2.5 py-1 rounded-lg bg-[#16161c] border border-white/[0.1] hover:border-sky-400/45 text-[11px] font-mono text-zinc-200 hover:text-white cursor-pointer"
                >
                  [{hk.key}] {hk.label}
                </button>
              ))}
            </div>

            <div className="p-4 flex flex-col gap-1 font-mono text-[11px] text-emerald-300 min-h-[140px]">
              {runnerEvents.map((ev, idx) => (
                <div key={idx}>{ev}</div>
              ))}
            </div>
          </div>

          {/* Live Port Audit Matrix */}
          <div className="neu-card bg-[#111115] border border-white/[0.08] rounded-2xl p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Live Monorepo Port Audit (soul-ports)</h3>
              <span className="text-[11px] font-mono text-zinc-400">{projects.length} projects</span>
            </div>
            <div className="flex flex-col gap-2 max-h-[340px] overflow-y-auto pr-1 font-mono text-xs">
              {projects.map((p) => {
                const feLive = Boolean(p.frontend?.isLive ?? p.frontendActive);
                const beLive = Boolean(p.backend?.isLive ?? p.backendActive);
                return (
                  <div
                    key={p.id}
                    className="p-2.5 rounded-xl bg-[#16161c] border border-white/[0.08] flex items-center justify-between gap-2"
                  >
                    <span className="text-zinc-100 truncate">{p.id}</span>
                    <div className="flex items-center gap-2 shrink-0 text-[10px]">
                      <span
                        className={`px-2 py-0.5 rounded border ${
                          feLive
                            ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                            : 'bg-white/[0.04] text-zinc-400 border-white/[0.08]'
                        }`}
                      >
                        FE :{p.frontendPort ?? '-'} {feLive ? 'LIVE' : 'FREE'}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded border ${
                          beLive
                            ? 'bg-sky-500/15 text-sky-300 border-sky-400/30'
                            : 'bg-white/[0.04] text-zinc-400 border-white/[0.08]'
                        }`}
                      >
                        BE :{p.backendPort ?? '-'} {beLive ? 'LIVE' : 'FREE'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── 3. @workspace/config Live Preview ── */}
      {pkgKey === 'config' && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          {/* Live Design Tokens */}
          <div className="neu-card bg-[#111115] border border-white/[0.08] rounded-2xl p-5 flex flex-col gap-4">
            <h3 className="text-sm font-bold text-white">Live Tailwind Design Tokens (@workspace/config)</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {tokenSwatches.map((sw) => (
                <div
                  key={sw.name}
                  className="p-2.5 rounded-xl bg-[#16161c] border border-white/[0.08] flex items-center gap-2.5"
                >
                  <span
                    className="w-6 h-6 rounded-lg border border-white/20 shrink-0"
                    style={{ backgroundColor: sw.hex }}
                  />
                  <div className="min-w-0">
                    <div className="text-[11px] font-mono text-white truncate">{sw.name}</div>
                    <div className="text-[10px] font-mono text-zinc-400">{sw.hex}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Live Port Registry Matrix */}
          <div className="neu-card bg-[#111115] border border-white/[0.08] rounded-2xl p-5 flex flex-col gap-3">
            <h3 className="text-sm font-bold text-white">Authoritative Port Registry (PORT_REGISTRY)</h3>
            <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1 font-mono text-xs">
              {projects.map((p) => (
                <div
                  key={p.id}
                  className="p-2.5 rounded-xl bg-[#16161c] border border-white/[0.08] flex items-center justify-between gap-2"
                >
                  <span className="text-zinc-200 truncate">{p.id}</span>
                  <span className="text-[11px] text-sky-300 shrink-0">
                    :{p.frontendPort ?? '-'} / :{p.backendPort ?? '-'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Sibling Packages Quick Switcher ── */}
      {allPackages.length > 1 && onSelectPackage && (
        <div className="neu-card bg-[#111115] border border-white/[0.08] rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs font-mono text-zinc-400">Preview another package:</span>
          <div className="flex flex-wrap gap-2">
            {allPackages
              .filter((p) => p.id !== pkg.id)
              .map((other) => (
                <button
                  key={other.id}
                  type="button"
                  onClick={() => onSelectPackage(other.id)}
                  className="px-3 py-1.5 rounded-lg bg-[#16161c] border border-white/[0.08] hover:border-purple-400/40 text-xs font-mono text-zinc-200 hover:text-white cursor-pointer"
                >
                  {other.name || other.id} →
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
