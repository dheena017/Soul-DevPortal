import React, { useState, useMemo, useRef, useEffect } from 'react';
import { consoleLogger } from '@workspace/logger';
import { DOCUMENTATION_GUIDES_REGISTRY } from '../docsConstants';

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
    <article className="w-full flex flex-col gap-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-300" aria-label="Documentation Hub & Architecture Specifications">
      {/* Hero Header with Merged Toolbar */}
      <header className="w-full bg-[#111111] border border-[#222222] rounded-2xl p-5 md:p-6 shadow-2xl shadow-black/60 flex flex-col gap-5">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#1a1a1a]">
          <div className="flex items-center gap-2 text-xs">
            {onBackToOverview ? (
              <button
                type="button"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#111111] border border-[#222222] text-neutral-300 hover:text-neutral-200 hover:border-neutral-500 hover:bg-[#111111] transition-all font-semibold shadow-sm"
                onClick={onBackToOverview}
                title="Return to Soul Workspace"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
                <span>Back</span>
              </button>
            ) : (
              <a
                href="#overview"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#111111] border border-[#222222] text-neutral-300 hover:text-neutral-200 hover:border-neutral-500 hover:bg-[#111111] transition-all font-semibold shadow-sm"
                title="Return to Soul Workspace"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
                <span>Back</span>
              </a>
            )}
            <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-[#111111] border border-[#222222] text-neutral-400 font-medium">Soul Workspace</span>
            <span className="text-neutral-600 font-bold px-0.5" aria-hidden="true">›</span>
            <strong className="inline-flex items-center px-2.5 py-1 rounded-full bg-[#111111] border border-[#222222] text-neutral-200 font-semibold shadow-sm">Pillar 3: Docs Dashboard</strong>
          </div>

          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#111111] border border-[#222222] text-xs font-semibold text-neutral-300 select-none shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-400" aria-hidden="true" />
            <span>{DOCUMENTATION_GUIDES_REGISTRY.length} Architecture Guides Live</span>
          </div>
        </div>

        <div className="flex items-start sm:items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#111111] border border-[#222222] flex items-center justify-center text-neutral-400 shrink-0 shadow-lg shadow-sm">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
          </div>
          <div className="flex flex-col gap-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl font-extrabold tracking-tight text-white">Docs Dashboard &amp; Specifications</h1>
              <span className="px-2.5 py-0.5 rounded-md text-[11px] font-mono font-bold tracking-wider uppercase bg-[#111111] border border-[#222222] text-neutral-300">
                Pillar 3: Architecture Specs
              </span>
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed max-w-3xl">
              Authoritative architectural guidelines, monorepo specifications, strict port allocations, and library blueprints governing all 9 workspace applications and 3 shared packages.
            </p>
          </div>
        </div>

        {/* 5-Metric Quick Stats Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3" role="region" aria-label="Documentation metrics">
          <div className="flex flex-col p-3.5 rounded-xl bg-[#111111] border border-[#222222] hover:border-neutral-500 transition-all">
            <span className="text-xs text-neutral-400 flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-neutral-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
              <span>Official Guides</span>
            </span>
            <strong className="text-xl font-extrabold text-neutral-200 font-mono mt-1.5">5 Guides</strong>
          </div>

          <div className="flex flex-col p-3.5 rounded-xl bg-[#111111] border border-[#222222] hover:border-neutral-500 transition-all">
            <span className="text-xs text-neutral-400 flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-neutral-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <span>Coverage</span>
            </span>
            <strong className="text-xl font-extrabold text-neutral-200 font-mono mt-1.5">100% Monorepo</strong>
          </div>

          <div className="flex flex-col p-3.5 rounded-xl bg-[#111111] border border-[#222222] hover:border-neutral-500 transition-all">
            <span className="text-xs text-neutral-400 flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-neutral-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                <line x1="8" y1="21" x2="16" y2="21" />
                <line x1="12" y1="17" x2="12" y2="21" />
              </svg>
              <span>Applications</span>
            </span>
            <strong className="text-xl font-extrabold text-neutral-200 font-mono mt-1.5">8 Integrated</strong>
          </div>

          <div className="flex flex-col p-3.5 rounded-xl bg-[#111111] border border-[#222222] hover:border-neutral-500 transition-all">
            <span className="text-xs text-neutral-400 flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-neutral-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              </svg>
              <span>Shared Packages</span>
            </span>
            <strong className="text-xl font-extrabold text-neutral-200 font-mono mt-1.5">3 Core</strong>
          </div>

          <div className="flex flex-col p-3.5 rounded-xl bg-[#111111] border border-[#222222] hover:border-neutral-500 transition-all">
            <span className="text-xs text-neutral-400 flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-neutral-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
              <span>Port Collisions</span>
            </span>
            <strong className="text-xl font-extrabold text-neutral-200 font-mono mt-1.5">0 Collisions</strong>
          </div>
        </div>

        {/* Merged Search & Category Filter Toolbar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-1">
          <div className="relative flex-1 min-w-[260px] flex items-center">
            <svg
              className="absolute left-3 w-4 h-4 text-neutral-500 pointer-events-none"
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
              ref={searchInputRef as any}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search guides, rules, port assignments, and topics... (Press '/' to focus)"
              aria-label="Filter documentation guides"
              className="w-full h-10 pl-9 pr-9 rounded-xl bg-[#111111] border border-[#222222] text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500/30 transition-all font-mono"
            />
            {query ? (
              <button
                type="button"
                className="absolute right-3 text-xs text-neutral-400 hover:text-neutral-200 p-1"
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
              <kbd className="absolute right-3 px-1.5 py-0.5 rounded bg-[#111111] border border-[#222222] text-[10px] text-neutral-500 font-mono">
                /
              </kbd>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl shadow-[inset_0_1px_3px_rgba(0,0,0,0.6)]" role="tablist" aria-label="Filter documentation guides by category">
            <button
              type="button"
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedCategory === 'all'
                  ? 'bg-[#111111] text-neutral-200 font-bold border border-[#222222] shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-[#111111] hover:border-[#222222] border border-transparent font-medium'
              }`}
              onClick={() => setSelectedCategory('all')}
            >
              <span>All Guides</span>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${selectedCategory === 'all' ? 'bg-[#111111] text-neutral-300 border border-[#222222] font-bold' : 'bg-[#111111] text-neutral-400 border border-[#222222]'}`}>
                {DOCUMENTATION_GUIDES_REGISTRY.length}
              </span>
            </button>
            <button
              type="button"
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedCategory === 'rules'
                  ? 'bg-[#111111] text-neutral-200 font-bold border border-[#222222] shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-[#111111] hover:border-[#222222] border border-transparent font-medium'
              }`}
              onClick={() => setSelectedCategory((prev) => (prev === 'rules' ? 'all' : 'rules'))}
            >
              📜 Projects Rules
            </button>
            <button
              type="button"
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedCategory === 'design'
                  ? 'bg-[#111111] text-neutral-200 font-bold border border-[#222222] shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-[#111111] hover:border-[#222222] border border-transparent font-medium'
              }`}
              onClick={() => setSelectedCategory((prev) => (prev === 'design' ? 'all' : 'design'))}
            >
              📘 Packages Design
            </button>
            <button
              type="button"
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedCategory === 'ports'
                  ? 'bg-[#111111] text-neutral-200 font-bold border border-[#222222] shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-[#111111] hover:border-[#222222] border border-transparent font-medium'
              }`}
              onClick={() => setSelectedCategory((prev) => (prev === 'ports' ? 'all' : 'ports'))}
            >
              🌐 Port Topology
            </button>
            <button
              type="button"
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedCategory === 'techstack'
                  ? 'bg-[#111111] text-neutral-200 font-bold border border-[#222222] shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-[#111111] hover:border-[#222222] border border-transparent font-medium'
              }`}
              onClick={() => setSelectedCategory((prev) => (prev === 'techstack' ? 'all' : 'techstack'))}
            >
              ⚙️ Tech Stack
            </button>
            <button
              type="button"
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedCategory === 'cheatsheet'
                  ? 'bg-[#111111] text-neutral-200 font-bold border border-[#222222] shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-[#111111] hover:border-[#222222] border border-transparent font-medium'
              }`}
              onClick={() => setSelectedCategory((prev) => (prev === 'cheatsheet' ? 'all' : 'cheatsheet'))}
            >
              📋 Cheatsheet
            </button>
          </div>
        </div>
      </header>

      {/* Guides Grid / Showcase Area */}
      <section className="w-full flex flex-col gap-4" aria-label="Available Architecture Guides">
        {filteredGuides.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 rounded-2xl bg-[#111111] border border-[#222222] text-center gap-4 shadow-xl">
            <span className="text-4xl">🔍</span>
            <h3 className="text-sm font-bold text-neutral-200">No documentation guides matched &ldquo;{query}&rdquo;</h3>
            <p className="text-xs text-neutral-400 max-w-sm">Try searching for topics like &ldquo;ports&rdquo;, &ldquo;rules&rdquo;, &ldquo;sqlite&rdquo;, &ldquo;logger&rdquo;, or &ldquo;react 19&rdquo;.</p>
            <button
              type="button"
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#111111] border border-[#222222] text-neutral-300 font-bold hover:text-neutral-100 hover:border-neutral-500 transition-all shadow-sm"
              onClick={() => {
                setQuery('');
                setSelectedCategory('all');
                searchInputRef.current?.focus();
              }}
            >
              Reset Filters
            </button>
          </div>
        ) : filteredGuides.length === 1 ? (
          /* ── Featured Wide Showcase Layout When 1 Guide Matches (Eliminating Blank Void) ── */
          <div className="w-full rounded-2xl bg-[#111111] border border-[#222222] p-5 md:p-8 shadow-2xl flex flex-col lg:flex-row items-start justify-between gap-8 group">
            {/* Left Column: Full Identity, Description & Key Standards */}
            <div className="flex-1 flex flex-col gap-5 min-w-0">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-2xl bg-[#111111] border border-[#222222] flex items-center justify-center shrink-0 text-3xl shadow-inner">
                  {filteredGuides[0].icon}
                </div>
                <div className="flex flex-col gap-1.5 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-md text-[11px] font-mono font-bold tracking-wider uppercase bg-[#111111] border border-[#222222] text-neutral-300">
                      {filteredGuides[0].badge}
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-[#111111] border border-[#222222] text-neutral-300">
                      v{filteredGuides[0].version}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-md text-[11px] font-mono font-bold tracking-wider uppercase bg-[#111111] border border-[#222222] text-neutral-300">
                      {filteredGuides[0].category.toUpperCase()}
                    </span>
                  </div>
                  <h3 className="text-2xl font-extrabold text-neutral-200 tracking-tight group-hover:text-neutral-200 transition-colors">
                    {filteredGuides[0].title}
                  </h3>
                  <code className="text-xs font-mono text-neutral-500">{filteredGuides[0].filename}</code>
                </div>
              </div>

              <p className="text-sm text-neutral-300 leading-relaxed max-w-3xl">
                {filteredGuides[0].description}
              </p>

              <div className="flex flex-col gap-2.5 p-4 rounded-xl bg-[#0a0a0a] border border-[#222222]">
                <strong className="text-[11px] font-mono font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-2">
                  <span>⭐</span>
                  <span>KEY MANDATORY STANDARDS &amp; SPECIFICATIONS:</span>
                </strong>
                <ul className="flex flex-col gap-2 text-xs text-neutral-300 pl-4 list-disc">
                  {filteredGuides[0].keyHighlights.map((hl, i) => (
                    <li key={i} className="leading-relaxed">{hl}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Right Column: Telemetry, Covered Topics, and Direct Launch */}
            <div className="w-full lg:w-96 flex flex-col gap-4 shrink-0 p-5 rounded-xl bg-[#111111] border border-[#222222]">
              <div className="flex items-center justify-between pb-3 border-b border-[#1a1a1a] text-xs">
                <span className="text-neutral-500 font-mono font-semibold">EST. READ TIME</span>
                <strong className="text-neutral-200 font-mono font-bold text-sm">{filteredGuides[0].readTime}</strong>
              </div>

              <div className="flex items-center justify-between pb-3 border-b border-[#1a1a1a] text-xs">
                <span className="text-neutral-500 font-mono font-semibold">SPECIFICATION DEPTH</span>
                <strong className="text-neutral-200 font-mono font-bold text-sm">{filteredGuides[0].sectionsCount} Headings</strong>
              </div>

              <div className="flex flex-col gap-1 pb-3 border-b border-[#1a1a1a] text-xs">
                <span className="text-neutral-500 font-mono font-semibold">TARGET AUDIENCE</span>
                <span className="text-neutral-200 font-medium">{filteredGuides[0].targetAudience}</span>
              </div>

              <div className="flex flex-col gap-2 pb-2">
                <span className="text-neutral-500 font-mono text-xs font-semibold">COVERED TOPICS</span>
                <div className="flex flex-wrap gap-1.5">
                  {filteredGuides[0].topics.map((t) => (
                    <span key={t} className="px-2 py-1 rounded-md bg-[#111111] border border-[#222222] text-[11px] font-mono text-neutral-300">
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-2 border-t border-[#1a1a1a]">
                <button
                  type="button"
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-[#111111] border border-[#222222] text-neutral-300 font-bold hover:text-neutral-100 hover:border-neutral-500 flex items-center justify-center gap-2 shadow-lg shadow-sm transition-all"
                  onClick={() => onSelectGuide(filteredGuides[0].id)}
                >
                  <span>Read Full Specification</span>
                  <span>→</span>
                </button>
                {selectedCategory !== 'all' && (
                  <button
                    type="button"
                    className="w-full py-2 px-3 rounded-xl text-xs font-semibold text-neutral-400 hover:text-neutral-200 bg-[#111111] hover:bg-[#111111] border border-[#222222] transition-all"
                    onClick={() => setSelectedCategory('all')}
                  >
                    View all 5 architecture guides
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* ── Standard 3-Column Responsive Grid When Multiple Guides Match ── */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredGuides.map((guide) => (
              <article
                key={guide.id}
                className="group flex flex-col justify-between p-5 rounded-2xl bg-[#111111] border border-[#222222] hover:border-neutral-500 hover:bg-[#111111] hover:shadow-xl transition-all duration-200 gap-4 cursor-pointer h-full"
                onClick={() => {
                  consoleLogger.action('DOCS', `Selected guide: ${guide.title}`, { guideId: guide.id, slug: guide.slug });
                  onSelectGuide(guide.id);
                }}
              >
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl" aria-hidden="true">{guide.icon}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider uppercase bg-[#111111] border border-[#222222] text-neutral-300">
                        {guide.badge}
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-neutral-500">{guide.readTime}</span>
                  </div>

                  <div className="flex flex-col gap-1">
                    <h3 className="text-base font-bold text-neutral-200 group-hover:text-neutral-200 transition-colors">
                      {guide.title}
                    </h3>
                    <code className="text-[11px] font-mono text-neutral-500">{guide.filename}</code>
                    <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed min-h-[36px]">
                      {guide.description}
                    </p>
                  </div>

                  <div className="flex flex-col gap-1.5 p-2.5 rounded-xl bg-[#0a0a0a] border border-[#222222] text-xs">
                    <strong className="text-[10px] font-mono font-bold text-neutral-500 uppercase tracking-wider">KEY STANDARDS:</strong>
                    <ul className="flex flex-col gap-1 text-[11px] text-neutral-300 pl-3 list-disc">
                      {guide.keyHighlights.slice(0, 3).map((hl, i) => (
                        <li key={i} className="line-clamp-1">{hl}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {guide.topics.slice(0, 4).map((topic) => (
                      <span key={topic} className="px-2 py-0.5 rounded-md bg-[#111111] border border-[#222222] text-[10px] font-mono text-neutral-400">
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-[#1a1a1a] text-xs font-mono">
                  <span className="text-neutral-500">📑 {guide.sectionsCount} Sections</span>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#111111] border border-[#222222] text-neutral-300 font-bold group-hover:text-neutral-100 group-hover:border-neutral-500 transition-all shadow-md shadow-sm"
                  >
                    <span>Read Guide</span>
                    <span>→</span>
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
