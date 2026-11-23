import React, { useState, useMemo } from 'react';
import CopyButton from '../../../components/CopyButton';
import Markdown from '../../../components/Markdown';
import TableOfContents from '../../../components/TableOfContents';
import CodeSnippetGenerator from '../../../components/CodeSnippetGenerator';
import { PackageData, MarkdownBlock } from '../../../types';

function packageIcon(pkg: PackageData): string {
  if (pkg.pythonModule) return 'PY';
  return pkg.name?.includes('config') ? 'CFG' : 'NPM';
}

interface CodePanelProps {
  title: string;
  language: string;
  value: string;
}

function CodePanel({ title, language, value }: CodePanelProps) {
  return (
    <div className="detail-code-panel">
      <div className="detail-code-heading">
        <div>
          <strong>{title}</strong>
          <span>{language}</span>
        </div>
        <CopyButton text={value} />
      </div>
      <pre>
        <code>{value}</code>
      </pre>
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
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
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
            <button type="button" className="clear-api-search" onClick={() => setFilter('')}>
              ✕
            </button>
          )}
        </div>
      </div>

      {filteredNpm.length > 0 && (
        <div className="reference-group">
          <div className="reference-group-header">
            <h3>npm import paths</h3>
            <span className="group-badge">{filteredNpm.length} paths</span>
          </div>
          <div className="reference-list">
            {filteredNpm.map(({ exportPath, importPath }) => (
              <div className="reference-row" key={exportPath}>
                <div className="ref-path-col">
                  <code>{importPath}</code>
                  <span className="ref-sub">export <code>{exportPath}</code></span>
                </div>
                <CopyButton text={`import {} from '${importPath}';`} label="Copy Import" copiedLabel="Copied" variant="compact" />
              </div>
            ))}
          </div>
        </div>
      )}

      {filteredTs.length > 0 && (
        <div className="reference-group">
          <div className="reference-group-header">
            <h3>TypeScript exported symbols</h3>
            <span className="group-badge">{filteredTs.length} symbols</span>
          </div>
          <div className="symbol-list">
            {filteredTs.map((name) => (
              <div className="symbol-item" key={name}>
                <code>{name}</code>
                <CopyButton text={name} variant="icon-only" title={`Copy symbol ${name}`} />
              </div>
            ))}
          </div>
        </div>
      )}

      {filteredPy.length > 0 && (
        <div className="reference-group">
          <div className="reference-group-header">
            <h3>Python public API symbols</h3>
            <span className="group-badge">{filteredPy.length} symbols</span>
          </div>
          <div className="symbol-list">
            {filteredPy.map((name) => (
              <div className="symbol-item py-symbol" key={name}>
                <code>{name}</code>
                <CopyButton text={`from ${pkg.pythonModule || pkg.pythonName} import ${name}`} variant="icon-only" title={`Copy import ${name}`} />
              </div>
            ))}
          </div>
        </div>
      )}

      {filteredScripts.length > 0 && (
        <div className="reference-group">
          <div className="reference-group-header">
            <h3>Package scripts</h3>
            <span className="group-badge">{filteredScripts.length} scripts</span>
          </div>
          <div className="reference-list">
            {filteredScripts.map(([name, command]) => (
              <div className="reference-row" key={name}>
                <code>{name}</code>
                <span>{command}</span>
                <CopyButton text={`npm run ${name}`} variant="compact" label="Copy" />
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
            <dd>{pkg.license}</dd>
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
            <dd>{pkg.hasNpmManifest ? '✅ Yes' : '❌ No'}</dd>
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
  const npmInstall = `npm install ${pkg.name || ''}`;
  const pythonInstall = `pip install -e Soul-DevPortal-Packages/${pkg.id}`;
  const totalExports = (pkg.exports || []).length + (pkg.pythonExports || []).length + (pkg.typeScriptExports || []).length;

  return (
    <article className="package-detail">
      <header className="detail-header package-hero">
        <div className="breadcrumb-nav-row">
          <div className="breadcrumb">
            {onBack ? (
              <button type="button" className="project-back-pill-btn" onClick={onBack}>
                <span className="back-arrow">←</span>
                <span>Back</span>
              </button>
            ) : (
              <a href="#packages" className="project-back-pill-btn">
                <span className="back-arrow">←</span>
                <span>Back</span>
              </a>
            )}
            <span>Soul Workspace</span>
            <span className="crumb-sep">/</span>
            <a href="#packages" className="crumb-link" onClick={(e) => { e.preventDefault(); onBack?.(); }}>
              Pillar 2: Packages Dashboard
            </a>
            <span className="crumb-sep">/</span>
            <strong className="crumb-active">{pkg.displayName || pkg.name}</strong>
          </div>

          <div className="detail-top-actions">
            <CopyButton text={window.location.href} label="Share link" copiedLabel="Link copied!" variant="compact" />
          </div>
        </div>

        <div className="detail-title-row">
          <span className="detail-icon">{packageIcon(pkg)}</span>
          <div className="package-title-copy">
            <h1>{pkg.displayName || pkg.name}</h1>
            <p>
              {pkg.pythonName || 'npm workspace package'}
              {pkg.pythonModule ? ` · ${pkg.pythonModule}` : ''}
            </p>
          </div>
          <span className="version-pill">v{pkg.version}</span>
        </div>

        {pkg.description && <p className="detail-description">{pkg.description}</p>}

        <div className="package-metadata">
          <div>
            <span>VERSION</span>
            <strong>{pkg.version}</strong>
          </div>
          <div>
            <span>LICENSE</span>
            <strong>{pkg.license}</strong>
          </div>
          <div>
            <span>ECOSYSTEMS</span>
            <strong>
              {[pkg.hasNpmManifest && 'npm', pkg.hasPythonManifest && 'Python'].filter(Boolean).join(' · ') || 'Not specified'}
            </strong>
          </div>
          <div>
            <span>TOTAL EXPORTS</span>
            <strong>{totalExports}</strong>
          </div>
        </div>
      </header>

      {/* Quick Install Section */}
      <section className="detail-section install-section">
        <div className="section-heading">
          <div>
            <span className="section-kicker">GET STARTED</span>
            <h2>Installation</h2>
          </div>
        </div>
        <div className={`install-grid ${pkg.hasPythonManifest ? '' : 'single'}`}>
          {pkg.hasNpmManifest && <CodePanel title="npm workspace" language="Run from monorepo root" value={npmInstall} />}
          {pkg.hasPythonManifest && <CodePanel title="Python editable install" language="Python 3.11+" value={pythonInstall} />}
        </div>
      </section>

      {/* Navigation Tabs */}
      <div className="package-detail-tabs" role="tablist" aria-label="Package sections">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'docs'}
          className={`tab-btn ${activeTab === 'docs' ? 'active' : ''}`}
          onClick={() => setActiveTab('docs')}
        >
          <span className="tab-icon">📑</span>
          <span>Documentation</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'api'}
          className={`tab-btn ${activeTab === 'api' ? 'active' : ''}`}
          onClick={() => setActiveTab('api')}
        >
          <span className="tab-icon">⚡</span>
          <span>API &amp; Exports ({totalExports})</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'playground'}
          className={`tab-btn ${activeTab === 'playground' ? 'active' : ''}`}
          onClick={() => setActiveTab('playground')}
        >
          <span className="tab-icon">🛠️</span>
          <span>Code Generator</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'manifest'}
          className={`tab-btn ${activeTab === 'manifest' ? 'active' : ''}`}
          onClick={() => setActiveTab('manifest')}
        >
          <span className="tab-icon">📦</span>
          <span>Manifest &amp; Metadata</span>
        </button>
      </div>

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
