import React, { useState, useMemo, useRef, useEffect } from 'react';
import { consoleLogger } from '@workspace/logger';
import { PackageData, ProjectData } from '../types';
import { DOCUMENTATION_GUIDES_REGISTRY, GuideMeta } from '../features/docs/docsConstants';
import { WORKSPACE_SCRIPTS_REGISTRY } from '../features/scripts/scriptsConstants';

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

function projectSidebarIcon(proj: ProjectData): string {
  const id = (proj.id || '').toLowerCase();
  const title = (proj.title || '').toLowerCase();
  if (id.includes('apex') || title.includes('apex')) return '🧠';
  if (id.includes('sonikoma') || title.includes('sonikoma')) return '🌌';
  if (id.includes('outpass') || title.includes('outpass')) return '🎫';
  if (id.includes('free-api') || id.includes('api') || title.includes('api')) return '⚡';
  if (id.includes('spatial') || title.includes('spatial')) return '🪐';
  if (id.includes('college') || id.includes('cms') || title.includes('college')) return '🎓';
  if (id.includes('global') || id.includes('pulse') || title.includes('global')) return '🌐';
  if (id.includes('postcraft') || id.includes('craft') || title.includes('post')) return '✍️';
  return '💻';
}


function docGuideBadge(guide: GuideMeta): string {
  if (guide.category === 'rules') return 'SPEC';
  if (guide.category === 'cheatsheet') return 'OPS';
  if (guide.category === 'design') return 'PKG';
  if (guide.category === 'ports') return 'PORTS';
  if (guide.category === 'techstack') return 'STACK';
  return guide.badge?.split(' ')[0] || 'DOC';
}

