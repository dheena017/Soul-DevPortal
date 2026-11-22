import React, { useState, useMemo } from 'react';
import CopyButton from './CopyButton';
import StatsCards from './StatsCards';
import EmptyState from './EmptyState';
import { PackageData, ProjectData, StatsData } from '../types';

function packageIcon(pkg: PackageData): string {
  if (pkg.pythonModule) return 'PY';
  return pkg.name?.includes('config') ? 'CFG' : 'NPM';
}

function getInstallCommand(pkg: PackageData): string {
  if (pkg.hasNpmManifest && pkg.name) {
    return `npm install ${pkg.name}`;
  }
  if (pkg.hasPythonManifest) {
    return `pip install -e packages/${pkg.id}`;
  }
  return 'npm install';
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
        if (ecosystemFilter === 'npm') return pkg.hasNpmManifest;
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
    return (projects || []).slice(0, 4);
  }, [projects]);

  return (
    <>
      <section className="hero">
        <div className="hero-top">
          <span className="eyebrow">SOUL WORKSPACE MONOREPO</span>
          <span className="hero-badge">Architecture &amp; SDK Portal</span>
        </div>
        <h1>
          Package <em>documentation</em>
        </h1>
        <p>
          Live portal generated from package manifests, AST-extracted symbols, TypeScript types, Python modules, and repository scripts.
        </p>
      </section>

      <StatsCards stats={stats} packagesCount={packages.length} projectsCount={projects?.length || 8} />

      <section className="packages-section" aria-label="Shared packages explorer">
        <div className="section-header-row">
          <div>
            <span className="section-kicker">SHARED LIBRARIES</span>
            <h2>Monorepo Packages</h2>
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
              const npmExportsCount = (pkg.exports || []).length;
              const pyExportsCount = (pkg.pythonExports || []).length;
              const tsExportsCount = (pkg.typeScriptExports || []).length;
              const installCmd = getInstallCommand(pkg);

              return (
                <article className="package-card" key={pkg.id}>
                  <div className="card-top">
                    <div className="card-icon-group">
                      <span className={`package-icon ${pkg.id}`}>{packageIcon(pkg)}</span>
                      <div className="ecosystem-tags">
                        {pkg.hasNpmManifest && (
                          <span className="eco-tag npm-tag">
                            <span className="lang-dot typescript" style={{ width: '7px', height: '7px', marginRight: '4px' }} />
                            NPM
                          </span>
                        )}
                        {pkg.hasPythonManifest && (
                          <span className="eco-tag py-tag">
                            <span className="lang-dot python" style={{ width: '7px', height: '7px', marginRight: '4px' }} />
                            PY
                          </span>
                        )}
                        {tsExportsCount > 0 && (
                          <span className="eco-tag ts-tag">
                            <span className="lang-dot typescript" style={{ width: '7px', height: '7px', marginRight: '4px' }} />
                            TS
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="type-badge">v{pkg.version}</span>
                  </div>

                  <h2>{pkg.displayName || pkg.name}</h2>
                  {pkg.pythonName && <p className="python-name">{pkg.pythonName}</p>}
                  {pkg.description && <p className="card-description">{pkg.description}</p>}

                  <div className="card-meta">
                    {npmExportsCount > 0 && (
                      <span>
                        <b>{npmExportsCount}</b> npm export{npmExportsCount === 1 ? '' : 's'}
                      </span>
                    )}
                    {pyExportsCount > 0 && (
                      <span>
                        <b>{pyExportsCount}</b> Python export{pyExportsCount === 1 ? '' : 's'}
                      </span>
                    )}
                    {tsExportsCount > 0 && (
                      <span>
                        <b>{tsExportsCount}</b> TS symbol{tsExportsCount === 1 ? '' : 's'}
                      </span>
                    )}
                  </div>

                  <div className="card-quick-install">
                    <code>{installCmd}</code>
                    <CopyButton text={installCmd} variant="compact" label="Copy" title="Copy install command" />
                  </div>

                  <div className="card-actions">
                    <button type="button" className="card-link" onClick={() => onNavigate(pkg.id)}>
                      Open documentation <span>→</span>
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

      {/* Monorepo Consumer Applications Section */}
      {projects && projects.length > 0 && (
        <section className="consumer-apps-section" aria-label="Integrated monorepo applications">
          <div className="section-header-row">
            <div>
              <span className="section-kicker">CONSUMER APPS</span>
              <h2>Integrated Applications</h2>
              <p className="section-subtext">
                8 fullstack applications in this repository powered by these shared libraries.
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
                <div className="preview-project-card" key={p.id} onClick={() => onNavigate(`projects/${p.id}`)} style={{ cursor: 'pointer' }}>
                  <div className="preview-project-top">
                    <strong className="preview-project-title">{p.title}</strong>
                    <div className="preview-ports">
                      {p.frontendPort && <span className="preview-port">:{p.frontendPort}</span>}
                    </div>
                  </div>
                  <p className="preview-framework">
                    <span className={`lang-dot ${fwDotClass}`} style={{ width: '8px', height: '8px', marginRight: '6px' }} />
                    {p.framework}
                  </p>
                  {p.aiEngine && p.aiEngine !== 'N/A' && (
                    <span className="preview-ai">✨ {p.aiEngine}</span>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Pillar 3: Docs Dashboard Section */}
      <section className="consumer-apps-section docs-overview-section" aria-label="Docs Dashboard and architectural specifications">
        <div className="section-header-row">
          <div>
            <span className="section-kicker">PILLAR 3: SPECIFICATIONS</span>
            <h2>Docs Dashboard</h2>
            <p className="section-subtext">
              5 official architectural guides, strict port matrices, SQLite schemas, and shared library blueprints.
            </p>
          </div>
          <button type="button" className="view-all-projects-btn" onClick={() => onNavigate('docs')}>
            Open Docs Dashboard <span>→</span>
          </button>
        </div>

        <div className="docs-overview-grid">
          <div className="doc-overview-card featured" onClick={() => onNavigate('projects-rules')}>
            <div className="doc-ov-badge">★ PREMIER STANDARD</div>
            <h3>📜 Projects Rules &amp; Standards</h3>
            <p>Mandatory monorepo golden rules: strict port allocations (:5173-:5181 FE / :8000-:8008 BE), FastAPI /api/, SQLite, and metadata.json compliance.</p>
            <span className="doc-ov-link">Read Rules v1.0 →</span>
          </div>

          <div className="doc-overview-card" onClick={() => onNavigate('guide')}>
            <div className="doc-ov-badge">BLUEPRINT</div>
            <h3>📘 Packages Design Guide</h3>
            <p>Architectural guide for structuring, publishing, and consuming shared libraries across TypeScript and Python runtimes.</p>
            <span className="doc-ov-link">Read Design Guide →</span>
          </div>

          <div className="doc-overview-card" onClick={() => onNavigate('ports-guide')}>
            <div className="doc-ov-badge">TOPOLOGY</div>
            <h3>🌐 Port Architecture</h3>
            <p>Monorepo network topology, zero-port-conflict guidelines, and live socket prober runtime specifications.</p>
            <span className="doc-ov-link">Read Port Matrix →</span>
          </div>

          <div className="doc-overview-card" onClick={() => onNavigate('tech-stack')}>
            <div className="doc-ov-badge">ECOSYSTEM</div>
            <h3>⚙️ Tech Stack Standards</h3>
            <p>Certified dependencies matrix: React 19, Vite, Tailwind CSS v4 design tokens, and better-sqlite3 database layers.</p>
            <span className="doc-ov-link">Read Tech Stack →</span>
          </div>
        </div>
      </section>

      {/* Workspace Facts */}
      <section className="workspace-facts">
        <div>
          <span>Discovered packages</span>
          <strong>{packages.length}</strong>
        </div>
        <div>
          <span>Integrated applications</span>
          <strong>{projects?.length || 8}</strong>
        </div>
        <div>
          <span>npm workspaces</span>
          <strong>{(rootWorkspaces || []).length}</strong>
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
    </>
  );
}
