import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { HeroArtworkBackdrop } from '../../components/PortalVisuals';
import {
  CodeUpdatesResponse,
  fetchCodeUpdates,
} from '../../services/api';
import {
  CHANGELOG_SURFACE_TABS,
  ChangelogSurface,
} from './changelogConstants';

export interface CodeUpdatesViewProps {
  onNavigate: (viewId: string) => void;
  onBack?: () => void;
}

const SURFACE_BADGES: Record<string, { label: string; cls: string }> = {
  desktop: {
    label: 'Desktop & UI',
    cls: 'bg-sky-500/15 border-sky-400/30 text-sky-300',
  },
  everyday: {
    label: 'Everyday Utilities',
    cls: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300',
  },
  project: {
    label: 'Project',
    cls: 'bg-purple-500/15 border-purple-500/30 text-purple-300',
  },
  package: {
    label: 'Package',
    cls: 'bg-indigo-500/15 border-indigo-500/30 text-indigo-300',
  },
  documentation: {
    label: 'Documentation',
    cls: 'bg-amber-500/15 border-amber-400/30 text-amber-300',
  },
  computer: {
    label: 'Computer & Performance',
    cls: 'bg-rose-500/15 border-rose-400/30 text-rose-300',
  },
};

function surfaceMeta(id: string) {
  return (
    SURFACE_BADGES[id] || {
      label: 'Desktop & UI',
      cls: 'bg-sky-500/15 border-sky-400/30 text-sky-300',
    }
  );
}

function workingStatusStyle(status: string): string {
  const lower = status.toLowerCase();
  if (lower.includes('new') || lower.includes('added')) {
    return 'bg-emerald-500/15 border-emerald-500/35 text-emerald-300';
  }
  if (lower.includes('deleted')) {
    return 'bg-rose-500/15 border-rose-500/35 text-rose-300';
  }
  return 'bg-amber-500/15 border-amber-400/35 text-amber-300';
}

