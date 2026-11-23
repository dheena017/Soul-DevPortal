import React, { useState, useMemo, useRef, useEffect } from 'react';
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
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut: '/' focuses search, 'Escape' clears
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === '/' &&
        document.activeElement !== searchInputRef.current &&
        !['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName || '')
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === 'Escape' && document.activeElement === searchInputRef.current) {
        if (searchQuery) {
          setSearchQuery('');
        } else {
          searchInputRef.current?.blur();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchQuery]);

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
    <div
      className="scripts-view"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        width: '100%',
      }}
    >
      {/* ── Modern Hero Header ── */}
      <header
        className="detail-header pillar-hero-header"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          background: '#111111',
          border: '1px solid #222222',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
        }}
      >
        {/* Breadcrumb & Top Actions Row */}
        <div
          className="breadcrumb-nav-row"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div
            className="breadcrumb"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '12.5px',
              color: '#71717a',
            }}
          >
            <button
              type="button"
              className="project-back-pill-btn"
              onClick={() => onNavigate('overview')}
              title="Return to Overview"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '4px 10px',
                borderRadius: '6px',
                background: '#1a1a1a',
                border: '1px solid #2e2e2e',
                color: '#e2e8f0',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <span className="back-arrow">←</span>
              <span>Back</span>
            </button>
            <span>Soul Workspace</span>
            <span className="crumb-sep" style={{ color: '#4b5563' }}>/</span>
            <strong className="crumb-active" style={{ color: '#f1f5f9', fontWeight: 600 }}>
              Scripts &amp; Automation Runners
            </strong>
          </div>

          <div
            className="scripts-header-actions"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <div
              className="header-status-pill"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '5px 12px',
                borderRadius: '9999px',
                background: 'rgba(34, 197, 94, 0.1)',
                border: '1px solid rgba(34, 197, 94, 0.25)',
                color: '#4ade80',
                fontSize: '12px',
                fontWeight: 600,
              }}
            >
              <span
                className="status-live-dot"
                aria-hidden="true"
                style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  background: '#22c55e',
                  boxShadow: '0 0 8px rgba(34, 197, 94, 0.8)',
                }}
              />
              <span>19 Canonical Commands Active</span>
            </div>

            <CopyButton
              text="python Soul-DevPortal-Packages/runner/bin/run-all.py --kill-port"
              label="Copy Supervise Command"
              variant="compact"
            />
          </div>
        </div>

        {/* Title & Subtitle */}
        <div className="detail-title-row" style={{ margin: 0 }}>
          <div className="package-title-copy">
            <div
              className="title-with-badge"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                flexWrap: 'wrap',
              }}
            >
              <h1
                style={{
                  margin: 0,
                  fontSize: '22px',
                  fontWeight: 800,
                  letterSpacing: '-0.02em',
                  color: '#ffffff',
                  textTransform: 'uppercase',
                }}
              >
                Workspace Commands &amp; Automation
              </h1>
              <span
                className="monorepo-tag-pill"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '3px 9px',
                  borderRadius: '6px',
                  background: 'rgba(59, 130, 246, 0.15)',
                  border: '1px solid rgba(59, 130, 246, 0.35)',
                  color: '#60a5fa',
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                }}
              >
                CLI Supervisor
              </span>
            </div>
            <p
              className="detail-description"
              style={{
                margin: '8px 0 0 0',
                fontSize: '13.5px',
                color: '#94a3b8',
                lineHeight: 1.5,
              }}
            >
              Canonical process orchestration, individual application runners, and monorepo automation scripts. Zero duplicate aliases.
            </p>
          </div>
        </div>

        {/* ── KPI Metric Cards Ribbon (4 Balanced Sleek Cards) ── */}
        <div
          className="scripts-kpi-ribbon"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '12px',
          }}
        >
          <div
            className="kpi-card"
            style={{
              padding: '12px 16px',
              borderRadius: '8px',
              background: '#161616',
              border: '1px solid #262626',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}
          >
            <span style={{ fontSize: '20px', fontWeight: 800, color: '#38bdf8', lineHeight: 1 }}>
              19
            </span>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#cbd5e1' }}>
              Canonical Commands
            </span>
            <span style={{ fontSize: '11px', color: '#64748b' }}>
              0 redundant aliases
            </span>
          </div>

          <div
            className="kpi-card"
            style={{
              padding: '12px 16px',
              borderRadius: '8px',
              background: '#161616',
              border: '1px solid #262626',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}
          >
            <span style={{ fontSize: '20px', fontWeight: 800, color: '#34d399', lineHeight: 1 }}>
              8
            </span>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#cbd5e1' }}>
              Target Applications
            </span>
            <span style={{ fontSize: '11px', color: '#64748b' }}>
              Dual frontend &amp; backend
            </span>
          </div>

          <div
            className="kpi-card"
            style={{
              padding: '12px 16px',
              borderRadius: '8px',
              background: '#161616',
              border: '1px solid #262626',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}
          >
            <span style={{ fontSize: '20px', fontWeight: 800, color: '#c084fc', lineHeight: 1 }}>
              4
            </span>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#cbd5e1' }}>
              Core Orchestrators
            </span>
            <span style={{ fontSize: '11px', color: '#64748b' }}>
              All / Client / Server / Project
            </span>
          </div>

          <div
            className="kpi-card"
            style={{
              padding: '12px 16px',
              borderRadius: '8px',
              background: '#161616',
              border: '1px solid #262626',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}
          >
            <span style={{ fontSize: '20px', fontWeight: 800, color: '#fbbf24', lineHeight: 1 }}>
              100%
            </span>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#cbd5e1' }}>
              Port Protected
            </span>
            <span style={{ fontSize: '11px', color: '#64748b' }}>
              Automated --kill-port
            </span>
          </div>
        </div>
      </header>

      {/* ── Search & View Mode Toolbar ── */}
      <div
        className="scripts-toolbar"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          flexWrap: 'wrap',
          background: '#111111',
          border: '1px solid #222222',
          borderRadius: '10px',
          padding: '12px 16px',
        }}
      >
        {/* Search Box */}
        <div
          className="scripts-search-container"
          style={{
            flex: 1,
            minWidth: '260px',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
            style={{
              position: 'absolute',
              left: '12px',
              color: '#6b7280',
              pointerEvents: 'none',
            }}
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>

          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search scripts, flags, ports (:5173, :8000)... (Press '/' to focus)"
            aria-label="Filter command scripts"
            style={{
              width: '100%',
              height: '38px',
              paddingLeft: '38px',
              paddingRight: searchQuery ? '36px' : '44px',
              borderRadius: '7px',
              background: '#0d0d0d',
              border: '1px solid #262626',
              color: '#f3f4f6',
              fontSize: '13px',
              outline: 'none',
            }}
          />

          {searchQuery ? (
            <button
              type="button"
              className="clear-search-btn"
              onClick={() => setSearchQuery('')}
              aria-label="Clear script filter"
              style={{
                position: 'absolute',
                right: '10px',
                background: 'transparent',
                border: 'none',
                color: '#9ca3af',
                cursor: 'pointer',
                fontSize: '13px',
                padding: '4px',
              }}
            >
              ✕
            </button>
          ) : (
            <kbd
              style={{
                position: 'absolute',
                right: '10px',
                fontSize: '11px',
                color: '#6b7280',
                background: '#1c1c1c',
                border: '1px solid #333',
                borderRadius: '4px',
                padding: '1px 5px',
                pointerEvents: 'none',
              }}
            >
              /
            </kbd>
          )}
        </div>

        {/* View Mode Segmented Controls */}
        <div
          className="view-mode-toggles"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            background: '#0d0d0d',
            padding: '3px',
            borderRadius: '7px',
            border: '1px solid #262626',
          }}
        >
          <button
            type="button"
            className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => {
              consoleLogger.action('SCRIPTS', 'Switched view mode to Deck Grid');
              setViewMode('grid');
            }}
            style={{
              background: viewMode === 'grid' ? '#1f2937' : 'transparent',
              border: viewMode === 'grid' ? '1px solid #374151' : '1px solid transparent',
              color: viewMode === 'grid' ? '#ffffff' : '#9ca3af',
              fontSize: '12px',
              fontWeight: 600,
              padding: '5px 12px',
              borderRadius: '5px',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
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
            style={{
              background: viewMode === 'table' ? '#1f2937' : 'transparent',
              border: viewMode === 'table' ? '1px solid #374151' : '1px solid transparent',
              color: viewMode === 'table' ? '#ffffff' : '#9ca3af',
              fontSize: '12px',
              fontWeight: 600,
              padding: '5px 12px',
              borderRadius: '5px',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            Table View
          </button>
        </div>
      </div>

      {/* ── Category Filter Pills & Runtime Selector Row ── */}
      <div
        className="scripts-filter-pills-row"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          flexWrap: 'wrap',
        }}
      >
        <div
          className="category-pills"
          role="tablist"
          aria-label="Filter scripts by category"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flexWrap: 'wrap',
          }}
        >
          {categories.map((cat) => {
            const isActive = filterCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                className={`filter-pill ${isActive ? 'active' : ''}`}
                onClick={() => setFilterCategory(cat.id)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '5px 12px',
                  borderRadius: '6px',
                  background: isActive ? '#1d4ed8' : '#141414',
                  border: isActive ? '1px solid #3b82f6' : '1px solid #262626',
                  color: isActive ? '#ffffff' : '#9ca3af',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <span>{cat.label}</span>
                <span
                  className="pill-badge"
                  style={{
                    padding: '1px 6px',
                    borderRadius: '10px',
                    background: isActive ? 'rgba(255, 255, 255, 0.22)' : '#222222',
                    color: isActive ? '#ffffff' : '#9ca3af',
                    fontSize: '10.5px',
                    fontWeight: 700,
                  }}
                >
                  {cat.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Runtime Selector */}
        <div
          className="runtime-selector"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '12px',
            color: '#9ca3af',
          }}
        >
          <span style={{ fontWeight: 500 }}>Package Manager:</span>
          <select
            value={activeRuntime}
            onChange={(e) => setActiveRuntime(e.target.value)}
            className="runtime-select"
            aria-label="Select package manager runtime"
            style={{
              background: '#141414',
              border: '1px solid #282828',
              color: '#f3f4f6',
              padding: '5px 10px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 500,
              outline: 'none',
              cursor: 'pointer',
            }}
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
        <div
          className="scripts-deck-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
            gap: '16px',
          }}
        >
          {filteredScripts.map((script) => {
            const formattedRunCmd = formatCommand(script);
            const isExpanded = Boolean(expandedCards[script.id]);

            return (
              <div
                key={script.id}
                className="script-deck-card"
                style={{
                  background: '#131313',
                  border: '1px solid #242424',
                  borderRadius: '10px',
                  padding: '18px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  transition: 'all 0.18s ease',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.35)',
                }}
              >
                {/* Card Top: Code Pill, Category Badge, Copy Button */}
                <div
                  className="card-top-bar"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px',
                  }}
                >
                  <div
                    className="card-badge-row"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      flexWrap: 'wrap',
                    }}
                  >
                    <span
                      className="script-title-code"
                      style={{
                        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                        fontSize: '13px',
                        fontWeight: 700,
                        color: '#f3f4f6',
                        background: '#1b1b1b',
                        border: '1px solid #2e2e2e',
                        padding: '2.5px 8px',
                        borderRadius: '4px',
                      }}
                    >
                      {formattedRunCmd}
                    </span>
                    <span
                      className={`script-category-badge ${script.badgeClass}`}
                      style={{
                        fontSize: '9.5px',
                        fontWeight: 700,
                        letterSpacing: '0.05em',
                        padding: '2.5px 7px',
                        borderRadius: '4px',
                        textTransform: 'uppercase',
                        background: 'rgba(59, 130, 246, 0.12)',
                        border: '1px solid rgba(59, 130, 246, 0.3)',
                        color: '#60a5fa',
                      }}
                    >
                      {script.badge}
                    </span>
                  </div>
                  <CopyButton text={formattedRunCmd} variant="compact" />
                </div>

                {/* Description */}
                <p
                  className="script-card-desc"
                  style={{
                    fontSize: '12.5px',
                    lineHeight: 1.5,
                    color: '#94a3b8',
                    margin: 0,
                    flexGrow: 1,
                  }}
                >
                  {script.description}
                </p>

                {/* Ports & Auto-Kill Tags */}
                {script.ports && (
                  <div
                    className="script-meta-tags"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      flexWrap: 'wrap',
                    }}
                  >
                    <span
                      className="meta-tag"
                      style={{
                        fontSize: '11px',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        background: '#191919',
                        border: '1px solid #282828',
                        color: '#38bdf8',
                        fontFamily: 'ui-monospace, monospace',
                      }}
                    >
                      🔌 {script.ports}
                    </span>
                    <span
                      className="meta-tag"
                      style={{
                        fontSize: '11px',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        background: '#191919',
                        border: '1px solid #282828',
                        color: '#4ade80',
                      }}
                    >
                      🛡️ Auto-Kill Enabled
                    </span>
                  </div>
                )}

                {/* Terminal Run Preview (Zero truncation, horizontal scrollable without scrollbars) */}
                <div
                  className="terminal-run-preview"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '8px',
                    background: '#0d0d0d',
                    border: '1px solid #222222',
                    borderRadius: '6px',
                    padding: '7px 10px',
                  }}
                >
                  <code
                    style={{
                      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                      fontSize: '11.5px',
                      color: '#38bdf8',
                      whiteSpace: 'nowrap',
                      overflowX: 'auto',
                      scrollbarWidth: 'none',
                      flex: 1,
                    }}
                    title={script.command}
                  >
                    <span className="prompt-sym" style={{ color: '#4ade80', marginRight: '6px', userSelect: 'none' }}>
                      $
                    </span>
                    {script.command}
                  </code>
                  <CopyButton text={script.command} variant="compact" label="Copy" />
                </div>

                {/* Expand Toggle */}
                <button
                  type="button"
                  className="card-expand-toggle"
                  onClick={() => toggleExpand(script.id)}
                  aria-expanded={isExpanded}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#6b7280',
                    fontSize: '11.5px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textAlign: 'left',
                    padding: '2px 0 0 0',
                    transition: 'color 0.15s ease',
                  }}
                >
                  {isExpanded ? 'Hide implementation details ▴' : 'Inspect execution details ▾'}
                </button>

                {/* Drawer */}
                {isExpanded && (
                  <div
                    className="card-expanded-drawer"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      padding: '12px',
                      borderRadius: '6px',
                      background: '#0a0a0a',
                      border: '1px solid #202020',
                      fontSize: '11.5px',
                    }}
                  >
                    <div className="drawer-row" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="drawer-lbl" style={{ color: '#64748b', fontWeight: 600 }}>Raw Script:</span>
                      <code className="drawer-val" style={{ color: '#cbd5e1', fontFamily: 'ui-monospace, monospace' }}>
                        {rootScripts[script.id] || script.command}
                      </code>
                    </div>
                    <div className="drawer-row" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="drawer-lbl" style={{ color: '#64748b', fontWeight: 600 }}>Target:</span>
                      <span className="drawer-val" style={{ color: '#cbd5e1' }}>
                        {script.category.toUpperCase()} Ecosystem
                      </span>
                    </div>
                    <div className="drawer-row" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="drawer-lbl" style={{ color: '#64748b', fontWeight: 600 }}>Clean Port:</span>
                      <span className="drawer-val" style={{ color: '#cbd5e1' }}>
                        Automatic socket detachment &amp; port reaping
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* ── Dense Table View ── */
        <div
          className="scripts-dense-table-wrap"
          style={{
            background: '#111111',
            border: '1px solid #222222',
            borderRadius: '10px',
            overflowX: 'auto',
          }}
        >
          <table
            className="scripts-dense-table"
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '12.5px',
            }}
          >
            <thead>
              <tr style={{ borderBottom: '1px solid #222222', background: '#161616', color: '#94a3b8', textAlign: 'left' }}>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Command</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Category</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Allocated Ports</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Description</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Execution String</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredScripts.map((script) => (
                <tr
                  key={script.id}
                  style={{
                    borderBottom: '1px solid #1c1c1c',
                    color: '#e2e8f0',
                  }}
                >
                  <td style={{ padding: '12px 16px' }}>
                    <code style={{ fontFamily: 'ui-monospace, monospace', color: '#60a5fa', fontWeight: 600 }}>
                      {formatCommand(script)}
                    </code>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span
                      className={`script-category-badge ${script.badgeClass}`}
                      style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        textTransform: 'uppercase',
                        background: 'rgba(59, 130, 246, 0.12)',
                        border: '1px solid rgba(59, 130, 246, 0.3)',
                        color: '#60a5fa',
                      }}
                    >
                      {script.category}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span className="script-port-col" style={{ color: script.ports ? '#38bdf8' : '#64748b', fontFamily: 'ui-monospace, monospace' }}>
                      {script.ports || '—'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', color: '#94a3b8' }}>{script.description}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <code
                      className="script-raw-exec"
                      style={{
                        fontFamily: 'ui-monospace, monospace',
                        fontSize: '11.5px',
                        color: '#a78bfa',
                      }}
                    >
                      {script.command}
                    </code>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
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
