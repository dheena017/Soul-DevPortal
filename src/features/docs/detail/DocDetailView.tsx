import React, { useState, useEffect } from 'react';
import { MarkdownBlock } from '../../../types';
import { DOCUMENTATION_GUIDES_REGISTRY, GuideMeta } from '../docsConstants';
import { fetchGuideContent } from '../../../services/api';
import DocDetailHeader, { DocDetailTab } from './DocDetailHeader';
import DocSpecTab from './DocSpecTab';
import DocHighlightsTab from './DocHighlightsTab';
import DocSnippetsTab from './DocSnippetsTab';
import DocTablesTab from './DocTablesTab';

export type { DocDetailTab };

export interface DocDetailViewProps {
  guideId: string;
  blocks?: MarkdownBlock[];
  portGuideBlocks?: MarkdownBlock[];
  techStackBlocks?: MarkdownBlock[];
  projectRulesBlocks?: MarkdownBlock[];
  cheatsheetBlocks?: MarkdownBlock[];
  onSelectGuide?: (id: string) => void;
  onBack?: () => void;
}

export default function DocDetailView({
  guideId = 'rules',
  blocks = [],
  portGuideBlocks = [],
  techStackBlocks = [],
  projectRulesBlocks = [],
  cheatsheetBlocks = [],
  onBack,
}: DocDetailViewProps) {
  const guideMeta: GuideMeta =
    DOCUMENTATION_GUIDES_REGISTRY.find(
      (g) => g.id === guideId || g.slug === guideId || g.category === guideId
    ) || DOCUMENTATION_GUIDES_REGISTRY[0];

  const resolvedId = guideMeta.id;
  const [activeTab, setActiveTab] = useState<DocDetailTab>('spec');

  let activeBlocks: MarkdownBlock[] = [];
  if (resolvedId === 'rules') {
    activeBlocks = projectRulesBlocks && projectRulesBlocks.length > 0 ? projectRulesBlocks : [];
  } else if (resolvedId === 'cheatsheet') {
    activeBlocks = cheatsheetBlocks && cheatsheetBlocks.length > 0 ? cheatsheetBlocks : [];
  } else if (resolvedId === 'design') {
    activeBlocks = blocks && blocks.length > 0 ? blocks : [];
  } else if (resolvedId === 'ports') {
    activeBlocks = portGuideBlocks && portGuideBlocks.length > 0 ? portGuideBlocks : [];
  } else if (resolvedId === 'techstack') {
    activeBlocks = techStackBlocks && techStackBlocks.length > 0 ? techStackBlocks : [];
  }

  if (!activeBlocks.length) {
    if (resolvedId === 'rules') activeBlocks = projectRulesBlocks || [];
    else if (resolvedId === 'cheatsheet') activeBlocks = cheatsheetBlocks || [];
    else if (resolvedId === 'ports') activeBlocks = portGuideBlocks || [];
    else if (resolvedId === 'techstack') activeBlocks = techStackBlocks || [];
    else activeBlocks = blocks || [];
  }

  const [apiBlocks, setApiBlocks] = useState<MarkdownBlock[] | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadGuide() {
      if (activeBlocks && activeBlocks.length > 0) return;
      const guideData = await fetchGuideContent(resolvedId);
      if (guideData && guideData.blocks && guideData.blocks.length > 0 && isMounted) {
        setApiBlocks(guideData.blocks);
      }
    }
    loadGuide();
    return () => {
      isMounted = false;
    };
  }, [resolvedId, activeBlocks.length]);

  const finalBlocks = apiBlocks && apiBlocks.length > 0 ? apiBlocks : activeBlocks;
  const headings = useMemo(
    () => (finalBlocks || []).filter((b) => b.type === 'h2' || b.type === 'h3'),
    [finalBlocks]
  );
  const codeBlocks = useMemo(
    () => (finalBlocks || []).filter((b) => b.type === 'code'),
    [finalBlocks]
  );
  const tables = useMemo(
    () => (finalBlocks || []).filter((b) => b.type === 'table'),
    [finalBlocks]
  );

  return (
    <article className="w-full flex flex-col gap-6 max-w-7xl mx-auto pb-12">
      {/* ── Main Hero Header & Tabs Bar ── */}
      <DocDetailHeader
        guideMeta={guideMeta}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        headingsCount={headings.length}
        codeBlocksCount={codeBlocks.length}
        tablesCount={tables.length}
        onBack={onBack}
      />

      {/* ── Separate Tab Panels with Smooth Motion ── */}
      <div key={activeTab} className="w-full tab-content-animate">
        {activeTab === 'spec' && (
          <DocSpecTab headings={headings} finalBlocks={finalBlocks} guideMeta={guideMeta} />
        )}

        {activeTab === 'highlights' && (
          <DocHighlightsTab guideMeta={guideMeta} />
        )}

        {activeTab === 'snippets' && (
          <DocSnippetsTab codeBlocks={codeBlocks} />
        )}

        {activeTab === 'tables' && (
          <DocTablesTab tables={tables} />
        )}
      </div>
    </article>
  );
}
