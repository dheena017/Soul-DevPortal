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
  return `docs/${guide.slug || guide.id}`;
}

function isDocGuideActive(active: string, guide: GuideMeta): boolean {
  const slug = guide.slug || guide.id;
  if (
    active === `docs/${slug}` ||
    active === `docs/${guide.id}` ||
    active === `doc/${slug}` ||
    active === `doc/${guide.id}` ||
    active === slug ||
    active === guide.id
  ) {
    return true;
  }
  if (guide.id === 'rules' && (active === 'projects-rules' || active === 'rules')) return true;
  if (guide.id === 'design' && (active === 'packages-design' || active === 'guide' || active === 'design')) return true;
  if (guide.id === 'ports' && (active === 'port-architecture' || active === 'ports-guide' || active === 'ports')) return true;
  if (guide.id === 'techstack' && (active === 'tech-stack' || active === 'techstack')) return true;
  if (guide.id === 'cheatsheet' && (active === 'compliance-cheatsheet' || active === 'cheatsheet')) return true;
  return false;
}

function formatCount(num: number): string {
  if (num >= 10000) return `${Math.floor(num / 1000)}k+`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
  return String(num);
}

export interface SidebarProps {
  active?: string;
  packages?: PackageData[];
  projects?: ProjectData[];
  projectsCount?: number;
  menuOpen?: boolean;
  isPinned?: boolean;
  onTogglePin?: () => void;
  onNavigate: (id: string) => void;
  onClose: () => void;
}

