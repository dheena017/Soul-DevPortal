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
      <div className="w-14 h-14 rounded-2xl bg-[#151519] border border-[#212126] flex items-center justify-center shrink-0 shadow-inner" title="Python Package">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
          <path
            d="M11.91 2C6.91 2 7.23 4.17 7.23 4.17L7.24 6.42H12V7.1H5.16S2 6.74 2 11.75c0 5 2.76 4.83 2.76 4.83H6.4v-2.31s-.15-2.76 2.71-2.76h4.63s2.59.04 2.59-2.52V4.56S16.92 2 11.91 2zm-2.07 1.54a.88.88 0 1 1 0 1.76.88.88 0 0 1 0-1.76z"
            fill="url(#py-grad-neutral)"
          />
          <path
            d="M12.09 22c5 0 4.68-2.17 4.68-2.17l-.01-2.25H12v-.68h6.84S22 17.26 22 12.25c0-5-2.76-4.83-2.76-4.83h-1.64v2.31s.15 2.76-2.71 2.76H10.26s-2.59-.04-2.59 2.52v4.43S7.08 22 12.09 22zm2.07-1.54a.88.88 0 1 1 0-1.76.88.88 0 0 1 0 1.76z"
            fill="url(#py-grad-yellow)"
          />
          <defs>
            <linearGradient id="py-grad-neutral" x1="2" y1="2" x2="16.92" y2="16.58" gradientUnits="userSpaceOnUse">
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
      <div className="w-14 h-14 rounded-2xl bg-[#151519] border border-[#212126] flex items-center justify-center shrink-0 shadow-inner text-neutral-300" title="Configuration Package">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      </div>
    );
  }

  return (
    <div className="w-14 h-14 rounded-2xl bg-[#151519] border border-[#212126] flex items-center justify-center shrink-0 shadow-inner text-neutral-300" title="NPM Workspace Package">
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
    <header className="w-full bg-[#151519] border border-[#212126] rounded-2xl p-5 md:p-6 shadow-2xl flex flex-col gap-6">
      {/* ── Navigation Breadcrumb Row ── */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#19191d]">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {onBack ? (
            <button
              type="button"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#151519] border border-[#212126] text-neutral-300 hover:text-neutral-200 hover:border-neutral-500 hover:bg-[#151519] transition-all font-semibold shadow-sm"
              onClick={onBack}
              title="Return to packages dashboard"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              <span>Back</span>
            </button>
          ) : (
            <a
              href="#packages"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#151519] border border-[#212126] text-neutral-300 hover:text-neutral-200 hover:border-neutral-500 hover:bg-[#151519] transition-all font-semibold shadow-sm"
              title="Return to packages dashboard"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              <span>Back</span>
            </a>
          )}
          <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-[#151519] border border-[#212126] text-neutral-400 font-medium">Soul Workspace</span>
          <span className="text-neutral-600 font-bold px-0.5" aria-hidden="true">›</span>
          <a
            href="#packages"
            className="inline-flex items-center px-2.5 py-1 rounded-full bg-[#151519] border border-[#212126] hover:border-neutral-500 hover:bg-[#151519] hover:text-neutral-200 transition-all text-neutral-300 font-medium"
            onClick={(e) => {
              if (onBack) {
                e.preventDefault();
                onBack();
              }
            }}
          >
            Pillar 2: Packages Dashboard
          </a>
          <span className="text-neutral-600 font-bold px-0.5" aria-hidden="true">›</span>
          <strong className="inline-flex items-center px-2.5 py-1 rounded-full bg-[#151519] border border-[#212126] text-neutral-200 font-semibold shadow-sm truncate max-w-sm">{pkg.name || `@workspace/${pkg.id}`}</strong>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#151519] border border-[#212126] text-xs font-semibold text-neutral-300 select-none shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-400" aria-hidden="true" />
            <span>Active Package · {totalExports} Symbols</span>
          </div>
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
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <PackageIconSvg pkg={pkg} />

          <div className="flex flex-col gap-2 min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-neutral-200 font-mono">
                {pkg.name || pkg.id}
              </h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-mono font-semibold bg-[#151519] border border-[#212126] text-neutral-300">
                <span>v{pkg.version || '1.0.0'}</span>
              </span>
            </div>
            <p className="text-xs md:text-sm text-neutral-400 leading-relaxed max-w-2xl">
              {pkg.description || 'Monorepo shared library package.'}
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="px-2 py-0.5 rounded-md bg-[#151519] border border-[#212126] text-xs font-mono font-semibold text-neutral-300">
                {pkg.id}
              </span>
              {pkg.hasNpmManifest && (
                <span className="px-2 py-0.5 rounded-md bg-[#151519] border border-[#212126] text-[11px] font-mono font-bold text-neutral-300">
                  npm workspace
                </span>
              )}
              {pkg.hasPythonManifest && (
                <span className="px-2 py-0.5 rounded-md bg-[#151519] border border-[#212126] text-[11px] font-mono font-bold text-neutral-300">
                  python editable
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 4-Card Metadata Grid */}
        <div className="grid grid-cols-2 gap-3 min-w-[280px]">
          <div className="flex flex-col p-3 rounded-xl bg-[#151519] border border-[#212126] hover:border-neutral-500 transition-all">
            <span className="text-[10px] text-neutral-500 font-mono font-bold uppercase tracking-wider">VERSION</span>
            <strong className="text-base font-bold text-neutral-200 font-mono mt-1">v{pkg.version || '1.0.0'}</strong>
          </div>

          <div className="flex flex-col p-3 rounded-xl bg-[#151519] border border-[#212126] hover:border-[#212126] transition-all">
            <span className="text-[10px] text-neutral-500 font-mono font-bold uppercase tracking-wider">LICENSE</span>
            <strong className="text-base font-bold text-neutral-300 font-mono mt-1">{pkg.license || 'MIT'}</strong>
          </div>

          <div className="flex flex-col p-3 rounded-xl bg-[#151519] border border-[#212126] hover:border-neutral-500 transition-all">
            <span className="text-[10px] text-neutral-500 font-mono font-bold uppercase tracking-wider">ECOSYSTEMS</span>
            <strong className="text-base font-bold text-neutral-200 font-mono mt-1 truncate">
              {[pkg.hasNpmManifest && 'npm', (pkg.hasPythonManifest || pkg.pythonModule) && 'Python'].filter(Boolean).join(' · ') || 'Universal'}
            </strong>
          </div>

          <div className="flex flex-col p-3 rounded-xl bg-[#151519] border border-[#212126] hover:border-[#212126] transition-all">
            <span className="text-[10px] text-neutral-500 font-mono font-bold uppercase tracking-wider">TOTAL EXPORTS</span>
            <strong className="text-base font-bold text-neutral-200 font-mono mt-1">{totalExports} symbols</strong>
          </div>
        </div>
      </div>

      {/* Modern Navigation Tabs inside Header */}
      <div className="pt-2 border-t border-[#19191d]">
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-[#070708] border border-[#212126] rounded-xl" role="tablist" aria-label="Package sections">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'docs'}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs transition-all ${
              activeTab === 'docs'
                ? 'bg-[#212126] text-white font-bold border border-neutral-400 shadow-sm'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50 hover:border-neutral-700 border border-transparent font-medium'
            }`}
            onClick={() => onTabChange('docs')}
          >
            <svg className={`w-3.5 h-3.5 ${activeTab === 'docs' ? 'text-white' : 'text-neutral-400'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
            <span>Documentation</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'api'}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs transition-all ${
              activeTab === 'api'
                ? 'bg-[#212126] text-white font-bold border border-neutral-400 shadow-sm'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50 hover:border-neutral-700 border border-transparent font-medium'
            }`}
            onClick={() => onTabChange('api')}
          >
            <svg className={`w-3.5 h-3.5 ${activeTab === 'api' ? 'text-white' : 'text-neutral-400'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="16 18 22 12 16 6" />
              <polyline points="8 6 2 12 8 18" />
            </svg>
            <span>API &amp; Exports</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${activeTab === 'api' ? 'bg-[#151519] text-neutral-200 border border-[#212126] font-bold' : 'bg-[#151519] text-neutral-400 border border-[#19191d]'}`}>
              {totalExports}
            </span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'playground'}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs transition-all ${
              activeTab === 'playground'
                ? 'bg-[#212126] text-white font-bold border border-neutral-400 shadow-sm'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50 hover:border-neutral-700 border border-transparent font-medium'
            }`}
            onClick={() => onTabChange('playground')}
          >
            <svg className={`w-3.5 h-3.5 ${activeTab === 'playground' ? 'text-white' : 'text-neutral-400'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            <span>Code Generator</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'manifest'}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs transition-all ${
              activeTab === 'manifest'
                ? 'bg-[#212126] text-white font-bold border border-neutral-400 shadow-sm'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50 hover:border-neutral-700 border border-transparent font-medium'
            }`}
            onClick={() => onTabChange('manifest')}
          >
            <svg className={`w-3.5 h-3.5 ${activeTab === 'manifest' ? 'text-white' : 'text-neutral-400'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
              <line x1="12" y1="22.08" x2="12" y2="12" />
            </svg>
            <span>Manifest &amp; Metadata</span>
          </button>
        </div>
      </div>
    </header>
  );
}
