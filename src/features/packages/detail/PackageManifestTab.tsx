import React from 'react';
import { PackageData } from '../../../types';

export interface PackageManifestTabProps {
  pkg: PackageData;
}

export default function PackageManifestTab({ pkg }: PackageManifestTabProps) {
  const deps = Object.entries(pkg.dependencies || {});
  const devDeps = Object.entries(pkg.devDependencies || {});
  const peerDeps = Object.entries(pkg.peerDependencies || {});
  const pyDeps = pkg.pythonDependencies || [];

  return (
    <section className="detail-section manifest-section">
      <div className="section-heading">
        <div>
          <span className="section-kicker">PACKAGE MANIFEST</span>
          <h2>Metadata &amp; Dependency Manifests</h2>
        </div>
        <span className="group-badge">{pkg.name || `@workspace/${pkg.id}`}</span>
      </div>

      <div className="manifest-tab-content">
        <div className="manifest-summary-grid">
          <div className="manifest-info-card">
            <h4>Package Information</h4>
            <dl className="manifest-dl">
              <dt>Package ID</dt>
              <dd><code>{pkg.id}</code></dd>
              <dt>Full Name</dt>
              <dd><code>{pkg.name}</code></dd>
              <dt>Version</dt>
              <dd><span className="version-pill">v{pkg.version}</span></dd>
              <dt>License</dt>
              <dd>{pkg.license || 'MIT'}</dd>
              {pkg.pythonModule && (
                <>
                  <dt>Python Module</dt>
                  <dd><code>{pkg.pythonModule}</code></dd>
                </>
              )}
            </dl>
          </div>

          <div className="manifest-info-card">
            <h4>Ecosystem Status</h4>
            <dl className="manifest-dl">
              <dt>npm Workspace</dt>
              <dd>{pkg.hasNpmManifest ? '✅ Yes (package.json)' : '❌ No'}</dd>
              <dt>Python Package</dt>
              <dd>{pkg.hasPythonManifest ? '✅ Yes (pyproject.toml)' : '❌ No'}</dd>
              <dt>TypeScript Typings</dt>
              <dd>{(pkg.typeScriptExports || []).length > 0 ? '✅ Included' : 'Included via presets'}</dd>
            </dl>
          </div>
        </div>

        {deps.length > 0 && (
          <div className="dep-group">
            <h3>Runtime Dependencies ({deps.length})</h3>
            <div className="dep-chips">
              {deps.map(([dep, ver]) => (
                <span className="dep-chip" key={dep}>
                  <strong>{dep}</strong>
                  <code>{ver}</code>
                </span>
              ))}
            </div>
          </div>
        )}

        {devDeps.length > 0 && (
          <div className="dep-group">
            <h3>Development Dependencies ({devDeps.length})</h3>
            <div className="dep-chips">
              {devDeps.map(([dep, ver]) => (
                <span className="dep-chip" key={dep}>
                  <strong>{dep}</strong>
                  <code>{ver}</code>
                </span>
              ))}
            </div>
          </div>
        )}

        {peerDeps.length > 0 && (
          <div className="dep-group">
            <h3>Peer Dependencies ({peerDeps.length})</h3>
            <div className="dep-chips">
              {peerDeps.map(([dep, ver]) => (
                <span className="dep-chip" key={dep}>
                  <strong>{dep}</strong>
                  <code>{ver}</code>
                </span>
              ))}
            </div>
          </div>
        )}

        {pyDeps.length > 0 && (
          <div className="dep-group">
            <h3>Python Dependencies ({pyDeps.length})</h3>
            <div className="dep-chips">
              {pyDeps.map((dep) => (
                <span className="dep-chip py-chip" key={dep}>
                  <strong>{dep}</strong>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
