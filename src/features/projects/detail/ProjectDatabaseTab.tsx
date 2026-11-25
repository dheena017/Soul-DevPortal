import React, { useState, useMemo } from 'react';
import CopyButton from '../../../components/CopyButton';
import TabLoadingState from '../../../components/TabLoadingState';
import { ProjectData } from '../../../types';

export interface ProjectDatabaseTabProps {
  project: ProjectData;
  tables: string[];
  isLoading?: boolean;
}

export default function ProjectDatabaseTab({ project, tables, isLoading = false }: ProjectDatabaseTabProps) {
  const [filter, setFilter] = useState<string>('');

  const filteredTables = useMemo(() => {
    const needle = filter.trim().toLowerCase();
    if (!needle) return tables;
    return tables.filter((t) => t.toLowerCase().includes(needle));
  }, [tables, filter]);

  if (tables.length === 0 && isLoading) {
    return (
      <TabLoadingState
        variant="grid"
        title={`Inspecting ${project.title} Database`}
        subtitle="Scanning SQLite WAL tables, schema models, and persistence configuration..."
      />
    );
  }

  return (
    <section className="w-full p-5 md:p-6 rounded-2xl bg-[#151519] border border-[#212126] shadow-2xl flex flex-col gap-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#19191d]">
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-400">DATA PERSISTENCE TIER</span>
          <h2 className="text-lg font-bold text-white">Database Architecture &amp; Entities</h2>
        </div>
        {tables.length > 0 && (
          <div className="relative flex items-center min-w-[220px]">
            <svg className="absolute left-3 w-3.5 h-3.5 text-neutral-500 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter schema tables..."
              aria-label="Filter schema tables"
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
        )}
      </div>

      <div className="flex flex-col gap-4">
        {/* Meta Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="flex flex-col p-3 rounded-xl bg-[#151519] border border-[#212126]">
            <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider">Storage Engine</span>
            <strong className="text-xs font-bold text-neutral-200 font-mono mt-1">{project.dbInfo || 'SQLite'}</strong>
          </div>
          <div className="flex flex-col p-3 rounded-xl bg-[#151519] border border-[#212126]">
            <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider">Dialect</span>
            <strong className="text-xs font-bold text-neutral-200 font-mono mt-1">Relational SQL / JSON</strong>
          </div>
          <div className="flex flex-col p-3 rounded-xl bg-[#151519] border border-[#212126]">
            <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider">Schema Mode</span>
            <strong className="text-xs font-bold text-neutral-200 font-mono mt-1">
              {tables.length > 0 ? `${tables.length} Tables Registered` : 'Single Database File'}
            </strong>
          </div>
        </div>

        {filteredTables.length > 0 ? (
          <div className="flex flex-col gap-3 pt-2">
            <div className="flex items-center justify-between pb-2">
              <span className="text-xs font-bold text-neutral-300">Registered Schema Tables</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-[#151519] border border-[#212126] text-neutral-300">
                {filteredTables.length} tables
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {filteredTables.map((tName) => (
                <div
                  key={tName}
                  className="flex items-center justify-between p-3 rounded-xl bg-[#151519] border border-[#212126] hover:border-neutral-500 hover:bg-[#151519] transition-all"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-neutral-500">📋</span>
                    <strong className="text-xs font-mono text-neutral-200 truncate">{tName}</strong>
                  </div>
                  <CopyButton text={tName} variant="compact" label="Copy" />
                </div>
              ))}
            </div>
          </div>
        ) : tables.length > 0 ? (
          <div className="p-8 rounded-xl bg-[#151519] border border-[#212126] text-center">
            <p className="text-xs text-neutral-400">No tables match your search filter.</p>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-[#151519] border border-[#212126] flex flex-col gap-2">
            <h3 className="text-xs font-bold text-neutral-200">Storage Configuration</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Standalone embedded SQLite persistence configured with zero external cloud credentials needed. Automatic WAL mode and schema synchronization managed at startup.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
