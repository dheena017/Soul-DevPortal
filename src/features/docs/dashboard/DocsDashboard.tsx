import React, { useState, useMemo, useRef, useEffect } from 'react';
import { consoleLogger } from '@workspace/logger';
import { DOCUMENTATION_GUIDES_REGISTRY, GuideMeta } from '../docsConstants';
import CopyButton from '../../../components/CopyButton';

export interface DocsDashboardProps {
  onSelectGuide: (guideId: string) => void;
  onBackToOverview?: () => void;
}

export type DocsHubViewProps = DocsDashboardProps;

export default function DocsDashboard({ onSelectGuide, onBackToOverview }: DocsDashboardProps) {
  const [activeSection, setActiveSection] = useState<'guides' | 'rules' | 'matrix'>('guides');
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
      {/* Hero Header */}
      <header className="detail-header pillar-hero-header">
        <div className="breadcrumb-nav-row">
          <div className="breadcrumb">
            {onBackToOverview && (
              <button
                type="button"
                className="back-link-btn"
                onClick={onBackToOverview}
                title="Return to Overview Dashboard"
              >
                ← Back to Overview
              </button>
            )}
            <span className="crumb-sep">/</span>
            <span>Soul Workspace</span>
            <span className="crumb-sep">/</span>
            <strong className="crumb-active">Pillar 3: Docs Dashboard</strong>
          </div>
        </div>

        <div className="detail-title-row">
          <div className="package-title-copy">
            <div className="docs-hub-title-line">
              <span className="docs-hub-pillar-badge">Pillar 3</span>
              <h1>Docs Dashboard &amp; Specifications</h1>
            </div>
            <p className="detail-description">
              Authoritative architectural guidelines, monorepo specifications, strict port allocations, and library blueprints governing all 8 workspace applications and 3 shared packages.
            </p>
          </div>
        </div>

        {/* Pillar 3 Key Metrics Banner */}
        <div className="docs-hub-metrics-banner">
          <div className="docs-metric-pill">
            <span className="docs-metric-val">5</span>
            <span className="docs-metric-label">Official Guides</span>
          </div>
          <div className="docs-metric-pill">
            <span className="docs-metric-val">100%</span>
            <span className="docs-metric-label">Monorepo Coverage</span>
          </div>
          <div className="docs-metric-pill">
            <span className="docs-metric-val">8</span>
            <span className="docs-metric-label">Integrated Apps</span>
          </div>
          <div className="docs-metric-pill">
            <span className="docs-metric-val">3</span>
            <span className="docs-metric-label">Shared Packages</span>
          </div>
          <div className="docs-metric-pill">
            <span className="docs-metric-val">0</span>
            <span className="docs-metric-label">Port Collisions</span>
          </div>
        </div>
      </header>

      {/* Navigation Tabs Bar */}
      <div className="package-detail-tabs doc-tabs-bar" role="tablist" aria-label="Documentation sections">
        <button
          type="button"
          role="tab"
          aria-selected={activeSection === 'guides'}
          className={`tab-btn ${activeSection === 'guides' ? 'active' : ''}`}
          onClick={() => setActiveSection('guides')}
        >
          <span className="tab-icon">📖</span>
          <span>Complete Guide</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeSection === 'rules'}
          className={`tab-btn ${activeSection === 'rules' ? 'active' : ''}`}
          onClick={() => setActiveSection('rules')}
        >
          <span className="tab-icon">⚖️</span>
          <span>Key Rules &amp; Standards</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeSection === 'matrix'}
          className={`tab-btn ${activeSection === 'matrix' ? 'active' : ''}`}
          onClick={() => setActiveSection('matrix')}
        >
          <span className="tab-icon">🎯</span>
          <span>Implementations Matrix</span>
        </button>
      </div>

      {/* Section 1: Complete Guide & Architecture Specifications */}
      {activeSection === 'guides' && (
        <>
          {/* Search & Category Filter Toolbar */}
          <div className="docs-hub-toolbar">
            <div className="search-wrap docs-hub-search-wrap">
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
                  className="search-clear-btn"
                  onClick={() => {
                    setQuery('');
                    searchInputRef.current?.focus();
                  }}
                  aria-label="Clear search query"
                >
                  ✕
                </button>
              ) : (
                <kbd>/</kbd>
              )}
            </div>

            <div className="filter-pills" role="tablist" aria-label="Filter documentation guides by category">
              <button
                type="button"
                className={`filter-pill ${selectedCategory === 'all' ? 'active' : ''}`}
                onClick={() => setSelectedCategory('all')}
              >
                All Guides ({DOCUMENTATION_GUIDES_REGISTRY.length})
              </button>
              <button
                type="button"
                className={`filter-pill ${selectedCategory === 'rules' ? 'active' : ''}`}
                onClick={() => setSelectedCategory('rules')}
              >
                📜 Projects Rules
              </button>
              <button
                type="button"
                className={`filter-pill ${selectedCategory === 'design' ? 'active' : ''}`}
                onClick={() => setSelectedCategory('design')}
              >
                📘 Packages Design
              </button>
              <button
                type="button"
                className={`filter-pill ${selectedCategory === 'ports' ? 'active' : ''}`}
                onClick={() => setSelectedCategory('ports')}
              >
                🌐 Port Topology
              </button>
              <button
                type="button"
                className={`filter-pill ${selectedCategory === 'techstack' ? 'active' : ''}`}
                onClick={() => setSelectedCategory('techstack')}
              >
                ⚙️ Tech Stack
              </button>
              <button
                type="button"
                className={`filter-pill ${selectedCategory === 'cheatsheet' ? 'active' : ''}`}
                onClick={() => setSelectedCategory('cheatsheet')}
              >
                📋 Cheatsheet
              </button>
            </div>
          </div>

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
      </>
      )}

      {/* Section 2: Key Rules & Standards */}
      {activeSection === 'rules' && (
      <section className="docs-hub-standards-section" aria-label="Key Rules & Standards">
        <div className="section-header-row">
          <div>
            <span className="section-kicker">COMPLIANCE RULES</span>
            <h2>Key Rules &amp; Standards Cheatsheet</h2>
            <p className="section-subtext">
              Canonical monorepo laws: package scoping, dual manifests, static ports, data masking, and persistence standards.
            </p>
          </div>
        </div>

        <div className="standards-cards-grid">
          <div className="standard-rule-card">
            <div className="rule-card-top">
              <div className="rule-card-meta">
                <span className="rule-index-tag">01</span>
                <span className="rule-badge rule-critical">MANDATORY</span>
              </div>
              <span className="rule-icon-box" title="Package Scoping">📦</span>
            </div>
            <h3>Package Naming &amp; Scoping</h3>
            <p>
              Every shared package must be strictly scoped under the <code>@workspace/</code> organization for TypeScript/npm, and prefixed with <code>workspace_</code> for Python modules.
            </p>
            <div className="rule-snippet-window">
              <div className="snippet-window-header">
                <div className="window-dots"><span /><span /><span /></div>
                <span className="snippet-lang-tag">CONFIG</span>
                <CopyButton text={`npm:  @workspace/<package-name>\npip:  workspace_<package_name>`} variant="compact" />
              </div>
              <pre className="snippet-code-area">
                <code><span className="token-key">npm:</span>  @workspace/&lt;package-name&gt;{'\n'}<span className="token-key">pip:</span>  workspace_&lt;package_name&gt;</code>
              </pre>
            </div>
          </div>

          <div className="standard-rule-card">
            <div className="rule-card-top">
              <div className="rule-card-meta">
                <span className="rule-index-tag">02</span>
                <span className="rule-badge rule-critical">MANDATORY</span>
              </div>
              <span className="rule-icon-box" title="Dual-Manifest">📄</span>
            </div>
            <h3>Dual-Manifest Co-existence</h3>
            <p>
              Shared libraries must contain both <code>package.json</code> and <code>pyproject.toml</code> with mirrored versioning and exports, ensuring cross-runtime interoperability between Vite and FastAPI.
            </p>
            <div className="rule-snippet-window">
              <div className="snippet-window-header">
                <div className="window-dots"><span /><span /><span /></div>
                <span className="snippet-lang-tag">MANIFEST</span>
                <CopyButton text={`package.json  -> "version": "1.0.0"\npyproject.toml -> version = "1.0.0"`} variant="compact" />
              </div>
              <pre className="snippet-code-area">
                <code>package.json  -&gt; <span className="token-val">"version": "1.0.0"</span>{'\n'}pyproject.toml -&gt; <span className="token-val">version = "1.0.0"</span></code>
              </pre>
            </div>
          </div>

          <div className="standard-rule-card">
            <div className="rule-card-top">
              <div className="rule-card-meta">
                <span className="rule-index-tag">03</span>
                <span className="rule-badge rule-info">ALLOCATION</span>
              </div>
              <span className="rule-icon-box" title="Port Matrix">🌐</span>
            </div>
            <h3>Port Reservation Matrix</h3>
            <p>
              Monorepo ports are statically assigned to prevent conflicts across the 8 applications:
            </p>
            <div className="rule-snippet-window">
              <div className="snippet-window-header">
                <div className="window-dots"><span /><span /><span /></div>
                <span className="snippet-lang-tag">PORTS</span>
                <CopyButton text={`Client Dev Servers:  Ports 5173 - 5181\nServer APIs:         Ports 8000 - 8008`} variant="compact" />
              </div>
              <pre className="snippet-code-area">
                <code><span className="token-key">Client Dev Servers:</span>  <span className="token-val">Ports 5173 - 5181</span>{'\n'}<span className="token-key">Server APIs:</span>         <span className="token-val">Ports 8000 - 8008</span></code>
              </pre>
            </div>
          </div>

          <div className="standard-rule-card">
            <div className="rule-card-top">
              <div className="rule-card-meta">
                <span className="rule-index-tag">04</span>
                <span className="rule-badge rule-security">SECURITY</span>
              </div>
              <span className="rule-icon-box" title="Data Masking">🔒</span>
            </div>
            <h3>Sensitive Data Masking</h3>
            <p>
              All logging via <code>@workspace/logger</code> must sanitize API keys (Gemini, Supabase), Authorization bearer tokens, and passwords before printing to console or stdout.
            </p>
            <div className="rule-snippet-window">
              <div className="snippet-window-header">
                <div className="window-dots"><span /><span /><span /></div>
                <span className="snippet-lang-tag">LOGGER</span>
                <CopyButton text={`import { consoleLogger } from '@workspace/logger';\nconsoleLogger.info('AUTH', 'Logged in', { token: 'sk_***' });`} variant="compact" />
              </div>
              <pre className="snippet-code-area">
                <code><span className="token-key">import</span> &#123; consoleLogger &#125; <span className="token-key">from</span> <span className="token-val">'@workspace/logger'</span>;{'\n'}consoleLogger.info(<span className="token-val">'AUTH'</span>, <span className="token-val">'Logged in'</span>, &#123; token: <span className="token-val">'sk_***'</span> &#125;);</code>
              </pre>
            </div>
          </div>

          <div className="standard-rule-card">
            <div className="rule-card-top">
              <div className="rule-card-meta">
                <span className="rule-index-tag">05</span>
                <span className="rule-badge rule-critical">MANDATORY</span>
              </div>
              <span className="rule-icon-box" title="Directory Layout">📁</span>
            </div>
            <h3>Standardized Directory Layout</h3>
            <p>
              Every project in <code>Soul-DevPortal-Projects/</code> must strictly structure into <code>client/</code> and <code>server/</code>. Legacy <code>frontend/</code> or <code>backend/</code> folder naming is completely prohibited.
            </p>
            <div className="rule-snippet-window">
              <div className="snippet-window-header">
                <div className="window-dots"><span /><span /><span /></div>
                <span className="snippet-lang-tag">LAYOUT</span>
                <CopyButton text={`client/ -> src/features, src/shared, src/app, public/\nserver/ -> app/, features/, shared/, database/, data/`} variant="compact" />
              </div>
              <pre className="snippet-code-area">
                <code><span className="token-key">client/</span> -&gt; src/features, src/shared, src/app, public/{'\n'}<span className="token-key">server/</span> -&gt; app/, features/, shared/, database/, data/</code>
              </pre>
            </div>
          </div>

          <div className="standard-rule-card">
            <div className="rule-card-top">
              <div className="rule-card-meta">
                <span className="rule-index-tag">06</span>
                <span className="rule-badge rule-architecture">ARCHITECTURE</span>
              </div>
              <span className="rule-icon-box" title="Feature Slices">🧩</span>
            </div>
            <h3>Domain-Driven Feature Slices</h3>
            <p>
              Domain logic and UI are co-located within dedicated slices. Client slices contain <code>api/</code>, <code>components/</code>, <code>hooks/</code>, <code>context/</code>, <code>types.ts</code>. Server slices contain <code>router.py</code>, <code>service.py</code>, <code>schemas.py</code>, <code>repository.py</code>.
            </p>
            <div className="rule-snippet-window">
              <div className="snippet-window-header">
                <div className="window-dots"><span /><span /><span /></div>
                <span className="snippet-lang-tag">SLICES</span>
                <CopyButton text={`client/src/features/<feature>/   # Client UI & API slice\nserver/features/<feature>/       # Server route & service slice`} variant="compact" />
              </div>
              <pre className="snippet-code-area">
                <code>client/src/features/&lt;feature&gt;/   <span className="token-comment"># Client UI &amp; API slice</span>{'\n'}server/features/&lt;feature&gt;/       <span className="token-comment"># Server route &amp; service slice</span></code>
              </pre>
            </div>
          </div>

          <div className="standard-rule-card">
            <div className="rule-card-top">
              <div className="rule-card-meta">
                <span className="rule-index-tag">07</span>
                <span className="rule-badge rule-storage">PERSISTENCE</span>
              </div>
              <span className="rule-icon-box" title="SQLite Database">🗄️</span>
            </div>
            <h3>Database Persistence &amp; Pragmas</h3>
            <p>
              SQLite engines must enable Write-Ahead Logging (<code>PRAGMA journal_mode = WAL;</code>), enforce foreign keys, declare canonical DDL in <code>schema.sql</code>, and execute queries via typed repositories.
            </p>
            <div className="rule-snippet-window">
              <div className="snippet-window-header">
                <div className="window-dots"><span /><span /><span /></div>
                <span className="snippet-lang-tag">SQLITE</span>
                <CopyButton text={`sqlite3 server/data/<project>.db ".tables"\nsqlite3 server/data/<project>.db ".backup server/data/backup.db"`} variant="compact" />
              </div>
              <pre className="snippet-code-area">
                <code><span className="token-cmd">sqlite3</span> server/data/&lt;project&gt;.db <span className="token-val">".tables"</span>{'\n'}<span className="token-cmd">sqlite3</span> server/data/&lt;project&gt;.db <span className="token-val">".backup server/data/backup.db"</span></code>
              </pre>
            </div>
          </div>

          <div className="standard-rule-card">
            <div className="rule-card-top">
              <div className="rule-card-meta">
                <span className="rule-index-tag">08</span>
                <span className="rule-badge rule-info">ASSETS</span>
              </div>
              <span className="rule-icon-box" title="Public Assets">🖼️</span>
            </div>
            <h3>Static Web Assets Directory</h3>
            <p>
              Direct web assets (logos, icons, favicons, robots.txt) belong in <code>client/public/</code>. Always reference assets via absolute root paths (e.g. <code>/logos/logo.svg</code>), never via JavaScript bundler imports.
            </p>
            <div className="rule-snippet-window">
              <div className="snippet-window-header">
                <div className="window-dots"><span /><span /><span /></div>
                <span className="snippet-lang-tag">PUBLIC</span>
                <CopyButton text={`client/public/logos/logo.svg  -> <img src="/logos/logo.svg" />\nclient/public/favicon.svg     -> <link rel="icon" href="/favicon.svg" />`} variant="compact" />
              </div>
              <pre className="snippet-code-area">
                <code>client/public/logos/logo.svg  -&gt; <span className="token-val">&lt;img src="/logos/logo.svg" /&gt;</span>{'\n'}client/public/favicon.svg     -&gt; <span className="token-val">&lt;link rel="icon" href="/favicon.svg" /&gt;</span></code>
              </pre>
            </div>
          </div>

          <div className="standard-rule-card">
            <div className="rule-card-top">
              <div className="rule-card-meta">
                <span className="rule-index-tag">09</span>
                <span className="rule-badge rule-security">RELIABILITY</span>
              </div>
              <span className="rule-icon-box" title="Dynamic Paths">⚡</span>
            </div>
            <h3>Dynamic Path Resolution &amp; Security</h3>
            <p>
              Never hardcode relative paths like <code>"data/db.sqlite"</code>. Resolve all filesystem paths dynamically relative to module files. Ensure no secrets or binary assets are committed to Git.
            </p>
            <div className="rule-snippet-window">
              <div className="snippet-window-header">
                <div className="window-dots"><span /><span /><span /></div>
                <span className="snippet-lang-tag">PATHS</span>
                <CopyButton text={`DATA_DIR = Path(__file__).resolve().parent.parent / "data"\nDB_PATH  = DATA_DIR / "<project-name>.db"`} variant="compact" />
              </div>
              <pre className="snippet-code-area">
                <code><span className="token-key">DATA_DIR</span> = Path(__file__).resolve().parent.parent / <span className="token-val">"data"</span>{'\n'}<span className="token-key">DB_PATH</span>  = DATA_DIR / <span className="token-val">"&lt;project-name&gt;.db"</span></code>
              </pre>
            </div>
          </div>

          <div className="standard-rule-card">
            <div className="rule-card-top">
              <div className="rule-card-meta">
                <span className="rule-index-tag">10</span>
                <span className="rule-badge rule-info">AUTOMATION</span>
              </div>
              <span className="rule-icon-box" title="CLI Commands">🚀</span>
            </div>
            <h3>Unified Workspace CLI Automation</h3>
            <p>
              Launch and orchestrate development processes using root workspace runner scripts. Ports are automatically scanned and zombie processes terminated before spawning.
            </p>
            <div className="rule-snippet-window">
              <div className="snippet-window-header">
                <div className="window-dots"><span /><span /><span /></div>
                <span className="snippet-lang-tag">SCRIPTS</span>
                <CopyButton text={`npm run dev:all\nnpm run dev:client\nnpm run dev:server\nnpm run dev:project -- --project=apexmind-ai`} variant="compact" />
              </div>
              <pre className="snippet-code-area">
                <code><span className="token-cmd">npm run dev:all</span>         <span className="token-comment"># Start all micro-apps concurrently</span>{'\n'}<span className="token-cmd">npm run dev:client</span>      <span className="token-comment"># Start client services only</span>{'\n'}<span className="token-cmd">npm run dev:server</span>      <span className="token-comment"># Start server APIs only</span>{'\n'}<span className="token-cmd">npm run dev:project</span> -- --project=apexmind-ai</code>
              </pre>
            </div>
          </div>
        </div>
      </section>
      )}

      {/* Section 3: Implementations & Adoption Matrix */}
      {activeSection === 'matrix' && (
      <>
      <section className="docs-hub-implementations-section" aria-label="Ecosystem Adoption Matrix">
        <div className="section-header-row">
          <div>
            <span className="section-kicker">ECOSYSTEM ADOPTION</span>
            <h2>Adoption Matrix Across Packages &amp; Applications</h2>
            <p className="section-subtext">
              Active ecosystem integration across all 3 shared packages and 8 workspace applications.
            </p>
          </div>
        </div>

        <div className="implementations-grid">
          <div className="impl-col">
            <h3>Shared Packages (3)</h3>
            <div className="impl-list">
              <div className="impl-item">
                <strong>@workspace/config</strong>
                <span>Tokens, Tailwind CSS v4, Vite configuration presets</span>
                <a href="#packages/config" className="impl-link">View Package →</a>
              </div>
              <div className="impl-item">
                <strong>@workspace/logger</strong>
                <span>5-column python logger, browser formatter, masking engine</span>
                <a href="#packages/logger" className="impl-link">View Package →</a>
              </div>
              <div className="impl-item">
                <strong>@workspace/runner</strong>
                <span>Process lifecycle orchestrator, socket port kill &amp; spawn</span>
                <a href="#packages/runner" className="impl-link">View Package →</a>
              </div>
            </div>
          </div>

          <div className="impl-col">
            <h3>Workspace Applications (8)</h3>
            <div className="impl-list">
              <div className="impl-item">
                <strong>APEXMIND STUDIO AI</strong>
                <span>React 19 · Vite 8 · Ports FE:5173 / BE:8000</span>
                <a href="#projects/apexmind-ai" className="impl-link">View Project →</a>
              </div>
              <div className="impl-item">
                <strong>SONIKOMA AI STUDIO</strong>
                <span>React 19 · Vite 8 · Ports FE:5176 / BE:8006</span>
                <a href="#projects/sonikoma" className="impl-link">View Project →</a>
              </div>
              <div className="impl-item">
                <strong>OUTPASS MANAGEMENT SYSTEM</strong>
                <span>React 18 · Vite · Ports FE:5174 / BE:8001</span>
                <a href="#projects/outpass-system" className="impl-link">View Project →</a>
              </div>
              <div className="impl-item">
                <strong>FREE API HUB</strong>
                <span>React 18 · Vite · Ports FE:5175 / BE:8002</span>
                <a href="#projects/free-api-hub" className="impl-link">View Project →</a>
              </div>
              <div className="impl-item">
                <strong>SPATIAL DIMENSIONS</strong>
                <span>React 19 · Vite 6 · Ports FE:5177 / BE:8007</span>
                <a href="#projects/spatial-dimensions" className="impl-link">View Project →</a>
              </div>
              <div className="impl-item">
                <strong>COLLEGE MANAGEMENT SYSTEM</strong>
                <span>React 19 · Vite 8 · Ports FE:5178 / BE:8005</span>
                <a href="#projects/college-management-system" className="impl-link">View Project →</a>
              </div>
              <div className="impl-item">
                <strong>GLOBALPULSE AI</strong>
                <span>React 19 · Vite 8 · Ports FE:5179 / BE:8003</span>
                <a href="#projects/globalpulse-ai" className="impl-link">View Project →</a>
              </div>
              <div className="impl-item">
                <strong>POSTCRAFT AI</strong>
                <span>React 19 · Vite 8 · Ports FE:5180 / BE:8004</span>
                <a href="#projects/postcraft-ai" className="impl-link">View Project →</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Standards & Compliance Matrix */}
      <section className="docs-hub-matrix-section" aria-label="Standards Compliance Matrix">
        <div className="section-header-row">
          <div>
            <span className="section-kicker">CROSS-CUTTING ALIGNMENT</span>
            <h2>Monorepo Standards &amp; Enforcement Matrix</h2>
            <p className="section-subtext">
              Unified summary of architectural domains, runtime boundaries, and enforcement rules across the repository.
            </p>
          </div>
        </div>

        <div className="docs-matrix-table-wrap">
          <table className="docs-matrix-table">
            <thead>
              <tr>
                <th>Document / Spec</th>
                <th>Target Runtime</th>
                <th>Audience</th>
                <th>Key Enforcement Rule</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {DOCUMENTATION_GUIDES_REGISTRY.map((g) => (
                <tr key={g.id}>
                  <td>
                    <div className="matrix-doc-cell">
                      <span className="matrix-icon">{g.icon}</span>
                      <div>
                        <strong>{g.title}</strong>
                        <code>{g.filename}</code>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="matrix-runtime-pill">
                      {g.id === 'rules' && 'All 8 Apps + Vite + FastAPI'}
                      {g.id === 'design' && 'Node.js / ESM + Python 3.11'}
                      {g.id === 'ports' && 'Localhost :5173-:5181 & :8000-:8008'}
                      {g.id === 'techstack' && 'React 19 / 18, Vite 6+, SQLite'}
                    </span>
                  </td>
                  <td>
                    <span className="matrix-audience-text">{g.targetAudience}</span>
                  </td>
                  <td>
                    <span className="matrix-rule-text">
                      {g.id === 'rules' && 'Strict port binding, metadata.json, /api/ prefix, hostel.db'}
                      {g.id === 'design' && 'Dual ESM/Python exports, structured banners, zero config'}
                      {g.id === 'ports' && 'Zero-collision multi-process local dev execution'}
                      {g.id === 'techstack' && 'Unified dependencies, SQLite storage, Tailwind tokens'}
                    </span>
                  </td>
                  <td>
                    <span className="matrix-status-badge">
                      <span className="matrix-status-dot" />
                      Active
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="matrix-open-link"
                      onClick={() => onSelectGuide(g.id)}
                    >
                      Open Spec →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      </>
      )}
    </article>
  );
}
