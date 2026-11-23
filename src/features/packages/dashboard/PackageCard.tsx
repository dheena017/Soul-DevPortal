import React from 'react';
import { consoleLogger } from '@workspace/logger';
import CopyButton from '../../../components/CopyButton';
import { PackageData } from '../../../types';
import { PACKAGE_METADATA_MAP, PackageMetaInfo } from '../packagesConstants';

export interface PackageCardProps {
  key?: React.Key;
  pkg: PackageData;
  onSelectPackage?: (id: string) => void;
}

export function getInstallCommand(pkg: PackageData): string {
  if (pkg.id === 'logger') return 'npm install @workspace/logger';
  if (pkg.id === 'runner') return 'npm install @workspace/runner';
  return 'npm install @workspace/config';
}

export function getPythonInstallCommand(pkg: PackageData): string {
  if (pkg.id === 'logger') return 'pip install -e Soul-DevPortal-Packages/logger';
  if (pkg.id === 'runner') return 'pip install -e Soul-DevPortal-Packages/runner';
  if (pkg.id === 'config') return 'pip install -e Soul-DevPortal-Packages/config';
  return '';
}

export default function PackageCard({ pkg, onSelectPackage }: PackageCardProps) {
  const meta: PackageMetaInfo = PACKAGE_METADATA_MAP[pkg.id] || {
    icon: '📦',
    theme: 'blue',
    role: 'Workspace Shared Library',
    tags: ['Shared Library', 'TypeScript'],
    scope: 'Monorepo Core',
  };

  const installCmd = getInstallCommand(pkg);
  const pyInstallCmd = getPythonInstallCommand(pkg);
  const exportsCount =
    (pkg.exports || []).length +
    (pkg.pythonExports || []).length +
    (pkg.typeScriptExports || []).length;

  // Thematic colors (matching website design system)
  const themeColors = {
    blue: {
      accent: '#3b82f6',
      avatarBg: 'rgba(59, 130, 246, 0.12)',
      avatarBorder: 'rgba(59, 130, 246, 0.35)',
      cardHoverBorder: 'rgba(59, 130, 246, 0.45)',
      btnBg: 'rgba(59, 130, 246, 0.1)',
      btnBorder: 'rgba(59, 130, 246, 0.35)',
      btnText: '#60a5fa',
      btnHoverBg: 'rgba(59, 130, 246, 0.2)',
    },
    violet: {
      accent: '#8b5cf6',
      avatarBg: 'rgba(139, 92, 246, 0.12)',
      avatarBorder: 'rgba(139, 92, 246, 0.35)',
      cardHoverBorder: 'rgba(139, 92, 246, 0.45)',
      btnBg: 'rgba(139, 92, 246, 0.1)',
      btnBorder: 'rgba(139, 92, 246, 0.35)',
      btnText: '#a78bfa',
      btnHoverBg: 'rgba(139, 92, 246, 0.2)',
    },
    emerald: {
      accent: '#22c55e',
      avatarBg: 'rgba(34, 197, 94, 0.12)',
      avatarBorder: 'rgba(34, 197, 94, 0.35)',
      cardHoverBorder: 'rgba(34, 197, 94, 0.45)',
      btnBg: 'rgba(34, 197, 94, 0.1)',
      btnBorder: 'rgba(34, 197, 94, 0.35)',
      btnText: '#4ade80',
      btnHoverBg: 'rgba(34, 197, 94, 0.2)',
    },
  }[meta.theme] || {
    accent: '#3b82f6',
    avatarBg: 'rgba(59, 130, 246, 0.12)',
    avatarBorder: 'rgba(59, 130, 246, 0.35)',
    cardHoverBorder: 'rgba(59, 130, 246, 0.45)',
    btnBg: 'rgba(59, 130, 246, 0.1)',
    btnBorder: 'rgba(59, 130, 246, 0.35)',
    btnText: '#60a5fa',
    btnHoverBg: 'rgba(59, 130, 246, 0.2)',
  };

  return (
    <article
      className={`package-card pkg-modern-card theme-${meta.theme}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        background: '#15151e',
        border: '1px solid #282838',
        borderRadius: '12px',
        padding: '22px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.35)',
        position: 'relative',
        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      {/* ── Top Header: Brand avatar, Version chip, Ecosystem pills ── */}
      <div
        className="pkg-card-header"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '16px',
        }}
      >
        <div
          className="pkg-card-brand"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div
            className={`pkg-avatar-box ${meta.theme}`}
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              display: 'grid',
              placeItems: 'center',
              fontSize: '20px',
              flexShrink: 0,
              background: themeColors.avatarBg,
              border: `1px solid ${themeColors.avatarBorder}`,
            }}
          >
            <span className="pkg-avatar-icon" aria-hidden="true">
              {meta.icon}
            </span>
          </div>

          <div
            className="pkg-title-meta"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                className="pkg-badge-version"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '2px 7px',
                  borderRadius: '4px',
                  background: '#1d1d1d',
                  border: '1px solid #333333',
                  color: '#e2e8f0',
                  fontSize: '11px',
                  fontFamily: 'ui-monospace, monospace',
                  fontWeight: 600,
                }}
              >
                v{pkg.version || '1.0.0'}
              </span>
              <span
                className="pkg-path-chip"
                style={{
                  color: '#71717a',
                  fontSize: '11px',
                  fontFamily: 'ui-monospace, monospace',
                }}
              >
                packages/{pkg.id}
              </span>
            </div>
          </div>
        </div>

        {/* Ecosystem Badges (NPM, Python) */}
        <div
          className="pkg-ecosystem-badges"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          {pkg.hasNpmManifest && (
            <span
              className="pkg-eco-pill npm-pill"
              title="NPM Package Available"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '3px 8px',
                borderRadius: '5px',
                fontSize: '10.5px',
                fontWeight: 700,
                letterSpacing: '0.04em',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.28)',
                color: '#f87171',
                textTransform: 'uppercase',
              }}
            >
              <span
                className="pill-dot red-dot"
                style={{
                  width: '5px',
                  height: '5px',
                  borderRadius: '50%',
                  background: '#ef4444',
                }}
              />
              NPM
            </span>
          )}

          {pkg.hasPythonManifest && (
            <span
              className="pkg-eco-pill py-pill"
              title="Python Module Available"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '3px 8px',
                borderRadius: '5px',
                fontSize: '10.5px',
                fontWeight: 700,
                letterSpacing: '0.04em',
                background: 'rgba(59, 130, 246, 0.1)',
                border: '1px solid rgba(59, 130, 246, 0.28)',
                color: '#60a5fa',
                textTransform: 'uppercase',
              }}
            >
              <span
                className="pill-dot blue-dot"
                style={{
                  width: '5px',
                  height: '5px',
                  borderRadius: '50%',
                  background: '#3b82f6',
                }}
              />
              PYTHON
            </span>
          )}
        </div>
      </div>

      {/* ── Body: Package Name, Role, Description, Feature Tag Chips ── */}
      <div
        className="pkg-card-body"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          marginBottom: '16px',
        }}
      >
        <h3
          className="pkg-card-title"
          style={{
            margin: '0 0 2px 0',
            fontSize: '17px',
            fontWeight: 700,
            color: '#ffffff',
            letterSpacing: '-0.015em',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          {pkg.displayName || pkg.name}
        </h3>

        <div
          className="pkg-role-text"
          style={{
            fontSize: '12px',
            fontWeight: 600,
            color: themeColors.accent,
            lineHeight: 1.4,
          }}
        >
          {meta.role}
        </div>

        {pkg.description && (
          <p
            className="pkg-card-desc"
            style={{
              margin: '6px 0 10px 0',
              fontSize: '12.5px',
              color: '#94a3b8',
              lineHeight: 1.55,
            }}
          >
            {pkg.description}
          </p>
        )}

        <div
          className="pkg-feature-tags"
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '6px',
            marginTop: '2px',
          }}
        >
          {meta.tags.map((tag) => (
            <span
              key={tag}
              className="pkg-feature-pill"
              style={{
                padding: '2.5px 7.5px',
                borderRadius: '4px',
                background: '#181818',
                border: '1px solid #2a2a2a',
                color: '#cbd5e1',
                fontSize: '11px',
                fontWeight: 500,
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* ── 3-Column Metrics Tiles: Exports, License, Python Module ── */}
      <div
        className="pkg-metrics-tiles"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '8px',
          marginBottom: '16px',
        }}
      >
        <div
          className="pkg-metric-tile"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '3px',
            padding: '9px 11px',
            borderRadius: '8px',
            background: '#161616',
            border: '1px solid #262626',
          }}
        >
          <span
            className="tile-label"
            style={{
              fontSize: '9.5px',
              fontWeight: 800,
              color: '#64748b',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}
          >
            TOTAL EXPORTS
          </span>
          <strong
            className="tile-value text-accent"
            style={{
              fontSize: '13px',
              fontWeight: 700,
              color: '#38bdf8',
            }}
          >
            {exportsCount} APIs
          </strong>
        </div>

        <div
          className="pkg-metric-tile"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '3px',
            padding: '9px 11px',
            borderRadius: '8px',
            background: '#161616',
            border: '1px solid #262626',
          }}
        >
          <span
            className="tile-label"
            style={{
              fontSize: '9.5px',
              fontWeight: 800,
              color: '#64748b',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}
          >
            LICENSE
          </span>
          <strong
            className="tile-value"
            style={{
              fontSize: '13px',
              fontWeight: 700,
              color: '#e2e8f0',
            }}
          >
            {pkg.license || 'MIT'}
          </strong>
        </div>

        <div
          className="pkg-metric-tile"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '3px',
            padding: '9px 11px',
            borderRadius: '8px',
            background: '#161616',
            border: '1px solid #262626',
            overflow: 'hidden',
          }}
        >
          <span
            className="tile-label"
            style={{
              fontSize: '9.5px',
              fontWeight: 800,
              color: '#64748b',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}
          >
            PYTHON MODULE
          </span>
          <strong
            className="tile-value text-code"
            style={{
              fontSize: '11px',
              fontFamily: 'ui-monospace, monospace',
              color: '#c084fc',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
            title={pkg.pythonModule || 'N/A (TS only)'}
          >
            {pkg.pythonModule ? pkg.pythonModule : 'external'}
          </strong>
        </div>
      </div>

      {/* ── Install Snippet Container (No Truncation, Clean Copy) ── */}
      <div
        className="pkg-install-container"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '7px',
          marginBottom: '16px',
        }}
      >
        {/* NPM Install */}
        <div
          className="pkg-install-row"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
            padding: '7px 10px',
            borderRadius: '6px',
            background: '#0d0d0d',
            border: '1px solid #262626',
          }}
        >
          <span
            className="terminal-prompt"
            style={{
              color: '#22c55e',
              fontWeight: 700,
              fontFamily: 'ui-monospace, monospace',
              fontSize: '11.5px',
              userSelect: 'none',
              flexShrink: 0,
            }}
          >
            $
          </span>
          <code
            className="install-cmd-code"
            style={{
              flex: 1,
              color: '#e2e8f0',
              fontSize: '11.5px',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
              whiteSpace: 'nowrap',
              overflowX: 'auto',
              scrollbarWidth: 'none',
            }}
          >
            {installCmd}
          </code>
          <CopyButton text={installCmd} variant="compact" label="Copy" />
        </div>

        {/* Python Install (full visible text, no truncation!) */}
        {pyInstallCmd && (
          <div
            className="pkg-install-row py-alt"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '8px',
              padding: '7px 10px',
              borderRadius: '6px',
              background: '#0d0d0d',
              border: '1px solid #262626',
            }}
          >
            <span
              className="terminal-prompt"
              style={{
                color: '#38bdf8',
                fontWeight: 700,
                fontFamily: 'ui-monospace, monospace',
                fontSize: '11.5px',
                userSelect: 'none',
                flexShrink: 0,
              }}
            >
              $
            </span>
            <code
              className="install-cmd-code"
              style={{
                flex: 1,
                color: '#e2e8f0',
                fontSize: '11.5px',
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                whiteSpace: 'nowrap',
                overflowX: 'auto',
                scrollbarWidth: 'none',
              }}
              title={pyInstallCmd}
            >
              {pyInstallCmd}
            </code>
            <CopyButton text={pyInstallCmd} variant="compact" label="Copy" />
          </div>
        )}
      </div>

      {/* ── Footer Action Button (Modern Glassmorphic Button) ── */}
      <div className="pkg-card-footer" style={{ marginTop: 'auto' }}>
        {onSelectPackage && (
          <button
            type="button"
            className="pkg-inspect-btn"
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              height: '38px',
              borderRadius: '7px',
              background: themeColors.btnBg,
              border: `1px solid ${themeColors.btnBorder}`,
              color: themeColors.btnText,
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.18s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = themeColors.btnHoverBg;
              e.currentTarget.style.borderColor = themeColors.accent;
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = themeColors.btnBg;
              e.currentTarget.style.borderColor = themeColors.btnBorder;
              e.currentTarget.style.transform = 'translateY(0)';
            }}
            onClick={() => {
              consoleLogger.action(
                'PACKAGES',
                `Selected package: ${pkg.displayName || pkg.name} (@workspace/${pkg.id})`
              );
              onSelectPackage(pkg.id);
            }}
          >
            <span>Inspect Package API</span>
            <span
              className="arrow-icon"
              aria-hidden="true"
              style={{ fontSize: '14px', transition: 'transform 0.15s ease' }}
            >
              →
            </span>
          </button>
        )}
      </div>
    </article>
  );
}
