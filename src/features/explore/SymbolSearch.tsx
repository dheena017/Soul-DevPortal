import React, { useState, useMemo } from 'react';
import CopyButton from '../../components/CopyButton';
import { PackageData } from '../../types';
import { EXPLORE_LANGUAGE_FILTERS, EXPLORE_SYMBOL_KINDS } from './exploreConstants';

export interface SymbolSearchProps {
  packages?: PackageData[];
}

export default function SymbolSearch({ packages = [] }: SymbolSearchProps) {
  const [query, setQuery] = useState('');
  const [language, setLanguage] = useState<'all' | 'typescript' | 'python'>('all');
  const [kind, setKind] = useState<string>('all');

  // Flatten all symbols from packages across typeScriptExports, pythonExports, and symbols
  const allSymbols = useMemo(() => {
    const list: Array<{
      packageId: string;
      packageName: string;
      name: string;
      kind: string;
      language: string;
      signature?: string;
      docstring?: string;
    }> = [];

    packages.forEach((pkg) => {
      const pkgName = pkg.displayName || pkg.name;

      // 1. Explicit AST symbols if present
      if (Array.isArray(pkg.symbols) && pkg.symbols.length > 0) {
        pkg.symbols.forEach((sym) => {
          list.push({
            packageId: pkg.id,
            packageName: pkgName,
            name: sym.name,
            kind: sym.kind || (sym.name.startsWith('use') ? 'function' : 'class'),
            language: sym.language || (pkg.pythonModule ? 'python' : 'typescript'),
            signature: sym.signature || sym.name,
            docstring: sym.docstring,
          });
        });
      }

      // 2. TypeScript Exports
      (pkg.typeScriptExports || []).forEach((name) => {
        list.push({
          packageId: pkg.id,
          packageName: pkgName,
          name,
          kind: name.startsWith('I') && name[1] === name[1].toUpperCase() ? 'interface' : name.charAt(0) === name.charAt(0).toUpperCase() ? 'class' : 'function',
          language: 'typescript',
          signature: `export const ${name}: any`,
          docstring: `TypeScript export from ${pkgName}`,
        });
      });

      // 3. Python Public API Exports
      (pkg.pythonExports || []).forEach((name) => {
        list.push({
          packageId: pkg.id,
          packageName: pkgName,
          name,
          kind: name.charAt(0) === name.charAt(0).toUpperCase() ? 'class' : 'function',
          language: 'python',
          signature: `from ${pkg.pythonModule || pkgName} import ${name}`,
          docstring: `Python module export from ${pkg.pythonModule || pkgName}`,
        });
      });

      // 4. Manifest Export Subpaths
      (pkg.exports || []).forEach((expPath) => {
        if (expPath !== '.') {
          const importTarget = `${pkg.name}${expPath.startsWith('./') ? expPath.slice(1) : `/${expPath}`}`;
          list.push({
            packageId: pkg.id,
            packageName: pkgName,
            name: expPath,
            kind: 'type',
            language: 'typescript',
            signature: `import "${importTarget}";`,
            docstring: `Exported subpath entrypoint: ${importTarget}`,
          });
        }
      });
    });

    return list;
  }, [packages]);

  const filteredSymbols = useMemo(() => {
    let results = allSymbols;

    if (language !== 'all') {
      results = results.filter((s) => s.language.toLowerCase() === language);
    }

    if (kind !== 'all') {
      results = results.filter((s) => s.kind.toLowerCase() === kind.toLowerCase());
    }

    if (query.trim()) {
      const q = query.toLowerCase().trim();
      results = results.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          (s.signature || '').toLowerCase().includes(q) ||
          (s.docstring || '').toLowerCase().includes(q) ||
          s.packageName.toLowerCase().includes(q)
      );
    }

    return results;
  }, [allSymbols, language, kind, query]);

  return (
    <div className="symbol-search-container">
      <div className="symbol-search-controls">
        <div className="symbol-search-input-wrap">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search symbols, signatures, functions, classes across all monorepo packages..."
            aria-label="Filter AST symbols"
          />
          {query && (
            <button type="button" className="clear-api-search" onClick={() => setQuery('')}>
              ✕
            </button>
          )}
        </div>

        <div className="symbol-filter-bar">
          <div className="symbol-filter-group">
            <span className="filter-label">Language:</span>
            {EXPLORE_LANGUAGE_FILTERS.map((lang) => (
              <button
                key={lang.id}
                type="button"
                className={`filter-pill ${language === lang.id ? 'active' : ''}`}
                onClick={() => setLanguage(lang.id as any)}
              >
                {lang.label}
              </button>
            ))}
          </div>

          <div className="symbol-filter-group">
            <span className="filter-label">Kind:</span>
            {EXPLORE_SYMBOL_KINDS.map((k) => (
              <button
                key={k}
                type="button"
                className={`filter-pill ${kind === k ? 'active' : ''}`}
                onClick={() => setKind(k)}
              >
                {k.charAt(0).toUpperCase() + k.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="symbol-results-meta">
        <span>Showing <strong>{filteredSymbols.length}</strong> of {allSymbols.length} indexed AST symbols</span>
      </div>

      {filteredSymbols.length > 0 ? (
        <div className="symbol-results-grid">
          {filteredSymbols.map((sym, idx) => (
            <div className="symbol-card" key={`${sym.packageId}-${sym.name}-${idx}`}>
              <div className="symbol-card-header">
                <div className="symbol-name-row">
                  <span className={`symbol-kind-badge ${sym.kind.toLowerCase()}`}>{sym.kind}</span>
                  <span className={`symbol-lang-badge ${sym.language.toLowerCase()}`}>
                    {sym.language === 'python' ? 'PY' : 'TS'}
                  </span>
                  <code className="symbol-name">{sym.name}</code>
                </div>
                <CopyButton
                  text={
                    sym.language === 'python'
                      ? `from ${sym.packageName} import ${sym.name}`
                      : `import { ${sym.name} } from '${sym.packageName}';`
                  }
                  variant="compact"
                  label="Copy Import"
                />
              </div>

              {sym.signature && (
                <div className="symbol-signature">
                  <pre>
                    <code>{sym.signature}</code>
                  </pre>
                </div>
              )}

              {sym.docstring && (
                <p className="symbol-docstring">{sym.docstring}</p>
              )}

              <div className="symbol-card-footer">
                <span className="symbol-origin-pkg">Package: <code>{sym.packageName}</code></span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="symbol-empty-state">
          <p>No symbols found matching "{query}". Try clearing filters or searching for another symbol.</p>
        </div>
      )}
    </div>
  );
}
