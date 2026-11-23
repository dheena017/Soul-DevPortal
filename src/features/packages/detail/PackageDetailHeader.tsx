import React from 'react';
import CopyButton from '../../../components/CopyButton';
import { PackageData } from '../../../types';

export type PackageDetailTab = 'docs' | 'api' | 'playground' | 'manifest';

export interface PackageDetailHeaderProps {
  pkg: PackageData;
  activeTab: PackageDetailTab;
  onTabChange: (tab: PackageDetailTab) => void;
  totalExports: number;
  onBack?: () => void;
}

export function PackageIconSvg({ pkg }: { pkg: PackageData }) {
  if (pkg.pythonModule || pkg.hasPythonManifest) {
    return (
      <div className="pkg-badge-icon python" title="Python Package">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
          <path
            d="M11.91 2C6.91 2 7.23 4.17 7.23 4.17L7.24 6.42H12V7.1H5.16S2 6.74 2 11.75c0 5 2.76 4.83 2.76 4.83H6.4v-2.31s-.15-2.76 2.71-2.76h4.63s2.59.04 2.59-2.52V4.56S16.92 2 11.91 2zm-2.07 1.54a.88.88 0 1 1 0 1.76.88.88 0 0 1 0-1.76z"
            fill="url(#py-grad-blue)"
          />
          <path
            d="M12.09 22c5 0 4.68-2.17 4.68-2.17l-.01-2.25H12v-.68h6.84S22 17.26 22 12.25c0-5-2.76-4.83-2.76-4.83h-1.64v2.31s.15 2.76-2.71 2.76H10.26s-2.59-.04-2.59 2.52v4.43S7.08 22 12.09 22zm2.07-1.54a.88.88 0 1 1 0-1.76.88.88 0 0 1 0 1.76z"
            fill="url(#py-grad-yellow)"
          />
          <defs>
            <linearGradient id="py-grad-blue" x1="2" y1="2" x2="16.92" y2="16.58" gradientUnits="userSpaceOnUse">
              <stop stopColor="#38bdf8" />
              <stop offset="1" stopColor="#2563eb" />
            </linearGradient>
            <linearGradient id="py-grad-yellow" x1="7.08" y1="7.42" x2="22" y2="22" gradientUnits="userSpaceOnUse">
              <stop stopColor="#fde047" />
              <stop offset="1" stopColor="#eab308" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    );
  }

  if (pkg.name?.includes('config')) {
    return (
      <div className="pkg-badge-icon config" title="Configuration Package">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      </div>
    );
  }

  return (
    <div className="pkg-badge-icon npm" title="NPM Workspace Package">
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16.5 9.4 7.55 4.24a1.78 1.78 0 0 0-2.5 1.55v12.42a1.78 1.78 0 0 0 2.5 1.55L16.5 14.6a1.78 1.78 0 0 0 0-3.2z" />
        <polyline points="3.29 7 12 12 20.71 7" />
        <line x1="12" y1="22.08" x2="12" y2="12" />
      </svg>
    </div>
  );
}

