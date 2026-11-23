import React from 'react';
import CodeSnippetGenerator from '../../../components/CodeSnippetGenerator';

export interface PackagePlaygroundTabProps {
  pkgId: string;
}

export default function PackagePlaygroundTab({ pkgId }: PackagePlaygroundTabProps) {
  return (
    <section className="w-full p-5 md:p-6 rounded-2xl bg-[#111111] border border-[#222222] shadow-xl flex flex-col gap-5">
      <div className="flex flex-col gap-0.5 pb-3 border-b border-[#1f1f1f]">
        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-500">INTEGRATION PLAYGROUND</span>
        <h2 className="text-lg font-bold text-white">Interactive Code Snippet Generator</h2>
      </div>
      <CodeSnippetGenerator pkgId={pkgId} />
    </section>
  );
}
