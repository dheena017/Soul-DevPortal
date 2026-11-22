import React, { useState, useMemo } from 'react';
import CopyButton from './CopyButton';
import { ProjectData } from '../types';

export interface WorkspaceProjectsProps {
  projects?: ProjectData[];
  onBack?: () => void;
}

export default function WorkspaceProjects({ projects = [], onBack }: WorkspaceProjectsProps) {
  const [query, setQuery] = useState<string>('');
  const [filterFramework, setFilterFramework] = useState<string>('all');

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
      const matchesQuery = !query.trim() || [
        p.title,
        p.id,
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
      <header className="detail-header projects-hero">
        <div className="breadcrumb">
          {onBack && (
            <button type="button" className="back-link-btn" onClick={onBack}>
              ← Back to Overview
            </button>
          )}
          <span>Soul Workspace / Monorepo Applications</span>
        </div>
        <h1>Workspace <em>Applications &amp; Ports</em></h1>
        <p className="detail-description">
          Catalog of all 8 applications consuming the shared packages, their assigned development ports, backend servers, databases, and AI engines.
        </p>

        <div className="projects-toolbar">
          <div className="projects-search-input-wrap">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter applications by name, port, framework, AI engine..."
              aria-label="Filter applications"
            />
            {query && (
              <button type="button" className="search-clear-inline" onClick={() => setQuery('')}>
                ✕
              </button>
            )}
          </div>

          <div className="framework-filter-pills">
            {frameworksList.map((fw) => (
              <button
                type="button"
                key={fw}
                className={`framework-pill ${filterFramework === fw ? 'active' : ''}`}
                onClick={() => setFilterFramework(fw)}
              >
                {fw === 'all' ? 'All Frameworks' : fw}
              </button>
            ))}
          </div>
        </div>
      </header>

      <section className="projects-grid" aria-label="Monorepo projects">
        {filteredProjects.map((project) => {
          const runCmd = `npx @workspace/runner project ${project.id}`;
          return (
            <article className="project-card" key={project.id}>
              <div className="project-card-header">
                <div>
                  <h3 className="project-title">{project.title}</h3>
                  <code className="project-id">{project.id}</code>
                </div>
                <div className="port-badge-group">
                  {project.frontendPort && (
                    <span className="port-pill frontend-port" title="Frontend Dev Port">
                      FE :{project.frontendPort}
                    </span>
                  )}
                  {project.backendPort && (
                    <span className="port-pill backend-port" title="Backend Server Port">
                      BE :{project.backendPort}
                    </span>
                  )}
                </div>
              </div>

              <div className="project-specs">
                <div className="spec-row">
                  <span className="spec-label">Framework</span>
                  <span className="spec-val">{project.framework || 'N/A'}</span>
                </div>
                <div className="spec-row">
                  <span className="spec-label">Database</span>
                  <span className="spec-val">{project.dbInfo || 'None'}</span>
                </div>
                {project.aiEngine && project.aiEngine !== 'N/A' && (
                  <div className="spec-row ai-row">
                    <span className="spec-label">AI Engine</span>
                    <span className="spec-val ai-val">✨ {project.aiEngine}</span>
                  </div>
                )}
              </div>

              <div className="project-card-footer">
                <div className="cmd-snippet">
                  <code>{runCmd}</code>
                </div>
                <CopyButton text={runCmd} label="Copy Run" />
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
