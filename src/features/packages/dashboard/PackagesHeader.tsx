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
    <header className="detail-header pillar-hero-header packages-dashboard-header">
      {/* ── Breadcrumb & Live Status Row ── */}
      <div className="breadcrumb-nav-row">
        <div className="breadcrumb">
          {onBack ? (
            <button
              type="button"
              className="project-back-pill-btn"
              onClick={onBack}
              title="Back to Soul Workspace"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              <span>Back</span>
            </button>
          ) : (
            <a href="#overview" className="project-back-pill-btn" title="Back to Soul Workspace">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              <span>Back</span>
            </a>
          )}
          <span className="crumb-workspace">Soul Workspace</span>
          <span className="crumb-sep" aria-hidden="true">›</span>
          <strong className="crumb-active">Pillar 2: Packages Dashboard</strong>
        </div>

        <div className="header-status-pill">
          <span className="status-live-dot" aria-hidden="true" />
          <span>{packagesCount} Shared Libraries Active</span>
        </div>
      </div>

      {/* ── Hero Title & Identity Row ── */}
      <div className="packages-hero-title-row">
        <div className="package-hero-icon" aria-hidden="true">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
            <line x1="12" y1="22.08" x2="12" y2="12" />
          </svg>
        </div>
        <div className="project-hero-copy">
          <div className="title-with-badge">
            <h1 className="project-dashboard-h1">Shared Packages Dashboard</h1>
            <span className="monorepo-tag-pill">Pillar 2: Shared Libraries</span>
          </div>
          <p className="detail-description">
            Production-grade shared libraries and tools consumed across all 8 workspace applications.
          </p>
        </div>
      </div>

      {/* ── 4-Metric Quick Stats Strip ── */}
      <div className="packages-metrics-strip" role="region" aria-label="Package metrics">
        <div className="project-metric-card metric-total">
          <div className="metric-card-header">
            <span className="metric-icon">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              </svg>
            </span>
            <span className="metric-label">Shared Libraries</span>
          </div>
          <strong className="metric-val">{packagesCount} Active</strong>
        </div>

        <div className="project-metric-card metric-standalone">
          <div className="metric-card-header">
            <span className="metric-icon">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
            </span>
            <span className="metric-label">Runtimes</span>
          </div>
          <strong className="metric-val">Dual (TS + Python)</strong>
        </div>

        <div className="project-metric-card metric-fullstack">
          <div className="metric-card-header">
            <span className="metric-icon">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="16 18 22 12 16 6" />
                <polyline points="8 6 2 12 8 18" />
              </svg>
            </span>
            <span className="metric-label">Exported APIs</span>
          </div>
          <strong className="metric-val">59+ Symbols</strong>
        </div>

        <div className="project-metric-card metric-isolation">
          <div className="metric-card-header">
            <span className="metric-icon">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </span>
            <span className="metric-label">Monorepo Adoption</span>
          </div>
          <strong className="metric-val">100% Core</strong>
        </div>
      </div>

      {/* ── Search & Filter Toolbar ── */}
      <div className="packages-toolbar">
        <div className="projects-search-input-wrap">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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
          />
          {query ? (
            <button
              type="button"
              className="search-clear-inline"
              onClick={() => onQueryChange('')}
              aria-label="Clear search"
              title="Clear search"
            >
              ✕
            </button>
          ) : (
            <kbd className="search-kbd-hint">/</kbd>
          )}
        </div>

        <div className="packages-filter-group">
          <div className="framework-filter-pills filter-pills" role="tablist" aria-label="Filter packages by ecosystem">
            <button
              type="button"
              role="tab"
              aria-selected={ecosystemFilter === 'all'}
              className={`framework-pill ${ecosystemFilter === 'all' ? 'active' : ''}`}
              onClick={() => onEcosystemFilterChange('all')}
            >
              <span className="pill-text">All</span>
              <span className="pill-count">{packagesCount}</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={ecosystemFilter === 'npm'}
              className={`framework-pill ${ecosystemFilter === 'npm' ? 'active' : ''}`}
              onClick={() => onEcosystemFilterChange('npm')}
            >
              <span className="pill-text">TypeScript / Node</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={ecosystemFilter === 'python'}
              className={`framework-pill ${ecosystemFilter === 'python' ? 'active' : ''}`}
              onClick={() => onEcosystemFilterChange('python')}
            >
              <span className="pill-text">Python Modules</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={ecosystemFilter === 'config'}
              className={`framework-pill ${ecosystemFilter === 'config' ? 'active' : ''}`}
              onClick={() => onEcosystemFilterChange('config')}
            >
              <span className="pill-text">Config</span>
            </button>
          </div>

          <div className="sort-control">
            <label htmlFor="package-sort-select">Sort by:</label>
            <select
              id="package-sort-select"
              value={sortBy}
              onChange={(e) => onSortByChange(e.target.value as any)}
              className="package-sort-select"
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
