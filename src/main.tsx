import React, { useEffect, useMemo, useState, useRef, ChangeEvent } from 'react';
import { createRoot } from 'react-dom/client';
import workspaceData from 'virtual:workspace-packages';
import { fetchWorkspaceData, fetchProjectsLive, WorkspaceApiResponse } from './services/api';

// 1. Consume @workspace/logger (Universal DevTools & Terminal logging)
import { consoleLogger } from '@workspace/logger';

// 2. Consume @workspace/config (Design tokens & color hierarchy)
import { tokens } from '@workspace/config/tailwind/tokens';

// Core Navigation & Layout
import Sidebar from './components/Sidebar';
import Overview from './components/Overview';
import { Header } from './components/Header';

// 4 Pillar Feature Views
import ProjectsView from './features/projects/ProjectsView';
import ProjectDetailView from './features/projects/ProjectDetailView';
import PackagesView from './features/packages/PackagesView';
import PackageDetailView from './features/packages/PackageDetailView';
import DocsView from './features/docs/DocsView';
import ExploreView from './features/explore/ExploreView';
import ScriptsView from './features/scripts/ScriptsView';

import { DOCUMENTATION_GUIDES_REGISTRY } from './features/docs/docsConstants';

import './styles.css';

function App() {
  const [active, setActive] = useState<string>('overview');
  const [query, setQuery] = useState<string>('');
  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [liveWorkspace, setLiveWorkspace] = useState<WorkspaceApiResponse>(workspaceData);
  const packagesList = liveWorkspace?.packages || [];
  const projectsList = liveWorkspace?.projects || [];
  const stats = liveWorkspace?.stats;

  useEffect(() => {
    let isMounted = true;
    async function loadWorkspaceFromApi() {
      const data = await fetchWorkspaceData();
      if (data && isMounted) {
        setLiveWorkspace(data);
        consoleLogger.success('API', 'Dynamic workspace payload received from FastAPI flow', {
          packagesCount: data.packages?.length || 0,
          projectsCount: data.projects?.length || 0,
        });
      }
    }
    loadWorkspaceFromApi();

    const intervalId = setInterval(async () => {
      const liveProjects = await fetchProjectsLive();
      if (liveProjects && liveProjects.length > 0 && isMounted) {
        setLiveWorkspace((prev) => ({
          ...prev,
          projects: liveProjects,
        }));
      }
    }, 5000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, []);

  const handleSidebarToggle = () => {
    setMenuOpen((prev) => !prev);
  };

  useEffect(() => {
    // Announce portal initialization via @workspace/logger
    consoleLogger.installGlobalErrorHandlers();
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
        consoleLogger.action('SHORTCUT', 'Ctrl+B: Toggled sidebar drawer');
        handleSidebarToggle();
      } else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        consoleLogger.action('SHORTCUT', 'Ctrl+K: Focused command search');
        searchInputRef.current?.focus();
      } else if (
        event.key === '/' &&
        document.activeElement !== searchInputRef.current &&
        !['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName || '')
      ) {
        event.preventDefault();
        consoleLogger.action('SHORTCUT', '/: Focused search');
        searchInputRef.current?.focus();
      } else if (
        event.key === '?' &&
        document.activeElement !== searchInputRef.current &&
        !['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName || '')
      ) {
        event.preventDefault();
        consoleLogger.action('SHORTCUT', '?: Toggled keyboard shortcuts modal');
        setShowShortcuts((prev) => !prev);
      } else if (event.key === 'Escape') {
        if (showShortcuts) {
          setShowShortcuts(false);
          consoleLogger.action('SHORTCUT', 'Escape: Closed shortcuts modal');
        } else if (menuOpen) {
          setMenuOpen(false);
          consoleLogger.action('SHORTCUT', 'Escape: Closed sidebar drawer');
        } else if (document.activeElement === searchInputRef.current) {
          searchInputRef.current?.blur();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [menuOpen]);

  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    if (!menuOpen) return undefined;

    root.classList.add('sidebar-open');
    body.classList.add('sidebar-open');
    return () => {
      root.classList.remove('sidebar-open');
      body.classList.remove('sidebar-open');
    };
  }, [menuOpen]);

  const mainRef = useRef<HTMLElement>(null);

  const navigate = (id: string) => {
    setActive(id);
    window.location.hash = id;
    setMenuOpen(false);
    mainRef.current?.scrollTo({ top: 0, behavior: 'instant' });
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
    } else if (active === 'scripts' || active === 'commands' || active === 'runners') {
      crumbs.push({ label: 'scripts & runners' });
    } else {
      crumbs.push({ label: activeTitle || active });
    }
    return crumbs;
  }, [active, activeTitle, projectsList, packagesList]);

  return (
    <div className="app-shell" style={{ '--color-brand': tokens.colors.brand?.DEFAULT || '#2459d8' } as React.CSSProperties}>
      <Sidebar
        active={active}
        packages={packagesList}
        projects={projectsList}
        projectsCount={projectsList.length}
        menuOpen={menuOpen}
        onNavigate={navigate}
        onClose={() => setMenuOpen(false)}
      />

      <Header
        active={active}
        menuOpen={menuOpen}
        onToggleSidebar={handleSidebarToggle}
        breadcrumbs={breadcrumbs}
        onNavigate={navigate}
        query={query}
        onSearchChange={handleSearchChange}
        onClearSearch={() => setQuery('')}
        searchInputRef={searchInputRef}
        projectsCount={projectsList.length}
        packagesCount={packagesList.length}
        docsCount={5}
        onOpenShortcuts={() => setShowShortcuts(true)}
      />

      <main ref={mainRef} className="main">
        <div className="content">
          {active === 'overview' && (
            <Overview
              packages={filteredPackages}
              projects={projectsList}
              rootWorkspaces={liveWorkspace?.rootWorkspaces || []}
              rootScripts={liveWorkspace?.rootScripts || {}}
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
              blocks={liveWorkspace?.guideBlocks || []}
              portGuideBlocks={liveWorkspace?.portGuideBlocks || []}
              techStackBlocks={liveWorkspace?.techStackBlocks || []}
              projectRulesBlocks={liveWorkspace?.projectRulesBlocks || []}
              cheatsheetBlocks={liveWorkspace?.cheatsheetBlocks || []}
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
            const path = active.startsWith('docs/')
              ? active.replace('docs/', '')
              : active.startsWith('doc/')
              ? active.replace('doc/', '')
              : active;

            const matchedGuide = DOCUMENTATION_GUIDES_REGISTRY.find(
              (g) => g.id === path || g.slug === path || g.category === path
            );

            const guideId = matchedGuide ? matchedGuide.id : (
              path === 'rules' || path === 'projects-rules' ? 'rules' :
              path === 'design' || path === 'packages-design' || path === 'guide' ? 'design' :
              path === 'ports' || path === 'port-architecture' || path === 'ports-guide' ? 'ports' :
              path === 'techstack' || path === 'tech-stack' ? 'techstack' :
              path === 'cheatsheet' || path === 'compliance-cheatsheet' ? 'cheatsheet' : ''
            );

            if (!guideId || guideId === 'hub' || guideId === 'dashboard') return null;

            return (
              <DocsView
                blocks={liveWorkspace?.guideBlocks || []}
                portGuideBlocks={liveWorkspace?.portGuideBlocks || []}
                techStackBlocks={liveWorkspace?.techStackBlocks || []}
                projectRulesBlocks={liveWorkspace?.projectRulesBlocks || []}
                cheatsheetBlocks={liveWorkspace?.cheatsheetBlocks || []}
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

          {/* Dedicated Feature View: Scripts & Automation Command Runners */}
          {(active === 'scripts' || active === 'commands' || active === 'runners') && (
            <ScriptsView
              rootScripts={liveWorkspace?.rootScripts || {}}
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
