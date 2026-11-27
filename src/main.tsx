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
import { SoulLogoIcon } from './components/SoulLogo';
import TabLoadingState from './components/TabLoadingState';
import ShortcutsModal from './components/ShortcutsModal';
import GlobalStatusBar from './components/GlobalStatusBar';

// Lazy-loaded Pillar Feature Views (code-split cleanly)
const PortalHubView = lazy(() => import('./components/PortalHubView'));
const ChangelogView = lazy(() => import('./features/changelog/ChangelogView'));
const CodeUpdatesView = lazy(() => import('./features/changelog/CodeUpdatesView'));
const ProjectsView = lazy(() => import('./features/projects/ProjectsView'));
const ProjectDetailView = lazy(() => import('./features/projects/ProjectDetailView'));
const PackagesView = lazy(() => import('./features/packages/PackagesView'));
const PackageDetailView = lazy(() => import('./features/packages/PackageDetailView'));
const DocsView = lazy(() => import('./features/docs/DocsView'));
const ScriptsView = lazy(() => import('./features/scripts/ScriptsView'));
const SystemView = lazy(() => import('./features/system/SystemView'));
const EverydayUtilitiesPage = lazy(() => import('./features/everyday/EverydayUtilitiesPage'));
const ProfileView = lazy(() => import('./features/profile/ProfileView'));
const TerminalView = lazy(() => import('./features/terminal/TerminalView'));

import { loadDeveloperProfile } from './features/profile/profileStore';