export default function PackageDetailHeader({
  pkg,
  activeTab,
  onTabChange,
  totalExports,
  onBack,
}: PackageDetailHeaderProps) {
  return (
    <header className="detail-header package-hero">
      {/* ── Navigation Breadcrumb Row ── */}
      <div className="breadcrumb-nav-row">
        <div className="breadcrumb">
          {onBack ? (
            <button type="button" className="project-back-pill-btn" onClick={onBack} title="Return to packages dashboard">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              <span>Back</span>
            </button>
          ) : (
            <a href="#packages" className="project-back-pill-btn" title="Return to packages dashboard">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              <span>Back</span>
            </a>
          )}
          <span className="crumb-workspace">Soul Workspace</span>
          <span className="crumb-sep">/</span>
          <a
            href="#packages"
            className="crumb-link"
            onClick={(e) => {
              if (onBack) {
                e.preventDefault();
                onBack();
              }
            }}
          >
            Pillar 2: Packages Dashboard
          </a>
          <span className="crumb-sep">/</span>
          <strong className="crumb-active">{pkg.name || `@workspace/${pkg.id}`}</strong>
        </div>

        <div className="detail-top-actions">
          <CopyButton text={pkg.name || ''} label="Copy Name" copiedLabel="Copied!" variant="compact" />
          <CopyButton
            text={typeof window !== 'undefined' ? window.location.href : ''}
            label="Share link"
            copiedLabel="Link copied!"
            variant="compact"
          />
        </div>
      </div>

      {/* ── Hero Title & 2x2 Balanced Cards Row ── */}
      <div className="package-hero-body">
        <div className="package-hero-main">
          <div className="detail-title-row">
            <PackageIconSvg pkg={pkg} />

            <div className="package-title-copy">
              <div className="title-with-badge">
                <h1>{pkg.name || pkg.id}</h1>
                <span className="live-status-pill">
                  <span className="status-dot green" aria-hidden="true" />
                  <span>v{pkg.version || '1.0.0'}</span>
                </span>
              </div>
              <p className="detail-description">{pkg.description || 'Monorepo shared library package.'}</p>
              <div className="package-tags-flow">
                <span className="pkg-tag tag-primary">{pkg.id}</span>
                {pkg.hasNpmManifest && <span className="pkg-tag tag-npm">npm workspace</span>}
                {pkg.hasPythonManifest && <span className="pkg-tag tag-python">python editable</span>}
              </div>
            </div>
          </div>
        </div>

        {/* 4-Card Metadata Grid */}
        <div className="package-metadata">
          <div className="pkg-meta-card">
            <div className="meta-card-top">
              <span className="meta-icon version-icon">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </span>
              <span className="meta-label">VERSION</span>
            </div>
            <strong className="meta-val meta-emerald">v{pkg.version || '1.0.0'}</strong>
          </div>

          <div className="pkg-meta-card">
            <div className="meta-card-top">
              <span className="meta-icon license-icon">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </span>
              <span className="meta-label">LICENSE</span>
            </div>
            <strong className="meta-val meta-amber">{pkg.license || 'MIT'}</strong>
          </div>

          <div className="pkg-meta-card">
            <div className="meta-card-top">
              <span className="meta-icon ecosystem-icon">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="2" y1="12" x2="22" y2="12" />
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </svg>
              </span>
              <span className="meta-label">ECOSYSTEMS</span>
            </div>
            <strong className="meta-val meta-cyan">
              {[pkg.hasNpmManifest && 'npm', (pkg.hasPythonManifest || pkg.pythonModule) && 'Python'].filter(Boolean).join(' · ') || 'Universal'}
            </strong>
          </div>

          <div className="pkg-meta-card exports-card">
            <div className="meta-card-top">
              <span className="meta-icon exports-icon">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="16 18 22 12 16 6" />
                  <polyline points="8 6 2 12 8 18" />
                </svg>
              </span>
              <span className="meta-label">TOTAL EXPORTS</span>
            </div>
            <strong className="meta-val meta-violet">{totalExports} symbols</strong>
          </div>
        </div>
      </div>

      {/* Header Tabs Separator */}
      <div className="header-tabs-separator" />

      {/* Modern Navigation Tabs inside Header */}
      <div className="package-detail-tabs" role="tablist" aria-label="Package sections">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'docs'}
          className={`tab-btn ${activeTab === 'docs' ? 'active' : ''}`}
          onClick={() => onTabChange('docs')}
        >
          <span className="tab-svg-icon" aria-hidden="true">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
          </span>
          <span>Documentation</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'api'}
          className={`tab-btn ${activeTab === 'api' ? 'active' : ''}`}
          onClick={() => onTabChange('api')}
        >
          <span className="tab-svg-icon" aria-hidden="true">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="16 18 22 12 16 6" />
              <polyline points="8 6 2 12 8 18" />
            </svg>
          </span>
          <span>API &amp; Exports</span>
          <span className="tab-count-pill">{totalExports}</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'playground'}
          className={`tab-btn ${activeTab === 'playground' ? 'active' : ''}`}
          onClick={() => onTabChange('playground')}
        >
          <span className="tab-svg-icon" aria-hidden="true">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </span>
          <span>Code Generator</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'manifest'}
          className={`tab-btn ${activeTab === 'manifest' ? 'active' : ''}`}
          onClick={() => onTabChange('manifest')}
        >
          <span className="tab-svg-icon" aria-hidden="true">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
              <line x1="12" y1="22.08" x2="12" y2="12" />
            </svg>
          </span>
          <span>Manifest &amp; Metadata</span>
        </button>
      </div>
    </header>
  );
}
