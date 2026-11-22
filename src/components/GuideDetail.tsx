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
    description: 'Standardized technologies: Vite, Next.js, FastAPI, TypeScript, SQLite, Tailwind CSS, and testing specifications.',
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
    <article className="guide-detail-view">
      <header className="detail-header">
        <div className="breadcrumb">{guideMeta.breadcrumb}</div>
        <h1>{guideMeta.title}</h1>
        <p className="detail-description">{guideMeta.description}</p>

        {/* Guides Switcher Bar */}
        <div className="guides-switcher-row" role="tablist" aria-label="Monorepo documentation guides">
          <button
            type="button"
            role="tab"
            aria-selected={selectedGuide === 'design'}
            className={`guide-tab-btn ${selectedGuide === 'design' ? 'active' : ''}`}
            onClick={() => handleSelect('design')}
          >
            <span>📘 Shared Packages Guide</span>
          </button>
          {portGuideBlocks?.length > 0 && (
            <button
              type="button"
              role="tab"
              aria-selected={selectedGuide === 'ports'}
              className={`guide-tab-btn ${selectedGuide === 'ports' ? 'active' : ''}`}
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
              className={`guide-tab-btn ${selectedGuide === 'techstack' ? 'active' : ''}`}
              onClick={() => handleSelect('techstack')}
            >
              <span>⚙️ Tech Stack Standards</span>
            </button>
          )}
        </div>
      </header>

      <div className="package-document-layout">
        <TableOfContents headings={headings} title="On this page" />
        <section className="detail-section readme-section">
          <div className="markdown-content">
            <Markdown blocks={activeBlocks} skipFirstHeading />
          </div>
        </section>
      </div>
    </article>
  );
}
