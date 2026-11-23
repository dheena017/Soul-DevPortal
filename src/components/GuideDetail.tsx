import React, { useState, useEffect } from 'react';
import Markdown from './Markdown';
import TableOfContents from './TableOfContents';
import { MarkdownBlock } from '../types';

interface GuideMeta {
  id: string;
  title: string;
  breadcrumb: string;
  description: string;
}

const GUIDES: GuideMeta[] = [
  {
    id: 'design',
    title: 'Shared packages design guide',
    breadcrumb: 'Soul Workspace / Design guide',
    description: 'Repository standards for naming, structure, installation, exports, imports, and package maintenance.',
  },
  {
    id: 'ports',
    title: 'Port & Framework Architecture Guide',
    breadcrumb: 'Soul Workspace / Infrastructure & Ports',
    description: 'Monorepo port allocation matrix, frontend & backend architecture, database assignments, and AI engine integrations.',
  },
  {
    id: 'techstack',
    title: 'Tech Stack & Ecosystem Standards',
    breadcrumb: 'Soul Workspace / Tech Stack',
    description: 'Standardized technologies: Vite 8, React 19, FastAPI, TypeScript, SQLite, Tailwind CSS v4, and testing specifications.',
  },
];

export interface GuideDetailProps {
  blocks?: MarkdownBlock[];
  portGuideBlocks?: MarkdownBlock[];
  techStackBlocks?: MarkdownBlock[];
  activeGuideId?: string;
  onSelectGuide?: (id: string) => void;
}

export default function GuideDetail({
  blocks = [],
  portGuideBlocks = [],
  techStackBlocks = [],
  activeGuideId = 'design',
  onSelectGuide,
}: GuideDetailProps) {
  const [selectedGuide, setSelectedGuide] = useState<string>(activeGuideId);

  useEffect(() => {
    if (activeGuideId) setSelectedGuide(activeGuideId);
  }, [activeGuideId]);

  const handleSelect = (id: string) => {
    setSelectedGuide(id);
    if (onSelectGuide) onSelectGuide(id);
  };

  let activeBlocks = blocks;
  if (selectedGuide === 'ports' && portGuideBlocks?.length) {
    activeBlocks = portGuideBlocks;
  } else if (selectedGuide === 'techstack' && techStackBlocks?.length) {
    activeBlocks = techStackBlocks;
  }

  const guideMeta = GUIDES.find((g) => g.id === selectedGuide) || GUIDES[0];
  const headings = (activeBlocks || []).filter((block) => block.type === 'h2' || block.type === 'h3');

  return (
    <article className="w-full flex flex-col gap-6 max-w-7xl mx-auto pb-12">
      <header className="w-full bg-[#111111] border border-[#222222] rounded-2xl p-5 md:p-6 shadow-2xl shadow-black/50 flex flex-col gap-5">
        <div className="flex items-center gap-2 text-xs text-neutral-400">
          <span>{guideMeta.breadcrumb}</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">{guideMeta.title}</h1>
        <p className="text-xs md:text-sm text-neutral-400 leading-relaxed max-w-4xl">{guideMeta.description}</p>

        {/* Guides Switcher Bar */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-[#0c0c0c] border border-[#222222] rounded-xl shadow-[inset_0_1px_3px_rgba(0,0,0,0.6)]" role="tablist" aria-label="Monorepo documentation guides">
          <button
            type="button"
            role="tab"
            aria-selected={selectedGuide === 'design'}
            className={`px-3 py-1.5 rounded-lg text-xs transition-all ${
              selectedGuide === 'design'
                ? 'bg-sky-500/15 text-sky-400 font-bold border border-sky-500/40 shadow-[0_2px_8px_rgba(56,189,248,0.18),inset_0_1px_0_rgba(255,255,255,0.08)]'
                : 'text-neutral-400 hover:text-white hover:bg-[#161616] hover:border-[#262626] border border-transparent font-medium'
            }`}
            onClick={() => handleSelect('design')}
          >
            <span>📘 Shared Packages Guide</span>
          </button>
          {portGuideBlocks?.length > 0 && (
            <button
              type="button"
              role="tab"
              aria-selected={selectedGuide === 'ports'}
              className={`px-3 py-1.5 rounded-lg text-xs transition-all ${
                selectedGuide === 'ports'
                  ? 'bg-sky-500/15 text-sky-400 font-bold border border-sky-500/40 shadow-[0_2px_8px_rgba(56,189,248,0.18),inset_0_1px_0_rgba(255,255,255,0.08)]'
                  : 'text-neutral-400 hover:text-white hover:bg-[#161616] hover:border-[#262626] border border-transparent font-medium'
              }`}
              onClick={() => handleSelect('ports')}
            >
              <span>🌐 Port &amp; Architecture Guide</span>
            </button>
          )}
          {techStackBlocks?.length > 0 && (
            <button
              type="button"
              role="tab"
              aria-selected={selectedGuide === 'techstack'}
              className={`px-3 py-1.5 rounded-lg text-xs transition-all ${
                selectedGuide === 'techstack'
                  ? 'bg-sky-500/15 text-sky-400 font-bold border border-sky-500/40 shadow-[0_2px_8px_rgba(56,189,248,0.18),inset_0_1px_0_rgba(255,255,255,0.08)]'
                  : 'text-neutral-400 hover:text-white hover:bg-[#161616] hover:border-[#262626] border border-transparent font-medium'
              }`}
              onClick={() => handleSelect('techstack')}
            >
              <span>⚙️ Tech Stack Standards</span>
            </button>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] items-start gap-6">
        <TableOfContents headings={headings} title="On this page" />
        <section className="p-5 md:p-8 rounded-2xl bg-[#111111] border border-[#222222] shadow-xl overflow-hidden min-w-0">
          <Markdown blocks={activeBlocks} skipFirstHeading />
        </section>
      </div>
    </article>
  );
}
