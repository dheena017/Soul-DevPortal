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
    <section className="w-full p-5 md:p-6 rounded-2xl bg-[#111111] border border-[#222222] shadow-2xl flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1a1a1a]">
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-400">PACKAGE MANIFEST</span>
          <h2 className="text-lg font-bold text-white">Metadata &amp; Dependency Manifests</h2>
        </div>
        <span className="px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-[#111111] border border-[#222222] text-neutral-300">
          {pkg.name || `@workspace/${pkg.id}`}
        </span>
      </div>

      <div className="flex flex-col gap-6">
        {/* 2-Card Summary Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col p-4 rounded-xl bg-[#111111] border border-[#222222] gap-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider text-neutral-400">Package Information</h4>
            <div className="flex flex-col gap-2 text-xs">
              <div className="flex justify-between py-1 border-b border-[#1a1a1a]">
                <span className="text-neutral-500">Package ID</span>
                <code className="text-blue-400 font-mono font-bold">{pkg.id}</code>
              </div>
              <div className="flex justify-between py-1 border-b border-[#1a1a1a]">
                <span className="text-neutral-500">Full Name</span>
                <code className="text-neutral-200 font-mono">{pkg.name}</code>
              </div>
              <div className="flex justify-between py-1 border-b border-[#1a1a1a]">
                <span className="text-neutral-500">Version</span>
                <span className="text-blue-400 font-mono font-bold">v{pkg.version}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#1a1a1a]">
                <span className="text-neutral-500">License</span>
                <span className="text-neutral-300 font-medium">{pkg.license || 'MIT'}</span>
              </div>
              {pkg.pythonModule && (
                <div className="flex justify-between py-1">
                  <span className="text-neutral-500">Python Module</span>
                  <code className="text-blue-400 font-mono">{pkg.pythonModule}</code>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col p-4 rounded-xl bg-[#111111] border border-[#222222] gap-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider text-neutral-400">Ecosystem Status</h4>
            <div className="flex flex-col gap-2 text-xs">
              <div className="flex justify-between py-1 border-b border-[#1a1a1a]">
                <span className="text-neutral-500">npm Workspace</span>
                <span className="text-neutral-200">{pkg.hasNpmManifest ? '✅ Yes (package.json)' : '❌ No'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#1a1a1a]">
                <span className="text-neutral-500">Python Package</span>
                <span className="text-neutral-200">{pkg.hasPythonManifest ? '✅ Yes (pyproject.toml)' : '❌ No'}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-neutral-500">TypeScript Typings</span>
                <span className="text-neutral-200">
                  {(pkg.typeScriptExports || []).length > 0 ? '✅ Included' : 'Included via presets'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Runtime Dependencies */}
        {deps.length > 0 && (
          <div className="flex flex-col gap-2.5">
            <h3 className="text-xs font-bold text-neutral-300">Runtime Dependencies ({deps.length})</h3>
            <div className="flex flex-wrap items-center gap-2">
              {deps.map(([dep, ver]) => (
                <span key={dep} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#111111] border border-[#222222] text-xs font-mono">
                  <strong className="text-white">{dep}</strong>
                  <code className="text-blue-400 text-[11px]">{ver}</code>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Dev Dependencies */}
        {devDeps.length > 0 && (
          <div className="flex flex-col gap-2.5">
            <h3 className="text-xs font-bold text-neutral-300">Development Dependencies ({devDeps.length})</h3>
            <div className="flex flex-wrap items-center gap-2">
              {devDeps.map(([dep, ver]) => (
                <span key={dep} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#111111] border border-[#222222] text-xs font-mono">
                  <strong className="text-white">{dep}</strong>
                  <code className="text-blue-400 text-[11px]">{ver}</code>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Peer Dependencies */}
        {peerDeps.length > 0 && (
          <div className="flex flex-col gap-2.5">
            <h3 className="text-xs font-bold text-neutral-300">Peer Dependencies ({peerDeps.length})</h3>
            <div className="flex flex-wrap items-center gap-2">
              {peerDeps.map(([dep, ver]) => (
                <span key={dep} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#111111] border border-[#222222] text-xs font-mono">
                  <strong className="text-white">{dep}</strong>
                  <code className="text-blue-400 text-[11px]">{ver}</code>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Python Dependencies */}
        {pyDeps.length > 0 && (
          <div className="flex flex-col gap-2.5">
            <h3 className="text-xs font-bold text-neutral-300">Python Dependencies ({pyDeps.length})</h3>
            <div className="flex flex-wrap items-center gap-2">
              {pyDeps.map((dep) => (
                <span key={dep} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#111111] border border-[#222222] text-xs font-mono">
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
