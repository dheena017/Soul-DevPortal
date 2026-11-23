import React, { useState, useMemo } from 'react';
import { consoleLogger } from '@workspace/logger';
import CopyButton from './CopyButton';
import StatsCards from './StatsCards';
import EmptyState from './EmptyState';
import { PackageData, ProjectData, StatsData } from '../types';
import { PACKAGE_METADATA_MAP } from '../features/packages/packagesConstants';
import { DOCUMENTATION_GUIDES_REGISTRY } from '../features/docs/docsConstants';
import { PROJECT_LOGOS, PROJECT_BRAND_MAP, formatProjectTitle } from '../features/projects/projectsConstants';

function getPackageInstallCommand(pkg: PackageData): string {
  if (pkg.id === 'logger') return 'npm install @workspace/logger';
  if (pkg.id === 'runner') return 'npm install @workspace/runner';
  return 'npm install @workspace/config';
}

function getPackagePythonInstallCommand(pkg: PackageData): string {
  if (pkg.id === 'logger') return 'pip install -e Soul-DevPortal-Packages/logger';
  if (pkg.id === 'runner') return 'pip install -e Soul-DevPortal-Packages/runner';
  if (pkg.id === 'config') return 'pip install -e Soul-DevPortal-Packages/config';
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
  const [activeTab, setActiveTab] = useState<'apps' | 'packages' | 'docs'>('apps');
  const [ecosystemFilter, setEcosystemFilter] = useState<'all' | 'npm' | 'python' | 'config'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'exports' | 'version'>('name');

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

  const previewProjects = useMemo(() => {
    return projects || [];
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
            <span>Live Ecosystem · 3 Pillars · {projects.length || 8} Apps · {packages.length || 3} Packages</span>
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
            <span className="docs-metric-val">3</span>
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
        </div>
      </section>

      {/* Codebase Telemetry Metrics Cards */}
      <StatsCards stats={stats} packagesCount={packages.length || 3} projectsCount={projects?.length || 8} />

      {/* Ecosystem Tabs Navigation */}
      <div className="overview-segmented-tabs" role="tablist" aria-label="Ecosystem overview sections">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'apps'}
          className={`overview-tab-pill ${activeTab === 'apps' ? 'active' : ''}`}
          onClick={() => setActiveTab('apps')}
        >
          <span className="overview-tab-icon" aria-hidden="true">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
              <line x1="8" y1="21" x2="16" y2="21" />
              <line x1="12" y1="17" x2="12" y2="21" />
            </svg>
          </span>
          <span className="overview-tab-text">Consumer Applications</span>
          <span className="overview-tab-badge">{projects.length || 8}</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'packages'}
          className={`overview-tab-pill ${activeTab === 'packages' ? 'active' : ''}`}
          onClick={() => setActiveTab('packages')}
        >
          <span className="overview-tab-icon" aria-hidden="true">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="16.5" y1="9.4" x2="7.55" y2="4.24" />
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
              <line x1="12" y1="22.08" x2="12" y2="12" />
            </svg>
          </span>
          <span className="overview-tab-text">Shared Packages</span>
          <span className="overview-tab-badge">{packages.length || 3}</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'docs'}
          className={`overview-tab-pill ${activeTab === 'docs' ? 'active' : ''}`}
          onClick={() => setActiveTab('docs')}
        >
          <span className="overview-tab-icon" aria-hidden="true">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
          </span>
          <span className="overview-tab-text">Architecture Specifications</span>
          <span className="overview-tab-badge">5</span>
        </button>
      </div>

      {/* Tab 1: Integrated Consumer Applications */}
      {activeTab === 'apps' && projects && projects.length > 0 && (
        <section className="consumer-apps-section" aria-label="Integrated monorepo applications">
          <div className="section-header-row">
            <div>
              <div className="section-kicker-badge">
                <span className="kicker-pulse-dot" aria-hidden="true" />
                <span>PILLAR 1: APPLICATIONS</span>
              </div>
              <h2>Integrated Consumer Applications</h2>
              <p className="section-subtext">
                {projects.length} fullstack applications in this repository powered by shared core libraries and strict port topology.
              </p>
            </div>
            <button type="button" className="view-all-projects-btn" onClick={() => onNavigate('projects')}>
              <span>View all {projects.length} apps &amp; ports</span>
              <span className="arrow-icon" aria-hidden="true">→</span>
            </button>
          </div>

          <div className="preview-projects-grid">
            {previewProjects.map((p) => {
              const brand = PROJECT_BRAND_MAP[p.id];
              const displayTitle = formatProjectTitle(p.id, p.title);
              const logoSrc = p.logo || PROJECT_LOGOS[p.id];
              const hasAi = Boolean(p.aiEngine && p.aiEngine !== 'N/A');
              const aiSummary = hasAi ? p.aiEngine!.split('+')[0].trim() : null;

              return (
                <div
                  className="preview-project-card enhanced-preview-card"
                  key={p.id}
                  onClick={() => onNavigate(`projects/${p.id}`)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter') onNavigate(`projects/${p.id}`); }}
                >
                  {/* Top: Logo, Brand Info, Ports */}
                  <div className="preview-project-top">
                    <div className="preview-brand-group">
                      <div
                        className="preview-app-logo"
                        style={{
                          borderColor: brand ? `${brand.themeColor}33` : undefined,
                          background: brand ? brand.accentBg : undefined,
                        }}
                      >
                        {logoSrc ? (
                          <img
                            src={logoSrc}
                            alt={`${displayTitle} logo`}
                            className="preview-logo-img"
                            onError={(e) => {
                              // If image fails, fallback to brand icon
                              (e.currentTarget as HTMLElement).style.display = 'none';
                              const parent = (e.currentTarget as HTMLElement).parentElement;
                              if (parent) {
                                const fallback = document.createElement('span');
                                fallback.className = 'preview-logo-fallback-icon';
                                fallback.textContent = brand?.icon || '⚡';
                                parent.appendChild(fallback);
                              }
                            }}
                          />
                        ) : (
                          <span className="preview-logo-fallback-icon">{brand?.icon || '⚡'}</span>
                        )}
                      </div>
                      <div className="preview-title-block">
                        <strong className="preview-project-title" title={p.title}>
                          {displayTitle}
                        </strong>
                        <div className="preview-id-row">
                          <code className="preview-app-id">{p.id}</code>
                          {brand?.tag && <span className="preview-brand-tag">{brand.tag}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="preview-ports">
                      {p.frontendPort && (
                        <span className="preview-port fe" title={`Frontend Port: http://localhost:${p.frontendPort}`}>
                          <span className="port-dot fe-dot" aria-hidden="true" />
                          <span className="port-role">FE</span>
                          <span className="port-num">:{p.frontendPort}</span>
                        </span>
                      )}
                      {p.backendPort && (
                        <span className="preview-port be" title={`Backend Server: http://localhost:${p.backendPort}`}>
                          <span className="port-dot be-dot" aria-hidden="true" />
                          <span className="port-role">BE</span>
                          <span className="port-num">:{p.backendPort}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Middle: Structured Specifications List */}
                  <div className="preview-specs-list">
                    <div className="preview-spec-item framework">
                      <span className="spec-indicator react" aria-hidden="true" />
                      <span className="spec-label-text">{p.framework || 'React 19 + Vite 8 + Tailwind v4'}</span>
                    </div>

                    <div className="preview-spec-item database">
                      <span className="spec-indicator db" aria-hidden="true" />
                      <span className="spec-label-text">{p.dbInfo || 'SQLite datastore'}</span>
                    </div>

                    {hasAi ? (
                      <div className="preview-spec-item ai">
                        <span className="spec-indicator ai" aria-hidden="true" />
                        <span className="spec-label-text ai-highlight">
                          <span className="ai-sparkle">✨</span> {aiSummary}
                        </span>
                      </div>
                    ) : (
                      <div className="preview-spec-item capability">
                        <span className="spec-indicator capability" aria-hidden="true" />
                        <span className="spec-label-text">{brand?.primaryCapability || 'Autonomous Service Engine'}</span>
                      </div>
                    )}
                  </div>

                  {/* Footer: Card CTA */}
                  <div className="preview-card-cta">
                    <span className="cta-text">Inspect Application</span>
                    <span className="cta-arrow-circle" aria-hidden="true">
                      <span className="arrow-icon">→</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Tab 2: Core Monorepo Packages */}
      {activeTab === 'packages' && (
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
                      onClick={() => onNavigate(`packages/${pkg.id}`)}
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
      )}

      {/* Tab 3: Documentation Hub Overview */}
      {activeTab === 'docs' && (
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
            const guideRoute = `docs/${guide.slug || guide.id}`;

            return (
              <div
                className={`doc-overview-card ${guide.id === 'rules' ? 'featured' : ''}`}
                key={guide.id}
                onClick={() => {
                  consoleLogger.action('OVERVIEW', `Clicked doc card: ${guide.title}`);
                  onNavigate(guideRoute);
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    consoleLogger.action('OVERVIEW', `Pressed enter on doc card: ${guide.title}`);
                    onNavigate(guideRoute);
                  }
                }}
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
      )}

      {/* Monorepo Command Runners Quick Banner */}
      <section className="overview-scripts-banner" aria-label="Monorepo command runners">
        <div className="scripts-banner-content">
          <div className="scripts-banner-icon-box" aria-hidden="true">
            <span className="scripts-banner-icon">⚡</span>
            <span className="scripts-banner-icon-glow" />
          </div>
          <div className="scripts-banner-text">
            <div className="scripts-banner-title-row">
              <h3 className="scripts-banner-title">15 Monorepo Automation Scripts &amp; Command Runners</h3>
              <span className="scripts-banner-pill">Python FastAPI · Vite · TS Gates</span>
            </div>
            <p className="scripts-banner-desc">
              Orchestrate all {projects.length || 8} fullstack applications concurrently, launch micro-app dev servers,
              run TypeScript validation gates, and supervise port lifecycles from the dedicated Command Runner.
            </p>
          </div>
        </div>
        <button
          type="button"
          className="scripts-banner-cta"
          onClick={() => onNavigate('scripts')}
        >
          <span>Open Scripts &amp; Runners Center</span>
          <span className="arrow-icon" aria-hidden="true">→</span>
        </button>
      </section>
    </article>
  );
}
