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
    <section className="detail-section package-reference">
      <div className="section-heading-with-search">
        <div>
          <span className="section-kicker">PACKAGE API</span>
          <h2>Exports &amp; Symbols Catalog</h2>
        </div>
        <div className="api-search-box">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter export paths or symbol names..."
            aria-label="Filter export symbols"
          />
          {filter && (
            <button type="button" className="clear-api-search" onClick={() => setFilter('')} title="Clear filter">
              ✕
            </button>
          )}
        </div>
      </div>

      {filteredNpm.length > 0 && (
        <div className="reference-group">
          <div className="reference-group-header">
            <div className="group-header-title">
              <span className="group-header-icon npm">NPM</span>
              <h3>npm import paths</h3>
            </div>
            <span className="group-badge">{filteredNpm.length} paths</span>
          </div>
          <div className="reference-list">
            {filteredNpm.map(({ exportPath, importPath }) => (
              <div className="reference-row npm-row" key={exportPath}>
                <div className="ref-path-col">
                  <span className="ref-npm-badge">import</span>
                  <code className="ref-import-code">{importPath}</code>
                  <span className="ref-sub">
                    <span className="ref-sub-arrow">↳</span>
                    export <code>{exportPath}</code>
                  </span>
                </div>
                <CopyButton text={`import {} from '${importPath}';`} label="Copy Import" copiedLabel="Copied!" variant="compact" />
              </div>
            ))}
          </div>
        </div>
      )}

      {filteredTs.length > 0 && (
        <div className="reference-group">
          <div className="reference-group-header">
            <div className="group-header-title">
              <span className="group-header-icon ts">TS</span>
              <h3>TypeScript exported symbols</h3>
            </div>
            <span className="group-badge ts-badge">{filteredTs.length} symbols</span>
          </div>
          <div className="symbol-list">
            {filteredTs.map((name) => (
              <div className="symbol-card ts-card" key={name} title={`TypeScript symbol: ${name}`}>
                <span className="symbol-badge-pill ts-pill">TS</span>
                <code className="symbol-name">{name}</code>
                <CopyButton text={name} variant="icon-only" title={`Copy symbol ${name}`} />
              </div>
            ))}
          </div>
        </div>
      )}

      {filteredPy.length > 0 && (
        <div className="reference-group">
          <div className="reference-group-header">
            <div className="group-header-title">
              <span className="group-header-icon py">PY</span>
              <h3>Python public API symbols</h3>
            </div>
            <span className="group-badge py-badge">{filteredPy.length} symbols</span>
          </div>
          <div className="symbol-list">
            {filteredPy.map((name) => (
              <div
                className="symbol-card py-card"
                key={name}
                title={`from ${pkg.pythonModule || pkg.pythonName} import ${name}`}
              >
                <span className="symbol-badge-pill py-pill">def</span>
                <code className="symbol-name">{name}</code>
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
        <div className="reference-group">
          <div className="reference-group-header">
            <div className="group-header-title">
              <span className="group-header-icon script">RUN</span>
              <h3>Package scripts</h3>
            </div>
            <span className="group-badge">{filteredScripts.length} scripts</span>
          </div>
          <div className="reference-list">
            {filteredScripts.map(([name, command]) => (
              <div className="reference-row" key={name}>
                <div className="ref-path-col">
                  <code className="script-name">{name}</code>
                  <span className="script-command">{command}</span>
                </div>
                <CopyButton text={`npm run ${name}`} variant="compact" label="Copy" copiedLabel="Copied!" />
              </div>
            ))}
          </div>
        </div>
      )}

      {filteredNpm.length === 0 && filteredTs.length === 0 && filteredPy.length === 0 && filteredScripts.length === 0 && (
        <p className="no-exports-msg">No symbols or exports match &ldquo;{filter}&rdquo;.</p>
      )}
    </section>
  );
}
