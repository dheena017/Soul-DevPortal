import React, { useState, useMemo } from 'react';
import CopyButton from '../../../components/CopyButton';
import { ProjectData } from '../../../types';

export interface ProjectEnvTabProps {
  project: ProjectData;
  envKeys: string[];
  sampleEnvFile: string;
  showSecretPlaceholders: boolean;
  onToggleSecretPlaceholders: () => void;
  depsEntries: Array<[string, string]>;
  devDepsEntries: Array<[string, string]>;
}

export default function ProjectEnvTab({
  project,
  envKeys,
  sampleEnvFile,
  showSecretPlaceholders,
  onToggleSecretPlaceholders,
  depsEntries,
  devDepsEntries,
}: ProjectEnvTabProps) {
  const [filter, setFilter] = useState<string>('');

  const filteredKeys = useMemo(() => {
    const needle = filter.trim().toLowerCase();
    if (!needle) return envKeys;
    return envKeys.filter((k) => k.toLowerCase().includes(needle));
  }, [envKeys, filter]);

  return (
    <section className="detail-section project-env-card">
      <div className="section-heading-with-search">
        <div>
          <span className="section-kicker">CONFIGURATION REGISTRY</span>
          <h2>Environment Variables &amp; Secret Keys</h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {envKeys.length > 0 && (
            <div className="api-search-box">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Filter env variables..."
                aria-label="Filter env variables"
              />
              {filter && (
                <button type="button" className="clear-api-search" onClick={() => setFilter('')} title="Clear filter">
                  ✕
                </button>
              )}
            </div>
          )}
          <button
            type="button"
            className="toggle-mask-btn"
            onClick={onToggleSecretPlaceholders}
          >
            {showSecretPlaceholders ? 'Mask Secrets' : 'Show Placeholders'}
          </button>
          <CopyButton text={sampleEnvFile} label="Copy .env Template" copiedLabel=".env copied!" />
        </div>
      </div>

      {envKeys.length > 0 ? (
        <div className="config-keys-card" style={{ margin: 0 }}>
          <div className="config-card-header">
            <div className="config-card-title-group">
              <span className="config-card-icon">⚡</span>
              <span className="config-card-title">Declared Configuration Keys</span>
              <span className="config-badge config-badge-total">{filteredKeys.length} Variables</span>
              {envKeys.some(k => k.includes('SECRET') || k.includes('KEY') || k.includes('TOKEN') || k.includes('PASSWORD')) && (
                <span className="config-badge config-badge-secret">
                  {envKeys.filter(k => k.includes('SECRET') || k.includes('KEY') || k.includes('TOKEN') || k.includes('PASSWORD')).length} Secrets
                </span>
              )}
            </div>
            <div className="config-card-meta">
              <span className="config-card-hint">Values auto-resolved from port allocations &amp; default templates</span>
            </div>
          </div>

          <div className="config-card-body">
            <div className="env-keys-table">
              {filteredKeys.map((key) => {
                const isSecret = key.includes('SECRET') || key.includes('KEY') || key.includes('TOKEN') || key.includes('PASSWORD');
                let displayVal = 'unset';
                let isSet = false;

                if (key === 'PORT' || key === 'BACKEND_PORT') {
                  displayVal = `${project.backendPort || 8000}`;
                  isSet = true;
                } else if (key === 'FRONTEND_PORT') {
                  displayVal = `${project.frontendPort || 5173}`;
                  isSet = true;
                } else if (key === 'BACKEND_URL') {
                  displayVal = `http://127.0.0.1:${project.backendPort || 8000}`;
                  isSet = true;
                } else if (key === 'APP_URL') {
                  displayVal = `http://localhost:${project.frontendPort || 5173}`;
                  isSet = true;
                } else if (key === 'NODE_ENV') {
                  displayVal = 'development';
                  isSet = true;
                } else if (isSecret) {
                  displayVal = showSecretPlaceholders ? 'sk_monorepo_sample_secret_key' : '••••••••••••••••';
                  isSet = showSecretPlaceholders;
                }

                return (
                  <div className="env-table-row" key={key}>
                    <div className="env-name-col">
                      <span className="env-icon-glyph">{isSecret ? '🔒' : '⚙️'}</span>
                      <code>{key}</code>
                      {isSecret && <span className="secret-tag">Secret</span>}
                    </div>
                    <div className="env-val-col">
                      {displayVal === 'unset' ? (
                        <span className="env-val-text is-unset">
                          <span className="unset-indicator" />
                          unset
                        </span>
                      ) : isSecret && !showSecretPlaceholders ? (
                        <span className="env-val-text is-secret-masked">{displayVal}</span>
                      ) : (
                        <span className={`env-val-text ${isSet ? 'is-set' : ''}`}>{displayVal}</span>
                      )}
                    </div>
                    <CopyButton text={key} variant="compact" label="Copy Key" />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <p className="text-secondary text-sm">No environment variables explicitly declared in .env.example.</p>
      )}

      <div className="deps-breakdown-section" style={{ marginTop: '20px' }}>
        <div className="deps-col">
          <div className="deps-col-header">
            <div className="deps-col-title-group">
              <span className="deps-col-icon">📦</span>
              <h3>Production Dependencies</h3>
            </div>
            <span className="dep-count-badge">{depsEntries.length}</span>
          </div>
          <div className="deps-list">
            {depsEntries.length > 0 ? (
              depsEntries.map(([dep, ver]) => (
                <div className="dep-row" key={dep}>
                  <code className="dep-name">{dep}</code>
                  <span className="dep-version">{ver}</span>
                </div>
              ))
            ) : (
              <div className="deps-empty-state">No production dependencies listed</div>
            )}
          </div>
        </div>

        <div className="deps-col">
          <div className="deps-col-header">
            <div className="deps-col-title-group">
              <span className="deps-col-icon">🛠️</span>
              <h3>Dev Dependencies</h3>
            </div>
            <span className="dep-count-badge">{devDepsEntries.length}</span>
          </div>
          <div className="deps-list">
            {devDepsEntries.length > 0 ? (
              devDepsEntries.map(([dep, ver]) => (
                <div className="dep-row" key={dep}>
                  <code className="dep-name">{dep}</code>
                  <span className="dep-version">{ver}</span>
                </div>
              ))
            ) : (
              <div className="deps-empty-state">No dev dependencies listed</div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
