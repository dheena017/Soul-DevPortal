import React, { Suspense, lazy, useEffect, useMemo, useState, useRef, ChangeEvent } from 'react';
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
import LoadingScreen from './components/LoadingScreen';
import TabLoadingState from './components/TabLoadingState';
import ShortcutsModal from './components/ShortcutsModal';
import GlobalStatusBar from './components/GlobalStatusBar';

// Lazy-loaded Pillar Feature Views (code-split cleanly)
const PortalHubView = lazy(() => import('./components/PortalHubView'));
const ProjectsView = lazy(() => import('./features/projects/ProjectsView'));
const ProjectDetailView = lazy(() => import('./features/projects/ProjectDetailView'));
const PackagesView = lazy(() => import('./features/packages/PackagesView'));
const PackageDetailView = lazy(() => import('./features/packages/PackageDetailView'));
const DocsView = lazy(() => import('./features/docs/DocsView'));
const ScriptsView = lazy(() => import('./features/scripts/ScriptsView'));
const SystemView = lazy(() => import('./features/system/SystemView'));

import { DOCUMENTATION_GUIDES_REGISTRY, findGuideMeta } from './features/docs/docsConstants';

import './styles.css';

interface PortalErrorBoundaryProps {
  routeKey: string;
  onRecover: () => void;
  children: React.ReactNode;
}

class PortalErrorBoundary extends React.Component<
  PortalErrorBoundaryProps,
  { error: Error | null }
