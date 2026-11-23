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

  const filteredKeys = useMemo(() => {
    const needle = filter.trim().toLowerCase();
    if (!needle) return envKeys;
    return envKeys.filter((k) => k.toLowerCase().includes(needle));
  }, [envKeys, filter]);

  return (
    <section className="w-full p-5 md:p-6 rounded-2xl bg-[#111111] border border-[#222222] shadow-xl flex flex-col gap-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1f1f1f]">
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-500">CONFIGURATION REGISTRY</span>
          <h2 className="text-lg font-bold text-white">Environment Variables &amp; Secret Keys</h2>
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
                className="w-full h-9 pl-9 pr-8 rounded-lg bg-[#0e0e0e] border border-[#262626] text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-sky-500 transition-all font-mono"
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
          )}
          <button
            type="button"
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#181818] border border-[#2c2c2c] text-neutral-300 hover:text-white hover:border-[#444444] transition-all"
            onClick={onToggleSecretPlaceholders}
          >
            {showSecretPlaceholders ? 'Mask Secrets' : 'Show Placeholders'}
          </button>
          <CopyButton text={sampleEnvFile} label="Copy .env Template" copiedLabel=".env copied!" />
        </div>
      </div>

      {envKeys.length > 0 ? (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between pb-2">
            <span className="text-xs font-bold text-white">Declared Configuration Keys</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-neutral-800 text-neutral-300">
              {filteredKeys.length} variables
            </span>
          </div>

          <div className="flex flex-col gap-2">
            {filteredKeys.map((key) => {
              const isSecret = key.includes('SECRET') || key.includes('KEY') || key.includes('TOKEN') || key.includes('PASSWORD');
              let displayVal = 'unset';
              let isSet = false;

              if (key === 'PORT' || key === 'BACKEND_PORT') {
                displayVal = `${project.backendPort || 8000}`;
                isSet = true;
              } else if (key === 'FRONTEND_PORT') {
                displayVal = `${project.frontendPort || 5173}`;
                isSet = true;
              } else if (key === 'BACKEND_URL') {
                displayVal = `http://127.0.0.1:${project.backendPort || 8000}`;
                isSet = true;
              } else if (key === 'APP_URL') {
                displayVal = `http://localhost:${project.frontendPort || 5173}`;
                isSet = true;
              } else if (key === 'NODE_ENV') {
                displayVal = 'development';
                isSet = true;
              } else if (isSecret) {
                displayVal = showSecretPlaceholders ? 'sk_monorepo_sample_secret_key' : '••••••••••••••••';
                isSet = showSecretPlaceholders;
              }

              return (
                <div
                  key={key}
                  className="flex items-center justify-between p-3 rounded-xl bg-[#0e0e0e] border border-[#202020] hover:border-[#333333] transition-all gap-3"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs">{isSecret ? '🔒' : '⚙️'}</span>
                    <code className="text-xs font-mono font-bold text-neutral-200 truncate">{key}</code>
                    {isSecret && (
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold uppercase bg-amber-500/10 border border-amber-500/25 text-amber-400">
                        Secret
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <code
                      className={`text-xs font-mono truncate max-w-[220px] ${
                        isSet ? 'text-emerald-400' : 'text-neutral-500 italic'
                      }`}
                    >
                      {displayVal}
                    </code>
                    <CopyButton text={key} variant="compact" label="Copy Key" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <p className="text-xs text-neutral-400">No environment variables explicitly declared in .env.example.</p>
      )}

      {/* Dependencies Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-[#1f1f1f]">
        <div className="flex flex-col gap-3 p-4 rounded-xl bg-[#0e0e0e] border border-[#202020]">
          <div className="flex items-center justify-between pb-2 border-b border-[#1c1c1c]">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <span>📦</span>
              <span>Production Dependencies</span>
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-neutral-800 text-neutral-300">
              {depsEntries.length}
            </span>
          </div>
          <div className="flex flex-col gap-1.5 max-h-[220px] overflow-y-auto pr-1">
            {depsEntries.length > 0 ? (
              depsEntries.map(([dep, ver]) => (
                <div key={dep} className="flex items-center justify-between text-xs py-1 border-b border-[#161616]">
                  <code className="text-sky-300 font-mono truncate">{dep}</code>
                  <span className="text-neutral-500 font-mono text-[11px] shrink-0">{ver}</span>
                </div>
              ))
            ) : (
              <span className="text-xs text-neutral-500 italic">No production dependencies listed</span>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3 p-4 rounded-xl bg-[#0e0e0e] border border-[#202020]">
          <div className="flex items-center justify-between pb-2 border-b border-[#1c1c1c]">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <span>🛠️</span>
              <span>Dev Dependencies</span>
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-neutral-800 text-neutral-300">
              {devDepsEntries.length}
            </span>
          </div>
          <div className="flex flex-col gap-1.5 max-h-[220px] overflow-y-auto pr-1">
            {devDepsEntries.length > 0 ? (
              devDepsEntries.map(([dep, ver]) => (
                <div key={dep} className="flex items-center justify-between text-xs py-1 border-b border-[#161616]">
                  <code className="text-purple-300 font-mono truncate">{dep}</code>
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
