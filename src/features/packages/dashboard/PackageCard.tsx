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
    theme: 'neutral',
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

  const handleCardClick = () => {
    if (onSelectPackage) {
      consoleLogger.action('PACKAGES', `Selected package: @workspace/${pkg.id}`, { packageId: pkg.id });
      onSelectPackage(pkg.id);
    }
  };

  return (
    <article className="group flex flex-col justify-between p-5 rounded-2xl bg-[#121216] border border-white/[0.08] hover:border-white/[0.2] hover:bg-[#15151b] hover:shadow-2xl transition-all duration-200 gap-4 h-full">
      {/* ── Top Row: Icon, Version, Ecosystem Pills ── */}
        <div className="flex flex-col gap-3.5" onClick={handleCardClick} style={{ cursor: onSelectPackage ? 'pointer' : 'default' }}>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border border-white/[0.1] bg-[#16161c] text-xl shadow-inner">
                {meta.icon}
              </div>

              <div className="flex flex-col min-w-0">
                <span className="text-xs font-mono font-bold text-zinc-100">v{pkg.version || '1.0.0'}</span>
                <span className="text-[10px] font-mono text-zinc-400 truncate">packages/{pkg.id}</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-rose-500/15 border border-rose-500/35 text-rose-300 text-[10px] font-mono font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" aria-hidden="true" />
                <span>NPM</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/35 text-amber-300 text-[10px] font-mono font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" aria-hidden="true" />
                <span>PYTHON</span>
              </span>
            </div>
          </div>

          {/* ── Title & Subtitle ── */}
          <div className="flex flex-col gap-1">
            <h3 className="text-lg font-bold font-mono text-white group-hover:text-white transition-colors truncate">
              @workspace/{pkg.id}
            </h3>
            <span className="text-xs font-semibold text-zinc-200 truncate">
              {meta.role}
            </span>
            <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed min-h-[36px]">
              {pkg.description || `High-performance shared library @workspace/${pkg.id} for the Soul workspace.`}
            </p>
          </div>
        </div>

        {/* ── Tags Row ── */}
        <div className="flex flex-wrap items-center gap-1.5">
          {meta.tags.map((tag) => (
            <span key={tag} className="px-2.5 py-1 rounded-lg bg-[#16161c] border border-white/[0.08] text-[10px] font-mono font-medium text-zinc-300">
              {tag}
            </span>
          ))}
        </div>

        {/* ── 3-Metric Specs Row ── */}
        <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-[#09090c] border border-white/[0.08] text-center font-mono text-xs">
          <div className="flex flex-col items-center">
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">TOTAL EXPORTS</span>
            <strong className="text-xs font-bold text-white mt-0.5">{exportsCount} APIs</strong>
          </div>
          <div className="flex flex-col items-center border-x border-white/[0.08]">
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">LICENSE</span>
            <strong className="text-xs font-bold text-white mt-0.5">{pkg.license || 'MIT'}</strong>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">PYTHON MODULE</span>
            <strong className="text-xs font-bold text-amber-300 mt-0.5 truncate max-w-[80px]">external</strong>
          </div>
        </div>

        {/* ── Terminal Commands Strip (Zero Truncation) ── */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl bg-[#09090c] border border-white/[0.08] font-mono text-xs text-zinc-300">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <span className="text-zinc-500 select-none font-bold">$</span>
              <code className="text-[11px] text-zinc-100 truncate select-all font-semibold">{installCmd}</code>
            </div>
            <CopyButton text={installCmd} variant="compact" label="" copiedLabel="Copied!" />
          </div>

          {pyInstallCmd && (
            <div className="flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl bg-[#09090c] border border-white/[0.08] font-mono text-xs text-zinc-300">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <span className="text-zinc-500 select-none font-bold">$</span>
                <code className="text-[11px] text-zinc-100 truncate select-all font-semibold">{pyInstallCmd}</code>
              </div>
              <CopyButton text={pyInstallCmd} variant="compact" label="" copiedLabel="Copied!" />
            </div>
          )}
        </div>

        {/* ── Card Action Footer ── */}
        <div className="pt-3 border-t border-white/[0.06]">
          <button
            type="button"
            className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-white text-zinc-950 hover:bg-zinc-200 transition-all shadow-md shadow-white/10 flex items-center justify-center gap-2"
            onClick={handleCardClick}
            title={`Inspect @workspace/${pkg.id}`}
          >
            <span>Inspect Package API</span>
            <span>→</span>
          </button>
        </div>
      </article>
  );
}
