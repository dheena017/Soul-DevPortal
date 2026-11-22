import React, { useState, useMemo } from 'react';
import { consoleLogger } from '@workspace/logger';
import CopyButton from '../../components/CopyButton';
import { WORKSPACE_SCRIPTS_REGISTRY, ScriptDefinition } from './scriptsConstants';

export interface ScriptsViewProps {
  rootScripts?: Record<string, string>;
  onNavigate: (viewId: string) => void;
}

export default function ScriptsView({ rootScripts = {}, onNavigate }: ScriptsViewProps) {
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [activeRuntime, setActiveRuntime] = useState<string>('npm');
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) => {
    setExpandedCards((prev) => {
      const isNowExpanded = !prev[id];
      consoleLogger.action('SCRIPTS', `${isNowExpanded ? 'Inspecting' : 'Collapsed'} command drawer: ${id}`);
      return { ...prev, [id]: isNowExpanded };
    });
  };

  const categories = [
    { id: 'all', label: 'All Commands', count: WORKSPACE_SCRIPTS_REGISTRY.length },
    { id: 'orchestration', label: 'Orchestration', count: WORKSPACE_SCRIPTS_REGISTRY.filter((s) => s.category === 'orchestration').length },
    { id: 'apps', label: 'Applications (8)', count: WORKSPACE_SCRIPTS_REGISTRY.filter((s) => s.category === 'apps').length },
    { id: 'portal', label: 'Developer Portal', count: WORKSPACE_SCRIPTS_REGISTRY.filter((s) => s.category === 'portal').length },
    { id: 'pipeline', label: 'Build & Quality', count: WORKSPACE_SCRIPTS_REGISTRY.filter((s) => s.category === 'pipeline').length },
    { id: 'setup', label: 'Dependencies', count: WORKSPACE_SCRIPTS_REGISTRY.filter((s) => s.category === 'setup').length },
  ];

  const filteredScripts = useMemo(() => {
    return WORKSPACE_SCRIPTS_REGISTRY.filter((s) => {
      const matchesCategory = filterCategory === 'all' || s.category === filterCategory;
      const query = searchQuery.trim().toLowerCase();
      const matchesQuery =
        !query ||
        s.name.toLowerCase().includes(query) ||
        s.command.toLowerCase().includes(query) ||
        s.description.toLowerCase().includes(query) ||
        s.id.toLowerCase().includes(query) ||
        (s.ports && s.ports.toLowerCase().includes(query));
      return matchesCategory && matchesQuery;
    });
  }, [filterCategory, searchQuery]);

  const formatCommand = (script: ScriptDefinition) => {
    if (activeRuntime === 'pnpm') {
      return script.name.replace(/^npm run /, 'pnpm ');
    } else if (activeRuntime === 'yarn') {
      return script.name.replace(/^npm run /, 'yarn ');
    } else if (activeRuntime === 'bun') {
      return script.name.replace(/^npm run /, 'bun run ');
    }
    return script.name;
  };

  return (
    <div className="scripts-view">
      {/* ── Breadcrumb & Title Bar ── */}
      <div className="docs-hub-header">
        <div className="docs-hub-title-row">
          <div className="breadcrumb">
            <button type="button" className="breadcrumb-link-btn" onClick={() => onNavigate('overview')}>
              Soul Workspace
            </button>
            <span className="crumb-sep">/</span>
            <strong className="crumb-active">Scripts &amp; Automation Runners</strong>
          </div>
          <div className="scripts-header-actions">
            <CopyButton
              text="python Soul-DevPortal-Packages/runner/bin/run-all.py --kill-port"
              label="Copy Supervise Command"
              variant="compact"
            />
          </div>
        </div>
        <h1 className="docs-hub-heading">Workspace Commands &amp; Automation</h1>
        <p className="docs-hub-subtitle">
          Canonical process orchestration, individual application runners, and monorepo automation scripts. Zero duplicate aliases.
        </p>
      </div>

      {/* ── KPI Metric Cards Ribbon ── */}
      <div className="scripts-kpi-ribbon">
        <div className="kpi-card">
          <span className="kpi-num">19</span>
          <span className="kpi-lbl">Canonical Commands</span>
          <span className="kpi-sub">0 redundant aliases</span>
        </div>
        <div className="kpi-card">
          <span className="kpi-num">8</span>
          <span className="kpi-lbl">Target Applications</span>
          <span className="kpi-sub">Dual frontend &amp; backend</span>
        </div>
        <div className="kpi-card">
          <span className="kpi-num">4</span>
          <span className="kpi-lbl">Core Orchestrators</span>
          <span className="kpi-sub">All / Client / Server / Project</span>
        </div>
        <div className="kpi-card">
          <span className="kpi-num">100%</span>
          <span className="kpi-lbl">Port Protected</span>
          <span className="kpi-sub">Automated --kill-port</span>
        </div>
      </div>

      {/* ── Filter Toolbar ── */}
      <div className="scripts-toolbar">
        <div className="scripts-search-container">
          <div className="scripts-search-box">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search scripts, flags, ports (:5173, :8000)..."
              aria-label="Filter command scripts"
            />
            {searchQuery && (
              <button type="button" className="clear-search-btn" onClick={() => setSearchQuery('')} aria-label="Clear script filter">
                ✕
              </button>
            )}
          </div>
        </div>

        <div className="view-mode-toggles">
          <button
            type="button"
            className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => {
              consoleLogger.action('SCRIPTS', 'Switched view mode to Deck Grid');
              setViewMode('grid');
            }}
          >
            Deck View
          </button>
          <button
            type="button"
            className={`view-toggle-btn ${viewMode === 'table' ? 'active' : ''}`}
            onClick={() => {
              consoleLogger.action('SCRIPTS', 'Switched view mode to Dense Table');
              setViewMode('table');
            }}
          >
            Table View
          </button>
        </div>
      </div>

      {/* ── Category Filter Pills ── */}
      <div className="scripts-filter-pills-row">
        <div className="category-pills" role="tablist" aria-label="Filter scripts by category">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              role="tab"
              aria-selected={filterCategory === cat.id}
              className={`filter-pill ${filterCategory === cat.id ? 'active' : ''}`}
              onClick={() => setFilterCategory(cat.id)}
            >
              <span>{cat.label}</span>
              <span className="pill-badge">{cat.count}</span>
            </button>
          ))}
        </div>

        <div className="runtime-selector">
          <span>Package Manager:</span>
          <select
            value={activeRuntime}
            onChange={(e) => setActiveRuntime(e.target.value)}
            className="runtime-select"
            aria-label="Select package manager runtime"
          >
            <option value="npm">npm</option>
            <option value="pnpm">pnpm</option>
            <option value="yarn">yarn</option>
            <option value="bun">bun</option>
          </select>
        </div>
      </div>

      {/* ── Command Deck Cards Grid ── */}
      {viewMode === 'grid' ? (
        <div className="scripts-deck-grid">
          {filteredScripts.map((script) => {
            const formattedRunCmd = formatCommand(script);
            const isExpanded = Boolean(expandedCards[script.id]);

            return (
              <div key={script.id} className="script-deck-card">
                <div className="card-top-bar">
                  <div className="card-badge-row">
                    <span className="script-title-code">{formattedRunCmd}</span>
                    <span className={`script-category-badge ${script.badgeClass}`}>{script.badge}</span>
                  </div>
                  <CopyButton text={formattedRunCmd} variant="compact" />
                </div>

                <p className="script-card-desc">{script.description}</p>

                {script.ports && (
                  <div className="script-meta-tags">
                    <span className="meta-tag">🔌 {script.ports}</span>
                    <span className="meta-tag">🛡️ Auto-Kill Enabled</span>
                  </div>
                )}

                <div className="terminal-run-preview">
                  <code>
                    <span className="prompt-sym">$</span> {script.command}
                  </code>
                  <CopyButton text={script.command} variant="compact" />
                </div>

                <button
                  type="button"
                  className="card-expand-toggle"
                  onClick={() => toggleExpand(script.id)}
                  aria-expanded={isExpanded}
                >
                  {isExpanded ? 'Hide implementation details ▴' : 'Inspect execution details ▾'}
                </button>

                {isExpanded && (
                  <div className="card-expanded-drawer">
                    <div className="drawer-row">
                      <span className="drawer-lbl">Raw Script:</span>
                      <code className="drawer-val">{rootScripts[script.id] || script.command}</code>
                    </div>
                    <div className="drawer-row">
                      <span className="drawer-lbl">Target:</span>
                      <span className="drawer-val">{script.category.toUpperCase()} Ecosystem</span>
                    </div>
                    <div className="drawer-row">
                      <span className="drawer-lbl">Clean Port:</span>
                      <span className="drawer-val">Automatic socket detachment &amp; port reaping</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* ── Dense Table View ── */
        <div className="scripts-dense-table-wrap">
          <table className="scripts-dense-table">
            <thead>
              <tr>
                <th>Command</th>
                <th>Category</th>
                <th>Allocated Ports</th>
                <th>Description</th>
                <th>Execution String</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredScripts.map((script) => (
                <tr key={script.id}>
                  <td>
                    <code>{formatCommand(script)}</code>
                  </td>
                  <td>
                    <span className={`script-category-badge ${script.badgeClass}`}>{script.category}</span>
                  </td>
                  <td>
                    <span className="script-port-col">{script.ports || '—'}</span>
                  </td>
                  <td>{script.description}</td>
                  <td>
                    <code className="script-raw-exec">{script.command}</code>
                  </td>
                  <td>
                    <CopyButton text={formatCommand(script)} variant="compact" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
