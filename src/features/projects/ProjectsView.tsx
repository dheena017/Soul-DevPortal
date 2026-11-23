import React, { useState, useMemo, useRef, useEffect } from 'react';
import { consoleLogger } from '@workspace/logger';
import CopyButton from '../../components/CopyButton';
import { ProjectData } from '../../types';
import { PROJECT_LOGOS, PROJECT_BRAND_MAP, formatProjectTitle } from './projectsConstants';

function getTagColor(tag: string): string {
  const lower = tag.toLowerCase();
  if (lower.includes('typescript') || lower.includes('ts')) return '#3178c6';
  if (lower.includes('python') || lower.includes('py')) return '#3572A5';
  if (lower.includes('javascript') || lower.includes('js')) return '#f1e05a';
  if (lower.includes('react')) return '#61dafb';
  if (lower.includes('fastapi')) return '#009688';
  if (lower.includes('tailwind')) return '#38bdf8';
  if (lower.includes('vite')) return '#bd34fe';
  if (lower.includes('next')) return '#ffffff';
  if (lower.includes('sqlite')) return '#003b57';
  if (lower.includes('supabase') || lower.includes('postgres')) return '#3ecf8e';
  if (lower.includes('gemini') || lower.includes('ai') || lower.includes('google')) return '#4285f4';
  if (lower.includes('youtube')) return '#ff0000';
  if (lower.includes('pwa') || lower.includes('capacitor')) return '#5a0fc8';
  return '#848d97';
}

export interface ProjectsViewProps {
  projects?: ProjectData[];
  onBack?: () => void;
  onSelectProject?: (projectId: string) => void;
}

