import React, { useState, useMemo } from 'react';
import CopyButton from '../../../components/CopyButton';

export interface ProjectScriptsTabProps {
  scriptsEntries: Array<[string, string]>;
}

export default function ProjectScriptsTab({ scriptsEntries }: ProjectScriptsTabProps) {
  const [filter, setFilter] = useState<string>('');

  const filteredScripts = useMemo(() => {
    const needle = filter.trim().toLowerCase();
    if (!needle) return scriptsEntries;
    return scriptsEntries.filter(
      ([name, cmd]) => name.toLowerCase().includes(needle) || cmd.toLowerCase().includes(needle)
    );
  }, [scriptsEntries, filter]);

  return (
    <section className="detail-section project-scripts-card">
      <div className="section-heading-with-search">
        <div>
          <span className="section-kicker">AUTOMATION &amp; LIFECYCLE</span>
          <h2>Project Package Scripts</h2>
        </div>
        <div className="api-search-box">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter npm scripts..."
            aria-label="Filter npm scripts"
          />
          {filter && (
            <button type="button" className="clear-api-search" onClick={() => setFilter('')} title="Clear filter">
              ✕
            </button>
          )}
        </div>
      </div>

      <div className="reference-group" style={{ margin: 0 }}>
        <div className="reference-group-header">
          <div className="group-header-title">
            <span className="group-header-icon scripts">NPM</span>
            <h3>Executable Commands</h3>
          </div>
          <span className="group-badge">{filteredScripts.length} commands</span>
        </div>

        <div className="scripts-catalog-grid">
          {filteredScripts.map(([scriptName, scriptCmd]) => (
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
      </div>
    </section>
  );
}
