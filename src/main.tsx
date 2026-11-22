import React, { useEffect, useMemo, useState, useRef, ChangeEvent } from 'react';
import { createRoot } from 'react-dom/client';
import workspaceData from 'virtual:workspace-packages';

// 1. Consume @workspace/logger (Universal DevTools & Terminal logging)
import { consoleLogger } from '@workspace/logger';

// 2. Consume @workspace/config (Design tokens & color hierarchy)
import { tokens } from '@workspace/config/tailwind/tokens';

// Core Navigation & Layout
import Sidebar from './components/Sidebar';
import Overview from './components/Overview';

// 4 Pillar Feature Views
import ProjectsView from './features/projects/ProjectsView';
import ProjectDetailView from './features/projects/ProjectDetailView';
import PackagesView from './features/packages/PackagesView';
import PackageDetailView from './features/packages/PackageDetailView';
import DocsView from './features/docs/DocsView';
import ExploreView from './features/explore/ExploreView';

import { DOCUMENTATION_GUIDES_REGISTRY } from './features/docs/docsConstants';

import './styles.css';

function App() {
  const [active, setActive] = useState<string>('overview');
  const [query, setQuery] = useState<string>('');
  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  const [isPinned, setIsPinned] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('soul_sidebar_pinned');
      if (saved !== null) {
        return saved === 'true';
      }
      return typeof window !== 'undefined' && window.innerWidth >= 1024;
    } catch {
      return true;
    }
  });
  const [runnerCopied, setRunnerCopied] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const packagesList = workspaceData?.packages || [];
  const projectsList = workspaceData?.projects || [];
  const stats = workspaceData?.stats;

  const togglePin = () => {
    setIsPinned((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('soul_sidebar_pinned', String(next));
      } catch (err) {
        consoleLogger.warn('UI', 'Failed to save pinned state', err);
      }
      if (next) {
        setMenuOpen(true);
      }
      consoleLogger.action('UI', `Sidebar pinned mode: ${next}`);
      return next;
    });
  };

  const handleSidebarToggle = () => {
    if (window.innerWidth >= 1024) {
      if (isPinned) {
        setIsPinned(false);
        setMenuOpen(false);
        try {
          localStorage.setItem('soul_sidebar_pinned', 'false');
        } catch {}
      } else if (menuOpen) {
        setMenuOpen(false);
      } else {
        setMenuOpen(true);
      }
    } else {
      setMenuOpen((prev) => !prev);
    }
  };

  useEffect(() => {
    // Announce portal initialization via @workspace/logger
    consoleLogger.printDevBanner();
    consoleLogger.success('APP', 'Soul Workspace Portal connected (4 Pillars Architecture)', {
      packagesCount: packagesList.length,
      projectsCount: projectsList.length,
      brandPrimary: tokens.colors.brand?.DEFAULT || '#2459d8',
      accentColor: tokens.colors.accent?.DEFAULT || '#7457cf',
    });

    const syncHash = () => {
      const hashView = window.location.hash.slice(1) || 'overview';
      setActive(hashView);
      consoleLogger.action('ROUTER', `Navigated to view: #${hashView}`);
    };

    syncHash();
    window.addEventListener('hashchange', syncHash);
    return () => window.removeEventListener('hashchange', syncHash);
  }, [packagesList.length, projectsList.length]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'b') {
        event.preventDefault();
        handleSidebarToggle();
      } else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        searchInputRef.current?.focus();
      } else if (
        event.key === '/' &&
        document.activeElement !== searchInputRef.current &&
        !['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName || '')
      ) {
        event.preventDefault();
        searchInputRef.current?.focus();
      } else if (
        event.key === '?' &&
        document.activeElement !== searchInputRef.current &&
        !['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName || '')
      ) {
        event.preventDefault();
        setShowShortcuts((prev) => !prev);
      } else if (event.key === 'Escape') {
        if (showShortcuts) {
          setShowShortcuts(false);
        } else if (menuOpen) {
          setMenuOpen(false);
        } else if (document.activeElement === searchInputRef.current) {
          searchInputRef.current?.blur();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [menuOpen, isPinned]);

  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    if (!menuOpen || isPinned) return undefined;

    root.classList.add('sidebar-open');
    body.classList.add('sidebar-open');
    return () => {
      root.classList.remove('sidebar-open');
      body.classList.remove('sidebar-open');
    };
  }, [menuOpen, isPinned]);

  const navigate = (id: string) => {
    setActive(id);
    window.location.hash = id;
    if (!isPinned || (typeof window !== 'undefined' && window.innerWidth < 1024)) {
      setMenuOpen(false);
    }
    consoleLogger.action('UI', `Selected package navigation: ${id}`);
  };

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    const val = event.target.value;
    setQuery(val);
    if (val.trim()) {
      if (active !== 'overview' && active !== 'packages' && active !== 'explore') {
        setActive('overview');
        window.location.hash = 'overview';
      }
      consoleLogger.info('SEARCH', `Query: "${val}"`);
    }
  };

  const filteredPackages = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return packagesList;
    return packagesList.filter((pkg) =>
      [
        pkg.name,
        pkg.description,
        pkg.pythonName,
        pkg.pythonModule,
        ...(pkg.exports || []),
        ...(pkg.pythonExports || []),
        ...(pkg.typeScriptExports || []),
        ...((pkg.readmeBlocks || []).map((block) => block.text || '')),
      ]
        .join(' ')
        .toLowerCase()
        .includes(needle)
    );
  }, [query, packagesList]);

  const activeTitle = useMemo(() => {
    if (active === 'overview' || active === '' || active === '#') return null;
    if (active === 'projects') return 'Projects & Applications';
    if (active.startsWith('projects/') || active.startsWith('project/')) {
      const pId = active.replace(/^projects?\//, '');
      const proj = projectsList.find((p) => p.id === pId);
      return proj ? proj.title : pId;
    }
    if (active === 'packages' || active === 'packages-dashboard') return 'Shared Packages';
    if (active.startsWith('packages/') || active.startsWith('package/')) {
      const pkgId = active.replace(/^packages?\//, '');
      const pkg = packagesList.find((p) => p.id === pkgId);
      return pkg ? (pkg.displayName || pkg.name) : `@workspace/${pkgId}`;
    }
    if (active === 'logger') return '@workspace/logger';
    if (active === 'runner') return '@workspace/runner';
    if (active === 'config') return '@workspace/config';
    if (active === 'docs' || active === 'docs-dashboard') return 'Documentation Hub';
    if (active.startsWith('docs/') || active.startsWith('doc/')) {
      const dId = active.replace(/^docs?\//, '');
      const guide = DOCUMENTATION_GUIDES_REGISTRY.find((g) => g.id === dId || g.slug === dId);
      if (guide) return guide.title;
      return dId.replace(/-/g, ' ');
    }
    if (active === 'rules' || active === 'projects-rules') return 'Projects Rules & Standards';
    if (active === 'design' || active === 'packages-design' || active === 'guide') return 'Shared Packages Design Guide';
    if (active === 'ports' || active === 'port-architecture' || active === 'ports-guide') return 'Port Architecture Guide';
    if (active === 'techstack' || active === 'tech-stack') return 'Tech Stack Standards';
    if (active === 'cheatsheet' || active === 'compliance-cheatsheet') return 'Compliance Cheatsheet';
    if (active === 'explore' || active.startsWith('explore/')) return 'Explore & Prober';
    return active;
  }, [active, projectsList, packagesList]);

  useEffect(() => {
    if (activeTitle) {
      document.title = `${activeTitle} · Soul DevPortal`;
    } else {
      document.title = 'Soul Workspace Developer Portal';
    }
  }, [activeTitle]);

  const breadcrumbs = useMemo(() => {
    const crumbs: { label: string; id?: string }[] = [{ label: 'soul', id: 'overview' }];
    if (!active || active === 'overview') {
      return crumbs;
    }
    if (active === 'projects') {
      crumbs.push({ label: 'projects' });
    } else if (active.startsWith('projects/') || active.startsWith('project/')) {
      const pId = active.replace(/^projects?\//, '');
      const proj = projectsList.find((p) => p.id === pId);
      crumbs.push({ label: 'projects', id: 'projects' });
      crumbs.push({ label: proj ? proj.title : pId });
    } else if (active === 'packages' || active === 'packages-dashboard') {
      crumbs.push({ label: 'packages' });
    } else if (active.startsWith('packages/') || active.startsWith('package/')) {
      const pkgId = active.replace(/^packages?\//, '');
      const pkg = packagesList.find((p) => p.id === pkgId);
      crumbs.push({ label: 'packages', id: 'packages' });
      crumbs.push({ label: pkg ? (pkg.displayName || pkg.name) : `@workspace/${pkgId}` });
    } else if (['logger', 'runner', 'config'].includes(active)) {
      crumbs.push({ label: 'packages', id: 'packages' });
      crumbs.push({ label: `@workspace/${active}` });
    } else if (active === 'docs' || active === 'docs-dashboard') {
      crumbs.push({ label: 'docs' });
    } else if (active.startsWith('docs/') || active.startsWith('doc/')) {
      const dId = active.replace(/^docs?\//, '');
      const guide = DOCUMENTATION_GUIDES_REGISTRY.find((g) => g.id === dId || g.slug === dId);
      crumbs.push({ label: 'docs', id: 'docs' });
      crumbs.push({ label: guide ? guide.title : dId.replace(/-/g, ' ') });
    } else if (['rules', 'projects-rules', 'design', 'packages-design', 'guide', 'ports', 'port-architecture', 'ports-guide', 'techstack', 'tech-stack', 'cheatsheet', 'compliance-cheatsheet'].includes(active)) {
      crumbs.push({ label: 'docs', id: 'docs' });
      crumbs.push({ label: activeTitle || active });
    } else if (active === 'explore' || active.startsWith('explore/')) {
      crumbs.push({ label: 'explorer & prober' });
    } else {
      crumbs.push({ label: activeTitle || active });
    }
    return crumbs;
  }, [active, activeTitle, projectsList, packagesList]);

  const copyRunnerCommand = () => {
    try {
      navigator.clipboard.writeText('npx @workspace/runner');
      setRunnerCopied(true);
      setTimeout(() => setRunnerCopied(false), 2200);
      consoleLogger.action('CLI', 'Copied runner command: npx @workspace/runner');
    } catch (err) {
      consoleLogger.warn('CLI', 'Failed to copy runner command', err);
    }
  };

  const isSidebarVisible = isPinned || menuOpen;

  return (
    <div className={`app-shell ${isPinned ? 'sidebar-pinned' : ''}`} style={{ '--color-brand': tokens.colors.brand?.DEFAULT || '#2459d8' } as React.CSSProperties}>
      <Sidebar
        active={active}
        packages={packagesList}
        projects={projectsList}
        projectsCount={projectsList.length}
        menuOpen={isSidebarVisible}
        isPinned={isPinned}
        onTogglePin={togglePin}
        onNavigate={navigate}
        onClose={() => {
          setIsPinned(false);
          setMenuOpen(false);
        }}
      />

      <main className="main">
        <header className="topbar">
          <div className="topbar-left">
            <button
              type="button"
              className={`header-sidebar-toggle ${isPinned ? 'pinned' : isSidebarVisible ? 'open' : ''}`}
              onClick={handleSidebarToggle}
              aria-expanded={isSidebarVisible}
              aria-label={isSidebarVisible ? 'Close sidebar navigation (Ctrl+B)' : 'Open sidebar navigation (Ctrl+B)'}
              title={isSidebarVisible ? 'Close sidebar (Ctrl+B)' : 'Open sidebar (Ctrl+B)'}
            >
              <span className="toggle-icon-wrap" aria-hidden="true">
                {isSidebarVisible ? (
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
              <span className="toggle-label">{isPinned ? 'Pinned' : isSidebarVisible ? 'Close' : 'Menu'}</span>
              <kbd className="toggle-kbd">Ctrl+B</kbd>
            </button>

            <div className="topbar-breadcrumb-wrap">
              <button
                type="button"
                className="topbar-brand-link"
                onClick={() => navigate('overview')}
                title="Soul Workspace Developer Portal"
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
                      onClick={() => navigate(crumb.id!)}
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

              <span className="topbar-meta-badge" title="Active Monorepo Git Branch">
                <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                  <path d="M9.5 3.25a2.25 2.25 0 1 1 3 2.122V6A2.5 2.5 0 0 1 10 8.5H6a1 1 0 0 0-1 1v1.128a2.251 2.251 0 1 1-1.5 0V5.372a2.25 2.25 0 1 1 1.5 0v1.836A2.493 2.493 0 0 1 6 7h4a1 1 0 0 0 1-1v-.628A2.25 2.25 0 0 1 9.5 3.25Zm-6 0a.75.75 0 1 0 1.5 0 .75.75 0 0 0-1.5 0Zm8.25.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM4.25 12a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Z"/>
                </svg>
                <span>main</span>
              </span>

              <span className="topbar-status-badge" title="Monorepo Operational: 8 Micro-Apps & 3 Shared Packages Registered">
                <span className="topbar-status-dot" aria-hidden="true" />
                <span className="topbar-status-text">8/8 Ready</span>
              </span>
            </div>
          </div>

          <div className="search-wrap gh-command-search">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              ref={searchInputRef}
              value={query}
              onChange={handleSearchChange}
              placeholder="Search apps, packages, docs, AST symbols..."
              aria-label="Search package documentation"
            />
            {query ? (
              <button
                type="button"
                className="search-clear-btn"
                onClick={() => setQuery('')}
                aria-label="Clear search query"
              >
                ✕
              </button>
            ) : (
              <div className="search-kbd-hints">
                <kbd>/</kbd>
                <kbd>Ctrl K</kbd>
              </div>
            )}
          </div>

          <div className="topbar-right">
            <nav className="topbar-nav-pills" aria-label="Portal Navigation Tabs">
              <button
                type="button"
                className={`topbar-pill-btn ${active === 'overview' ? 'active' : ''}`}
                onClick={() => navigate('overview')}
                title="Monorepo Overview"
              >
                <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                  <path d="m8 1.636 5.5 4.318v6.796H9.75v-3.75h-3.5v3.75H2.5V5.954L8 1.636Z"/>
                </svg>
                <span>Overview</span>
              </button>

              <button
                type="button"
                className={`topbar-pill-btn ${active.startsWith('project') ? 'active' : ''}`}
                onClick={() => navigate('projects')}
                title="Pillar 1: 8 Applications"
              >
                <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                  <path d="M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 1 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5Zm10.5-1h-8a1 1 0 0 0-1 1v6.708A2.486 2.486 0 0 1 4.5 9h8ZM5 12.25a.25.25 0 0 1 .25-.25h6.5a.25.25 0 0 1 .25.25v1.5a.25.25 0 0 1-.25.25h-6.5a.25.25 0 0 1-.25-.25Z"/>
                </svg>
                <span>Projects</span>
                <span className="topbar-pill-count">{projectsList.length}</span>
              </button>

              <button
                type="button"
                className={`topbar-pill-btn ${active.startsWith('package') || ['logger','runner','config'].includes(active) ? 'active' : ''}`}
                onClick={() => navigate('packages')}
                title="Pillar 2: 3 Shared Libraries"
              >
                <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                  <path d="m8.878.392 5.25 3.045c.54.314.872.89.872 1.514v6.098a1.75 1.75 0 0 1-.872 1.514l-5.25 3.045a1.75 1.75 0 0 1-1.756 0l-5.25-3.045A1.75 1.75 0 0 1 1 11.049V4.951c0-.624.332-1.201.872-1.514L7.122.392a1.75 1.75 0 0 1 1.756 0Z"/>
                </svg>
                <span>Packages</span>
                <span className="topbar-pill-count">{packagesList.length}</span>
              </button>

              <button
                type="button"
                className={`topbar-pill-btn ${active.startsWith('doc') || ['rules', 'projects-rules', 'design', 'packages-design', 'guide', 'ports', 'port-architecture', 'ports-guide', 'techstack', 'tech-stack', 'cheatsheet', 'compliance-cheatsheet'].includes(active) ? 'active' : ''}`}
                onClick={() => navigate('docs')}
                title="Pillar 3: Documentation Hub (5 Guides)"
              >
                <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                  <path d="M0 1.75A.75.75 0 0 1 .75 1h4.253c1.227 0 2.317.59 3 1.501A3.743 3.743 0 0 1 11.006 1h4.244a.75.75 0 0 1 .75.75v10.5a.75.75 0 0 1-.75.75h-4.244a2.25 2.25 0 0 0-1.756.843l-.5.667a.75.75 0 0 1-1.206 0l-.5-.667A2.25 2.25 0 0 0 5.003 13H.75a.75.75 0 0 1-.75-.75Zm1.5.75v9h3.503c.72 0 1.393.307 1.862.834L7.5 13.064V3.5a2.25 2.25 0 0 0-2.497-2.247L1.5 2.5Zm13 9V2.5l-3.503-.247A2.25 2.25 0 0 0 8.5 3.5v9.564l.635-.73c.47-.527 1.142-.834 1.862-.834H14.5Z"/>
                </svg>
                <span>Docs</span>
                <span className="topbar-pill-count">5</span>
              </button>

              <button
                type="button"
                className={`topbar-pill-btn ${active.startsWith('explore') ? 'active' : ''}`}
                onClick={() => navigate('explore')}
                title="Pillar 4: Explorer & Socket Prober"
              >
                <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                  <path d="M1.5 3a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-9a2 2 0 0 1-2-2Zm2-1a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1Zm2.75 4.75a.75.75 0 0 1 .75-.75h4a.75.75 0 0 1 0 1.5h-4a.75.75 0 0 1-.75-.75Zm0 3a.75.75 0 0 1 .75-.75h2a.75.75 0 0 1 0 1.5h-2a.75.75 0 0 1-.75-.75Z"/>
                </svg>
                <span>Prober</span>
              </button>
            </nav>

            <div className="topbar-divider" aria-hidden="true" />

            <button
              type="button"
              className={`topbar-action-btn ${runnerCopied ? 'copied' : ''}`}
              onClick={copyRunnerCommand}
              title="Click to copy runner command: npx @workspace/runner"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {runnerCopied ? (
                  <path d="M20 6L9 17l-5-5" />
                ) : (
                  <>
                    <polyline points="4 17 10 11 4 5" />
                    <line x1="12" y1="19" x2="20" y2="19" />
                  </>
                )}
              </svg>
              <span>{runnerCopied ? 'Copied CLI!' : 'npx runner'}</span>
            </button>

            <a
              href="https://github.com/dheena017/Soul-DevPortal"
              target="_blank"
              rel="noopener noreferrer"
              className="topbar-github-btn"
              title="Open GitHub Repository: dheena017/Soul-DevPortal"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z"/>
              </svg>
              <span>GitHub</span>
              <span className="topbar-ext-icon">↗</span>
            </a>

            <button
              type="button"
              className="topbar-icon-btn"
              onClick={() => setShowShortcuts(true)}
              title="Keyboard Shortcuts (?)"
              aria-label="View keyboard shortcuts"
            >
              <span className="topbar-help-icon">?</span>
            </button>
          </div>
        </header>

        <div className="content">
          {active === 'overview' && (
            <Overview
              packages={filteredPackages}
              projects={projectsList}
              rootWorkspaces={workspaceData?.rootWorkspaces || []}
              rootScripts={workspaceData?.rootScripts || {}}
              stats={stats}
              onNavigate={navigate}
              onClearSearch={() => setQuery('')}
            />
          )}

          {/* Pillar 1: Projects Hub */}
          {active === 'projects' && (
            <ProjectsView
              projects={projectsList}
              onSelectProject={(projectId) => navigate(`projects/${projectId}`)}
              onBack={() => navigate('overview')}
            />
          )}

          {/* Pillar 1: Project Detail */}
          {(active.startsWith('projects/') || active.startsWith('project/')) && (
            (() => {
              const projectId = active.replace(/^projects?\//, '');
              const project = projectsList.find((p) => p.id === projectId);
              if (!project) {
                return (
                  <ProjectsView
                    projects={projectsList}
                    onSelectProject={(id) => navigate(`projects/${id}`)}
                    onBack={() => navigate('projects')}
                  />
                );
              }
              return (
                <ProjectDetailView
                  project={project}
                  onBack={() => navigate('projects')}
                />
              );
            })()
          )}

          {/* Pillar 2: Packages Dashboard */}
          {(active === 'packages' || active === 'packages-dashboard' || active === 'package/dashboard') && (
            <PackagesView
              packages={filteredPackages}
              onSelectPackage={(id) => navigate(`packages/${id}`)}
            />
          )}

          {/* Pillar 2: Package Detail */}
          {(() => {
            let pkgId = '';
            if (active.startsWith('packages/')) pkgId = active.replace('packages/', '');
            else if (active.startsWith('package/')) pkgId = active.replace('package/', '');
            else if (packagesList.some((p) => p.id === active)) pkgId = active;

            if (!pkgId) return null;
            const pkg = packagesList.find((p) => p.id === pkgId);
            if (!pkg) return null;

            return (
              <PackageDetailView
                key={pkg.id}
                pkg={pkg}
                onBack={() => navigate('packages')}
              />
            );
          })()}

          {/* Pillar 3: Docs Dashboard Hub */}
          {(active === 'docs' || active === 'docs-dashboard' || active === 'doc/dashboard') && (
            <DocsView
              blocks={workspaceData?.guideBlocks || []}
              portGuideBlocks={workspaceData?.portGuideBlocks || []}
              techStackBlocks={workspaceData?.techStackBlocks || []}
              projectRulesBlocks={workspaceData?.projectRulesBlocks || []}
              cheatsheetBlocks={workspaceData?.cheatsheetBlocks || []}
              activeGuideId="hub"
              onBack={() => navigate('overview')}
              onSelectGuide={(guideId) => {
                const targetGuide = DOCUMENTATION_GUIDES_REGISTRY.find((g) => g.id === guideId);
                navigate(`docs/${targetGuide?.slug || guideId}`);
              }}
            />
          )}

          {/* Pillar 3: Docs Detail Guides */}
          {(() => {
            let guideId = '';
            const path = active.startsWith('docs/')
              ? active.replace('docs/', '')
              : active.startsWith('doc/')
              ? active.replace('doc/', '')
              : active;

            if (path === 'rules' || path === 'projects-rules') guideId = 'rules';
            else if (path === 'design' || path === 'packages-design' || path === 'guide') guideId = 'design';
            else if (path === 'ports' || path === 'port-architecture' || path === 'ports-guide') guideId = 'ports';
            else if (path === 'techstack' || path === 'tech-stack') guideId = 'techstack';
            else if (path === 'cheatsheet' || path === 'compliance-cheatsheet') guideId = 'cheatsheet';

            if (!guideId || guideId === 'hub' || guideId === 'dashboard') return null;

            return (
              <DocsView
                blocks={workspaceData?.guideBlocks || []}
                portGuideBlocks={workspaceData?.portGuideBlocks || []}
                techStackBlocks={workspaceData?.techStackBlocks || []}
                projectRulesBlocks={workspaceData?.projectRulesBlocks || []}
                cheatsheetBlocks={workspaceData?.cheatsheetBlocks || []}
                activeGuideId={guideId}
                onBack={() => navigate('docs')}
                onSelectGuide={(id) => {
                  const targetGuide = DOCUMENTATION_GUIDES_REGISTRY.find((g) => g.id === id);
                  navigate(`docs/${targetGuide?.slug || id}`);
                }}
              />
            );
          })()}

          {/* Pillar 4: Explore & Introspection Engine */}
          {(active === 'explore' || active.startsWith('explore/')) && (
            <ExploreView
              packages={packagesList}
              projects={projectsList}
              onNavigate={navigate}
            />
          )}
        </div>

        {/* Global Keyboard Shortcuts Modal */}
        {showShortcuts && (
          <div className="shortcuts-modal-backdrop" onClick={() => setShowShortcuts(false)}>
            <div className="shortcuts-modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="shortcuts-modal-header">
                <div className="shortcuts-modal-title">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <line x1="6" y1="8" x2="6.01" y2="8" />
                    <line x1="10" y1="8" x2="10.01" y2="8" />
                    <line x1="14" y1="8" x2="14.01" y2="8" />
                    <line x1="18" y1="8" x2="18.01" y2="8" />
                    <line x1="6" y1="12" x2="6.01" y2="12" />
                    <line x1="18" y1="12" x2="18.01" y2="12" />
                    <line x1="7" y1="16" x2="17" y2="16" />
                  </svg>
                  <span>Keyboard Shortcuts &amp; Monorepo Quick Commands</span>
                </div>
                <button
                  type="button"
                  className="shortcuts-close-btn"
                  onClick={() => setShowShortcuts(false)}
                  aria-label="Close shortcuts dialog"
                >
                  ✕
                </button>
              </div>

              <div className="shortcuts-modal-body">
                <div className="shortcuts-group">
                  <div className="shortcuts-group-label">Navigation &amp; Controls</div>
                  <div className="shortcut-row">
                    <span>Toggle / Pin Sidebar</span>
                    <kbd>Ctrl + B</kbd>
                  </div>
                  <div className="shortcut-row">
                    <span>Omni Search Palette</span>
                    <div className="kbd-row"><kbd>/</kbd> <kbd>Ctrl + K</kbd></div>
                  </div>
                  <div className="shortcut-row">
                    <span>Dismiss Search / Modals</span>
                    <kbd>Esc</kbd>
                  </div>
                  <div className="shortcut-row">
                    <span>Toggle Shortcuts Dialog</span>
                    <kbd>?</kbd>
                  </div>
                </div>

                <div className="shortcuts-group">
                  <div className="shortcuts-group-label">Monorepo Ports &amp; CLI</div>
                  <div className="shortcut-row">
                    <span>Monorepo Runner</span>
                    <code>npx @workspace/runner</code>
                  </div>
                  <div className="shortcut-row">
                    <span>Client Dev Servers</span>
                    <code>Ports 5173 - 5181</code>
                  </div>
                  <div className="shortcut-row">
                    <span>FastAPI Server APIs</span>
                    <code>Ports 8000 - 8008</code>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(<App />);
}
