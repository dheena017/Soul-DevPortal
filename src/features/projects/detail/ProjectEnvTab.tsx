import React, { useState, useMemo } from 'react';
import CopyButton from '../../../components/CopyButton';
import { ProjectData } from '../../../types';

export interface ProjectEnvTabProps {
  project: ProjectData;
  envKeys: string[];
  sampleEnvFile: string;
  showSecretPlaceholders: boolean;
  onToggleSecretPlaceholders: () => void;
  depsEntries: Array<[string, string]>;
  devDepsEntries: Array<[string, string]>;
}

export default function ProjectEnvTab({
  project,
  envKeys,
  sampleEnvFile,
  showSecretPlaceholders,
  onToggleSecretPlaceholders,
  depsEntries,
  devDepsEntries,
}: ProjectEnvTabProps) {
  const [filter, setFilter] = useState<string>('');
  const [filterType, setFilterType] = useState<'all' | 'secrets' | 'active'>('all');

  const { items, secretCount, activeCount } = useMemo(() => {
    let secrets = 0;
    let active = 0;

    const all = envKeys.map((key) => {
      const isSecret = key.includes('SECRET') || key.includes('KEY') || key.includes('TOKEN') || key.includes('PASSWORD') || key.includes('CREDENTIAL');
      let displayVal = 'unset';
      let isSet = false;

      if (key === 'PORT' || key === 'BACKEND_PORT') {
        displayVal = `${project.backendPort || 8000}`;
        isSet = true;
      } else if (key === 'FRONTEND_PORT' || key === 'CLIENT_PORT') {
        displayVal = `${project.frontendPort || 5173}`;
        isSet = true;
      } else if (key === 'BACKEND_URL') {
        displayVal = `http://127.0.0.1:${project.backendPort || 8000}`;
        isSet = true;
      } else if (key === 'APP_URL' || key === 'CLIENT_URL') {
        displayVal = `http://localhost:${project.frontendPort || 5173}`;
        isSet = true;
      } else if (key === 'NODE_ENV') {
        displayVal = 'development';
        isSet = true;
      } else if (isSecret) {
        displayVal = showSecretPlaceholders ? 'sk_monorepo_sample_secret_key' : '••••••••••••••••';
        isSet = showSecretPlaceholders;
      }

      if (isSecret) secrets++;
      if (isSet) active++;

      return { key, isSecret, displayVal, isSet };
    });

    return { items: all, secretCount: secrets, activeCount: active };
  }, [envKeys, project, showSecretPlaceholders]);

  const filteredItems = useMemo(() => {
    const needle = filter.trim().toLowerCase();
    return items.filter((item) => {
      if (filterType === 'secrets' && !item.isSecret) return false;
      if (filterType === 'active' && !item.isSet) return false;
      if (!needle) return true;
      return item.key.toLowerCase().includes(needle);
    });
  }, [items, filter, filterType]);

  return (
    <section className="w-full p-5 md:p-6 rounded-2xl bg-[#111111] border border-[#222222] shadow-2xl flex flex-col gap-5">
      {/* Top Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#1a1a1a]">
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-400">CONFIGURATION REGISTRY</span>
          <h2 className="text-lg font-bold text-neutral-200">Environment Variables &amp; Secret Keys</h2>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          {envKeys.length > 0 && (
            <div className="relative flex items-center min-w-[200px]">
              <svg className="absolute left-3 w-3.5 h-3.5 text-neutral-500 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Filter env variables..."
                aria-label="Filter env variables"
                className="w-full h-9 pl-9 pr-8 rounded-lg bg-[#0a0a0a] border border-[#222222] text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500/30 transition-all font-mono"
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
          <button
            type="button"
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#111111] border border-[#222222] text-neutral-300 hover:text-neutral-200 hover:border-neutral-500 transition-all"
            onClick={onToggleSecretPlaceholders}
          >
            {showSecretPlaceholders ? 'Mask Secrets' : 'Show Placeholders'}
          </button>
          <CopyButton text={sampleEnvFile} label="Copy .env Template" copiedLabel=".env copied!" />
        </div>
      </div>

      {envKeys.length > 0 ? (
        <div className="flex flex-col gap-3">
          {/* Section Toolbar & Quick Filter Pills */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-neutral-300">Declared Configuration Keys</span>
              <span className="px-2 py-0.5 rounded-full text-[10.5px] font-mono font-semibold bg-[#111111] border border-[#222222] text-neutral-300">
                {filteredItems.length} of {envKeys.length} variables
              </span>
            </div>

            <div className="flex items-center gap-1.5" role="radiogroup" aria-label="Filter variables">
              <button
                type="button"
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                  filterType === 'all'
                    ? 'bg-[#111111] text-neutral-200 font-bold shadow-sm border border-[#222222]'
                    : 'bg-[#111111] border border-[#222222] text-neutral-400 hover:text-neutral-200 hover:bg-[#111111] hover:border-neutral-500'
                }`}
                onClick={() => setFilterType('all')}
              >
                All ({envKeys.length})
              </button>
              <button
                type="button"
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                  filterType === 'secrets'
                    ? 'bg-[#111111] text-neutral-200 font-bold shadow-sm border border-[#222222]'
                    : 'bg-[#111111] border border-[#222222] text-neutral-400 hover:text-neutral-200 hover:bg-[#111111] hover:border-neutral-500'
                }`}
                onClick={() => setFilterType('secrets')}
              >
                Secrets ({secretCount})
              </button>
              <button
                type="button"
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                  filterType === 'active'
                    ? 'bg-[#111111] text-neutral-200 font-bold shadow-sm border border-[#222222]'
                    : 'bg-[#111111] border border-[#222222] text-neutral-400 hover:text-neutral-200 hover:bg-[#111111] hover:border-neutral-500'
                }`}
                onClick={() => setFilterType('active')}
              >
                Active ({activeCount})
              </button>
            </div>
          </div>

          {/* 2-Column Responsive Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
            {filteredItems.map((item) => {
              return (
                <div
                  key={item.key}
                  className="flex items-center justify-between p-2.5 px-3 rounded-xl bg-[#111111] border border-[#222222] hover:border-neutral-500 hover:bg-[#111111] transition-all gap-2"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="text-xs shrink-0">{item.isSecret ? '🔒' : '⚙️'}</span>
                    <code className="text-xs font-mono font-semibold text-neutral-200 truncate" title={item.key}>
                      {item.key}
                    </code>
                    {item.isSecret && (
                      <span className="px-1.5 py-0.5 rounded text-[9.5px] font-mono font-bold uppercase bg-[#111111] border border-[#222222] text-neutral-300 shrink-0">
                        Secret
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <code
                      className={`text-xs font-mono truncate max-w-[140px] sm:max-w-[170px] ${
                        item.isSet ? 'text-neutral-300' : 'text-neutral-500 italic'
                      }`}
                      title={item.displayVal}
                    >
                      {item.displayVal}
                    </code>
                    <CopyButton text={item.key} variant="compact" label="Copy Key" />
                  </div>
                </div>
              );
            })}
          </div>

          {filteredItems.length === 0 && (
            <div className="py-8 flex flex-col items-center justify-center text-center gap-2 bg-[#111111] border border-[#222222] rounded-xl">
              <span className="text-2xl">🔍</span>
              <p className="text-xs text-neutral-300 font-semibold">No environment variables match &ldquo;{filter}&rdquo;</p>
              <button
                type="button"
                className="px-3 py-1 text-xs rounded-md bg-[#111111] border border-[#222222] text-neutral-300 hover:text-neutral-200 hover:border-neutral-500"
                onClick={() => {
                  setFilter('');
                  setFilterType('all');
                }}
              >
                Reset Filter
              </button>
            </div>
          )}
        </div>
      ) : (
        <p className="text-xs text-neutral-400">No environment variables explicitly declared in .env.example.</p>
      )}

      {/* Dependencies Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-[#1a1a1a]">
        <div className="flex flex-col gap-3 p-4 rounded-xl bg-[#111111] border border-[#222222]">
          <div className="flex items-center justify-between pb-2 border-b border-[#1a1a1a]">
            <span className="text-xs font-bold text-neutral-300 flex items-center gap-1.5">
              <span>📦</span>
              <span>Production Dependencies</span>
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-[#111111] border border-[#222222] text-neutral-300">
              {depsEntries.length}
            </span>
          </div>
          <div className="flex flex-col gap-1.5 max-h-[220px] overflow-y-auto pr-1">
            {depsEntries.length > 0 ? (
              depsEntries.map(([dep, ver]) => (
                <div key={dep} className="flex items-center justify-between text-xs py-1 border-b border-[#1a1a1a] last:border-0">
                  <code className="text-neutral-200 font-mono truncate">{dep}</code>
                  <span className="text-neutral-500 font-mono text-[11px] shrink-0">{ver}</span>
                </div>
              ))
            ) : (
              <span className="text-xs text-neutral-500 italic">No production dependencies listed</span>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3 p-4 rounded-xl bg-[#111111] border border-[#222222]">
          <div className="flex items-center justify-between pb-2 border-b border-[#1a1a1a]">
            <span className="text-xs font-bold text-neutral-300 flex items-center gap-1.5">
              <span>🛠️</span>
              <span>Dev Dependencies</span>
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-[#111111] border border-[#222222] text-neutral-300">
              {devDepsEntries.length}
            </span>
          </div>
          <div className="flex flex-col gap-1.5 max-h-[220px] overflow-y-auto pr-1">
            {devDepsEntries.length > 0 ? (
              devDepsEntries.map(([dep, ver]) => (
                <div key={dep} className="flex items-center justify-between text-xs py-1 border-b border-[#1a1a1a] last:border-0">
                  <code className="text-neutral-300 font-mono truncate">{dep}</code>
                  <span className="text-neutral-500 font-mono text-[11px] shrink-0">{ver}</span>
                </div>
              ))
            ) : (
              <span className="text-xs text-neutral-500 italic">No dev dependencies listed</span>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
