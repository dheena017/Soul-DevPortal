import React, { useMemo, useRef, useState } from 'react';
import CopyButton from '../../components/CopyButton';
import {
  HeroArtworkBackdrop,
  ProportionalSpectrumBar,
} from '../../components/PortalVisuals';
import { useSyncedWorkspaceState } from '../../services/workspaceStateStore';
import { PackageData, ProjectData, StatsData } from '../../types';
import {
  BUILTIN_CHANGELOG_RELEASES,
  buildChangelogMarkdown,
  CHANGELOG_SURFACE_TABS,
  ChangelogDetailItem,
  ChangelogPersistedState,
  ChangelogRelease,
  ChangelogSurface,
  DEFAULT_CHANGELOG_PERSISTED_STATE,
} from './changelogConstants';

export interface ChangelogViewProps {
  projects?: ProjectData[];
  packages?: PackageData[];
  stats?: StatsData;
  rootScripts?: Record<string, string>;
  externalQuery?: string;
  onNavigate: (viewId: string) => void;
  onBack?: () => void;
}

type AccordionSectionKey = 'features' | 'improvements' | 'fixes';

const SURFACE_BADGE_TONES: Record<Exclude<ChangelogSurface, 'all'>, string> = {
  desktop: 'bg-sky-500/15 border-sky-400/30 text-sky-300',
  everyday: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300',
  project: 'bg-purple-500/15 border-purple-500/30 text-purple-300',
  package: 'bg-indigo-500/15 border-indigo-500/30 text-indigo-300',
  documentation: 'bg-amber-500/15 border-amber-400/30 text-amber-300',
  computer: 'bg-rose-500/15 border-rose-400/30 text-rose-300',
};

const SURFACE_LABELS: Record<Exclude<ChangelogSurface, 'all'>, string> = {
  desktop: 'Desktop & UI',
  everyday: 'Everyday Utilities',
  project: 'Project',
  package: 'Package',
  documentation: 'Documentation',
  computer: 'Computer & Performance',
};

