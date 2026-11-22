import React from 'react';
import { consoleLogger } from '@workspace/logger';

export interface BreadcrumbItem {
  label: string;
  id?: string;
}

export interface HeaderProps {
  active: string;
  menuOpen: boolean;
  onToggleSidebar: () => void;
  breadcrumbs: BreadcrumbItem[];
  onNavigate: (viewId: string) => void;
  query: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClearSearch: () => void;
  searchInputRef: React.RefObject<HTMLInputElement | null>;
  projectsCount: number;
  packagesCount: number;
  docsCount: number;
  onOpenShortcuts: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  active,
  menuOpen,
  onToggleSidebar,
  breadcrumbs,
  onNavigate,
  query,
  onSearchChange,
  onClearSearch,
  searchInputRef,
  projectsCount,
  packagesCount,
  docsCount,
  onOpenShortcuts,
}) => {
  const isProjectsActive = active.startsWith('project');
  const isPackagesActive = active.startsWith('package') || ['logger', 'runner', 'config'].includes(active);
  const isDocsActive =
    active.startsWith('doc') ||
    ['rules', 'projects-rules', 'design', 'packages-design', 'guide', 'ports', 'port-architecture', 'ports-guide', 'techstack', 'tech-stack', 'cheatsheet', 'compliance-cheatsheet'].includes(active);
  const isExploreActive = active.startsWith('explore');

  return (
    <header className="topbar" role="banner">
      {/* ── Left: Sidebar Toggle & Breadcrumbs ── */}
      <div className="topbar-left">
        <button
          type="button"
          className={`header-sidebar-toggle ${menuOpen ? 'open' : ''}`}
          onClick={() => {
            consoleLogger.action('UI', menuOpen ? 'Closing sidebar navigation' : 'Opening sidebar navigation');
            onToggleSidebar();
          }}
          aria-expanded={menuOpen}
          aria-label={menuOpen ? 'Close sidebar navigation (Ctrl+B)' : 'Open sidebar navigation (Ctrl+B)'}
        >
          <span className="toggle-icon-wrap" aria-hidden="true">
            {menuOpen ? (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            )}
          </span>
          <span className="toggle-hover-tooltip" aria-hidden="true">
            {menuOpen ? 'Close sidebar' : 'Open sidebar'} <kbd>Ctrl+B</kbd>
          </span>
        </button>

        <nav className="topbar-breadcrumb-wrap" aria-label="Breadcrumb navigation">
          <button
            type="button"
            className="topbar-brand-link"
            onClick={() => onNavigate('overview')}
            title="Go to Overview Dashboard"
          >
            <span className="topbar-logo-icon" aria-hidden="true">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 2 7 12 12 22 7 12 2" />
                <polyline points="2 17 12 22 22 17" />
                <polyline points="2 12 12 17 22 12" />
              </svg>
            </span>
            <span className="topbar-brand-name">soul</span>
            <span className="topbar-crumb-slash">/</span>
            <strong className="topbar-brand-repo">dev-portal</strong>
          </button>

          {breadcrumbs.slice(1).map((crumb, idx) => (
            <div key={idx} className="topbar-crumb-segment">
              <span className="topbar-crumb-slash">/</span>
              {crumb.id ? (
                <button
                  type="button"
                  className="topbar-crumb-link"
                  onClick={() => onNavigate(crumb.id!)}
                  title={`Go to ${crumb.label}`}
                >
                  {crumb.label}
                </button>
              ) : (
                <span className="topbar-crumb-current" title={crumb.label}>
                  {crumb.label}
                </span>
              )}
            </div>
          ))}
        </nav>
      </div>

      {/* ── Center: Omni Command Search ── */}
      <div className="search-wrap gh-command-search" role="search">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          ref={searchInputRef as React.RefObject<HTMLInputElement>}
          value={query}
          onChange={onSearchChange}
          placeholder="Search apps, packages, docs..."
          aria-label="Search package and application documentation"
        />
        {query ? (
          <button
            type="button"
            className="search-clear-btn"
            onClick={onClearSearch}
            aria-label="Clear search input"
          >
            ✕
          </button>
        ) : (
          <kbd aria-hidden="true">/</kbd>
        )}
      </div>

      {/* ── Right: Navigation Tabs, GitHub Link & Shortcuts ── */}
      <div className="topbar-right">
        <nav className="topbar-nav-pills" aria-label="Portal Dashboards">
          <button
            type="button"
            className={`topbar-pill-btn ${active === 'overview' ? 'active' : ''}`}
            onClick={() => onNavigate('overview')}
            title="Overview Dashboard"
          >
            <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
              <path d="m8 1.636 5.5 4.318v6.796H9.75v-3.75h-3.5v3.75H2.5V5.954L8 1.636Z" />
            </svg>
            <span>Overview</span>
          </button>

          <button
            type="button"
            className={`topbar-pill-btn ${isProjectsActive ? 'active' : ''}`}
            onClick={() => onNavigate('projects')}
            title={`Pillar 1: Applications (${projectsCount})`}
          >
            <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
              <path d="M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 1 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5Zm10.5-1h-8a1 1 0 0 0-1 1v6.708A2.486 2.486 0 0 1 4.5 9h8ZM5 12.25a.25.25 0 0 1 .25-.25h6.5a.25.25 0 0 1 .25.25v1.5a.25.25 0 0 1-.25.25h-6.5a.25.25 0 0 1-.25-.25Z" />
            </svg>
            <span>Projects</span>
            <span className="topbar-pill-count">{projectsCount}</span>
          </button>

          <button
            type="button"
            className={`topbar-pill-btn ${isPackagesActive ? 'active' : ''}`}
            onClick={() => onNavigate('packages')}
            title={`Pillar 2: Shared Libraries (${packagesCount})`}
          >
            <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
              <path d="m8.878.392 5.25 3.045c.54.314.872.89.872 1.514v6.098a1.75 1.75 0 0 1-.872 1.514l-5.25 3.045a1.75 1.75 0 0 1-1.756 0l-5.25-3.045A1.75 1.75 0 0 1 1 11.049V4.951c0-.624.332-1.201.872-1.514L7.122.392a1.75 1.75 0 0 1 1.756 0Z" />
            </svg>
            <span>Packages</span>
            <span className="topbar-pill-count">{packagesCount}</span>
          </button>

          <button
            type="button"
            className={`topbar-pill-btn ${isDocsActive ? 'active' : ''}`}
            onClick={() => onNavigate('docs')}
            title={`Pillar 3: Documentation Hub (${docsCount} Guides)`
            }
          >
            <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
              <path d="M0 1.75A.75.75 0 0 1 .75 1h4.253c1.227 0 2.317.59 3 1.501A3.743 3.743 0 0 1 11.006 1h4.244a.75.75 0 0 1 .75.75v10.5a.75.75 0 0 1-.75.75h-4.244a2.25 2.25 0 0 0-1.756.843l-.5.667a.75.75 0 0 1-1.206 0l-.5-.667A2.25 2.25 0 0 0 5.003 13H.75a.75.75 0 0 1-.75-.75Zm1.5.75v9h3.503c.72 0 1.393.307 1.862.834L7.5 13.064V3.5a2.25 2.25 0 0 0-2.497-2.247L1.5 2.5Zm13 9V2.5l-3.503-.247A2.25 2.25 0 0 0 8.5 3.5v9.564l.635-.73c.47-.527 1.142-.834 1.862-.834H14.5Z" />
            </svg>
            <span>Docs</span>
            <span className="topbar-pill-count">{docsCount}</span>
          </button>

          <button
            type="button"
            className={`topbar-pill-btn ${isExploreActive ? 'active' : ''}`}
            onClick={() => onNavigate('explore')}
            title="Pillar 4: Explorer & Socket Prober"
          >
            <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
              <path d="M1.5 3a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-9a2 2 0 0 1-2-2Zm2-1a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1Zm2.75 4.75a.75.75 0 0 1 .75-.75h4a.75.75 0 0 1 0 1.5h-4a.75.75 0 0 1-.75-.75Zm0 3a.75.75 0 0 1 .75-.75h2a.75.75 0 0 1 0 1.5h-2a.75.75 0 0 1-.75-.75Z" />
            </svg>
            <span>Prober</span>
          </button>
        </nav>

        <div className="topbar-divider" aria-hidden="true" />

        <a
          href="https://github.com/dheena017/Soul-DevPortal"
          target="_blank"
          rel="noopener noreferrer"
          className="topbar-github-btn"
          title="Open GitHub Repository: dheena017/Soul-DevPortal"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
            <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z" />
          </svg>
          <span>GitHub</span>
          <span className="topbar-ext-icon">↗</span>
        </a>

        <button
          type="button"
          className="topbar-icon-btn"
          onClick={() => {
            consoleLogger.action('SHORTCUT', 'Clicked help button: opening keyboard shortcuts modal');
            onOpenShortcuts();
          }}
          title="Keyboard Shortcuts (?)"
          aria-label="View keyboard shortcuts"
        >
          <span className="topbar-help-icon">?</span>
        </button>
      </div>
    </header>
  );
};
