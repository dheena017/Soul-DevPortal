import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import CopyButton from '../../components/CopyButton';
import {
  HeroArtworkBackdrop,
  ProportionalSpectrumBar,
} from '../../components/PortalVisuals';
import {
  CodeUpdateDateGroup,
  CodeUpdatesResponse,
  fetchCodeUpdates,
} from '../../services/api';
import { PackageData, ProjectData } from '../../types';
import { copyTextSafe } from '../../utils/clipboard';
import {
  CHANGELOG_SURFACE_TABS,
  ChangelogSurface,
} from './changelogConstants';

export interface CodeUpdatesViewProps {
  projects?: ProjectData[];
  packages?: PackageData[];
  externalQuery?: string;
  onNavigate: (viewId: string) => void;
  onBack?: () => void;
}

type UpdateKindFilter = 'all' | 'working' | 'commits';

const SURFACE_BADGES: Record<string, { label: string; cls: string; dot: string }> = {
  desktop: {
    label: 'Desktop & UI',
    cls: 'bg-sky-500/15 border-sky-400/30 text-sky-300',
    dot: 'bg-sky-400',
  },
  everyday: {
    label: 'Everyday Utilities',
    cls: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300',
    dot: 'bg-emerald-400',
  },
  project: {
    label: 'Project',
    cls: 'bg-purple-500/15 border-purple-500/30 text-purple-300',
    dot: 'bg-purple-400',
  },
  package: {
    label: 'Package',
    cls: 'bg-indigo-500/15 border-indigo-500/30 text-indigo-300',
    dot: 'bg-indigo-400',
  },
  documentation: {
    label: 'Documentation',
    cls: 'bg-amber-500/15 border-amber-400/30 text-amber-300',
    dot: 'bg-amber-400',
  },
  computer: {
    label: 'Computer & Performance',
    cls: 'bg-rose-500/15 border-rose-400/30 text-rose-300',
    dot: 'bg-rose-400',
  },
};

