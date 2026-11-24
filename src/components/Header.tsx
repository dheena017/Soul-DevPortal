import React from 'react';
import { consoleLogger } from '@workspace/logger';
import { SoulLogoIcon } from './SoulLogo';

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

  return (
    <header className="w-full h-14 bg-[#111116]/95 backdrop-blur-md border-b border-[#282838] px-4 flex items-center justify-between gap-4 sticky top-0 z-30 shrink-0 transition-[filter,opacity] duration-200" role="banner">
      {/* ── Left: Sidebar Toggle & Breadcrumbs ── */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          className="p-2 rounded-full bg-[#14141c] border border-[#282838] text-neutral-300 hover:text-white hover:border-[#38384a] hover:bg-[#181824] transition-all shrink-0 shadow-sm"
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

        <nav className="flex items-center gap-2 text-xs min-w-0 overflow-hidden" aria-label="Breadcrumb navigation">
          <button
            type="button"
            className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#161616] border border-[#282828] hover:border-[#383838] hover:bg-[#1a1a1a] font-mono text-neutral-300 hover:text-white transition-all shrink-0 shadow-sm"
            onClick={() => onNavigate('overview')}
            title="Go to Overview Dashboard"
          >
            <SoulLogoIcon size={18} />
            <span className="font-semibold text-white">soul</span>
            <span className="text-neutral-600 font-bold">/</span>
            <strong className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-indigo-400 font-bold">dev-portal</strong>
          </button>

          {breadcrumbs.slice(1).map((crumb, idx) => (
            <div key={idx} className="flex items-center gap-2 min-w-0">
              <span className="text-neutral-600 font-bold px-0.5">/</span>
              {crumb.id ? (
                <button
                  type="button"
                  className="inline-flex items-center px-2.5 py-1 rounded-full bg-[#161616] border border-[#282828] hover:border-[#383838] hover:bg-[#1a1a1a] text-neutral-300 hover:text-white transition-all truncate font-medium max-w-[200px]"
                  onClick={() => onNavigate(crumb.id!)}
                  title={`Go to ${crumb.label}`}
                >
                  {crumb.label}
                </button>
              ) : (
                <span
                  className="inline-flex items-center px-2.5 py-1 rounded-full bg-[#1e1e1e] border border-[#333333] text-white font-semibold shadow-sm truncate max-w-[200px]"
                  title={crumb.label}
                >
                  {crumb.label}
                </span>
              )}
            </div>
          ))}
        </nav>
      </div>

      {/* ── Center: Omni Command Search ── */}
      <div className="relative flex-1 max-w-sm hidden md:flex items-center" role="search">
        <svg className="absolute left-3 w-3.5 h-3.5 text-neutral-500 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          ref={searchInputRef as React.RefObject<HTMLInputElement>}
          value={query}
          onChange={onSearchChange}
          placeholder="Search apps, packages, docs..."
          aria-label="Search package and application documentation"
          className="w-full h-8 pl-9 pr-8 rounded-full bg-[#161616] border border-[#282828] text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-[#444444] font-mono transition-all"
        />
        {query ? (
          <button
            type="button"
            className="absolute right-2.5 text-xs text-neutral-400 hover:text-white p-1"
            onClick={onClearSearch}
            aria-label="Clear search input"
          >
            ✕
          </button>
        ) : (
          <kbd className="absolute right-2.5 px-1 py-0.2 rounded bg-[#202020] border border-[#333] text-[10px] text-neutral-500 font-mono">
            /
          </kbd>
        )}
      </div>

      {/* ── Right: Navigation Tabs, GitHub Link & Shortcuts ── */}
      <div className="flex items-center gap-2 shrink-0">
        <nav className="flex items-center gap-1 p-0.5 bg-[#141414] border border-[#242424] rounded-lg hidden sm:flex" aria-label="Portal Dashboards">
          <button
            type="button"
            className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
              active === 'overview'
                ? 'bg-[#222222] text-white shadow-sm border border-[#333333]'
                : 'text-neutral-400 hover:text-white border border-transparent'
            }`}
            onClick={() => onNavigate('overview')}
            title="Overview Dashboard"
          >
            Overview
          </button>

          <button
            type="button"
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
              isProjectsActive
                ? 'bg-[#222222] text-white shadow-sm border border-[#333333]'
                : 'text-neutral-400 hover:text-white border border-transparent'
            }`}
            onClick={() => onNavigate('projects')}
            title={`Pillar 1: Applications (${projectsCount})`}
          >
            <span>Projects</span>
            <span className={`px-1 py-0.2 rounded-full text-[10px] font-mono ${isProjectsActive ? 'bg-[#161616] text-neutral-200 border border-[#2a2a2a]' : 'bg-[#202020] text-neutral-400'}`}>
              {projectsCount}
            </span>
          </button>

          <button
            type="button"
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
              isPackagesActive
                ? 'bg-[#222222] text-white shadow-sm border border-[#333333]'
                : 'text-neutral-400 hover:text-white border border-transparent'
            }`}
            onClick={() => onNavigate('packages')}
            title={`Pillar 2: Shared Libraries (${packagesCount})`}
          >
            <span>Packages</span>
            <span className={`px-1 py-0.2 rounded-full text-[10px] font-mono ${isPackagesActive ? 'bg-[#161616] text-neutral-200 border border-[#2a2a2a]' : 'bg-[#202020] text-neutral-400'}`}>
              {packagesCount}
            </span>
          </button>

          <button
            type="button"
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
              isDocsActive
                ? 'bg-[#222222] text-white shadow-sm border border-[#333333]'
                : 'text-neutral-400 hover:text-white border border-transparent'
            }`}
            onClick={() => onNavigate('docs')}
            title={`Pillar 3: Documentation Hub (${docsCount} Guides)`}
          >
            <span>Docs</span>
            <span className={`px-1 py-0.2 rounded-full text-[10px] font-mono ${isDocsActive ? 'bg-[#161616] text-neutral-200 border border-[#2a2a2a]' : 'bg-[#202020] text-neutral-400'}`}>
              {docsCount}
            </span>
          </button>
        </nav>

        <a
          href="https://github.com/dheena017/Soul-DevPortal"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#161616] border border-[#282828] text-neutral-300 hover:text-white hover:border-[#3e3e3e] hover:bg-[#1f1f1f] transition-all"
          title="Open GitHub Repository: dheena017/Soul-DevPortal"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
            <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z" />
          </svg>
          <span className="hidden sm:inline">GitHub</span>
          <span className="text-[10px] text-neutral-500">↗</span>
        </a>

        <button
          type="button"
          className="w-8 h-8 rounded-full bg-[#161616] border border-[#282828] flex items-center justify-center text-xs font-mono font-bold text-neutral-400 hover:text-white hover:border-[#3e3e3e] hover:bg-[#1f1f1f] transition-all"
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
