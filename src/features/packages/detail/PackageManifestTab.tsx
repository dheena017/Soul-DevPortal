import React from 'react';
import { HeroArtworkBackdrop, ProportionalSpectrumBar } from '../../../components/PortalVisuals';
import TabLoadingState from '../../../components/TabLoadingState';
import { PackageData } from '../../../types';

export interface PackageManifestTabProps {
  pkg: PackageData;
  isLoading?: boolean;
}

export default function PackageManifestTab({ pkg, isLoading = false }: PackageManifestTabProps) {
  const deps = Object.entries(pkg.dependencies || {});
  const devDeps = Object.entries(pkg.devDependencies || {});
  const peerDeps = Object.entries(pkg.peerDependencies || {});
  const pyDeps = pkg.pythonDependencies || [];

  if (
    isLoading &&
    deps.length === 0 &&
    devDeps.length === 0 &&
    peerDeps.length === 0 &&
    pyDeps.length === 0
  ) {
    return (
      <TabLoadingState
        variant="grid"
        title={`Loading @workspace/${pkg.id} Manifests`}
        subtitle="Reading package.json, pyproject.toml, and dependency graph..."
      />
    );
  }

  return (
    <section className="w-full p-5 md:p-6 rounded-2xl bg-[#111115] border border-white/[0.08] shadow-2xl flex flex-col gap-6 portal-stagger portal-header-sheen">
      <HeroArtworkBackdrop src="/visuals/pillar-packages-core.jpg" alt="" opacityClass="opacity-68 sm:opacity-84" />
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.06]">
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-purple-400">PACKAGE MANIFEST</span>
          <h2 className="text-lg font-bold text-white">Metadata &amp; Dependency Manifests</h2>
        </div>
        <div className="flex items-center gap-2">
          {pkg.relativeTime && (
            <span className="px-2.5 py-1 rounded-md text-xs font-mono font-semibold bg-[#16161c] border border-white/[0.08] text-zinc-300">
              Updated {pkg.relativeTime}
            </span>
          )}
          <span className="px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-[#16161c] border border-white/[0.08] text-white">
            {pkg.name || `@workspace/${pkg.id}`}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <ProportionalSpectrumBar
          title="PACKAGE DEPENDENCY DISTRIBUTION"
          segments={[
            { label: 'Runtime Deps', value: deps.length, colorClass: 'bg-emerald-400', hex: '#34d399' },
            { label: 'Dev Deps', value: devDeps.length, colorClass: 'bg-sky-400', hex: '#38bdf8' },
            { label: 'Peer Deps', value: peerDeps.length, colorClass: 'bg-purple-400', hex: '#c084fc' },
            { label: 'Python Deps', value: pyDeps.length, colorClass: 'bg-amber-400', hex: '#fbbf24' },
          ]}
        />
        {/* 2-Card Summary Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 portal-grid-stagger">
          <div className="flex flex-col p-4 rounded-xl bg-[#16161c] border border-white/[0.08] hover:border-white/[0.18] gap-3 portal-card-hover">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Package Information</h4>
            <div className="flex flex-col gap-2 text-xs">
              <div className="flex justify-between py-1 border-b border-white/[0.06]">
                <span className="text-zinc-400">Package ID</span>
                <code className="text-zinc-200 font-mono font-bold">{pkg.id}</code>
              </div>
              <div className="flex justify-between py-1 border-b border-white/[0.06]">
                <span className="text-zinc-400">Full Name</span>
                <code className="text-zinc-200 font-mono">{pkg.name}</code>
              </div>
              <div className="flex justify-between py-1 border-b border-white/[0.06]">
                <span className="text-zinc-400">Version</span>
                <span className="text-zinc-200 font-mono font-bold">v{pkg.version}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/[0.06]">
                <span className="text-zinc-400">License</span>
                <span className="text-zinc-300 font-medium">{pkg.license || 'MIT'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/[0.06]">
                <span className="text-zinc-400">Last Modified</span>
                <span className="text-white font-mono font-medium" title={pkg.updatedAt || ''}>
                  {pkg.relativeTime ? `${pkg.relativeTime} ago` : 'Recently'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/[0.06]">
                <span className="text-zinc-400">Git Commit</span>
                <code className="text-purple-400 font-mono">{pkg.commitHash || 'main-head'}</code>
              </div>
              {pkg.pythonModule && (
                <div className="flex justify-between py-1">
                  <span className="text-zinc-400">Python Module</span>
                  <code className="text-zinc-300 font-mono">{pkg.pythonModule}</code>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col p-4 rounded-xl bg-[#16161c] border border-white/[0.08] hover:border-white/[0.18] gap-3 portal-card-hover">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Ecosystem Status</h4>
            <div className="flex flex-col gap-2 text-xs">
              <div className="flex justify-between py-1 border-b border-white/[0.06]">
                <span className="text-zinc-400">npm Workspace</span>
                <span className="text-emerald-400 font-medium">{pkg.hasNpmManifest ? '✅ Yes (package.json)' : '❌ No'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/[0.06]">
                <span className="text-zinc-400">Python Package</span>
                <span className="text-emerald-400 font-medium">{pkg.hasPythonManifest ? '✅ Yes (pyproject.toml)' : '❌ No'}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-zinc-400">TypeScript Typings</span>
                <span className="text-zinc-200">
                  {(pkg.typeScriptExports || []).length > 0 ? '✅ Included' : 'Included via presets'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Runtime Dependencies */}
        {deps.length > 0 && (
          <div className="flex flex-col gap-2.5">
            <h3 className="text-xs font-bold text-zinc-300">Runtime Dependencies ({deps.length})</h3>
            <div className="flex flex-wrap items-center gap-2 portal-grid-stagger">
              {deps.map(([dep, ver]) => (
                <span key={dep} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#16161c] border border-white/[0.08] hover:border-white/[0.2] text-xs font-mono portal-card-hover">
                  <strong className="text-white">{dep}</strong>
                  <code className="text-zinc-400 text-[11px]">{ver}</code>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Dev Dependencies */}
        {devDeps.length > 0 && (
          <div className="flex flex-col gap-2.5">
            <h3 className="text-xs font-bold text-zinc-300">Development Dependencies ({devDeps.length})</h3>
            <div className="flex flex-wrap items-center gap-2 portal-grid-stagger">
              {devDeps.map(([dep, ver]) => (
                <span key={dep} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#16161c] border border-white/[0.08] hover:border-white/[0.2] text-xs font-mono portal-card-hover">
                  <strong className="text-white">{dep}</strong>
                  <code className="text-zinc-400 text-[11px]">{ver}</code>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Peer Dependencies */}
        {peerDeps.length > 0 && (
          <div className="flex flex-col gap-2.5">
            <h3 className="text-xs font-bold text-zinc-300">Peer Dependencies ({peerDeps.length})</h3>
            <div className="flex flex-wrap items-center gap-2 portal-grid-stagger">
              {peerDeps.map(([dep, ver]) => (
                <span key={dep} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#16161c] border border-white/[0.08] hover:border-white/[0.2] text-xs font-mono portal-card-hover">
                  <strong className="text-white">{dep}</strong>
                  <code className="text-zinc-400 text-[11px]">{ver}</code>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Python Dependencies */}
        {pyDeps.length > 0 && (
          <div className="flex flex-col gap-2.5">
            <h3 className="text-xs font-bold text-zinc-300">Python Dependencies ({pyDeps.length})</h3>
            <div className="flex flex-wrap items-center gap-2 portal-grid-stagger">
              {pyDeps.map((dep) => (
                <span key={dep} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#16161c] border border-white/[0.08] hover:border-white/[0.2] text-xs font-mono portal-card-hover">
                  <strong className="text-white">{dep}</strong>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