export default function Sidebar({
  active = 'overview',
  packages = [],
  projects = [],
  projectsCount = 8,
  menuOpen = false,
  isPinned = false,
  onTogglePin,
  onNavigate,
  onClose,
}: SidebarProps) {
  const [pkgFilter, setPkgFilter] = useState<string>('');
  const [projectFilter, setProjectFilter] = useState<string>('');
  const [docFilter, setDocFilter] = useState<string>('');
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
    projects: false,
    packages: false,
    docs: false,
  });

  const toggleSection = (section: string) => {
    setCollapsedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

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
      <aside
        className={`sidebar ${(menuOpen || isPinned) ? 'open' : ''} ${isPinned ? 'pinned' : ''}`}
        aria-label="Monorepo navigation sidebar"
      >
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

          <div className="sidebar-brand-actions">
            {onTogglePin && (
              <button
                type="button"
                className={`sidebar-pin-btn ${isPinned ? 'pinned' : ''}`}
                onClick={onTogglePin}
                title={isPinned ? 'Unpin sidebar (floating drawer mode)' : 'Pin sidebar (dock to desktop)'}
                aria-label={isPinned ? 'Unpin sidebar' : 'Pin sidebar'}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill={isPinned ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 17v5M5 12V7a5 5 0 0 1 10 0v5l2 3H3l2-3Z" />
                </svg>
              </button>
            )}

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

          <div className="nav-section-divider">
            <span className="nav-section-label">4 Monorepo Pillars</span>
          </div>

          {/* Pillar 1: Projects */}
          <div className="nav-section">
            <div className="pillar-header-row">
              <button
                type="button"
                aria-current={isActive('projects') ? 'page' : undefined}
                className={isActive('projects') ? 'nav-item pillar-parent-item active' : 'nav-item pillar-parent-item'}
                onClick={() => {
                  onNavigate('projects');
                  if (collapsedSections.projects) {
                    toggleSection('projects');
                  }
                }}
                title="Open Projects & Apps Dashboard"
              >
                <span className="nav-icon projects-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                    <line x1="8" y1="21" x2="16" y2="21" />
                    <line x1="12" y1="17" x2="12" y2="21" />
                  </svg>
                </span>
                <span className="nav-text">Projects &amp; Apps</span>
                <span className="nav-badge-count">{formatCount(totalProjects)}</span>
              </button>

              <button
                type="button"
                className="pillar-chevron-toggle"
                onClick={() => toggleSection('projects')}
                aria-expanded={!collapsedSections.projects}
                title={collapsedSections.projects ? 'Expand applications list' : 'Collapse applications list'}
                aria-label={collapsedSections.projects ? 'Expand applications list' : 'Collapse applications list'}
              >
                <span className={`nav-chevron ${collapsedSections.projects ? 'collapsed' : ''}`} aria-hidden="true">▼</span>
              </button>
            </div>

            {!collapsedSections.projects && (
              <>
                <div className="sidebar-filter-wrap">
                  <input
                    type="text"
                    value={projectFilter}
                    onChange={(e) => setProjectFilter(e.target.value)}
                    placeholder={`Filter ${totalProjects} apps...`}
                    aria-label="Filter applications"
                  />
                </div>

                {filteredProjects.length > 0 && (
                  <div className="package-nav-list sidebar-scroll-sublist">
                    {filteredProjects.slice(0, 50).map((proj) => {
                      const isProjActive = isActive(`projects/${proj.id}`) || isActive(`project/${proj.id}`);
                      return (
                        <button
                          type="button"
                          key={proj.id}
                          aria-current={isProjActive ? 'page' : undefined}
                          className={isProjActive ? 'nav-item active' : 'nav-item'}
                          onClick={() => onNavigate(`projects/${proj.id}`)}
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

                    {filteredProjects.length > 50 && (
                      <button
                        type="button"
                        className="sidebar-more-link"
                        onClick={() => onNavigate('projects')}
                      >
                        + View all {totalProjects.toLocaleString()} apps in dashboard →
                      </button>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Pillar 2: Packages */}
          <div className="nav-section">
            <div className="pillar-header-row">
              <button
                type="button"
                aria-current={(isActive('packages') || isActive('packages-dashboard')) ? 'page' : undefined}
                className={(isActive('packages') || isActive('packages-dashboard')) ? 'nav-item pillar-parent-item active' : 'nav-item pillar-parent-item'}
                onClick={() => {
                  onNavigate('packages');
                  if (collapsedSections.packages) {
                    toggleSection('packages');
                  }
                }}
                title="Open Packages Dashboard"
              >
                <span className="nav-icon overview-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                    <line x1="12" y1="22.08" x2="12" y2="12" />
                  </svg>
                </span>
                <span className="nav-text">Shared Packages</span>
                <span className="nav-badge-count">{formatCount(packages.length)}</span>
              </button>

              <button
                type="button"
                className="pillar-chevron-toggle"
                onClick={() => toggleSection('packages')}
                aria-expanded={!collapsedSections.packages}
                title={collapsedSections.packages ? 'Expand packages list' : 'Collapse packages list'}
                aria-label={collapsedSections.packages ? 'Expand packages list' : 'Collapse packages list'}
              >
                <span className={`nav-chevron ${collapsedSections.packages ? 'collapsed' : ''}`} aria-hidden="true">▼</span>
              </button>
            </div>

            {!collapsedSections.packages && (
              <>
                <div className="sidebar-filter-wrap">
                  <input
                    type="text"
                    value={pkgFilter}
                    onChange={(e) => setPkgFilter(e.target.value)}
                    placeholder={`Filter ${packages.length} packages...`}
                    aria-label="Filter packages"
                  />
                </div>

                <div className="package-nav-list sidebar-scroll-sublist">
                  {filteredPackages.slice(0, 50).map((pkg) => {
                    const badge = packageBadge(pkg);
                    const icon = packageSidebarIcon(pkg);
                    const isPkgActive = isActive(`packages/${pkg.id}`) || isActive(`package/${pkg.id}`) || isActive(pkg.id);

                    return (
                      <button
                        type="button"
                        key={pkg.id}
                        aria-current={isPkgActive ? 'page' : undefined}
                        className={isPkgActive ? 'nav-item active' : 'nav-item'}
                        onClick={() => onNavigate(`packages/${pkg.id}`)}
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

                  {filteredPackages.length > 50 && (
                    <button
                      type="button"
                      className="sidebar-more-link"
                      onClick={() => onNavigate('packages')}
                    >
                      + View all {packages.length.toLocaleString()} packages in dashboard →
                    </button>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Pillar 3: Documentation */}
          <div className="nav-section workspace-nav-section">
            <div className="pillar-header-row">
              <button
                type="button"
                aria-current={(isActive('docs') || isActive('docs-dashboard')) ? 'page' : undefined}
                className={(isActive('docs') || isActive('docs-dashboard')) ? 'nav-item pillar-parent-item active' : 'nav-item pillar-parent-item'}
                onClick={() => {
                  onNavigate('docs');
                  if (collapsedSections.docs) {
                    toggleSection('docs');
                  }
                }}
                title="Open Docs Dashboard"
              >
                <span className="nav-icon docs-icon" aria-hidden="true">📚</span>
                <span className="nav-text">Documentation</span>
                <span className="nav-badge-count">{formatCount(DOCUMENTATION_GUIDES_REGISTRY.length)}</span>
              </button>

              <button
                type="button"
                className="pillar-chevron-toggle"
                onClick={() => toggleSection('docs')}
                aria-expanded={!collapsedSections.docs}
                title={collapsedSections.docs ? 'Expand documentation guides' : 'Collapse documentation guides'}
                aria-label={collapsedSections.docs ? 'Expand documentation guides' : 'Collapse documentation guides'}
              >
                <span className={`nav-chevron ${collapsedSections.docs ? 'collapsed' : ''}`} aria-hidden="true">▼</span>
              </button>
            </div>

            {!collapsedSections.docs && (
              <>
                <div className="sidebar-filter-wrap">
                  <input
                    type="text"
                    value={docFilter}
                    onChange={(e) => setDocFilter(e.target.value)}
                    placeholder={`Filter ${DOCUMENTATION_GUIDES_REGISTRY.length} guides...`}
                    aria-label="Filter documentation guides"
                  />
                </div>

                <div className="package-nav-list sidebar-scroll-sublist">
                  {filteredGuides.slice(0, 50).map((guide) => {
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

                  {filteredGuides.length > 50 && (
                    <button
                      type="button"
                      className="sidebar-more-link"
                      onClick={() => onNavigate('docs')}
                    >
                      + View all {DOCUMENTATION_GUIDES_REGISTRY.length.toLocaleString()} guides in hub →
                    </button>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Pillar 4: Explore */}
          <div className="nav-section">
            <button
              type="button"
              aria-current={isActive('explore') ? 'page' : undefined}
              className={isActive('explore') ? 'nav-item active' : 'nav-item'}
              onClick={() => onNavigate('explore')}
            >
              <span className="nav-icon overview-icon" aria-hidden="true">🔍</span>
              <span className="nav-text">Explore &amp; Prober</span>
              <span className="nav-badge-count">Tool</span>
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
