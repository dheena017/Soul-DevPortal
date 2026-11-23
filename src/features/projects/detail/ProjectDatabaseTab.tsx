import React, { useState, useMemo } from 'react';
import CopyButton from '../../../components/CopyButton';
import { ProjectData } from '../../../types';

export interface ProjectDatabaseTabProps {
  project: ProjectData;
  tables: string[];
}

export default function ProjectDatabaseTab({ project, tables }: ProjectDatabaseTabProps) {
  const [filter, setFilter] = useState<string>('');

  const filteredTables = useMemo(() => {
    const needle = filter.trim().toLowerCase();
    if (!needle) return tables;
    return tables.filter((t) => t.toLowerCase().includes(needle));
  }, [tables, filter]);

  return (
    <section className="detail-section project-database-card">
      <div className="section-heading-with-search">
        <div>
          <span className="section-kicker">DATA PERSISTENCE TIER</span>
          <h2>Database Architecture &amp; Entities</h2>
        </div>
        {tables.length > 0 && (
          <div className="api-search-box">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter schema tables..."
              aria-label="Filter schema tables"
            />
            {filter && (
              <button type="button" className="clear-api-search" onClick={() => setFilter('')} title="Clear filter">
                ✕
              </button>
            )}
          </div>
        )}
      </div>

      <div className="database-overview-card" style={{ margin: 0 }}>
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
            <strong className="db-meta-val">
              {tables.length > 0 ? `${tables.length} Tables Registered` : 'Single Database File'}
            </strong>
          </div>
        </div>

        {filteredTables.length > 0 ? (
          <div className="reference-group" style={{ margin: '20px 0 0 0' }}>
            <div className="reference-group-header">
              <div className="group-header-title">
                <span className="group-header-icon npm">📋</span>
                <h3>Registered Schema Tables</h3>
              </div>
              <span className="group-badge">{filteredTables.length} tables</span>
            </div>
            <div className="db-tables-list">
              {filteredTables.map((tName) => (
                <div className="db-table-item" key={tName}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="table-icon">📋</span>
                    <strong className="table-name">{tName}</strong>
                    <span className="table-badge">Table Entity</span>
                  </div>
                  <CopyButton text={tName} variant="compact" label="Copy" />
                </div>
              ))}
            </div>
          </div>
        ) : tables.length > 0 ? (
          <div className="empty-tab-box">
            <p>No tables match your search filter.</p>
          </div>
        ) : (
          <div className="reference-group" style={{ margin: '20px 0 0 0' }}>
            <div className="reference-group-header">
              <div className="group-header-title">
                <span className="group-header-icon py">⚙️</span>
                <h3>Storage Configuration</h3>
              </div>
            </div>
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
  );
}
