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
  onNavigate?: (viewId: string) => void;
  onBack?: () => void;
  compact?: boolean;
  paneHeightClass?: string;
  onExpandFullView?: () => void;
  onCloseDrawer?: () => void;
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

const TERMINAL_PREFS_KEY = 'soul-terminal-prefs-v1';

function loadTerminalPrefs(): {
  fontSize?: number;
  themeId?: string;
  cursorStyle?: 'block' | 'bar' | 'underline';
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
  onBack,
  compact = false,
  paneHeightClass,
  onExpandFullView,
  onCloseDrawer,
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
  const [cursorStyle, setCursorStyle] = useState<'block' | 'bar' | 'underline'>(
    () => initialPrefs.cursorStyle || 'block'
  );
  const [maximizedPaneId, setMaximizedPaneId] = useState<string | null>(null);
  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [editingTabTitle, setEditingTabTitle] = useState<string>('');

  const paneRefs = useRef<Record<string, TerminalPaneHandle | null>>({});

  useEffect(() => {
    try {
      window.localStorage.setItem(
        TERMINAL_PREFS_KEY,
        JSON.stringify({ fontSize, themeId, cursorStyle, tabs, activeTabId })
      );
    } catch {
      // ignore storage quota errors
    }
  }, [fontSize, themeId, cursorStyle, tabs, activeTabId]);

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

  const handleAddTab = (profileOverride?: string) => {
    const nextNum = tabs.length + 1;
    const defaultProfile =
      profileOverride || profiles.find((p) => p.available)?.id || 'powershell';
    const profileMeta = profiles.find((p) => p.id === defaultProfile);
    const tabTitle = profileOverride && profileMeta ? profileMeta.label : `Terminal ${nextNum}`;
    const newTab = createTab(
      `term-${Date.now()}`,
      tabTitle,
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

  const handleResetSession = () => {
    const defaultProfile = profiles.find((p) => p.available)?.id || 'powershell';
    const freshTab = createTab('term-1', 'Terminal 1', defaultProfile, info?.workspaceRoot || '.');
    setTabs([freshTab]);
    setActiveTabId(freshTab.id);
    setFontSize(13);
    setThemeId('soul-dark');
    try {
      window.localStorage.removeItem(TERMINAL_PREFS_KEY);
    } catch {
      // ignore
    }
  };

  return (
    <div className={`flex flex-col ${compact ? 'h-full min-h-0' : 'gap-3 pb-8'}`}>
      {/* ── Page Header (Full View Only) ── */}
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
              Terminal
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
                  ? `Live PTY :${backendPort}`
                  : 'PTY Unavailable'
                : 'Backend Offline'}
            </span>
          </div>
        </div>
      )}

      {/* ── Real Terminal Container ── */}
      <div
        className={`bg-[#09090c] overflow-hidden flex flex-col ${
          compact
            ? 'flex-1 min-h-0'
            : 'rounded-2xl neu-card border border-white/[0.1]'
        }`}
      >
        {/* VS Code–style Tabs + Controls Strip */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 bg-[#111115] border-b border-white/[0.08] shrink-0">
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
            <div className="inline-flex items-center h-7 rounded-lg bg-[#16161c] border border-white/[0.08] overflow-hidden">
              <button
                type="button"
                onClick={() => handleAddTab()}
                className="px-2.5 h-full hover:bg-white/[0.06] text-xs font-mono text-zinc-300 hover:text-white cursor-pointer"
                title="New terminal tab"
              >
                +
              </button>
              <select
                value=""
                onChange={(e) => {
                  if (e.target.value) handleAddTab(e.target.value);
                }}
                aria-label="New tab with shell profile"
                title="Open new tab with specific shell"
                className="w-5 h-full bg-[#16161c] border-l border-white/[0.08] text-[10px] text-zinc-400 hover:text-white focus:outline-none cursor-pointer"
              >
                <option value="">▾</option>
                {profiles.map((prof) => (
                  <option key={prof.id} value={prof.id} disabled={!prof.available}>
                    New {prof.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Right Controls: CWD, Theme, Font Zoom, Split, Reset */}
          <div className="flex flex-wrap items-center gap-1.5">
            <select
              value={focusedPane?.cwd || '.'}
              onChange={(e) => updateFocusedPane({ cwd: e.target.value })}
              aria-label="Working directory"
              className="h-7 max-w-[190px] px-2 rounded-lg bg-[#09090c] border border-white/[0.1] text-[11px] font-mono text-zinc-200 focus:outline-none focus:border-sky-400/50"
            >
              {directories.map((dir) => (
                <option key={dir.path} value={dir.path}>
                  {dir.label}
                </option>
              ))}
            </select>

            <select
              value={themeId}
              onChange={(e) => setThemeId(e.target.value)}
              aria-label="Terminal theme"
              className="h-7 px-2 rounded-lg bg-[#09090c] border border-white/[0.1] text-[11px] font-mono text-zinc-200 focus:outline-none focus:border-sky-400/50"
            >
              {Object.entries(TERMINAL_THEMES).map(([id, meta]) => (
                <option key={id} value={id}>
                  {meta.label}
                </option>
              ))}
            </select>

            <div className="inline-flex items-center h-7 rounded-lg bg-[#09090c] border border-white/[0.1] overflow-hidden text-[11px] font-mono">
              <button
                type="button"
                onClick={() => setFontSize((s) => Math.max(10, s - 1))}
                title="Decrease font size"
                className="px-2 h-full text-zinc-300 hover:text-white hover:bg-white/[0.06] cursor-pointer"
              >
                A-
              </button>
              <span className="px-1 text-[10px] text-zinc-400 tabular-nums">{fontSize}</span>
              <button
                type="button"
                onClick={() => setFontSize((s) => Math.min(20, s + 1))}
                title="Increase font size"
                className="px-2 h-full text-zinc-300 hover:text-white hover:bg-white/[0.06] cursor-pointer"
              >
                A+
              </button>
            </div>

            <button
              type="button"
              onClick={() =>
                setCursorStyle((c) =>
                  c === 'block' ? 'bar' : c === 'bar' ? 'underline' : 'block'
                )
              }
              title={`Cursor style: ${cursorStyle} (click to cycle)`}
              className="h-7 px-2 rounded-lg bg-[#09090c] border border-white/[0.1] hover:border-sky-400/40 text-[11px] font-mono text-zinc-200 hover:text-white cursor-pointer"
            >
              {cursorStyle === 'block' ? '▮' : cursorStyle === 'bar' ? '▏' : '_'}
            </button>

            <button
              type="button"
              onClick={handleSplitPane}
              disabled={(activeTab?.panes.length || 1) >= 3}
              className="h-7 px-2.5 rounded-lg bg-[#16161c] border border-white/[0.08] hover:border-sky-400/40 text-[11px] font-mono text-zinc-200 hover:text-white cursor-pointer disabled:opacity-40"
              title="Split pane side-by-side"
            >
              ◫ Split
            </button>

            <button
              type="button"
              onClick={handleResetSession}
              className="h-7 px-2 rounded-lg bg-[#16161c] border border-white/[0.08] hover:border-rose-400/40 text-[11px] font-mono text-zinc-400 hover:text-white cursor-pointer"
              title="Reset terminal layout"
            >
              Reset
            </button>

            {compact && onExpandFullView && (
              <button
                type="button"
                onClick={onExpandFullView}
                className="h-7 px-2.5 rounded-lg bg-[#16161c] border border-white/[0.08] hover:border-sky-400/40 text-[11px] font-mono text-zinc-200 hover:text-white cursor-pointer"
                title="Open full-page Terminal"
              >
                ⤢ Full View
              </button>
            )}

            {compact && onCloseDrawer && (
              <button
                type="button"
                onClick={onCloseDrawer}
                className="h-7 px-2 rounded-lg bg-[#16161c] border border-white/[0.08] hover:border-rose-400/40 text-xs font-mono text-zinc-300 hover:text-white cursor-pointer"
                title="Close Terminal Panel (Ctrl+`)"
                aria-label="Close Terminal Panel"
              >
                ×
              </button>
            )}
          </div>
        </div>

        {/* Active Tab Panes Grid */}
        <div
          className={`grid gap-1.5 p-1.5 bg-[#09090c] ${compact ? 'flex-1 min-h-0' : 'min-h-[540px]'} ${
            maximizedPaneId || activeTab.panes.length === 1
              ? 'grid-cols-1'
              : activeTab.panes.length === 2
              ? 'grid-cols-1 lg:grid-cols-2'
              : 'grid-cols-1 lg:grid-cols-3'
          }`}
        >
          {activeTab.panes.map((pane) => {
            const isHiddenByMaximize = Boolean(maximizedPaneId && maximizedPaneId !== pane.id);
            return (
            <div
              key={pane.id}
              className={`${isHiddenByMaximize ? 'hidden' : 'flex'} ${compact ? 'h-full min-h-0' : 'min-h-[520px]'} flex-col`}
            >
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
                cursorStyle={cursorStyle}
                isMaximized={maximizedPaneId === pane.id}
                onToggleMaximize={
                  activeTab.panes.length > 1
                    ? () =>
                        setMaximizedPaneId((prev) => (prev === pane.id ? null : pane.id))
                    : undefined
                }
                heightClass={paneHeightClass || (compact ? 'h-full' : 'h-[520px]')}
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
                onClosePane={() => {
                  if (maximizedPaneId === pane.id) setMaximizedPaneId(null);
                  handleClosePane(pane.id);
                }}
              />
            </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
