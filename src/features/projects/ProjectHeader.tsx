import React from 'react';
import { ProjectData } from '../../types';

export interface ProjectHeaderProps {
  totalCount: number;
  fullstackCount: number;
  standaloneCount: number;
  collisionsCount: number;
  sqliteIsolationPercent: string;
  query: string;
  onQueryChange: (q: string) => void;
  filterFramework: string;
  onFilterFrameworkChange: (fw: string) => void;
  frameworksList: string[];
  projects: ProjectData[];
  onBack?: () => void;
  searchInputRef: React.RefObject<HTMLInputElement | null>;
}

export default function ProjectHeader({
  totalCount,
  fullstackCount,
  standaloneCount,
  collisionsCount,
  sqliteIsolationPercent,
  query,
  onQueryChange,
  filterFramework,
  onFilterFrameworkChange,
  frameworksList,
  projects,
  onBack,
  searchInputRef,
}: ProjectHeaderProps) {
  return (
    <header className="w-full bg-[#17171c] border border-[#282832] rounded-2xl p-5 md:p-6 shadow-2xl shadow-black/60 flex flex-col gap-5">
      {/* Breadcrumb Navigation Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#1f1f26]">
        <div className="flex items-center gap-2 text-xs">
          {onBack ? (
            <button
              type="button"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#17171c] border border-[#282832] text-neutral-300 hover:text-neutral-200 hover:border-neutral-500 hover:bg-[#17171c] transition-all font-semibold shadow-sm"
              onClick={onBack}
              title="Back to Soul Workspace"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              <span>Back</span>
            </button>
          ) : (
            <a
              href="#overview"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#17171c] border border-[#282832] text-neutral-300 hover:text-neutral-200 hover:border-neutral-500 hover:bg-[#17171c] transition-all font-semibold shadow-sm"
              title="Back to Soul Workspace"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              <span>Back</span>
            </a>
          )}
          <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-[#17171c] border border-[#282832] text-neutral-400 font-medium">Soul Workspace</span>
          <span className="text-neutral-600 font-bold px-0.5" aria-hidden="true">›</span>
          <strong className="inline-flex items-center px-2.5 py-1 rounded-full bg-[#17171c] border border-[#282832] text-neutral-200 font-semibold shadow-sm">Pillar 1: Projects</strong>
        </div>

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#17171c] border border-[#282832] text-xs font-semibold text-neutral-300 select-none shadow-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-400" aria-hidden="true" />
          <span>{totalCount} Applications Active</span>
        </div>
      </div>

      {/* Hero Title & Identity Row */}
      <div className="flex items-start sm:items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-[var(--site-primary)] border border-[#282832] flex items-center justify-center text-neutral-400 shrink-0 shadow-lg shadow-sm">
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
            <line x1="8" y1="21" x2="16" y2="21" />
            <line x1="12" y1="17" x2="12" y2="21" />
          </svg>
        </div>
        <div className="flex flex-col gap-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl font-extrabold tracking-tight text-white">Projects &amp; Applications Dashboard</h1>
            <span className="px-2.5 py-0.5 rounded-md text-[11px] font-mono font-bold tracking-wider uppercase bg-[#17171c] border border-[#282832] text-neutral-300">
              Pillar 1: Monorepo Apps
            </span>
          </div>
          <p className="text-xs text-neutral-400 leading-relaxed max-w-3xl">
            Catalog of all {totalCount} applications consuming the shared packages, their assigned development ports, backend servers, databases, and AI engines.
          </p>
        </div>
      </div>

      {/* 5-Metric Quick Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3" role="region" aria-label="Project metrics">
        <div className="flex flex-col p-3 rounded-xl bg-[#17171c] border border-[#282832] hover:border-neutral-500 transition-all">
          <div className="flex items-center gap-1.5 text-xs text-neutral-400">
            <svg className="w-3.5 h-3.5 text-neutral-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>
            <span>Total Apps</span>
          </div>
          <strong className="text-xl font-extrabold text-neutral-200 font-mono mt-1.5">{totalCount} Active</strong>
        </div>

        <div className="flex flex-col p-3 rounded-xl bg-[#17171c] border border-[#282832] hover:border-neutral-500 transition-all">
          <div className="flex items-center gap-1.5 text-xs text-neutral-400">
            <svg className="w-3.5 h-3.5 text-neutral-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
              <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
              <line x1="6" y1="6" x2="6.01" y2="6" />
              <line x1="6" y1="18" x2="6.01" y2="18" />
            </svg>
            <span>Client-Server</span>
          </div>
          <strong className="text-xl font-extrabold text-neutral-200 font-mono mt-1.5">{fullstackCount} Fullstack</strong>
        </div>

        <div className="flex flex-col p-3 rounded-xl bg-[#17171c] border border-[#282832] hover:border-neutral-500 transition-all">
          <div className="flex items-center gap-1.5 text-xs text-neutral-400">
            <svg className="w-3.5 h-3.5 text-neutral-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
            <span>Standalone Web</span>
          </div>
          <strong className="text-xl font-extrabold text-neutral-200 font-mono mt-1.5">{standaloneCount} Apps</strong>
        </div>

        <div className="flex flex-col p-3 rounded-xl bg-[#17171c] border border-[#282832] hover:border-neutral-500 transition-all">
          <div className="flex items-center gap-1.5 text-xs text-neutral-400">
            <svg className="w-3.5 h-3.5 text-neutral-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <span>Port Conflicts</span>
          </div>
          <strong className="text-xl font-extrabold text-neutral-200 font-mono mt-1.5">{collisionsCount} Conflicts</strong>
        </div>

        <div className="flex flex-col p-3 rounded-xl bg-[#17171c] border border-[#282832] hover:border-neutral-500 transition-all">
          <div className="flex items-center gap-1.5 text-xs text-neutral-400">
            <svg className="w-3.5 h-3.5 text-neutral-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <ellipse cx="12" cy="5" rx="9" ry="3" />
              <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
              <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
            </svg>
            <span>SQLite Isolation</span>
          </div>
          <strong className="text-xl font-extrabold text-neutral-200 font-mono mt-1.5">{sqliteIsolationPercent}</strong>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-1">
        <div className="relative flex-1 min-w-[260px] flex items-center">
          <svg className="absolute left-3 w-4 h-4 text-neutral-500 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            ref={searchInputRef}
            type="text"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder={`Search ${totalCount} applications by name, port, framework, AI engine... (Press '/' to focus)`}
            aria-label="Filter applications"
            className="w-full h-10 pl-9 pr-9 rounded-xl bg-[#17171c] border border-[#282832] text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500/30 transition-all font-mono"
          />
          {query ? (
            <button
              type="button"
              className="absolute right-3 text-xs text-neutral-400 hover:text-neutral-200 p-1"
              onClick={() => onQueryChange('')}
              aria-label="Clear search"
              title="Clear search"
            >
              ✕
            </button>
          ) : (
            <kbd className="absolute right-3 px-1.5 py-0.5 rounded bg-[#17171c] border border-[#282832] text-[10px] text-neutral-500 font-mono">
              /
            </kbd>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-[#0e0e11] border border-[#1f1f26] rounded-xl shadow-[inset_0_1px_3px_rgba(0,0,0,0.6)]" role="tablist" aria-label="Filter by framework">
          {frameworksList.map((fw) => {
            const count = fw === 'all'
              ? totalCount
              : projects.filter((p) => p.framework?.includes(fw)).length;
            const isActive = filterFramework === fw;
            return (
              <button
                type="button"
                key={fw}
                role="tab"
                aria-selected={isActive}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all ${
                  isActive
                    ? 'bg-[#17171c] text-neutral-200 font-bold border border-[#282832] shadow-sm'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-[#17171c] hover:border-[#282832] border border-transparent font-medium'
                }`}
                onClick={() => onFilterFrameworkChange(fw)}
              >
                <span>{fw === 'all' ? 'All Frameworks' : fw}</span>
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${isActive ? 'bg-[#17171c] text-neutral-300 border border-[#282832] font-bold' : 'bg-[#17171c] text-neutral-400 border border-[#282832]'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
);
}
