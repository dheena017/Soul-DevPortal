import React, { useState, useMemo } from 'react';
import CopyButton from '../../../components/CopyButton';

export interface ProjectScriptsTabProps {
  scriptsEntries: Array<[string, string]>;
}

export default function ProjectScriptsTab({ scriptsEntries }: ProjectScriptsTabProps) {
  const [filter, setFilter] = useState<string>('');

  const filteredScripts = useMemo(() => {
    const needle = filter.trim().toLowerCase();
    if (!needle) return scriptsEntries;
    return scriptsEntries.filter(
      ([name, cmd]) => name.toLowerCase().includes(needle) || cmd.toLowerCase().includes(needle)
    );
  }, [scriptsEntries, filter]);

  return (
    <section className="w-full p-5 md:p-6 rounded-2xl bg-[#111116] border border-[#282838] shadow-2xl flex flex-col gap-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#22222e]">
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-400">AUTOMATION &amp; LIFECYCLE</span>
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
            className="w-full h-9 pl-9 pr-8 rounded-lg bg-[#0a0a0a] border border-[#282838] text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-blue-500 transition-all font-mono"
          />
          {filter && (
            <button
              type="button"
              className="absolute right-2.5 text-xs text-neutral-400 hover:text-white p-1"
              onClick={() => setFilter('')}
              title="Clear filter"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between pb-2">
          <span className="text-xs font-bold text-white">Executable Commands</span>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-[#111116] border border-[#282838] text-neutral-300">
            {filteredScripts.length} commands
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredScripts.map(([scriptName, scriptCmd]) => (
            <div
              key={scriptName}
              className="flex flex-col justify-between p-4 rounded-xl bg-[#111116] border border-[#282838] hover:border-blue-500/40 hover:bg-[#111116] transition-all gap-2.5"
            >
              <div className="flex items-center justify-between gap-2">
                <code className="text-xs font-mono font-bold text-blue-400 truncate">npm run {scriptName}</code>
                <CopyButton text={`npm run ${scriptName}`} variant="compact" />
              </div>
              <div className="p-2.5 rounded-lg bg-[#0a0a0a] border border-[#22222e] font-mono text-[11px] text-neutral-400 overflow-x-auto">
                <code>{scriptCmd}</code>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
