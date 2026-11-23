import React, { useState, useMemo } from 'react';
import CopyButton from '../../../components/CopyButton';
import Markdown from '../../../components/Markdown';
import TableOfContents from '../../../components/TableOfContents';
import CodeSnippetGenerator from '../../../components/CodeSnippetGenerator';
import { PackageData, MarkdownBlock } from '../../../types';

function PackageIconSvg({ pkg }: { pkg: PackageData }) {
  if (pkg.pythonModule || pkg.hasPythonManifest) {
    return (
      <div className="pkg-badge-icon python" title="Python Package">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
          <path
            d="M11.91 2C6.91 2 7.23 4.17 7.23 4.17L7.24 6.42H12V7.1H5.16S2 6.74 2 11.75c0 5 2.76 4.83 2.76 4.83H6.4v-2.31s-.15-2.76 2.71-2.76h4.63s2.59.04 2.59-2.52V4.56S16.92 2 11.91 2zm-2.07 1.54a.88.88 0 1 1 0 1.76.88.88 0 0 1 0-1.76z"
            fill="url(#py-grad-blue)"
          />
          <path
            d="M12.09 22c5 0 4.68-2.17 4.68-2.17l-.01-2.25H12v-.68h6.84S22 17.26 22 12.25c0-5-2.76-4.83-2.76-4.83h-1.64v2.31s.15 2.76-2.71 2.76H10.26s-2.59-.04-2.59 2.52v4.43S7.08 22 12.09 22zm2.07-1.54a.88.88 0 1 1 0-1.76.88.88 0 0 1 0 1.76z"
            fill="url(#py-grad-yellow)"
          />
          <defs>
            <linearGradient id="py-grad-blue" x1="2" y1="2" x2="16.92" y2="16.58" gradientUnits="userSpaceOnUse">
              <stop stopColor="#38bdf8" />
              <stop offset="1" stopColor="#2563eb" />
            </linearGradient>
            <linearGradient id="py-grad-yellow" x1="7.08" y1="7.42" x2="22" y2="22" gradientUnits="userSpaceOnUse">
              <stop stopColor="#fde047" />
              <stop offset="1" stopColor="#eab308" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    );
  }

  if (pkg.name?.includes('config')) {
    return (
      <div className="pkg-badge-icon config" title="Configuration Package">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      </div>
    );
  }

  return (
    <div className="pkg-badge-icon npm" title="NPM Workspace Package">
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16.5 9.4 7.55 4.24a1.78 1.78 0 0 0-2.5 1.55v12.42a1.78 1.78 0 0 0 2.5 1.55L16.5 14.6a1.78 1.78 0 0 0 0-3.2z" />
        <polyline points="3.29 7 12 12 20.71 7" />
        <line x1="12" y1="22" x2="12" y2="12" />
      </svg>
    </div>
  );
}

interface CodePanelProps {
  title: string;
  language: string;
  value: string;
  iconType?: 'npm' | 'python';
}

function CodePanel({ title, language, value, iconType }: CodePanelProps) {
  const binary = value.startsWith('npm') ? 'npm' : value.startsWith('pip') ? 'pip' : '';
  const rest = binary ? value.slice(binary.length).trim() : value;

  return (
    <div className="detail-code-panel">
      <div className="detail-code-heading">
        <div className="terminal-header-left">
          <div className="terminal-dots" aria-hidden="true">
            <span className="dot dot-red" />
            <span className="dot dot-yellow" />
            <span className="dot dot-green" />
          </div>
          <div className="terminal-title-group">
            <strong className="terminal-title">{title}</strong>
            <span className="terminal-badge">{language}</span>
          </div>
        </div>
        <CopyButton text={value} label="Copy" copiedLabel="Copied!" variant="compact" />
      </div>
      <div className="terminal-body" onClick={() => navigator.clipboard.writeText(value)} title="Click to copy command">
        <div className="terminal-line">
          <span className="terminal-prompt" aria-hidden="true">$</span>
          <code className="terminal-code">
            {binary ? (
              <>
                <span className={`cmd-binary ${iconType || binary}`}>{binary}</span>{' '}
                <span className="cmd-args">{rest}</span>
              </>
            ) : (
              <span>{value}</span>
            )}
          </code>
        </div>
      </div>
    </div>
  );
}

interface PackageExportsProps {
  pkg: PackageData;
}

function PackageExports({ pkg }: PackageExportsProps) {
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
        <p className="no-exports-msg">No symbols or exports match "{filter}".</p>
      )}
    </section>
  );
}

interface ManifestTabProps {
  pkg: PackageData;
}

