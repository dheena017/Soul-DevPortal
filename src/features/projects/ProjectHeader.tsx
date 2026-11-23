import React from 'react';
import { ProjectData } from '../../types';

export interface ProjectHeaderProps {
  totalCount: number;
  fullstackCount: number;
  standaloneCount: number;
  collisionsCount: number;
  sqliteIsolationPercent: string;
  query: string;
  onQueryChange: (q: string) => void;
  filterFramework: string;
  onFilterFrameworkChange: (fw: string) => void;
  frameworksList: string[];
  projects: ProjectData[];
  onBack?: () => void;
  searchInputRef: React.RefObject<HTMLInputElement | null>;
}

export default function ProjectHeader({
  totalCount,
  fullstackCount,
  standaloneCount,
  collisionsCount,
  sqliteIsolationPercent,
  query,
  onQueryChange,
  filterFramework,
  onFilterFrameworkChange,
  frameworksList,
  projects,
  onBack,
  searchInputRef,
}: ProjectHeaderProps) {
  return (
    <header className="detail-header pillar-hero-header project-dashboard-header">
      {/* Breadcrumb Navigation Row */}
      <div className="breadcrumb-nav-row">
        <div className="breadcrumb">
          {onBack ? (
            <button
              type="button"
              className="project-back-pill-btn"
              onClick={onBack}
              title="Back to Soul Workspace"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              <span>Back</span>
            </button>
          ) : (
            <a href="#overview" className="project-back-pill-btn" title="Back to Soul Workspace">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              <span>Back</span>
            </a>
          )}
          <span className="crumb-workspace">Soul Workspace</span>
          <span className="crumb-sep" aria-hidden="true">›</span>
          <strong className="crumb-active">Pillar 1: Projects</strong>
        </div>

        <div className="header-status-pill">
          <span className="status-live-dot" aria-hidden="true" />
          <span>{totalCount} Applications Indexed</span>
        </div>
      </div>

      {/* Hero Title & Identity Row */}
      <div className="project-hero-title-row">
        <div className="project-hero-icon" aria-hidden="true">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
            <line x1="8" y1="21" x2="16" y2="21" />
            <line x1="12" y1="17" x2="12" y2="21" />
          </svg>
        </div>
        <div className="project-hero-copy">
          <div className="title-with-badge">
            <h1 className="project-dashboard-h1">Projects &amp; Applications Dashboard</h1>
            <span className="monorepo-tag-pill">Pillar 1: Monorepo Apps</span>
          </div>
          <p className="detail-description">
            Catalog of all {totalCount} applications consuming the shared packages, their assigned development ports, backend servers, databases, and AI engines.
          </p>
        </div>
      </div>

      {/* 5-Metric Quick Stats Strip */}
      <div className="project-metrics-strip" role="region" aria-label="Project metrics">
        <div className="project-metric-card metric-total">
          <div className="metric-card-header">
            <span className="metric-icon">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
              </svg>
            </span>
            <span className="metric-label">Total Applications</span>
          </div>
          <strong className="metric-val">{totalCount}</strong>
        </div>

        <div className="project-metric-card metric-fullstack">
          <div className="metric-card-header">
            <span className="metric-icon">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
                <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
                <line x1="6" y1="6" x2="6.01" y2="6" />
                <line x1="6" y1="18" x2="6.01" y2="18" />
              </svg>
            </span>
            <span className="metric-label">Client-Server Fullstack</span>
          </div>
          <strong className="metric-val">{fullstackCount}</strong>
        </div>

        <div className="project-metric-card metric-standalone">
          <div className="metric-card-header">
            <span className="metric-icon">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
            </span>
            <span className="metric-label">Standalone Web Apps</span>
          </div>
          <strong className="metric-val">{standaloneCount}</strong>
        </div>

        <div className="project-metric-card metric-collisions">
          <div className="metric-card-header">
            <span className="metric-icon">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </span>
            <span className="metric-label">Port Collisions</span>
          </div>
          <strong className="metric-val">{collisionsCount}</strong>
        </div>

        <div className="project-metric-card metric-isolation">
          <div className="metric-card-header">
            <span className="metric-icon">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <ellipse cx="12" cy="5" rx="9" ry="3" />
                <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
                <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
              </svg>
            </span>
            <span className="metric-label">SQLite Isolation</span>
          </div>
          <strong className="metric-val">{sqliteIsolationPercent}</strong>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="projects-toolbar">
        <div className="projects-search-input-wrap">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            ref={searchInputRef}
            type="text"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder={`Search ${totalCount} applications by name, port, framework, AI engine... (Press '/' to focus)`}
            aria-label="Filter applications"
          />
          {query ? (
            <button
              type="button"
              className="search-clear-inline"
              onClick={() => onQueryChange('')}
              aria-label="Clear search"
              title="Clear search"
            >
              ✕
            </button>
          ) : (
            <kbd className="search-kbd-hint">/</kbd>
          )}
        </div>

        <div className="framework-filter-pills filter-pills" role="tablist" aria-label="Filter by framework">
          {frameworksList.map((fw) => {
            const count = fw === 'all'
              ? totalCount
              : projects.filter((p) => p.framework?.includes(fw)).length;
            const isActive = filterFramework === fw;
            return (
              <button
                type="button"
                key={fw}
                role="tab"
                aria-selected={isActive}
                className={`framework-pill ${isActive ? 'active' : ''}`}
                onClick={() => onFilterFrameworkChange(fw)}
              >
                <span className="pill-text">{fw === 'all' ? 'All Frameworks' : fw}</span>
                <span className="pill-count">{count}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