import { DOCUMENTATION_GUIDES_REGISTRY, findGuideMeta } from './features/docs/docsConstants';
import {
  getEverydayTabMeta,
  isEverydayRoute,
  resolveEverydayRouteToTab,
} from './features/everyday/everydayTabsRegistry';

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
        <div className="p-6 md:p-8 rounded-2xl neu-card bg-[#111115] border border-rose-500/35 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
  const [panelMode, setPanelMode] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return new URLSearchParams(window.location.search).get('panel');
  });
  const [active, setActive] = useState<string>(() => {
    if (typeof window === 'undefined') return 'overview';
    const hash = window.location.hash.slice(1);
    if (hash) return hash;
    return new URLSearchParams(window.location.search).get('panel') || loadDeveloperProfile().defaultLandingView || 'overview';
  });
  const [query, setQuery] = useState<string>('');
  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [terminalDrawerOpen, setTerminalDrawerOpen] = useState<boolean>(false);
  const [terminalDrawerHeight, setTerminalDrawerHeight] = useState<number>(380);
  const [isBootLoading, setIsBootLoading] = useState<boolean>(
    () => !(typeof window !== 'undefined' && Boolean(new URLSearchParams(window.location.search).get('panel')))
  );
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
      prefetch(() => import('./features/changelog/ChangelogView'));
      prefetch(() => import('./features/changelog/CodeUpdatesView'));
      prefetch(() => import('./features/projects/ProjectsView'));
      prefetch(() => import('./features/packages/PackagesView'));
      prefetch(() => import('./features/docs/DocsView'));
      prefetch(() => import('./features/scripts/ScriptsView'));
      prefetch(() => import('./features/system/SystemView'));
      prefetch(() => import('./features/everyday/EverydayUtilitiesPage'));
      prefetch(() => import('./features/profile/ProfileView'));
      prefetch(() => import('./features/terminal/TerminalView'));
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
      const initialPanel = new URLSearchParams(window.location.search).get('panel');
      const hashView = window.location.hash.slice(1) || initialPanel || loadDeveloperProfile().defaultLandingView || 'overview';
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
      const activeEl = document.activeElement as HTMLElement | null;
      const isEditableTarget =
        activeEl === searchInputRef.current ||
        ['INPUT', 'TEXTAREA', 'SELECT'].includes(activeEl?.tagName || '') ||
        Boolean(activeEl?.isContentEditable);

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'b') {
        event.preventDefault();
        setShowShortcuts(false);
        consoleLogger.action('SHORTCUT', 'Ctrl+B: Toggled sidebar drawer');
        handleSidebarToggle();
      } else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setShowShortcuts(false);
        consoleLogger.action('SHORTCUT', 'Ctrl+K: Focused command search');
        searchInputRef.current?.focus();
      } else if (event.key === '/' && !isEditableTarget) {
        event.preventDefault();
        setShowShortcuts(false);
        consoleLogger.action('SHORTCUT', '/: Focused search');
        searchInputRef.current?.focus();
      } else if (event.key === '?' && !isEditableTarget) {
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
      } else if ((event.ctrlKey || event.metaKey) && event.key === '`') {
        event.preventDefault();
        setShowShortcuts(false);
        if (active === 'terminal') {
          return;
        }
        setTerminalDrawerOpen((prev) => !prev);
      } else if ((event.ctrlKey || event.metaKey) && ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'].includes(event.key)) {
        const keyMap: Record<string, string> = {
          '0': 'profile',
          '1': 'overview',
          '2': 'projects',
          '3': 'packages',
          '4': 'docs',
          '5': 'computer',
          '6': 'portal',
          '7': 'everyday',
          '8': 'everyday/notes',
          '9': 'everyday/focus',
        };
        const target = keyMap[event.key];
        if (target) {
          event.preventDefault();
          setShowShortcuts(false);
          setActive(target);
          window.location.hash = target;
          setMenuOpen(false);
          mainRef.current?.scrollTo({ top: 0, behavior: 'instant' });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [menuOpen, showShortcuts]);

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

  const EVERYDAY_LAST_TAB_KEY = 'soul-everyday-last-tab-v1';

  const navigate = (id: string) => {
    let targetId = id;
    if (targetId === 'everyday') {
      if (isEverydayRoute(active)) {
        // Already inside Everyday Utilities: keep the current active utility tab instead of snapping to Overview
        targetId = active;
      } else {
        try {
          const savedTab = window.sessionStorage.getItem(EVERYDAY_LAST_TAB_KEY);
          if (savedTab && savedTab !== 'overview') {
            targetId = `everyday/${savedTab}`;
          }
        } catch {
          // ignore storage errors
        }
      }
    }

    if (panelMode) {
      if (targetId === 'changelog' || targetId === 'code-updates') {
        setPanelMode(targetId);
        if (typeof window !== 'undefined') {
          window.history.replaceState({}, '', `${window.location.pathname}?panel=${targetId}#${targetId}`);
        }
      } else if (targetId !== panelMode) {
        setPanelMode(null);
        if (typeof window !== 'undefined') {
          window.history.replaceState({}, '', `${window.location.pathname}#${targetId}`);
        }
      }
    }
    setActive(targetId);
    window.location.hash = targetId;
    setMenuOpen(false);
    mainRef.current?.scrollTo({ top: 0, behavior: 'instant' });
    consoleLogger.action('UI', `Selected package navigation: ${targetId}`);
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
    if (isEverydayRoute(active)) {
      const tab = getEverydayTabMeta(resolveEverydayRouteToTab(active));
      return tab.id === 'overview' ? 'Everyday Utilities' : `Everyday Utilities — ${tab.label}`;
    }
    if (['changelog', 'catalog', 'portfolio', 'showcase'].includes(active)) return 'Changelog';
    if (['code-updates', 'codebase-updates', 'git-updates', 'updates'].includes(active)) return 'Codebase Updates by Date';
    if (active === 'portal' || active === 'hub') return 'Developer Hub & GitHub Links';
    if (active === 'profile') return 'Developer Profile';
    if (active === 'terminal') return 'Workspace Terminal';
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

  const routeViewKey = useMemo(() => {
    if (isEverydayRoute(active)) return 'everyday';
    if (active === 'computer' || active === 'system') return 'computer';
    if (active.startsWith('projects/') || active.startsWith('project/')) {
      return `project/${active.replace(/^projects?\//, '')}`;
    }
    if (active.startsWith('packages/') || active.startsWith('package/')) {
      return `package/${active.replace(/^packages?\//, '')}`;
    }
    if (active.startsWith('docs/') || active.startsWith('doc/')) {
      const primaryPath = active.replace(/^docs?\//, '').split('/')[0];
      return `docs/${findGuideMeta(primaryPath)?.id || primaryPath}`;
    }
    return active;
  }, [active]);

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
    } else if (isEverydayRoute(active)) {
      const tab = getEverydayTabMeta(resolveEverydayRouteToTab(active));
      if (tab.id === 'overview') {
        crumbs.push({ label: 'everyday utilities' });
      } else {
        crumbs.push({ label: 'everyday utilities', id: 'everyday' });
        crumbs.push({ label: tab.shortLabel.toLowerCase() });
      }
    } else if (['changelog', 'catalog', 'portfolio', 'showcase'].includes(active)) {
      crumbs.push({ label: 'changelog' });
    } else if (['code-updates', 'codebase-updates', 'git-updates', 'updates'].includes(active)) {
      crumbs.push({ label: 'codebase updates' });
    } else if (active === 'portal' || active === 'hub') {
      crumbs.push({ label: 'developer hub & github' });
    } else if (active === 'profile') {
      crumbs.push({ label: 'profile' });
    } else if (active === 'terminal') {
      crumbs.push({ label: 'terminal' });
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

      {!panelMode && (
        <Sidebar
          active={active}
          packages={packagesList}
          projects={projectsList}
          projectsCount={projectsList.length}
          menuOpen={menuOpen}
          onNavigate={navigate}
          onClose={() => setMenuOpen(false)}
        />
      )}

      {panelMode ? (
        <header
          className="w-full h-14 bg-[#0d0d10]/[0.97] border-b border-white/[0.08] sticky top-0 z-30 shrink-0"
          role="banner"
        >
          <div className="w-full max-w-[1800px] mx-auto h-full px-4 sm:px-6 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <SoulLogoIcon className="w-6 h-6 shrink-0" />
              <span className="text-sm font-extrabold text-white tracking-tight truncate">
                {panelMode === 'code-updates' ? 'Codebase Updates by Date' : 'Workspace Changelog'}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-sky-500/15 border border-sky-400/30 text-sky-300 shrink-0">
                {typeof window !== 'undefined' && window.soulDesktop?.isDesktop
                  ? 'Desktop Panel'
                  : 'Standalone Tab'}
              </span>
              <div className="hidden sm:flex items-center gap-1 ml-2 p-0.5 rounded-lg neu-tray bg-[#16161c] border border-white/[0.08]" role="tablist" aria-label="Changelog views">
                <button
                  type="button"
                  role="tab"
                  aria-selected={panelMode === 'changelog'}
                  onClick={() => navigate('changelog')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border cursor-pointer ${
                    panelMode === 'changelog' ? 'text-white font-bold border-white/20' : 'border-transparent text-zinc-400 hover:text-white'
                  }`}
                >
                  Release Notes
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={panelMode === 'code-updates'}
                  onClick={() => navigate('code-updates')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border cursor-pointer ${
                    panelMode === 'code-updates' ? 'bg-emerald-500/20 border-emerald-500/35 text-emerald-200 font-bold' : 'border-transparent text-zinc-400 hover:text-white'
                  }`}
                >
                  🧬 Code Updates by Date
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => navigate('overview')}
                className="px-3 py-1.5 rounded-lg bg-[#16161c] border border-white/[0.1] hover:border-white/[0.25] text-xs font-semibold text-zinc-200 hover:text-white cursor-pointer"
              >
                Open Full Portal
              </button>
              <button
                type="button"
                onClick={() => {
                  window.close();
                  navigate('overview');
                }}
                className="px-3 py-1.5 rounded-lg bg-white text-zinc-950 hover:bg-zinc-200 text-xs font-bold cursor-pointer"
              >
                Close Panel
              </button>
            </div>
          </div>
        </header>
      ) : (
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
      )}

      <main
        ref={mainRef}
        onScroll={(e) => {
          const next = e.currentTarget.scrollTop > 160;
          setCanScrollTop((prev) => (prev === next ? prev : next));
        }}
        className="main w-full flex-1 min-h-0 overflow-y-auto overflow-x-hidden flex flex-col"
      >
        <div className="w-full max-w-[1800px] mx-auto px-3 sm:px-5 lg:px-6 py-4 pb-5 box-border">
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
              <div key={routeViewKey} className="portal-page-enter">
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

          {['changelog', 'catalog', 'portfolio', 'showcase'].includes(active) && (
            <ChangelogView
              projects={projectsList}
              packages={packagesList}
              stats={stats}
              rootScripts={liveWorkspace?.rootScripts || {}}
              externalQuery={query}
              onNavigate={navigate}
              onBack={() => navigate('overview')}
            />
          )}

          {['code-updates', 'codebase-updates', 'git-updates', 'updates'].includes(active) && (
            <CodeUpdatesView
              projects={projectsList}
              packages={packagesList}
              externalQuery={query}
              onNavigate={navigate}
              onBack={() => navigate('changelog')}
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

            {isEverydayRoute(active) && (
              <EverydayUtilitiesPage
                initialTab={resolveEverydayRouteToTab(active)}
                onSelectTab={(tab) => navigate(`everyday/${tab}`)}
                onNavigate={navigate}
              />
            )}

            {active === 'profile' && (
              <ProfileView
                projects={projectsList}
                packages={packagesList}
                stats={stats}
                onNavigate={navigate}
                onBack={() => navigate('overview')}
              />
            )}

            {active === 'terminal' && (
              <TerminalView
                projects={projectsList}
                packages={packagesList}
                onNavigate={navigate}
                onBack={() => navigate('overview')}
              />
            )}
            </div>
          </Suspense>
          </PortalErrorBoundary>
        </div>
      </main>

      {terminalDrawerOpen && active !== 'terminal' && (
        <section
          aria-label="Bottom Terminal Drawer"
          style={{ height: `${terminalDrawerHeight}px` }}
          className="w-full shrink-0 bg-[#0d0d10] border-t border-white/[0.12] flex flex-col z-30 shadow-[0_-12px_36px_rgba(0,0,0,0.55)]"
        >
          {/* Drag-to-resize handle */}
          <div
            onMouseDown={(e) => {
              e.preventDefault();
              const startY = e.clientY;
              const startH = terminalDrawerHeight;
              const onMove = (ev: MouseEvent) => {
                const delta = startY - ev.clientY;
                const next = Math.max(240, Math.min(window.innerHeight * 0.78, startH + delta));
                setTerminalDrawerHeight(Math.round(next));
              };
              const onUp = () => {
                window.removeEventListener('mousemove', onMove);
                window.removeEventListener('mouseup', onUp);
              };
              window.addEventListener('mousemove', onMove);
              window.addEventListener('mouseup', onUp);
            }}
            title="Drag to resize terminal drawer"
            className="h-1.5 w-full cursor-ns-resize bg-white/[0.03] hover:bg-sky-400/40 transition-colors shrink-0"
          />

          <div className="flex items-center justify-between px-4 py-1.5 bg-[#111115] border-b border-white/[0.08] shrink-0">
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="text-emerald-400 font-bold">&gt;_</span>
              <span className="font-bold text-white">Terminal Panel</span>
              <span className="text-[10px] text-zinc-500 hidden sm:inline">Ctrl+` to toggle</span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setTerminalDrawerOpen(false);
                  navigate('terminal');
                }}
                className="h-6 px-2.5 rounded-md bg-[#16161c] border border-white/[0.08] hover:border-sky-400/40 text-[11px] font-mono text-zinc-200 hover:text-white cursor-pointer"
                title="Open full-page Terminal"
              >
                ⤢ Full View
              </button>
              <button
                type="button"
                onClick={() => setTerminalDrawerOpen(false)}
                className="h-6 px-2 rounded-md bg-[#16161c] border border-white/[0.08] hover:border-rose-400/40 text-xs font-mono text-zinc-300 hover:text-white cursor-pointer"
                title="Close Terminal Panel"
                aria-label="Close Terminal Panel"
              >
                ×
              </button>
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto px-3 sm:px-4 py-2">
            <Suspense fallback={<div className="text-xs font-mono text-zinc-400 p-4">Loading Terminal...</div>}>
              <TerminalView
                compact
                paneHeightClass="h-[220px]"
                projects={projectsList}
                packages={packagesList}
                onNavigate={(viewId) => {
                  setTerminalDrawerOpen(false);
                  navigate(viewId);
                }}
              />
            </Suspense>
          </div>
        </section>
      )}

      <GlobalStatusBar
        active={active}
        onNavigate={navigate}
        canScrollTop={canScrollTop}
        onScrollTop={() => mainRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
        projectsCount={projectsList.length}
        onOpenShortcuts={() => setShowShortcuts(true)}
        onFocusSearch={() => searchInputRef.current?.focus()}
        terminalDrawerOpen={terminalDrawerOpen}
        onToggleTerminalDrawer={() => setTerminalDrawerOpen((prev) => !prev)}
      />

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
        onToggleSidebar={handleSidebarToggle}
        onFocusSearch={() => searchInputRef.current?.focus()}
      />
    </div>
  );
}

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(<App />);
}
