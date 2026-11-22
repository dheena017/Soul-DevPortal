import React, { useState } from 'react';
import SymbolSearch from './SymbolSearch';
import PortProber from './PortProber';
import CodeSnippetGenerator from '../../components/CodeSnippetGenerator';
import { PackageData, ProjectData } from '../../types';

export interface ExploreViewProps {
  packages?: PackageData[];
  projects?: ProjectData[];
  onNavigate?: (id: string) => void;
}

export default function ExploreView({ packages = [], projects = [], onNavigate }: ExploreViewProps) {
  const [activeTab, setActiveTab] = useState<'symbols' | 'ports' | 'snippets'>('symbols');

  return (
    <div className="explore-view-container">
      <header className="detail-header pillar-hero-header">
        <div className="breadcrumb-nav-row">
          <div className="breadcrumb">
            <span>Soul Workspace</span>
            <span className="crumb-sep">/</span>
            <strong className="crumb-active">Pillar 4: Explore</strong>
          </div>

          <div className="header-status-pill">
            <span className="status-live-dot" aria-hidden="true" />
            <span>AST &amp; Socket Introspection</span>
          </div>
        </div>

        <div className="detail-title-row">
          <div className="package-title-copy">
            <div className="title-with-badge">
              <h1>Explore &amp; Introspection Engine</h1>
              <span className="monorepo-tag-pill">Pillar 4</span>
            </div>
            <p className="detail-description">
              Cross-cutting monorepo discovery: query static AST symbols, probe live socket ports, and generate integration snippets.
            </p>
          </div>
        </div>

        <div className="guides-switcher-row" role="tablist" aria-label="Explore tools">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'symbols'}
            className={`guide-tab-btn ${activeTab === 'symbols' ? 'active' : ''}`}
            onClick={() => setActiveTab('symbols')}
          >
            <span>🔍 AST Symbols Catalog</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'ports'}
            className={`guide-tab-btn ${activeTab === 'ports' ? 'active' : ''}`}
            onClick={() => setActiveTab('ports')}
          >
            <span>🌐 Port Prober &amp; Architecture</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'snippets'}
            className={`guide-tab-btn ${activeTab === 'snippets' ? 'active' : ''}`}
            onClick={() => setActiveTab('snippets')}
          >
            <span>🛠️ Code Snippet Generator</span>
          </button>
        </div>
      </header>

      <div className="explore-tab-content">
        {activeTab === 'symbols' && <SymbolSearch packages={packages} />}
        {activeTab === 'ports' && <PortProber />}
        {activeTab === 'snippets' && (
          <section className="detail-section playground-section">
            <CodeSnippetGenerator pkgId={packages[0]?.id || 'config'} />
          </section>
        )}
      </div>
    </div>
  );
}
