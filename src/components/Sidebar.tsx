import React, { useState, useMemo, useRef, useEffect } from 'react';
import { consoleLogger } from '@workspace/logger';
import { SoulLogo } from './SoulLogo';
import { PackageData, ProjectData } from '../types';
import { DOCUMENTATION_GUIDES_REGISTRY, GuideMeta } from '../features/docs/docsConstants';
import { WORKSPACE_SCRIPTS_REGISTRY } from '../features/scripts/scriptsConstants';
import { PROJECT_BRAND_MAP } from '../features/projects/projectsConstants';

function packageBadge(pkg: PackageData): { text: string; color: string } {
  if (pkg.pythonModule) {
    return { text: 'PY', color: 'bg-amber-500/15 text-amber-400 border-amber-500/30' };
  }
  if (pkg.name?.includes('config')) {
    return { text: 'CFG', color: 'bg-purple-500/15 text-purple-400 border-purple-500/30' };
  }
  return { text: 'TS', color: 'bg-sky-500/15 text-sky-400 border-sky-500/30' };
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

function docGuideBadge(guide: GuideMeta): { text: string; color: string } {
  if (guide.category === 'rules') return { text: 'SPEC', color: 'bg-sky-500/15 text-sky-400 border-sky-500/30' };
  if (guide.category === 'cheatsheet') return { text: 'OPS', color: 'bg-amber-500/15 text-amber-400 border-amber-500/30' };
  if (guide.category === 'design') return { text: 'PKG', color: 'bg-purple-500/15 text-purple-400 border-purple-500/30' };
  if (guide.category === 'ports') return { text: 'PORTS', color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' };
  if (guide.category === 'techstack') return { text: 'STACK', color: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30' };
  return { text: guide.badge?.split(' ')[0] || 'DOC', color: 'bg-sky-500/15 text-sky-400 border-sky-500/30' };
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

function formatProjectTitle(proj: ProjectData): string {
  if (proj.id && PROJECT_BRAND_MAP[proj.id]?.name) {
    return PROJECT_BRAND_MAP[proj.id].name;
  }
  const title = proj.title || proj.id || '';
  return title
    .replace(/\s*-\s*AI Motivational.*/i, '')
    .replace(/\s*-\s*Quote Video.*/i, '')
    .replace(/College Management System/gi, 'College Management')
    .replace(/\bAi\b/g, 'AI')
    .replace(/\bApi\b/g, 'API')
    .replace(/\bCms\b/gi, 'CMS');
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
        className={`fixed top-0 bottom-0 left-0 z-50 w-80 sm:w-[336px] h-screen h-[100dvh] bg-[#111114] border-r border-[#1f1f24] flex flex-col justify-between shadow-2xl shadow-black/80 transition-transform duration-300 ease-out ${
          menuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Monorepo navigation sidebar"
      >
        {/* ── Brand Header ── */}
        <div className="h-14 px-4 flex items-center justify-between border-b border-[#19191d] shrink-0 bg-[#0d0d10]">
          <a
            className="flex items-center gap-2 group"
            href="#overview"
            onClick={(e) => {
              e.preventDefault();
              onNavigate('overview');
            }}
            aria-label="Soul Workspace packages overview"
          >
            <SoulLogo size="md" variant="full" />
          </a>

          <button
            type="button"
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-colors"
            aria-label="Close sidebar (Esc or Ctrl+B)"
            title="Close sidebar (Esc or Ctrl+B)"
            onClick={onClose}
          >
            <svg viewBox="0 0 20 20" width="16" height="16" fill="currentColor" aria-hidden="true">
              <path d="m6 6 8 8M14 6l-8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* ── Unified Workspace Search ── */}
        <div className="px-3.5 py-3 border-b border-[#19191d] shrink-0 bg-[#0d0d10]">
          <div className="relative flex items-center">
            <svg
              className="absolute left-3.5 w-3.5 h-3.5 text-zinc-500 pointer-events-none"
              viewBox="0 0 24 24"
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
              className="w-full bg-[#070708] border border-[#1f1f24] rounded-xl pl-9 pr-8 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400/20 transition-all font-mono"
            />
            {commonFilter ? (
              <button
                type="button"
                className="absolute right-2.5 text-zinc-400 hover:text-white text-xs p-1"
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
              <kbd className="absolute right-2.5 px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#141418] border border-[#24242c] text-zinc-400 pointer-events-none" title="Press / to search">
                /
              </kbd>
            )}
          </div>
        </div>

        {/* ── Scrollable Navigation ── */}
        <nav className="flex-1 overflow-y-auto sidebar-scroll px-3 py-3 flex flex-col gap-4 text-xs font-medium" aria-label="Monorepo navigation">
          {/* Top Global Hubs & Tools */}
          <div className="flex flex-col gap-1.5">
            <button
              type="button"
              aria-current={isActive('overview') ? 'page' : undefined}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all ${
                isActive('overview')
                  ? 'bg-indigo-500/15 text-white font-semibold border-l-2 border-indigo-400 border border-indigo-500/25 shadow-sm'
                  : 'text-zinc-200 hover:text-white hover:bg-white/[0.06] hover:translate-x-1 border border-transparent'
              }`}
              onClick={() => onNavigate('overview')}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-base" aria-hidden="true">🏠</span>
                <span className="truncate font-semibold text-zinc-100">Workspace Overview</span>
              </div>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 shadow-[0_0_8px_rgba(99,102,241,0.15)]">
                Hub
              </span>
            </button>

            <button
              type="button"
              aria-current={(isActive('scripts') || isActive('commands') || isActive('runners')) ? 'page' : undefined}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all ${
                (isActive('scripts') || isActive('commands') || isActive('runners'))
                  ? 'bg-amber-500/15 text-white font-semibold border-l-2 border-amber-400 border border-amber-500/25 shadow-sm'
                  : 'text-zinc-200 hover:text-white hover:bg-white/[0.06] hover:translate-x-1 border border-transparent'
              }`}
              onClick={() => onNavigate('scripts')}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-base" aria-hidden="true">⚡</span>
                <span className="truncate font-semibold text-zinc-100">Scripts &amp; Runners</span>
              </div>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-[0_0_8px_rgba(245,158,11,0.15)]">
                15
              </span>
            </button>
          </div>

          {/* If searching and matching scripts exist */}
          {isFiltering && filteredScripts.length > 0 && (
            <div className="flex flex-col gap-1.5 pt-1">
              <button
                type="button"
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-zinc-100 font-semibold bg-[#151519] border border-white/[0.06]"
                onClick={() => onNavigate('scripts')}
              >
                <div className="flex items-center gap-2.5">
                  <span>⚡</span>
                  <span className="text-zinc-100 font-medium">Matching Scripts</span>
                </div>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-[#111114] text-zinc-200 border border-[#1f1f24]">
                  {filteredScripts.length}
                </span>
              </button>
              <div className="flex flex-col gap-1.5 pl-3 pr-1 py-1">
                {filteredScripts.slice(0, 8).map((s) => (
                  <button
                    type="button"
                    key={s.id}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-zinc-200 hover:text-white hover:bg-white/[0.06] hover:translate-x-1 transition-all text-left"
                    onClick={() => onNavigate('scripts')}
                    title={`${s.name} - ${s.description}`}
                  >
                    <span className="truncate text-zinc-200 font-medium">{s.name}</span>
                    <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-mono shrink-0 bg-neutral-800 text-zinc-200 border border-neutral-700">
                      {s.badge}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="pt-3 pb-1 border-t border-[#1f1f24]/80 flex items-center justify-between px-1">
            <span className="text-[11px] font-mono font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-500" aria-hidden="true" />
              <span>Core Monorepo Pillars</span>
            </span>
          </div>

          {/* Pillar 1: Projects */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between gap-1">
              <button
                type="button"
                aria-current={isActive('projects') ? 'page' : undefined}
                className={`flex-1 flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all ${
                  isActive('projects')
                    ? 'bg-emerald-500/15 text-white font-semibold border-l-2 border-emerald-400 border border-emerald-500/25 shadow-sm'
                    : 'text-zinc-200 hover:text-white hover:bg-white/[0.06] hover:translate-x-1 border border-transparent'
                }`}
                onClick={() => {
                  onNavigate('projects');
                  if (!isProjectsOpen) {
                    toggleSection('projects');
                  }
                }}
                title="Open Projects & Apps Dashboard"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-400 shrink-0">
                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                    <line x1="8" y1="21" x2="16" y2="21" />
                    <line x1="12" y1="17" x2="12" y2="21" />
                  </svg>
                  <span className="font-semibold text-zinc-100">Projects &amp; Apps</span>
                </div>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-[0_0_8px_rgba(16,185,129,0.15)]">
                  {formatCount(isFiltering ? filteredProjects.length : totalProjects)}
                </span>
              </button>

              <button
                type="button"
                className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-all"
                onClick={() => toggleSection('projects')}
                aria-expanded={isProjectsOpen}
                title={isProjectsOpen ? 'Collapse applications list' : 'Expand applications list'}
                aria-label={isProjectsOpen ? 'Collapse applications list' : 'Expand applications list'}
              >
                <svg
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${!isProjectsOpen ? '-rotate-90 text-zinc-500' : 'rotate-0 text-zinc-300'}`}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
            </div>

            {isProjectsOpen && filteredProjects.length > 0 && (
              <div className="flex flex-col gap-1.5 pl-3 pr-1 py-1.5">
                {filteredProjects.slice(0, 50).map((proj) => {
                  const isProjActive = isActive(`projects/${proj.id}`) || isActive(`project/${proj.id}`);
                  return (
                    <button
                      type="button"
                      key={proj.id}
                      aria-current={isProjActive ? 'page' : undefined}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition-all text-left group ${
                        isProjActive
                          ? 'bg-emerald-500/15 text-white font-semibold border-l-2 border-emerald-400 border border-emerald-500/25 shadow-sm'
                          : 'text-zinc-200 hover:text-white hover:bg-white/[0.06] hover:translate-x-1 border border-transparent'
                      }`}
                      onClick={() => onNavigate(`projects/${proj.id}`)}
                      title={proj.title}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <span className="text-base shrink-0 transition-transform group-hover:scale-110" aria-hidden="true">
                          {projectSidebarIcon(proj)}
                        </span>
                        <span className="truncate font-medium text-zinc-100 group-hover:text-white transition-colors">{formatProjectTitle(proj)}</span>
                      </div>
                      {proj.frontendPort && (
                        <span className="ml-2 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold shrink-0 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-[0_0_8px_rgba(16,185,129,0.15)] inline-flex items-center gap-1.5">
                          <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400"></span>
                          </span>
                          <span>:{proj.frontendPort}</span>
                        </span>
                      )}
                    </button>
                  );
                })}

                {filteredProjects.length > 50 && (
                  <button
                    type="button"
                    className="text-left px-3 py-1.5 text-xs text-zinc-300 hover:text-white hover:underline"
                    onClick={() => onNavigate('projects')}
                  >
                    + View all {totalProjects.toLocaleString()} apps in dashboard →
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Pillar 2: Packages */}
          <div className="flex flex-col gap-1.5 pt-1">
            <div className="flex items-center justify-between gap-1">
              <button
                type="button"
                aria-current={(isActive('packages') || isActive('packages-dashboard')) ? 'page' : undefined}
                className={`flex-1 flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all ${
                  (isActive('packages') || isActive('packages-dashboard'))
                    ? 'bg-purple-500/15 text-white font-semibold border-l-2 border-purple-400 border border-purple-500/25 shadow-sm'
                    : 'text-zinc-200 hover:text-white hover:bg-white/[0.06] hover:translate-x-1 border border-transparent'
                }`}
                onClick={() => {
                  onNavigate('packages');
                  if (!isPackagesOpen) {
                    toggleSection('packages');
                  }
                }}
                title="Open Packages Dashboard"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" className="text-purple-400 shrink-0">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                    <line x1="12" y1="22.08" x2="12" y2="12" />
                  </svg>
                  <span className="font-semibold text-zinc-100">Shared Packages</span>
                </div>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-purple-500/15 text-purple-400 border border-purple-500/30 shadow-[0_0_8px_rgba(168,85,247,0.15)]">
                  {formatCount(isFiltering ? filteredPackages.length : packages.length)}
                </span>
              </button>

              <button
                type="button"
                className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-all"
                onClick={() => toggleSection('packages')}
                aria-expanded={isPackagesOpen}
                title={isPackagesOpen ? 'Collapse packages list' : 'Expand packages list'}
                aria-label={isPackagesOpen ? 'Collapse packages list' : 'Expand packages list'}
              >
                <svg
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${!isPackagesOpen ? '-rotate-90 text-zinc-500' : 'rotate-0 text-zinc-300'}`}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
            </div>

            {isPackagesOpen && (
              <div className="flex flex-col gap-1.5 pl-3 pr-1 py-1.5">
                {filteredPackages.slice(0, 50).map((pkg) => {
                  const badge = packageBadge(pkg);
                  const icon = packageSidebarIcon(pkg);
                  const isPkgActive = isActive(`packages/${pkg.id}`) || isActive(`package/${pkg.id}`) || isActive(pkg.id);

                  return (
                    <button
                      type="button"
                      key={pkg.id}
                      aria-current={isPkgActive ? 'page' : undefined}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition-all text-left group ${
                        isPkgActive
                          ? 'bg-purple-500/15 text-white font-semibold border-l-2 border-purple-400 border border-purple-500/25 shadow-sm'
                          : 'text-zinc-200 hover:text-white hover:bg-white/[0.06] hover:translate-x-1 border border-transparent'
                      }`}
                      onClick={() => onNavigate(`packages/${pkg.id}`)}
                      title={pkg.displayName || pkg.name}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <span className="text-base shrink-0 transition-transform group-hover:scale-110" aria-hidden="true">
                          {icon}
                        </span>
                        <span className="truncate font-mono font-medium text-zinc-100 group-hover:text-white transition-colors">{pkg.displayName || pkg.name}</span>
                      </div>
                      <span className={`ml-2 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold shrink-0 border ${badge.color} inline-flex items-center gap-1.5`}>
                        <span className="relative flex h-1.5 w-1.5">
                          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${pkg.pythonModule ? 'bg-amber-400' : pkg.name?.includes('config') ? 'bg-purple-400' : 'bg-sky-400'} opacity-75`}></span>
                          <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${pkg.pythonModule ? 'bg-amber-400' : pkg.name?.includes('config') ? 'bg-purple-400' : 'bg-sky-400'}`}></span>
                        </span>
                        <span>{badge.text}</span>
                      </span>
                    </button>
                  );
                })}

                {filteredPackages.length > 50 && (
                  <button
                    type="button"
                    className="text-left px-3 py-1.5 text-xs text-zinc-300 hover:text-white hover:underline"
                    onClick={() => onNavigate('packages')}
                  >
                    + View all {packages.length.toLocaleString()} packages in dashboard →
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Pillar 3: Documentation */}
          <div className="flex flex-col gap-1.5 pt-1">
            <div className="flex items-center justify-between gap-1">
              <button
                type="button"
                aria-current={(isActive('docs') || isActive('docs-dashboard')) ? 'page' : undefined}
                className={`flex-1 flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all ${
                  (isActive('docs') || isActive('docs-dashboard')) ? 'bg-sky-500/15 text-white font-semibold border-l-2 border-sky-400 border border-sky-500/25 shadow-sm' : 'text-zinc-200 hover:text-white hover:bg-white/[0.06] hover:translate-x-1 border border-transparent'
                }`}
                onClick={() => {
                  onNavigate('docs');
                  if (!isDocsOpen) {
                    toggleSection('docs');
                  }
                }}
                title="Open Docs Dashboard"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-base shrink-0" aria-hidden="true">📚</span>
                  <span className="font-semibold text-zinc-100">Documentation</span>
                </div>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-sky-500/15 text-sky-400 border border-sky-500/30 shadow-[0_0_8px_rgba(56,189,248,0.15)]">
                  {formatCount(isFiltering ? filteredGuides.length : DOCUMENTATION_GUIDES_REGISTRY.length)}
                </span>
              </button>

              <button
                type="button"
                className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-all"
                onClick={() => toggleSection('docs')}
                aria-expanded={isDocsOpen}
                title={isDocsOpen ? 'Collapse documentation guides' : 'Expand documentation guides'}
                aria-label={isDocsOpen ? 'Collapse documentation guides' : 'Expand documentation guides'}
              >
                <svg
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${!isDocsOpen ? '-rotate-90 text-zinc-500' : 'rotate-0 text-zinc-300'}`}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
            </div>

            {isDocsOpen && (
              <div className="flex flex-col gap-1.5 pl-3 pr-1 py-1.5">
                {filteredGuides.slice(0, 50).map((guide) => {
                  const isGuideActive = isDocGuideActive(active, guide);
                  const targetRoute = docGuideRoute(guide);
                  const badge = docGuideBadge(guide);

                  return (
                    <button
                      type="button"
                      key={guide.id}
                      aria-current={isGuideActive ? 'page' : undefined}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition-all text-left group ${
                        isGuideActive
                          ? 'bg-sky-500/15 text-white font-semibold border-l-2 border-sky-400 border border-sky-500/25 shadow-sm'
                          : 'text-zinc-200 hover:text-white hover:bg-white/[0.06] hover:translate-x-1 border border-transparent'
                      }`}
                      onClick={() => onNavigate(targetRoute)}
                      title={guide.title}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <span className="text-base shrink-0 transition-transform group-hover:scale-110" aria-hidden="true">
                          {guide.icon}
                        </span>
                        <span className="truncate font-medium text-zinc-100 group-hover:text-white transition-colors">{formatDocGuideTitle(guide)}</span>
                      </div>
                      <span className={`ml-2 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold shrink-0 border ${badge.color}`}>
                        {badge.text}
                      </span>
                    </button>
                  );
                })}

                {filteredGuides.length > 50 && (
                  <button
                    type="button"
                    className="text-left px-3 py-1.5 text-xs text-zinc-300 hover:text-white hover:underline"
                    onClick={() => onNavigate('docs')}
                  >
                    + View all {DOCUMENTATION_GUIDES_REGISTRY.length.toLocaleString()} guides in hub →
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Empty Search Feedback */}
          {isFiltering && totalMatches === 0 && (
            <div className="flex flex-col items-center justify-center p-6 text-center rounded-xl bg-[#151519] border border-[#1f1f24] gap-2 mt-2">
              <span className="text-xl" aria-hidden="true">🔍</span>
              <p className="text-xs text-zinc-300">No matches found for &ldquo;{commonFilter}&rdquo;</p>
              <button
                type="button"
                className="mt-1 px-3 py-1.5 rounded-md text-xs font-semibold bg-[#111114] hover:bg-[#151519] text-zinc-100 border border-[#1f1f24] transition-colors"
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

        {/* ── Footer ── */}
        <div className="p-4 border-t border-[#19191d] bg-[#09090b] flex items-center justify-between text-xs shrink-0">
          <div className="flex items-center gap-3">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.9)]"></span>
            </span>
            <div className="flex flex-col">
              <strong className="text-xs font-semibold text-zinc-100 leading-tight">4 Pillars Synced</strong>
              <small className="text-[11px] text-zinc-400 font-mono leading-tight mt-0.5">
                {packages.length} packages · {totalProjects} apps indexed
              </small>
            </div>
          </div>
          <span className="w-6 h-6 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center text-xs font-bold shadow-[0_0_8px_rgba(16,185,129,0.25)]" aria-label="Ready">
            ✓
          </span>
        </div>
      </aside>

      {/* ── Backdrop Overlay ── */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-md transition-opacity duration-200"
          aria-label="Close menu"
          onClick={onClose}
        />
      )}
    </>
  );
}