function formatDocGuideTitle(guide: GuideMeta): string {
  if (guide.id === 'rules') return 'Projects Rules';
  if (guide.id === 'cheatsheet') return 'Compliance Cheatsheet';
  if (guide.id === 'design') return 'Packages Design';
  if (guide.id === 'ports') return 'Port Architecture';
  if (guide.id === 'techstack') return 'Tech Stack';
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

function formatProjectTitle(title: string): string {
  if (!title) return '';
  if (title === title.toUpperCase()) {
    return title
      .toLowerCase()
      .split(' ')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ')
      .replace(/\bAi\b/g, 'AI')
      .replace(/\bApi\b/g, 'API')
      .replace(/\bCms\b/gi, 'CMS')
      .replace(/College Management System/gi, 'CMS');
  }
  return title;
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
  const [commonFilter, setCommonFilter] = useState<string>('');
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
    projects: false,
    packages: false,
    docs: false,
  });

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut '/' to focus sidebar search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === '/' &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === 'Escape' && document.activeElement === searchInputRef.current) {
        searchInputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toggleSection = (section: string) => {
    setCollapsedSections((prev) => {
      const willCollapse = !prev[section];
      consoleLogger.action('SIDEBAR', `${willCollapse ? 'Collapsed' : 'Expanded'} section: ${section}`);
      return { ...prev, [section]: willCollapse };
    });
  };

  const isActive = (id: string) => active === id;

  const totalProjects = projects.length || projectsCount;
  const isFiltering = Boolean(commonFilter.trim());
  const needle = commonFilter.trim().toLowerCase();

  // Dynamically filter packages
  const filteredPackages = useMemo(() => {
    if (!isFiltering) return packages;
    return packages.filter(
      (p) =>
        (p.displayName || p.name).toLowerCase().includes(needle) ||
        (p.description || '').toLowerCase().includes(needle) ||
        p.id.toLowerCase().includes(needle)
    );
  }, [packages, isFiltering, needle]);

  // Dynamically filter projects
  const filteredProjects = useMemo(() => {
    if (!isFiltering) return projects;
    return projects.filter(
      (p) =>
        p.title.toLowerCase().includes(needle) ||
        p.id.toLowerCase().includes(needle) ||
        (p.framework || '').toLowerCase().includes(needle) ||
        (p.description || '').toLowerCase().includes(needle)
    );
  }, [projects, isFiltering, needle]);

  // Dynamically filter documentation guides
  const filteredGuides = useMemo(() => {
    if (!isFiltering) return DOCUMENTATION_GUIDES_REGISTRY;
    return DOCUMENTATION_GUIDES_REGISTRY.filter(
      (g) =>
        g.title.toLowerCase().includes(needle) ||
        g.description.toLowerCase().includes(needle) ||
        g.id.toLowerCase().includes(needle) ||
        (g.category || '').toLowerCase().includes(needle)
    );
  }, [isFiltering, needle]);

  // Dynamically filter root scripts & runners
  const filteredScripts = useMemo(() => {
    if (!isFiltering) return [];
    return WORKSPACE_SCRIPTS_REGISTRY.filter(
      (s) =>
        s.name.toLowerCase().includes(needle) ||
        s.command.toLowerCase().includes(needle) ||
        s.description.toLowerCase().includes(needle) ||
        s.badge.toLowerCase().includes(needle) ||
        (s.ports || '').toLowerCase().includes(needle)
    );
  }, [isFiltering, needle]);

  const isProjectsOpen = isFiltering ? filteredProjects.length > 0 : !collapsedSections.projects;
  const isPackagesOpen = isFiltering ? filteredPackages.length > 0 : !collapsedSections.packages;
  const isDocsOpen = isFiltering ? filteredGuides.length > 0 : !collapsedSections.docs;
  const totalMatches =
    filteredProjects.length +
    filteredPackages.length +
    filteredGuides.length +
    filteredScripts.length;

  return (
    <>
      <aside
        className={`sidebar ${menuOpen ? 'open' : ''}`}
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

        <nav className="side-nav" aria-label="Monorepo navigation">
          {/* Unified Workspace Search */}
          <div className="sidebar-search-container">
            <div className="sidebar-search-box">
              <svg
                className="sidebar-search-icon"
                viewBox="0 0 24 24"
                width="14"
                height="14"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                ref={searchInputRef}
                type="text"
                value={commonFilter}
                onChange={(e) => setCommonFilter(e.target.value)}
                placeholder="Search apps, packages, docs..."
                aria-label="Filter monorepo items"
                className="sidebar-search-field"
              />
              {commonFilter ? (
                <button
                  type="button"
                  className="sidebar-search-clear-btn"
                  onClick={() => {
                    setCommonFilter('');
                    searchInputRef.current?.focus();
                  }}
                  title="Clear filter"
                  aria-label="Clear filter"
                >
                  ✕
                </button>
              ) : (
                <kbd className="sidebar-search-key" title="Press / to search">/</kbd>
              )}
            </div>
          </div>

          {/* Top Global Hubs & Tools */}
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

            <button
              type="button"
              aria-current={(isActive('scripts') || isActive('commands') || isActive('runners')) ? 'page' : undefined}
              className={(isActive('scripts') || isActive('commands') || isActive('runners')) ? 'nav-item active' : 'nav-item'}
              onClick={() => onNavigate('scripts')}
            >
              <span className="nav-icon overview-icon" aria-hidden="true">⚡</span>
              <span className="nav-text">Scripts &amp; Runners</span>
              <span className="nav-badge-count">15</span>
            </button>

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

          {/* If searching and matching scripts exist, show them right under top tools */}
          {isFiltering && filteredScripts.length > 0 && (
            <div className="nav-section">
              <div className="pillar-header-row">
                <button
                  type="button"
                  className="nav-item pillar-parent-item active"
                  onClick={() => onNavigate('scripts')}
                >
                  <span className="nav-icon" aria-hidden="true">⚡</span>
                  <span className="nav-text">Matching Scripts</span>
                  <span className="nav-badge-count">{filteredScripts.length}</span>
                </button>
              </div>
              <div className="package-nav-list sidebar-scroll-sublist">
                {filteredScripts.slice(0, 8).map((s) => (
                  <button
                    type="button"
                    key={s.id}
                    className="nav-item"
                    onClick={() => onNavigate('scripts')}
                    title={`${s.name} - ${s.description}`}
                  >
                    <span className="nav-text">{s.name}</span>
                    <span className={`sidebar-badge ${s.badgeClass}`}>{s.badge}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="nav-section-divider">
            <span className="nav-section-label">Core Monorepo Pillars</span>
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
                  if (!isProjectsOpen) {
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
                <span className="nav-badge-count">{formatCount(isFiltering ? filteredProjects.length : totalProjects)}</span>
              </button>

              <button
                type="button"
                className="pillar-chevron-toggle"
                onClick={() => toggleSection('projects')}
                aria-expanded={isProjectsOpen}
                title={isProjectsOpen ? 'Collapse applications list' : 'Expand applications list'}
                aria-label={isProjectsOpen ? 'Collapse applications list' : 'Expand applications list'}
              >
                <span className={`nav-chevron ${!isProjectsOpen ? 'collapsed' : ''}`} aria-hidden="true">▼</span>
              </button>
            </div>

            {isProjectsOpen && (
              <>
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
                            {projectSidebarIcon(proj)}
                          </span>
                          <span className="nav-text">{formatProjectTitle(proj.title)}</span>
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
                  if (!isPackagesOpen) {
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
                <span className="nav-badge-count">{formatCount(isFiltering ? filteredPackages.length : packages.length)}</span>
              </button>

              <button
                type="button"
                className="pillar-chevron-toggle"
                onClick={() => toggleSection('packages')}
                aria-expanded={isPackagesOpen}
                title={isPackagesOpen ? 'Collapse packages list' : 'Expand packages list'}
                aria-label={isPackagesOpen ? 'Collapse packages list' : 'Expand packages list'}
              >
                <span className={`nav-chevron ${!isPackagesOpen ? 'collapsed' : ''}`} aria-hidden="true">▼</span>
              </button>
            </div>

            {isPackagesOpen && (
              <>
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
                  if (!isDocsOpen) {
                    toggleSection('docs');
                  }
                }}
                title="Open Docs Dashboard"
              >
                <span className="nav-icon docs-icon" aria-hidden="true">📚</span>
                <span className="nav-text">Documentation</span>
                <span className="nav-badge-count">{formatCount(isFiltering ? filteredGuides.length : DOCUMENTATION_GUIDES_REGISTRY.length)}</span>
              </button>

              <button
                type="button"
                className="pillar-chevron-toggle"
                onClick={() => toggleSection('docs')}
                aria-expanded={isDocsOpen}
                title={isDocsOpen ? 'Collapse documentation guides' : 'Expand documentation guides'}
                aria-label={isDocsOpen ? 'Collapse documentation guides' : 'Expand documentation guides'}
              >
                <span className={`nav-chevron ${!isDocsOpen ? 'collapsed' : ''}`} aria-hidden="true">▼</span>
              </button>
            </div>

            {isDocsOpen && (
              <>
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

          {/* Empty Search Feedback */}
          {isFiltering && totalMatches === 0 && (
            <div className="sidebar-no-results">
              <span className="sidebar-no-results-icon" aria-hidden="true">🔍</span>
              <p>No matches found for &ldquo;{commonFilter}&rdquo;</p>
              <button
                type="button"
                className="sidebar-clear-filter-btn"
                onClick={() => {
                  setCommonFilter('');
                  searchInputRef.current?.focus();
                }}
              >
                Clear filter
              </button>
            </div>
          )}
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
