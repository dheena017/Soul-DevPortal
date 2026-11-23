import React, { useState, useMemo } from 'react';
import CopyButton from '../../../components/CopyButton';
import { ProjectData } from '../../../types';

export interface ProjectApiTabProps {
  project: ProjectData;
  beUrl: string | null;
}

export default function ProjectApiTab({ project, beUrl }: ProjectApiTabProps) {
  const [filter, setFilter] = useState<string>('');
  const endpoints = project.apiEndpoints || [];

  const filteredEndpoints = useMemo(() => {
    const needle = filter.trim().toLowerCase();
    if (!needle) return endpoints;
    return endpoints.filter((ep) => ep.toLowerCase().includes(needle));
  }, [endpoints, filter]);

  return (
    <section className="detail-section project-reference-card">
      <div className="section-heading-with-search">
        <div>
          <span className="section-kicker">PROJECT API</span>
          <h2>Registered API Endpoints</h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div className="api-search-box">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter endpoint routes..."
              aria-label="Filter endpoint routes"
            />
            {filter && (
              <button type="button" className="clear-api-search" onClick={() => setFilter('')} title="Clear filter">
                ✕
              </button>
            )}
          </div>
          {beUrl && (
            <a href={`${beUrl}/api/docs`} target="_blank" rel="noopener noreferrer" className="api-docs-link">
              Swagger OpenAPI ↗
            </a>
          )}
        </div>
      </div>

      {filteredEndpoints.length > 0 ? (
        <div className="reference-group" style={{ margin: 0 }}>
          <div className="reference-group-header">
            <div className="group-header-title">
              <span className="group-header-icon npm">API</span>
              <h3>HTTP REST Endpoints</h3>
            </div>
            <span className="group-badge">{filteredEndpoints.length} routes</span>
          </div>

          <div className="api-endpoints-catalog">
            {filteredEndpoints.map((ep, idx) => {
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
        </div>
      ) : (
        <div className="empty-tab-box">
          <p>
            {filter ? 'No endpoints match your search filter.' : 'No endpoints explicitly declared in metadata.json. Standard healthcheck route available below:'}
          </p>
          {project.backendPort && (
            <div className="endpoint-row" style={{ marginTop: '12px' }}>
              <span className="method-chip get">GET</span>
              <code className="endpoint-path">/api/health</code>
              <CopyButton text={`http://localhost:${project.backendPort}/api/health`} variant="compact" />
            </div>
          )}
        </div>
      )}
    </section>
  );
}