export default function CodeUpdatesView({
  onNavigate,
  onBack,
}: CodeUpdatesViewProps) {
  const [data, setData] = useState<CodeUpdatesResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [autoSync, setAutoSync] = useState<boolean>(true);

  const [surface, setSurface] = useState<ChangelogSurface>('all');
  const [selectedDateKey, setSelectedDateKey] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [dateSearch, setDateSearch] = useState<string>('');
  const [expandedCommits, setExpandedCommits] = useState<Record<string, boolean>>({});
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const loadUpdates = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true);
    const res = await fetchCodeUpdates(120);
    if (res) {
      setData(res);
    }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    void loadUpdates(false);
  }, [loadUpdates]);

  useEffect(() => {
    if (!autoSync) return undefined;
    const id = window.setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      void loadUpdates(false);
    }, 15000);
    return () => window.clearInterval(id);
  }, [autoSync, loadUpdates]);

  const dateGroups = data?.dateGroups || [];

  const surfaceCounts = useMemo(() => {
    const counts: Record<ChangelogSurface, number> = {
      all: 0,
      desktop: 0,
      everyday: 0,
      project: 0,
      package: 0,
      documentation: 0,
      computer: 0,
    };
    for (const grp of dateGroups) {
      if (selectedDateKey !== 'all' && grp.dateKey !== selectedDateKey) continue;
      for (const wf of grp.workingFiles) {
        counts.all += 1;
        const surf = (wf.surface in counts ? wf.surface : 'desktop') as Exclude<ChangelogSurface, 'all'>;
        counts[surf] += 1;
      }
      for (const c of grp.commits) {
        counts.all += 1;
        for (const s of c.surfaces) {
          const surf = (s in counts ? s : 'desktop') as Exclude<ChangelogSurface, 'all'>;
          counts[surf] += 1;
        }
      }
    }
    return counts;
  }, [dateGroups, selectedDateKey]);

  const filteredDateGroups = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return dateGroups
      .filter((grp) => selectedDateKey === 'all' || grp.dateKey === selectedDateKey)
      .map((grp) => {
        const workingFiles = grp.workingFiles.filter((wf) => {
          if (surface !== 'all' && wf.surface !== surface) return false;
          if (!q) return true;
          return (
            wf.path.toLowerCase().includes(q) ||
            wf.status.toLowerCase().includes(q) ||
            grp.dateLabel.toLowerCase().includes(q)
          );
        });
        const commits = grp.commits.filter((c) => {
          if (surface !== 'all' && !c.surfaces.includes(surface)) return false;
          if (!q) return true;
          const hay = [
            c.shortHash,
            c.hash,
            c.subject,
            c.author,
            grp.dateLabel,
            ...c.files.map((f) => f.path),
          ]
            .join(' ')
            .toLowerCase();
          return hay.includes(q);
        });
        return {
          ...grp,
          workingFiles,
          commits,
        };
      })
      .filter((grp) => grp.workingFiles.length > 0 || grp.commits.length > 0);
  }, [dateGroups, selectedDateKey, surface, searchQuery]);

  const sidebarDates = useMemo(() => {
    const q = dateSearch.trim().toLowerCase();
    if (!q) return dateGroups;
    return dateGroups.filter(
      (g) => g.dateLabel.toLowerCase().includes(q) || g.dateKey.toLowerCase().includes(q)
    );
  }, [dateGroups, dateSearch]);

  const handleCopyHash = (hash: string) => {
    navigator.clipboard?.writeText(hash);
    setCopiedHash(hash);
    window.setTimeout(() => setCopiedHash(null), 1500);
  };

  return (
    <div className="w-full flex flex-col gap-6 pb-12 animate-in fade-in duration-300 portal-stagger">
      {/* Hero Banner */}
      <header className="w-full bg-[#111115] border border-white/[0.08] rounded-2xl p-5 sm:p-6 shadow-2xl flex flex-col gap-5 portal-header-sheen">
        <HeroArtworkBackdrop src="/visuals/hero-overview-mesh.jpg" alt="Codebase Updates Backdrop" />
        <div className="relative z-10 flex flex-col gap-5">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5">
            <div className="flex items-start gap-4 min-w-0">
              <div className="w-12 h-12 rounded-xl bg-[#16161c] border border-white/[0.1] flex items-center justify-center text-xl shrink-0 shadow-inner">
                🧬
              </div>
              <div className="flex flex-col gap-2 min-w-0">
                <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider">
                  <button
                    type="button"
                    onClick={() => (onBack ? onBack() : onNavigate('changelog'))}
                    className="px-2.5 py-0.5 rounded-full bg-[#16161c] border border-white/[0.1] text-zinc-300 hover:text-white cursor-pointer"
                  >
                    ← Changelog
                  </button>
                  <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
                    ● LIVE CODEBASE TRACKER
                  </span>
                  <span className="px-2.5 py-0.5 rounded-md bg-sky-500/15 border border-sky-400/30 text-sky-300">
                    {data?.source === 'git' ? 'GIT COMMITS + WORKING FILES' : 'WORKSPACE SCAN'}
                  </span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                  Codebase Updates by Date
                </h1>
                <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed max-w-2xl">
                  Automatically tracks every commit and live file change in the codebase organized chronologically by date — zero manual changelog entry needed.
                </p>

                <div className="flex flex-wrap items-center gap-2 pt-0.5">
                  <button
                    type="button"
                    onClick={() => void loadUpdates(true)}
                    disabled={refreshing}
                    className="px-3 py-1 rounded-lg bg-sky-500/15 border border-sky-400/35 hover:bg-sky-500/25 text-xs font-bold text-sky-200 cursor-pointer disabled:opacity-50 transition-colors"
                  >
                    {refreshing ? '↻ Syncing Repo...' : '↻ Sync Codebase Now'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setAutoSync((v) => !v)}
                    className={`px-3 py-1 rounded-lg border text-xs font-mono cursor-pointer transition-colors ${
                      autoSync
                        ? 'bg-emerald-500/15 border-emerald-500/35 text-emerald-200 font-bold'
                        : 'bg-[#16161c] border-white/[0.1] text-zinc-400 hover:text-white'
                    }`}
                  >
                    {autoSync ? '● Auto-Sync 15s ON' : '○ Auto-Sync Paused'}
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigate('changelog')}
                    className="px-3 py-1 rounded-lg bg-[#16161c] border border-white/[0.1] hover:border-white/[0.22] text-xs font-semibold text-zinc-200 hover:text-white cursor-pointer"
                  >
                    🧾 Release Summary
                  </button>
                </div>
              </div>
            </div>

            {/* Summary KPI Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 gap-2.5 lg:w-[320px] shrink-0">
              <div className="p-3 rounded-xl bg-[#09090c]/90 border border-white/[0.08] flex flex-col gap-0.5">
                <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                  DATES TRACKED
                </span>
                <strong className="text-sm sm:text-base font-extrabold font-mono text-sky-300 tabular-nums">
                  {data?.totalDates ?? 0} days
                </strong>
              </div>
              <div className="p-3 rounded-xl bg-[#09090c]/90 border border-white/[0.08] flex flex-col gap-0.5">
                <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                  COMMITS LOADED
                </span>
                <strong className="text-sm sm:text-base font-extrabold font-mono text-purple-300 tabular-nums">
                  {data?.totalCommits ?? 0} updates
                </strong>
              </div>
              <div className="p-3 rounded-xl bg-[#09090c]/90 border border-white/[0.08] flex flex-col gap-0.5">
                <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                  LIVE EDITED FILES
                </span>
                <strong className="text-sm sm:text-base font-extrabold font-mono text-emerald-400 tabular-nums">
                  {data?.totalWorkingFiles ?? 0} active
                </strong>
              </div>
              <div className="p-3 rounded-xl bg-[#09090c]/90 border border-white/[0.08] flex flex-col gap-0.5">
                <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                  LAST SYNCED
                </span>
                <strong className="text-sm sm:text-base font-extrabold font-mono text-amber-300 tabular-nums">
                  {data?.generatedTimeLabel || '—'}
                </strong>
              </div>
            </div>
          </div>

          {/* All Dates Quick Pill Strip */}
          {dateGroups.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] font-mono text-zinc-400 mr-1">Dates:</span>
              <button
                type="button"
                onClick={() => setSelectedDateKey('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono border cursor-pointer transition-colors ${
                  selectedDateKey === 'all'
                    ? 'bg-sky-500/20 border-sky-400/45 text-white font-bold'
                    : 'bg-[#09090c] border-white/[0.08] text-zinc-400 hover:text-white'
                }`}
              >
                All Dates ({dateGroups.length})
              </button>
              {dateGroups.map((g) => (
                <button
                  key={g.dateKey}
                  type="button"
                  onClick={() => setSelectedDateKey(g.dateKey)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono border cursor-pointer transition-colors ${
                    selectedDateKey === g.dateKey
                      ? 'bg-emerald-500/20 border-emerald-400/45 text-emerald-100 font-bold'
                      : 'bg-[#09090c] border-white/[0.08] text-zinc-300 hover:text-white'
                  }`}
                >
                  <span>{g.dateLabel}</span>
                  {g.isToday && (
                    <span className="px-1 py-0.2 rounded text-[9px] bg-emerald-500/20 text-emerald-300">
                      Today
                    </span>
                  )}
                  <span className="text-[10px] text-zinc-500">
                    ({g.commits.length + g.workingFiles.length})
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Surface Filter Bar */}
          <div className="rounded-xl bg-[#09090c] border border-white/[0.08] p-1 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1" role="tablist" aria-label="Code updates surface tabs">
              {CHANGELOG_SURFACE_TABS.map((tab) => {
                const isSelected = surface === tab.id;
                const count = surfaceCounts[tab.id] || 0;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={isSelected}
                    onClick={() => setSurface(tab.id)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-zinc-800 text-white font-bold border border-white/20 shadow-sm'
                        : 'text-zinc-400 hover:text-white hover:bg-white/[0.05] border border-transparent font-medium'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                        isSelected
                          ? 'bg-sky-500/20 text-sky-200 border border-sky-400/35'
                          : 'bg-[#16161c] text-zinc-400 border border-white/[0.08]'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content + Right Date Directory Rail */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_270px] gap-6 items-start">
        <article className="min-w-0 rounded-2xl bg-[#111115] border border-white/[0.08] p-5 sm:p-6 shadow-xl flex flex-col gap-5 portal-header-sheen">
          {/* Search Strip */}
          <div className="rounded-xl bg-[#0e141c] border border-sky-400/25 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 flex-1 min-w-[200px]">
              <span className="text-sky-300 text-xs font-mono font-bold shrink-0">SEARCH</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search file paths, commit titles, hashes, or authors..."
                aria-label="Search codebase updates"
                className="w-full bg-transparent text-xs font-mono text-zinc-100 placeholder-zinc-500 focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="text-zinc-400 hover:text-white text-xs cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>
            <span className="text-[11px] font-mono text-zinc-400 shrink-0">
              Showing {filteredDateGroups.length} date{filteredDateGroups.length === 1 ? '' : 's'}
            </span>
          </div>

          {loading ? (
            <div className="rounded-xl bg-[#09090c] border border-white/[0.08] p-10 text-center text-xs font-mono text-zinc-400">
              Scanning git history &amp; live codebase changes...
            </div>
          ) : filteredDateGroups.length === 0 ? (
            <div className="rounded-xl bg-[#09090c] border border-white/[0.08] p-10 text-center flex flex-col items-center gap-2">
              <p className="text-sm font-bold text-white">No codebase updates matched this filter</p>
              <button
                type="button"
                onClick={() => {
                  setSurface('all');
                  setSelectedDateKey('all');
                  setSearchQuery('');
                }}
                className="px-3.5 py-1.5 rounded-xl bg-white text-zinc-950 text-xs font-bold cursor-pointer"
              >
                Reset Date &amp; Surface Filters
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-7">
              {filteredDateGroups.map((grp) => (
                <section
                  key={grp.dateKey}
                  id={`code-date-${grp.dateKey}`}
                  className="flex flex-col gap-3 scroll-mt-20"
                >
                  {/* Date Header */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-white/[0.08]">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="px-2.5 py-1 rounded-lg bg-[#16161c] border border-white/[0.12] text-xs font-mono font-bold text-white">
                        📅 {grp.dateLabel}
                      </span>
                      <span className="text-[11px] font-mono text-zinc-500">{grp.dateKey}</span>
                      {grp.isToday && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 border border-emerald-500/35 text-emerald-300">
                          Today
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] font-mono text-zinc-400">
                      {grp.commits.length} commits · {grp.workingFiles.length} live working edits
                    </span>
                  </div>

                  {/* Live Uncommitted Changes on this Date */}
                  {grp.workingFiles.length > 0 && (
                    <div className="rounded-xl bg-[#0e1514] border border-emerald-500/30 p-4 flex flex-col gap-2.5">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-400" />
                          <span className="text-xs font-bold text-emerald-200">
                            Live Workspace File Updates (Working Tree)
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-emerald-300">
                          {grp.workingFiles.length} files modified locally
                        </span>
                      </div>

                      <div className="grid grid-cols-1 gap-1.5 max-h-72 overflow-y-auto pr-1 custom-scrollbar">
                        {grp.workingFiles.map((wf) => {
                          const meta = surfaceMeta(wf.surface);
                          return (
                            <div
                              key={wf.path}
                              className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg bg-[#09090c] border border-white/[0.06] text-xs"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span
                                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono border shrink-0 ${workingStatusStyle(
                                    wf.status
                                  )}`}
                                >
                                  {wf.status}
                                </span>
                                <code className="font-mono text-zinc-200 truncate">{wf.path}</code>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <span className={`hidden sm:inline px-1.5 py-0.5 rounded text-[10px] font-mono border ${meta.cls}`}>
                                  {meta.label}
                                </span>
                                <span className="text-[10px] font-mono text-zinc-400 tabular-nums">
                                  {wf.timeLabel}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Commits on this Date */}
                  {grp.commits.map((c) => {
                    const isOpen = Boolean(expandedCommits[c.hash]);
                    return (
                      <div
                        key={c.hash}
                        className="rounded-xl bg-[#0b0c10] border border-white/[0.08] hover:border-white/[0.18] p-4 flex flex-col gap-2.5 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex flex-col gap-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono">
                              <button
                                type="button"
                                onClick={() => handleCopyHash(c.shortHash)}
                                className="px-2 py-0.5 rounded bg-[#16161c] border border-white/[0.1] text-sky-300 font-bold cursor-pointer"
                                title="Click to copy commit hash"
                              >
                                {copiedHash === c.shortHash ? '✓ copied' : c.shortHash}
                              </button>
                              <span className="text-zinc-400">{c.timeLabel}</span>
                              <span className="text-zinc-600">·</span>
                              <span className="text-zinc-300">{c.author}</span>
                              {c.surfaces.map((s) => {
                                const m = surfaceMeta(s);
                                return (
                                  <span key={s} className={`px-1.5 py-0.5 rounded border ${m.cls}`}>
                                    {m.label}
                                  </span>
                                );
                              })}
                            </div>
                            <h3 className="text-sm font-bold text-white leading-snug">{c.subject}</h3>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              setExpandedCommits((prev) => ({ ...prev, [c.hash]: !prev[c.hash] }))
                            }
                            className="px-2.5 py-1 rounded-lg bg-[#16161c] border border-white/[0.1] hover:border-sky-400/40 text-[11px] font-mono text-zinc-200 cursor-pointer shrink-0"
                          >
                            {c.totalFiles} files {isOpen ? '▴' : '▾'}
                          </button>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono text-zinc-400">
                          <span className="text-emerald-400">+{c.totalAdditions} additions</span>
                          <span className="text-rose-400">-{c.totalDeletions} deletions</span>
                        </div>

                        {isOpen && c.files.length > 0 && (
                          <div className="pt-2 border-t border-white/[0.06] flex flex-col gap-1 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                            {c.files.map((f) => {
                              const fm = surfaceMeta(f.surface);
                              return (
                                <div
                                  key={f.path}
                                  className="flex items-center justify-between gap-2 px-2.5 py-1 rounded bg-[#111218] text-[11px] font-mono"
                                >
                                  <code className="text-zinc-200 truncate">{f.path}</code>
                                  <div className="flex items-center gap-2 shrink-0">
                                    <span className={`hidden sm:inline px-1.5 py-0.2 rounded border text-[9px] ${fm.cls}`}>
                                      {fm.label}
                                    </span>
                                    <span className="text-emerald-400">+{f.additions}</span>
                                    <span className="text-rose-400">-{f.deletions}</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </section>
              ))}
            </div>
          )}
        </article>

        {/* Right Sticky All Dates Sidebar */}
        <aside
          className="rounded-2xl bg-[#111115] border border-white/[0.08] p-3.5 shadow-xl hidden lg:flex flex-col gap-3 sticky top-4 max-h-[calc(100vh-140px)]"
          aria-label="Codebase update dates"
        >
          <div className="flex items-center justify-between gap-2 pb-2 border-b border-white/[0.08]">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-200">
              📅 ALL DATES
            </span>
            <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-[10px] font-mono font-bold text-emerald-300">
              {dateGroups.length} Days
            </span>
          </div>

          <input
            type="text"
            value={dateSearch}
            onChange={(e) => setDateSearch(e.target.value)}
            placeholder="Filter date (e.g. Nov 25)..."
            aria-label="Filter dates"
            className="h-8 px-2.5 rounded-lg bg-[#09090c] border border-white/[0.08] text-[11px] font-mono text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-sky-400/50"
          />

          <nav className="flex-1 min-h-0 overflow-y-auto custom-scrollbar flex flex-col gap-1 pr-0.5">
            <button
              type="button"
              onClick={() => setSelectedDateKey('all')}
              className={`w-full text-left px-2.5 py-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                selectedDateKey === 'all'
                  ? 'bg-sky-500/12 border-sky-400/35 text-white font-bold'
                  : 'border-transparent text-zinc-300 hover:bg-white/[0.04]'
              }`}
            >
              Show All Dates ({dateGroups.length})
            </button>

            {sidebarDates.map((g) => {
              const active = selectedDateKey === g.dateKey;
              return (
                <button
                  key={g.dateKey}
                  type="button"
                  onClick={() => setSelectedDateKey(g.dateKey)}
                  className={`w-full text-left px-2.5 py-2 rounded-lg border transition-colors flex flex-col gap-0.5 cursor-pointer ${
                    active
                      ? 'bg-emerald-500/12 border-emerald-400/35 text-emerald-100'
                      : 'border-transparent text-zinc-400 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-mono font-bold truncate">{g.dateLabel}</span>
                    {g.isToday && (
                      <span className="text-[9px] font-mono uppercase text-emerald-400">Today</span>
                    )}
                  </div>
                  <span className="text-[10px] text-zinc-500">
                    {g.commits.length} commits · {g.workingFiles.length} live edits
                  </span>
                </button>
              );
            })}
          </nav>

          <div className="pt-2.5 border-t border-white/[0.08] flex flex-col gap-1.5 text-[11px]">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
              Quick Jump
            </span>
            <button
              type="button"
              onClick={() => onNavigate('changelog')}
              className="px-2.5 py-1.5 rounded-lg bg-[#16161c] border border-white/[0.08] hover:border-sky-400/35 text-zinc-200 hover:text-white text-left font-mono cursor-pointer"
            >
              🧾 Release Changelog →
            </button>
            <button
              type="button"
              onClick={() => onNavigate('everyday')}
              className="px-2.5 py-1.5 rounded-lg bg-[#16161c] border border-white/[0.08] hover:border-emerald-400/35 text-zinc-200 hover:text-white text-left font-mono cursor-pointer"
            >
              🧰 Everyday Utilities →
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
