import React, { useState, useMemo, useRef, useEffect } from 'react';
import { consoleLogger } from '@workspace/logger';
import { DOCUMENTATION_GUIDES_REGISTRY, GuideMeta } from '../docsConstants';
import CopyButton from 'src/components/CopyButton';

export interface DocsDashboardProps {
  onSelectGuide: (guideId: string) => void;
  onBackToOverview?: () => void;
}

export type DocsHubViewProps = DocsDashboardProps;

export default function DocsDashboard({ onSelectGuide, onBackToOverview }: DocsDashboardProps) {
  const [query, setQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'rules' | 'design' | 'ports' | 'techstack' | 'cheatsheet'>('all');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Shortcut key listener: '/' focuses search input, 'Escape' clears
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === '/' &&
        document.activeElement !== searchInputRef.current &&
        !['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName || '')
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === 'Escape' && document.activeElement === searchInputRef.current) {
        if (query) {
          setQuery('');
        } else {
          searchInputRef.current?.blur();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [query]);

  const filteredGuides = useMemo(() => {
    return DOCUMENTATION_GUIDES_REGISTRY.filter((guide) => {
      const matchesCategory = selectedCategory === 'all' || guide.category === selectedCategory;
      if (!matchesCategory) return false;

      if (!query.trim()) return true;

      const searchableText = [
        guide.title,
        guide.description,
        guide.filename,
        guide.badge,
        guide.targetAudience,
        ...guide.topics,
        ...guide.keyHighlights,
      ]
        .join(' ')
        .toLowerCase();

      return searchableText.includes(query.trim().toLowerCase());
    });
  }, [query, selectedCategory]);

  return (
    <article className="docs-hub-view" aria-label="Documentation Hub & Architecture Specifications">
      {/* Hero Header with Merged Toolbar */}
      <header className="detail-header pillar-hero-header docs-dashboard-header">
        <div className="breadcrumb-nav-row">
          <div className="breadcrumb">
            {onBackToOverview ? (
              <button
                type="button"
                className="project-back-pill-btn"
                onClick={onBackToOverview}
                title="Return to Soul Workspace"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
                <span>Back</span>
              </button>
            ) : (
              <a href="#overview" className="project-back-pill-btn" title="Return to Soul Workspace">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
                <span>Back</span>
              </a>
            )}
            <span className="crumb-workspace">Soul Workspace</span>
            <span className="crumb-sep" aria-hidden="true">›</span>
            <strong className="crumb-active">Pillar 3: Docs Dashboard</strong>
          </div>

          <div className="header-status-pill">
            <span className="status-live-dot" aria-hidden="true" />
            <span>{DOCUMENTATION_GUIDES_REGISTRY.length} Architecture Guides Live</span>
          </div>
        </div>

        <div className="docs-hero-title-row">
          <div className="docs-hero-icon" aria-hidden="true">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
          </div>
          <div className="project-hero-copy">
            <div className="title-with-badge">
              <h1 className="project-dashboard-h1">Docs Dashboard &amp; Specifications</h1>
              <span className="monorepo-tag-pill">Pillar 3: Architecture Specs</span>
            </div>
            <p className="detail-description">
              Authoritative architectural guidelines, monorepo specifications, strict port allocations, and library blueprints governing all 8 workspace applications and 3 shared packages.
            </p>
          </div>
        </div>

        {/* 5-Metric Quick Stats Strip */}
        <div className="project-metrics-strip docs-metrics-strip" role="region" aria-label="Documentation metrics">
          <div className="project-metric-card metric-total">
            <div className="metric-card-header">
              <span className="metric-icon">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                </svg>
              </span>
              <span className="metric-label">Official Guides</span>
            </div>
            <strong className="metric-val">5 Guides</strong>
          </div>

          <div className="project-metric-card metric-fullstack">
            <div className="metric-card-header">
              <span className="metric-icon">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </span>
              <span className="metric-label">Coverage</span>
            </div>
            <strong className="metric-val">100% Monorepo</strong>
          </div>

          <div className="project-metric-card metric-standalone">
            <div className="metric-card-header">
              <span className="metric-icon">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                  <line x1="8" y1="21" x2="16" y2="21" />
                  <line x1="12" y1="17" x2="12" y2="21" />
                </svg>
              </span>
              <span className="metric-label">Applications</span>
            </div>
            <strong className="metric-val">8 Integrated</strong>
          </div>

          <div className="project-metric-card metric-collisions">
            <div className="metric-card-header">
              <span className="metric-icon">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                </svg>
              </span>
              <span className="metric-label">Shared Packages</span>
            </div>
            <strong className="metric-val">3 Core</strong>
          </div>

          <div className="project-metric-card metric-isolation">
            <div className="metric-card-header">
              <span className="metric-icon">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
              </span>
              <span className="metric-label">Port Collisions</span>
            </div>
            <strong className="metric-val">0 Collisions</strong>
          </div>
        </div>

        {/* Merged Search & Category Filter Toolbar */}
        <div className="docs-hub-toolbar">
          <div className="projects-search-input-wrap docs-hub-search-wrap">
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              ref={searchInputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search guides, rules, port assignments, and topics... (Press '/' to focus)"
              aria-label="Filter documentation guides"
            />
            {query ? (
              <button
                type="button"
                className="search-clear-inline"
                onClick={() => {
                  setQuery('');
                  searchInputRef.current?.focus();
                }}
                aria-label="Clear search query"
                title="Clear search"
              >
                ✕
              </button>
            ) : (
              <kbd className="search-kbd-hint">/</kbd>
            )}
          </div>

          <div className="framework-filter-pills filter-pills" role="tablist" aria-label="Filter documentation guides by category">
            <button
              type="button"
              className={`framework-pill ${selectedCategory === 'all' ? 'active' : ''}`}
              onClick={() => setSelectedCategory('all')}
            >
              <span className="pill-text">All Guides</span>
              <span className="pill-count">{DOCUMENTATION_GUIDES_REGISTRY.length}</span>
            </button>
            <button
              type="button"
              className={`framework-pill ${selectedCategory === 'rules' ? 'active' : ''}`}
              onClick={() => setSelectedCategory('rules')}
            >
              <span className="pill-text">📜 Projects Rules</span>
            </button>
            <button
              type="button"
              className={`framework-pill ${selectedCategory === 'design' ? 'active' : ''}`}
              onClick={() => setSelectedCategory('design')}
            >
              <span className="pill-text">📘 Packages Design</span>
            </button>
            <button
              type="button"
              className={`framework-pill ${selectedCategory === 'ports' ? 'active' : ''}`}
              onClick={() => setSelectedCategory('ports')}
            >
              <span className="pill-text">🌐 Port Topology</span>
            </button>
            <button
              type="button"
              className={`framework-pill ${selectedCategory === 'techstack' ? 'active' : ''}`}
              onClick={() => setSelectedCategory('techstack')}
            >
              <span className="pill-text">⚙️ Tech Stack</span>
            </button>
            <button
              type="button"
              className={`framework-pill ${selectedCategory === 'cheatsheet' ? 'active' : ''}`}
              onClick={() => setSelectedCategory('cheatsheet')}
            >
              <span className="pill-text">📋 Cheatsheet</span>
            </button>
          </div>
        </div>
      </header>

          {/* Guides Grid */}
          <section className="docs-hub-grid-section" aria-label="Available Architecture Guides">
            <div className="section-header-row">
              <div>
                <span className="section-kicker">MONOREPO SPECIFICATIONS</span>
                <h2>Architectural Standards &amp; Guides</h2>
                <p className="section-subtext">
                  Showing {filteredGuides.length} of {DOCUMENTATION_GUIDES_REGISTRY.length} official documents
                </p>
              </div>
            </div>

        {filteredGuides.length === 0 ? (
          <div className="docs-hub-empty-state">
            <span className="empty-icon">🔍</span>
            <h3>No documentation guides matched &ldquo;{query}&rdquo;</h3>
            <p>Try searching for topics like &ldquo;ports&rdquo;, &ldquo;rules&rdquo;, &ldquo;sqlite&rdquo;, &ldquo;logger&rdquo;, or &ldquo;react 19&rdquo;.</p>
            <button
              type="button"
              className="reset-filters-btn"
              onClick={() => {
                setQuery('');
                setSelectedCategory('all');
                searchInputRef.current?.focus();
              }}
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="docs-hub-cards-grid">
            {filteredGuides.map((guide) => (
              <article key={guide.id} className="doc-hub-card">
                <div className="doc-hub-card-header">
                  <div className="doc-hub-icon-row">
                    <span className="doc-card-icon" aria-hidden="true">{guide.icon}</span>
                    <span className={`doc-category-badge ${guide.category}`}>{guide.badge}</span>
                  </div>
                  <span className="doc-read-time">{guide.readTime}</span>
                </div>

                <div className="doc-hub-card-body">
                  <h3 className="doc-card-title">{guide.title}</h3>
                  <code className="doc-card-filename">{guide.filename}</code>
                  <p className="doc-card-description">{guide.description}</p>

                  <div className="doc-card-highlights">
                    <strong>KEY STANDARDS:</strong>
                    <ul>
                      {guide.keyHighlights.map((hl, i) => (
                        <li key={i}>{hl}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="doc-card-tags">
                    {guide.topics.map((topic) => (
                      <span key={topic} className="doc-topic-pill">
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="doc-hub-card-footer">
                  <div className="doc-footer-meta">
                    <span className="meta-item">📑 {guide.sectionsCount} Sections</span>
                    <span className="meta-item-sep">·</span>
                    <span className="meta-item status-text">{guide.complianceStatus}</span>
                  </div>
                  <button
                    type="button"
                    className="doc-open-btn"
                    onClick={() => {
                      consoleLogger.action('DOCS', `Selected guide: ${guide.title}`, { guideId: guide.id, slug: guide.slug });
                      onSelectGuide(guide.id);
                    }}
                  >
                    Read Guide <span>→</span>
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </article>
  );
}