> {
  declare props: PortalErrorBoundaryProps;
  declare setState: (state: { error: Error | null }) => void;
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidUpdate(prevProps: PortalErrorBoundaryProps) {
    if (prevProps.routeKey !== this.props.routeKey && this.state.error) {
      this.setState({ error: null });
    }
  }

  render() {
    if (this.state.error) {
      return (
        <div className="p-6 md:p-8 rounded-2xl bg-[#111115] border border-rose-500/35 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-rose-400">
              VIEW RENDER INTERRUPTED
            </span>
            <h2 className="text-base font-bold text-white">Unable to mount workspace view</h2>
            <p className="text-xs text-zinc-400 font-mono">{this.state.error.message}</p>
          </div>
          <button
            type="button"
            onClick={() => {
              this.setState({ error: null });
              this.props.onRecover();
            }}
            className="px-4 py-2 rounded-xl bg-white text-zinc-950 text-xs font-bold hover:bg-zinc-200 transition-colors cursor-pointer shrink-0"
          >
            Return to Overview
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function mergeById<T extends { id: string }>(
  prevList: T[] = [],
  nextList: T[] = [],
  fallbackKeys: Array<keyof T>
): T[] {
  if (!nextList.length) return prevList;
  const prevMap = new Map(prevList.map((item) => [item.id, item]));
  return nextList.map((nextItem) => {
    const prevItem = prevMap.get(nextItem.id);
    if (!prevItem) return nextItem;
    const merged = { ...prevItem, ...nextItem };
    for (const key of fallbackKeys) {
      const nextVal = nextItem[key];
      const isEmptyArray = Array.isArray(nextVal) && nextVal.length === 0;
      const isEmptyObj =
        nextVal &&
        typeof nextVal === 'object' &&
        !Array.isArray(nextVal) &&
        Object.keys(nextVal).length === 0;
      if (nextVal === undefined || nextVal === null || isEmptyArray || isEmptyObj) {
        if (prevItem[key] !== undefined) {
          merged[key] = prevItem[key];
        }
      }
    }
    return merged;
  });
}

function App() {
  const [active, setActive] = useState<string>('overview');
  const [query, setQuery] = useState<string>('');
  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [isBootLoading, setIsBootLoading] = useState<boolean>(true);
  const [deferredInstallPrompt, setDeferredInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [liveWorkspace, setLiveWorkspace] = useState<WorkspaceApiResponse>(workspaceData);
  const packagesList = liveWorkspace?.packages || [];
  const projectsList = liveWorkspace?.projects || [];
  const stats = liveWorkspace?.stats;

  const [canScrollTop, setCanScrollTop] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    async function loadWorkspaceFromApi() {
      const data = await fetchWorkspaceData();
      if (data && isMounted) {
        setLiveWorkspace((prev) => ({
          ...prev,
          ...data,
          packages: mergeById(prev.packages || [], data.packages || [], [
            'readmeBlocks',
            'exports',
            'pythonExports',
            'typeScriptExports',
            'peerDependencies',
            'pythonName',
            'pythonModule',
            'pythonDependencies',
          ]),
          projects: mergeById(prev.projects || [], data.projects || [], [
            'readmeBlocks',
            'tables',
            'envKeys',
            'configuration',
            'fileTree',
            'apiEndpoints',
            'scripts',
            'dependencies',
            'devDependencies',
          ]),
          guideBlocks: data.guideBlocks && data.guideBlocks.length > 0 ? data.guideBlocks : prev.guideBlocks,
          portGuideBlocks: data.portGuideBlocks && data.portGuideBlocks.length > 0 ? data.portGuideBlocks : prev.portGuideBlocks,
          techStackBlocks: data.techStackBlocks && data.techStackBlocks.length > 0 ? data.techStackBlocks : prev.techStackBlocks,
          projectRulesBlocks: data.projectRulesBlocks && data.projectRulesBlocks.length > 0 ? data.projectRulesBlocks : prev.projectRulesBlocks,
          cheatsheetBlocks: data.cheatsheetBlocks && data.cheatsheetBlocks.length > 0 ? data.cheatsheetBlocks : prev.cheatsheetBlocks,
          docsBlocksMap: {
            ...(prev.docsBlocksMap || {}),
            ...(data.docsBlocksMap || {}),
          },
        }));
        consoleLogger.success('API', 'Dynamic workspace payload received from FastAPI flow', {
          packagesCount: data.packages?.length || 0,
          projectsCount: data.projects?.length || 0,
        });
      }
    }
    loadWorkspaceFromApi();

    const intervalId = setInterval(async () => {
      if (typeof document !== 'undefined' && document.hidden) return;
      const liveProjects = await fetchProjectsLive();
      if (liveProjects && liveProjects.length > 0 && isMounted) {
        setLiveWorkspace((prev) => {
          const prevProjects = prev.projects || [];
          if (
            prevProjects.length === liveProjects.length &&
            prevProjects.every(
              (p, i) =>
                p.id === liveProjects[i].id &&
                Boolean(p.frontend?.isLive ?? p.frontendActive) ===
                  Boolean(liveProjects[i].frontend?.isLive ?? liveProjects[i].frontendActive) &&
                Boolean(p.backend?.isLive ?? p.backendActive) ===
                  Boolean(liveProjects[i].backend?.isLive ?? liveProjects[i].backendActive)
            )
          ) {
            return prev;
          }
          return {
            ...prev,
            projects: mergeById(prevProjects, liveProjects, [
              'readmeBlocks',
              'tables',
              'envKeys',
              'configuration',
              'fileTree',
              'apiEndpoints',
              'scripts',
              'dependencies',
              'devDependencies',
            ]),
          };
        });
      }
    }, 30000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, []);

  // Warm lazy-loaded views after initial boot so route transitions never wait on chunk compilation
  useEffect(() => {
    const prefetch = (loader: () => Promise<unknown>) => {
      void loader().catch(() => {
        // Ignore transient dev-server reloads or offline chunk fetches during background warm-up
      });
    };
    const timer = window.setTimeout(() => {
      prefetch(() => import('./components/PortalHubView'));
      prefetch(() => import('./features/projects/ProjectsView'));
      prefetch(() => import('./features/packages/PackagesView'));
      prefetch(() => import('./features/docs/DocsView'));
      prefetch(() => import('./features/scripts/ScriptsView'));
      prefetch(() => import('./features/system/SystemView'));
    }, 950);

    const onBeforeInstall = (evt: Event) => {
      evt.preventDefault();
      setDeferredInstallPrompt(evt as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', onBeforeInstall);

    if (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      !window.soulDesktop?.isDesktop &&
      (window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ) {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // Ignore non-fatal SW registration issues
      });
    }

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
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
      setActive((prev) => (prev === hashView ? prev : hashView));
      consoleLogger.action('ROUTER', `Navigated to view: #${hashView}`);
    };

    syncHash();
    window.addEventListener('hashchange', syncHash);
    const desktopNavCleanup = (window as any).soulDesktop?.onNavigate?.((hash: string) => {
      if (hash) {
        setActive(hash);
        window.location.hash = hash;
        setMenuOpen(false);
        mainRef.current?.scrollTo({ top: 0, behavior: 'instant' });
      }
    });
    return () => {
      window.removeEventListener('hashchange', syncHash);
      desktopNavCleanup?.();
    };
  }, []);

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
      if (active !== 'overview' && active !== 'packages') {
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
    if (active === 'portal' || active === 'hub') return 'Developer Hub & GitHub Links';
    if (active === 'computer' || active === 'system') return 'Computer & Performance';
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
      const guide = findGuideMeta(dId);
      if (guide) return guide.title;
      return dId.replace(/-/g, ' ');
    }
    const legacyGuide = findGuideMeta(active);
    if (legacyGuide && (legacyGuide.id === active || (legacyGuide.aliases && legacyGuide.aliases.includes(active)))) {
      return legacyGuide.title;
    }
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
    } else if (active === 'scripts' || active === 'commands' || active === 'runners') {
      crumbs.push({ label: 'scripts & runners' });
    } else if (active === 'computer' || active === 'system') {
      crumbs.push({ label: 'computer & performance' });
    } else if (active === 'portal' || active === 'hub') {
      crumbs.push({ label: 'developer hub & github' });
    } else {
      crumbs.push({ label: activeTitle || active });
    }
    return crumbs;
  }, [active, activeTitle, projectsList, packagesList]);

  return (
    <div className="h-screen h-[100dvh] bg-[#070708] text-neutral-200 flex flex-col overflow-hidden font-sans relative">
      <div className="portal-doodle-canvas" aria-hidden="true" />
      {isBootLoading && (
        <LoadingScreen
          minDurationMs={850}
          onComplete={() => setIsBootLoading(false)}
        />
      )}

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
        docsCount={DOCUMENTATION_GUIDES_REGISTRY.length}
        onOpenShortcuts={() => setShowShortcuts(true)}
        onTriggerReload={() => setIsBootLoading(true)}
      />

      <main
        ref={mainRef}
        onScroll={(e) => {
          const next = e.currentTarget.scrollTop > 160;
          setCanScrollTop((prev) => (prev === next ? prev : next));
        }}
        className="main w-full flex-1 min-h-0 overflow-y-auto overflow-x-hidden flex flex-col"
      >
        <div className="w-full max-w-[1800px] mx-auto px-3 sm:px-5 lg:px-6 py-5 pb-12 box-border">
          <PortalErrorBoundary routeKey={active} onRecover={() => navigate('overview')}>
            <Suspense
              fallback={
                <TabLoadingState
                  title="Loading Workspace View"
                  subtitle="Soul DevPortal · Preparing Module"
                  badgeText="v0.0.1"
                  backdropSrc="/visuals/hero-overview-mesh.jpg"
                />
              }
            >
              <div key={active === 'system' ? 'computer' : active} className="portal-page-enter">
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

          {(active === 'portal' || active === 'hub') && (
            <PortalHubView
              projects={projectsList}
              packages={packagesList}
              onNavigate={navigate}
              onBack={() => navigate('overview')}
              onOpenShortcuts={() => setShowShortcuts(true)}
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
                  key={project.id}
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
              onBack={() => navigate('overview')}
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
              docsHierarchy={liveWorkspace?.docsHierarchy || []}
              docsBlocksMap={liveWorkspace?.docsBlocksMap || {}}
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
            const isDocRoute =
              active.startsWith('docs/') ||
              active.startsWith('doc/') ||
              ['rules', 'projects-rules', 'design', 'packages-design', 'ports', 'port-architecture', 'techstack', 'tech-stack', 'cheatsheet', 'compliance-cheatsheet'].includes(active) ||
              DOCUMENTATION_GUIDES_REGISTRY.some((g) => g.id === active || g.slug === active || (g.aliases && g.aliases.includes(active)));

            if (!isDocRoute) return null;

            const rawPath = active.startsWith('docs/')
              ? active.replace('docs/', '')
              : active.startsWith('doc/')
              ? active.replace('doc/', '')
              : active;

            const pathParts = rawPath.split('/');
            const primaryPath = pathParts[0];
            const subModuleParam = pathParts.slice(1).join('/');

            if (!primaryPath || primaryPath === 'hub' || primaryPath === 'dashboard') return null;

            const matchedGuide = findGuideMeta(primaryPath);
            const guideId = matchedGuide ? matchedGuide.id : primaryPath;

            return (
              <DocsView
                blocks={liveWorkspace?.guideBlocks || []}
                portGuideBlocks={liveWorkspace?.portGuideBlocks || []}
                techStackBlocks={liveWorkspace?.techStackBlocks || []}
                projectRulesBlocks={liveWorkspace?.projectRulesBlocks || []}
                cheatsheetBlocks={liveWorkspace?.cheatsheetBlocks || []}
                docsHierarchy={liveWorkspace?.docsHierarchy || []}
                docsBlocksMap={liveWorkspace?.docsBlocksMap || {}}
                activeGuideId={guideId}
                initialSubModule={subModuleParam}
                onBack={() => navigate('docs')}
                onSelectGuide={(id) => {
                  const targetGuide = DOCUMENTATION_GUIDES_REGISTRY.find((g) => g.id === id);
                  navigate(`docs/${targetGuide?.slug || id}`);
                }}
              />
            );
          })()}

          {/* Dedicated Feature View: Scripts & Automation Command Runners */}
          {(active === 'scripts' || active === 'commands' || active === 'runners') && (
            <ScriptsView
              rootScripts={liveWorkspace?.rootScripts || {}}
              onNavigate={navigate}
            />
          )}

            {(active === 'computer' || active === 'system') && (
              <SystemView onNavigate={navigate} />
            )}
            </div>
          </Suspense>
          </PortalErrorBoundary>
        </div>

        {/* Global Desktop App, Shortcuts & Commands Modal */}
        <ShortcutsModal
          open={showShortcuts}
          onClose={() => setShowShortcuts(false)}
          onNavigate={navigate}
          projectsCount={projectsList.length}
          packagesCount={packagesList.length}
          docsCount={DOCUMENTATION_GUIDES_REGISTRY.length}
          canInstallPwa={Boolean(deferredInstallPrompt)}
          onInstallPwa={async () => {
            if (!deferredInstallPrompt) return;
            await deferredInstallPrompt.prompt();
            await deferredInstallPrompt.userChoice;
            setDeferredInstallPrompt(null);
          }}
        />
      </main>

      <GlobalStatusBar
        active={active}
        onNavigate={navigate}
        canScrollTop={canScrollTop}
        onScrollTop={() => mainRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
        projectsCount={projectsList.length}
        onOpenShortcuts={() => setShowShortcuts(true)}
        onFocusSearch={() => searchInputRef.current?.focus()}
      />
    </div>
  );
}

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(<App />);
}