function accordionStorageId(releaseId: string, kind: AccordionSectionKey): string {
  return `${releaseId}::${kind}`;
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

export default function ChangelogView({
  projects = [],
  packages = [],
  externalQuery = '',
  onNavigate,
  onBack,
}: ChangelogViewProps) {
  const [persisted, setPersisted, syncStatus] = useSyncedWorkspaceState<ChangelogPersistedState>(
    'catalog',
    DEFAULT_CHANGELOG_PERSISTED_STATE
  );

  const [surface, setSurface] = useState<ChangelogSurface>('all');
  const [searchQuery, setSearchQuery] = useState<string>(externalQuery);
  const [railFilter, setRailFilter] = useState<string>('');
  const [bookmarkedOnly, setBookmarkedOnly] = useState<boolean>(false);
  const [expandedAccordions, setExpandedAccordions] = useState<Record<string, boolean>>({});
  const [activeAnchorId, setActiveAnchorId] = useState<string>(BUILTIN_CHANGELOG_RELEASES[0].id);
  const searchRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (externalQuery !== undefined) {
      setSearchQuery(externalQuery);
    }
  }, [externalQuery]);

  const starredSet = useMemo(() => new Set(persisted.starredIds || []), [persisted.starredIds]);

  const allReleases = useMemo(() => BUILTIN_CHANGELOG_RELEASES, []);

  const statsTotals = useMemo(() => {
    let features = 0;
    let improvements = 0;
    let fixes = 0;
    let announcements = 0;
    for (const r of allReleases) {
      features += r.features?.length || 0;
      improvements += r.improvements?.length || 0;
      fixes += r.fixes?.length || 0;
      if (r.isAnnouncement) announcements += 1;
    }
    return { features, improvements, fixes, announcements };
  }, [allReleases]);

  const surfaceCounts = useMemo(() => {
    const counts: Record<ChangelogSurface, number> = {
      all: allReleases.length,
      desktop: 0,
      everyday: 0,
      project: 0,
      package: 0,
      documentation: 0,
      computer: 0,
    };
    for (const rel of allReleases) {
      for (const s of rel.surfaces) {
        counts[s] = (counts[s] || 0) + 1;
      }
    }
    return counts;
  }, [allReleases]);

  const filteredReleases = useMemo(() => {
    const needle = searchQuery.trim().toLowerCase();
    return allReleases.filter((rel) => {
      if (surface !== 'all' && !rel.surfaces.includes(surface)) return false;
      if (bookmarkedOnly && !starredSet.has(rel.id)) return false;
      if (needle) {
        const hay = [
          rel.version,
          rel.dateLabel,
          rel.headline,
          rel.summary,
          rel.commitRef || '',
          ...(rel.features || []).map((i) => `${i.title} ${i.description}`),
          ...(rel.improvements || []).map((i) => `${i.title} ${i.description}`),
          ...(rel.fixes || []).map((i) => `${i.title} ${i.description}`),
        ]
          .join(' ')
          .toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
  }, [allReleases, surface, bookmarkedOnly, starredSet, searchQuery]);

  const visibleRailReleases = useMemo(() => {
    const q = railFilter.trim().toLowerCase();
    if (!q) return filteredReleases;
    return filteredReleases.filter(
      (r) => r.version.toLowerCase().includes(q) || r.headline.toLowerCase().includes(q)
    );
  }, [filteredReleases, railFilter]);

  const allAccordionKeys = useMemo(() => {
    const keys: string[] = [];
    for (const rel of filteredReleases) {
      if (rel.features && rel.features.length > 0) keys.push(accordionStorageId(rel.id, 'features'));
      if (rel.improvements && rel.improvements.length > 0) {
        keys.push(accordionStorageId(rel.id, 'improvements'));
      }
      if (rel.fixes && rel.fixes.length > 0) keys.push(accordionStorageId(rel.id, 'fixes'));
    }
    return keys;
  }, [filteredReleases]);

  const areAllExpanded =
    allAccordionKeys.length > 0 && allAccordionKeys.every((k) => Boolean(expandedAccordions[k]));

  const toggleExpandAll = () => {
    const nextState = !areAllExpanded;
    const nextMap: Record<string, boolean> = { ...expandedAccordions };
    for (const key of allAccordionKeys) {
      nextMap[key] = nextState;
    }
    setExpandedAccordions(nextMap);
  };

  const toggleSingleAccordion = (key: string) => {
    setExpandedAccordions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const toggleStarRelease = (releaseId: string) => {
    setPersisted((prev) => {
      const current = prev.starredIds || [];
      const exists = current.includes(releaseId);
      return {
        ...prev,
        starredIds: exists ? current.filter((id) => id !== releaseId) : [releaseId, ...current],
      };
    });
  };

  const handleDeleteCustomRelease = (releaseId: string) => {
    setPersisted((prev) => ({
      ...prev,
      customReleases: (prev.customReleases || []).filter((r) => r.id !== releaseId),
      starredIds: (prev.starredIds || []).filter((id) => id !== releaseId),
    }));
  };

  const jumpToRelease = (id: string) => {
    setActiveAnchorId(id);
    const el = document.getElementById(`changelog-entry-${id}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const changelogMarkdown = useMemo(() => buildChangelogMarkdown(filteredReleases), [filteredReleases]);

  const renderAccordionBox = (
    releaseId: string,
    kind: AccordionSectionKey,
    label: string,
    items?: ChangelogDetailItem[]
  ) => {
    if (!items || items.length === 0) return null;
    const key = accordionStorageId(releaseId, kind);
    const isOpen = Boolean(expandedAccordions[key]);

    const accentTheme =
      kind === 'features'
        ? {
            box: 'border-emerald-500/25 bg-[#0e1514] hover:border-emerald-400/45',
            dot: 'bg-emerald-400',
            countPill: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300',
          }
        : kind === 'improvements'
        ? {
            box: 'border-sky-400/25 bg-[#0f141c] hover:border-sky-400/45',
            dot: 'bg-sky-400',
            countPill: 'bg-sky-500/15 border-sky-400/30 text-sky-300',
          }
        : {
            box: 'border-amber-400/25 bg-[#17130e] hover:border-amber-400/45',
            dot: 'bg-amber-400',
            countPill: 'bg-amber-500/15 border-amber-400/30 text-amber-300',
          };

    return (
      <div
        key={key}
        className={`rounded-xl border transition-colors overflow-hidden ${accentTheme.box}`}
      >
        <button
          type="button"
          onClick={() => toggleSingleAccordion(key)}
          aria-expanded={isOpen}
          className="w-full px-4 py-2.5 flex items-center justify-between gap-3 text-left text-xs font-semibold text-zinc-100 hover:text-white cursor-pointer"
        >
          <span className="inline-flex items-center gap-2">
            <span className={`w-1.5 h-1.5 rounded-full ${accentTheme.dot}`} />
            <span>{label}</span>
            <span className={`px-1.5 py-0.5 rounded-md border text-[10px] font-mono ${accentTheme.countPill}`}>
              {items.length}
            </span>
          </span>
          <svg
            className={`w-3.5 h-3.5 text-zinc-400 shrink-0 transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-white' : ''
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
        </button>

        {isOpen && (
          <div className="px-4 pb-3.5 pt-2.5 border-t border-white/[0.06] flex flex-col gap-2.5 bg-[#0a0a0d]/80">
            {items.map((item, idx) => (
              <div key={idx} className="flex items-start justify-between gap-3 text-xs leading-relaxed">
                <div className="flex items-start gap-2.5 min-w-0">
                  <span className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${accentTheme.dot}`} />
                  <p className="text-zinc-300">
                    <strong className="text-white font-semibold">{item.title}</strong>
                    {item.description ? ` — ${item.description}` : ''}
                  </p>
                </div>
                {item.route && (
                  <button
                    type="button"
                    onClick={() => onNavigate(item.route!)}
                    className="shrink-0 px-2.5 py-0.5 rounded-lg bg-[#16161c] border border-white/[0.1] hover:border-sky-400/40 text-[10px] font-mono text-sky-300 hover:text-white cursor-pointer"
                  >
                    Open →
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full flex flex-col gap-6 pb-12 animate-in fade-in duration-300 portal-stagger">
      {/* ══════════════════════════════════════════════════════════════════════
          TOP HEADER CARD (Soul DevPortal Signature Theme + Visual Artwork)
      ══════════════════════════════════════════════════════════════════════ */}
      <header className="neu-card w-full bg-[#111115] border border-white/[0.08] rounded-2xl p-5 sm:p-6 flex flex-col gap-5 portal-header-sheen">
        <HeroArtworkBackdrop src="/visuals/hero-overview-mesh.jpg" alt="Soul Workspace Changelog Backdrop" />
        <div className="relative z-10 flex flex-col gap-5">
          {/* Top Badges + Quick Actions Row */}
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5">
            <div className="flex items-start gap-4 min-w-0">
              <div className="neu-inset w-12 h-12 rounded-xl bg-[#16161c] border border-white/[0.1] flex items-center justify-center text-xl shrink-0">
                🧾
              </div>
              <div className="flex flex-col gap-2 min-w-0">
                <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider">
                  {onBack && (
                    <button
                      type="button"
                      onClick={onBack}
                      className="neu-btn px-2.5 py-0.5 rounded-full bg-[#16161c] border border-white/[0.1] text-zinc-300 hover:text-white cursor-pointer"
                    >
                      ← Overview
                    </button>
                  )}
                  <span className="px-2.5 py-0.5 rounded-md bg-sky-500/15 border border-sky-400/30 text-sky-300">
                    RELEASE TIMELINE
                  </span>
                  <span className="px-2.5 py-0.5 rounded-md bg-amber-500/15 border border-amber-400/30 text-amber-300">
                    {allReleases[0]?.version || 'v0.0.1'}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-md bg-purple-500/15 border border-purple-500/30 text-purple-300">
                    CHANGELOG
                  </span>
                  <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
                    ● {syncStatus.saving ? 'Syncing DB...' : 'SQLite Synced'}
                  </span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                  Changelog
                </h1>
                <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed max-w-2xl">
                  Track new features, improvements, and bug fixes across Desktop &amp; UI, Everyday
                  Utilities, {projects.length || 9} Projects, {packages.length || 3} Packages,
                  Documentation, and Computer &amp; Performance.
                </p>

                <div className="flex flex-wrap items-center gap-2 pt-0.5">
                  <span className="neu-inset px-2.5 py-1 rounded-lg bg-[#09090c] border border-white/[0.08] text-[11px] font-mono text-zinc-400">
                    soul-devportal/releases · git + sqlite-wal
                  </span>
                  <button
                    type="button"
                    onClick={() => onNavigate('code-updates')}
                    className="neu-btn px-3 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/35 hover:bg-emerald-500/25 text-xs font-bold text-emerald-200 cursor-pointer transition-colors"
                  >
                    🧬 Codebase Updates by Date →
                  </button>
                  <button
                    type="button"
                    onClick={() => downloadMarkdown('CHANGELOG.md', changelogMarkdown)}
                    className="neu-btn px-3 py-1 rounded-lg bg-[#16161c] border border-white/[0.1] hover:border-white/[0.22] text-xs font-semibold text-zinc-200 hover:text-white cursor-pointer"
                  >
                    ⬇ Export .md
                  </button>
                  <CopyButton text={changelogMarkdown} variant="compact" label="Copy Feed" copiedLabel="Copied!" />
                </div>
              </div>
            </div>

            {/* Right 2x2 Stats Tiles (matching DocsView style) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 gap-2.5 lg:w-[320px] shrink-0">
              <div className="p-3 rounded-xl neu-inset bg-[#09090c]/90 border border-white/[0.06] flex flex-col gap-0.5">
                <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                  RELEASES
                </span>
                <strong className="text-sm sm:text-base font-extrabold font-mono text-sky-300">
                  {allReleases.length} milestones
                </strong>
              </div>
              <div className="p-3 rounded-xl neu-inset bg-[#09090c]/90 border border-white/[0.06] flex flex-col gap-0.5">
                <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                  LATEST BUILD
                </span>
                <strong className="text-sm sm:text-base font-extrabold font-mono text-amber-300">
                  {allReleases[0]?.version || 'v0.0.1'}
                </strong>
              </div>
              <div className="p-3 rounded-xl neu-inset bg-[#09090c]/90 border border-white/[0.06] flex flex-col gap-0.5">
                <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                  NEW FEATURES
                </span>
                <strong className="text-sm sm:text-base font-extrabold font-mono text-emerald-400">
                  {statsTotals.features} shipped
                </strong>
              </div>
              <div className="p-3 rounded-xl neu-inset bg-[#09090c]/90 border border-white/[0.06] flex flex-col gap-0.5">
                <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                  IMPROVEMENTS &amp; FIXES
                </span>
                <strong className="text-sm sm:text-base font-extrabold font-mono text-purple-300">
                  {statsTotals.improvements + statsTotals.fixes} updates
                </strong>
              </div>
            </div>
          </div>

          {/* Release Content Spectrum Bar */}
          <ProportionalSpectrumBar
            title="RELEASE CONTENT PROFILE"
            segments={[
              {
                label: 'New Features',
                value: statsTotals.features,
                colorClass: 'bg-emerald-400',
                hex: '#34d399',
              },
              {
                label: 'Improvements',
                value: statsTotals.improvements,
                colorClass: 'bg-sky-400',
                hex: '#38bdf8',
              },
              {
                label: 'Fixes',
                value: statsTotals.fixes,
                colorClass: 'bg-amber-400',
                hex: '#fbbf24',
              },
              {
                label: 'Announcements',
                value: statsTotals.announcements,
                colorClass: 'bg-purple-400',
                hex: '#c084fc',
              },
            ]}
          />

          {/* Segmented Surface Filter Tab Bar */}
          <div className="neu-tray rounded-xl bg-[#09090c] border border-white/[0.08] p-1 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1" role="tablist" aria-label="Changelog surface tabs">
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

            <button
              type="button"
              onClick={() => setBookmarkedOnly((p) => !p)}
              className={`neu-btn px-3 py-1.5 rounded-lg text-xs font-mono border cursor-pointer transition-colors ${
                bookmarkedOnly
                  ? 'bg-amber-500/20 border-amber-400/45 text-amber-300 font-bold'
                  : 'bg-[#16161c] border-white/[0.08] text-zinc-400 hover:text-white'
              }`}
            >
              {bookmarkedOnly ? `★ Starred Only (${starredSet.size})` : `☆ Starred (${starredSet.size})`}
            </button>
          </div>
        </div>
      </header>

      {/* ══════════════════════════════════════════════════════════════════════
          MAIN SPLIT: CHANGELOG TIMELINE (Same Layout) + ON THIS PAGE SIDEBAR
      ══════════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_250px] gap-6 items-start">
        {/* Main Changelog Release Panel */}
        <article className="min-w-0 rounded-2xl neu-card bg-[#111115] border border-white/[0.08] p-5 sm:p-6 md:p-7 flex flex-col gap-5 portal-header-sheen">
          {/* Panel Header + Callout Strip matching DocsView */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.08]">
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-sky-300">
                ● CHRONOLOGICAL RELEASE STREAM
              </span>
              <h2 className="text-lg sm:text-xl font-extrabold text-white">
                Soul DevPortal — Release History
              </h2>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={toggleExpandAll}
                disabled={allAccordionKeys.length === 0}
                className="neu-btn px-3 py-1.5 rounded-xl bg-[#16161c] border border-white/[0.1] hover:border-sky-400/40 text-xs font-mono font-semibold text-zinc-200 hover:text-white disabled:opacity-40 cursor-pointer transition-colors"
              >
                {areAllExpanded ? '− Collapse All' : '+ Expand All'}
              </button>
            </div>
          </div>

          {/* Subtle Callout / Search Filter Strip (exact Docs SCOPE style!) */}
          <div className="neu-inset rounded-xl bg-[#0b0d13] border border-sky-400/25 px-3.5 py-2 flex flex-wrap items-center justify-between gap-3 focus-within:border-sky-400/50 transition-colors">
            <div className="flex items-center gap-2.5 flex-1 min-w-[200px]">
              <svg className="w-3.5 h-3.5 text-sky-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                ref={searchRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Filter ${allReleases.length} releases — v0.0.1, notes, tasks, electron, sqlite...`}
                aria-label="Filter changelog releases"
                className="w-full bg-transparent text-xs font-mono text-zinc-100 placeholder-zinc-500 focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="px-1.5 py-0.5 rounded bg-white/[0.06] hover:bg-white/[0.12] text-zinc-300 hover:text-white text-[10px] font-mono cursor-pointer shrink-0"
                >
                  ✕ Clear
                </button>
              )}
            </div>
            <span className="text-[11px] font-mono text-zinc-400 shrink-0 tabular-nums">
              {filteredReleases.length} of {allReleases.length} shown
            </span>
          </div>

          {/* Chronological Release Entries (Version/Date Gutter + Right Timeline Column) */}
          <div className="flex flex-col pt-1">
            {filteredReleases.length === 0 ? (
              <div className="neu-inset rounded-xl bg-[#09090c] border border-white/[0.08] p-10 text-center flex flex-col items-center gap-2.5">
                <p className="text-sm font-bold text-white">No releases matched your filter</p>
                <p className="text-xs text-zinc-400">
                  Reset your search term or surface filter to view all workspace milestones.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSurface('all');
                    setBookmarkedOnly(false);
                    setSearchQuery('');
                  }}
                  className="neu-btn mt-1 px-4 py-1.5 rounded-xl bg-white text-zinc-950 text-xs font-bold cursor-pointer"
                >
                  Show All Releases
                </button>
              </div>
            ) : (
              filteredReleases.map((rel, idx) => {
                const isStarred = starredSet.has(rel.id);
                const isLast = idx === filteredReleases.length - 1;

                return (
                  <section
                    key={rel.id}
                    id={`changelog-entry-${rel.id}`}
                    className={`grid grid-cols-1 sm:grid-cols-[128px_1fr] gap-3 sm:gap-6 scroll-mt-6 ${
                      isLast ? 'pb-2' : 'pb-9'
                    }`}
                  >
                    {/* Left Date & Version Gutter */}
                    <div className="flex sm:flex-col items-center sm:items-start gap-2 sm:gap-1.5 pt-0.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="px-2 py-0.5 rounded-md bg-sky-500/15 border border-sky-400/35 text-[11px] font-mono font-bold text-sky-300">
                          {rel.version}
                        </span>
                        {rel.isLatest && (
                          <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/35 text-[9px] font-mono font-bold uppercase text-emerald-300">
                            Latest
                          </span>
                        )}
                      </div>
                      <time className="text-[11px] font-mono text-zinc-400">{rel.dateLabel}</time>
                    </div>

                    {/* Right Entry Content */}
                    {rel.isAnnouncement ? (
                      <div className="neu-card rounded-2xl bg-[#14131c] border border-purple-500/35 p-5 flex flex-col gap-3 portal-header-sheen">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-purple-500/15 border border-purple-500/30 text-[10px] font-mono font-bold uppercase tracking-wider text-purple-300">
                            <span aria-hidden="true">✦</span>
                            <span>{rel.announcementBadge || 'Release Announcement'}</span>
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => toggleStarRelease(rel.id)}
                              className={`text-xs cursor-pointer ${
                                isStarred ? 'text-amber-300' : 'text-zinc-500 hover:text-zinc-200'
                              }`}
                              title="Bookmark release"
                            >
                              {isStarred ? '★' : '☆'}
                            </button>
                            {rel.isCustom && (
                              <button
                                type="button"
                                onClick={() => handleDeleteCustomRelease(rel.id)}
                                className="text-[11px] font-mono text-zinc-400 hover:text-rose-300 cursor-pointer"
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        </div>

                        <h3 className="text-base sm:text-lg font-extrabold text-white leading-snug">
                          {rel.headline}
                        </h3>
                        <p className="text-xs sm:text-[13px] text-zinc-300 leading-relaxed">
                          {rel.summary}
                        </p>

                        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                          <div className="flex flex-wrap gap-1.5">
                            {rel.surfaces.map((s) => (
                              <span
                                key={s}
                                className={`px-2 py-0.5 rounded text-[10px] font-mono border ${SURFACE_BADGE_TONES[s]}`}
                              >
                                {SURFACE_LABELS[s]}
                              </span>
                            ))}
                          </div>
                          {rel.ctaRoute && (
                            <button
                              type="button"
                              onClick={() => onNavigate(rel.ctaRoute!)}
                              className="neu-btn inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-purple-500/20 border border-purple-400/35 hover:bg-purple-500/30 text-xs font-semibold text-purple-200 cursor-pointer"
                            >
                              <span>{rel.ctaLabel || 'Open Surface'} →</span>
                            </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3 sm:border-l sm:border-white/[0.08] sm:pl-6">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex flex-col gap-1.5 min-w-0">
                            <h3 className="text-base sm:text-lg font-extrabold text-white leading-snug tracking-tight">
                              {rel.headline}
                            </h3>
                            <div className="flex flex-wrap items-center gap-1.5">
                              {rel.surfaces.map((s) => (
                                <span
                                  key={s}
                                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold border ${SURFACE_BADGE_TONES[s]}`}
                                >
                                  {SURFACE_LABELS[s]}
                                </span>
                              ))}
                              {rel.commitRef && (
                                <code className="neu-inset px-2 py-0.5 rounded bg-[#09090c] border border-white/[0.08] text-[10px] font-mono text-zinc-400">
                                  {rel.commitRef}
                                </code>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
                            <button
                              type="button"
                              onClick={() => toggleStarRelease(rel.id)}
                              className={`neu-btn w-7 h-7 rounded-lg border flex items-center justify-center text-xs cursor-pointer transition-colors ${
                                isStarred
                                  ? 'bg-amber-500/15 border-amber-400/40 text-amber-300'
                                  : 'bg-[#16161c] border-white/[0.08] text-zinc-400 hover:text-white'
                              }`}
                              title={isStarred ? 'Remove bookmark' : 'Bookmark release'}
                            >
                              {isStarred ? '★' : '☆'}
                            </button>
                          </div>
                        </div>

                        <p className="text-xs sm:text-[13px] text-zinc-300 leading-relaxed">
                          {rel.summary}
                        </p>

                        {/* Color-coded Collapsible Accordions */}
                        <div className="flex flex-col gap-2">
                          {renderAccordionBox(rel.id, 'features', 'Features', rel.features)}
                          {renderAccordionBox(rel.id, 'improvements', 'Improvements', rel.improvements)}
                          {renderAccordionBox(rel.id, 'fixes', 'Fixes', rel.fixes)}
                        </div>

                        {rel.ctaRoute && (
                          <div className="pt-0.5">
                            <button
                              type="button"
                              onClick={() => onNavigate(rel.ctaRoute!)}
                              className="inline-flex items-center gap-1.5 text-[11px] font-mono font-semibold text-sky-300 hover:text-sky-200 cursor-pointer"
                            >
                              <span>{rel.ctaLabel || 'Explore Surface'} →</span>
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </section>
                );
              })
            )}
          </div>
        </article>

        {/* Right Sticky "ON THIS PAGE" Panel matching DocsView Card Style */}
        <aside
          className="rounded-2xl neu-card bg-[#111115] border border-white/[0.08] p-3.5 hidden lg:flex flex-col gap-3 sticky top-4 max-h-[calc(100dvh-7.75rem)]"
          aria-label="Changelog versions on this page"
        >
          <div className="flex items-center justify-between gap-2 pb-2 border-b border-white/[0.08]">
            <div className="flex items-center gap-2">
              <span className="neu-inset w-6 h-6 rounded-lg bg-[#16161c] border border-white/[0.1] flex items-center justify-center text-sky-300">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="8" y1="6" x2="21" y2="6" />
                  <line x1="8" y1="12" x2="21" y2="12" />
                  <line x1="8" y1="18" x2="21" y2="18" />
                  <line x1="3" y1="6" x2="3.01" y2="6" />
                  <line x1="3" y1="12" x2="3.01" y2="12" />
                  <line x1="3" y1="18" x2="3.01" y2="18" />
                </svg>
              </span>
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-200">
                ON THIS PAGE
              </span>
            </div>
            <span className="px-2 py-0.5 rounded-md bg-sky-500/15 border border-sky-400/30 text-[10px] font-mono font-bold text-sky-300">
              {visibleRailReleases.length} Releases
            </span>
          </div>

          <input
            type="text"
            value={railFilter}
            onChange={(e) => setRailFilter(e.target.value)}
            placeholder="Filter versions..."
            aria-label="Filter changelog versions"
            className="h-8 px-2.5 rounded-lg bg-[#09090c] border border-white/[0.08] text-[11px] font-mono text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-sky-400/50"
          />

          <nav className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden sidebar-scroll flex flex-col gap-1 px-1 py-1">
            {visibleRailReleases.map((rel) => {
              const isActive = activeAnchorId === rel.id;
              return (
                <button
                  key={rel.id}
                  type="button"
                  onClick={() => jumpToRelease(rel.id)}
                  title={`${rel.version} · ${rel.headline}`}
                  className={`w-full text-left px-2.5 py-2 rounded-lg border transition-colors flex flex-col gap-0.5 cursor-pointer ${
                    isActive
                      ? 'bg-sky-500/12 border-sky-400/35 text-sky-200'
                      : 'bg-transparent border-transparent text-zinc-400 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-mono font-bold truncate">{rel.version}</span>
                    {rel.isLatest && (
                      <span className="text-[9px] font-mono uppercase text-emerald-400">Latest</span>
                    )}
                  </div>
                  <span className="text-[10px] text-zinc-500 truncate">{rel.dateLabel}</span>
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
                Apps ({projects.length})
              </button>
              <button
                type="button"
                onClick={() => onNavigate('packages')}
                className="neu-btn px-2 py-1 rounded-lg bg-[#16161c] border border-white/[0.08] hover:border-purple-400/35 text-zinc-300 hover:text-white text-left font-mono cursor-pointer truncate"
              >
                SDKs ({packages.length})
              </button>
              <button
                type="button"
                onClick={() => onNavigate('code-updates')}
                className="neu-btn col-span-2 px-2 py-1.5 rounded-lg bg-sky-500/12 border border-sky-400/30 hover:border-sky-400/50 text-sky-200 hover:text-white text-left font-mono cursor-pointer truncate"
              >
                🧬 Codebase Updates by Date →
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
