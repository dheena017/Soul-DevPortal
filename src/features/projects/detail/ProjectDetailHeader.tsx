import React from 'react';
import CopyButton from '../../../components/CopyButton';
import { ProjectData } from '../../../types';

export type ProjectDetailTab = 'overview' | 'api' | 'scripts' | 'database' | 'env' | 'readme';

export interface ProjectDetailHeaderProps {
  project: ProjectData;
  activeTab: ProjectDetailTab;
  onTabChange: (tab: ProjectDetailTab) => void;
  portTesting: boolean;
  portStatus: { fe: string; be: string; latency: number } | null;
  onTestPorts: () => void;
  fileTreeCount: number;
  tablesCount: number;
  scriptsCount: number;
  envCount: number;
  feUrl: string | null;
  beUrl: string | null;
  onBack?: () => void;
}

export default function ProjectDetailHeader({
  project,
  activeTab,
  onTabChange,
  portTesting,
  portStatus,
  onTestPorts,
  fileTreeCount: _fileTreeCount,
  tablesCount,
  scriptsCount,
  envCount,
  feUrl,
  beUrl,
  onBack,
}: ProjectDetailHeaderProps) {
  return (
    <header className="detail-header pillar-hero-header project-hero-header">
      {/* ── Top Row: Breadcrumb & Actions ── */}
      <div className="breadcrumb-nav-row">
        <div className="breadcrumb-left-group">
          {onBack ? (
            <button type="button" className="project-back-pill-btn" onClick={onBack} title="Back to all projects">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              <span>Back</span>
            </button>
          ) : (
            <a href="#projects" className="project-back-pill-btn" title="Back to all projects">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              <span>Back</span>
            </a>
          )}
          <div className="breadcrumb-divider-line" aria-hidden="true" />
          <nav className="breadcrumb-trail" aria-label="Breadcrumb navigation">
            <span className="crumb-root">Soul Workspace</span>
            <span className="crumb-sep">/</span>
            <a
              href="#projects"
              className="crumb-link"
              onClick={(e) => {
                e.preventDefault();
                onBack?.();
              }}
            >
              Pillar 1: Projects
            </a>
            <span className="crumb-sep">/</span>
            <strong className="crumb-active">{project.title}</strong>
          </nav>
        </div>

        <div className="detail-top-actions">
          <button
            type="button"
            className={`test-ports-btn ${portTesting ? 'testing' : ''}`}
            onClick={onTestPorts}
            disabled={portTesting}
            title="Probe socket port availability"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
            <span>{portTesting ? 'Probing Ports...' : 'Probe Socket Ports'}</span>
          </button>

          {feUrl && (
            <a href={feUrl} target="_blank" rel="noopener noreferrer" className="live-link-btn fe-link" title="Open Client in Browser">
              <span className="live-link-dot fe-dot" aria-hidden="true" />
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
              <span>Launch Client :{project.frontendPort}</span>
            </a>
          )}
          {beUrl && (
            <a href={beUrl} target="_blank" rel="noopener noreferrer" className="live-link-btn be-link" title="Open Server API">
              <span className="live-link-dot be-dot" aria-hidden="true" />
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
                <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
                <line x1="6" y1="6" x2="6.01" y2="6" />
                <line x1="6" y1="18" x2="6.01" y2="18" />
              </svg>
              <span>Launch Server :{project.backendPort}</span>
            </a>
          )}
          <CopyButton text={window.location.href} label="Share link" copiedLabel="Link copied!" variant="compact" />
        </div>
      </div>

      {/* ── Title & Identifiers Row ── */}
      <div className="detail-title-row">
        <div className="project-app-logo-wrap">
          {project.logo ? (
            <img
              src={project.logo}
              alt={`${project.title} logo`}
              className="project-app-logo"
              onError={(e) => {
                (e.currentTarget as HTMLElement).style.display = 'none';
              }}
            />
          ) : (
            <span className="project-app-fallback-icon">⚡</span>
          )}
        </div>
        <div className="package-title-copy">
          <div className="title-with-badge">
            <h1>{project.title}</h1>
            <code className="app-id-tag">{project.id}</code>
            {project.version && (
              <span className="version-pill">
                <span className="version-pill-dot" aria-hidden="true" />
                v{project.version}
              </span>
            )}
          </div>
          <p className="detail-description">
            {project.description || `${project.title} monorepo application powered by ${project.framework || 'standard frontend'}.`}
          </p>
          <div className="project-consumed-packages-row">
            <span className="consumed-label">CONSUMES:</span>
            <a href="#packages/logger" className="consumed-pkg-tag">
              <span className="consumed-dot" aria-hidden="true" />
              <span>@workspace/logger</span>
            </a>
            <a href="#packages/config" className="consumed-pkg-tag">
              <span className="consumed-dot" aria-hidden="true" />
              <span>@workspace/config</span>
            </a>
            <a href="#packages/runner" className="consumed-pkg-tag">
              <span className="consumed-dot" aria-hidden="true" />
              <span>@workspace/runner</span>
            </a>
          </div>
        </div>
      </div>

      {/* ── Port Prober Status Banner (if tested) ── */}
      {portStatus && (
        <div className="port-prober-result-banner">
          <div className="probe-result-item">
            <span className="probe-label">Client Port :{project.frontendPort}</span>
            <span className="probe-status ready">● {portStatus.fe}</span>
          </div>
          <div className="probe-result-item">
            <span className="probe-label">Server Port :{project.backendPort}</span>
            <span className="probe-status ready">● {portStatus.be}</span>
          </div>
          <div className="probe-result-item">
            <span className="probe-label">Round-Trip Latency</span>
            <span className="probe-latency">{portStatus.latency}ms</span>
          </div>
        </div>
      )}

      {/* ── Header Tabs Separator ── */}
      <div className="header-tabs-separator" />

      {/* ── Modern Integrated Navigation Tabs Bar inside Header ── */}
      <div className="project-detail-tabs-bar" role="tablist" aria-label="Project sections">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'overview'}
          className={`project-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => onTabChange('overview')}
        >
          <span className="tab-svg-icon" aria-hidden="true">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="9" />
              <rect x="14" y="3" width="7" height="5" />
              <rect x="14" y="12" width="7" height="9" />
              <rect x="3" y="16" width="7" height="5" />
            </svg>
          </span>
          <span className="tab-label">Overview</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'api'}
          className={`project-tab-btn ${activeTab === 'api' ? 'active' : ''}`}
          onClick={() => onTabChange('api')}
        >
          <span className="tab-svg-icon" aria-hidden="true">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
          </span>
          <span className="tab-label">API &amp; Routes</span>
          <span className="tab-count-badge">{project.apiEndpoints?.length || (project.backendPort ? 1 : 0)}</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'database'}
          className={`project-tab-btn ${activeTab === 'database' ? 'active' : ''}`}
          onClick={() => onTabChange('database')}
        >
          <span className="tab-svg-icon" aria-hidden="true">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <ellipse cx="12" cy="5" rx="9" ry="3" />
              <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
              <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
            </svg>
          </span>
          <span className="tab-label">Database &amp; Models</span>
          <span className="tab-count-badge">{tablesCount || 1}</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'scripts'}
          className={`project-tab-btn ${activeTab === 'scripts' ? 'active' : ''}`}
          onClick={() => onTabChange('scripts')}
        >
          <span className="tab-svg-icon" aria-hidden="true">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="4 17 10 11 4 5" />
              <line x1="12" y1="19" x2="20" y2="19" />
            </svg>
          </span>
          <span className="tab-label">Scripts</span>
          <span className="tab-count-badge">{scriptsCount}</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'env'}
          className={`project-tab-btn ${activeTab === 'env' ? 'active' : ''}`}
          onClick={() => onTabChange('env')}
        >
          <span className="tab-svg-icon" aria-hidden="true">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" y1="21" x2="4" y2="14" />
              <line x1="4" y1="10" x2="4" y2="3" />
              <line x1="12" y1="21" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12" y2="3" />
              <line x1="20" y1="21" x2="20" y2="16" />
              <line x1="20" y1="12" x2="20" y2="3" />
              <line x1="1" y1="14" x2="7" y2="14" />
              <line x1="9" y1="8" x2="15" y2="8" />
              <line x1="17" y1="16" x2="23" y2="16" />
            </svg>
          </span>
          <span className="tab-label">Environment</span>
          <span className="tab-count-badge">{envCount}</span>
        </button>

        {project.readmeBlocks && project.readmeBlocks.length > 0 && (
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'readme'}
            className={`project-tab-btn ${activeTab === 'readme' ? 'active' : ''}`}
            onClick={() => onTabChange('readme')}
          >
            <span className="tab-svg-icon" aria-hidden="true">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
            </span>
            <span className="tab-label">Documentation</span>
          </button>
        )}
      </div>
    </header>
  );
}
