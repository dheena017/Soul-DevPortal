import React, { useState, useMemo, useRef, useEffect } from 'react';
import { consoleLogger } from '@workspace/logger';
import { SoulLogo } from './SoulLogo';
import { PackageData, ProjectData } from '../types';
import { DOCUMENTATION_GUIDES_REGISTRY, GuideMeta } from '../features/docs/docsConstants';
import { WORKSPACE_SCRIPTS_REGISTRY } from '../features/scripts/scriptsConstants';
import { PROJECT_BRAND_MAP } from '../features/projects/projectsConstants';

function packageBadge(pkg: PackageData, isActive: boolean = false): { text: string; color: string } {
  const text = pkg.pythonModule ? 'PY' : pkg.name?.includes('config') ? 'CFG' : 'TS';
  if (isActive) {
    return { text, color: 'bg-purple-500/15 text-purple-300 border-purple-500/30 font-bold' };
  }
  return { text, color: 'bg-white/[0.04] text-zinc-400 border-white/[0.08]' };
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

function docGuideBadge(guide: GuideMeta, isActive: boolean = false): { text: string; color: string } {
  let text = 'DOC';
  if (guide.id === 'project-architecture' || guide.category === 'rules') text = 'SPEC';
  else if (guide.id === 'cheatsheets' || guide.category === 'cheatsheet') text = 'OPS';
  else if (guide.id === 'packages-architecture' || guide.category === 'design') text = 'PKG';
  else if (guide.id === 'networking-and-ports' || guide.category === 'ports') text = 'PORTS';
  else text = guide.badge?.split(' ')[0] || 'DOC';

  if (isActive) {
    return { text, color: 'bg-sky-500/15 text-sky-300 border-sky-500/30 font-bold' };
  }
  return { text, color: 'bg-white/[0.04] text-zinc-400 border-white/[0.08]' };
}

function formatDocGuideTitle(guide: GuideMeta): string {
  if (guide.id === 'project-architecture' || guide.id === 'rules') return 'Project Architecture';
  if (guide.id === 'packages-architecture' || guide.id === 'design') return 'Packages Architecture';
  if (guide.id === 'networking-and-ports' || guide.id === 'ports') return 'Port Architecture';
  if (guide.id === 'cheatsheets' || guide.id === 'cheatsheet') return 'Compliance Cheatsheet';
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
  if (guide.aliases && guide.aliases.some((alias) => active === `docs/${alias}` || active === `doc/${alias}` || active === alias)) {
    return true;
  }
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
        className={`fixed top-0 bottom-0 left-0 z-50 w-[min(86vw,20rem)] sm:w-[336px] h-screen h-[100dvh] bg-[#0d0d10] border-r border-white/[0.08] flex flex-col justify-between shadow-2xl shadow-black/80 transition-transform duration-300 ease-out ${
          menuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Monorepo navigation sidebar"
      >
        {/* ── Brand Header ── */}
        <div className="h-14 px-4 flex items-center justify-between border-b border-white/[0.08] shrink-0 bg-[#09090c]">
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
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
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
        <div className="px-3.5 py-3 border-b border-white/[0.08] shrink-0 bg-[#09090c]">
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
              className="w-full bg-[#070708] border border-white/[0.08] rounded-xl pl-9 pr-8 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400/20 transition-all font-mono"
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
          <div className="flex flex-col gap-1">
            <button
              type="button"
              aria-current={isActive('overview') ? 'page' : undefined}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all ${
                isActive('overview')
                  ? 'bg-white/[0.08] text-white font-semibold border border-white/15 shadow-sm'
                  : 'text-zinc-300 hover:text-white hover:bg-white/[0.04] border border-transparent'
              }`}
              onClick={() => onNavigate('overview')}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="text-base" aria-hidden="true">🏠</span>
                <span className="truncate font-semibold text-zinc-100">Workspace Overview</span>
              </div>
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold border ${
                isActive('overview')
                  ? 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30 font-bold'
                  : 'bg-white/[0.04] text-zinc-400 border-white/[0.08]'
              }`}>
                Hub
              </span>
            </button>

            <button
              type="button"
              aria-current={(isActive('scripts') || isActive('commands') || isActive('runners')) ? 'page' : undefined}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all ${
                (isActive('scripts') || isActive('commands') || isActive('runners'))
                  ? 'bg-white/[0.08] text-white font-semibold border border-white/15 shadow-sm'
                  : 'text-zinc-300 hover:text-white hover:bg-white/[0.04] border border-transparent'
              }`}
              onClick={() => onNavigate('scripts')}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="text-base" aria-hidden="true">⚡</span>
                <span className="truncate font-semibold text-zinc-100">Scripts &amp; Runners</span>
              </div>
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold border ${
                (isActive('scripts') || isActive('commands') || isActive('runners'))
                  ? 'bg-amber-500/15 text-amber-300 border-amber-500/30 font-bold'
                  : 'bg-white/[0.04] text-zinc-400 border-white/[0.08]'
              }`}>
                15
              </span>
            </button>

            <button
              type="button"
              aria-current={(isActive('computer') || isActive('system')) ? 'page' : undefined}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all ${
                (isActive('computer') || isActive('system'))
                  ? 'bg-white/[0.08] text-white font-semibold border border-white/15 shadow-sm'
                  : 'text-zinc-300 hover:text-white hover:bg-white/[0.04] border border-transparent'
              }`}
              onClick={() => onNavigate('computer')}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <svg
                  className={`w-4 h-4 shrink-0 ${(isActive('computer') || isActive('system')) ? 'text-sky-400' : 'text-zinc-400'}`}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                  <line x1="8" y1="21" x2="16" y2="21" />
                  <line x1="12" y1="17" x2="12" y2="21" />
                </svg>
                <span className="truncate font-semibold text-zinc-100">Computer &amp; Performance</span>
              </div>
              <span
                className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold border ${
                  (isActive('computer') || isActive('system'))
                    ? 'bg-sky-500/15 text-sky-300 border-sky-400/35 font-bold'
                    : 'bg-white/[0.04] text-zinc-400 border-white/[0.08]'
                }`}
              >
                Live
              </span>
            </button>
          </div>

          {/* If searching and matching scripts exist */}
          {isFiltering && filteredScripts.length > 0 && (
            <div className="flex flex-col gap-1 pt-1">
              <button
                type="button"
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-zinc-100 font-semibold bg-[#16161c] border border-white/[0.08]"
                onClick={() => onNavigate('scripts')}
              >
                <div className="flex items-center gap-2.5">
                  <span>⚡</span>
                  <span className="text-zinc-100 font-medium">Matching Scripts</span>
                </div>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-white/[0.04] text-zinc-300 border border-white/[0.08]">
                  {filteredScripts.length}
                </span>
              </button>
              <div className="ml-4 pl-3.5 border-l border-white/[0.08] flex flex-col gap-1 my-1">
                {filteredScripts.slice(0, 8).map((s) => (
                  <button
                    type="button"
                    key={s.id}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.04] transition-all text-left"
                    onClick={() => onNavigate('scripts')}
                    title={`${s.name} - ${s.description}`}
                  >
                    <span className="truncate font-medium text-xs">{s.name}</span>
                    <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-mono shrink-0 bg-white/[0.04] text-zinc-400 border border-white/[0.06]">
                      {s.badge}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="pt-2 pb-1 border-t border-white/[0.06] flex items-center justify-between px-1">
            <span className="text-[11px] font-mono font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-500" aria-hidden="true" />
              <span>Core Monorepo Pillars</span>
            </span>
          </div>

          {/* Pillar 1: Projects & Applications */}
          {(() => {
            const isProjectsMainActive = isActive('projects');
            const isProjectsChildActive = active.startsWith('projects/') || active.startsWith('project/');

            return (
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between gap-1">
                  <button
                    type="button"
                    aria-current={isProjectsMainActive ? 'page' : undefined}
                    className={`flex-1 flex items-center justify-between px-3 py-2 rounded-xl transition-all ${
                      isProjectsMainActive
                        ? 'bg-white/[0.08] text-white font-bold border border-white/15 shadow-sm'
                        : isProjectsChildActive
                        ? 'text-white font-semibold bg-white/[0.03] border border-white/[0.08]'
                        : 'text-zinc-300 hover:text-white hover:bg-white/[0.04] border border-transparent'
                    }`}
                    onClick={() => {
                      onNavigate('projects');
                      if (!isProjectsOpen) {
                        toggleSection('projects');
                      }
                    }}
                    title="Open Projects & Apps Dashboard"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-400 shrink-0">
                        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                        <line x1="8" y1="21" x2="16" y2="21" />
                        <line x1="12" y1="17" x2="12" y2="21" />
                      </svg>
                      <span className="font-semibold text-zinc-100">Projects &amp; Apps</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold border ${
                      isProjectsMainActive
                        ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 font-bold'
                        : 'bg-white/[0.04] text-zinc-400 border-white/[0.08]'
                    }`}>
                      {formatCount(isFiltering ? filteredProjects.length : totalProjects)}
                    </span>
                  </button>

                  <button
                    type="button"
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-all"
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
                  <div className="ml-4 pl-3.5 border-l border-white/[0.08] flex flex-col gap-1 my-1">
                    {filteredProjects.slice(0, 50).map((proj) => {
                      const isProjActive = isActive(`projects/${proj.id}`) || isActive(`project/${proj.id}`);
                      return (
                        <button
                          type="button"
                          key={proj.id}
                          aria-current={isProjActive ? 'page' : undefined}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-all text-left group ${
                            isProjActive
                              ? 'bg-white/[0.08] text-white font-semibold border border-white/15 shadow-sm'
                              : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.04] border border-transparent'
                          }`}
                          onClick={() => onNavigate(`projects/${proj.id}`)}
                          title={proj.title}
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            {isProjActive && (
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)] shrink-0" />
                            )}
                            <span className="text-sm shrink-0 transition-transform group-hover:scale-105" aria-hidden="true">
                              {projectSidebarIcon(proj)}
                            </span>
                            <span className="truncate font-medium group-hover:text-white transition-colors">{formatProjectTitle(proj)}</span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0 ml-2">
                            {proj.relativeTime && (
                              <span className="text-[11px] font-mono text-zinc-300 transition-colors" title={`Last modified: ${proj.updatedAt || proj.relativeTime}`}>
                                {proj.relativeTime}
                              </span>
                            )}
                            {proj.frontendPort && (
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono shrink-0 transition-colors ${
                                isProjActive
                                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-bold'
                                  : 'bg-white/[0.04] text-zinc-400 border border-white/[0.06] group-hover:text-zinc-300 group-hover:border-white/10'
                              }`}>
                                :{proj.frontendPort}
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}

                    {filteredProjects.length > 50 && (
                      <button
                        type="button"
                        className="text-left px-2.5 py-1 text-xs text-zinc-400 hover:text-white hover:underline cursor-pointer"
                        onClick={() => onNavigate('projects')}
                      >
                        + View all {totalProjects.toLocaleString()} apps in dashboard →
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })()}

          {/* Pillar 2: Shared Packages */}
          {(() => {
            const isPackagesMainActive = isActive('packages') || isActive('packages-dashboard');
            const isPackagesChildActive = active.startsWith('packages/') || active.startsWith('package/') || ['logger', 'runner', 'config'].includes(active);

            return (
              <div className="flex flex-col gap-1 pt-1">
                <div className="flex items-center justify-between gap-1">
                  <button
                    type="button"
                    aria-current={isPackagesMainActive ? 'page' : undefined}
                    className={`flex-1 flex items-center justify-between px-3 py-2 rounded-xl transition-all ${
                      isPackagesMainActive
                        ? 'bg-white/[0.08] text-white font-bold border border-white/15 shadow-sm'
                        : isPackagesChildActive
                        ? 'text-white font-semibold bg-white/[0.03] border border-white/[0.08]'
                        : 'text-zinc-300 hover:text-white hover:bg-white/[0.04] border border-transparent'
                    }`}
                    onClick={() => {
                      onNavigate('packages');
                      if (!isPackagesOpen) {
                        toggleSection('packages');
                      }
                    }}
                    title="Open Packages Dashboard"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" className="text-purple-400 shrink-0">
                        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                        <line x1="12" y1="22.08" x2="12" y2="12" />
                      </svg>
                      <span className="font-semibold text-zinc-100">Shared Packages</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold border ${
                      isPackagesMainActive
                        ? 'bg-purple-500/15 text-purple-300 border-purple-500/30 font-bold'
                        : 'bg-white/[0.04] text-zinc-400 border-white/[0.08]'
                    }`}>
                      {formatCount(isFiltering ? filteredPackages.length : packages.length)}
                    </span>
                  </button>

                  <button
                    type="button"
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-all"
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
                  <div className="ml-4 pl-3.5 border-l border-white/[0.08] flex flex-col gap-1 my-1">
                    {filteredPackages.slice(0, 50).map((pkg) => {
                      const isPkgActive = isActive(`packages/${pkg.id}`) || isActive(`package/${pkg.id}`) || isActive(pkg.id);
                      const badge = packageBadge(pkg, isPkgActive);
                      const icon = packageSidebarIcon(pkg);

                      return (
                        <button
                          type="button"
                          key={pkg.id}
                          aria-current={isPkgActive ? 'page' : undefined}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-all text-left group ${
                            isPkgActive
                              ? 'bg-white/[0.08] text-white font-semibold border border-white/15 shadow-sm'
                              : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.04] border border-transparent'
                          }`}
                          onClick={() => onNavigate(`packages/${pkg.id}`)}
                          title={pkg.displayName || pkg.name}
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            {isPkgActive && (
                              <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shadow-[0_0_8px_rgba(192,132,252,0.9)] shrink-0" />
                            )}
                            <span className="text-sm shrink-0 transition-transform group-hover:scale-105" aria-hidden="true">
                              {icon}
                            </span>
                            <span className="truncate font-mono font-medium group-hover:text-white transition-colors">{pkg.displayName || pkg.name}</span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0 ml-2">
                            {pkg.relativeTime && (
                              <span className="text-[11px] font-mono text-zinc-300 transition-colors" title={`Last commit: ${pkg.updatedAt || pkg.relativeTime}`}>
                                {pkg.relativeTime}
                              </span>
                            )}
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono shrink-0 border transition-colors ${badge.color}`}>
                              {badge.text}
                            </span>
                          </div>
                        </button>
                      );
                    })}

                    {filteredPackages.length > 50 && (
                      <button
                        type="button"
                        className="text-left px-2.5 py-1 text-xs text-zinc-400 hover:text-white hover:underline cursor-pointer"
                        onClick={() => onNavigate('packages')}
                      >
                        + View all {packages.length.toLocaleString()} packages in dashboard →
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })()}

          {/* Pillar 3: Documentation */}
          {(() => {
            const isDocsMainActive = isActive('docs') || isActive('docs-dashboard');
            const isDocsChildActive = active.startsWith('docs/') || active.startsWith('doc/') || ['project-architecture', 'rules', 'projects-rules', 'packages-architecture', 'design', 'packages-design', 'guide', 'networking-and-ports', 'ports', 'port-architecture', 'ports-guide', 'techstack', 'tech-stack', 'cheatsheets', 'cheatsheet', 'compliance-cheatsheet'].includes(active);

            return (
              <div className="flex flex-col gap-1 pt-1">
                <div className="flex items-center justify-between gap-1">
                  <button
                    type="button"
                    aria-current={isDocsMainActive ? 'page' : undefined}
                    className={`flex-1 flex items-center justify-between px-3 py-2 rounded-xl transition-all ${
                      isDocsMainActive
                        ? 'bg-white/[0.08] text-white font-bold border border-white/15 shadow-sm'
                        : isDocsChildActive
                        ? 'text-white font-semibold bg-white/[0.03] border border-white/[0.08]'
                        : 'text-zinc-300 hover:text-white hover:bg-white/[0.04] border border-transparent'
                    }`}
                    onClick={() => {
                      onNavigate('docs');
                      if (!isDocsOpen) {
                        toggleSection('docs');
                      }
                    }}
                    title="Open Docs Dashboard"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-base shrink-0" aria-hidden="true">📚</span>
                      <span className="font-semibold text-zinc-100">Documentation</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold border ${
                      isDocsMainActive
                        ? 'bg-sky-500/15 text-sky-300 border-sky-500/30 font-bold'
                        : 'bg-white/[0.04] text-zinc-400 border-white/[0.08]'
                    }`}>
                      {formatCount(isFiltering ? filteredGuides.length : DOCUMENTATION_GUIDES_REGISTRY.length)}
                    </span>
                  </button>

                  <button
                    type="button"
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-all"
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
                  <div className="ml-4 pl-3.5 border-l border-white/[0.08] flex flex-col gap-1 my-1">
                    {filteredGuides.slice(0, 50).map((guide) => {
                      const isGuideActive = isDocGuideActive(active, guide);
                      const targetRoute = docGuideRoute(guide);
                      const badge = docGuideBadge(guide, isGuideActive);

                      return (
                        <button
                          type="button"
                          key={guide.id}
                          aria-current={isGuideActive ? 'page' : undefined}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-all text-left group ${
                            isGuideActive
                              ? 'bg-white/[0.08] text-white font-semibold border border-white/15 shadow-sm'
                              : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.04] border border-transparent'
                          }`}
                          onClick={() => onNavigate(targetRoute)}
                          title={guide.title}
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            {isGuideActive && (
                              <span className="w-1.5 h-1.5 rounded-full bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.9)] shrink-0" />
                            )}
                            <span className="text-sm shrink-0 transition-transform group-hover:scale-105" aria-hidden="true">
                              {guide.icon}
                            </span>
                            <span className="truncate font-medium group-hover:text-white transition-colors">{formatDocGuideTitle(guide)}</span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0 ml-2">
                            {guide.relativeTime && (
                              <span className="text-[11px] font-mono text-zinc-300 transition-colors" title={`Last updated: ${guide.updatedAt || guide.relativeTime}`}>
                                {guide.relativeTime}
                              </span>
                            )}
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono shrink-0 border transition-colors ${badge.color}`}>
                              {badge.text}
                            </span>
                          </div>
                        </button>
                      );
                    })}

                    {filteredGuides.length > 50 && (
                      <button
                        type="button"
                        className="text-left px-2.5 py-1 text-xs text-zinc-400 hover:text-white hover:underline cursor-pointer"
                        onClick={() => onNavigate('docs')}
                      >
                        + View all {DOCUMENTATION_GUIDES_REGISTRY.length.toLocaleString()} guides in hub →
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })()}

          {/* Empty Search Feedback */}
          {isFiltering && totalMatches === 0 && (
            <div className="flex flex-col items-center justify-center p-6 text-center rounded-xl bg-[#0d0d10] border border-white/[0.08] gap-2 mt-2">
              <span className="text-xl" aria-hidden="true">🔍</span>
              <p className="text-xs text-zinc-300">No matches found for &ldquo;{commonFilter}&rdquo;</p>
              <button
                type="button"
                className="mt-1 px-3 py-1.5 rounded-md text-xs font-bold bg-white text-zinc-950 hover:bg-zinc-200 transition-colors cursor-pointer"
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
        <div className="p-4 border-t border-white/[0.08] bg-[#070708] flex items-center justify-between text-xs shrink-0">
          <div className="flex items-center gap-3">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.9)]"></span>
            </span>
            <div className="flex flex-col">
              <strong className="text-xs font-semibold text-white leading-tight">4 Pillars Synced</strong>
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
