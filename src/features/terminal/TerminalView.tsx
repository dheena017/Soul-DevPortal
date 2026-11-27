import React, { useEffect, useMemo, useRef, useState } from 'react';
import { consoleLogger } from '@workspace/logger';
import { PackageData, ProjectData } from '../../types';
import {
  TerminalDirectoryItem,
  TerminalInfoResponse,
  TerminalShellProfile,
  fetchTerminalInfo,
} from '../../services/api';
import { useSharedTelemetry } from '../../services/telemetryStore';
import TerminalPane, { TERMINAL_THEMES, TerminalPaneHandle } from './TerminalPane';

export interface TerminalViewProps {
  projects?: ProjectData[];
  packages?: PackageData[];
  onNavigate: (viewId: string) => void;
  onBack?: () => void;
  compact?: boolean;
  paneHeightClass?: string;
}

interface CustomSnippet {
  id: string;
  label: string;
  cmd: string;
}

const TERMINAL_PREFS_KEY = 'soul-terminal-prefs-v1';
const TERMINAL_SNIPPETS_KEY = 'soul-terminal-snippets-v1';

function loadTerminalPrefs(): {
  fontSize?: number;
  themeId?: string;
  tabs?: TerminalTab[];
  activeTabId?: string;
} {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(TERMINAL_PREFS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function loadCustomSnippets(): CustomSnippet[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(TERMINAL_SNIPPETS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

interface PaneConfig {
  id: string;
  title: string;
  profile: string;
  cwd: string;
}

interface TerminalTab {
  id: string;
  title: string;
  panes: PaneConfig[];
  focusedPaneId: string;
}

const QUICK_COMMANDS = [
  { label: 'git status', cmd: 'git status --short' },
  { label: 'git log', cmd: 'git log -n 8 --oneline' },
  { label: 'ports:status', cmd: 'npm run ports:status' },
  { label: 'pkg:test', cmd: 'npm run pkg:test' },
  { label: 'tsc check', cmd: 'npx tsc --noEmit' },
  { label: 'vite build', cmd: 'npm run build' },
  { label: 'extract AST', cmd: 'python server/main.py --extract-only' },
  { label: 'cli menu', cmd: 'python scripts/cli.py' },
];

const COMMAND_PALETTE_GROUPS = [
  {
    group: 'Git',
    items: [
      { label: 'Status', cmd: 'git status --short' },
      { label: 'Log (10)', cmd: 'git log -n 10 --oneline' },
      { label: 'Diff Stat', cmd: 'git diff --stat' },
      { label: 'Branches', cmd: 'git branch -a' },
      { label: 'Pull', cmd: 'git pull' },
    ],
  },
  {
    group: 'Ports & Dev',
    items: [
      { label: 'Port Audit', cmd: 'npm run ports:status' },
      { label: 'Kill Conflicts', cmd: 'npm run ports:kill' },
      { label: 'Start All Apps', cmd: 'npm run dev:all' },
      { label: 'Health JSON', cmd: 'npm run ports:json' },
    ],
  },
  {
    group: 'Build & Test',
    items: [
      { label: 'Typecheck', cmd: 'npx tsc --noEmit' },
      { label: 'Vite Build', cmd: 'npm run build' },
      { label: 'Package Tests', cmd: 'npm run pkg:test' },
      { label: 'Lint', cmd: 'npm run lint' },
    ],
  },
  {
    group: 'Python & AST',
    items: [
      { label: 'Extract AST', cmd: 'python server/main.py --extract-only' },
      { label: 'CLI Menu', cmd: 'python scripts/cli.py' },
      { label: 'Relink Py Pkgs', cmd: 'npm run install:python' },
    ],
  },
];

const DEFAULT_PROFILES: TerminalShellProfile[] = [
  {
    id: 'powershell',
    label: 'PowerShell',
    command: 'powershell.exe',
    args: ['-NoLogo'],
    available: true,
    description: 'Windows PowerShell',
  },
  {
    id: 'cmd',
    label: 'Command Prompt',
    command: 'cmd.exe',
    args: [],
    available: true,
    description: 'Windows CMD',
  },
  {
    id: 'python',
    label: 'Python REPL',
    command: 'python',
    args: ['-i'],
    available: true,
    description: 'Interactive Python shell',
  },
];

function createTab(id: string, title: string, profile: string, cwd: string): TerminalTab {
  const paneId = `${id}-pane-1`;
  return {
    id,
    title,
    panes: [{ id: paneId, title: 'Shell 1', profile, cwd }],
    focusedPaneId: paneId,
  };
}

export default function TerminalView({
  projects = [],
  packages = [],
  onNavigate,
  onBack,
  compact = false,
  paneHeightClass,
}: TerminalViewProps) {
  const { isBackendLive, backendPort } = useSharedTelemetry(true);
  const [info, setInfo] = useState<TerminalInfoResponse | null>(null);
  const initialPrefs = useMemo(() => loadTerminalPrefs(), []);
  const [tabs, setTabs] = useState<TerminalTab[]>(() =>
    Array.isArray(initialPrefs.tabs) && initialPrefs.tabs.length > 0
      ? initialPrefs.tabs
      : [createTab('term-1', 'Terminal 1', 'powershell', '.')]
  );
  const [activeTabId, setActiveTabId] = useState<string>(
    () => initialPrefs.activeTabId || 'term-1'
  );
  const [fontSize, setFontSize] = useState<number>(
    () => (typeof initialPrefs.fontSize === 'number' ? initialPrefs.fontSize : 13)
  );
  const [themeId, setThemeId] = useState<string>(
    () => initialPrefs.themeId || 'soul-dark'
  );
  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [editingTabTitle, setEditingTabTitle] = useState<string>('');
  const [customSnippets, setCustomSnippets] = useState<CustomSnippet[]>(() =>
    loadCustomSnippets()
  );
  const [addingSnippet, setAddingSnippet] = useState<boolean>(false);
  const [snippetLabel, setSnippetLabel] = useState<string>('');
  const [snippetCmd, setSnippetCmd] = useState<string>('');
  const [broadcastMode, setBroadcastMode] = useState<boolean>(false);
  const [showPalette, setShowPalette] = useState<boolean>(false);

  const paneRefs = useRef<Record<string, TerminalPaneHandle | null>>({});

  useEffect(() => {
    try {
      window.localStorage.setItem(
        TERMINAL_PREFS_KEY,
        JSON.stringify({ fontSize, themeId, tabs, activeTabId })
      );
    } catch {
      // ignore storage quota errors
    }
  }, [fontSize, themeId, tabs, activeTabId]);

  useEffect(() => {
    try {
      window.localStorage.setItem(TERMINAL_SNIPPETS_KEY, JSON.stringify(customSnippets));
    } catch {
      // ignore storage quota errors
    }
  }, [customSnippets]);

  useEffect(() => {
    let mounted = true;
    fetchTerminalInfo().then((res) => {
      if (!mounted || !res) return;
      setInfo(res);
      const defaultProfile =
        res.profiles?.find((p) => p.available)?.id || 'powershell';
      setTabs((prev) =>
        prev.map((t) => ({
          ...t,
          panes: t.panes.map((pane) => ({
            ...pane,
            profile: pane.profile || defaultProfile,
            cwd: pane.cwd === '.' ? res.workspaceRoot : pane.cwd,
          })),
        }))
      );
    });
    return () => {
      mounted = false;
    };
  }, []);

  const activeTab = useMemo(
    () => tabs.find((t) => t.id === activeTabId) || tabs[0],
    [tabs, activeTabId]
  );

  const focusedPane = useMemo(
    () =>
      activeTab?.panes.find((p) => p.id === activeTab.focusedPaneId) ||
      activeTab?.panes[0],
    [activeTab]
  );

  const profiles = useMemo<TerminalShellProfile[]>(
    () => (info?.profiles?.length ? info.profiles : DEFAULT_PROFILES),
    [info]
  );

  const directories = useMemo<TerminalDirectoryItem[]>(() => {
    if (info?.directories?.length) return info.directories;
    const list: TerminalDirectoryItem[] = [
      { label: 'Workspace Root', path: '.', relativePath: '.' },
    ];
    for (const p of projects) {
      if (p.id !== 'devportal') {
        list.push({
          label: `Project · ${p.id}`,
          path: `Soul-DevPortal-Projects/${p.id}`,
          relativePath: `Soul-DevPortal-Projects/${p.id}`,
        });
      }
    }
    for (const pkg of packages) {
      list.push({
        label: `Package · ${pkg.id}`,
        path: `Soul-DevPortal-Packages/${pkg.id}`,
        relativePath: `Soul-DevPortal-Packages/${pkg.id}`,
      });
    }
    return list;
  }, [info, projects, packages]);

  const handleAddTab = () => {
    const nextNum = tabs.length + 1;
    const defaultProfile = profiles.find((p) => p.available)?.id || 'powershell';
    const newTab = createTab(
      `term-${Date.now()}`,
      `Terminal ${nextNum}`,
      defaultProfile,
      info?.workspaceRoot || '.'
    );
    setTabs((prev) => [...prev, newTab]);
    setActiveTabId(newTab.id);
    consoleLogger.action('TERMINAL', `Opened ${newTab.title}`);
  };

  const handleCloseTab = (tabId: string) => {
    if (tabs.length <= 1) return;
    const remaining = tabs.filter((t) => t.id !== tabId);
    setTabs(remaining);
    if (activeTabId === tabId) {
      setActiveTabId(remaining[remaining.length - 1].id);
    }
  };

  const handleSplitPane = () => {
    if (!activeTab || activeTab.panes.length >= 3) return;
    const nextIdx = activeTab.panes.length + 1;
    const newPaneId = `${activeTab.id}-pane-${Date.now()}`;
    const basePane = focusedPane || activeTab.panes[0];
    setTabs((prev) =>
      prev.map((t) =>
        t.id === activeTab.id
          ? {
              ...t,
              panes: [
                ...t.panes,
                {
                  id: newPaneId,
                  title: `Shell ${nextIdx}`,
                  profile: basePane?.profile || 'powershell',
                  cwd: basePane?.cwd || info?.workspaceRoot || '.',
                },
              ],
              focusedPaneId: newPaneId,
            }
          : t
      )
    );
    consoleLogger.action('TERMINAL', `Split pane in ${activeTab.title}`);
  };

  const handleClosePane = (paneId: string) => {
    if (!activeTab || activeTab.panes.length <= 1) return;
    setTabs((prev) =>
      prev.map((t) => {
        if (t.id !== activeTab.id) return t;
        const remaining = t.panes.filter((p) => p.id !== paneId);
        return {
          ...t,
          panes: remaining,
          focusedPaneId:
            t.focusedPaneId === paneId ? remaining[remaining.length - 1].id : t.focusedPaneId,
        };
      })
    );
  };

  const updateFocusedPane = (patch: Partial<PaneConfig>) => {
    if (!activeTab || !focusedPane) return;
    setTabs((prev) =>
      prev.map((t) =>
        t.id === activeTab.id
          ? {
              ...t,
              panes: t.panes.map((p) => (p.id === focusedPane.id ? { ...p, ...patch } : p)),
            }
          : t
      )
    );
  };

  const resolveWorkspaceCommand = (cmd: string, cwd: string): string => {
    const root = info?.workspaceRoot;
    if (!root || cwd === root || cwd === '.') return cmd;
    if (cmd.startsWith('npm run ')) {
      return `npm --prefix "${root}" run ${cmd.slice('npm run '.length)}`;
    }
    if (cmd.startsWith('python server/')) {
      return `python "${root}/${cmd.slice('python '.length)}"`;
    }
    if (cmd.startsWith('python scripts/')) {
      return `python "${root}/${cmd.slice('python '.length)}"`;
    }
    if (cmd.startsWith('python Soul-DevPortal-Packages/')) {
      return `python "${root}/${cmd.slice('python '.length)}"`;
    }
    return cmd;
  };

  const sendQuickCommand = (cmd: string) => {
    if (!activeTab) return;
    if (broadcastMode) {
      for (const pane of activeTab.panes) {
        const resolved = resolveWorkspaceCommand(cmd, pane.cwd);
        paneRefs.current[pane.id]?.sendCommand(resolved);
      }
      return;
    }
    if (!focusedPane) return;
    const resolved = resolveWorkspaceCommand(cmd, focusedPane.cwd);
    paneRefs.current[focusedPane.id]?.sendCommand(resolved);
  };

  const handleResetSession = () => {
    const defaultProfile = profiles.find((p) => p.available)?.id || 'powershell';
    const freshTab = createTab('term-1', 'Terminal 1', defaultProfile, info?.workspaceRoot || '.');
    setTabs([freshTab]);
    setActiveTabId(freshTab.id);
    setFontSize(13);
    setThemeId('soul-dark');
    setBroadcastMode(false);
    try {
      window.localStorage.removeItem(TERMINAL_PREFS_KEY);
    } catch {
      // ignore
    }
  };

  const handleSaveSnippet = (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = snippetCmd.trim();
    if (!cmd) return;
    const label = snippetLabel.trim() || cmd.split(/\s+/)[0];
    setCustomSnippets((prev) => [
      ...prev,
      { id: `snip-${Date.now()}`, label, cmd },
    ]);
    setSnippetLabel('');
    setSnippetCmd('');
    setAddingSnippet(false);
  };

  const handleRemoveSnippet = (id: string) => {
    setCustomSnippets((prev) => prev.filter((s) => s.id !== id));
  };

  return (
    <div className={`flex flex-col ${compact ? 'gap-2.5 pb-1' : 'gap-4 pb-8'}`}>
      {/* ── Top Header Bar ── */}
      {!compact && (
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="neu-btn inline-flex items-center gap-1.5 h-8 px-3 rounded-xl bg-[#16161c] border border-white/[0.08] text-xs font-semibold text-zinc-300 hover:text-white hover:border-white/[0.2] transition-all cursor-pointer"
            >
              <span>←</span>
              <span>Overview</span>
            </button>
          )}
          <h1 className="text-base sm:text-lg font-extrabold text-white tracking-tight">
            Workspace Terminal
          </h1>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-mono border ${
              isBackendLive && info?.ptySupported !== false
                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
            }`}
          >
            {isBackendLive
              ? info?.ptySupported !== false
                ? `ConPTY WebSocket :${backendPort}`
                : 'PTY Unavailable'
              : 'Backend Offline'}
          </span>
      </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleSplitPane}
            disabled={(activeTab?.panes.length || 1) >= 3}
            className="neu-btn h-8 px-3 rounded-xl bg-[#16161c] border border-white/[0.08] hover:border-sky-400/40 text-xs font-semibold text-zinc-200 hover:text-white cursor-pointer disabled:opacity-40"
            title="Split active terminal side-by-side (up to 3 panes)"
          >
            ◫ Split Pane
          </button>
          <button
            type="button"
            onClick={() => focusedPane && paneRefs.current[focusedPane.id]?.interrupt()}
            className="neu-btn h-8 px-3 rounded-xl bg-[#16161c] border border-white/[0.08] hover:border-amber-400/40 text-xs font-semibold text-amber-300 hover:text-white cursor-pointer"
            title="Send Ctrl+C (SIGINT) to focused pane"
          >
            Ctrl+C
          </button>
          <button
            type="button"
            onClick={() => focusedPane && paneRefs.current[focusedPane.id]?.restart()}
            className="neu-btn h-8 px-3 rounded-xl bg-[#16161c] border border-white/[0.08] hover:border-white/25 text-xs font-semibold text-zinc-200 hover:text-white cursor-pointer"
            title="Restart shell in focused pane"
          >
            ↻ Restart
          </button>
          <button
            type="button"
            onClick={() => setShowPalette((v) => !v)}
            className={`neu-btn h-8 px-3 rounded-xl border text-xs font-semibold cursor-pointer ${
              showPalette
                ? 'bg-sky-500/20 border-sky-400/45 text-white'
                : 'bg-[#16161c] border-white/[0.08] text-zinc-200 hover:text-white'
            }`}
            title="Toggle categorized Command Palette"
          >
            ⌘ Commands
          </button>
          {(activeTab?.panes.length || 1) > 1 && (
            <button
              type="button"
              onClick={() => setBroadcastMode((b) => !b)}
              className={`neu-btn h-8 px-3 rounded-xl border text-xs font-semibold cursor-pointer ${
                broadcastMode
                  ? 'bg-purple-500/20 border-purple-400/45 text-purple-200'
                  : 'bg-[#16161c] border-white/[0.08] text-zinc-300 hover:text-white'
              }`}
              title="Send Quick Run commands to all split panes simultaneously"
            >
              {broadcastMode ? '📡 Broadcast ON' : '📡 Broadcast'}
            </button>
          )}
          <button
            type="button"
            onClick={handleResetSession}
            className="neu-btn h-8 px-3 rounded-xl bg-[#16161c] border border-white/[0.08] hover:border-rose-400/40 text-xs font-semibold text-zinc-300 hover:text-white cursor-pointer"
            title="Reset terminal tabs and saved session"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={() => onNavigate('scripts')}
            className="neu-btn h-8 px-3 rounded-xl bg-[#16161c] border border-white/[0.08] text-xs font-semibold text-zinc-300 hover:text-white cursor-pointer"
          >
            Scripts →
          </button>
      </div>
      </div>
      )}

      {/* ── Directory, Shell Profile & Quick Run Bar ── */}
      <div className="rounded-2xl neu-card bg-[#111115] border border-white/[0.08] p-4 flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-[240px]">
            <span className="text-[11px] font-mono text-zinc-400 uppercase shrink-0">CWD</span>
            <select
              value={focusedPane?.cwd || '.'}
              onChange={(e) => updateFocusedPane({ cwd: e.target.value })}
              className="flex-1 max-w-md h-8 px-2.5 rounded-xl bg-[#09090c] border border-white/[0.1] text-xs font-mono text-zinc-100 focus:outline-none focus:border-sky-400/50"
            >
              {directories.map((dir) => (
                <option key={dir.path} value={dir.path}>
                  {dir.label} ({dir.relativePath})
                </option>
              ))}
            </select>
      </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-mono text-zinc-400 uppercase">Shell</span>
            <select
              value={focusedPane?.profile || 'powershell'}
              onChange={(e) => updateFocusedPane({ profile: e.target.value })}
              className="h-8 px-2.5 rounded-xl bg-[#09090c] border border-white/[0.1] text-xs font-mono text-zinc-100 focus:outline-none focus:border-sky-400/50"
            >
              {profiles.map((prof) => (
                <option key={prof.id} value={prof.id} disabled={!prof.available}>
                  {prof.label} {!prof.available ? '(Unavailable)' : ''}
                </option>
              ))}
            </select>

            <select
              value={themeId}
              onChange={(e) => setThemeId(e.target.value)}
              aria-label="Terminal theme"
              className="h-8 px-2.5 rounded-xl bg-[#09090c] border border-white/[0.1] text-xs font-mono text-zinc-100 focus:outline-none focus:border-sky-400/50"
            >
              {Object.entries(TERMINAL_THEMES).map(([id, meta]) => (
                <option key={id} value={id}>
                  {meta.label}
                </option>
              ))}
            </select>

            <div className="inline-flex items-center h-8 rounded-xl bg-[#09090c] border border-white/[0.1] overflow-hidden text-xs font-mono">
              <button
                type="button"
                onClick={() => setFontSize((s) => Math.max(10, s - 1))}
                title="Decrease font size"
                className="px-2 h-full text-zinc-300 hover:text-white hover:bg-white/[0.06] cursor-pointer"
              >
                A-
              </button>
              <span className="px-1.5 text-[11px] text-zinc-400 tabular-nums">{fontSize}px</span>
              <button
                type="button"
                onClick={() => setFontSize((s) => Math.min(20, s + 1))}
                title="Increase font size"
                className="px-2 h-full text-zinc-300 hover:text-white hover:bg-white/[0.06] cursor-pointer"
              >
                A+
              </button>
      </div>
      </div>
      </div>

        {/* Quick Command Chips */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-500 mr-1">
            Quick Run:
          </span>
          {QUICK_COMMANDS.map((q) => (
            <button
              key={q.cmd}
              type="button"
              onClick={() => sendQuickCommand(q.cmd)}
              className="px-2.5 py-1 rounded-lg bg-[#16161c] border border-white/[0.08] hover:border-sky-400/40 hover:bg-sky-500/10 text-[11px] font-mono text-zinc-200 hover:text-white transition-all cursor-pointer"
            >
              {q.label}
            </button>
          ))}
          {projects.length > 0 && (
            <select
              value=""
              onChange={(e) => {
                const pid = e.target.value;
                if (!pid) return;
                sendQuickCommand(`python Soul-DevPortal-Packages/runner/external/run_all.py --project ${pid} --kill-port`);
              }}
              aria-label="Launch project dev server"
              className="h-7 px-2 rounded-lg bg-[#16161c] border border-emerald-500/30 text-[11px] font-mono text-emerald-300 focus:outline-none cursor-pointer"
            >
              <option value="">▶ Run Project...</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.id} (:{p.frontendPort ?? '-'} / :{p.backendPort ?? '-'})
                </option>
              ))}
            </select>
          )}
          {customSnippets.map((snip) => (
            <span
              key={snip.id}
              className="inline-flex items-center rounded-lg bg-sky-500/10 border border-sky-400/30 text-[11px] font-mono text-sky-200 overflow-hidden"
            >
              <button
                type="button"
                onClick={() => sendQuickCommand(snip.cmd)}
                title={snip.cmd}
                className="px-2 py-1 hover:bg-sky-500/20 cursor-pointer"
              >
                ★ {snip.label}
              </button>
              <button
                type="button"
                onClick={() => handleRemoveSnippet(snip.id)}
                title="Remove pinned command"
                className="px-1.5 py-1 text-sky-300/70 hover:text-rose-300 hover:bg-white/[0.06] cursor-pointer"
              >
                ×
              </button>
            </span>
          ))}
          <button
            type="button"
            onClick={() => setAddingSnippet((v) => !v)}
            className="px-2 py-1 rounded-lg bg-[#16161c] border border-dashed border-white/[0.18] hover:border-sky-400/45 text-[11px] font-mono text-zinc-400 hover:text-white cursor-pointer"
          >
            {addingSnippet ? 'Cancel' : '+ Pin Cmd'}
          </button>
      </div>

        {addingSnippet && (
          <form onSubmit={handleSaveSnippet} className="flex flex-wrap items-center gap-2 pt-1">
            <input
              type="text"
              value={snippetLabel}
              onChange={(e) => setSnippetLabel(e.target.value)}
              placeholder="Label (e.g. Git Pull)"
              className="h-7 px-2.5 rounded-lg bg-[#09090c] border border-white/[0.1] text-xs font-mono text-white w-36 focus:outline-none focus:border-sky-400/50"
            />
            <input
              type="text"
              value={snippetCmd}
              onChange={(e) => setSnippetCmd(e.target.value)}
              placeholder="Command (e.g. git pull && npm run build)"
              className="flex-1 min-w-[200px] h-7 px-2.5 rounded-lg bg-[#09090c] border border-white/[0.1] text-xs font-mono text-white focus:outline-none focus:border-sky-400/50"
            />
            <button
              type="submit"
              className="h-7 px-3 rounded-lg bg-sky-500/20 border border-sky-400/40 text-xs font-semibold text-sky-200 hover:text-white cursor-pointer"
            >
              Save
            </button>
          </form>
        )}
        {showPalette && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-2 border-t border-white/[0.08]">
            {COMMAND_PALETTE_GROUPS.map((grp) => (
              <div
                key={grp.group}
                className="p-2.5 rounded-xl bg-[#09090c] border border-white/[0.08] flex flex-col gap-1.5"
              >
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400">
                  {grp.group}
                </span>
                <div className="flex flex-wrap gap-1">
                  {grp.items.map((item) => (
                    <button
                      key={item.cmd}
                      type="button"
                      onClick={() => sendQuickCommand(item.cmd)}
                      title={item.cmd}
                      className="px-2 py-1 rounded-md bg-[#16161c] border border-white/[0.08] hover:border-sky-400/40 text-[11px] font-mono text-zinc-200 hover:text-white cursor-pointer"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Session Tabs + Split Panes Container ── */}
      <div className="rounded-2xl neu-card bg-[#09090c] border border-white/[0.1] overflow-hidden flex flex-col">
        {/* Tabs Strip */}
        <div className="flex items-center justify-between gap-2 px-3 py-2 bg-[#111115] border-b border-white/[0.08]">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {tabs.map((tab) => {
              const selected = tab.id === activeTab.id;
              return (
                <div
                  key={tab.id}
                  className={`inline-flex items-center gap-2 h-7 px-2.5 rounded-lg text-xs font-mono border transition-all ${
                    selected
                      ? 'bg-[#1a1a22] border-sky-400/40 text-white font-bold'
                      : 'bg-[#16161c] border-white/[0.06] text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {editingTabId === tab.id ? (
                    <input
                      type="text"
                      autoFocus
                      value={editingTabTitle}
                      onChange={(e) => setEditingTabTitle(e.target.value)}
                      onBlur={() => {
                        const nextName = editingTabTitle.trim();
                        if (nextName) {
                          setTabs((prev) =>
                            prev.map((t) => (t.id === tab.id ? { ...t, title: nextName } : t))
                          );
                        }
                        setEditingTabId(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          (e.target as HTMLInputElement).blur();
                        } else if (e.key === 'Escape') {
                          setEditingTabId(null);
                        }
                      }}
                      className="w-28 bg-[#09090c] border border-sky-400/50 rounded px-1 text-xs text-white focus:outline-none"
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => setActiveTabId(tab.id)}
                      onDoubleClick={() => {
                        setEditingTabId(tab.id);
                        setEditingTabTitle(tab.title);
                      }}
                      title="Double-click to rename tab"
                      className="cursor-pointer truncate max-w-[150px]"
                    >
                      &gt;_ {tab.title}
                      {tab.panes.length > 1 ? ` (${tab.panes.length})` : ''}
                    </button>
                  )}
                  {tabs.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleCloseTab(tab.id)}
                      aria-label={`Close ${tab.title}`}
                      className="text-zinc-500 hover:text-rose-400 cursor-pointer"
                    >
                      ×
                    </button>
                  )}
      </div>
              );
            })}
            <button
              type="button"
              onClick={handleAddTab}
              className="h-7 px-2.5 rounded-lg bg-[#16161c] border border-white/[0.08] hover:border-white/25 text-xs font-mono text-zinc-300 hover:text-white cursor-pointer"
              title="New terminal tab"
            >
              + New Tab
            </button>
      </div>

          <span className="hidden md:inline text-[10px] font-mono text-zinc-500">
            xterm.js · Ctrl+F Search · Clickable Links
          </span>
      </div>

        {/* Active Tab Panes Grid */}
        <div
          className={`grid gap-2 p-2 bg-[#09090c] ${compact ? 'min-h-[240px]' : 'min-h-[480px]'} ${
            activeTab.panes.length === 1
              ? 'grid-cols-1'
              : activeTab.panes.length === 2
              ? 'grid-cols-1 lg:grid-cols-2'
              : 'grid-cols-1 lg:grid-cols-3'
          }`}
        >
          {activeTab.panes.map((pane) => (
            <div key={pane.id} className={`${compact ? 'min-h-[220px]' : 'min-h-[460px]'} flex flex-col`}>
              <TerminalPane
                ref={(handle) => {
                  paneRefs.current[pane.id] = handle;
                }}
                paneId={pane.id}
                title={pane.title}
                profile={pane.profile}
                cwd={pane.cwd}
                profiles={profiles}
                isFocused={pane.id === activeTab.focusedPaneId}
                canClosePane={activeTab.panes.length > 1}
                fontSize={fontSize}
                themeId={themeId}
                heightClass={paneHeightClass || (compact ? 'h-[240px]' : 'h-[460px]')}
                onSplitPane={activeTab.panes.length < 3 ? handleSplitPane : undefined}
                onFocus={() =>
                  setTabs((prev) =>
                    prev.map((t) =>
                      t.id === activeTab.id ? { ...t, focusedPaneId: pane.id } : t
                    )
                  )
                }
                onChangeProfile={(profileId) =>
                  setTabs((prev) =>
                    prev.map((t) =>
                      t.id === activeTab.id
                        ? {
                            ...t,
                            panes: t.panes.map((p) =>
                              p.id === pane.id ? { ...p, profile: profileId } : p
                            ),
                          }
                        : t
                    )
                  )
                }
                onClosePane={() => handleClosePane(pane.id)}
              />
      </div>
          ))}
      </div>
      </div>
    </div>
  );
}
