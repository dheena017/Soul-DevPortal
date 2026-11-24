import React, { useState, useMemo, useRef, useEffect } from 'react';
import { consoleLogger } from '@workspace/logger';
import CopyButton from '../../components/CopyButton';
import { WORKSPACE_SCRIPTS_REGISTRY, ScriptDefinition } from './scriptsConstants';

export interface ScriptsViewProps {
  rootScripts?: Record<string, string>;
  onNavigate: (viewId: string) => void;
}

export default function ScriptsView({ rootScripts = {}, onNavigate }: ScriptsViewProps) {
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [activeRuntime, setActiveRuntime] = useState<string>('npm');
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut: '/' focuses search, 'Escape' clears
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === '/' &&
        document.activeElement !== searchInputRef.current &&
        !['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName || '')
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === 'Escape' && document.activeElement === searchInputRef.current) {
        if (searchQuery) {
          setSearchQuery('');
        } else {
          searchInputRef.current?.blur();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchQuery]);

  const toggleExpand = (id: string) => {
    setExpandedCards((prev) => {
      const isNowExpanded = !prev[id];
      consoleLogger.action('SCRIPTS', `${isNowExpanded ? 'Inspecting' : 'Collapsed'} command drawer: ${id}`);
      return { ...prev, [id]: isNowExpanded };
    });
  };

  const categories = [
    { id: 'all', label: 'All Commands', count: WORKSPACE_SCRIPTS_REGISTRY.length },
    { id: 'orchestration', label: 'Orchestration', count: WORKSPACE_SCRIPTS_REGISTRY.filter((s) => s.category === 'orchestration').length },
    { id: 'apps', label: 'Applications (8)', count: WORKSPACE_SCRIPTS_REGISTRY.filter((s) => s.category === 'apps').length },
    { id: 'portal', label: 'Developer Portal', count: WORKSPACE_SCRIPTS_REGISTRY.filter((s) => s.category === 'portal').length },
    { id: 'pipeline', label: 'Build & Quality', count: WORKSPACE_SCRIPTS_REGISTRY.filter((s) => s.category === 'pipeline').length },
    { id: 'setup', label: 'Dependencies', count: WORKSPACE_SCRIPTS_REGISTRY.filter((s) => s.category === 'setup').length },
  ];

  const filteredScripts = useMemo(() => {
    return WORKSPACE_SCRIPTS_REGISTRY.filter((s) => {
      const matchesCategory = filterCategory === 'all' || s.category === filterCategory;
      const query = searchQuery.trim().toLowerCase();
      const matchesQuery =
        !query ||
        s.name.toLowerCase().includes(query) ||
        s.command.toLowerCase().includes(query) ||
        s.description.toLowerCase().includes(query) ||
        s.id.toLowerCase().includes(query) ||
        (s.ports && s.ports.toLowerCase().includes(query));
      return matchesCategory && matchesQuery;
    });
  }, [filterCategory, searchQuery]);

  const formatCommand = (script: ScriptDefinition) => {
    if (activeRuntime === 'pnpm') {
      return script.name.replace(/^npm run /, 'pnpm ');
    } else if (activeRuntime === 'yarn') {
      return script.name.replace(/^npm run /, 'yarn ');
    } else if (activeRuntime === 'bun') {
      return script.name.replace(/^npm run /, 'bun run ');
    }
    return script.name;
  };

  return (
    <div className="w-full flex flex-col gap-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-300">
      {/* ── Modern Hero Header ── */}
      <header className="w-full bg-[#17171c] border border-[#282832] rounded-2xl p-5 md:p-6 shadow-2xl flex flex-col gap-5">
        {/* Breadcrumb & Top Actions Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#1f1f26]">
          <div className="flex items-center gap-2 text-xs">
            <button
              type="button"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#17171c] border border-[#282832] text-neutral-300 hover:text-neutral-200 hover:border-neutral-500 hover:bg-[#17171c] transition-all font-semibold shadow-sm"
              onClick={() => onNavigate('overview')}
              title="Return to Overview"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              <span>Back</span>
            </button>
            <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-[#17171c] border border-[#282832] text-neutral-400 font-medium">Soul Workspace</span>
            <span className="text-neutral-600 font-bold px-0.5" aria-hidden="true">›</span>
            <strong className="inline-flex items-center px-2.5 py-1 rounded-full bg-[#17171c] border border-[#282832] text-neutral-200 font-semibold shadow-sm">Scripts &amp; Automation Runners</strong>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#17171c] border border-[#282832] text-xs font-semibold text-neutral-300 select-none shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400" aria-hidden="true" />
              <span>19 Canonical Commands Active</span>
            </div>
            <CopyButton
              text="python Soul-DevPortal-Packages/runner/bin/run-all.py --kill-port"
              label="Copy Supervise Command"
              variant="compact"
            />
          </div>
        </div>

        {/* Title & Subtitle */}
        <div className="flex items-start sm:items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#17171c] border border-[#282832] flex items-center justify-center text-neutral-400 shrink-0 shadow-lg shadow-sm">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="4 17 10 11 4 5" />
              <line x1="12" y1="19" x2="20" y2="19" />
            </svg>
          </div>
          <div className="flex flex-col gap-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl font-extrabold tracking-tight text-neutral-200 uppercase">
                Workspace Commands &amp; Automation
              </h1>
              <span className="px-2.5 py-0.5 rounded-md text-[11px] font-mono font-bold tracking-wider uppercase bg-[#17171c] border border-[#282832] text-neutral-300">
                CLI Supervisor
              </span>
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed max-w-3xl">
              Canonical process orchestration, individual application runners, and monorepo automation scripts. Zero duplicate aliases.
            </p>
          </div>
        </div>

        {/* ── KPI Metric Cards Ribbon ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="flex flex-col p-3 rounded-xl bg-[#17171c] border border-[#282832] hover:border-neutral-500 transition-all">
            <span className="text-xl font-extrabold text-neutral-300 font-mono">19</span>
            <span className="text-xs font-semibold text-neutral-200 mt-1">Canonical Commands</span>
            <span className="text-[11px] text-neutral-500">0 redundant aliases</span>
          </div>

          <div className="flex flex-col p-3 rounded-xl bg-[#17171c] border border-[#282832] hover:border-neutral-500 transition-all">
            <span className="text-xl font-extrabold text-neutral-300 font-mono">8</span>
            <span className="text-xs font-semibold text-neutral-200 mt-1">Target Applications</span>
            <span className="text-[11px] text-neutral-500">Dual frontend &amp; backend</span>
          </div>

          <div className="flex flex-col p-3 rounded-xl bg-[#17171c] border border-[#282832] hover:border-[#282832] transition-all">
            <span className="text-xl font-extrabold text-neutral-300 font-mono">4</span>
            <span className="text-xs font-semibold text-neutral-200 mt-1">Core Orchestrators</span>
            <span className="text-[11px] text-neutral-500">All / Client / Server / Project</span>
          </div>

          <div className="flex flex-col p-3 rounded-xl bg-[#17171c] border border-[#282832] hover:border-[#282832] transition-all">
            <span className="text-xl font-extrabold text-neutral-300 font-mono">100%</span>
            <span className="text-xs font-semibold text-neutral-200 mt-1">Port Protected</span>
            <span className="text-[11px] text-neutral-500">Automated --kill-port</span>
          </div>
        </div>
      </header>

      {/* ── Search & View Mode Toolbar ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-[#17171c] border border-[#282832] rounded-xl shadow-lg">
        {/* Search Box */}
        <div className="relative flex-1 min-w-[260px] flex items-center">
          <svg className="absolute left-3 w-4 h-4 text-neutral-500 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search scripts, flags, ports (:5173, :8000)... (Press '/' to focus)"
            aria-label="Filter command scripts"
            className="w-full h-10 pl-9 pr-9 rounded-lg bg-[#17171c] border border-[#282832] text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-neutral-500 transition-all font-mono"
          />
          {searchQuery ? (
            <button
              type="button"
              className="absolute right-3 text-xs text-neutral-400 hover:text-neutral-200 p-1"
              onClick={() => setSearchQuery('')}
              aria-label="Clear script filter"
              title="Clear search"
            >
              ✕
            </button>
          ) : (
            <kbd className="absolute right-3 px-1.5 py-0.5 rounded bg-[#17171c] border border-[#282832] text-[10px] text-neutral-500 font-mono">
              /
            </kbd>
          )}
        </div>

        {/* View Mode Segmented Controls */}
        <div className="inline-flex p-1 bg-[#0e0e11] border border-[#282832] rounded-lg gap-1">
          <button
            type="button"
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              viewMode === 'grid'
                ? 'bg-[#17171c] text-neutral-200 shadow-sm border border-[#282832]'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-[#17171c]'
            }`}
            onClick={() => {
              consoleLogger.action('SCRIPTS', 'Switched view mode to Deck Grid');
              setViewMode('grid');
            }}
          >
            Deck View
          </button>
          <button
            type="button"
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              viewMode === 'table'
                ? 'bg-[#17171c] text-neutral-200 shadow-sm border border-[#282832]'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-[#17171c]'
            }`}
            onClick={() => {
              consoleLogger.action('SCRIPTS', 'Switched view mode to Dense Table');
              setViewMode('table');
            }}
          >
            Table View
          </button>
        </div>
      </div>

      {/* ── Category Filter Pills & Runtime Selector Row ── */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-[#0e0e11] border border-[#282832] rounded-xl" role="tablist" aria-label="Filter scripts by category">
          {categories.map((cat) => {
            const isActive = filterCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all ${
                  isActive
                    ? 'bg-[#17171c] text-neutral-200 font-bold border border-[#282832] shadow-sm'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-[#17171c] hover:border-[#282832] border border-transparent font-medium'
                }`}
                onClick={() => setFilterCategory(cat.id)}
              >
                <span>{cat.label}</span>
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${isActive ? 'bg-[#17171c] text-neutral-300 border border-[#282832] font-bold' : 'bg-[#17171c] text-neutral-400 border border-[#282832]'}`}>
                  {cat.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Runtime Selector */}
        <div className="flex items-center gap-2 text-xs text-neutral-400 self-end md:self-auto">
          <span className="font-medium">Package Manager:</span>
          <select
            value={activeRuntime}
            onChange={(e) => setActiveRuntime(e.target.value)}
            className="h-9 px-3 rounded-xl bg-[#17171c] border border-[#282832] text-xs text-neutral-200 focus:outline-none focus:border-neutral-500 font-medium"
            aria-label="Select package manager runtime"
          >
            <option value="npm">npm</option>
            <option value="pnpm">pnpm</option>
            <option value="yarn">yarn</option>
            <option value="bun">bun</option>
          </select>
        </div>
      </div>

      {/* ── Command Deck Cards Grid ── */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredScripts.map((script) => {
            const formattedRunCmd = formatCommand(script);
            const isExpanded = Boolean(expandedCards[script.id]);

            return (
              <div
                key={script.id}
                className="group flex flex-col justify-between p-4 sm:p-5 rounded-2xl bg-[#17171c] border border-[#282832] hover:border-neutral-500 hover:bg-[#17171c] hover:shadow-2xl transition-all duration-200 gap-3.5"
              >
                {/* Card Top: Code Pill, Category Badge, Copy Button */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap min-w-0">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#17171c] border border-[#282832] min-w-0">
                      <span className="text-neutral-300 font-mono font-bold text-xs select-none">$</span>
                      <code className="text-xs font-mono font-bold text-neutral-300 truncate max-w-[190px]">
                        {formattedRunCmd}
                      </code>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider uppercase bg-[#17171c] border border-[#282832] text-neutral-400 shrink-0">
                      {script.badge}
                    </span>
                  </div>
                  <CopyButton text={formattedRunCmd} variant="compact" label="Copy" />
                </div>

                {/* Description */}
                <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed min-h-[36px]">
                  {script.description}
                </p>

                {/* Ports & Auto-Kill Status Tags */}
                <div className="flex items-center gap-2 flex-wrap">
                  {script.ports ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#17171c] border border-[#282832] text-[11px] font-mono text-neutral-300">
                      <svg className="w-3.5 h-3.5 text-neutral-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <circle cx="12" cy="12" r="2" />
                        <path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14" />
                      </svg>
                      <span>{script.ports}</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#17171c] border border-[#282832] text-[11px] font-mono text-neutral-300">
                      <svg className="w-3.5 h-3.5 text-neutral-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                      </svg>
                      <span>Dynamic Allocation</span>
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#17171c] border border-[#282832] text-[11px] font-mono text-neutral-300">
                    <svg className="w-3.5 h-3.5 text-neutral-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                    <span>Auto-Kill Enabled</span>
                  </span>
                </div>

                {/* Execution Details Toggle & Category Footer */}
                <div className="pt-2.5 border-t border-[#1f1f26] flex items-center justify-between">
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-neutral-400 hover:text-neutral-200 transition-colors"
                    onClick={() => toggleExpand(script.id)}
                    aria-expanded={isExpanded}
                  >
                    <span>{isExpanded ? 'Hide implementation details' : 'Inspect execution details'}</span>
                    <svg
                      className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? 'rotate-180 text-neutral-300' : 'text-neutral-500'}`}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>
                  <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider">
                    {script.category}
                  </span>
                </div>

                {/* Drawer with full raw command and copy option */}
                {isExpanded && (
                  <div className="flex flex-col gap-2.5 p-3 rounded-xl bg-[#0e0e11] border border-[#282832] text-xs font-mono animate-in fade-in duration-150">
                    <div className="flex flex-col gap-1">
                      <span className="text-neutral-500 font-semibold text-[10px] uppercase tracking-wider">
                        Raw Execution String:
                      </span>
                      <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-[#17171c] border border-[#282832]">
                        <code className="text-neutral-200 text-[11px] break-all">
                          {rootScripts[script.id] || script.command}
                        </code>
                        <CopyButton text={rootScripts[script.id] || script.command} variant="compact" label="Copy" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-neutral-400 pt-0.5">
                      <span>Target: <strong className="text-neutral-200 uppercase">{script.category}</strong></span>
                      <span className="text-neutral-300 font-mono text-[10.5px]">Automatic socket detachment active</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* ── Dense Table View ── */
        <div className="w-full bg-[#17171c] border border-[#282832] rounded-2xl overflow-x-auto shadow-2xl">
          <table className="w-full border-collapse text-left text-xs font-sans">
            <thead>
              <tr className="border-b border-[#1f1f26] bg-[#17171c] text-neutral-400">
                <th className="py-3 px-4 font-semibold">Command</th>
                <th className="py-3 px-4 font-semibold">Category</th>
                <th className="py-3 px-4 font-semibold">Allocated Ports</th>
                <th className="py-3 px-4 font-semibold">Description</th>
                <th className="py-3 px-4 font-semibold">Execution String</th>
                <th className="py-3 px-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredScripts.map((script) => (
                <tr key={script.id} className="border-b border-[#1f1f26] hover:bg-[#17171c] transition-colors">
                  <td className="py-3 px-4">
                    <code className="font-mono text-neutral-300 font-bold">{formatCommand(script)}</code>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-[#17171c] border border-[#282832] text-neutral-300">
                      {script.category}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono">
                    <span className={script.ports ? 'text-neutral-300' : 'text-neutral-600'}>
                      {script.ports || '—'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-neutral-400 max-w-sm truncate">{script.description}</td>
                  <td className="py-3 px-4">
                    <code className="font-mono text-[11px] text-neutral-300">{script.command}</code>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <CopyButton text={formatCommand(script)} variant="compact" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
