import React from 'react';
import CopyButton from '../../../components/CopyButton';
import ProjectFileExplorer from '../ProjectFileExplorer';
import { ProjectData } from '../../../types';
import { PROJECT_DESCRIPTIONS } from '../projectsConstants';

export interface ProjectOverviewTabProps {
  project: ProjectData;
  featuresList: Array<{ title: string; desc: string }>;
  scriptsCount: number;
  totalDepsCount: number;
  envCount: number;
  runnerCmd: string;
  feUrl: string | null;
  beUrl: string | null;
  fileTree: string[];
}

export default function ProjectOverviewTab({
  project,
  featuresList,
  scriptsCount,
  totalDepsCount,
  envCount,
  runnerCmd,
  feUrl,
  beUrl,
  fileTree,
}: ProjectOverviewTabProps) {
  return (
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
              <strong className="quick-stat-val text-blue">{scriptsCount} commands</strong>
            </div>
            <div className="quick-stat-box">
              <span className="quick-stat-label">DEPENDENCIES</span>
              <strong className="quick-stat-val">{totalDepsCount} packages</strong>
            </div>
            <div className="quick-stat-box">
              <span className="quick-stat-label">ENV VARIABLES</span>
              <strong className="quick-stat-val text-amber">{envCount} configured</strong>
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

        {/* Interactive Repository File Explorer */}
        {fileTree.length > 0 && (
          <ProjectFileExplorer fileTree={fileTree} projectId={project.id} />
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
  );
}