function surfaceMeta(id: string) {
  return (
    SURFACE_BADGES[id] || {
      label: 'Desktop & UI',
      cls: 'bg-sky-500/15 border-sky-400/30 text-sky-300',
      dot: 'bg-sky-400',
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

function splitFilePath(fullPath: string): { dir: string; file: string } {
  const idx = fullPath.lastIndexOf('/');
  if (idx === -1) return { dir: '', file: fullPath };
  return {
    dir: fullPath.slice(0, idx + 1),
    file: fullPath.slice(idx + 1),
  };
}

function downloadMarkdown(filename: string, text: string) {
  const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function buildCodeUpdatesMarkdown(groups: CodeUpdateDateGroup[]): string {
  const lines: string[] = [
    '# Soul DevPortal — Codebase Updates by Date',
    '',
  ];
  for (const grp of groups) {
    lines.push(`## ${grp.dateLabel} (${grp.dateKey})`);
    if (grp.workingFiles.length > 0) {
      lines.push('');
      lines.push(`### Live Working Tree (${grp.workingFiles.length})`);
      for (const wf of grp.workingFiles) {
        lines.push(`- [${wf.status}] \`${wf.path}\` (${wf.timeLabel})`);
      }
    }
    if (grp.commits.length > 0) {
      lines.push('');
      lines.push(`### Commits (${grp.commits.length})`);
      for (const c of grp.commits) {
        lines.push(
          `- **${c.shortHash}** ${c.subject} _(${c.author} · ${c.timeLabel} · +${c.totalAdditions}/-${c.totalDeletions})_`
        );
      }
    }
    lines.push('');
  }
  return lines.join('\n');
}

const UpdateSvg: React.FC<{ className?: string; children: React.ReactNode }> = ({
  className = 'w-4 h-4 shrink-0',
  children,
}) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {children}
  </svg>
);

const ChevronSvg: React.FC<{ open: boolean }> = ({ open }) => (
  <svg
    className={`w-3.5 h-3.5 text-zinc-400 shrink-0 transition-transform duration-200 ${
      open ? 'rotate-180 text-white' : ''
    }`}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const DEFAULT_VISIBLE_WORKING_FILES = 10;

export default function CodeUpdatesView({
  projects = [],
  packages = [],
  externalQuery = '',
  onNavigate,
  onBack,
}: CodeUpdatesViewProps) {
  const [data, setData] = useState<CodeUpdatesResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [autoSync, setAutoSync] = useState<boolean>(true);

  const [surface, setSurface] = useState<ChangelogSurface>('all');
  const [updateKind, setUpdateKind] = useState<UpdateKindFilter>('all');
  const [selectedDateKey, setSelectedDateKey] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>(externalQuery);
  const [dateSearch, setDateSearch] = useState<string>('');
  const [expandedCommits, setExpandedCommits] = useState<Record<string, boolean>>({});
  const [expandedWorkingDates, setExpandedWorkingDates] = useState<Record<string, boolean>>({});
  const [collapsedWorkingDates, setCollapsedWorkingDates] = useState<Record<string, boolean>>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (externalQuery !== undefined) {
      setSearchQuery(externalQuery);
    }
  }, [externalQuery]);

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

  const profileTotals = useMemo(() => {
    let working = 0;
    let uiAndSystem = 0;
    let everydayAndDocs = 0;
    let appsAndSdks = 0;

    for (const grp of dateGroups) {
      working += grp.workingFiles.length;
      for (const c of grp.commits) {
        for (const s of c.surfaces) {
          if (s === 'desktop' || s === 'computer') uiAndSystem += 1;
          else if (s === 'everyday' || s === 'documentation') everydayAndDocs += 1;
          else if (s === 'project' || s === 'package') appsAndSdks += 1;
        }
      }
    }
    return { working, uiAndSystem, everydayAndDocs, appsAndSdks };
  }, [dateGroups]);

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
    const q = searchQuery.trim().toLowerCase();

    for (const grp of dateGroups) {
      if (selectedDateKey !== 'all' && grp.dateKey !== selectedDateKey) continue;
      if (updateKind !== 'commits') {
        for (const wf of grp.workingFiles) {
          if (
            q &&
            !(
              wf.path.toLowerCase().includes(q) ||
              wf.status.toLowerCase().includes(q) ||
              grp.dateLabel.toLowerCase().includes(q)
            )
          ) {
            continue;
          }
          counts.all += 1;
          const surf = (wf.surface in counts ? wf.surface : 'desktop') as Exclude<ChangelogSurface, 'all'>;
          counts[surf] += 1;
        }
      }
      if (updateKind !== 'working') {
        for (const c of grp.commits) {
          if (q) {
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
            if (!hay.includes(q)) continue;
          }
          counts.all += 1;
          for (const s of c.surfaces) {
            const surf = (s in counts ? s : 'desktop') as Exclude<ChangelogSurface, 'all'>;
            counts[surf] += 1;
          }
        }
      }
    }
    return counts;
  }, [dateGroups, selectedDateKey, updateKind, searchQuery]);

  const dateFilterEntries = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return dateGroups.map((grp) => {
      const workingFiles =
        updateKind === 'commits'
          ? []
          : grp.workingFiles.filter((wf) => {
              if (surface !== 'all' && wf.surface !== surface) return false;
              if (!q) return true;
              return (
                wf.path.toLowerCase().includes(q) ||
                wf.status.toLowerCase().includes(q) ||
                grp.dateLabel.toLowerCase().includes(q)
              );
            });

      const commits =
        updateKind === 'working'
          ? []
          : grp.commits.filter((c) => {
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
        rawCommitsCount: grp.commits.length,
        rawWorkingCount: grp.workingFiles.length,
        workingFiles,
        commits,
      };
    });
  }, [dateGroups, surface, updateKind, searchQuery]);

  const filteredDateGroups = useMemo(() => {
    return dateFilterEntries
      .filter((grp) => selectedDateKey === 'all' || grp.dateKey === selectedDateKey)
      .filter((grp) => grp.workingFiles.length > 0 || grp.commits.length > 0);
  }, [dateFilterEntries, selectedDateKey]);

  const sidebarDates = useMemo(() => {
    const dq = dateSearch.trim().toLowerCase();
    if (!dq) return dateFilterEntries;
    return dateFilterEntries.filter(
      (g) => g.dateLabel.toLowerCase().includes(dq) || g.dateKey.toLowerCase().includes(dq)
    );
  }, [dateFilterEntries, dateSearch]);

  const visibleSummary = useMemo(() => {
    let commits = 0;
    let working = 0;
    const allHashes: string[] = [];
    const workingDateKeys: string[] = [];
    for (const grp of filteredDateGroups) {
      commits += grp.commits.length;
      working += grp.workingFiles.length;
      if (grp.workingFiles.length > 0) workingDateKeys.push(grp.dateKey);
      for (const c of grp.commits) {
        if (c.files.length > 0) allHashes.push(c.hash);
      }
    }
    return { commits, working, allHashes, workingDateKeys };
  }, [filteredDateGroups]);

  const areAllExpanded =
    visibleSummary.allHashes.length > 0 &&
    visibleSummary.allHashes.every((h) => Boolean(expandedCommits[h])) &&
    visibleSummary.workingDateKeys.every((dk) => !collapsedWorkingDates[dk]);

  const toggleExpandAll = () => {
    const nextExpand = !areAllExpanded;
    const nextCommits: Record<string, boolean> = {};
    for (const h of visibleSummary.allHashes) nextCommits[h] = nextExpand;
    setExpandedCommits(nextCommits);

    const nextWorkingCollapsed: Record<string, boolean> = { ...collapsedWorkingDates };
    for (const dk of visibleSummary.workingDateKeys) {
      nextWorkingCollapsed[dk] = !nextExpand;
    }
    setCollapsedWorkingDates(nextWorkingCollapsed);
  };

  const hasActiveFilters =
    surface !== 'all' ||
    updateKind !== 'all' ||
    selectedDateKey !== 'all' ||
    searchQuery.trim().length > 0;

  const resetAllFilters = () => {
    setSurface('all');
    setUpdateKind('all');
    setSelectedDateKey('all');
    setSearchQuery('');
  };

  const handleCopyValue = (key: string, value: string) => {
    void copyTextSafe(value);
    setCopiedKey(key);
    window.setTimeout(() => {
      setCopiedKey((prev) => (prev === key ? null : prev));
    }, 1500);
  };

  const selectDateAndScroll = (dateKey: string) => {
    setSelectedDateKey(dateKey);
    if (dateKey === 'all') return;
    window.requestAnimationFrame(() => {
      const el = document.getElementById(`code-date-${dateKey}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const updatesMarkdown = useMemo(
    () => buildCodeUpdatesMarkdown(filteredDateGroups),
    [filteredDateGroups]
  );

  return (
    <div className="w-full flex flex-col gap-6 pb-12 animate-in fade-in duration-300 portal-stagger">
      {/* ══════════════════════════════════════════════════════════════════════
          TOP HEADER CARD (Matched 1:1 with ChangelogView Hero & Spectrum Bar)
      ══════════════════════════════════════════════════════════════════════ */}
      <header className="neu-card w-full bg-[#111115] border border-white/[0.08] rounded-2xl p-5 sm:p-6 flex flex-col gap-5 portal-header-sheen">
        <HeroArtworkBackdrop src="/visuals/hero-overview-mesh.jpg" alt="Soul Workspace Codebase Updates Backdrop" />
        <div className="relative z-10 flex flex-col gap-5">
          {/* Top Badges + Quick Actions + 2x2 Stats Row */}
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5">
            <div className="flex items-start gap-4 min-w-0">
              <div className="neu-inset w-12 h-12 rounded-xl bg-[#16161c] border border-white/[0.1] flex items-center justify-center text-emerald-300 shrink-0">
                <UpdateSvg className="w-5 h-5">
                  <circle cx="18" cy="18" r="3" />
                  <circle cx="6" cy="6" r="3" />
                  <path d="M13 6h3a2 2 0 0 1 2 2v7" />
                  <line x1="6" y1="9" x2="6" y2="21" />
                </UpdateSvg>
              </div>
              <div className="flex flex-col gap-2 min-w-0">
                <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider">
                  <button
                    type="button"
                    onClick={() => (onBack ? onBack() : onNavigate('changelog'))}
                    className="neu-btn px-2.5 py-0.5 rounded-full bg-[#16161c] border border-white/[0.1] text-zinc-300 hover:text-white cursor-pointer"
                  >
                    ← Changelog
                  </button>
                  <span className="px-2.5 py-0.5 rounded-md bg-sky-500/15 border border-sky-400/30 text-sky-300">
                    {data?.source === 'git' ? 'GIT COMMITS + WORKING TREE' : 'WORKSPACE SCAN'}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-md bg-amber-500/15 border border-amber-400/30 text-amber-300">
                    {dateGroups[0]?.dateLabel || 'LIVE'}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-md bg-purple-500/15 border border-purple-500/30 text-purple-300">
                    CODE UPDATES
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 status-pulse" />
                    <span>{autoSync ? 'AUTO-SYNC 15S' : 'MANUAL SYNC'}</span>
                  </span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                  Codebase Updates by Date
                </h1>
                <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed max-w-2xl">
                  Track chronological git commit diffs and live working-tree file edits across Desktop
                  &amp; UI, Everyday Utilities, {projects.length || 9} Projects, {packages.length || 3}{' '}
                  Packages, Documentation, and Computer &amp; Performance.
                </p>

                <div className="flex flex-wrap items-center gap-2 pt-0.5">
                  <span className="neu-inset px-2.5 py-1 rounded-lg bg-[#09090c] border border-white/[0.08] text-[11px] font-mono text-zinc-400">
                    soul-devportal/git · live working-tree + commits
                  </span>
                  <button
                    type="button"
                    onClick={() => void loadUpdates(true)}
                    disabled={refreshing}
                    className="neu-btn inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/35 hover:bg-emerald-500/25 text-xs font-bold text-emerald-200 cursor-pointer disabled:opacity-50 transition-colors"
                  >
                    <UpdateSvg className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`}>
                      <path d="M21 2v6h-6" />
                      <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
                      <path d="M3 22v-6h6" />
                      <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
                    </UpdateSvg>
                    <span>{refreshing ? 'Syncing Repo...' : 'Sync Codebase Now'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => downloadMarkdown('CODEBASE_UPDATES.md', updatesMarkdown)}
                    className="neu-btn px-3 py-1 rounded-lg bg-[#16161c] border border-white/[0.1] hover:border-white/[0.22] text-xs font-semibold text-zinc-200 hover:text-white cursor-pointer"
                  >
                    ⬇ Export .md
                  </button>
                  <CopyButton text={updatesMarkdown} variant="compact" label="Copy Feed" copiedLabel="Copied!" />
                </div>
              </div>
            </div>

            {/* Right 2x2 Stats Tiles (exact match to ChangelogView) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 gap-2.5 lg:w-[320px] shrink-0">
              <div className="p-3 rounded-xl neu-inset bg-[#09090c]/90 border border-white/[0.06] flex flex-col gap-0.5">
                <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                  DATES TRACKED
                </span>
                <strong className="text-sm sm:text-base font-extrabold font-mono text-sky-300 tabular-nums">
                  {data?.totalDates ?? 0} days
                </strong>
              </div>
              <div className="p-3 rounded-xl neu-inset bg-[#09090c]/90 border border-white/[0.06] flex flex-col gap-0.5">
                <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                  LAST SYNCED
                </span>
                <strong className="text-sm sm:text-base font-extrabold font-mono text-amber-300 tabular-nums">
                  {data?.generatedTimeLabel || '—'}
                </strong>
              </div>
              <div className="p-3 rounded-xl neu-inset bg-[#09090c]/90 border border-white/[0.06] flex flex-col gap-0.5">
                <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                  LIVE EDITED FILES
                </span>
                <strong className="text-sm sm:text-base font-extrabold font-mono text-emerald-400 tabular-nums">
                  {data?.totalWorkingFiles ?? 0} active
                </strong>
              </div>
              <div className="p-3 rounded-xl neu-inset bg-[#09090c]/90 border border-white/[0.06] flex flex-col gap-0.5">
                <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                  COMMITS LOADED
                </span>
                <strong className="text-sm sm:text-base font-extrabold font-mono text-purple-300 tabular-nums">
                  {data?.totalCommits ?? 0} updates
                </strong>
              </div>
            </div>
          </div>

          {/* Codebase Activity Spectrum Bar */}
          <ProportionalSpectrumBar
            title="CODEBASE ACTIVITY PROFILE"
            segments={[
              {
                label: 'Live Working Edits',
                value: profileTotals.working,
                colorClass: 'bg-emerald-400',
                hex: '#34d399',
              },
              {
                label: 'UI & System Commits',
                value: profileTotals.uiAndSystem,
                colorClass: 'bg-sky-400',
                hex: '#38bdf8',
              },
              {
                label: 'Everyday & Docs',
                value: profileTotals.everydayAndDocs,
                colorClass: 'bg-amber-400',
                hex: '#fbbf24',
              },
              {
                label: 'Apps & Packages',
                value: profileTotals.appsAndSdks,
                colorClass: 'bg-purple-400',
                hex: '#c084fc',
              },
            ]}
          />

          {/* Segmented Surface Filter Tab Bar inside Header (exact match to ChangelogView) */}
          <div className="neu-tray rounded-xl bg-[#09090c] border border-white/[0.08] p-1 flex flex-wrap items-center justify-between gap-2">
            <div
              className="flex flex-wrap items-center gap-1"
              role="tablist"
              aria-label="Filter codebase updates by surface"
            >
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
                        ? 'text-white font-bold border border-white/20'
                        : 'text-zinc-400 hover:text-white hover:bg-white/[0.05] border border-transparent font-medium'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono tabular-nums ${
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

            <div className="flex items-center gap-1.5 shrink-0">
              <div
                className="neu-tray inline-flex items-center p-0.5 rounded-lg bg-[#09090c] border border-white/[0.08]"
                role="group"
                aria-label="Filter by change source"
              >
                {(
                  [
                    { id: 'all', label: 'All' },
                    { id: 'working', label: 'Live Edits' },
                    { id: 'commits', label: 'Commits' },
                  ] as const
                ).map((item) => {
                  const active = updateKind === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setUpdateKind(item.id)}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-mono transition-colors cursor-pointer ${
                        active
                          ? 'neu-btn bg-[#16161c] text-white font-bold border border-white/20'
                          : 'text-zinc-400 hover:text-white border border-transparent'
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => setAutoSync((v) => !v)}
                className={`neu-btn px-2.5 py-1.5 rounded-lg text-[11px] font-mono border cursor-pointer transition-colors ${
                  autoSync
                    ? 'bg-emerald-500/15 border-emerald-500/35 text-emerald-300 font-bold'
                    : 'bg-[#16161c] border-white/[0.08] text-zinc-400 hover:text-white'
                }`}
                title="Toggle 15s background polling"
              >
                {autoSync ? '● Auto 15s' : '○ Paused'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ══════════════════════════════════════════════════════════════════════
          MAIN SPLIT: CHRONOLOGICAL CODEBASE TIMELINE + ON THIS PAGE SIDEBAR
      ══════════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_250px] gap-6 items-start">
        {/* Main Chronological Panel */}
        <article className="min-w-0 rounded-2xl neu-card bg-[#111115] border border-white/[0.08] p-5 sm:p-6 md:p-7 flex flex-col gap-5 portal-header-sheen">
          {/* Panel Title Header matching ChangelogView */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.08]">
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-sky-300">
                ● CHRONOLOGICAL CODEBASE STREAM
              </span>
              <h2 className="text-lg sm:text-xl font-extrabold text-white">
                Soul DevPortal — Codebase Updates by Date
              </h2>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="neu-btn px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-400/35 text-amber-200 hover:text-white text-xs font-mono font-semibold cursor-pointer transition-colors"
                >
                  ↺ Reset
                </button>
              )}
              <button
                type="button"
                onClick={toggleExpandAll}
                disabled={
                  visibleSummary.allHashes.length === 0 &&
                  visibleSummary.workingDateKeys.length === 0
                }
                className="neu-btn px-3 py-1.5 rounded-xl bg-[#16161c] border border-white/[0.1] hover:border-sky-400/40 text-xs font-mono font-semibold text-zinc-200 hover:text-white disabled:opacity-40 cursor-pointer transition-colors"
              >
                {areAllExpanded ? '− Collapse All' : '+ Expand All'}
              </button>
            </div>
          </div>

          {/* Search Filter Strip (exact ChangelogView Scope Bar) */}
          <div className="neu-inset rounded-xl bg-[#0b0d13] border border-sky-400/25 px-3.5 py-2 flex flex-wrap items-center justify-between gap-3 focus-within:border-sky-400/50 transition-colors">
            <div className="flex items-center gap-2.5 flex-1 min-w-[200px]">
              <UpdateSvg className="w-3.5 h-3.5 text-sky-400">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </UpdateSvg>
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Filter ${dateGroups.length} dates — file paths, commit subjects, hashes, authors...`}
                aria-label="Search codebase updates"
                className="w-full bg-transparent text-xs font-mono text-zinc-100 placeholder-zinc-500 focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="neu-btn px-1.5 py-0.5 rounded bg-white/[0.06] hover:bg-white/[0.12] text-zinc-300 hover:text-white text-[10px] font-mono cursor-pointer shrink-0"
                  aria-label="Clear search query"
                >
                  ✕ Clear
                </button>
              )}
            </div>
            <span className="text-[11px] font-mono text-zinc-400 shrink-0 tabular-nums">
              {filteredDateGroups.length} of {dateGroups.length} dates · {visibleSummary.working} live · {visibleSummary.commits} commits
            </span>
          </div>

          {/* Compact Date Pills on Mobile / Tablet (< lg) */}
          {dateFilterEntries.length > 0 && (
            <div className="flex lg:hidden flex-wrap items-center gap-1.5">
              <span className="text-[10.5px] font-mono text-zinc-400 mr-1">Dates:</span>
              <button
                type="button"
                onClick={() => setSelectedDateKey('all')}
                className={`neu-btn px-2 py-1 rounded-md text-[11px] font-mono border cursor-pointer ${
                  selectedDateKey === 'all'
                    ? 'bg-sky-500/20 border-sky-400/45 text-white font-bold'
                    : 'bg-[#08090c] border-white/[0.08] text-zinc-400'
                }`}
              >
                All ({dateFilterEntries.length})
              </button>
              {dateFilterEntries.map((g) => (
                <button
                  key={g.dateKey}
                  type="button"
                  onClick={() => setSelectedDateKey(g.dateKey)}
                  className={`neu-btn px-2 py-1 rounded-md text-[11px] font-mono border cursor-pointer ${
                    selectedDateKey === g.dateKey
                      ? 'bg-emerald-500/20 border-emerald-400/45 text-emerald-100 font-bold'
                      : 'bg-[#08090c] border-white/[0.08] text-zinc-300'
                  }`}
                >
                  {g.dateLabel} ({g.commits.length + g.workingFiles.length})
                </button>
              ))}
            </div>
          )}

          {/* Chronological Date Timeline (Left Gutter + Vertical Spine + Accordions) */}
          <div className="flex flex-col pt-1">
            {loading ? (
              <div className="neu-inset rounded-xl bg-[#09090c] border border-white/[0.08] p-10 text-center text-xs font-mono text-zinc-400">
                Scanning git history &amp; live codebase changes...
              </div>
            ) : filteredDateGroups.length === 0 ? (
              <div className="neu-inset rounded-xl bg-[#09090c] border border-white/[0.08] p-10 text-center flex flex-col items-center gap-2.5">
                <p className="text-sm font-bold text-white">
                  No codebase updates matched this filter
                </p>
                <p className="text-xs text-zinc-400">
                  Switch back to All Surfaces, clear your search term, or show all dates.
                </p>
                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="neu-btn mt-1 px-4 py-1.5 rounded-xl bg-white text-zinc-950 text-xs font-bold cursor-pointer"
                >
                  Show All Updates
                </button>
              </div>
            ) : (
              filteredDateGroups.map((grp, idx) => {
                const isLast = idx === filteredDateGroups.length - 1;
                const isNarrowed =
                  grp.commits.length !== grp.rawCommitsCount ||
                  grp.workingFiles.length !== grp.rawWorkingCount;
                const isWorkingOpen = !collapsedWorkingDates[grp.dateKey];
                const isWorkingExpanded =
                  Boolean(expandedWorkingDates[grp.dateKey]) || searchQuery.trim().length > 0;
                const shownWorkingFiles = isWorkingExpanded
                  ? grp.workingFiles
                  : grp.workingFiles.slice(0, DEFAULT_VISIBLE_WORKING_FILES);
                const hiddenWorkingCount = grp.workingFiles.length - shownWorkingFiles.length;

                return (
                  <section
                    key={grp.dateKey}
                    id={`code-date-${grp.dateKey}`}
                    className={`grid grid-cols-1 sm:grid-cols-[128px_1fr] gap-3 sm:gap-6 scroll-mt-6 ${
                      isLast ? 'pb-2' : 'pb-9'
                    }`}
                  >
                    {/* Left Date & Activity Gutter (exact ChangelogView twin) */}
                    <div className="flex sm:flex-col items-center sm:items-start gap-2 sm:gap-1.5 pt-0.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="neu-tile px-2 py-0.5 rounded-md bg-sky-500/15 border border-sky-400/35 text-[11px] font-mono font-bold text-sky-300">
                          {grp.dateLabel}
                        </span>
                        {grp.isToday && (
                          <span className="neu-tile px-1.5 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/35 text-[9px] font-mono font-bold uppercase text-emerald-300">
                            Today
                          </span>
                        )}
                      </div>
                      <time className="text-[11px] font-mono text-zinc-400">{grp.dateKey}</time>
                      <span className="text-[10.5px] font-mono text-zinc-500 tabular-nums hidden sm:inline">
                        {grp.commits.length}
                        {isNarrowed ? `/${grp.rawCommitsCount}` : ''} commits ·{' '}
                        {grp.workingFiles.length} live
                      </span>
                    </div>

                    {/* Right Vertical Timeline Column */}
                    <div className="flex flex-col gap-5 sm:border-l sm:border-white/[0.08] sm:pl-6 min-w-0">
                      {/* 1. Live Working Tree Files (Emerald Accordion matching ChangelogView Features) */}
                      {grp.workingFiles.length > 0 && (
                        <div className="flex flex-col gap-2">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex flex-col gap-1 min-w-0">
                              <h3 className="text-base sm:text-lg font-extrabold text-white leading-snug tracking-tight">
                                Live Workspace File Edits
                              </h3>
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold border bg-emerald-500/15 border-emerald-500/30 text-emerald-300">
                                  Working Tree
                                </span>
                                <code className="neu-inset px-2 py-0.5 rounded bg-[#09090c] border border-white/[0.08] text-[10px] font-mono text-zinc-400">
                                  {grp.workingFiles.length}{' '}
                                  {grp.workingFiles.length === 1 ? 'file' : 'files'} modified
                                  {isNarrowed ? ` (of ${grp.rawWorkingCount})` : ' locally'}
                                </code>
                              </div>
                            </div>
                          </div>

                          <div className="rounded-xl border transition-colors overflow-hidden border-emerald-500/25 bg-[#0e1514] hover:border-emerald-400/45">
                            <button
                              type="button"
                              onClick={() =>
                                setCollapsedWorkingDates((prev) => ({
                                  ...prev,
                                  [grp.dateKey]: !prev[grp.dateKey],
                                }))
                              }
                              aria-expanded={isWorkingOpen}
                              className="w-full px-4 py-2.5 flex items-center justify-between gap-3 text-left text-xs font-semibold text-zinc-100 hover:text-white cursor-pointer"
                            >
                              <span className="inline-flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 status-pulse" />
                                <span>Working Files</span>
                                <span className="px-1.5 py-0.5 rounded-md border text-[10px] font-mono bg-emerald-500/15 border-emerald-500/30 text-emerald-300">
                                  {grp.workingFiles.length}
                                </span>
                              </span>
                              <ChevronSvg open={isWorkingOpen} />
                            </button>

                            {isWorkingOpen && (
                              <div className="px-4 pb-3.5 pt-2.5 border-t border-white/[0.06] flex flex-col gap-2 bg-[#0a0a0d]/80">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                                  {shownWorkingFiles.map((wf) => {
                                    const meta = surfaceMeta(wf.surface);
                                    const { dir, file } = splitFilePath(wf.path);
                                    const wfCopyId = `wf-${wf.path}`;
                                    const isCopied = copiedKey === wfCopyId;

                                    return (
                                      <div
                                        key={wf.path}
                                        className="neu-inset group flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-[#09090c] border border-white/[0.06] hover:border-emerald-400/30 text-xs transition-colors min-w-0"
                                      >
                                        <div className="flex items-center gap-2 min-w-0 flex-1">
                                          <span
                                            className={`px-1.5 py-0.5 rounded text-[9.5px] font-mono border shrink-0 ${workingStatusStyle(
                                              wf.status
                                            )}`}
                                          >
                                            {wf.status}
                                          </span>
                                          <span className="font-mono text-[11.5px] truncate" title={wf.path}>
                                            {dir && <span className="text-zinc-500">{dir}</span>}
                                            <span className="text-zinc-100 font-semibold">{file}</span>
                                          </span>
                                        </div>

                                        <div className="flex items-center gap-1.5 shrink-0">
                                          <span
                                            className={`hidden xl:inline-flex items-center px-1.5 py-0.5 rounded text-[9.5px] font-mono border ${meta.cls}`}
                                          >
                                            {meta.label}
                                          </span>
                                          <span className="text-[10px] font-mono text-zinc-500 tabular-nums">
                                            {wf.timeLabel}
                                          </span>
                                          <button
                                            type="button"
                                            onClick={() => handleCopyValue(wfCopyId, wf.path)}
                                            title={`Copy ${wf.path}`}
                                            aria-label={`Copy path ${wf.path}`}
                                            className={`neu-btn px-1.5 py-0.5 rounded text-[10px] font-mono border transition-colors cursor-pointer ${
                                              isCopied
                                                ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-200'
                                                : 'bg-[#16161c] border-white/[0.08] text-zinc-400 hover:text-white opacity-80 group-hover:opacity-100'
                                            }`}
                                          >
                                            {isCopied ? '✓' : 'Copy'}
                                          </button>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>

                                {grp.workingFiles.length > DEFAULT_VISIBLE_WORKING_FILES && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setExpandedWorkingDates((prev) => ({
                                        ...prev,
                                        [grp.dateKey]: !prev[grp.dateKey],
                                      }))
                                    }
                                    className="neu-btn w-full py-1.5 px-3 rounded-lg bg-[#0e1514] border border-emerald-500/25 hover:border-emerald-400/45 text-[11px] font-mono font-semibold text-emerald-200 hover:text-white transition-colors cursor-pointer"
                                  >
                                    {isWorkingExpanded
                                      ? `Show top ${DEFAULT_VISIBLE_WORKING_FILES} modified files ▴`
                                      : `Show all ${grp.workingFiles.length} live working files (+${hiddenWorkingCount} more) ▾`}
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* 2. Commits on this Date (Editorial Headline + Surface Tags + Sky File Accordion) */}
                      {grp.commits.map((c) => {
                        const isOpen = Boolean(expandedCommits[c.hash]);
                        const totalLinesChanged = Math.max(1, c.totalAdditions + c.totalDeletions);
                        const addSharePct = Math.round((c.totalAdditions / totalLinesChanged) * 100);
                        const delSharePct = 100 - addSharePct;
                        const hashCopyId = `hash-${c.hash}`;

                        return (
                          <div key={c.hash} className="flex flex-col gap-3">
                            {/* Commit Headline & Copy Hash Action */}
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex flex-col gap-1.5 min-w-0">
                                <h3 className="text-base sm:text-lg font-extrabold text-white leading-snug tracking-tight">
                                  {c.subject}
                                </h3>
                                <div className="flex flex-wrap items-center gap-1.5">
                                  {c.surfaces.map((s) => {
                                    const m = surfaceMeta(s);
                                    return (
                                      <span
                                        key={s}
                                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold border ${m.cls}`}
                                      >
                                        {m.label}
                                      </span>
                                    );
                                  })}
                                  <button
                                    type="button"
                                    onClick={() => handleCopyValue(hashCopyId, c.shortHash)}
                                    title="Click to copy commit hash"
                                    className="neu-inset px-2 py-0.5 rounded bg-[#09090c] border border-white/[0.08] hover:border-sky-400/40 text-[10px] font-mono text-zinc-300 hover:text-sky-300 cursor-pointer transition-colors"
                                  >
                                    {copiedKey === hashCopyId ? '✓ copied' : c.shortHash}
                                  </button>
                                  <span className="px-2 py-0.5 rounded bg-white/[0.04] border border-white/[0.07] text-[10px] font-mono text-zinc-400">
                                    {c.author} · {c.timeLabel}
                                  </span>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleCopyValue(`full-${c.hash}`, c.hash)}
                                title="Copy full commit SHA"
                                className="neu-btn shrink-0 w-7 h-7 rounded-lg bg-[#16161c] border border-white/[0.08] hover:border-sky-400/40 text-zinc-400 hover:text-white flex items-center justify-center text-[11px] font-mono cursor-pointer transition-colors"
                              >
                                {copiedKey === `full-${c.hash}` ? '✓' : '#'}
                              </button>
                            </div>

                            {/* Diff Metrics Summary Line */}
                            <div className="flex flex-wrap items-center gap-3 text-xs font-mono tabular-nums">
                              <span className="text-emerald-400 font-semibold">
                                +{c.totalAdditions.toLocaleString()} additions
                              </span>
                              <span className="text-rose-400 font-semibold">
                                -{c.totalDeletions.toLocaleString()} deletions
                              </span>
                              {(c.totalAdditions > 0 || c.totalDeletions > 0) && (
                                <div
                                  className="neu-inset w-28 h-1.5 rounded-full bg-[#09090c] overflow-hidden flex border border-white/[0.06]"
                                  title={`+${c.totalAdditions} / -${c.totalDeletions} lines`}
                                >
                                  <div
                                    className="h-full bg-emerald-400/85"
                                    style={{ width: `${addSharePct}%` }}
                                  />
                                  <div
                                    className="h-full bg-rose-400/85"
                                    style={{ width: `${delSharePct}%` }}
                                  />
                                </div>
                              )}
                            </div>

                            {/* Collapsible Changed Files Accordion (exact ChangelogView Improvements box style!) */}
                            {c.files.length > 0 && (
                              <div className="rounded-xl border transition-colors overflow-hidden border-sky-400/25 bg-[#0f141c] hover:border-sky-400/45">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setExpandedCommits((prev) => ({
                                      ...prev,
                                      [c.hash]: !prev[c.hash],
                                    }))
                                  }
                                  aria-expanded={isOpen}
                                  className="w-full px-4 py-2.5 flex items-center justify-between gap-3 text-left text-xs font-semibold text-zinc-100 hover:text-white cursor-pointer"
                                >
                                  <span className="inline-flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                                    <span>Changed Files</span>
                                    <span className="px-1.5 py-0.5 rounded-md border text-[10px] font-mono bg-sky-500/15 border-sky-400/30 text-sky-300">
                                      {c.totalFiles}
                                    </span>
                                  </span>
                                  <ChevronSvg open={isOpen} />
                                </button>

                                {isOpen && (
                                  <div className="px-4 pb-3.5 pt-2.5 border-t border-white/[0.06] bg-[#0a0a0d]/80">
                                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-1.5 max-h-72 overflow-y-auto pr-1 custom-scrollbar">
                                      {c.files.map((f) => {
                                        const fm = surfaceMeta(f.surface);
                                        const { dir, file } = splitFilePath(f.path);
                                        const fileCopyId = `cf-${c.shortHash}-${f.path}`;
                                        const isFileCopied = copiedKey === fileCopyId;

                                        return (
                                          <div
                                            key={f.path}
                                            className="neu-inset group flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-[#09090c] border border-white/[0.06] hover:border-sky-400/30 text-[11px] font-mono min-w-0"
                                          >
                                            <span className="truncate min-w-0" title={f.path}>
                                              {dir && <span className="text-zinc-500">{dir}</span>}
                                              <span className="text-zinc-200">{file}</span>
                                            </span>

                                            <div className="flex items-center gap-2 shrink-0 tabular-nums">
                                              <span
                                                className={`hidden sm:inline px-1.5 py-0.2 rounded border text-[9px] ${fm.cls}`}
                                              >
                                                {fm.label}
                                              </span>
                                              <span className="text-emerald-400">+{f.additions}</span>
                                              <span className="text-rose-400">-{f.deletions}</span>
                                              <button
                                                type="button"
                                                onClick={() => handleCopyValue(fileCopyId, f.path)}
                                                className="neu-btn px-1.5 py-0.2 rounded bg-[#16161c] border border-white/[0.08] text-[9.5px] text-zinc-400 hover:text-white cursor-pointer"
                                                title={`Copy ${f.path}`}
                                              >
                                                {isFileCopied ? '✓' : 'Copy'}
                                              </button>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </section>
                );
              })
            )}
          </div>
        </article>

        {/* ════════════════════════════════════════════════════════════════════
            RIGHT STICKY "ON THIS PAGE" PANEL (exact ChangelogView Card Twin)
        ════════════════════════════════════════════════════════════════════ */}
        <aside
          className="rounded-2xl neu-card bg-[#111115] border border-white/[0.08] p-3.5 hidden lg:flex flex-col gap-3 sticky top-4 max-h-[calc(100dvh-7.75rem)]"
          aria-label="Codebase update dates on this page"
        >
          <div className="flex items-center justify-between gap-2 pb-2 border-b border-white/[0.08]">
            <div className="flex items-center gap-2">
              <span className="neu-inset w-6 h-6 rounded-lg bg-[#16161c] border border-white/[0.1] flex items-center justify-center text-sky-300">
                <UpdateSvg className="w-3.5 h-3.5">
                  <line x1="8" y1="6" x2="21" y2="6" />
                  <line x1="8" y1="12" x2="21" y2="12" />
                  <line x1="8" y1="18" x2="21" y2="18" />
                  <line x1="3" y1="6" x2="3.01" y2="6" />
                  <line x1="3" y1="12" x2="3.01" y2="12" />
                  <line x1="3" y1="18" x2="3.01" y2="18" />
                </UpdateSvg>
              </span>
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-200">
                ON THIS PAGE
              </span>
            </div>
            <span className="px-2 py-0.5 rounded-md bg-sky-500/15 border border-sky-400/30 text-[10px] font-mono font-bold text-sky-300 tabular-nums">
              {dateGroups.length} {dateGroups.length === 1 ? 'Day' : 'Days'}
            </span>
          </div>

          <input
            type="text"
            value={dateSearch}
            onChange={(e) => setDateSearch(e.target.value)}
            placeholder="Filter dates..."
            aria-label="Filter codebase dates"
            className="h-8 px-2.5 rounded-lg bg-[#09090c] border border-white/[0.08] text-[11px] font-mono text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-sky-400/50"
          />

          <nav className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden sidebar-scroll flex flex-col gap-1 px-1 py-1">
            <button
              type="button"
              onClick={() => selectDateAndScroll('all')}
              className={`w-full text-left px-2.5 py-2 rounded-lg border transition-colors flex items-center justify-between gap-2 cursor-pointer ${
                selectedDateKey === 'all'
                  ? 'bg-sky-500/12 border-sky-400/35 text-sky-200'
                  : 'bg-transparent border-transparent text-zinc-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <span className="text-[11px] font-mono font-bold truncate">All Dates</span>
              <span className="text-[10px] font-mono text-zinc-500 tabular-nums">
                {dateGroups.length}
              </span>
            </button>

            {sidebarDates.map((g) => {
              const isActive = selectedDateKey === g.dateKey;
              const isEmptyAfterFilter = g.commits.length === 0 && g.workingFiles.length === 0;
              return (
                <button
                  key={g.dateKey}
                  type="button"
                  onClick={() => selectDateAndScroll(g.dateKey)}
                  title={`${g.dateLabel} · ${g.commits.length} commits, ${g.workingFiles.length} live edits`}
                  className={`w-full text-left px-2.5 py-2 rounded-lg border transition-colors flex flex-col gap-0.5 cursor-pointer ${
                    isActive
                      ? 'bg-sky-500/12 border-sky-400/35 text-sky-200'
                      : isEmptyAfterFilter
                      ? 'bg-transparent border-transparent text-zinc-500 opacity-55 hover:opacity-100 hover:bg-white/[0.04]'
                      : 'bg-transparent border-transparent text-zinc-400 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-mono font-bold truncate">{g.dateLabel}</span>
                    {g.isToday && (
                      <span className="text-[9px] font-mono uppercase text-emerald-400">
                        Today
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-zinc-500 truncate tabular-nums">
                    {g.commits.length} commits · {g.workingFiles.length} live
                  </span>
                </button>
              );
            })}
          </nav>

          <div className="pt-2.5 border-t border-white/[0.08] flex flex-col gap-1.5 text-[11px]">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
              Quick Jump
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => onNavigate('projects')}
                className="neu-btn px-2 py-1 rounded-lg bg-[#16161c] border border-white/[0.08] hover:border-emerald-400/35 text-zinc-300 hover:text-white text-left font-mono cursor-pointer truncate"
              >
                Apps ({projects.length || 9})
              </button>
              <button
                type="button"
                onClick={() => onNavigate('packages')}
                className="neu-btn px-2 py-1 rounded-lg bg-[#16161c] border border-white/[0.08] hover:border-purple-400/35 text-zinc-300 hover:text-white text-left font-mono cursor-pointer truncate"
              >
                SDKs ({packages.length || 3})
              </button>
              <button
                type="button"
                onClick={() => onNavigate('changelog')}
                className="neu-btn col-span-2 px-2 py-1.5 rounded-lg bg-sky-500/12 border border-sky-400/30 hover:border-sky-400/50 text-sky-200 hover:text-white text-left font-mono cursor-pointer truncate"
              >
                🧾 Release Changelog →
              </button>
              <button
                type="button"
                onClick={() => onNavigate('everyday')}
                className="neu-btn col-span-2 px-2 py-1.5 rounded-lg bg-emerald-500/12 border border-emerald-500/30 hover:border-emerald-400/50 text-emerald-200 hover:text-white text-left font-mono cursor-pointer truncate"
              >
                Everyday Utilities →
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
