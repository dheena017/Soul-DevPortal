import React, { useState, useMemo } from 'react';
import CopyButton from '../../../components/CopyButton';
import { PackageData } from '../../../types';

export interface PackageApiTabProps {
  pkg: PackageData;
}

export default function PackageApiTab({ pkg }: PackageApiTabProps) {
  const [filter, setFilter] = useState<string>('');
  const npmExports = pkg.exports || [];
  const pyExports = pkg.pythonExports || [];
  const tsExports = pkg.typeScriptExports || [];
  const scripts = pkg.scripts || {};

  const npmImports = useMemo(() => {
    return npmExports.map((exportPath) => ({
      exportPath,
      importPath: exportPath === '.' ? pkg.name : `${pkg.name}${exportPath.startsWith('./') ? exportPath.slice(1) : `/${exportPath}`}`,
    }));
  }, [npmExports, pkg.name]);

  const needle = filter.trim().toLowerCase();

  const filteredNpm = useMemo(() => {
    if (!needle) return npmImports;
    return npmImports.filter((i) => i.importPath.toLowerCase().includes(needle) || i.exportPath.toLowerCase().includes(needle));
  }, [npmImports, needle]);

  const filteredTs = useMemo(() => {
    if (!needle) return tsExports;
    return tsExports.filter((s) => s.toLowerCase().includes(needle));
  }, [tsExports, needle]);

  const filteredPy = useMemo(() => {
    if (!needle) return pyExports;
    return pyExports.filter((s) => s.toLowerCase().includes(needle));
  }, [pyExports, needle]);

  const filteredScripts = useMemo(() => {
    if (!needle) return Object.entries(scripts);
    return Object.entries(scripts).filter(([k, v]) => k.toLowerCase().includes(needle) || v.toLowerCase().includes(needle));
  }, [scripts, needle]);

  return (
    <section className="w-full p-5 md:p-6 rounded-2xl bg-[#111111] border border-[#222222] shadow-2xl flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1a1a1a]">
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-400">PACKAGE API</span>
          <h2 className="text-lg font-bold text-neutral-200">Exports &amp; Symbols Catalog</h2>
        </div>
        <div className="relative flex items-center min-w-[240px]">
          <svg className="absolute left-3 w-3.5 h-3.5 text-neutral-500 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter export paths or symbol names..."
            aria-label="Filter export symbols"
            className="w-full h-9 pl-9 pr-8 rounded-lg bg-[#111111] border border-[#222222] text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-neutral-500 transition-all font-mono"
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

      {filteredNpm.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between pb-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#111111] border border-[#222222] text-neutral-300">
                NPM
              </span>
              <h3 className="text-xs font-bold text-neutral-200">npm import paths</h3>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-[#111111] border border-[#222222] text-neutral-300">
              {filteredNpm.length} paths
            </span>
          </div>

          <div className="flex flex-col gap-2">
            {filteredNpm.map(({ exportPath, importPath }) => (
              <div
                key={exportPath}
                className="flex items-center justify-between p-3 rounded-xl bg-[#111111] border border-[#222222] hover:border-neutral-500 hover:bg-[#111111] transition-all gap-3"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-[#111111] border border-[#222222] text-neutral-400">
                    import
                  </span>
                  <code className="text-xs font-mono text-neutral-300 font-bold truncate">{importPath}</code>
                  <span className="text-[11px] font-mono text-neutral-500 hidden sm:inline truncate">
                    ↳ export <code>{exportPath}</code>
                  </span>
                </div>
                <CopyButton text={`import {} from '${importPath}';`} label="Copy Import" copiedLabel="Copied!" variant="compact" />
              </div>
            ))}
          </div>
        </div>
      )}

      {filteredTs.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between pb-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#111111] border border-[#222222] text-neutral-300">
                TS
              </span>
              <h3 className="text-xs font-bold text-neutral-200">TypeScript Exported Symbols</h3>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-[#111111] border border-[#222222] text-neutral-300">
              {filteredTs.length} symbols
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {filteredTs.map((name) => (
              <div
                key={name}
                className="flex items-center justify-between p-2.5 rounded-lg bg-[#111111] border border-[#222222] hover:border-neutral-500 hover:bg-[#111111] transition-all gap-2"
                title={`TypeScript symbol: ${name}`}
              >
                <code className="text-xs font-mono text-neutral-200 truncate">{name}</code>
                <CopyButton text={name} variant="icon-only" title={`Copy symbol ${name}`} />
              </div>
            ))}
          </div>
        </div>
      )}

      {filteredPy.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between pb-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#111111] border border-[#222222] text-neutral-300">
                PY
              </span>
              <h3 className="text-xs font-bold text-neutral-200">Python Public API Symbols</h3>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-[#111111] border border-[#222222] text-neutral-300">
              {filteredPy.length} symbols
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {filteredPy.map((name) => (
              <div
                key={name}
                className="flex items-center justify-between p-2.5 rounded-lg bg-[#111111] border border-[#222222] hover:border-neutral-500 hover:bg-[#111111] transition-all gap-2"
                title={`from ${pkg.pythonModule || pkg.pythonName} import ${name}`}
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-[10px] font-mono text-neutral-300">def</span>
                  <code className="text-xs font-mono text-neutral-200 truncate">{name}</code>
                </div>
                <CopyButton
                  text={`from ${pkg.pythonModule || pkg.pythonName} import ${name}`}
                  variant="icon-only"
                  title={`Copy import statement for ${name}`}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {filteredScripts.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between pb-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#111111] border border-[#222222] text-neutral-300">
                RUN
              </span>
              <h3 className="text-xs font-bold text-neutral-200">Package Scripts</h3>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-[#111111] border border-[#222222] text-neutral-300">
              {filteredScripts.length} scripts
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {filteredScripts.map(([name, command]) => (
              <div
                key={name}
                className="flex items-center justify-between p-3 rounded-xl bg-[#111111] border border-[#222222] hover:border-neutral-500 hover:bg-[#111111] transition-all gap-3"
              >
                <div className="flex flex-col min-w-0">
                  <code className="text-xs font-mono font-bold text-neutral-300 truncate">{name}</code>
                  <span className="text-[11px] font-mono text-neutral-500 truncate">{command}</span>
                </div>
                <CopyButton text={`npm run ${name}`} variant="compact" label="Copy" copiedLabel="Copied!" />
              </div>
            ))}
          </div>
        </div>
      )}

      {filteredNpm.length === 0 && filteredTs.length === 0 && filteredPy.length === 0 && filteredScripts.length === 0 && (
        <p className="text-xs text-neutral-400 italic">No symbols or exports match &ldquo;{filter}&rdquo;.</p>
      )}
    </section>
  );
}
