import React from 'react';
import { consoleLogger } from '@workspace/logger';
import { SoulLogoIcon } from './SoulLogo';
import { HeaderEqualizerBars, MiniRadialRing } from './PortalVisuals';
import { useSharedTelemetry } from '../services/telemetryStore';
import { SystemLiveSnapshot } from '../types';

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
  isBackendLive?: boolean;
  backendPort?: number;
  liveTelemetry?: SystemLiveSnapshot | null;
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
  isBackendLive: propBackendLive,
  backendPort: propBackendPort,
  liveTelemetry: propLiveTelemetry,
}) => {
  const isProjectsActive = active.startsWith('project');
  const isPackagesActive = active.startsWith('package') || ['logger', 'runner', 'config'].includes(active);
  const isDocsActive =
    active.startsWith('doc') ||
    ['rules', 'projects-rules', 'design', 'packages-design', 'guide', 'ports', 'port-architecture', 'ports-guide', 'techstack', 'tech-stack', 'cheatsheet', 'compliance-cheatsheet'].includes(active);

  const shared = useSharedTelemetry(propBackendLive === undefined);
  const isBackendLive = propBackendLive ?? shared.isBackendLive;
  const backendPort = propBackendPort ?? shared.backendPort;
  const effectiveTelemetry = propLiveTelemetry !== undefined ? propLiveTelemetry : shared.liveTelemetry;
  const quickTelemetry = effectiveTelemetry
    ? {
        cpu: Math.round(effectiveTelemetry.cpu.totalPercent),
        ram: Math.round(effectiveTelemetry.memory.percent),
      }
    : null;

  return (
    <header className="w-full h-14 bg-[#0d0d10]/[0.97] border-b border-white/[0.08] sticky top-0 z-30 shrink-0 transition-[filter,opacity] duration-200" role="banner">
      <div className="w-full max-w-[1800px] mx-auto h-full px-3 sm:px-4 lg:px-5 flex items-center justify-between gap-2 min-w-0">
        {/* ── Left: Sidebar Toggle & Breadcrumbs ── */}
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 shrink">
          <button
            type="button"
            className="w-8 h-8 rounded-lg bg-[#16161c] border border-white/[0.08] text-zinc-300 hover:text-white hover:border-white/[0.2] hover:bg-white/[0.06] active:scale-95 transition-all flex items-center justify-center shrink-0 shadow-sm cursor-pointer"
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

          <nav className="flex items-center gap-1 text-xs min-w-0" aria-label="Breadcrumb navigation">
            <button
              type="button"
              className="group inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg bg-[#16161c] border border-white/[0.08] hover:border-sky-400/35 hover:bg-white/[0.06] font-mono text-zinc-200 hover:text-white transition-all shrink-0 shadow-sm cursor-pointer"
              onClick={() => onNavigate('overview')}
              title="Go to Overview Dashboard"
            >
              <SoulLogoIcon size={18} className="group-hover:scale-110 transition-transform" />
              <span className="font-semibold text-zinc-300 hidden 2xl:inline">soul</span>
              <span className="text-zinc-600 font-bold hidden 2xl:inline">/</span>
              <strong className="text-zinc-100 font-bold text-[11px] sm:text-xs">dev-portal</strong>
            </button>

            {breadcrumbs.slice(1).map((crumb, idx) => {
              const isLast = idx === breadcrumbs.slice(1).length - 1;
              return (
                <div
                  key={`${active}-${idx}`}
                  style={{ animationDelay: `${idx * 45}ms` }}
                  className={`${isLast ? 'flex min-w-0' : 'hidden 2xl:flex shrink-0'} items-center gap-1 portal-crumb-enter`}
                >
                  <span className="text-zinc-600 font-bold px-0.5 shrink-0">/</span>
                  {crumb.id ? (
                    <button
                      type="button"
                      className="inline-flex items-center h-8 px-2 rounded-lg bg-[#16161c] border border-white/[0.08] hover:border-white/[0.2] hover:bg-white/[0.06] text-zinc-200 hover:text-white transition-all truncate font-medium max-w-[115px] 2xl:max-w-[140px]"
                      onClick={() => onNavigate(crumb.id!)}
                      title={`Go to ${crumb.label}`}
                    >
                      {crumb.label}
                    </button>
                  ) : (
                    <span
                      className="inline-flex items-center gap-1.5 h-8 px-2 rounded-lg bg-[#1a1a22] border border-white/15 text-white font-semibold shadow-sm truncate max-w-[110px] xl:max-w-[135px] 2xl:max-w-[165px]"
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
        <div className="relative w-36 xl:w-44 2xl:w-60 shrink-0 hidden lg:flex items-center" role="search">
          <svg className="absolute left-2.5 w-3.5 h-3.5 text-zinc-500 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            ref={searchInputRef as React.RefObject<HTMLInputElement>}
            value={query}
            onChange={onSearchChange}
            placeholder="Search..."
            aria-label="Search package and application documentation"
            className="w-full h-8 pl-8 pr-7 rounded-lg bg-[#09090c] border border-white/[0.08] text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-sky-400/45 font-mono transition-all"
          />
          {query ? (
            <button
              type="button"
              className="absolute right-1.5 text-xs text-zinc-400 hover:text-white p-1 cursor-pointer"
              onClick={onClearSearch}
              aria-label="Clear search input"
            >
              ✕
            </button>
          ) : (
            <kbd className="absolute right-1.5 px-1.5 py-0.5 rounded bg-[#16161c] border border-white/[0.08] text-[10px] text-zinc-400 font-mono pointer-events-none">
              /
            </kbd>
          )}
        </div>

        {/* ── Right: Navigation Tabs, Telemetry & Unified App Button ── */}
        <div className="flex items-center gap-1.5 shrink-0">
          <nav className="h-9 p-0.5 bg-[#09090c] border border-white/[0.08] rounded-xl hidden md:flex items-center gap-0.5" role="tablist" aria-label="Portal Dashboards">
            <button
              type="button"
              role="tab"
              aria-selected={active === 'overview'}
              className={`inline-flex items-center gap-1.5 h-7 px-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
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
              className={`inline-flex items-center gap-1.5 h-7 px-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
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
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${isProjectsActive ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/35 font-bold' : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'}`}>
                {projectsCount}
              </span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={isPackagesActive}
              className={`inline-flex items-center gap-1.5 h-7 px-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
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
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${isPackagesActive ? 'bg-purple-500/20 text-purple-300 border border-purple-500/35 font-bold' : 'bg-purple-500/15 text-purple-400 border border-purple-500/25'}`}>
                {packagesCount}
              </span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={isDocsActive}
              className={`inline-flex items-center gap-1.5 h-7 px-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
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
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${isDocsActive ? 'bg-sky-500/20 text-sky-300 border border-sky-500/35 font-bold' : 'bg-sky-500/15 text-sky-400 border border-sky-500/25'}`}>
                {docsCount}
              </span>
            </button>
          </nav>

          <div
            className="hidden sm:inline-flex items-center gap-1.5 h-8 px-2 rounded-lg text-[11px] font-mono border bg-[#16161c] border-white/[0.08] hover:border-emerald-400/25 transition-all whitespace-nowrap"
            title={isBackendLive ? `Workspace service is active (port ${backendPort})` : `Connecting to workspace service (port ${backendPort})`}
          >
            <span className={`w-2 h-2 rounded-full ${isBackendLive ? 'bg-emerald-400 status-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'bg-neutral-600'}`} />
            <HeaderEqualizerBars active={isBackendLive} tone="emerald" />
            <span className={isBackendLive ? 'text-emerald-400 font-semibold' : 'text-zinc-500'}>
              {isBackendLive ? 'Live' : 'Sync'}
            </span>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('computer')}
            title={quickTelemetry ? `Computer Monitor · CPU ${quickTelemetry.cpu}% · RAM ${quickTelemetry.ram}%` : 'Open Computer & Performance Monitor'}
            className={`hidden md:inline-flex items-center gap-1.5 h-8 px-2 rounded-lg text-[11px] font-mono tabular-nums border transition-all active:scale-[0.98] cursor-pointer whitespace-nowrap ${
              active === 'computer' || active === 'system'
                ? 'bg-sky-500/20 border-sky-400/40 text-sky-200 font-bold shadow-[0_0_16px_rgba(56,189,248,0.18)]'
                : 'bg-[#16161c] border-white/[0.08] text-zinc-300 hover:text-white hover:border-sky-400/30 hover:bg-sky-500/10'
            }`}
          >
            <MiniRadialRing percent={quickTelemetry?.cpu ?? 22} color="#38bdf8" size={14} />
            {quickTelemetry ? (
              <span>
                <span className="hidden 2xl:inline">CPU </span>
                {quickTelemetry.cpu}% · <span className="hidden 2xl:inline">RAM </span>
                {quickTelemetry.ram}%
              </span>
            ) : (
              <span>Computer</span>
            )}
          </button>

          {onTriggerReload && (
            <button
              type="button"
              className="hidden sm:inline-flex items-center justify-center w-8 h-8 rounded-lg bg-[#16161c] border border-white/[0.08] text-zinc-400 hover:text-white hover:border-white/[0.2] hover:bg-white/[0.06] active:scale-95 transition-all cursor-pointer shadow-sm shrink-0"
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

          <button
            type="button"
            onClick={() => {
              consoleLogger.action('DESKTOP', 'Opening unified Desktop App & shortcuts modal');
              onOpenShortcuts();
            }}
            title={
              typeof window !== 'undefined' && window.soulDesktop?.isDesktop
                ? 'Soul DevPortal Desktop App · Shortcuts & Commands (?)'
                : 'Desktop App Download, Shortcut & Commands (?)'
            }
            aria-label="Open desktop app installer and keyboard shortcuts"
            className={`inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-xs font-semibold border transition-all active:scale-[0.98] cursor-pointer shadow-sm whitespace-nowrap shrink-0 ${
              typeof window !== 'undefined' && window.soulDesktop?.isDesktop
                ? 'bg-emerald-500/12 border-emerald-500/35 text-emerald-200 hover:bg-emerald-500/20'
                : 'bg-[#16161c] border-sky-400/30 text-zinc-200 hover:text-white hover:border-sky-400/50 hover:bg-sky-500/12'
            }`}
          >
            <svg className="w-3.5 h-3.5 text-sky-300 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="2" y="3" width="20" height="14" rx="2" />
              <line x1="8" y1="21" x2="16" y2="21" />
              <line x1="12" y1="17" x2="12" y2="21" />
            </svg>
            <span className="hidden sm:inline">
              {typeof window !== 'undefined' && window.soulDesktop?.isDesktop ? (
                'App'
              ) : (
                <>
                  App<span className="hidden 2xl:inline"> .exe</span>
                </>
              )}
            </span>
            <span className="w-4 h-4 rounded bg-white/[0.08] border border-white/[0.14] flex items-center justify-center text-[10px] font-mono font-bold text-zinc-200">
              ?
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
