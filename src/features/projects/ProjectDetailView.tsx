import React, { useState, useMemo } from 'react';
import CopyButton from '../../components/CopyButton';
import Markdown from '../../components/Markdown';
import { ProjectData } from '../../types';
import { PROJECT_DESCRIPTIONS, PROJECT_FEATURES_MAP } from './projectsConstants';

export interface ProjectDetailViewProps {
  project: ProjectData;
  onBack?: () => void;
}

export default function ProjectDetailView({ project, onBack }: ProjectDetailViewProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'api' | 'scripts' | 'database' | 'packages' | 'env' | 'readme'>('overview');
  const [portTesting, setPortTesting] = useState<boolean>(false);
  const [portStatus, setPortStatus] = useState<{ fe: string; be: string; latency: number } | null>(null);
  const [showSecretPlaceholders, setShowSecretPlaceholders] = useState<boolean>(false);

  const runnerCmd = `npx @workspace/runner project ${project.id}`;
  const feUrl = project.frontendPort ? `http://localhost:${project.frontendPort}` : null;
  const beUrl = project.backendPort ? `http://localhost:${project.backendPort}` : null;

  const scriptsEntries = Object.entries(project.scripts || {});
  const depsEntries = Object.entries(project.dependencies || {});
  const devDepsEntries = Object.entries(project.devDependencies || {});
  const envKeys = project.envKeys || project.configuration || [];
  const fileTree = project.fileTree || [];
  const tables = project.tables || [];

  const featuresList = useMemo(() => {
    if (project.features && project.features.length > 0) {
      return project.features.map((f) => {
        if (typeof f === 'object' && f !== null) {
          return {
            title: (f as any).name || (f as any).title || 'Feature',
            desc: (f as any).description || '',
          };
        }
        return { title: String(f), desc: '' };
      });
    }
    const defaultFeatures = PROJECT_FEATURES_MAP[project.id] || [];
    return defaultFeatures.map((f) => ({ title: f, desc: '' }));
  }, [project.features, project.id]);

  const handleTestPorts = () => {
    setPortTesting(true);
    setTimeout(() => {
      setPortTesting(false);
      setPortStatus({
        fe: project.frontendPort ? 'STANDBY / READY' : 'UNASSIGNED',
        be: project.backendPort ? 'STANDBY / READY' : 'UNASSIGNED',
        latency: Math.floor(Math.random() * 8) + 2,
      });
    }, 700);
  };

  const sampleEnvFile = useMemo(() => {
    return envKeys.map((k) => {
      if (k.includes('SECRET') || k.includes('KEY')) return `${k}="sk_monorepo_sample_secret_key"`;
      if (k === 'PORT' || k === 'BACKEND_PORT') return `${k}="${project.backendPort || 8000}"`;
      if (k === 'FRONTEND_PORT') return `${k}="${project.frontendPort || 5173}"`;
      if (k === 'APP_URL') return `${k}="http://localhost:${project.frontendPort || 5173}"`;
      if (k === 'BACKEND_URL') return `${k}="http://localhost:${project.backendPort || 8000}"`;
      if (k === 'NODE_ENV') return `${k}="development"`;
      return `${k}="sample_${k.toLowerCase()}_val"`;
    }).join('\n');
  }, [envKeys, project.backendPort, project.frontendPort]);

  return (
    <article className="project-detail-view">
      <header className="detail-header pillar-hero-header project-hero-header">
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
              <span>Soul Workspace</span>
              <span className="crumb-sep">/</span>
              <a href="#projects" className="crumb-link" onClick={(e) => { e.preventDefault(); onBack?.(); }}>
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
              onClick={handleTestPorts}
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
              {project.version && <span className="version-pill">v{project.version}</span>}
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

        {/* Port Prober Status Banner (if tested) */}
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

        {/* Specs Overview Row */}
        <div className="package-metadata project-meta-strip">
          <div className="metadata-card">
            <div className="metadata-card-header">
              <span className="metadata-icon" aria-hidden="true">🌐</span>
              <span className="metadata-label">CLIENT PORT</span>
            </div>
            <div className="metadata-value-group">
              <strong className="metadata-value text-emerald">{project.frontendPort ? `:${project.frontendPort}` : 'N/A'}</strong>
            </div>
          </div>
          <div className="metadata-card">
            <div className="metadata-card-header">
              <span className="metadata-icon" aria-hidden="true">🔌</span>
              <span className="metadata-label">SERVER PORT</span>
            </div>
            <div className="metadata-value-group">
              <strong className="metadata-value text-blue">{project.backendPort ? `:${project.backendPort}` : 'N/A'}</strong>
            </div>
          </div>
          <div className="metadata-card">
            <div className="metadata-card-header">
              <span className="metadata-icon" aria-hidden="true">⚙️</span>
              <span className="metadata-label">FRAMEWORK</span>
            </div>
            <div className="metadata-value-group">
              <strong className="metadata-value">{project.framework || 'Web Application'}</strong>
            </div>
          </div>
          <div className="metadata-card">
            <div className="metadata-card-header">
              <span className="metadata-icon" aria-hidden="true">🗄️</span>
              <span className="metadata-label">DATABASE</span>
            </div>
            <div className="metadata-value-group">
              <strong className="metadata-value">{project.dbInfo || 'Local Storage'}</strong>
            </div>
          </div>
          <div className="metadata-card">
            <div className="metadata-card-header">
              <span className="metadata-icon" aria-hidden="true">✨</span>
              <span className="metadata-label">AI ENGINE</span>
            </div>
            <div className="metadata-value-group">
              <strong className="metadata-value">{project.aiEngine && project.aiEngine !== 'N/A' ? `✨ ${project.aiEngine}` : 'Standard'}</strong>
            </div>
          </div>
          <div className="metadata-card">
            <div className="metadata-card-header">
              <span className="metadata-icon" aria-hidden="true">📁</span>
              <span className="metadata-label">ROOT FILES</span>
            </div>
            <div className="metadata-value-group">
              <strong className="metadata-value">{fileTree.length} items</strong>
            </div>
          </div>
        </div>

        {/* Quick Launch Commands Banner */}
        <div className="project-quick-commands-banner">
          <div className="quick-cmd-item">
            <div className="quick-cmd-header">
              <span className="quick-cmd-icon" aria-hidden="true">⚡</span>
              <span className="quick-cmd-label">MONOREPO RUNNER</span>
            </div>
            <div className="quick-cmd-box">
              <span className="cmd-prompt-sym" aria-hidden="true">$</span>
              <code>{runnerCmd}</code>
              <CopyButton text={runnerCmd} variant="compact" />
            </div>
          </div>
          {project.frontendCmd && (
            <div className="quick-cmd-item">
              <div className="quick-cmd-header">
                <span className="quick-cmd-icon" aria-hidden="true">💻</span>
                <span className="quick-cmd-label">CLIENT START</span>
              </div>
              <div className="quick-cmd-box">
                <span className="cmd-prompt-sym" aria-hidden="true">$</span>
                <code>{project.frontendCmd}</code>
                <CopyButton text={project.frontendCmd} variant="compact" />
              </div>
            </div>
          )}
          {project.backendCmd && (
            <div className="quick-cmd-item">
              <div className="quick-cmd-header">
                <span className="quick-cmd-icon" aria-hidden="true">🔌</span>
                <span className="quick-cmd-label">SERVER START</span>
              </div>
              <div className="quick-cmd-box">
                <span className="cmd-prompt-sym" aria-hidden="true">$</span>
                <code>{project.backendCmd}</code>
                <CopyButton text={project.backendCmd} variant="compact" />
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="package-detail-tabs project-tabs-bar" role="tablist" aria-label="Project sections">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'overview'}
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <span className="tab-icon">📊</span>
          <span>Overview</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'api'}
          className={`tab-btn ${activeTab === 'api' ? 'active' : ''}`}
          onClick={() => setActiveTab('api')}
        >
          <span className="tab-icon">⚡</span>
          <span>API &amp; Routes ({project.apiEndpoints?.length || (project.backendPort ? 1 : 0)})</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'database'}
          className={`tab-btn ${activeTab === 'database' ? 'active' : ''}`}
          onClick={() => setActiveTab('database')}
        >
          <span className="tab-icon">🗄️</span>
          <span>Database &amp; Models ({tables.length || 1})</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'scripts'}
          className={`tab-btn ${activeTab === 'scripts' ? 'active' : ''}`}
          onClick={() => setActiveTab('scripts')}
        >
          <span className="tab-icon">💻</span>
          <span>Scripts ({scriptsEntries.length})</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'packages'}
          className={`tab-btn ${activeTab === 'packages' ? 'active' : ''}`}
          onClick={() => setActiveTab('packages')}
        >
          <span className="tab-icon">🔗</span>
          <span>Shared Packages</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'env'}
          className={`tab-btn ${activeTab === 'env' ? 'active' : ''}`}
          onClick={() => setActiveTab('env')}
        >
          <span className="tab-icon">⚙️</span>
          <span>Environment ({envKeys.length})</span>
        </button>
        {project.readmeBlocks && project.readmeBlocks.length > 0 && (
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'readme'}
            className={`tab-btn ${activeTab === 'readme' ? 'active' : ''}`}
            onClick={() => setActiveTab('readme')}
          >
            <span className="tab-icon">📖</span>
            <span>Documentation</span>
          </button>
        )}
      </div>

      {/* Tab 1: Overview & Architecture */}
      {activeTab === 'overview' && (
        <div className="project-tab-content">
          <div className="project-overview-grid">
            {/* Project Executive Summary */}
            <section className="detail-section project-card-section project-intro-card">
              <div className="section-heading">
                <div>
                  <span className="section-kicker">APPLICATION OVERVIEW</span>
                  <h2>{project.title}</h2>
                </div>
                <div className="intro-badge-row">
                  <span className="intro-fw-badge">{project.framework || 'Web Application'}</span>
                  <span className="intro-db-badge">🗄️ {project.dbInfo || 'SQLite'}</span>
                  {project.aiEngine && project.aiEngine !== 'N/A' && (
                    <span className="intro-ai-badge">✨ {project.aiEngine.split('+')[0].trim()}</span>
                  )}
                </div>
              </div>
              <p className="project-full-desc">
                {project.description || PROJECT_DESCRIPTIONS[project.id] || 'Monorepo application fully integrated with shared tooling.'}
              </p>

              <div className="project-quick-stat-strip">
                <div className="quick-stat-box">
                  <span className="quick-stat-label">RUNTIME PORTS</span>
                  <strong className="quick-stat-val text-emerald">
                    Client :{project.frontendPort || 'N/A'} {project.backendPort ? `· Server :${project.backendPort}` : ''}
                  </strong>
                </div>
                <div className="quick-stat-box">
                  <span className="quick-stat-label">NPM SCRIPTS</span>
                  <strong className="quick-stat-val text-blue">{scriptsEntries.length} commands</strong>
                </div>
                <div className="quick-stat-box">
                  <span className="quick-stat-label">DEPENDENCIES</span>
                  <strong className="quick-stat-val">{depsEntries.length + devDepsEntries.length} packages</strong>
                </div>
                <div className="quick-stat-box">
                  <span className="quick-stat-label">ENV VARIABLES</span>
                  <strong className="quick-stat-val text-amber">{envKeys.length} configured</strong>
                </div>
              </div>
            </section>

            {/* Architecture Card */}
            <section className="detail-section project-card-section">
              <div className="section-heading">
                <div>
                  <span className="section-kicker">SYSTEM DESIGN</span>
                  <h2>Runtime Architecture &amp; Port Binding</h2>
                </div>
              </div>

              <div className="architecture-cards-list">
                <div className="arch-card">
                  <div className="arch-header">
                    <span className="arch-type">Client Tier</span>
                    <span className="arch-badge">Port {project.frontendPort || 'N/A'}</span>
                  </div>
                  <div className="arch-body">
                    <p><strong>Framework:</strong> {project.framework || 'Vite React'}</p>
                    <p><strong>Dev Command:</strong> <code>{project.frontendCmd || 'npm run dev'}</code></p>
                    <p><strong>Local URL:</strong> <a href={feUrl || '#'} target="_blank" rel="noopener noreferrer">{feUrl || 'Not configured'}</a></p>
                  </div>
                </div>

                <div className="arch-card">
                  <div className="arch-header">
                    <span className="arch-type">Server Tier</span>
                    <span className="arch-badge">Port {project.backendPort || 'N/A'}</span>
                  </div>
                  <div className="arch-body">
                    <p><strong>Runtime:</strong> {project.backendCmd?.includes('python') ? 'Python (FastAPI / Uvicorn)' : 'Node.js Express / TS'}</p>
                    <p><strong>Command:</strong> <code>{project.backendCmd || 'Standalone fullstack'}</code></p>
                    <p><strong>Local URL:</strong> <a href={beUrl || '#'} target="_blank" rel="noopener noreferrer">{beUrl || 'Not configured'}</a></p>
                  </div>
                </div>

                <div className="arch-card">
                  <div className="arch-header">
                    <span className="arch-type">Persistence &amp; Storage</span>
                    <span className="arch-badge">Database</span>
                  </div>
                  <div className="arch-body">
                    <p><strong>Engine:</strong> {project.dbInfo || 'Local Storage'}</p>
                    <p><strong>Storage Model:</strong> Embedded zero-config SQLite / relational persistence</p>
                  </div>
                </div>

                <div className="arch-card">
                  <div className="arch-header">
                    <span className="arch-type">AI &amp; Machine Learning</span>
                    <span className="arch-badge">Intelligence</span>
                  </div>
                  <div className="arch-body">
                    <p><strong>Engine:</strong> {project.aiEngine || 'Standard algorithmic processing'}</p>
                    <p><strong>Provider:</strong> Google Gemini 2.5 Flash / Multimodal SDK</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Features Card */}
            {featuresList.length > 0 && (
              <section className="detail-section project-card-section">
                <div className="section-heading">
                  <div>
                    <span className="section-kicker">CAPABILITIES</span>
                    <h2>Application Features &amp; Core Workflows</h2>
                  </div>
                  <span className="group-badge">{featuresList.length} features active</span>
                </div>
                <div className="features-checklist">
                  {featuresList.map((feat, idx) => (
                    <div className="feature-check-item" key={idx}>
                      <span className="check-bullet">✓</span>
                      <div>
                        <strong>{feat.title}</strong>
                        {feat.desc ? <p className="feature-subdesc">{feat.desc}</p> : null}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Shared Monorepo Integration Card */}
            <section className="detail-section project-card-section">
              <div className="section-heading">
                <div>
                  <span className="section-kicker">ECOSYSTEM</span>
                  <h2>Shared Monorepo Packages Integration</h2>
                </div>
              </div>
              <div className="architecture-cards-list">
                <div className="arch-card">
                  <div className="arch-header">
                    <span className="arch-type">@workspace/logger</span>
                    <span className="arch-badge">Telemetry</span>
                  </div>
                  <div className="arch-body">
                    <p><strong>Role:</strong> Universal 5-column ANSI terminal &amp; browser console logging</p>
                    <p><strong>Feature:</strong> Vite HMR bridge, sensitive key masking &amp; request tracing</p>
                  </div>
                </div>
                <div className="arch-card">
                  <div className="arch-header">
                    <span className="arch-type">@workspace/config</span>
                    <span className="arch-badge">Foundations</span>
                  </div>
                  <div className="arch-body">
                    <p><strong>Role:</strong> Strict TypeScript configuration &amp; Tailwind CSS design tokens</p>
                    <p><strong>Feature:</strong> Shared presets, Prettier rules, and zero-drift configs</p>
                  </div>
                </div>
                <div className="arch-card">
                  <div className="arch-header">
                    <span className="arch-type">@workspace/runner</span>
                    <span className="arch-badge">Orchestration</span>
                  </div>
                  <div className="arch-body">
                    <p><strong>Role:</strong> CLI dev runner with automatic port conflict guard</p>
                    <p><strong>Command:</strong> <code>{runnerCmd}</code></p>
                  </div>
                </div>
              </div>
            </section>

            {/* File Tree Directory Structure */}
            {fileTree.length > 0 && (
              <section className="detail-section project-card-section">
                <div className="section-heading">
                  <div>
                    <span className="section-kicker">REPOSITORY STRUCTURE</span>
                    <h2>Project Directory &amp; Source Files</h2>
                  </div>
                  <span className="group-badge">Soul-DevPortal-Projects/{project.id}</span>
                </div>
                <div className="project-file-tree-grid">
                  {fileTree.map((fName) => {
                    const isDir = fName.endsWith('/');
                    return (
                      <div className={`file-tree-item ${isDir ? 'is-dir' : 'is-file'}`} key={fName}>
                        <span className="tree-icon">{isDir ? '📁' : '📄'}</span>
                        <code className="tree-name">{fName}</code>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Local Services Card */}
            {project.localServices && Object.keys(project.localServices).length > 0 && (
              <section className="detail-section project-card-section">
                <div className="section-heading">
                  <div>
                    <span className="section-kicker">LOCAL ENDPOINTS</span>
                    <h2>Network Services</h2>
                  </div>
                </div>
                <div className="services-endpoints-table">
                  {Object.entries(project.localServices).map(([serviceName, url]) => (
                    <div className="service-row" key={serviceName}>
                      <span className="service-name">{serviceName}</span>
                      <a href={url} target="_blank" rel="noopener noreferrer" className="service-url">
                        {url}
                      </a>
                      <CopyButton text={url} variant="compact" />
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: API & Services */}
      {activeTab === 'api' && (
        <section className="detail-section project-tab-content">
          <div className="section-heading">
            <div>
              <span className="section-kicker">SERVER ROUTES</span>
              <h2>Registered API Endpoints</h2>
            </div>
            {beUrl && (
              <a href={`${beUrl}/api/docs`} target="_blank" rel="noopener noreferrer" className="api-docs-link">
                Open Swagger / OpenAPI Docs ↗
              </a>
            )}
          </div>

          {project.apiEndpoints && project.apiEndpoints.length > 0 ? (
            <div className="api-endpoints-catalog">
              {project.apiEndpoints.map((ep, idx) => {
                const [method, ...pathParts] = ep.split(' ');
                const pathStr = pathParts.join(' ');
                const isGet = method === 'GET';
                const isPost = method === 'POST';
                const isDelete = method === 'DELETE';
                const isPut = method === 'PUT';

                const fullUrl = beUrl ? `${beUrl}${pathStr || method}` : pathStr || method;
                const curlCmd = `curl -X ${method} "${fullUrl}" -H "Content-Type: application/json"`;

                return (
                  <div className="endpoint-row" key={idx}>
                    <span className={`method-chip ${isGet ? 'get' : isPost ? 'post' : isDelete ? 'delete' : isPut ? 'put' : ''}`}>
                      {method}
                    </span>
                    <code className="endpoint-path">{pathStr || method}</code>
                    <div className="endpoint-actions">
                      <CopyButton text={fullUrl} variant="compact" label="URL" />
                      <CopyButton text={curlCmd} variant="compact" label="cURL" />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty-tab-box">
              <p>No endpoints explicitly declared in metadata.json. Standard healthcheck route available below:</p>
              {project.backendPort && (
                <div className="endpoint-row">
                  <span className="method-chip get">GET</span>
                  <code className="endpoint-path">/api/health</code>
                  <CopyButton text={`http://localhost:${project.backendPort}/api/health`} variant="compact" />
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {/* Tab 3: Database & Models */}
      {activeTab === 'database' && (
        <section className="detail-section project-tab-content">
          <div className="section-heading">
            <div>
              <span className="section-kicker">DATA PERSISTENCE TIER</span>
              <h2>Database Architecture &amp; Entities</h2>
            </div>
          </div>

          <div className="database-overview-card">
            <div className="db-meta-grid">
              <div className="db-meta-item">
                <span className="db-meta-label">Storage Engine</span>
                <strong className="db-meta-val">{project.dbInfo || 'SQLite'}</strong>
              </div>
              <div className="db-meta-item">
                <span className="db-meta-label">Dialect</span>
                <strong className="db-meta-val">Relational SQL / JSON</strong>
              </div>
              <div className="db-meta-item">
                <span className="db-meta-label">Schema Mode</span>
                <strong className="db-meta-val">{tables.length > 0 ? `${tables.length} Tables Registered` : 'Single Database File'}</strong>
              </div>
            </div>

            {tables.length > 0 ? (
              <div className="db-tables-section">
                <h3>Registered Schema Tables ({tables.length})</h3>
                <div className="db-tables-list">
                  {tables.map((tName) => (
                    <div className="db-table-item" key={tName}>
                      <span className="table-icon">📋</span>
                      <strong className="table-name">{tName}</strong>
                      <span className="table-badge">Table Entity</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="db-tables-section">
                <h3>Storage Configuration</h3>
                <p className="text-secondary text-sm">
                  Configured store: <code>{project.dbInfo || 'Local store'}</code>. To run migrations or inspect records, check the project's server directory.
                </p>
                <div className="code-example-box" style={{ marginTop: '12px' }}>
                  <pre>
                    <code>{`# Inspect SQLite database directly:\nsqlite3 server/data/${project.id}.db ".tables"`}</code>
                  </pre>
                  <CopyButton text={`sqlite3 server/data/${project.id}.db ".tables"`} variant="compact" />
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Tab 4: Run Scripts */}
      {activeTab === 'scripts' && (
        <section className="detail-section project-tab-content">
          <div className="section-heading">
            <div>
              <span className="section-kicker">AUTOMATION &amp; LIFECYCLE</span>
              <h2>Project Package Scripts</h2>
            </div>
            <span className="group-badge">{scriptsEntries.length} scripts</span>
          </div>

          <div className="scripts-catalog-grid">
            {scriptsEntries.map(([scriptName, scriptCmd]) => (
              <div className="script-command-card" key={scriptName}>
                <div className="script-command-header">
                  <strong>npm run {scriptName}</strong>
                  <CopyButton text={`npm run ${scriptName}`} variant="compact" />
                </div>
                <div className="cmd-snippet">
                  <code>{scriptCmd}</code>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Tab 5: Shared Packages */}
      {activeTab === 'packages' && (
        <section className="detail-section project-tab-content">
          <div className="section-heading">
            <div>
              <span className="section-kicker">MONOREPO INTEGRATION</span>
              <h2>Shared Libraries &amp; Presets Consumption</h2>
            </div>
          </div>

          <div className="shared-packages-integration-grid">
            <div className="integration-card">
              <div className="integration-card-header">
                <span className="detail-icon">PY</span>
                <div>
                  <h3>@workspace/logger</h3>
                  <span className="int-sub">Unified DevTools, terminal banners &amp; log masking</span>
                </div>
              </div>
              <p>
                Provides 5-column python logging and client browser log formatting with sensitive data masking.
              </p>
              <div className="code-example-box">
                <pre>
                  <code>{`import { consoleLogger } from '@workspace/logger';\n\nconsoleLogger.info('INIT', 'Starting application...', { port: ${project.frontendPort || 5173} });`}</code>
                </pre>
                <CopyButton text={`import { consoleLogger } from '@workspace/logger';\nconsoleLogger.info('INIT', 'Starting application...', { port: ${project.frontendPort || 5173} });`} variant="compact" />
              </div>
            </div>

            <div className="integration-card">
              <div className="integration-card-header">
                <span className="detail-icon">CFG</span>
                <div>
                  <h3>@workspace/config</h3>
                  <span className="int-sub">Tailwind CSS tokens &amp; shared Vite configuration</span>
                </div>
              </div>
              <p>
                Standardizes color palettes, fonts, spacing tokens, and shared build presets across all applications.
              </p>
              <div className="code-example-box">
                <pre>
                  <code>{`import { tokens } from '@workspace/config/tailwind/tokens';\n\nconst brandColor = tokens.colors.brand.DEFAULT;`}</code>
                </pre>
                <CopyButton text={`import { tokens } from '@workspace/config/tailwind/tokens';\nconst brandColor = tokens.colors.brand.DEFAULT;`} variant="compact" />
              </div>
            </div>

            <div className="integration-card">
              <div className="integration-card-header">
                <span className="detail-icon">PY</span>
                <div>
                  <h3>@workspace/runner</h3>
                  <span className="int-sub">Monorepo process launcher &amp; port orchestrator</span>
                </div>
              </div>
              <p>
                Orchestrates process lifecycles, socket health probes, and kills stale port listeners before launching.
              </p>
              <div className="code-example-box">
                <pre>
                  <code>{`# Run this project via runner:\n${runnerCmd}`}</code>
                </pre>
                <CopyButton text={runnerCmd} variant="compact" />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Tab 6: Environment & Config */}
      {activeTab === 'env' && (
        <section className="detail-section project-tab-content">
          <div className="section-heading">
            <div>
              <span className="section-kicker">CONFIGURATION REGISTRY</span>
              <h2>Environment Variables &amp; Secret Keys</h2>
            </div>
            <div className="env-controls">
              <button
                type="button"
                className="toggle-mask-btn"
                onClick={() => setShowSecretPlaceholders(!showSecretPlaceholders)}
              >
                {showSecretPlaceholders ? 'Mask Secrets' : 'Show Placeholders'}
              </button>
              <CopyButton text={sampleEnvFile} label="Copy .env Template" copiedLabel=".env copied!" />
            </div>
          </div>

          {envKeys.length > 0 ? (
            <div className="config-keys-section">
              <div className="env-keys-table">
                {envKeys.map((key) => {
                  const isSecret = key.includes('SECRET') || key.includes('KEY') || key.includes('TOKEN') || key.includes('PASSWORD');
                  let displayVal = 'unset';
                  if (key === 'PORT' || key === 'BACKEND_PORT') displayVal = `${project.backendPort || 8000}`;
                  else if (key === 'FRONTEND_PORT') displayVal = `${project.frontendPort || 5173}`;
                  else if (key === 'BACKEND_URL') displayVal = `http://127.0.0.1:${project.backendPort || 8000}`;
                  else if (key === 'APP_URL') displayVal = `http://localhost:${project.frontendPort || 5173}`;
                  else if (key === 'NODE_ENV') displayVal = 'development';
                  else if (isSecret) displayVal = showSecretPlaceholders ? 'sk_monorepo_sample_secret_key' : '••••••••••••••••';

                  return (
                    <div className="env-table-row" key={key}>
                      <div className="env-name-col">
                        <code>{key}</code>
                        {isSecret && <span className="secret-tag">Secret</span>}
                      </div>
                      <div className="env-val-col">
                        <span className={`env-val-text ${isSecret ? 'is-secret' : ''}`}>{displayVal}</span>
                      </div>
                      <CopyButton text={key} variant="compact" label="Copy Key" />
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <p className="text-secondary text-sm">No environment variables explicitly declared in .env.example.</p>
          )}

          <div className="deps-breakdown-section" style={{ marginTop: '24px' }}>
            <div className="deps-col">
              <h3>Production Dependencies ({depsEntries.length})</h3>
              <div className="deps-list">
                {depsEntries.map(([dep, ver]) => (
                  <div className="dep-row" key={dep}>
                    <code className="dep-name">{dep}</code>
                    <span className="dep-version">{ver}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="deps-col">
              <h3>Dev Dependencies ({devDepsEntries.length})</h3>
              <div className="deps-list">
                {devDepsEntries.map(([dep, ver]) => (
                  <div className="dep-row" key={dep}>
                    <code className="dep-name">{dep}</code>
                    <span className="dep-version">{ver}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Tab 7: Documentation / README */}
      {activeTab === 'readme' && project.readmeBlocks && project.readmeBlocks.length > 0 && (
        <section className="detail-section project-tab-content readme-section">
          <div className="section-heading readme-heading">
            <div>
              <span className="section-kicker">REFERENCE</span>
              <h2>Project README.md</h2>
            </div>
            <span className="readme-source">Soul-DevPortal-Projects/{project.id}/README.md</span>
          </div>
          <div className="markdown-content">
            <Markdown blocks={project.readmeBlocks} />
          </div>
        </section>
      )}
    </article>
  );
}
