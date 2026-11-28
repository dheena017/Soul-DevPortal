import React, { useEffect, useMemo, useState } from 'react';
import { PackageData, ProjectData } from '../../../types';
import { tokens } from '@workspace/config/tailwind/tokens';
import CopyButton from '../../../components/CopyButton';

export interface PackagePreviousTabProps {
  pkg: PackageData;
  allPackages?: PackageData[];
  projects?: ProjectData[];
  onSelectPackage?: (packageId: string) => void;
}

export default function PackagePreviousTab({
  pkg,
  allPackages = [],
  projects = [],
  onSelectPackage,
}: PackagePreviousTabProps) {
  const pkgKey = (pkg.id || '').toLowerCase();
  const previewFolder = pkg.preview;
  const rawPreviewFiles = previewFolder?.files || [];
  const previewFiles = useMemo(() => {
    const rank = (name: string) => {
      const lower = name.toLowerCase();
      if (lower === 'usage.md') return 0;
      if (lower.startsWith('run_') && lower.endsWith('.py')) return 1;
      if (lower === 'preview.json') return 2;
      return 3;
    };
    return [...rawPreviewFiles].sort((a, b) => rank(a.name) - rank(b.name) || a.name.localeCompare(b.name));
  }, [rawPreviewFiles]);
  const previewManifest = useMemo(() => {
    if (previewFolder?.manifest) return previewFolder.manifest;
    const jsonFile = previewFiles.find((f) => f.name.toLowerCase() === 'preview.json');
    if (jsonFile?.content) {
      try {
        return JSON.parse(jsonFile.content);
      } catch {
        return null;
      }
    }
    return null;
  }, [previewFolder?.manifest, previewFiles]);
  const [activeFileName, setActiveFileName] = useState<string>(
    () => previewFiles[0]?.name || ''
  );

  useEffect(() => {
    if (previewFiles.length > 0 && !previewFiles.some((f) => f.name === activeFileName)) {
      setActiveFileName(previewFiles[0].name);
    }
  }, [pkg.id, previewFiles, activeFileName]);

  const activePreviewFile = useMemo(
    () => previewFiles.find((f) => f.name === activeFileName) || previewFiles[0],
    [previewFiles, activeFileName]
  );

  const tokenSwatches = useMemo(() => {
    const colors = (tokens?.colors || {}) as Record<string, any>;
    const list: Array<{ name: string; hex: string }> = [];
    const walk = (obj: Record<string, any>, prefix = '') => {
      for (const [k, v] of Object.entries(obj)) {
        const keyName = k === 'DEFAULT' && prefix ? prefix : prefix ? `${prefix}.${k}` : k;
        if (typeof v === 'string' && v.startsWith('#')) {
          list.push({ name: keyName, hex: v });
        } else if (v && typeof v === 'object') {
          walk(v, keyName);
        }
      }
    };
    walk(colors);
    return list;
  }, []);

  return (
    <div className="flex flex-col gap-5">
      {/* ── Dynamic Preview Header (from Preview/preview.json) ── */}
      <div className="neu-card bg-[#111115] border border-white/[0.08] rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400">
              Soul-DevPortal-Packages/{pkg.id}/{previewFolder?.folder || 'Preview'}/
            </span>
          </div>
          <h2 className="text-base sm:text-lg font-bold text-white">
            {previewManifest?.title || pkg.name || `@workspace/${pkg.id}`}
          </h2>
          <p className="text-xs text-zinc-400">
            {previewManifest?.subtitle || pkg.description || 'Package runtime preview'}
          </p>
        </div>
        {previewManifest?.runtime && (
          <span className="px-3 py-1 rounded-lg bg-[#16161c] border border-white/[0.08] text-xs font-mono text-zinc-200 shrink-0">
            {previewManifest.runtime}
          </span>
        )}
      </div>

      {/* ── Files & Manifest from Soul-DevPortal-Packages/<pkg>/Preview/ ── */}
      {previewFolder?.hasPreview ? (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          {/* Preview Manifest Details */}
          <div className="neu-card bg-[#111115] border border-white/[0.08] rounded-2xl p-5 flex flex-col gap-3">
            <h3 className="text-sm font-bold text-white">Preview Specification</h3>

            {previewManifest?.features && previewManifest.features.length > 0 && (
              <ul className="flex flex-col gap-1.5 text-xs text-zinc-300 list-disc pl-4 m-0">
                {previewManifest.features.map((feat) => (
                  <li key={feat}>{feat}</li>
                ))}
              </ul>
            )}

            {(previewManifest?.domain || previewManifest?.layer) && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                {previewManifest?.domain && (
                  <span className="px-2 py-0.5 rounded-md bg-[#16161c] border border-white/[0.08] text-[10px] font-mono text-sky-300">
                    {previewManifest.domain}
                  </span>
                )}
                {previewManifest?.layer && (
                  <span className="px-2 py-0.5 rounded-md bg-[#16161c] border border-white/[0.08] text-[10px] font-mono text-amber-300">
                    {previewManifest.layer}
                  </span>
                )}
              </div>
            )}

            {previewManifest?.localModels && previewManifest.localModels.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[10px] font-mono text-zinc-500 uppercase mr-1">Local Models:</span>
                {previewManifest.localModels.map((m: string) => (
                  <span key={m} className="px-2 py-0.5 rounded-md bg-[#16161c] border border-white/[0.08] text-[10px] font-mono text-emerald-300">
                    {m}
                  </span>
                ))}
              </div>
            )}

            {previewManifest?.cloudApis && previewManifest.cloudApis.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[10px] font-mono text-zinc-500 uppercase mr-1">Cloud APIs:</span>
                {previewManifest.cloudApis.map((api: string) => (
                  <span key={api} className="px-2 py-0.5 rounded-md bg-[#16161c] border border-white/[0.08] text-[10px] font-mono text-cyan-300">
                    {api}
                  </span>
                ))}
              </div>
            )}

            {previewManifest?.usedIn && previewManifest.usedIn.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[10px] font-mono text-zinc-500 uppercase mr-1">Used In:</span>
                {previewManifest.usedIn.map((app) => (
                  <span
                    key={app}
                    className="px-2 py-0.5 rounded-md bg-[#16161c] border border-white/[0.08] text-[10px] font-mono text-purple-300"
                  >
                    {app}
                  </span>
                ))}
              </div>
            )}

            {(previewManifest?.script || previewManifest?.runCommand || previewManifest?.demoCommand) && (
              <div className="flex flex-col gap-2 pt-2 border-t border-white/[0.06]">
                <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
                  Quick Run &amp; Demo
                </span>
                <div className="flex flex-col gap-1.5">
                  {(previewManifest?.runCommand || previewManifest?.script) && (
                    <div className="px-2.5 py-1.5 rounded-lg bg-[#09090c] border border-emerald-500/20 flex items-center justify-between gap-2 font-mono text-[11px]">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 text-[9px] font-bold uppercase shrink-0">
                          Script Run
                        </span>
                        <span className="text-emerald-200 truncate">
                          {previewManifest.runCommand || `python ${previewManifest.script}`}
                        </span>
                      </div>
                      <CopyButton
                        text={previewManifest.runCommand || `python ${previewManifest.script}`}
                        variant="compact"
                        label="Copy"
                      />
                    </div>
                  )}
                  {previewManifest?.demoCommand && (
                    <div className="px-2.5 py-1.5 rounded-lg bg-[#09090c] border border-sky-500/20 flex items-center justify-between gap-2 font-mono text-[11px]">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="px-1.5 py-0.5 rounded bg-sky-500/15 text-sky-300 text-[9px] font-bold uppercase shrink-0">
                          Demo Run
                        </span>
                        <span className="text-sky-200 truncate">{previewManifest.demoCommand}</span>
                      </div>
                      <CopyButton text={previewManifest.demoCommand} variant="compact" label="Copy" />
                    </div>
                  )}
                  {(previewManifest?.jsonDemoCommand || previewManifest?.demoCommand) && (
                    <div className="px-2.5 py-1.5 rounded-lg bg-[#09090c] border border-violet-500/20 flex items-center justify-between gap-2 font-mono text-[11px]">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="px-1.5 py-0.5 rounded bg-violet-500/15 text-violet-300 text-[9px] font-bold uppercase shrink-0">
                          JSON Demo
                        </span>
                        <span className="text-violet-200 truncate">
                          {previewManifest.jsonDemoCommand || `${previewManifest.demoCommand} --json`}
                        </span>
                      </div>
                      <CopyButton
                        text={previewManifest.jsonDemoCommand || `${previewManifest.demoCommand} --json`}
                        variant="compact"
                        label="Copy"
                      />
                    </div>
                  )}
                  <div className="px-2.5 py-1.5 rounded-lg bg-[#09090c] border border-amber-500/20 flex items-center justify-between gap-2 font-mono text-[11px]">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 text-[9px] font-bold uppercase shrink-0">
                        NPM
                      </span>
                      <span className="text-amber-200 truncate">npm run run / npm run demo</span>
                    </div>
                    <CopyButton text="npm run demo" variant="compact" label="Copy" />
                  </div>
                </div>
              </div>
            )}

            {previewManifest?.sampleInputs && Object.keys(previewManifest.sampleInputs).length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[10px] font-mono text-zinc-500 uppercase mr-1">Sample Inputs:</span>
                {Object.entries(previewManifest.sampleInputs).map(([k, v]) => (
                  <span
                    key={k}
                    className="px-2 py-0.5 rounded-md bg-[#16161c] border border-white/[0.08] text-[10px] font-mono text-zinc-300"
                  >
                    <span className="text-zinc-500">{k}=</span>
                    <span className="text-emerald-300">{typeof v === 'string' ? v : JSON.stringify(v)}</span>
                  </span>
                ))}
              </div>
            )}

            {previewManifest?.commands && previewManifest.commands.length > 0 && (
              <div className="flex flex-col gap-1.5 pt-1">
                <span className="text-[10px] font-mono text-zinc-500 uppercase">Commands &amp; Imports:</span>
                {previewManifest.commands.map((cmd) => (
                  <div
                    key={cmd}
                    className="px-2.5 py-1.5 rounded-lg bg-[#09090c] border border-white/[0.08] flex items-center justify-between gap-2 font-mono text-[11px]"
                  >
                    <span className="text-emerald-300 truncate">{cmd}</span>
                    <CopyButton text={cmd} variant="compact" label="Copy" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Preview Folder Files Viewer */}
          <div className="neu-card bg-[#09090c] border border-white/[0.1] rounded-2xl overflow-hidden flex flex-col">
            <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-[#111115] border-b border-white/[0.08]">
              <div className="flex items-center gap-1.5 overflow-x-auto">
                {previewFiles.map((f) => {
                  const extColor =
                    f.ext === 'py'
                      ? 'text-sky-300'
                      : f.ext === 'md'
                        ? 'text-emerald-300'
                        : 'text-amber-300';
                  return (
                    <button
                      key={f.name}
                      type="button"
                      onClick={() => setActiveFileName(f.name)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-mono border cursor-pointer flex items-center gap-1.5 ${
                        activePreviewFile?.name === f.name
                          ? 'bg-[#1a1a22] border-sky-400/40 text-white font-bold'
                          : 'bg-[#16161c] border-white/[0.08] text-zinc-400 hover:text-white'
                      }`}
                    >
                      <span className={`text-[9px] uppercase ${extColor}`}>.{f.ext}</span>
                      <span>{f.name}</span>
                    </button>
                  );
                })}
              </div>
              {activePreviewFile && (
                <CopyButton text={activePreviewFile.content} variant="compact" label="Copy File" />
              )}
            </div>
            {activePreviewFile && (
              <pre className="p-4 text-[11px] font-mono text-zinc-200 overflow-x-auto max-h-[360px] leading-relaxed m-0">
                {activePreviewFile.content}
              </pre>
            )}
          </div>
        </div>
      ) : (
        <div className="neu-card bg-[#111115] border border-white/[0.08] rounded-2xl p-6 text-xs font-mono text-zinc-400">
          No <code className="text-zinc-200">Preview/</code> folder found in{' '}
          <code className="text-purple-300">Soul-DevPortal-Packages/{pkg.id}/</code>. Add{' '}
          <code className="text-zinc-200">Preview/preview.json</code> and sample files to populate this tab.
        </div>
      )}

      {/* ── Live Design Tokens (only real data from @workspace/config) ── */}
      {pkgKey === 'config' && tokenSwatches.length > 0 && (
        <div className="neu-card bg-[#111115] border border-white/[0.08] rounded-2xl p-5 flex flex-col gap-3">
          <h3 className="text-sm font-bold text-white">Live Design Tokens (@workspace/config)</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2.5">
            {tokenSwatches.map((sw) => (
              <div
                key={sw.name}
                className="p-2.5 rounded-xl bg-[#16161c] border border-white/[0.08] flex items-center gap-2.5"
              >
                <span
                  className="w-5 h-5 rounded-md border border-white/20 shrink-0"
                  style={{ backgroundColor: sw.hex }}
                />
                <div className="min-w-0">
                  <div className="text-[11px] font-mono text-white truncate">{sw.name}</div>
                  <div className="text-[10px] font-mono text-zinc-400">{sw.hex}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
