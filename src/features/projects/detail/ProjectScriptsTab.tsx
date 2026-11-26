import React, { useState, useMemo } from 'react';
import CopyButton from '../../../components/CopyButton';
import { HeroArtworkBackdrop } from '../../../components/PortalVisuals';
import TabLoadingState from '../../../components/TabLoadingState';

export interface ProjectScriptsTabProps {
  scriptsEntries: Array<[string, string]>;
  isLoading?: boolean;
}

export default function ProjectScriptsTab({ scriptsEntries, isLoading = false }: ProjectScriptsTabProps) {
  const [filter, setFilter] = useState<string>('');

  const filteredScripts = useMemo(() => {
    const needle = filter.trim().toLowerCase();
    if (!needle) return scriptsEntries;
    return scriptsEntries.filter(
      ([name, cmd]) => name.toLowerCase().includes(needle) || cmd.toLowerCase().includes(needle)
    );
  }, [scriptsEntries, filter]);

  if (scriptsEntries.length === 0 && isLoading) {
    return (
      <TabLoadingState
        variant="grid"
        title="Loading Project Scripts"
        subtitle="Reading package.json lifecycle and automation commands..."
      />
    );
  }

  return (
    <section className="w-full p-5 md:p-6 rounded-2xl bg-[#151519] border border-[#212126] shadow-2xl flex flex-col gap-5 portal-stagger portal-header-sheen">
      <HeroArtworkBackdrop src="/visuals/pillar-scripts-terminal.jpg" alt="" variant="corner" opacityClass="opacity-45 sm:opacity-58" />
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#19191d]">
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-400">AUTOMATION &amp; LIFECYCLE</span>
          <h2 className="text-lg font-bold text-white">Project Package Scripts</h2>
        </div>
        <div className="relative flex items-center min-w-[220px]">
          <svg className="absolute left-3 w-3.5 h-3.5 text-neutral-500 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter npm scripts..."
            aria-label="Filter npm scripts"
            className="w-full h-9 pl-9 pr-8 rounded-lg bg-[#070708] border border-[#212126] text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-neutral-500 transition-all font-mono"
          />
          {filter && (
            <button
              type="button"
              className="absolute right-2.5 text-xs text-neutral-400 hover:text-neutral-200 p-1"
              onClick={() => setFilter('')}
              title="Clear filter"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-2.5 rounded-xl bg-[#0b0b0f] border border-white/[0.06] portal-grid-stagger">
          <div className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-[#14141a] border border-white/[0.07] text-[11px] font-mono text-zinc-300 portal-card-hover">
            <span className="w-2 h-2 rounded-full bg-emerald-400 status-pulse shrink-0" />
            <span className="truncate">1. Dev / HMR</span>
          </div>
          <div className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-[#14141a] border border-white/[0.07] text-[11px] font-mono text-zinc-300 portal-card-hover">
            <span className="w-2 h-2 rounded-full bg-sky-400 status-pulse shrink-0" />
            <span className="truncate">2. Typecheck</span>
          </div>
          <div className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-[#14141a] border border-white/[0.07] text-[11px] font-mono text-zinc-300 portal-card-hover">
            <span className="w-2 h-2 rounded-full bg-amber-400 status-pulse shrink-0" />
            <span className="truncate">3. Lint Gate</span>
          </div>
          <div className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-[#14141a] border border-white/[0.07] text-[11px] font-mono text-zinc-300 portal-card-hover">
            <span className="w-2 h-2 rounded-full bg-purple-400 status-pulse shrink-0" />
            <span className="truncate">4. Vite Build</span>
          </div>
        </div>

        <div className="flex items-center justify-between pb-2">
          <span className="text-xs font-bold text-neutral-300">Executable Commands</span>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-[#151519] border border-[#212126] text-neutral-300">
            {filteredScripts.length} commands
          </span>
        </div>

        {filteredScripts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 portal-grid-stagger">
            {filteredScripts.map(([scriptName, scriptCmd]) => (
              <div
                key={scriptName}
                className="flex flex-col justify-between p-4 rounded-xl bg-[#151519] border border-[#212126] hover:border-neutral-500 gap-2.5 portal-card-hover"
              >
                <div className="flex items-center justify-between gap-2">
                  <code className="text-xs font-mono font-bold text-neutral-300 truncate">npm run {scriptName}</code>
                  <CopyButton text={`npm run ${scriptName}`} variant="compact" />
                </div>
                <div className="p-2.5 rounded-lg bg-[#070708] border border-[#19191d] font-mono text-[11px] text-neutral-400 overflow-x-auto">
                  <code>{scriptCmd}</code>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 rounded-xl bg-[#111115] border border-white/[0.06] text-center">
            <p className="text-xs text-zinc-400 font-mono">
              {scriptsEntries.length === 0
                ? 'No npm lifecycle scripts declared in package.json.'
                : `No scripts match "${filter}".`}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
