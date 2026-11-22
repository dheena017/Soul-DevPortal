import React from 'react';
import Markdown from '../../../components/Markdown';
import TableOfContents from '../../../components/TableOfContents';
import { MarkdownBlock } from '../../../types';
import { DOCUMENTATION_GUIDES_REGISTRY, GuideMeta } from '../docsConstants';

export interface DocDetailViewProps {
  guideId: string;
  blocks?: MarkdownBlock[];
  portGuideBlocks?: MarkdownBlock[];
  techStackBlocks?: MarkdownBlock[];
  projectRulesBlocks?: MarkdownBlock[];
  cheatsheetBlocks?: MarkdownBlock[];
  onSelectGuide?: (id: string) => void;
  onBack?: () => void;
}

export default function DocDetailView({
  guideId = 'rules',
  blocks = [],
  portGuideBlocks = [],
  techStackBlocks = [],
  projectRulesBlocks = [],
  cheatsheetBlocks = [],
  onSelectGuide,
  onBack,
}: DocDetailViewProps) {
  // Robust resolution matching ID, slug, or category
  const guideMeta: GuideMeta =
    DOCUMENTATION_GUIDES_REGISTRY.find(
      (g) => g.id === guideId || g.slug === guideId || g.category === guideId
    ) || DOCUMENTATION_GUIDES_REGISTRY[0];

  const resolvedId = guideMeta.id;

  // Accurately map markdown content per canonical guide ID
  let activeBlocks: MarkdownBlock[] = [];
  if (resolvedId === 'rules') {
    activeBlocks = projectRulesBlocks && projectRulesBlocks.length > 0 ? projectRulesBlocks : [];
  } else if (resolvedId === 'cheatsheet') {
    activeBlocks = cheatsheetBlocks && cheatsheetBlocks.length > 0 ? cheatsheetBlocks : [];
  } else if (resolvedId === 'design') {
    activeBlocks = blocks && blocks.length > 0 ? blocks : [];
  } else if (resolvedId === 'ports') {
    activeBlocks = portGuideBlocks && portGuideBlocks.length > 0 ? portGuideBlocks : [];
  } else if (resolvedId === 'techstack') {
    activeBlocks = techStackBlocks && techStackBlocks.length > 0 ? techStackBlocks : [];
  }

  // Safe fallback if blocks are still loading
  if (!activeBlocks.length) {
    if (resolvedId === 'rules') activeBlocks = projectRulesBlocks || [];
    else if (resolvedId === 'cheatsheet') activeBlocks = cheatsheetBlocks || [];
    else if (resolvedId === 'ports') activeBlocks = portGuideBlocks || [];
    else if (resolvedId === 'techstack') activeBlocks = techStackBlocks || [];
    else activeBlocks = blocks || [];
  }

  const headings = (activeBlocks || []).filter((b) => b.type === 'h2' || b.type === 'h3');
  const codeBlocks = (activeBlocks || []).filter((b) => b.type === 'code');
  const tables = (activeBlocks || []).filter((b) => b.type === 'table');

  return (
    <article className="guide-detail-view doc-detail-view">
      <header className="detail-header pillar-hero-header doc-hero-header">
        <div className="breadcrumb-nav-row">
          <div className="breadcrumb">
            {onBack ? (
              <button type="button" className="project-back-pill-btn" onClick={onBack} title="Return to docs dashboard">
                <span className="back-arrow">←</span>
                <span>Back</span>
              </button>
            ) : (
              <a href="#docs" className="project-back-pill-btn">
                <span className="back-arrow">←</span>
                <span>Back</span>
              </a>
            )}
            <span>Soul Workspace</span>
            <span className="crumb-sep">/</span>
            <a href="#docs" className="crumb-link" onClick={(e) => { e.preventDefault(); onBack?.(); }}>
              Pillar 3: Docs Dashboard
            </a>
            <span className="crumb-sep">/</span>
            <strong className="crumb-active">{guideMeta.title}</strong>
          </div>

          <div className="detail-top-actions">
            <div className="header-status-pill">
              <span className="status-live-dot" aria-hidden="true" />
              <span>{guideMeta.complianceStatus}</span>
            </div>
          </div>
        </div>

        <div className="detail-title-row">
          <div className="package-title-copy">
            <div className="guide-title-line">
              <span className="guide-icon-badge" aria-hidden="true">{guideMeta.icon}</span>
              <span className="guide-badge">{guideMeta.badge}</span>
              <span className="guide-version-tag">v{guideMeta.version}</span>
            </div>
            <h1>{guideMeta.title}</h1>
            <p className="detail-description">{guideMeta.description}</p>
          </div>
        </div>

        {/* Dynamic Metadata Summary Cards */}
        <div className="doc-meta-strip doc-metadata-grid">
          <div className="metadata-card">
            <div className="metadata-card-header">
              <span className="metadata-icon" aria-hidden="true">📑</span>
              <span className="metadata-label">SECTIONS</span>
            </div>
            <div className="metadata-value-group">
              <strong className="metadata-value">{headings.length} headings</strong>
            </div>
          </div>
          <div className="metadata-card">
            <div className="metadata-card-header">
              <span className="metadata-icon" aria-hidden="true">⏱️</span>
              <span className="metadata-label">EST. READ TIME</span>
            </div>
            <div className="metadata-value-group">
              <strong className="metadata-value">{guideMeta.readTime}</strong>
            </div>
          </div>
          <div className="metadata-card">
            <div className="metadata-card-header">
              <span className="metadata-icon" aria-hidden="true">💻</span>
              <span className="metadata-label">CODE EXAMPLES</span>
            </div>
            <div className="metadata-value-group">
              <strong className="metadata-value">{codeBlocks.length} snippets</strong>
            </div>
          </div>
          <div className="metadata-card">
            <div className="metadata-card-header">
              <span className="metadata-icon" aria-hidden="true">📊</span>
              <span className="metadata-label">TABLES &amp; MATRICES</span>
            </div>
            <div className="metadata-value-group">
              <strong className="metadata-value">{tables.length} tables</strong>
            </div>
          </div>
          <div className="metadata-card">
            <div className="metadata-card-header">
              <span className="metadata-icon" aria-hidden="true">🎯</span>
              <span className="metadata-label">SCOPE</span>
            </div>
            <div className="metadata-value-group">
              <strong className="metadata-value">All 3 Pkgs &amp; 8 Apps</strong>
            </div>
          </div>
        </div>
      </header>

      {/* Document Reading View with sticky Table of Contents */}
      <div className="package-document-layout doc-document-layout">
        <TableOfContents headings={headings} title="On this page" />
        <section className="detail-section readme-section">
          <div className="section-heading readme-heading">
            <div>
              <span className="section-kicker">DOCUMENTATION SPECIFICATION</span>
              <h2>{guideMeta.title}</h2>
            </div>
            <span className="readme-source">Soul-DevPortal-Docs/{guideMeta.filename}</span>
          </div>
          <div className="markdown-content">
            <Markdown blocks={activeBlocks || []} skipFirstHeading />
          </div>
        </section>
      </div>
    </article>
  );
}
