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
    <article className="group flex flex-col justify-between p-5 rounded-2xl bg-[#151519] border border-[#212126] hover:border-neutral-500 hover:bg-[#151519] hover:shadow-xl transition-all duration-200 gap-4 h-full">
      {/* Card Header: Brand, Meta, Ports */}
        <div
          className="flex flex-col gap-3.5"
          onClick={handleCardClick}
          style={{ cursor: onSelectProject ? 'pointer' : 'default' }}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border overflow-hidden shadow-inner"
                style={{
                  borderColor: `${brand.themeColor}40`,
                  background: `${brand.themeColor}15`,
                }}
              >
                {logoSrc ? (
                  <img
                    src={logoSrc}
                    alt={`${formattedTitle} logo`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLElement).style.display = 'none';
                      const fallback = e.currentTarget.parentElement?.querySelector('.project-card-logo-fallback') as HTMLElement;
                      if (fallback) fallback.style.display = 'grid';
                    }}
                  />
                ) : null}
                <span
                  className="project-card-logo-fallback text-base"
                  style={{ display: logoSrc ? 'none' : 'grid' }}
                >
                  {brand.icon || '⚡'}
                </span>
              </div>

              <div className="flex flex-col min-w-0 gap-0.5">
                <code className="text-xs font-mono font-bold text-neutral-200 truncate">{project.id}</code>
                <span className="inline-flex items-center gap-1 text-[10px] font-mono text-neutral-500" title="Git Branch">
                  <svg className="w-2.5 h-2.5 text-neutral-400" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                    <path d="M9.5 3.25a2.25 2.25 0 1 1 3 2.122V6A2.5 2.5 0 0 1 10 8.5H6a1 1 0 0 0-1 1v1.128a2.251 2.251 0 1 1-1.5 0V5.372a2.25 2.25 0 1 1 1.5 0v1.836A2.493 2.493 0 0 1 6 7h4a1 1 0 0 0 1-1v-.628A2.25 2.25 0 0 1 9.5 3.25Z" />
                  </svg>
                  main
                </span>
              </div>
            </div>

            <div className="flex flex-col items-end gap-1 shrink-0 font-mono text-xs">
              {project.frontendPort && (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#151519] border border-[#212126] text-neutral-300 text-[11px] font-bold" title={`Client Port :${project.frontendPort}`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" aria-hidden="true" />
                  <span>:{project.frontendPort}</span>
                </span>
              )}
              {project.backendPort && (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#151519] border border-[#212126] text-neutral-300 text-[11px] font-bold" title={`Server Port :${project.backendPort}`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" aria-hidden="true" />
                  <span>:{project.backendPort}</span>
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between gap-2">
            <h3 className="text-base font-bold text-neutral-200 group-hover:text-neutral-200 transition-colors truncate">
              {formattedTitle}
            </h3>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase tracking-wider bg-[#151519] text-neutral-400 border border-[#212126] shrink-0">
              Public
            </span>
          </div>

          {/* Description */}
          <p
            className="text-xs text-neutral-400 line-clamp-2 leading-relaxed min-h-[36px]"
            title={description}
          >
            {description}
          </p>
        </div>

        {/* Card Specs Matrix */}
        <div
          className="flex flex-col gap-2 p-2.5 rounded-xl bg-[#070708] border border-[#212126] text-xs"
          onClick={handleCardClick}
          style={{ cursor: onSelectProject ? 'pointer' : 'default' }}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-neutral-500 flex items-center gap-1.5 shrink-0">
              <span>⚡</span>
              <span>Stack</span>
            </span>
            <span className="text-neutral-300 font-mono text-[11px] truncate">
              {project.framework ? project.framework.split('+').slice(0, 2).join(' + ') : 'React 19 + Vite 8'}
            </span>
          </div>

          <div className="flex items-center justify-between gap-2">
            <span className="text-neutral-500 flex items-center gap-1.5 shrink-0">
              <span>🗄️</span>
              <span>Database</span>
            </span>
            <span className="text-neutral-300 font-mono text-[11px] truncate">
              {project.dbInfo || 'SQLite (WAL Mode)'}
            </span>
          </div>

          <div className="flex items-center justify-between gap-2">
            <span className="text-neutral-500 flex items-center gap-1.5 shrink-0">
              <span>{project.aiEngine && project.aiEngine !== 'N/A' ? '✨' : '🚀'}</span>
              <span>{project.aiEngine && project.aiEngine !== 'N/A' ? 'AI Engine' : 'Capability'}</span>
            </span>
            <span className="text-neutral-300 font-mono text-[11px] font-medium truncate">
              {project.aiEngine && project.aiEngine !== 'N/A'
                ? project.aiEngine.split('+')[0].trim()
                : brand.primaryCapability}
            </span>
          </div>
        </div>

        {/* GitHub Language Dots Tags Row */}
        <div className="flex flex-wrap items-center gap-2">
          {tags.slice(0, 4).map((tag) => {
            const dotColor = getTagColor(tag);
            return (
              <span
                key={tag}
                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#151519] border border-[#212126] text-[11px] font-mono text-neutral-400"
              >
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: dotColor }} aria-hidden="true" />
                <span>{tag}</span>
              </span>
            );
          })}
        </div>

        {/* Card Footer: Action Buttons (Launch & Details) */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#212126]">
          {project.frontendPort && (
            <a
              href={`http://localhost:${project.frontendPort}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#151519] border border-[#212126] text-neutral-300 hover:text-neutral-200 hover:border-neutral-500 transition-all"
              title={`Launch on http://localhost:${project.frontendPort}`}
              onClick={(e) => e.stopPropagation()}
            >
              <span>Launch</span>
              <span className="text-neutral-500">↗</span>
            </a>
          )}
          {onSelectProject && (
            <button
              type="button"
              className="inline-flex items-center gap-1 px-4 py-1.5 rounded-lg text-xs font-semibold bg-[#151519] border border-[#212126] text-neutral-300 font-bold hover:text-neutral-100 hover:border-neutral-500 transition-all shadow-sm"
              onClick={handleCardClick}
              title={`Open deep detail view for ${formattedTitle}`}
            >
              <span>Details</span>
              <span>→</span>
            </button>
          )}
        </div>
      </article>
  );
}
