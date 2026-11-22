import React, { useState, useMemo } from 'react';
import CopyButton from './CopyButton';
import StatsCards from './StatsCards';
import EmptyState from './EmptyState';
import { PackageData, ProjectData, StatsData } from '../types';
import { PACKAGE_METADATA_MAP } from '../features/packages/packagesConstants';
import { DOCUMENTATION_GUIDES_REGISTRY } from '../features/docs/docsConstants';

function getPackageInstallCommand(pkg: PackageData): string {
  if (pkg.id === 'logger') return 'npm install @workspace/logger';
  if (pkg.id === 'runner') return 'npm install @workspace/runner';
  return 'npm install @workspace/config';
}

function getPackagePythonInstallCommand(pkg: PackageData): string {
  if (pkg.id === 'logger') return 'pip install -e packages/logger';
  if (pkg.id === 'runner') return 'pip install -e packages/runner';
  return '';
}

export interface OverviewProps {
  packages?: PackageData[];
  projects?: ProjectData[];
  rootWorkspaces?: string[];
  rootScripts?: Record<string, string>;
  stats?: StatsData;
  onNavigate: (id: string) => void;
  onClearSearch?: () => void;
}

export default function Overview({
  packages = [],
  projects = [],
  rootWorkspaces = [],
  rootScripts = {},
  stats,
  onNavigate,
  onClearSearch,
}: OverviewProps) {
  const [ecosystemFilter, setEcosystemFilter] = useState<'all' | 'npm' | 'python' | 'config'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'exports' | 'version'>('name');
  const [scriptSearch, setScriptSearch] = useState<string>('');

  const filteredPackages = useMemo(() => {
    return packages
      .filter((pkg) => {
        if (ecosystemFilter === 'npm') return pkg.hasNpmManifest && !pkg.name.includes('config');
        if (ecosystemFilter === 'python') return pkg.hasPythonManifest || pkg.pythonModule;
        if (ecosystemFilter === 'config') return pkg.name?.includes('config') || pkg.id?.includes('config');
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'name') return (a.displayName || a.name).localeCompare(b.displayName || b.name);
        if (sortBy === 'exports') {
          const aCount = (a.exports || []).length + (a.pythonExports || []).length;
          const bCount = (b.exports || []).length + (b.pythonExports || []).length;
          return bCount - aCount;
        }
        if (sortBy === 'version') return (b.version || '').localeCompare(a.version || '');
        return 0;
      });
  }, [packages, ecosystemFilter, sortBy]);

  const filteredScripts = useMemo(() => {
    if (!scriptSearch.trim()) return Object.entries(rootScripts || {});
    const needle = scriptSearch.toLowerCase();
    return Object.entries(rootScripts || {}).filter(
      ([name, cmd]) => name.toLowerCase().includes(needle) || cmd.toLowerCase().includes(needle)
    );
  }, [rootScripts, scriptSearch]);

  const previewProjects = useMemo(() => {
    return (projects || []).slice(0, 6);
  }, [projects]);

  return (
    <article className="workspace-overview-view">
      {/* Standardized Hero Header matching Pillar Dashboards */}
      <header className="detail-header pillar-hero-header">
        <div className="breadcrumb-nav-row">
          <div className="breadcrumb">
            <span>Soul Workspace</span>
            <span className="crumb-sep">/</span>
            <strong className="crumb-active">Overview Dashboard</strong>
          </div>

          <div className="header-status-pill">
            <span className="status-live-dot" aria-hidden="true" />
            <span>Live Ecosystem · 4 Pillars · {projects.length || 8} Apps · {packages.length || 3} Packages</span>
          </div>
        </div>

        <div className="detail-title-row">
          <div className="package-title-copy">
            <div className="title-with-badge">
              <h1>Soul Workspace Developer Portal</h1>
              <span className="monorepo-tag-pill">Enterprise Monorepo</span>
            </div>
            <p className="detail-description">
              Unified command center, runtime telemetry, live port topology, and SDK catalog for all applications and shared libraries in the monorepo.
            </p>
          </div>
        </div>

        {/* Dashboard Key Metrics Banner */}
        <div className="docs-hub-metrics-banner">
          <div className="docs-metric-pill">
            <span className="docs-metric-val">4</span>
            <span className="docs-metric-label">Core Pillars</span>
          </div>
          <div className="docs-metric-pill">
            <span className="docs-metric-val">{projects.length || 8}</span>
            <span className="docs-metric-label">Integrated Applications</span>
          </div>
          <div className="docs-metric-pill">
            <span className="docs-metric-val">{packages.length || 3}</span>
            <span className="docs-metric-label">Shared Core Packages</span>
          </div>
          <div className="docs-metric-pill">
            <span className="docs-metric-val">5</span>
            <span className="docs-metric-label">Architectural Specifications</span>
          </div>
          <div className="docs-metric-pill">
            <span className="docs-metric-val">0</span>
            <span className="docs-metric-label">Port Collisions</span>
          </div>
        </div>
      </header>

      {/* 4 Pillars Interactive Gateway Navigation */}
      <section className="gateway-pillars-section" aria-label="Monorepo 4 Pillars Navigation">
        <div className="gateway-pillars-grid">
          <div
            className="gateway-pillar-card p-blue"
            onClick={() => onNavigate('projects')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter') onNavigate('projects'); }}
          >
            <div className="gateway-card-top">
              <span className="gateway-icon-badge blue">💻</span>
              <span className="gateway-pillar-tag">Pillar 1</span>
            </div>
            <h3>Projects &amp; Applications</h3>
            <p>{projects.length || 8} fullstack applications, strict client &amp; server port allocations (:5173-:5180 / :8000-:8008), and SQLite datastores.</p>
            <div className="gateway-card-action">
              <span>Explore 8 Apps</span>
              <span className="arrow-icon">→</span>
            </div>
          </div>

          <div
            className="gateway-pillar-card p-emerald"
            onClick={() => onNavigate('packages')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter') onNavigate('packages'); }}
          >
            <div className="gateway-card-top">
              <span className="gateway-icon-badge emerald">📦</span>
              <span className="gateway-pillar-tag">Pillar 2</span>
            </div>
            <h3>Shared Packages</h3>
            <p>Core reusable libraries: @workspace/logger (universal logging), @workspace/runner (CLI supervisor), and @workspace/config (design tokens).</p>
            <div className="gateway-card-action">
              <span>Inspect {packages.length || 3} Packages</span>
              <span className="arrow-icon">→</span>
            </div>
          </div>

          <div
            className="gateway-pillar-card p-amber"
            onClick={() => onNavigate('docs')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter') onNavigate('docs'); }}
          >
            <div className="gateway-card-top">
              <span className="gateway-icon-badge amber">📚</span>
              <span className="gateway-pillar-tag">Pillar 3</span>
            </div>
            <h3>Docs &amp; Specifications</h3>
            <p>5 authoritative architecture guides: mandatory golden rules, port matrices, tech stack standards, and compliance cheatsheets.</p>
            <div className="gateway-card-action">
              <span>Read 5 Guides</span>
              <span className="arrow-icon">→</span>
            </div>
          </div>

          <div
            className="gateway-pillar-card p-violet"
            onClick={() => onNavigate('explore')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter') onNavigate('explore'); }}
          >
            <div className="gateway-card-top">
              <span className="gateway-icon-badge violet">🔍</span>
              <span className="gateway-pillar-tag">Pillar 4</span>
            </div>
            <h3>Explore &amp; Prober</h3>
            <p>Live socket port prober, cross-cutting AST exported symbols catalog, and interactive TypeScript &amp; Python code snippet generator.</p>
            <div className="gateway-card-action">
              <span>Open Introspection</span>
              <span className="arrow-icon">→</span>
            </div>
          </div>
        </div>
      </section>

      {/* Codebase Telemetry Metrics Cards */}
      <StatsCards stats={stats} packagesCount={packages.length || 3} projectsCount={projects?.length || 8} />

      {/* Pillar 2: Shared Libraries (Modern Cards) */}
      <section className="packages-section" aria-label="Shared packages explorer">
        <div className="section-header-row">
          <div>
            <span className="section-kicker">PILLAR 2: SHARED LIBRARIES</span>
            <h2>Core Monorepo Packages</h2>
            <p className="section-subtext">
              Production-ready shared packages consumed across both Node.js/TypeScript and Python runtimes.
            </p>
          </div>

          <div className="packages-filter-controls">
            <div className="filter-pills" role="tablist" aria-label="Filter packages by ecosystem">
              <button
                type="button"
                className={`filter-pill ${ecosystemFilter === 'all' ? 'active' : ''}`}
                onClick={() => setEcosystemFilter('all')}
              >
                All ({packages.length})
              </button>
              <button
                type="button"
                className={`filter-pill ${ecosystemFilter === 'npm' ? 'active' : ''}`}
                onClick={() => setEcosystemFilter('npm')}
              >
                TypeScript / Node
              </button>
              <button
                type="button"
                className={`filter-pill ${ecosystemFilter === 'python' ? 'active' : ''}`}
                onClick={() => setEcosystemFilter('python')}
              >
                Python Modules
              </button>
              <button
                type="button"
                className={`filter-pill ${ecosystemFilter === 'config' ? 'active' : ''}`}
                onClick={() => setEcosystemFilter('config')}
              >
                Config Presets
              </button>
            </div>

            <div className="sort-select-wrap">
              <label htmlFor="package-sort-select">Sort by:</label>
              <select
                id="package-sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="sort-select"
              >
                <option value="name">Name (A-Z)</option>
                <option value="exports">Most Exports</option>
                <option value="version">Version</option>
              </select>
            </div>
          </div>
        </div>

        {filteredPackages.length > 0 ? (
          <div className="package-grid" aria-label="Discovered packages">
            {filteredPackages.map((pkg) => {
              const meta = PACKAGE_METADATA_MAP[pkg.id] || {
                icon: '📦',
                theme: 'blue' as const,
                role: 'Workspace Shared Library',
                tags: ['Shared Library', 'TypeScript'],
                scope: 'Monorepo Core',
              };
              const installCmd = getPackageInstallCommand(pkg);
              const pyInstallCmd = getPackagePythonInstallCommand(pkg);
              const exportsCount = (pkg.exports || []).length + (pkg.pythonExports || []).length + (pkg.typeScriptExports || []).length;

              return (
                <article className={`package-card pkg-modern-card theme-${meta.theme}`} key={pkg.id}>
                  {/* Header: Brand Avatar & Ecosystem Badges */}
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

                  {/* Body: Title, Role, Description, Feature Chips */}
                  <div className="pkg-card-body">
                    <h3 className="pkg-card-title">{pkg.displayName || pkg.name}</h3>
                    <div className="pkg-role-text">{meta.role}</div>
                    {pkg.description && <p className="pkg-card-desc">{pkg.description}</p>}

                    <div className="pkg-feature-tags">
                      {meta.tags.slice(0, 3).map((tag) => (
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

                  {/* Install Block with quick copy */}
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

                  {/* Primary CTA */}
                  <div className="pkg-card-footer">
                    <button
                      type="button"
                      className="pkg-inspect-btn"
                      onClick={() => onNavigate(pkg.id)}
                    >
                      <span>Inspect Package API</span>
                      <span className="arrow-icon" aria-hidden="true">→</span>
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
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

      {/* Pillar 1: Integrated Consumer Applications */}
      {projects && projects.length > 0 && (
        <section className="consumer-apps-section" aria-label="Integrated monorepo applications">
          <div className="section-header-row">
            <div>
              <span className="section-kicker">PILLAR 1: APPLICATIONS</span>
              <h2>Integrated Consumer Applications</h2>
              <p className="section-subtext">
                8 fullstack applications in this repository powered by the shared core libraries.
              </p>
            </div>
            <button type="button" className="view-all-projects-btn" onClick={() => onNavigate('projects')}>
              View all 8 apps &amp; ports <span>→</span>
            </button>
          </div>

          <div className="preview-projects-grid">
            {previewProjects.map((p) => {
              const fwDotClass = p.framework?.includes('React 19')
                ? 'react'
                : p.framework?.includes('React 18')
                ? 'react'
                : p.framework?.includes('Next')
                ? 'nextjs'
                : 'typescript';

              return (
                <div
                  className="preview-project-card enhanced-preview-card"
                  key={p.id}
                  onClick={() => onNavigate(`project/${p.id}`)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter') onNavigate(`project/${p.id}`); }}
                >
                  <div className="preview-project-top">
                    <div className="preview-brand-group">
                      <div className="preview-app-logo">
                        {p.logo ? (
                          <img
                            src={p.logo}
                            alt=""
                            className="preview-logo-img"
                            onError={(e) => {
                              (e.currentTarget as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <span>⚡</span>
                        )}
                      </div>
                      <div>
                        <strong className="preview-project-title">{p.title}</strong>
                        <code className="preview-app-id">{p.id}</code>
                      </div>
                    </div>

                    <div className="preview-ports">
                      {p.frontendPort && <span className="preview-port fe" title="Frontend Port">:{p.frontendPort}</span>}
                      {p.backendPort && <span className="preview-port be" title="Backend Port">:{p.backendPort}</span>}
                    </div>
                  </div>

                  <p className="preview-framework">
                    <span className={`lang-dot ${fwDotClass}`} style={{ width: '8px', height: '8px', marginRight: '6px' }} />
                    {p.framework || 'React + Vite'}
                  </p>

                  <div className="preview-specs-row">
                    <span className="preview-spec-badge">🗄️ {p.dbInfo || 'SQLite'}</span>
                    {p.aiEngine && p.aiEngine !== 'N/A' && (
                      <span className="preview-spec-badge ai">✨ {p.aiEngine.split('+')[0].trim()}</span>
                    )}
                  </div>

                  <div className="preview-card-cta">
                    <span>Inspect Application</span>
                    <span className="arrow-icon">→</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Pillar 3: Documentation Hub Overview */}
      <section className="consumer-apps-section docs-overview-section" aria-label="Docs Dashboard and architectural specifications">
        <div className="section-header-row">
          <div>
            <span className="section-kicker">PILLAR 3: SPECIFICATIONS</span>
            <h2>Official Architecture Documentation</h2>
            <p className="section-subtext">
              5 authoritative architectural guides, strict port allocations, SQLite schemas, and shared library blueprints.
            </p>
          </div>
          <button type="button" className="view-all-projects-btn" onClick={() => onNavigate('docs')}>
            Open Docs Dashboard <span>→</span>
          </button>
        </div>

        <div className="docs-overview-grid">
          {DOCUMENTATION_GUIDES_REGISTRY.map((guide) => {
            const guideRoute = guide.id === 'rules'
              ? 'projects-rules'
              : guide.id === 'design'
              ? 'guide'
              : guide.id === 'ports'
              ? 'ports-guide'
              : guide.id === 'techstack'
              ? 'tech-stack'
              : 'cheatsheet';

            return (
              <div
                className={`doc-overview-card ${guide.id === 'rules' ? 'featured' : ''}`}
                key={guide.id}
                onClick={() => onNavigate(guideRoute)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter') onNavigate(guideRoute); }}
              >
                <div className="doc-ov-badge">{guide.badge}</div>
                <h3>{guide.icon} {guide.title}</h3>
                <p>{guide.description}</p>
                <span className="doc-ov-link">Read Specification →</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Workspace Facts */}
      <section className="workspace-facts">
        <div>
          <span>Discovered packages</span>
          <strong>{packages.length || 3}</strong>
        </div>
        <div>
          <span>Integrated applications</span>
          <strong>{projects?.length || 8}</strong>
        </div>
        <div>
          <span>npm workspaces</span>
          <strong>{(rootWorkspaces || []).length || 3}</strong>
        </div>
        <div>
          <span>Root npm scripts</span>
          <strong>{Object.keys(rootScripts || {}).length}</strong>
        </div>
      </section>

      {/* Root Scripts Runner */}
      <section className="workspace-scripts">
        <div className="scripts-header-row">
          <div>
            <span className="section-kicker">WORKSPACE COMMANDS</span>
            <h2>Root npm scripts</h2>
            <p className="section-subtext">Quick execution shortcuts for root-level build, test, and dev runners.</p>
          </div>
          <div className="scripts-search-wrap">
            <input
              type="text"
              value={scriptSearch}
              onChange={(e) => setScriptSearch(e.target.value)}
              placeholder="Search scripts..."
              aria-label="Search workspace scripts"
            />
          </div>
        </div>

        <div className="script-grid">
          {filteredScripts.map(([name, command]) => {
            const runCmd = `npm run ${name}`;
            return (
              <div className="script-row" key={name}>
                <div className="script-info">
                  <code>{name}</code>
                  <span className="script-cmd">{command}</span>
                </div>
                <CopyButton text={runCmd} label="Copy Run" copiedLabel="Copied" variant="compact" />
              </div>
            );
          })}
        </div>
      </section>
    </article>
  );
}
