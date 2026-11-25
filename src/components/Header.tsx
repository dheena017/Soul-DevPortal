import React, { useState, useEffect } from 'react';
import { consoleLogger } from '@workspace/logger';
import { SoulLogoIcon } from './SoulLogo';
import { HeaderEqualizerBars, MiniRadialRing } from './PortalVisuals';
import { checkBackendHealth, fetchSystemLive } from '../services/api';

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
  onTriggerReload?: () => void;
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
  onTriggerReload,
}) => {
  const isProjectsActive = active.startsWith('project');
  const isPackagesActive = active.startsWith('package') || ['logger', 'runner', 'config'].includes(active);
  const isDocsActive =
    active.startsWith('doc') ||
    ['rules', 'projects-rules', 'design', 'packages-design', 'guide', 'ports', 'port-architecture', 'ports-guide', 'techstack', 'tech-stack', 'cheatsheet', 'compliance-cheatsheet'].includes(active);

  const [isBackendLive, setIsBackendLive] = useState<boolean>(false);
  const [quickTelemetry, setQuickTelemetry] = useState<{ cpu: number; ram: number } | null>(null);

  useEffect(() => {
    let mounted = true;
    if (!isBackendLive) return;

    const pull = async () => {
      if (document.hidden) return;
      const snap = await fetchSystemLive();
      if (mounted && snap) {
        setQuickTelemetry({
          cpu: Math.round(snap.cpu.totalPercent),
          ram: Math.round(snap.memory.percent),
        });
      }
    };
    pull();
    const id = window.setInterval(pull, 6000);
    return () => {
      mounted = false;
      window.clearInterval(id);
    };
  }, [isBackendLive]);

  useEffect(() => {
    let isMounted = true;
    async function probe() {
      if (typeof document !== 'undefined' && document.hidden) return;
      const live = await checkBackendHealth();
      if (isMounted) setIsBackendLive(live);
    }
    probe();
    const timer = setInterval(probe, 20000);
    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, []);

  return (
    <header className="w-full h-14 bg-[#0d0d10] border-b border-white/[0.08] px-4 flex items-center justify-between gap-4 sticky top-0 z-30 shrink-0 transition-[filter,opacity] duration-200" role="banner">
      {/* ── Left: Sidebar Toggle & Breadcrumbs ── */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <button
          type="button"
          className="p-2 rounded-full bg-[#16161c] border border-white/[0.08] text-zinc-300 hover:text-white hover:border-white/[0.2] hover:bg-white/[0.06] hover:scale-105 active:scale-95 transition-all shrink-0 shadow-sm cursor-pointer"
          onClick={() => {
            consoleLogger.action('UI', menuOpen ? 'Closing sidebar navigation' : 'Opening sidebar navigation');
            onToggleSidebar();
          }}
          aria-expanded={menuOpen}
          aria-label={menuOpen ? 'Close sidebar navigation (Ctrl+B)' : 'Open sidebar navigation (Ctrl+B)'}
        >
          {menuOpen ? (
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : (
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          )}
        </button>

        <nav className="flex items-center gap-1.5 sm:gap-2 text-xs shrink-0" aria-label="Breadcrumb navigation">
          <button
            type="button"
            className="group inline-flex items-center gap-1.5 sm:gap-2 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full bg-[#16161c] border border-white/[0.08] hover:border-sky-400/35 hover:bg-white/[0.06] hover:scale-[1.02] active:scale-[0.98] font-mono text-zinc-200 hover:text-white transition-all shrink-0 shadow-sm cursor-pointer"
            onClick={() => onNavigate('overview')}
            title="Go to Overview Dashboard"
          >
            <SoulLogoIcon size={19} className="group-hover:scale-110 transition-transform" />
            <span className="font-semibold text-zinc-200 hidden sm:inline">soul</span>
            <span className="text-zinc-600 font-bold hidden sm:inline">/</span>
            <strong className="text-zinc-100 font-bold text-[11px] sm:text-xs">dev-portal</strong>
          </button>

          {breadcrumbs.slice(1).map((crumb, idx) => {
            const isLast = idx === breadcrumbs.slice(1).length - 1;
            return (
              <div
                key={`${active}-${idx}`}
                style={{ animationDelay: `${idx * 45}ms` }}
                className={`${isLast ? 'flex shrink-0' : 'hidden xl:flex shrink-0'} items-center gap-1.5 sm:gap-2 portal-crumb-enter`}
              >
                <span className="text-zinc-600 font-bold px-0.5 shrink-0">/</span>
                {crumb.id ? (
                  <button
                    type="button"
                    className="inline-flex items-center px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full bg-[#16161c] border border-white/[0.08] hover:border-white/[0.2] hover:bg-white/[0.06] text-zinc-200 hover:text-white transition-all truncate font-medium max-w-[115px] sm:max-w-[160px]"
                    onClick={() => onNavigate(crumb.id!)}
                    title={`Go to ${crumb.label}`}
                  >
                    {crumb.label}
                  </button>
                ) : (
                  <span
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full bg-[#1a1a22] border border-white/15 text-white font-semibold shadow-sm truncate max-w-[125px] sm:max-w-[175px]"
                    title={crumb.label}
                  >
                    {breadcrumbs.length > 2 && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                    )}
                    <span className="truncate">{crumb.label}</span>
                  </span>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      {/* ── Center: Omni Command Search ── */}
      <div className="relative flex-1 min-w-[140px] max-w-xs hidden xl:flex items-center" role="search">
        <svg className="absolute left-3.5 w-3.5 h-3.5 text-zinc-500 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          ref={searchInputRef as React.RefObject<HTMLInputElement>}
          value={query}
          onChange={onSearchChange}
          placeholder="Search apps, packages, docs..."
          aria-label="Search package and application documentation"
          className="w-full h-8 pl-9 pr-8 rounded-full bg-[#09090c] border border-white/[0.08] text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-400 font-mono transition-all"
        />
        {query ? (
          <button
            type="button"
            className="absolute right-2.5 text-xs text-zinc-400 hover:text-white p-1"
            onClick={onClearSearch}
            aria-label="Clear search input"
          >
            ✕
          </button>
        ) : (
          <kbd className="absolute right-2.5 px-1.5 py-0.5 rounded bg-[#16161c] border border-white/[0.08] text-[10px] text-zinc-400 font-mono">
            /
          </kbd>
        )}
      </div>

      {/* ── Right: Navigation Tabs, GitHub Link & Shortcuts ── */}
      <div className="flex items-center gap-2 shrink-0">
        <nav className="flex items-center gap-1 p-1 bg-[#09090c] border border-white/[0.08] rounded-xl hidden sm:flex" role="tablist" aria-label="Portal Dashboards">
          <button
            type="button"
            role="tab"
            aria-selected={active === 'overview'}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              active === 'overview' ? 'bg-zinc-800 text-white font-bold shadow-sm border border-white/20' : 'text-zinc-400 hover:text-white hover:bg-white/[0.06] border border-transparent'
            }`}
            onClick={() => onNavigate('overview')}
            title="Overview Dashboard"
          >
            <svg className={`w-3.5 h-3.5 shrink-0 ${active === 'overview' ? 'text-sky-300' : 'text-zinc-500'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="3" width="7" height="9" rx="1" />
              <rect x="14" y="3" width="7" height="5" rx="1" />
              <rect x="14" y="12" width="7" height="9" rx="1" />
              <rect x="3" y="16" width="7" height="5" rx="1" />
            </svg>
            <span>Overview</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={isProjectsActive}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              isProjectsActive ? 'bg-zinc-800 text-white font-bold shadow-sm border border-white/20' : 'text-zinc-400 hover:text-white hover:bg-white/[0.06] border border-transparent'
            }`}
            onClick={() => onNavigate('projects')}
            title={`Pillar 1: Applications (${projectsCount})`}
          >
            <svg className={`w-3.5 h-3.5 shrink-0 ${isProjectsActive ? 'text-emerald-400' : 'text-zinc-500'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="2" y="3" width="20" height="14" rx="2" />
              <line x1="8" y1="21" x2="16" y2="21" />
              <line x1="12" y1="17" x2="12" y2="21" />
            </svg>
            <span>Projects</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${isProjectsActive ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/35 font-bold' : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'}`}>
              {projectsCount}
            </span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={isPackagesActive}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              isPackagesActive ? 'bg-zinc-800 text-white font-bold shadow-sm border border-white/20' : 'text-zinc-400 hover:text-white hover:bg-white/[0.06] border border-transparent'
            }`}
            onClick={() => onNavigate('packages')}
            title={`Pillar 2: Shared Libraries (${packagesCount})`}
          >
            <svg className={`w-3.5 h-3.5 shrink-0 ${isPackagesActive ? 'text-purple-400' : 'text-zinc-500'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
              <line x1="12" y1="22.08" x2="12" y2="12" />
            </svg>
            <span>Packages</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${isPackagesActive ? 'bg-purple-500/20 text-purple-300 border border-purple-500/35 font-bold' : 'bg-purple-500/15 text-purple-400 border border-purple-500/25'}`}>
              {packagesCount}
            </span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={isDocsActive}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              isDocsActive ? 'bg-zinc-800 text-white font-bold shadow-sm border border-white/20' : 'text-zinc-400 hover:text-white hover:bg-white/[0.06] border border-transparent'
            }`}
            onClick={() => onNavigate('docs')}
            title={`Pillar 3: Documentation Hub (${docsCount} Guides)`}
          >
            <svg className={`w-3.5 h-3.5 shrink-0 ${isDocsActive ? 'text-sky-400' : 'text-zinc-500'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
            <span>Docs</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${isDocsActive ? 'bg-sky-500/20 text-sky-300 border border-sky-500/35 font-bold' : 'bg-sky-500/15 text-sky-400 border border-sky-500/25'}`}>
              {docsCount}
            </span>
          </button>
        </nav>

        <div
          className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono border bg-[#16161c] border-white/[0.08] hover:border-emerald-400/25 transition-all"
          title={isBackendLive ? "FastAPI Backend is online on port 8008" : "FastAPI Backend is on standby"}
        >
          <span className={`w-2 h-2 rounded-full ${isBackendLive ? 'bg-emerald-400 status-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'bg-neutral-600'}`} />
          <HeaderEqualizerBars active={isBackendLive} tone="emerald" />
          <span className={isBackendLive ? 'text-emerald-400 font-semibold' : 'text-zinc-500'}>
            {isBackendLive ? ':8008 Live' : ':8008 Standby'}
          </span>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('computer')}
          title="Open Computer & Performance Monitor"
          className={`hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono tabular-nums border transition-all hover:scale-[1.03] active:scale-[0.97] cursor-pointer ${
            active === 'computer' || active === 'system'
              ? 'bg-sky-500/20 border-sky-400/40 text-sky-200 font-bold shadow-[0_0_16px_rgba(56,189,248,0.18)]'
              : 'bg-[#16161c] border-white/[0.08] text-zinc-300 hover:text-white hover:border-sky-400/30 hover:bg-sky-500/10'
          }`}
        >
          <MiniRadialRing percent={quickTelemetry?.cpu ?? 22} color="#38bdf8" size={15} />
          <span>{quickTelemetry ? `CPU ${quickTelemetry.cpu}% · RAM ${quickTelemetry.ram}%` : 'Computer'}</span>
        </button>

        {onTriggerReload && (
          <button
            type="button"
            className="hidden sm:inline-flex items-center gap-1.5 p-2 rounded-full bg-[#16161c] border border-white/[0.08] text-zinc-400 hover:text-white hover:border-white/[0.2] hover:bg-white/[0.06] hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-sm"
            onClick={() => {
              consoleLogger.action('UI', 'Triggered full workspace reload & sync');
              onTriggerReload();
            }}
            title="Reload Workspace & Re-sync AST Engine"
            aria-label="Reload workspace"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 2v6h-6" />
              <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
              <path d="M3 22v-6h6" />
              <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
            </svg>
          </button>
        )}

        <a
          href="https://github.com/dheena017/Soul-DevPortal"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#16161c] border border-white/[0.08] text-zinc-300 hover:text-white hover:border-white/[0.2] hover:bg-white/[0.06] hover:scale-[1.03] active:scale-[0.97] transition-all cursor-pointer"
          title="Open GitHub Repository: dheena017/Soul-DevPortal"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
            <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z" />
          </svg>
          <span className="hidden sm:inline">GitHub</span>
          <svg className="w-3 h-3 text-zinc-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="7" y1="17" x2="17" y2="7" /><polyline points="7 7 17 7 17 17" /></svg>
        </a>

        <button
          type="button"
          className="w-8 h-8 rounded-full bg-[#16161c] border border-white/[0.08] flex items-center justify-center text-xs font-mono font-bold text-zinc-400 hover:text-white hover:border-white/[0.2] hover:bg-white/[0.06] hover:scale-105 active:scale-95 transition-all cursor-pointer"
          onClick={() => {
            consoleLogger.action('SHORTCUT', 'Clicked help button: opening keyboard shortcuts modal');
            onOpenShortcuts();
          }}
          title="Keyboard Shortcuts (?)"
          aria-label="View keyboard shortcuts"
        >
          ?
        </button>
      </div>
    </header>
  );
};
