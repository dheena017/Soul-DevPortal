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

import './styles.css';

function App() {
  const [active, setActive] = useState<string>('overview');
  const [query, setQuery] = useState<string>('');
  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const packagesList = workspaceData?.packages || [];
  const projectsList = workspaceData?.projects || [];
  const stats = workspaceData?.stats;

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
        setMenuOpen((prev) => !prev);
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
      } else if (event.key === 'Escape') {
        if (menuOpen) {
          setMenuOpen(false);
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

  const navigate = (id: string) => {
    setActive(id);
    window.location.hash = id;
    setMenuOpen(false);
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

      <main className="main">
        <header className="topbar">
          <div className="topbar-left">
            <button
              type="button"
              className={`header-sidebar-toggle ${menuOpen ? 'open' : ''}`}
              onClick={() => setMenuOpen(!menuOpen)}
              aria-expanded={menuOpen}
              aria-label={menuOpen ? 'Close sidebar navigation' : 'Open sidebar navigation'}
              title={menuOpen ? 'Close sidebar (Ctrl+B)' : 'Open sidebar (Ctrl+B)'}
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
              <span className="toggle-label">{menuOpen ? 'Close' : 'Menu'}</span>
              <kbd className="toggle-kbd">Ctrl+B</kbd>
            </button>

            <button
              type="button"
              className="topbar-brand-link gh-breadcrumb"
              onClick={() => navigate('overview')}
              title="Go to overview dashboard"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="#848d97" aria-hidden="true">
                <path d="M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 1 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5Zm10.5-1h-8a1 1 0 0 0-1 1v6.708A2.486 2.486 0 0 1 4.5 9h8ZM5 12.25a.25.25 0 0 1 .25-.25h6.5a.25.25 0 0 1 .25.25v1.5a.25.25 0 0 1-.25.25h-6.5a.25.25 0 0 1-.25-.25Z" />
              </svg>
              <span className="gh-repo-owner">soul</span>
              <span className="gh-repo-slash">/</span>
              <strong className="gh-repo-name">dev-portal</strong>
              <span className="gh-visibility-badge">Public</span>
            </button>
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
              placeholder="Type / to search packages, apps, guides, AST symbols..."
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
              <kbd>Ctrl K</kbd>
            )}
          </div>

          <div className="topbar-right">
            <button
              type="button"
              className="topbar-badge gh-nav-badge"
              onClick={() => navigate('projects')}
              title="8 Monorepo Shared Packages Integrated Apps"
            >
              <span className="brand-dot" aria-hidden="true" />
              <span>8 Apps</span>
            </button>
            <button
              type="button"
              className="topbar-badge gh-nav-badge"
              onClick={() => navigate('packages')}
              title="3 Monorepo Shared Packages"
            >
              <span>3 Packages</span>
            </button>
            <button
              type="button"
              className="topbar-badge gh-nav-badge"
              onClick={() => navigate('docs')}
              title="Documentation Hub"
            >
              <span>Docs</span>
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
              onSelectProject={(projectId) => navigate(`project/${projectId}`)}
              onBack={() => navigate('overview')}
            />
          )}

          {/* Pillar 1: Project Detail */}
          {active.startsWith('project/') && (
            (() => {
              const projectId = active.replace('project/', '');
              const project = projectsList.find((p) => p.id === projectId);
              if (!project) {
                return (
                  <ProjectsView
                    projects={projectsList}
                    onSelectProject={(id) => navigate(`project/${id}`)}
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
              onSelectPackage={(id) => navigate(id)}
            />
          )}

          {/* Pillar 2: Package Detail */}
          {packagesList
            .filter((pkg) => pkg.id === active)
            .map((pkg) => (
              <PackageDetailView
                key={pkg.id}
                pkg={pkg}
                onBack={() => navigate('packages')}
              />
            ))}

          {/* Pillar 3: Docs Dashboard & Guides */}
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
                if (guideId === 'rules') navigate('projects-rules');
                else if (guideId === 'ports') navigate('ports-guide');
                else if (guideId === 'techstack') navigate('tech-stack');
                else if (guideId === 'design') navigate('guide');
                else if (guideId === 'cheatsheet') navigate('cheatsheet');
                else navigate('docs');
              }}
            />
          )}

          {(active === 'rules' || active === 'projects-rules' || active === 'doc/rules') && (
            <DocsView
              blocks={workspaceData?.guideBlocks || []}
              portGuideBlocks={workspaceData?.portGuideBlocks || []}
              techStackBlocks={workspaceData?.techStackBlocks || []}
              projectRulesBlocks={workspaceData?.projectRulesBlocks || []}
              cheatsheetBlocks={workspaceData?.cheatsheetBlocks || []}
              activeGuideId="rules"
              onBack={() => navigate('docs')}
              onSelectGuide={(guideId) => {
                if (guideId === 'rules') navigate('projects-rules');
                else if (guideId === 'ports') navigate('ports-guide');
                else if (guideId === 'techstack') navigate('tech-stack');
                else if (guideId === 'design') navigate('guide');
                else if (guideId === 'cheatsheet') navigate('cheatsheet');
                else navigate('docs');
              }}
            />
          )}

          {(active === 'guide' || active === 'doc/design') && (
            <DocsView
              blocks={workspaceData?.guideBlocks || []}
              portGuideBlocks={workspaceData?.portGuideBlocks || []}
              techStackBlocks={workspaceData?.techStackBlocks || []}
              projectRulesBlocks={workspaceData?.projectRulesBlocks || []}
              cheatsheetBlocks={workspaceData?.cheatsheetBlocks || []}
              activeGuideId="design"
              onBack={() => navigate('docs')}
              onSelectGuide={(guideId) => {
                if (guideId === 'rules') navigate('projects-rules');
                else if (guideId === 'ports') navigate('ports-guide');
                else if (guideId === 'techstack') navigate('tech-stack');
                else if (guideId === 'design') navigate('guide');
                else if (guideId === 'cheatsheet') navigate('cheatsheet');
                else navigate('docs');
              }}
            />
          )}

          {(active === 'ports-guide' || active === 'doc/ports') && (
            <DocsView
              blocks={workspaceData?.guideBlocks || []}
              portGuideBlocks={workspaceData?.portGuideBlocks || []}
              techStackBlocks={workspaceData?.techStackBlocks || []}
              projectRulesBlocks={workspaceData?.projectRulesBlocks || []}
              cheatsheetBlocks={workspaceData?.cheatsheetBlocks || []}
              activeGuideId="ports"
              onBack={() => navigate('docs')}
              onSelectGuide={(guideId) => {
                if (guideId === 'rules') navigate('projects-rules');
                else if (guideId === 'ports') navigate('ports-guide');
                else if (guideId === 'techstack') navigate('tech-stack');
                else if (guideId === 'design') navigate('guide');
                else if (guideId === 'cheatsheet') navigate('cheatsheet');
                else navigate('docs');
              }}
            />
          )}

          {(active === 'tech-stack' || active === 'doc/techstack') && (
            <DocsView
              blocks={workspaceData?.guideBlocks || []}
              portGuideBlocks={workspaceData?.portGuideBlocks || []}
              techStackBlocks={workspaceData?.techStackBlocks || []}
              projectRulesBlocks={workspaceData?.projectRulesBlocks || []}
              cheatsheetBlocks={workspaceData?.cheatsheetBlocks || []}
              activeGuideId="techstack"
              onBack={() => navigate('docs')}
              onSelectGuide={(guideId) => {
                if (guideId === 'rules') navigate('projects-rules');
                else if (guideId === 'ports') navigate('ports-guide');
                else if (guideId === 'techstack') navigate('tech-stack');
                else if (guideId === 'design') navigate('guide');
                else if (guideId === 'cheatsheet') navigate('cheatsheet');
                else navigate('docs');
              }}
            />
          )}

          {(active === 'cheatsheet' || active === 'doc/cheatsheet') && (
            <DocsView
              blocks={workspaceData?.guideBlocks || []}
              portGuideBlocks={workspaceData?.portGuideBlocks || []}
              techStackBlocks={workspaceData?.techStackBlocks || []}
              projectRulesBlocks={workspaceData?.projectRulesBlocks || []}
              cheatsheetBlocks={workspaceData?.cheatsheetBlocks || []}
              activeGuideId="cheatsheet"
              onBack={() => navigate('docs')}
              onSelectGuide={(guideId) => {
                if (guideId === 'rules') navigate('projects-rules');
                else if (guideId === 'ports') navigate('ports-guide');
                else if (guideId === 'techstack') navigate('tech-stack');
                else if (guideId === 'design') navigate('guide');
                else if (guideId === 'cheatsheet') navigate('cheatsheet');
                else navigate('docs');
              }}
            />
          )}

          {/* Pillar 4: Explore & Introspection Engine */}
          {active === 'explore' && (
            <ExploreView
              packages={packagesList}
              projects={projectsList}
              onNavigate={navigate}
            />
          )}
        </div>
      </main>
    </div>
  );
}

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(<App />);
}
