import React, { useState, useMemo } from 'react';
import { PackageData, ProjectData } from '../types';
import { DOCUMENTATION_GUIDES_REGISTRY, GuideMeta } from '../features/docs/docsConstants';

function packageBadge(pkg: PackageData): string {
  if (pkg.pythonModule) return 'PY';
  return pkg.name?.includes('config') ? 'CFG' : 'TS';
}

function packageSidebarIcon(pkg: PackageData): string {
  if (pkg.id === 'logger') return '🪵';
  if (pkg.id === 'runner') return '⚡';
  if (pkg.id === 'config') return '⚙️';
  return '📦';
}

function docGuideBadge(guide: GuideMeta): string {
  if (guide.category === 'rules') return 'SPEC';
  if (guide.category === 'cheatsheet') return 'RULES';
  if (guide.category === 'design') return 'DESIGN';
  if (guide.category === 'ports') return 'ARCH';
  if (guide.category === 'techstack') return 'STACK';
  return guide.badge?.split(' ')[0] || 'DOC';
}

function formatDocGuideTitle(guide: GuideMeta): string {
  if (guide.id === 'rules') return 'Projects Rules';
  if (guide.id === 'cheatsheet') return 'Core Cheatsheet';
  if (guide.id === 'design') return 'Packages Design';
  if (guide.id === 'ports') return 'Port Architecture';
  if (guide.id === 'techstack') return 'Tech Stack Guide';
  return guide.title;
}

function docGuideRoute(guide: GuideMeta): string {
  if (guide.id === 'rules') return 'projects-rules';
  if (guide.id === 'design') return 'guide';
  if (guide.id === 'ports') return 'ports-guide';
  if (guide.id === 'techstack') return 'tech-stack';
  if (guide.id === 'cheatsheet') return 'cheatsheet';
  return `doc/${guide.id}`;
}

function isDocGuideActive(active: string, guide: GuideMeta): boolean {
  if (active === guide.id || active === `doc/${guide.id}`) return true;
  if (guide.id === 'rules' && (active === 'projects-rules' || active === 'rules' || active === 'doc/rules')) return true;
  if (guide.id === 'design' && (active === 'guide' || active === 'design' || active === 'doc/design')) return true;
  if (guide.id === 'ports' && (active === 'ports-guide' || active === 'ports' || active === 'doc/ports')) return true;
  if (guide.id === 'techstack' && (active === 'tech-stack' || active === 'techstack' || active === 'doc/techstack')) return true;
  if (guide.id === 'cheatsheet' && (active === 'cheatsheet' || active === 'doc/cheatsheet')) return true;
  return false;
}

export interface SidebarProps {
  active?: string;
  packages?: PackageData[];
  projects?: ProjectData[];
  projectsCount?: number;
  menuOpen?: boolean;
  onNavigate: (id: string) => void;
  onClose: () => void;
}

