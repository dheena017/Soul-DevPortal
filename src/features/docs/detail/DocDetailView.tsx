import React, { useState, useEffect, useMemo } from 'react';
import workspaceData from 'virtual:workspace-packages';
import { MarkdownBlock } from '../../../types';
import { findGuideMeta, GuideMeta } from '../docsConstants';
import { fetchDocFileContent } from '../../../services/api';
import DocDetailHeader, { DocDetailTab } from './DocDetailHeader';
import DocSpecTab from './DocSpecTab';
import DocHighlightsTab from './DocHighlightsTab';
import DocSnippetsTab from './DocSnippetsTab';
import DocTablesTab from './DocTablesTab';

export type { DocDetailTab };

export interface DocDetailViewProps {
  key?: React.Key;
  guideId: string;
  blocks?: MarkdownBlock[];
  portGuideBlocks?: MarkdownBlock[];
  techStackBlocks?: MarkdownBlock[];
  projectRulesBlocks?: MarkdownBlock[];
  cheatsheetBlocks?: MarkdownBlock[];
  docsHierarchy?: any[];
  docsBlocksMap?: Record<string, MarkdownBlock[]>;
  initialSubModule?: string;
  onSelectGuide?: (id: string) => void;
  onBack?: () => void;
}

export default function DocDetailView({
  guideId = 'project-architecture',
  blocks = [],
  portGuideBlocks = [],
  techStackBlocks = [],
  projectRulesBlocks = [],
  cheatsheetBlocks = [],
  docsBlocksMap: propBlocksMap,
  onBack,
}: DocDetailViewProps) {
  const guideMeta: GuideMeta = findGuideMeta(guideId);
  const [activeTab, setActiveTab] = useState<DocDetailTab>('spec');

  // Merge virtual workspace blocksMap with prop blocksMap
  const effectiveBlocksMap: Record<string, MarkdownBlock[]> = useMemo(() => {
    return {
      ...((workspaceData as any)?.docsBlocksMap || {}),
      ...(propBlocksMap || {}),
    };
  }, [propBlocksMap]);

  // Fallback category blocks from virtual modules
  const fallbackMainBlocks = useMemo(() => {
    if (guideMeta.id === 'project-architecture') return projectRulesBlocks.length > 0 ? projectRulesBlocks : (workspaceData as any)?.projectRulesBlocks || [];
    if (guideMeta.id === 'cheatsheets') return cheatsheetBlocks.length > 0 ? cheatsheetBlocks : (workspaceData as any)?.cheatsheetBlocks || [];
    if (guideMeta.id === 'packages-architecture') return blocks.length > 0 ? blocks : (workspaceData as any)?.guideBlocks || [];
    if (guideMeta.id === 'networking-and-ports') return portGuideBlocks.length > 0 ? portGuideBlocks : (workspaceData as any)?.portGuideBlocks || [];
    return blocks;
  }, [guideMeta.id, projectRulesBlocks, cheatsheetBlocks, blocks, portGuideBlocks]);

  // Dynamic API fetched blocks when not present in virtual bundle
  const [apiMainBlocks, setApiMainBlocks] = useState<MarkdownBlock[] | null>(null);
  const [apiRulesBlocks, setApiRulesBlocks] = useState<MarkdownBlock[] | null>(null);
  const [isLoadingMain, setIsLoadingMain] = useState<boolean>(false);
  const [isLoadingRules, setIsLoadingRules] = useState<boolean>(false);

  // Fetch from FastAPI if blocks are missing from effectiveBlocksMap
  useEffect(() => {
    let isMounted = true;
    const mainPath = guideMeta.mainFile;
    const rulesPath = guideMeta.rulesFile;
    const hasMainLocal = Boolean(effectiveBlocksMap[mainPath]?.length || fallbackMainBlocks.length);
    const hasRulesLocal = Boolean(effectiveBlocksMap[rulesPath]?.length);

    setApiMainBlocks(null);
    setApiRulesBlocks(null);
    setIsLoadingMain(!hasMainLocal);
    setIsLoadingRules(!hasRulesLocal);

    async function loadFromBackend() {
      // Check if main blocks exist
      if (!effectiveBlocksMap[mainPath]?.length) {
        try {
          const res = await fetchDocFileContent(guideMeta.folder, 'main');
          if (res && res.blocks && res.blocks.length > 0 && isMounted) {
            setApiMainBlocks(res.blocks);
          }
        } finally {
          if (isMounted) setIsLoadingMain(false);
        }
      } else if (isMounted) {
        setIsLoadingMain(false);
      }

      // Check if rules blocks exist
      if (!effectiveBlocksMap[rulesPath]?.length) {
        try {
          const res = await fetchDocFileContent(guideMeta.folder, 'golden-rules');
          if (res && res.blocks && res.blocks.length > 0 && isMounted) {
            setApiRulesBlocks(res.blocks);
          }
        } finally {
          if (isMounted) setIsLoadingRules(false);
        }
      } else if (isMounted) {
        setIsLoadingRules(false);
      }
    }

    loadFromBackend();
    return () => {
      isMounted = false;
    };
  }, [guideMeta.folder, guideMeta.mainFile, guideMeta.rulesFile, effectiveBlocksMap, fallbackMainBlocks.length]);

  // 1. Full Specification Blocks (main.md)
  const mainBlocks: MarkdownBlock[] = useMemo(() => {
    const fromMap = effectiveBlocksMap[guideMeta.mainFile];
    if (fromMap && fromMap.length > 0) return fromMap;
    if (apiMainBlocks && apiMainBlocks.length > 0) return apiMainBlocks;
    return fallbackMainBlocks;
  }, [effectiveBlocksMap, guideMeta.mainFile, apiMainBlocks, fallbackMainBlocks]);

  // 2. Key Rules & Highlights Blocks (golden-rules.md)
  const goldenRulesBlocks: MarkdownBlock[] = useMemo(() => {
    const fromMap = effectiveBlocksMap[guideMeta.rulesFile];
    if (fromMap && fromMap.length > 0) return fromMap;
    if (apiRulesBlocks && apiRulesBlocks.length > 0) return apiRulesBlocks;
    return [];
  }, [effectiveBlocksMap, guideMeta.rulesFile, apiRulesBlocks]);

  // Headings for table of contents
  const mainHeadings = useMemo(() => {
    return mainBlocks.filter((b) => b.type === 'h2' || b.type === 'h3');
  }, [mainBlocks]);

  const rulesHeadings = useMemo(() => {
    return goldenRulesBlocks.filter((b) => b.type === 'h2' || b.type === 'h3');
  }, [goldenRulesBlocks]);

  // 3. Combined code blocks across both main.md and golden-rules.md
  const codeBlocks: MarkdownBlock[] = useMemo(() => {
    const combined = [...mainBlocks, ...goldenRulesBlocks];
    return combined.filter((b) => b.type === 'code' || b.type === 'pre');
  }, [mainBlocks, goldenRulesBlocks]);

  // 4. Combined table blocks across both main.md and golden-rules.md
  const tableBlocks: MarkdownBlock[] = useMemo(() => {
    const combined = [...mainBlocks, ...goldenRulesBlocks];
    return combined.filter((b) => b.type === 'table');
  }, [mainBlocks, goldenRulesBlocks]);

  // Dynamic header properties based on active tab
  const activeFilename = useMemo(() => {
    if (activeTab === 'spec') return guideMeta.mainFile;
    if (activeTab === 'highlights') return guideMeta.rulesFile;
    if (activeTab === 'snippets') return `${guideMeta.folder} (main.md & golden-rules.md)`;
    if (activeTab === 'tables') return `${guideMeta.folder} (main.md & golden-rules.md)`;
    return guideMeta.filename;
  }, [activeTab, guideMeta]);

  const activeBadge = useMemo(() => {
    if (activeTab === 'spec') return 'SPECIFICATION BLUEPRINT';
    if (activeTab === 'highlights') return 'GOLDEN INVARIANTS';
    if (activeTab === 'snippets') return 'CODE SNIPPETS';
    if (activeTab === 'tables') return 'TABLES & MATRICES';
    return guideMeta.badge;
  }, [activeTab, guideMeta.badge]);

  return (
    <div className="w-full flex flex-col gap-6">
      {/* ── Master Document Header with 4 Tab Controls ── */}
      <DocDetailHeader
        guideMeta={guideMeta}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        headingsCount={mainHeadings.length}
        codeBlocksCount={codeBlocks.length}
        tablesCount={tableBlocks.length}
        activeTitle={guideMeta.title}
        activeDescription={guideMeta.description}
        activeIcon={guideMeta.icon}
        activeBadge={activeBadge}
        activeFilename={activeFilename}
        activeTag={guideMeta.category.toUpperCase()}
        onBack={onBack}
      />

      {/* ── Separate Tab Panels ── */}
      <div key={activeTab} className="w-full tab-content-animate">
        {/* Tab 1: Full Specification (main.md) */}
        {activeTab === 'spec' && (
          <DocSpecTab
            headings={mainHeadings}
            finalBlocks={mainBlocks}
            guideMeta={guideMeta}
            activeTitle={`${guideMeta.title} — Full Specification`}
            activeFilename={guideMeta.mainFile}
            isLoading={isLoadingMain && mainBlocks.length === 0}
          />
        )}

        {/* Tab 2: Key Rules & Highlights (golden-rules.md) */}
        {activeTab === 'highlights' && (
          <DocHighlightsTab
            guideMeta={guideMeta}
            goldenRulesBlocks={goldenRulesBlocks}
            headings={rulesHeadings}
            activeTitle={`${guideMeta.title} — Golden Invariants & Engineering Rules`}
            activeFilename={guideMeta.rulesFile}
            isLoading={isLoadingRules && goldenRulesBlocks.length === 0}
          />
        )}

        {/* Tab 3: Code Snippets */}
        {activeTab === 'snippets' && (
          <DocSnippetsTab
            codeBlocks={codeBlocks}
            isLoading={(isLoadingMain || isLoadingRules) && codeBlocks.length === 0}
          />
        )}

        {/* Tab 4: Tables & Matrices */}
        {activeTab === 'tables' && (
          <DocTablesTab
            tables={tableBlocks}
            isLoading={(isLoadingMain || isLoadingRules) && tableBlocks.length === 0}
          />
        )}
      </div>
    </div>
  );
}
