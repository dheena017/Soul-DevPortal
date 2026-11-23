import React from 'react';
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

export interface ProjectCardProps {
  key?: React.Key;
  project: ProjectData;
  onSelectProject?: (projectId: string) => void;
}

export default function ProjectCard({ project, onSelectProject }: ProjectCardProps) {
  const formattedTitle = formatProjectTitle(project.id, project.title);
  const logoSrc = project.logo || PROJECT_LOGOS[project.id];
  const brand = PROJECT_BRAND_MAP[project.id] || {
    name: project.title,
    shortName: project.id,
    icon: '⚡',
    themeColor: '#3b82f6',
    accentBg: 'rgba(59, 130, 246, 0.12)',
    tag: 'Web App',
    primaryCapability: project.framework || 'Fullstack Application',
  };
  const description = project.description || `${formattedTitle} monorepo application.`;
  const tags = project.tags && project.tags.length > 0 ? project.tags : ['React 19', 'FastAPI', 'Tailwind v4', 'SQLite'];

  const handleCardClick = () => {
    if (onSelectProject) {
      onSelectProject(project.id);
    }
  };

  return (
    <article className="project-card enhanced-project-card gh-project-card">
      {/* Card Header: Brand, Meta, Ports */}
      <div
        className="project-card-top"
        onClick={handleCardClick}
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
                <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
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
        onClick={handleCardClick}
        style={{ cursor: onSelectProject ? 'pointer' : 'default' }}
        title={description}
      >
        {description}
      </p>

      {/* Card Specs Matrix: 3 Uniform Rows */}
      <div
        className="project-card-specs-grid"
        onClick={handleCardClick}
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

      {/* Card Footer: Action Buttons (Launch & Details) */}
      <div className="project-card-footer">
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
              onClick={handleCardClick}
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
}
