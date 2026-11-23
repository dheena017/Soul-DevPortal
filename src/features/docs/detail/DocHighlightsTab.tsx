import React from 'react';
import { GuideMeta } from '../docsConstants';

export interface DocHighlightsTabProps {
  guideMeta: GuideMeta;
}

export default function DocHighlightsTab({ guideMeta }: DocHighlightsTabProps) {
  return (
    <section className="w-full p-5 md:p-6 rounded-2xl bg-[#111111] border border-[#222222] shadow-xl flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1f1f1f]">
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-500">KEY RULES &amp; HIGHLIGHTS</span>
          <h2 className="text-lg font-bold text-white">Mandatory Standards Checklist</h2>
        </div>
        <span className="px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-[#181818] border border-[#2c2c2c] text-neutral-300">
          {guideMeta.keyHighlights.length} rules active
        </span>
      </div>

      {/* Top Audience & Compliance Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col p-4 rounded-xl bg-[#0e0e0e] border border-[#202020] gap-2">
          <div className="flex items-center gap-2">
            <span className="text-base">🎯</span>
            <h3 className="text-xs font-bold text-white">Target Audience</h3>
          </div>
          <p className="text-xs text-neutral-400 leading-relaxed">
            {guideMeta.targetAudience}
          </p>
        </div>

        <div className="flex flex-col p-4 rounded-xl bg-[#0e0e0e] border border-[#202020] gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-base">🛡️</span>
              <h3 className="text-xs font-bold text-white">Compliance Mandate</h3>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
              Enforced
            </span>
          </div>
          <p className="text-xs text-emerald-400 leading-relaxed font-medium">
            {guideMeta.complianceStatus}
          </p>
        </div>
      </div>

      {/* Key Highlights Checklist Card */}
      <div className="flex flex-col gap-3 pt-2">
        <div className="flex items-center gap-2 pb-1">
          <span className="text-xs font-bold text-white">Authoritative Rules Checklist</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {guideMeta.keyHighlights.map((hl, idx) => (
            <div key={idx} className="flex items-start gap-3 p-3.5 rounded-xl bg-[#0e0e0e] border border-[#1f1f1f]">
              <span className="w-5 h-5 rounded-full bg-sky-500/10 border border-sky-500/25 text-sky-400 flex items-center justify-center text-xs shrink-0 mt-0.5">
                ✓
              </span>
              <div className="flex flex-col gap-0.5">
                <strong className="text-xs font-bold text-white">Rule #{idx + 1}</strong>
                <p className="text-xs text-neutral-300 leading-relaxed">{hl}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
