import React from 'react';
import CopyButton from '../../../components/CopyButton';
import { GuideMeta } from '../docsConstants';

export type DocDetailTab = 'spec' | 'highlights' | 'snippets' | 'tables';

export interface DocDetailHeaderProps {
  guideMeta: GuideMeta;
  activeTab: DocDetailTab;
  onTabChange: (tab: DocDetailTab) => void;
  headingsCount: number;
  codeBlocksCount: number;
  tablesCount: number;
  onBack?: () => void;
}

export default function DocDetailHeader({
  guideMeta,
  activeTab,
  onTabChange,
  headingsCount,
  codeBlocksCount,
  tablesCount,
  onBack,
}: DocDetailHeaderProps) {
  return (
    <header className="detail-header pillar-hero-header doc-hero-header">
      {/* ── Top Row: Breadcrumb & Actions ── */}
      <div className="breadcrumb-nav-row">
        <div className="breadcrumb">
          {onBack ? (
            <button
              type="button"
              className="project-back-pill-btn"
              onClick={onBack}
              title="Return to docs dashboard"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              <span>Back</span>
            </button>
          ) : (
            <a href="#docs" className="project-back-pill-btn" title="Return to docs dashboard">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              <span>Back</span>
            </a>
          )}
          <span className="crumb-workspace">Soul Workspace</span>
          <span className="crumb-sep">/</span>
          <a
            href="#docs"
            className="crumb-link"
            onClick={(e) => {
              if (onBack) {
                e.preventDefault();
                onBack();
              }
            }}
          >
            Pillar 3: Docs Dashboard
          </a>
          <span className="crumb-sep">/</span>
          <strong className="crumb-active">{guideMeta.title}</strong>
        </div>

        <div className="detail-top-actions">
          <div className="header-status-pill">
            <span className="status-live-dot" aria-hidden="true" />
            <span>100% Monorepo Compliant (8/8 Apps)</span>
          </div>
          <CopyButton
            text={typeof window !== 'undefined' ? window.location.href : ''}
            label="Share link"
            copiedLabel="Link copied!"
            variant="compact"
          />
        </div>
      </div>

      {/* ── Title & Meta Row ── */}
      <div className="detail-title-row">
        <div className="doc-hero-icon-wrap" aria-hidden="true">
          <span className="doc-hero-icon">📜</span>
        </div>

        <div className="package-title-copy">
          <div className="title-with-badge">
            <span className="spec-badge">OFFICIAL SPEC V1.0</span>
            <span className="version-pill">v1.0.0</span>
          </div>

          <h1>{guideMeta.title}</h1>
          <p className="detail-description">{guideMeta.description}</p>
        </div>
      </div>

      {/* ── 5 Balanced Metadata Cards ── */}
      <div className="doc-meta-summary-grid">
        <div className="metadata-card">
          <div className="meta-card-header">
            <span aria-hidden="true">📑</span>
            <span className="meta-label">SECTIONS</span>
          </div>
          <strong className="meta-val meta-cyan">{headingsCount} headings</strong>
        </div>

        <div className="metadata-card">
          <div className="meta-card-header">
            <span aria-hidden="true">⏱️</span>
            <span className="meta-label">EST. READ TIME</span>
          </div>
          <strong className="meta-val meta-emerald">{guideMeta.readTime} read</strong>
        </div>

        <div className="metadata-card">
          <div className="meta-card-header">
            <span aria-hidden="true">💻</span>
            <span className="meta-label">CODE EXAMPLES</span>
          </div>
          <strong className="meta-val meta-violet">{codeBlocksCount} snippets</strong>
        </div>

        <div className="metadata-card">
          <div className="meta-card-header">
            <span aria-hidden="true">📊</span>
            <span className="meta-label">TABLES &amp; MATRICES</span>
          </div>
          <strong className="meta-val meta-emerald">{tablesCount} tables</strong>
        </div>

        <div className="metadata-card">
          <div className="meta-card-header">
            <span aria-hidden="true">🎯</span>
            <span className="meta-label">SCOPE</span>
          </div>
          <strong className="meta-val meta-amber">All 3 Pkgs &amp; 8 Apps</strong>
        </div>
      </div>

      {/* ── Header Tabs Separator ── */}
      <div className="header-tabs-separator" />

      {/* ── Integrated Header Navigation Tabs ── */}
      <div className="package-detail-tabs doc-tabs-bar" role="tablist" aria-label="Documentation guide sections">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'spec'}
          className={`tab-btn ${activeTab === 'spec' ? 'active' : ''}`}
          onClick={() => onTabChange('spec')}
        >
          <span className="tab-svg-icon" aria-hidden="true">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
          </span>
          <span>Full Specification</span>
          <span className="tab-count-pill">{headingsCount}</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'highlights'}
          className={`tab-btn ${activeTab === 'highlights' ? 'active' : ''}`}
          onClick={() => onTabChange('highlights')}
        >
          <span className="tab-svg-icon" aria-hidden="true">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </span>
          <span>Key Rules &amp; Highlights</span>
          <span className="tab-count-pill">{guideMeta.keyHighlights.length}</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'snippets'}
          className={`tab-btn ${activeTab === 'snippets' ? 'active' : ''}`}
          onClick={() => onTabChange('snippets')}
        >
          <span className="tab-svg-icon" aria-hidden="true">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="16 18 22 12 16 6" />
              <polyline points="8 6 2 12 8 18" />
            </svg>
          </span>
          <span>Code Snippets</span>
          <span className="tab-count-pill">{codeBlocksCount}</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'tables'}
          className={`tab-btn ${activeTab === 'tables' ? 'active' : ''}`}
          onClick={() => onTabChange('tables')}
        >
          <span className="tab-svg-icon" aria-hidden="true">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <line x1="3" y1="9" x2="21" y2="9" />
              <line x1="3" y1="15" x2="21" y2="15" />
              <line x1="12" y1="3" x2="12" y2="21" />
            </svg>
          </span>
          <span>Tables &amp; Matrices</span>
          <span className="tab-count-pill">{tablesCount}</span>
        </button>
      </div>
    </header>
  );
}