export default function Sidebar({
  active = 'overview',
  packages = [],
  projects = [],
  projectsCount = 8,
  menuOpen = false,
  onNavigate,
  onClose,
}: SidebarProps) {
  const [pkgFilter, setPkgFilter] = useState<string>('');
  const [projectFilter, setProjectFilter] = useState<string>('');
  const [docFilter, setDocFilter] = useState<string>('');

  const isActive = (id: string) => active === id;

  const totalProjects = projects.length || projectsCount;

  // Dynamically filter packages
  const filteredPackages = useMemo(() => {
    if (!pkgFilter.trim()) return packages;
    const needle = pkgFilter.toLowerCase();
    return packages.filter(
      (p) => (p.displayName || p.name).toLowerCase().includes(needle) || (p.description || '').toLowerCase().includes(needle)
    );
  }, [packages, pkgFilter]);

  // Dynamically filter projects
  const filteredProjects = useMemo(() => {
    if (!projectFilter.trim()) return projects;
    const needle = projectFilter.toLowerCase();
    return projects.filter(
      (p) => p.title.toLowerCase().includes(needle) || p.id.toLowerCase().includes(needle) || (p.framework || '').toLowerCase().includes(needle)
    );
  }, [projects, projectFilter]);

  // Dynamically filter documentation guides
  const filteredGuides = useMemo(() => {
    if (!docFilter.trim()) return DOCUMENTATION_GUIDES_REGISTRY;
    const needle = docFilter.toLowerCase();
    return DOCUMENTATION_GUIDES_REGISTRY.filter(
      (g) => g.title.toLowerCase().includes(needle) || g.description.toLowerCase().includes(needle) || g.id.toLowerCase().includes(needle)
    );
  }, [docFilter]);

  return (
    <>
      <aside className={menuOpen ? 'sidebar open' : 'sidebar'} aria-label="Monorepo navigation sidebar">
        <div className="sidebar-brand">
          <a
            className="brand"
            href="#overview"
            onClick={(e) => {
              e.preventDefault();
              onNavigate('overview');
            }}
            aria-label="Soul Workspace packages overview"
          >
            <span className="brand-mark" aria-hidden="true">
              <span>S</span>
            </span>
            <span className="brand-copy">
              <b>Soul Workspace</b>
              <small>DEVELOPER PORTAL</small>
            </span>
          </a>

          <button
            type="button"
            className="sidebar-close"
            aria-label="Close sidebar (Esc or Ctrl+B)"
            title="Close sidebar (Esc or Ctrl+B)"
            onClick={onClose}
          >
            <svg viewBox="0 0 20 20" width="16" height="16" fill="currentColor" aria-hidden="true">
              <path d="m6 6 8 8M14 6l-8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <nav className="side-nav" aria-label="4 Pillars navigation">
          {/* Overview Quick Nav */}
          <div className="nav-section overview-nav-section">
            <button
              type="button"
              aria-current={isActive('overview') ? 'page' : undefined}
              className={isActive('overview') ? 'nav-item active' : 'nav-item'}
              onClick={() => onNavigate('overview')}
            >
              <span className="nav-icon overview-icon" aria-hidden="true">🏠</span>
              <span className="nav-text">Workspace Overview</span>
              <span className="nav-badge-count">Hub</span>
            </button>
          </div>

          {/* Pillar 1: Projects */}
          <div className="nav-section">
            <div className="nav-label-row">
              <span className="nav-label">Pillar 1: Projects</span>
              <span className="nav-count-badge">{totalProjects}</span>
            </div>

            <button
              type="button"
              aria-current={isActive('projects') ? 'page' : undefined}
              className={isActive('projects') ? 'nav-item active' : 'nav-item'}
              onClick={() => onNavigate('projects')}
            >
              <span className="nav-icon projects-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                  <line x1="8" y1="21" x2="16" y2="21" />
                  <line x1="12" y1="17" x2="12" y2="21" />
                </svg>
              </span>
              <span className="nav-text">Projects &amp; Apps</span>
              <span className="nav-badge-count">{totalProjects}</span>
            </button>

            {projects.length > 5 && (
              <div className="sidebar-filter-wrap">
                <input
                  type="text"
                  value={projectFilter}
                  onChange={(e) => setProjectFilter(e.target.value)}
                  placeholder="Filter apps..."
                  aria-label="Filter applications"
                />
              </div>
            )}

            {filteredProjects.length > 0 && (
              <div className="package-nav-list sidebar-scroll-sublist">
                {filteredProjects.map((proj) => {
                  const isProjActive = isActive(`project/${proj.id}`);
                  return (
                    <button
                      type="button"
                      key={proj.id}
                      aria-current={isProjActive ? 'page' : undefined}
                      className={isProjActive ? 'nav-item active' : 'nav-item'}
                      onClick={() => onNavigate(`project/${proj.id}`)}
                      title={proj.title}
                    >
                      <span className="nav-project-avatar" aria-hidden="true">
                        {proj.logo ? (
                          <img
                            src={proj.logo}
                            alt=""
                            className="nav-project-logo"
                            onError={(e) => {
                              (e.currentTarget as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          '⚡'
                        )}
                      </span>
                      <span className="nav-text">{proj.title}</span>
                      {proj.frontendPort && (
                        <span className="sidebar-badge port">:{proj.frontendPort}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Pillar 2: Packages */}
          <div className="nav-section">
            <div className="nav-label-row">
              <span className="nav-label">Pillar 2: Packages</span>
              <span className="nav-count-badge">{packages.length}</span>
            </div>

            <button
              type="button"
              aria-current={(isActive('packages') || isActive('packages-dashboard')) ? 'page' : undefined}
              className={(isActive('packages') || isActive('packages-dashboard')) ? 'nav-item active' : 'nav-item'}
              onClick={() => onNavigate('packages')}
            >
              <span className="nav-icon overview-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                  <line x1="12" y1="22.08" x2="12" y2="12" />
                </svg>
              </span>
              <span className="nav-text">Packages Dashboard</span>
              <span className="nav-badge-count">{packages.length}</span>
            </button>

            {packages.length > 3 && (
              <div className="sidebar-filter-wrap">
                <input
                  type="text"
                  value={pkgFilter}
                  onChange={(e) => setPkgFilter(e.target.value)}
                  placeholder="Filter packages..."
                  aria-label="Filter packages"
                />
              </div>
            )}

            <div className="package-nav-list sidebar-scroll-sublist">
              {filteredPackages.map((pkg) => {
                const badge = packageBadge(pkg);
                const icon = packageSidebarIcon(pkg);

                return (
                  <button
                    type="button"
                    key={pkg.id}
                    aria-current={isActive(pkg.id) ? 'page' : undefined}
                    className={isActive(pkg.id) ? 'nav-item active' : 'nav-item'}
                    onClick={() => onNavigate(pkg.id)}
                    title={pkg.displayName || pkg.name}
                  >
                    <span className={`nav-pkg-avatar ${pkg.id}`} aria-hidden="true">
                      {icon}
                    </span>
                    <span className="nav-text">{pkg.displayName || pkg.name}</span>
                    <span className={`sidebar-badge ${badge.toLowerCase()}`}>{badge}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Pillar 3: Documentation */}
          <div className="nav-section workspace-nav-section">
            <div className="nav-label-row">
              <span className="nav-label">Pillar 3: Documentation</span>
              <span className="nav-count-badge">{DOCUMENTATION_GUIDES_REGISTRY.length}</span>
            </div>

            <button
              type="button"
              aria-current={(isActive('docs') || isActive('docs-dashboard')) ? 'page' : undefined}
              className={(isActive('docs') || isActive('docs-dashboard')) ? 'nav-item active' : 'nav-item'}
              onClick={() => onNavigate('docs')}
            >
              <span className="nav-icon docs-icon" aria-hidden="true">📚</span>
              <span className="nav-text">Docs Dashboard</span>
              <span className="nav-badge-count">{DOCUMENTATION_GUIDES_REGISTRY.length}</span>
            </button>

            {DOCUMENTATION_GUIDES_REGISTRY.length > 5 && (
              <div className="sidebar-filter-wrap">
                <input
                  type="text"
                  value={docFilter}
                  onChange={(e) => setDocFilter(e.target.value)}
                  placeholder="Filter guides..."
                  aria-label="Filter documentation guides"
                />
              </div>
            )}

            <div className="package-nav-list sidebar-scroll-sublist">
              {filteredGuides.map((guide) => {
                const isGuideActive = isDocGuideActive(active, guide);
                const targetRoute = docGuideRoute(guide);
                const badge = docGuideBadge(guide);

                return (
                  <button
                    type="button"
                    key={guide.id}
                    aria-current={isGuideActive ? 'page' : undefined}
                    className={isGuideActive ? 'nav-item active' : 'nav-item'}
                    onClick={() => onNavigate(targetRoute)}
                    title={guide.title}
                  >
                    <span className="nav-icon guide-icon" aria-hidden="true">
                      {guide.icon}
                    </span>
                    <span className="nav-text">{formatDocGuideTitle(guide)}</span>
                    <span className={`sidebar-badge ${badge.toLowerCase()}`}>{badge}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Pillar 4: Explore */}
          <div className="nav-section">
            <div className="nav-label-row">
              <span className="nav-label">Pillar 4: Explorer</span>
            </div>

            <button
              type="button"
              aria-current={isActive('explore') ? 'page' : undefined}
              className={isActive('explore') ? 'nav-item active' : 'nav-item'}
              onClick={() => onNavigate('explore')}
            >
              <span className="nav-icon overview-icon" aria-hidden="true">🔍</span>
              <span className="nav-text">Explore &amp; Prober</span>
            </button>

            <button
              type="button"
              aria-current={isActive('overview') ? 'page' : undefined}
              className={isActive('overview') ? 'nav-item active' : 'nav-item'}
              onClick={() => onNavigate('overview')}
            >
              <span className="nav-icon overview-icon" aria-hidden="true">🗂️</span>
              <span className="nav-text">Overview Dashboard</span>
            </button>
          </div>
        </nav>

        <div className="sidebar-footer">
          <div className="footer-status-group">
            <span className="status-dot" aria-hidden="true" />
            <div>
              <strong>4 Pillars Synced</strong>
              <small>{packages.length} packages · {totalProjects} apps indexed</small>
            </div>
          </div>
          <span className="footer-check" aria-label="Ready">✓</span>
        </div>
      </aside>

      {menuOpen && (
        <button
          type="button"
          className="overlay"
          aria-label="Close menu"
          onClick={onClose}
        />
      )}
    </>
  );
}
