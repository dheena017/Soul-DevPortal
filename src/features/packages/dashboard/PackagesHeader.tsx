import React from 'react';

export interface PackagesHeaderProps {
  packagesCount: number;
  query: string;
  onQueryChange: (query: string) => void;
  ecosystemFilter: 'all' | 'npm' | 'python' | 'config';
  onEcosystemFilterChange: (filter: 'all' | 'npm' | 'python' | 'config') => void;
  sortBy: 'name' | 'exports' | 'version';
  onSortByChange: (sort: 'name' | 'exports' | 'version') => void;
  searchInputRef: React.RefObject<HTMLInputElement | null>;
  onBack?: () => void;
}

export default function PackagesHeader({
  packagesCount,
  query,
  onQueryChange,
  ecosystemFilter,
  onEcosystemFilterChange,
  sortBy,
  onSortByChange,
  searchInputRef,
  onBack,
}: PackagesHeaderProps) {
  return (
    <header className="w-full bg-[#17171c] border border-[#282832] rounded-2xl p-5 md:p-6 shadow-2xl shadow-black/60 flex flex-col gap-5">
      {/* ── Breadcrumb & Live Status Row ── */}
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
          <strong className="inline-flex items-center px-2.5 py-1 rounded-full bg-[#17171c] border border-[#282832] text-neutral-200 font-semibold shadow-sm">Pillar 2: Packages Dashboard</strong>
        </div>

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#17171c] border border-[#282832] text-xs font-semibold text-neutral-300 select-none shadow-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-400" aria-hidden="true" />
          <span>{packagesCount} Shared Libraries Active</span>
        </div>
      </div>

      {/* ── Hero Title & Identity Row ── */}
      <div className="flex items-start sm:items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-[#17171c] border border-[#282832] flex items-center justify-center text-neutral-400 shrink-0 shadow-lg shadow-sm">
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
            <line x1="12" y1="22.08" x2="12" y2="12" />
          </svg>
        </div>
        <div className="flex flex-col gap-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl font-extrabold tracking-tight text-white">Shared Packages Dashboard</h1>
            <span className="px-2.5 py-0.5 rounded-md text-[11px] font-mono font-bold tracking-wider uppercase bg-[#17171c] border border-[#282832] text-neutral-300">
              Pillar 2: Shared Libraries
            </span>
          </div>
          <p className="text-xs text-neutral-400 leading-relaxed max-w-3xl">
            Production-grade shared libraries and tools consumed across all 9 workspace applications.
          </p>
        </div>
      </div>

      {/* ── 4-Metric Quick Stats Strip ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3" role="region" aria-label="Package metrics">
        <div className="flex flex-col p-3.5 rounded-xl bg-[#17171c] border border-[#282832] hover:border-neutral-500 transition-all">
          <div className="flex items-center gap-1.5 text-xs text-neutral-400">
            <svg className="w-3.5 h-3.5 text-neutral-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            </svg>
            <span>Shared Libraries</span>
          </div>
          <strong className="text-xl font-extrabold text-neutral-200 font-mono mt-1.5">{packagesCount} Active</strong>
        </div>

        <div className="flex flex-col p-3.5 rounded-xl bg-[#17171c] border border-[#282832] hover:border-neutral-500 transition-all">
          <div className="flex items-center gap-1.5 text-xs text-neutral-400">
            <svg className="w-3.5 h-3.5 text-neutral-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
            <span>Runtimes</span>
          </div>
          <strong className="text-xl font-extrabold text-neutral-200 font-mono mt-1.5">Dual (TS + Python)</strong>
        </div>

        <div className="flex flex-col p-3.5 rounded-xl bg-[#17171c] border border-[#282832] hover:border-neutral-500 transition-all">
          <div className="flex items-center gap-1.5 text-xs text-neutral-400">
            <svg className="w-3.5 h-3.5 text-neutral-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="16 18 22 12 16 6" />
              <polyline points="8 6 2 12 8 18" />
            </svg>
            <span>Exported APIs</span>
          </div>
          <strong className="text-xl font-extrabold text-neutral-200 font-mono mt-1.5">59+ Symbols</strong>
        </div>

        <div className="flex flex-col p-3.5 rounded-xl bg-[#17171c] border border-[#282832] hover:border-neutral-500 transition-all">
          <div className="flex items-center gap-1.5 text-xs text-neutral-400">
            <svg className="w-3.5 h-3.5 text-neutral-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <span>Monorepo Adoption</span>
          </div>
          <strong className="text-xl font-extrabold text-neutral-200 font-mono mt-1.5">100% Core</strong>
        </div>
      </div>

      {/* ── Search & Filter Toolbar ── */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-1">
        <div className="relative flex-1 min-w-[260px] flex items-center">
          <svg className="absolute left-3 w-4 h-4 text-neutral-500 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            ref={searchInputRef as any}
            type="text"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search packages by API, symbol, module, or tags... (Press '/' to focus)"
            aria-label="Filter packages"
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

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-[#0e0e11] border border-[#1f1f26] rounded-xl shadow-[inset_0_1px_3px_rgba(0,0,0,0.6)]" role="tablist" aria-label="Filter packages by ecosystem">
            <button
              type="button"
              role="tab"
              aria-selected={ecosystemFilter === 'all'}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all ${
                ecosystemFilter === 'all'
                  ? 'bg-[#17171c] text-neutral-200 font-bold border border-[#282832] shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-[#17171c] hover:border-[#282832] border border-transparent font-medium'
              }`}
              onClick={() => onEcosystemFilterChange('all')}
            >
              <span>All</span>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${ecosystemFilter === 'all' ? 'bg-[#17171c] text-neutral-300 border border-[#282832] font-bold' : 'bg-[#17171c] text-neutral-400 border border-[#282832]'}`}>
                {packagesCount}
              </span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={ecosystemFilter === 'npm'}
              className={`px-3 py-1.5 rounded-lg text-xs transition-all ${
                ecosystemFilter === 'npm'
                  ? 'bg-[#17171c] text-neutral-200 font-bold border border-[#282832] shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-[#17171c] hover:border-[#282832] border border-transparent font-medium'
              }`}
              onClick={() => onEcosystemFilterChange('npm')}
            >
              TypeScript / Node
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={ecosystemFilter === 'python'}
              className={`px-3 py-1.5 rounded-lg text-xs transition-all ${
                ecosystemFilter === 'python'
                  ? 'bg-[#17171c] text-neutral-200 font-bold border border-[#282832] shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-[#17171c] hover:border-[#282832] border border-transparent font-medium'
              }`}
              onClick={() => onEcosystemFilterChange('python')}
            >
              Python Modules
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={ecosystemFilter === 'config'}
              className={`px-3 py-1.5 rounded-lg text-xs transition-all ${
                ecosystemFilter === 'config'
                  ? 'bg-[#17171c] text-neutral-200 font-bold border border-[#282832] shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-[#17171c] hover:border-[#282832] border border-transparent font-medium'
              }`}
              onClick={() => onEcosystemFilterChange('config')}
            >
              Config
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs text-neutral-400">
            <label htmlFor="package-sort-select">Sort by:</label>
            <select
              id="package-sort-select"
              value={sortBy}
              onChange={(e) => onSortByChange(e.target.value as any)}
              className="h-9 px-3 rounded-xl bg-[#17171c] border border-[#282832] text-xs text-neutral-200 focus:outline-none focus:border-neutral-500 font-medium"
            >
              <option value="name">Name (A-Z)</option>
              <option value="exports">Total Exports</option>
              <option value="version">Version</option>
            </select>
          </div>
        </div>
      </div>
    </header>
  );
}
