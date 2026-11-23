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
      <header className="w-full bg-[#111111] border border-[#222222] rounded-2xl p-5 md:p-6 shadow-2xl shadow-black/50 flex flex-col gap-5">
        {/* Breadcrumb & Top Actions Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#1f1f1f]">
          <div className="flex items-center gap-2.5 text-xs">
            <button
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#161616] border border-[#2c2c2c] text-neutral-300 hover:text-white hover:border-[#3a3a3a] transition-all font-semibold"
              onClick={() => onNavigate('overview')}
              title="Return to Overview"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              <span>Back</span>
            </button>
            <span className="text-neutral-400 font-medium">Soul Workspace</span>
            <span className="text-neutral-600 font-bold" aria-hidden="true">/</span>
            <strong className="text-white font-bold">Scripts &amp; Automation Runners</strong>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-xs font-semibold text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" aria-hidden="true" />
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
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0 shadow-lg shadow-purple-500/5">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="4 17 10 11 4 5" />
              <line x1="12" y1="19" x2="20" y2="19" />
            </svg>
          </div>
          <div className="flex flex-col gap-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl font-extrabold tracking-tight text-white uppercase">
                Workspace Commands &amp; Automation
              </h1>
              <span className="px-2.5 py-0.5 rounded-md text-[11px] font-mono font-bold tracking-wider uppercase bg-purple-500/15 border border-purple-500/30 text-purple-400">
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
          <div className="flex flex-col p-3 rounded-xl bg-[#141414] border border-[#222222]">
            <span className="text-xl font-extrabold text-sky-400 font-mono">19</span>
            <span className="text-xs font-semibold text-neutral-200 mt-1">Canonical Commands</span>
            <span className="text-[11px] text-neutral-500">0 redundant aliases</span>
          </div>

          <div className="flex flex-col p-3 rounded-xl bg-[#141414] border border-[#222222]">
            <span className="text-xl font-extrabold text-emerald-400 font-mono">8</span>
            <span className="text-xs font-semibold text-neutral-200 mt-1">Target Applications</span>
            <span className="text-[11px] text-neutral-500">Dual frontend &amp; backend</span>
          </div>

          <div className="flex flex-col p-3 rounded-xl bg-[#141414] border border-[#222222]">
            <span className="text-xl font-extrabold text-purple-400 font-mono">4</span>
            <span className="text-xs font-semibold text-neutral-200 mt-1">Core Orchestrators</span>
            <span className="text-[11px] text-neutral-500">All / Client / Server / Project</span>
          </div>

          <div className="flex flex-col p-3 rounded-xl bg-[#141414] border border-[#222222]">
            <span className="text-xl font-extrabold text-amber-400 font-mono">100%</span>
            <span className="text-xs font-semibold text-neutral-200 mt-1">Port Protected</span>
            <span className="text-[11px] text-neutral-500">Automated --kill-port</span>
          </div>
        </div>
      </header>

      {/* ── Search & View Mode Toolbar ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-[#111111] border border-[#222222] rounded-xl shadow-lg">
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
            className="w-full h-10 pl-9 pr-9 rounded-lg bg-[#0e0e0e] border border-[#262626] text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-sky-500 transition-all font-mono"
          />
          {searchQuery ? (
            <button
              type="button"
              className="absolute right-3 text-xs text-neutral-400 hover:text-white p-1"
              onClick={() => setSearchQuery('')}
              aria-label="Clear script filter"
              title="Clear search"
            >
              ✕
            </button>
          ) : (
            <kbd className="absolute right-3 px-1.5 py-0.5 rounded bg-[#1c1c1c] border border-[#333333] text-[10px] text-neutral-500 font-mono">
              /
            </kbd>
          )}
        </div>

        {/* View Mode Segmented Controls */}
        <div className="inline-flex p-1 bg-[#0c0c0c] border border-[#242424] rounded-lg gap-1">
          <button
            type="button"
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              viewMode === 'grid'
                ? 'bg-[#222222] text-white shadow-sm border border-[#333333]'
                : 'text-neutral-400 hover:text-white hover:bg-[#161616]'
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
                ? 'bg-[#222222] text-white shadow-sm border border-[#333333]'
                : 'text-neutral-400 hover:text-white hover:bg-[#161616]'
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
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-[#101010] border border-[#242424] rounded-xl" role="tablist" aria-label="Filter scripts by category">
          {categories.map((cat) => {
            const isActive = filterCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-sky-600 text-white shadow-sm border border-sky-500'
                    : 'text-neutral-400 hover:text-white hover:bg-[#181818]'
                }`}
                onClick={() => setFilterCategory(cat.id)}
              >
                <span>{cat.label}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${isActive ? 'bg-sky-800 text-white' : 'bg-[#1e1e1e] text-neutral-400'}`}>
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
            className="h-9 px-3 rounded-xl bg-[#141414] border border-[#282828] text-xs text-neutral-200 focus:outline-none focus:border-sky-500 font-medium"
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
                className="group flex flex-col justify-between p-5 rounded-2xl bg-[#111111] border border-[#222222] hover:border-sky-500/40 hover:bg-[#131313] hover:shadow-2xl hover:shadow-black/70 transition-all duration-300 gap-3.5"
              >
                {/* Card Top: Code Pill, Category Badge, Copy Button */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap min-w-0">
                    <code className="text-xs font-mono font-bold text-white bg-[#1a1a1a] border border-[#2c2c2c] px-2.5 py-1 rounded-md truncate max-w-[210px]">
                      {formattedRunCmd}
                    </code>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider uppercase bg-sky-500/15 border border-sky-500/30 text-sky-400 shrink-0">
                      {script.badge}
                    </span>
                  </div>
                  <CopyButton text={formattedRunCmd} variant="compact" />
                </div>

                {/* Description */}
                <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed min-h-[36px]">
                  {script.description}
                </p>

                {/* Ports & Auto-Kill Tags */}
                {script.ports && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#161616] border border-[#242424] text-[11px] font-mono text-sky-400">
                      🔌 {script.ports}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#161616] border border-[#242424] text-[11px] font-mono text-emerald-400">
                      🛡️ Auto-Kill Enabled
                    </span>
                  </div>
                )}

                {/* Terminal Run Preview (Zero truncation) */}
                <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-[#0c0c0c] border border-[#222222] font-mono text-xs">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="text-emerald-400 font-bold select-none">$</span>
                    <code className="text-[11px] text-sky-300 truncate select-all">{script.command}</code>
                  </div>
                  <CopyButton text={script.command} variant="compact" label="Copy" />
                </div>

                {/* Expand Toggle */}
                <button
                  type="button"
                  className="text-[11px] font-semibold text-neutral-500 hover:text-sky-400 text-left transition-colors pt-1"
                  onClick={() => toggleExpand(script.id)}
                  aria-expanded={isExpanded}
                >
                  {isExpanded ? 'Hide implementation details ▴' : 'Inspect execution details ▾'}
                </button>

                {/* Drawer */}
                {isExpanded && (
                  <div className="flex flex-col gap-2 p-3 rounded-xl bg-[#0a0a0a] border border-[#1f1f1f] text-xs font-mono">
                    <div className="flex items-center gap-2">
                      <span className="text-neutral-500 font-semibold shrink-0">Raw Script:</span>
                      <code className="text-neutral-300 truncate">{rootScripts[script.id] || script.command}</code>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-neutral-500 font-semibold shrink-0">Target:</span>
                      <span className="text-neutral-300">{script.category.toUpperCase()} Ecosystem</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-neutral-500 font-semibold shrink-0">Clean Port:</span>
                      <span className="text-emerald-400">Automatic socket detachment &amp; port reaping</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* ── Dense Table View ── */
        <div className="w-full bg-[#111111] border border-[#222222] rounded-2xl overflow-x-auto shadow-xl">
          <table className="w-full border-collapse text-left text-xs font-sans">
            <thead>
              <tr className="border-b border-[#222222] bg-[#141414] text-neutral-400">
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
                <tr key={script.id} className="border-b border-[#1c1c1c] hover:bg-[#161616] transition-colors">
                  <td className="py-3 px-4">
                    <code className="font-mono text-sky-400 font-bold">{formatCommand(script)}</code>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-sky-500/15 border border-sky-500/30 text-sky-400">
                      {script.category}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono">
                    <span className={script.ports ? 'text-sky-400' : 'text-neutral-600'}>
                      {script.ports || '—'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-neutral-400 max-w-sm truncate">{script.description}</td>
                  <td className="py-3 px-4">
                    <code className="font-mono text-[11px] text-purple-300">{script.command}</code>
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