export default function ProjectsView({
  projects = [],
  onBack,
  onSelectProject,
}: ProjectsViewProps) {
  const [query, setQuery] = useState<string>('');

  const handleSelect = (projectId: string) => {
    const proj = projects.find((p) => p.id === projectId);
    consoleLogger.action('PROJECTS', `Selected project: ${proj ? proj.title : projectId}`, { projectId });
    onSelectProject?.(projectId);
  };
  const [filterFramework, setFilterFramework] = useState<string>('all');
  const searchInputRef = useRef<HTMLInputElement>(null);

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

  const frameworksList = useMemo(() => {
    const set = new Set<string>();
    projects.forEach((p) => {
      if (p.framework?.includes('React 19')) set.add('React 19');
      else if (p.framework?.includes('React 18')) set.add('React 18');
      else if (p.framework?.includes('Next.js')) set.add('Next.js');
    });
    return ['all', ...Array.from(set)];
  }, [projects]);

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const desc = p.description || '';
      const tags = (p.tags || []).join(' ');
      const matchesQuery = !query.trim() || [
        p.title,
        p.id,
        desc,
        tags,
        p.framework,
        p.dbInfo,
        p.aiEngine,
        p.frontendPort?.toString(),
        p.backendPort?.toString(),
      ].join(' ').toLowerCase().includes(query.trim().toLowerCase());

      const matchesFramework = filterFramework === 'all' || p.framework?.includes(filterFramework);

      return matchesQuery && matchesFramework;
    });
  }, [projects, query, filterFramework]);

  return (
    <article className="workspace-projects-view">
      <header className="detail-header pillar-hero-header">
        <div className="breadcrumb-nav-row">
          <div className="breadcrumb">
            {onBack && (
              <button type="button" className="back-link-btn" onClick={onBack}>
                ← Back
              </button>
            )}
            <span>Soul Workspace</span>
            <span className="crumb-sep">/</span>
            <strong className="crumb-active">Pillar 1: Projects</strong>
          </div>

          <div className="header-status-pill">
            <span className="status-live-dot" aria-hidden="true" />
            <span>{projects.length} Applications Indexed</span>
          </div>
        </div>

        <div className="detail-title-row">
          <div className="detail-icon blue" aria-hidden="true">💻</div>
          <div className="package-title-copy">
            <div className="title-with-badge">
              <h1>Projects &amp; Applications Dashboard</h1>
              <span className="monorepo-tag-pill">Pillar 1</span>
            </div>
            <p className="detail-description">
              Catalog of all 8 applications consuming the shared packages, their assigned development ports, backend servers, databases, and AI engines.
            </p>
          </div>
        </div>

        {/* Pillar 1 Key Metrics Banner */}
        <div className="docs-hub-metrics-banner">
          <div className="docs-metric-pill">
            <span className="docs-metric-val">{projects.length}</span>
            <span className="docs-metric-label">Total Applications</span>
          </div>
          <div className="docs-metric-pill">
            <span className="docs-metric-val">6</span>
            <span className="docs-metric-label">Client-Server Fullstack</span>
          </div>
          <div className="docs-metric-pill">
            <span className="docs-metric-val">2</span>
            <span className="docs-metric-label">Standalone Web Apps</span>
          </div>
          <div className="docs-metric-pill">
            <span className="docs-metric-val">0</span>
            <span className="docs-metric-label">Port Collisions</span>
          </div>
          <div className="docs-metric-pill">
            <span className="docs-metric-val">100%</span>
            <span className="docs-metric-label">SQLite Isolation</span>
          </div>
        </div>

        <div className="projects-toolbar">
          <div className="projects-search-input-wrap">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              ref={searchInputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search 8 applications by name, port, framework, AI engine... (Press '/' to focus)"
              aria-label="Filter applications"
            />
            {query ? (
              <button type="button" className="search-clear-inline" onClick={() => setQuery('')} aria-label="Clear search">
                ✕
              </button>
            ) : (
              <kbd style={{ position: 'absolute', right: '12px', fontSize: '11px', color: '#6b7280', background: '#1c1c1c', border: '1px solid #333', borderRadius: '4px', padding: '1px 5px' }}>/</kbd>
            )}
          </div>

          <div className="framework-filter-pills filter-pills" role="tablist" aria-label="Filter by framework">
            {frameworksList.map((fw) => {
              const count = fw === 'all'
                ? projects.length
                : projects.filter((p) => p.framework?.includes(fw)).length;
              return (
                <button
                  type="button"
                  key={fw}
                  className={`framework-pill ${filterFramework === fw ? 'active' : ''}`}
                  onClick={() => setFilterFramework(fw)}
                >
                  <span className="pill-text">{fw === 'all' ? 'All Frameworks' : fw}</span>
                  <span className="pill-count">{count}</span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      <section className="projects-grid" aria-label="Monorepo projects">
        {filteredProjects.map((project) => {
          const runCmd = `npx @workspace/runner project ${project.id}`;
          const brand = PROJECT_BRAND_MAP[project.id] || {
            name: project.title,
            shortName: project.id,
            icon: '⚡',
            themeColor: '#3b82f6',
            accentBg: 'rgba(59, 130, 246, 0.12)',
            tag: 'Web App',
            primaryCapability: project.framework || 'Fullstack Application',
          };
          const formattedTitle = formatProjectTitle(project.id, project.title);
          const logoSrc = project.logo || PROJECT_LOGOS[project.id];
          const description = project.description || `${formattedTitle} monorepo application.`;
          const tags = project.tags && project.tags.length > 0 ? project.tags : ['React 19', 'FastAPI', 'Tailwind v4', 'SQLite'];

          return (
            <article className="project-card enhanced-project-card gh-project-card" key={project.id}>
              {/* Card Header: Brand, Meta, Ports */}
              <div
                className="project-card-top"
                onClick={() => handleSelect(project.id)}
                style={{ cursor: onSelectProject ? 'pointer' : 'default' }}
              >
                <div className="card-top-bar">
                  <div className="card-brand-avatar-group">
                    <div
                      className="project-card-logo-container"
                      style={{
                        borderColor: `${brand.themeColor}38`,
                        background: `${brand.themeColor}18`,
                      }}
                    >
                      {logoSrc ? (
                        <img
                          src={logoSrc}
                          alt={`${formattedTitle} logo`}
                          className="project-card-logo-img"
                          onError={(e) => {
                            (e.currentTarget as HTMLElement).style.display = 'none';
                            const fallback = e.currentTarget.parentElement?.querySelector('.project-card-logo-fallback') as HTMLElement;
                            if (fallback) fallback.style.display = 'grid';
                          }}
                        />
                      ) : null}
                      <span
                        className="project-card-logo-fallback"
                        style={{ display: logoSrc ? 'none' : 'grid' }}
                      >
                        {brand.icon || '⚡'}
                      </span>
                    </div>

                    <div className="card-slug-branch">
                      <code className="project-id-chip">{project.id}</code>
                      <span className="gh-branch-badge" title="Git Branch">
                        <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor">
                          <path d="M9.5 3.25a2.25 2.25 0 1 1 3 2.122V6A2.5 2.5 0 0 1 10 8.5H6a1 1 0 0 0-1 1v1.128a2.251 2.251 0 1 1-1.5 0V5.372a2.25 2.25 0 1 1 1.5 0v1.836A2.493 2.493 0 0 1 6 7h4a1 1 0 0 0 1-1v-.628A2.25 2.25 0 0 1 9.5 3.25Z" />
                        </svg>
                        main
                      </span>
                    </div>
                  </div>

                  <div className="port-badge-group">
                    {project.frontendPort && (
                      <span className="port-pill frontend-port" title={`Client Port :${project.frontendPort}`}>
                        <span className="port-dot fe-dot" aria-hidden="true" />
                        <span>Client :{project.frontendPort}</span>
                      </span>
                    )}
                    {project.backendPort && (
                      <span className="port-pill backend-port" title={`Server Port :${project.backendPort}`}>
                        <span className="port-dot be-dot" aria-hidden="true" />
                        <span>Server :{project.backendPort}</span>
                      </span>
                    )}
                  </div>
                </div>

                <div className="card-title-row">
                  <h3 className="project-title gh-repo-title">{formattedTitle}</h3>
                  <span className="gh-visibility-badge">Public</span>
                </div>
              </div>

              {/* Card Body: Description with fixed height & clamp */}
              <p
                className="project-card-desc"
                onClick={() => handleSelect(project.id)}
                style={{ cursor: onSelectProject ? 'pointer' : 'default' }}
                title={description}
              >
                {description}
              </p>

              {/* Card Specs Matrix: 3 Uniform Rows */}
              <div
                className="project-card-specs-grid"
                onClick={() => handleSelect(project.id)}
                style={{ cursor: onSelectProject ? 'pointer' : 'default' }}
              >
                <div className="spec-badge" title={project.framework || 'React 19 + Vite 8 + Tailwind CSS v4'}>
                  <span className="spec-icon">⚡</span>
                  <span className="spec-label">Stack</span>
                  <span className="spec-text">
                    {project.framework ? project.framework.split('+').slice(0, 2).join(' + ') : 'React 19 + Vite 8'}
                  </span>
                </div>

                <div className="spec-badge" title={project.dbInfo || 'SQLite (WAL Mode Engine)'}>
                  <span className="spec-icon">🗄️</span>
                  <span className="spec-label">Database</span>
                  <span className="spec-text">{project.dbInfo || 'SQLite (WAL Mode)'}</span>
                </div>

                <div
                  className="spec-badge ai-spec-badge"
                  title={project.aiEngine && project.aiEngine !== 'N/A' ? project.aiEngine : brand.primaryCapability}
                >
                  <span className="spec-icon">{project.aiEngine && project.aiEngine !== 'N/A' ? '✨' : '🚀'}</span>
                  <span className="spec-label">{project.aiEngine && project.aiEngine !== 'N/A' ? 'AI Engine' : 'Capability'}</span>
                  <span className="spec-text ai-text">
                    {project.aiEngine && project.aiEngine !== 'N/A'
                      ? project.aiEngine.split('+')[0].trim()
                      : brand.primaryCapability}
                  </span>
                </div>
              </div>

              {/* GitHub Language Dots Tags Row */}
              <div className="project-card-tags-row gh-tags-row">
                {tags.slice(0, 4).map((tag) => {
                  const dotColor = getTagColor(tag);
                  return (
                    <span key={tag} className="project-mini-tag gh-lang-pill">
                      <span className="lang-dot" style={{ backgroundColor: dotColor, width: '8px', height: '8px' }} aria-hidden="true" />
                      <span>{tag}</span>
                    </span>
                  );
                })}
              </div>

              {/* Card Footer: Command & Actions */}
              <div className="project-card-footer">
                <div className="cmd-snippet">
                  <span className="cmd-prompt-sym">$</span>
                  <code>{runCmd}</code>
                  <CopyButton text={runCmd} variant="compact" label="Copy" copiedLabel="Copied!" title={`Copy '${runCmd}'`} />
                </div>
                <div className="project-card-action-btns">
                  {project.frontendPort && (
                    <a
                      href={`http://localhost:${project.frontendPort}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="card-launch-btn"
                      title={`Launch on http://localhost:${project.frontendPort}`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span>Launch</span>
                      <span className="btn-arrow-icon">↗</span>
                    </a>
                  )}
                  {onSelectProject && (
                    <button
                      type="button"
                      className="view-project-details-btn"
                      onClick={() => handleSelect(project.id)}
                      title={`Open deep detail view for ${formattedTitle}`}
                    >
                      <span>Details</span>
                      <span className="btn-arrow-icon">→</span>
                    </button>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </section>

      {filteredProjects.length === 0 && (
        <div className="empty-state-card">
          <p>No projects match your filter criteria.</p>
          <button type="button" className="empty-state-btn" onClick={() => { setQuery(''); setFilterFramework('all'); }}>
            Reset Filters
          </button>
        </div>
      )}
    </article>
  );
}