function ManifestTab({ pkg }: ManifestTabProps) {
  const deps = Object.entries(pkg.dependencies || {});
  const devDeps = Object.entries(pkg.devDependencies || {});
  const peerDeps = Object.entries(pkg.peerDependencies || {});
  const pyDeps = pkg.pythonDependencies || [];

  return (
    <div className="manifest-tab-content">
      <div className="manifest-summary-grid">
        <div className="manifest-info-card">
          <h4>Package Information</h4>
          <dl className="manifest-dl">
            <dt>Package ID</dt>
            <dd><code>{pkg.id}</code></dd>
            <dt>Full Name</dt>
            <dd><code>{pkg.name}</code></dd>
            <dt>Version</dt>
            <dd><span className="version-pill">v{pkg.version}</span></dd>
            <dt>License</dt>
            <dd>{pkg.license || 'MIT'}</dd>
            {pkg.pythonModule && (
              <>
                <dt>Python Module</dt>
                <dd><code>{pkg.pythonModule}</code></dd>
              </>
            )}
          </dl>
        </div>

        <div className="manifest-info-card">
          <h4>Ecosystem Status</h4>
          <dl className="manifest-dl">
            <dt>npm Workspace</dt>
            <dd>{pkg.hasNpmManifest ? '✅ Yes (package.json)' : '❌ No'}</dd>
            <dt>Python Package</dt>
            <dd>{pkg.hasPythonManifest ? '✅ Yes (pyproject.toml)' : '❌ No'}</dd>
            <dt>TypeScript Typings</dt>
            <dd>{(pkg.typeScriptExports || []).length > 0 ? '✅ Included' : 'Included via presets'}</dd>
          </dl>
        </div>
      </div>

      {deps.length > 0 && (
        <div className="dep-group">
          <h3>Runtime Dependencies ({deps.length})</h3>
          <div className="dep-chips">
            {deps.map(([dep, ver]) => (
              <span className="dep-chip" key={dep}>
                <strong>{dep}</strong>
                <code>{ver}</code>
              </span>
            ))}
          </div>
        </div>
      )}

      {devDeps.length > 0 && (
        <div className="dep-group">
          <h3>Dev Dependencies ({devDeps.length})</h3>
          <div className="dep-chips">
            {devDeps.map(([dep, ver]) => (
              <span className="dep-chip dev" key={dep}>
                <strong>{dep}</strong>
                <code>{ver}</code>
              </span>
            ))}
          </div>
        </div>
      )}

      {peerDeps.length > 0 && (
        <div className="dep-group">
          <h3>Peer Dependencies ({peerDeps.length})</h3>
          <div className="dep-chips">
            {peerDeps.map(([dep, ver]) => (
              <span className="dep-chip peer" key={dep}>
                <strong>{dep}</strong>
                <code>{ver}</code>
              </span>
            ))}
          </div>
        </div>
      )}

      {pyDeps.length > 0 && (
        <div className="dep-group">
          <h3>Python Dependencies ({pyDeps.length})</h3>
          <div className="dep-chips">
            {pyDeps.map((dep) => (
              <span className="dep-chip py" key={dep}>
                <code>{dep}</code>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export interface PackageDetailViewProps {
  key?: React.Key;
  pkg: PackageData;
  onBack?: () => void;
}

export default function PackageDetailView({ pkg, onBack }: PackageDetailViewProps) {
  const [activeTab, setActiveTab] = useState<'docs' | 'api' | 'playground' | 'manifest'>('docs');
  const headings = (pkg.readmeBlocks || []).filter((block) => block.type === 'h2' || block.type === 'h3');
  const totalExports = (pkg.exports || []).length + (pkg.pythonExports || []).length + (pkg.typeScriptExports || []).length;

  return (
    <article className="package-detail">
      <header className="detail-header package-hero">
        {/* Navigation Breadcrumb Row */}
        <div className="breadcrumb-nav-row">
          <div className="breadcrumb">
            {onBack ? (
              <button type="button" className="project-back-pill-btn" onClick={onBack} title="Back to Packages Dashboard">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
                <span>Back</span>
              </button>
            ) : (
              <a href="#packages" className="project-back-pill-btn" title="Back to Packages Dashboard">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
                <span>Back</span>
              </a>
            )}
            <span className="crumb-workspace">Soul Workspace</span>
            <span className="crumb-sep" aria-hidden="true">›</span>
            <a href="#packages" className="crumb-link" onClick={(e) => { e.preventDefault(); onBack?.(); }}>
              Pillar 2: Packages Dashboard
            </a>
            <span className="crumb-sep" aria-hidden="true">›</span>
            <strong className="crumb-active">{pkg.name || pkg.displayName}</strong>
          </div>

          <div className="detail-top-actions">
            <CopyButton
              text={pkg.name || pkg.id}
              label="Copy Name"
              copiedLabel="Name copied!"
              variant="compact"
            />
            <CopyButton
              text={window.location.href}
              label="Share link"
              copiedLabel="Link copied!"
              variant="compact"
            />
          </div>
        </div>

        {/* Hero Body: Left Identity/Description/Tags + Right 2x2 Metadata Grid */}
        <div className="package-hero-body">
          <div className="package-hero-main">
            <PackageIconSvg pkg={pkg} />
            <div className="package-title-copy">
              <div className="title-with-badge">
                <h1>{pkg.name || pkg.displayName}</h1>
                <span className="package-version-pill">
                  <span className="pulse-dot" aria-hidden="true" />
                  v{pkg.version || '1.0.0'}
                </span>
              </div>
              {pkg.description && <p className="detail-description">{pkg.description}</p>}
            </div>
          </div>

          {/* 4-Card Metadata Grid (2x2) */}
          <div className="package-metadata">
            <div className="pkg-meta-card version-card">
              <div className="meta-card-top">
                <span className="meta-icon version-icon">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                    <line x1="7" y1="7" x2="7.01" y2="7" />
                  </svg>
                </span>
                <span className="meta-label">VERSION</span>
              </div>
              <strong className="meta-val meta-emerald">v{pkg.version || '1.0.0'}</strong>
            </div>

            <div className="pkg-meta-card license-card">
              <div className="meta-card-top">
                <span className="meta-icon license-icon">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </span>
                <span className="meta-label">LICENSE</span>
              </div>
              <strong className="meta-val meta-amber">{pkg.license || 'MIT'}</strong>
            </div>

            <div className="pkg-meta-card eco-card">
              <div className="meta-card-top">
                <span className="meta-icon eco-icon">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 2 7 12 12 22 7 12 2" />
                    <polyline points="2 17 12 22 22 17" />
                    <polyline points="2 12 12 17 22 12" />
                  </svg>
                </span>
                <span className="meta-label">ECOSYSTEMS</span>
              </div>
              <strong className="meta-val meta-cyan">
                {[pkg.hasNpmManifest && 'npm', (pkg.hasPythonManifest || pkg.pythonModule) && 'Python'].filter(Boolean).join(' · ') || 'Universal'}
              </strong>
            </div>

            <div className="pkg-meta-card exports-card">
              <div className="meta-card-top">
                <span className="meta-icon exports-icon">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="16 18 22 12 16 6" />
                    <polyline points="8 6 2 12 8 18" />
                  </svg>
                </span>
                <span className="meta-label">TOTAL EXPORTS</span>
              </div>
              <strong className="meta-val meta-violet">{totalExports} symbols</strong>
            </div>
          </div>
        </div>

        {/* Header Tabs Separator */}
        <div className="header-tabs-separator" />

        {/* Modern Navigation Tabs inside Header */}
        <div className="package-detail-tabs" role="tablist" aria-label="Package sections">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'docs'}
            className={`tab-btn ${activeTab === 'docs' ? 'active' : ''}`}
            onClick={() => setActiveTab('docs')}
          >
            <span className="tab-svg-icon" aria-hidden="true">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
            </span>
            <span>Documentation</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'api'}
            className={`tab-btn ${activeTab === 'api' ? 'active' : ''}`}
            onClick={() => setActiveTab('api')}
          >
            <span className="tab-svg-icon" aria-hidden="true">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="16 18 22 12 16 6" />
                <polyline points="8 6 2 12 8 18" />
              </svg>
            </span>
            <span>API &amp; Exports</span>
            <span className="tab-count-pill">{totalExports}</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'playground'}
            className={`tab-btn ${activeTab === 'playground' ? 'active' : ''}`}
            onClick={() => setActiveTab('playground')}
          >
            <span className="tab-svg-icon" aria-hidden="true">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </span>
            <span>Code Generator</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'manifest'}
            className={`tab-btn ${activeTab === 'manifest' ? 'active' : ''}`}
            onClick={() => setActiveTab('manifest')}
          >
            <span className="tab-svg-icon" aria-hidden="true">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                <line x1="12" y1="22.08" x2="12" y2="12" />
              </svg>
            </span>
            <span>Manifest &amp; Metadata</span>
          </button>
        </div>
      </header>

      {/* Tab Panels */}
      {activeTab === 'docs' && (
        <div className="package-document-layout">
          <TableOfContents headings={headings} title="On this page" />
          <section className="detail-section readme-section">
            <div className="section-heading readme-heading">
              <div>
                <span className="section-kicker">REFERENCE</span>
                <h2>Package documentation</h2>
              </div>
              <span className="readme-source">README.md</span>
            </div>
            <div className="markdown-content">
              <Markdown blocks={pkg.readmeBlocks || []} skipFirstHeading />
            </div>
          </section>
        </div>
      )}

      {activeTab === 'api' && (
        <PackageExports pkg={pkg} />
      )}

      {activeTab === 'playground' && (
        <section className="detail-section playground-section">
          <CodeSnippetGenerator pkgId={pkg.id} />
        </section>
      )}

      {activeTab === 'manifest' && (
        <section className="detail-section manifest-section">
          <ManifestTab pkg={pkg} />
        </section>
      )}
    </article>
  );
}
