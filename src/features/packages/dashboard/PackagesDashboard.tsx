import React, { useState, useMemo, useRef, useEffect } from 'react';
import CopyButton from '../../../components/CopyButton';
import EmptyState from '../../../components/EmptyState';
import { PackageData } from '../../../types';
import { PACKAGE_METADATA_MAP } from '../packagesConstants';

export interface PackagesDashboardProps {
  packages?: PackageData[];
  onSelectPackage?: (id: string) => void;
  onClearSearch?: () => void;
}

export type PackagesViewProps = PackagesDashboardProps;

function getInstallCommand(pkg: PackageData): string {
  if (pkg.id === 'logger') return 'npm install @workspace/logger';
  if (pkg.id === 'runner') return 'npm install @workspace/runner';
  return 'npm install @workspace/config';
}

function getPythonInstallCommand(pkg: PackageData): string {
  if (pkg.id === 'logger') return 'pip install -e packages/logger';
  if (pkg.id === 'runner') return 'pip install -e packages/runner';
  return '';
}

export default function PackagesDashboard({ packages = [], onSelectPackage, onClearSearch }: PackagesDashboardProps) {
  const [query, setQuery] = useState<string>('');
  const [ecosystemFilter, setEcosystemFilter] = useState<'all' | 'npm' | 'python' | 'config'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'exports' | 'version'>('name');
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === '/' &&
        document.activeElement !== searchInputRef.current &&
        !['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName || '')
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === 'Escape' && document.activeElement === searchInputRef.current) {
        if (query) {
          setQuery('');
        } else {
          searchInputRef.current?.blur();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [query]);

  const filteredPackages = useMemo(() => {
    let list = [...packages];

    if (query.trim()) {
      const needle = query.trim().toLowerCase();
      list = list.filter((p) => {
        const meta = PACKAGE_METADATA_MAP[p.id];
        const tags = meta?.tags?.join(' ') || '';
        const role = meta?.role || '';
        return [
          p.name,
          p.displayName,
          p.id,
          p.description,
          p.pythonName,
          p.pythonModule,
          role,
          tags,
          ...(p.exports || []),
          ...(p.pythonExports || []),
          ...(p.typeScriptExports || []),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(needle);
      });
    }

    if (ecosystemFilter === 'npm') {
      list = list.filter((p) => p.hasNpmManifest && !p.name.includes('config'));
    } else if (ecosystemFilter === 'python') {
      list = list.filter((p) => p.hasPythonManifest);
    } else if (ecosystemFilter === 'config') {
      list = list.filter((p) => p.name.includes('config'));
    }

    if (sortBy === 'name') {
      list.sort((a, b) => (a.displayName || a.name).localeCompare(b.displayName || b.name));
    } else if (sortBy === 'exports') {
      list.sort(
        (a, b) =>
          ((b.exports?.length || 0) + (b.pythonExports?.length || 0)) -
          ((a.exports?.length || 0) + (a.pythonExports?.length || 0))
      );
    } else if (sortBy === 'version') {
      list.sort((a, b) => b.version.localeCompare(a.version));
    }

    return list;
  }, [packages, query, ecosystemFilter, sortBy]);

  return (
    <div className="packages-view-container">
      <header className="detail-header pillar-hero-header">
        <div className="breadcrumb-nav-row">
          <div className="breadcrumb">
            <span>Soul Workspace</span>
            <span className="crumb-sep">/</span>
            <strong className="crumb-active">Pillar 2: Packages Dashboard</strong>
          </div>

          <div className="header-status-pill">
            <span className="status-live-dot" aria-hidden="true" />
            <span>{packages.length} Shared Libraries Active</span>
          </div>
        </div>

        <div className="detail-title-row">
          <div className="package-title-copy">
            <div className="title-with-badge">
              <h1>Shared Packages Dashboard</h1>
              <span className="monorepo-tag-pill">Pillar 2</span>
            </div>
            <p className="detail-description">
              Production-grade shared libraries and tools consumed across all 8 workspace applications.
            </p>
          </div>
        </div>

        {/* Pillar 2 Key Metrics Banner */}
        <div className="docs-hub-metrics-banner">
          <div className="docs-metric-pill">
            <span className="docs-metric-val">{packages.length}</span>
            <span className="docs-metric-label">Shared Libraries</span>
          </div>
          <div className="docs-metric-pill">
            <span className="docs-metric-val">Dual</span>
            <span className="docs-metric-label">TS &amp; Python Runtime</span>
          </div>
          <div className="docs-metric-pill">
            <span className="docs-metric-val">59+</span>
            <span className="docs-metric-label">Exported APIs &amp; Symbols</span>
          </div>
          <div className="docs-metric-pill">
            <span className="docs-metric-val">100%</span>
            <span className="docs-metric-label">Monorepo Adoption</span>
          </div>
        </div>

        <div className="projects-toolbar" style={{ marginTop: '18px', paddingTop: '18px', borderTop: '1px solid #242424' }}>
          <div className="projects-search-input-wrap">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              ref={searchInputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search packages by API, symbol, module, or tags... (Press '/' to focus)"
              aria-label="Filter packages"
            />
            {query ? (
              <button type="button" className="search-clear-inline" onClick={() => setQuery('')} aria-label="Clear search">
                ✕
              </button>
            ) : (
              <kbd style={{ position: 'absolute', right: '12px', fontSize: '11px', color: '#6b7280', background: '#1c1c1c', border: '1px solid #333', borderRadius: '4px', padding: '1px 5px' }}>/</kbd>
            )}
          </div>

          <div className="packages-toolbar-row" style={{ margin: 0, gap: '12px', flexWrap: 'wrap' }}>
            <div className="framework-filter-pills filter-pills" role="tablist" aria-label="Filter packages by ecosystem">
              <button
                type="button"
                className={`framework-pill ${ecosystemFilter === 'all' ? 'active' : ''}`}
                onClick={() => setEcosystemFilter('all')}
              >
                <span className="fw-dot all-dot" aria-hidden="true" />
                <span className="pill-text">All</span>
                <span className="pill-count">{packages.length}</span>
              </button>
              <button
                type="button"
                className={`framework-pill ${ecosystemFilter === 'npm' ? 'active' : ''}`}
                onClick={() => setEcosystemFilter('npm')}
              >
                <span className="fw-dot react-dot" aria-hidden="true" />
                <span className="pill-text">TypeScript / Node</span>
              </button>
              <button
                type="button"
                className={`framework-pill ${ecosystemFilter === 'python' ? 'active' : ''}`}
                onClick={() => setEcosystemFilter('python')}
              >
                <span className="fw-dot next-dot" aria-hidden="true" />
                <span className="pill-text">Python Modules</span>
              </button>
              <button
                type="button"
                className={`framework-pill ${ecosystemFilter === 'config' ? 'active' : ''}`}
                onClick={() => setEcosystemFilter('config')}
              >
                <span className="fw-dot all-dot" aria-hidden="true" />
                <span className="pill-text">Config</span>
              </button>
            </div>

            <div className="sort-control">
              <label htmlFor="package-sort-select">Sort by:</label>
              <select
                id="package-sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
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

      <section className="packages-section" aria-label="Shared packages explorer">
        <div className="package-grid">
          {filteredPackages.map((pkg) => {
            const meta = PACKAGE_METADATA_MAP[pkg.id] || {
              icon: '📦',
              theme: 'blue',
              role: 'Workspace Shared Library',
              tags: ['Shared Library', 'TypeScript'],
              scope: 'Monorepo Core',
            };
            const installCmd = getInstallCommand(pkg);
            const pyInstallCmd = getPythonInstallCommand(pkg);
            const exportsCount = (pkg.exports || []).length + (pkg.pythonExports || []).length + (pkg.typeScriptExports || []).length;

            return (
              <article className={`package-card pkg-modern-card theme-${meta.theme}`} key={pkg.id}>
                {/* Header: Icon, ID, Version & Ecosystem Tags */}
                <div className="pkg-card-header">
                  <div className="pkg-card-brand">
                    <div className={`pkg-avatar-box ${meta.theme}`}>
                      <span className="pkg-avatar-icon" aria-hidden="true">{meta.icon}</span>
                    </div>
                    <div className="pkg-title-meta">
                      <span className="pkg-badge-version">v{pkg.version}</span>
                      <span className="pkg-path-chip">packages/{pkg.id}</span>
                    </div>
                  </div>

                  <div className="pkg-ecosystem-badges">
                    {pkg.hasNpmManifest && (
                      <span className="pkg-eco-pill npm-pill" title="NPM Package Available">
                        <span className="pill-dot red-dot" />
                        npm
                      </span>
                    )}
                    {pkg.hasPythonManifest && (
                      <span className="pkg-eco-pill py-pill" title="Python Module Available">
                        <span className="pill-dot blue-dot" />
                        python
                      </span>
                    )}
                  </div>
                </div>

                {/* Body: Clean Name, Role Subtitle, Description & Tag Chips */}
                <div className="pkg-card-body">
                  <h3 className="pkg-card-title">{pkg.displayName || pkg.name}</h3>
                  <div className="pkg-role-text">{meta.role}</div>
                  {pkg.description && <p className="pkg-card-desc">{pkg.description}</p>}

                  <div className="pkg-feature-tags">
                    {meta.tags.map((tag) => (
                      <span key={tag} className="pkg-feature-pill">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* 3-Column Metrics Tiles */}
                <div className="pkg-metrics-tiles">
                  <div className="pkg-metric-tile">
                    <span className="tile-label">TOTAL EXPORTS</span>
                    <strong className="tile-value text-accent">{exportsCount} APIs</strong>
                  </div>
                  <div className="pkg-metric-tile">
                    <span className="tile-label">LICENSE</span>
                    <strong className="tile-value">{pkg.license || 'MIT'}</strong>
                  </div>
                  <div className="pkg-metric-tile">
                    <span className="tile-label">PYTHON MODULE</span>
                    <strong className="tile-value text-code">
                      {pkg.pythonModule ? pkg.pythonModule : 'N/A (TS only)'}
                    </strong>
                  </div>
                </div>

                {/* Install Block with prompt symbol and quick copy */}
                <div className="pkg-install-container">
                  <div className="pkg-install-row">
                    <span className="terminal-prompt">$</span>
                    <code className="install-cmd-code">{installCmd}</code>
                    <CopyButton text={installCmd} variant="compact" label="Copy" />
                  </div>
                  {pyInstallCmd && (
                    <div className="pkg-install-row py-alt">
                      <span className="terminal-prompt">$</span>
                      <code className="install-cmd-code">{pyInstallCmd}</code>
                      <CopyButton text={pyInstallCmd} variant="compact" label="Copy" />
                    </div>
                  )}
                </div>

                {/* Primary CTA Button */}
                <div className="pkg-card-footer">
                  {onSelectPackage && (
                    <button
                      type="button"
                      className="pkg-inspect-btn"
                      onClick={() => onSelectPackage(pkg.id)}
                    >
                      <span>Inspect Package API</span>
                      <span className="arrow-icon" aria-hidden="true">→</span>
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>

        {filteredPackages.length === 0 && (
          <EmptyState
            title="No packages match your filter"
            description="Clear your filter criteria or search keyword to view all workspace packages."
            actionLabel="Reset Filters"
            onAction={() => {
              setEcosystemFilter('all');
              if (onClearSearch) onClearSearch();
            }}
          />
        )}
      </section>
    </div>
  );
}
