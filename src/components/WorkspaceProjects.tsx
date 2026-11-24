import React, { useState, useMemo } from 'react';
import CopyButton from './CopyButton';
import { ProjectData } from '../types';

export interface WorkspaceProjectsProps {
  projects?: ProjectData[];
  onBack?: () => void;
}

export default function WorkspaceProjects({ projects = [], onBack }: WorkspaceProjectsProps) {
  const [query, setQuery] = useState<string>('');
  const [filterFramework, setFilterFramework] = useState<string>('all');

  const frameworksList = useMemo(() => {
    const set = new Set<string>();
    projects.forEach((p) => {
      if (p.framework?.includes('React 19')) set.add('React 19');
      else if (p.framework?.includes('React 18')) set.add('React 18');
      else if (p.framework?.includes('Next.js')) set.add('Next.js');
    });
    return ['all', ...Array.from(set)];
  }, [projects]);

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const matchesQuery = !query.trim() || [
        p.title,
        p.id,
        p.framework,
        p.dbInfo,
        p.aiEngine,
        p.frontendPort?.toString(),
        p.backendPort?.toString(),
      ].join(' ').toLowerCase().includes(query.trim().toLowerCase());

      const matchesFramework = filterFramework === 'all' || p.framework?.includes(filterFramework);

      return matchesQuery && matchesFramework;
    });
  }, [projects, query, filterFramework]);

  return (
    <article className="w-full flex flex-col gap-6 max-w-7xl mx-auto pb-12">
      <header className="w-full bg-[#161b22] border border-[#30363d] rounded-2xl p-5 md:p-6 shadow-2xl flex flex-col gap-5">
        <div className="flex items-center gap-3 text-xs">
          {onBack && (
            <button
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#161b22] border border-[#30363d] text-neutral-300 hover:text-neutral-200 hover:border-neutral-500 hover:bg-[#161b22] transition-all font-semibold"
              onClick={onBack}
            >
              ← Back to Overview
            </button>
          )}
          <span className="text-neutral-400 font-medium">Soul Workspace / Monorepo Applications</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-neutral-200 tracking-tight">
          Workspace <span className="text-neutral-300 font-mono">Applications &amp; Ports</span>
        </h1>
        <p className="text-xs md:text-sm text-neutral-400 leading-relaxed max-w-4xl">
          Catalog of all 9 applications consuming the shared packages, their assigned development ports, backend servers, databases, and AI engines.
        </p>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
          <div className="relative flex-1 max-w-md flex items-center">
            <svg className="absolute left-3 w-4 h-4 text-neutral-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter applications by name, port, framework, AI engine..."
              aria-label="Filter applications"
              className="w-full bg-[#161b22] border border-[#30363d] rounded-xl pl-9 pr-8 py-2 text-xs text-neutral-300 placeholder-neutral-500 focus:outline-none focus:border-neutral-500"
            />
            {query && (
              <button
                type="button"
                className="absolute right-2.5 text-neutral-400 hover:text-neutral-200 text-xs"
                onClick={() => setQuery('')}
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {frameworksList.map((fw) => (
              <button
                key={fw}
                type="button"
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  filterFramework === fw
                    ? 'bg-[#161b22] text-neutral-200 font-bold shadow-sm border border-[#30363d]'
                    : 'bg-[#161b22] border border-[#30363d] text-neutral-400 hover:text-neutral-200 hover:bg-[#161b22]'
                }`}
                onClick={() => setFilterFramework(fw)}
              >
                {fw === 'all' ? 'All Frameworks' : fw}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredProjects.map((p) => (
          <div key={p.id} className="p-5 rounded-2xl bg-[#161b22] border border-[#30363d] hover:border-neutral-500 hover:bg-[#161b22] shadow-2xl transition-all duration-200 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-neutral-200">{p.title}</h3>
              <CopyButton text={`http://localhost:${p.frontendPort || 5173}`} label="Copy URL" variant="compact" />
            </div>
            <p className="text-xs text-neutral-400 line-clamp-2">{p.description}</p>
            <div className="flex items-center gap-2 pt-2 border-t border-[#21262d] text-xs">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#161b22] text-neutral-300 border border-[#30363d]">
                Port :{p.frontendPort}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#161b22] border border-[#30363d] text-neutral-300">
                {p.framework || 'Vite React'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}
