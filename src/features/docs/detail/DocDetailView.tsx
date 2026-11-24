import React, { useState, useEffect, useMemo } from 'react';
import workspaceData from 'virtual:workspace-packages';
import { MarkdownBlock } from '../../../types';
import { DOCUMENTATION_GUIDES_REGISTRY, DOCS_SUBMODULES_MAP, GuideMeta, SubModuleDoc } from '../docsConstants';
import { fetchGuideContent, fetchDocTabContent, fetchDocFileContent } from '../../../services/api';
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
  docsHierarchy?: any[];
  docsBlocksMap?: Record<string, MarkdownBlock[]>;
  initialSubModule?: string;
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
  docsBlocksMap: propBlocksMap,
  initialSubModule,
  onBack,
}: DocDetailViewProps) {
  const guideMeta: GuideMeta =
    DOCUMENTATION_GUIDES_REGISTRY.find(
      (g) => g.id === guideId || g.slug === guideId || g.category === guideId
    ) || DOCUMENTATION_GUIDES_REGISTRY[0];

  const resolvedId = guideMeta.id;
  const [activeTab, setActiveTab] = useState<DocDetailTab>('spec');

  // Available sub-modules for this documentation category
  const subModules: SubModuleDoc[] = useMemo(() => {
    return DOCS_SUBMODULES_MAP[resolvedId] || [];
  }, [resolvedId]);

  // Determine initial active sub-module
  const defaultSubModuleId = useMemo(() => {
    if (initialSubModule && subModules.some((sm) => sm.id === initialSubModule)) {
      return initialSubModule;
    }
    return subModules[0]?.id || 'golden-rules';
  }, [initialSubModule, subModules]);

  const [selectedSubModuleId, setSelectedSubModuleId] = useState<string>(defaultSubModuleId);
  const [selectedDocTab, setSelectedDocTab] = useState<'main' | 'rules' | 'both'>('main');

  // Reset selected sub-module when guideId changes
  useEffect(() => {
    setSelectedSubModuleId(defaultSubModuleId);
    setSelectedDocTab('main');
  }, [resolvedId, defaultSubModuleId]);

  const currentSubModule = useMemo(() => {
    return subModules.find((sm) => sm.id === selectedSubModuleId) || subModules[0];
  }, [subModules, selectedSubModuleId]);

  // Merge virtual workspace blocksMap with prop blocksMap
  const effectiveBlocksMap: Record<string, MarkdownBlock[]> = useMemo(() => {
    return {
      ...((workspaceData as any)?.docsBlocksMap || {}),
      ...(propBlocksMap || {}),
    };
  }, [propBlocksMap]);

  // Dynamic API fetched blocks state when a file isn't in effectiveBlocksMap
  const [apiFetchedBlocks, setApiFetchedBlocks] = useState<MarkdownBlock[] | null>(null);

  // Fallback category blocks
  const fallbackCategoryBlocks = useMemo(() => {
    if (resolvedId === 'rules') return projectRulesBlocks.length > 0 ? projectRulesBlocks : (workspaceData as any)?.projectRulesBlocks || [];
    if (resolvedId === 'cheatsheet') return cheatsheetBlocks.length > 0 ? cheatsheetBlocks : (workspaceData as any)?.cheatsheetBlocks || [];
    if (resolvedId === 'design') return blocks.length > 0 ? blocks : (workspaceData as any)?.guideBlocks || [];
    if (resolvedId === 'ports') return portGuideBlocks.length > 0 ? portGuideBlocks : (workspaceData as any)?.portGuideBlocks || [];
    if (resolvedId === 'techstack') return techStackBlocks.length > 0 ? techStackBlocks : (workspaceData as any)?.techStackBlocks || [];
    return blocks;
  }, [resolvedId, projectRulesBlocks, cheatsheetBlocks, blocks, portGuideBlocks, techStackBlocks]);

  // Resolve final blocks based on selected sub-module & tab
  const resolvedBlocks: MarkdownBlock[] = useMemo(() => {
    if (!currentSubModule) return fallbackCategoryBlocks;

    // Mode 1: All Sub-Modules compiled continuous view
    if (currentSubModule.id === 'all') {
      const compiled: MarkdownBlock[] = [];
      const contentModules = subModules.filter((sm) => sm.id !== 'all' && sm.id !== 'readme');

      for (const sm of contentModules) {
        compiled.push({
          type: 'h2',
          text: `${sm.icon} ${sm.title}`,
        });
        if (sm.description) {
          compiled.push({
            type: 'quote',
            text: sm.description,
          });
        }

        if (sm.isTopic) {
          const mainBlocks = effectiveBlocksMap[sm.mainRelativePath || ''] || [];
          if (mainBlocks.length > 0) {
            compiled.push(...mainBlocks.filter((b) => b.type !== 'h1'));
          }
          const rulesBlocks = effectiveBlocksMap[sm.rulesRelativePath || ''] || [];
          if (rulesBlocks.length > 0) {
            compiled.push({
              type: 'h3',
              text: `${sm.shortTitle} — Inviolable Rules & Constraints`,
            });
            compiled.push(...rulesBlocks.filter((b) => b.type !== 'h1'));
          }
        } else if (sm.relativePath) {
          const fileBlocks = effectiveBlocksMap[sm.relativePath] || [];
          if (fileBlocks.length > 0) {
            compiled.push(...fileBlocks.filter((b) => b.type !== 'h1'));
          }
        }
      }

      if (compiled.length > 0) return compiled;
      return fallbackCategoryBlocks;
    }

    // Mode 2: Topic folder with main.md and rules.md
    if (currentSubModule.isTopic) {
      const mainPath = currentSubModule.mainRelativePath || '';
      const rulesPath = currentSubModule.rulesRelativePath || '';

      const mainBlocks = effectiveBlocksMap[mainPath] || [];
      const rulesBlocks = effectiveBlocksMap[rulesPath] || [];

      if (selectedDocTab === 'main') {
        if (mainBlocks.length > 0) return mainBlocks;
      } else if (selectedDocTab === 'rules') {
        if (rulesBlocks.length > 0) return rulesBlocks;
      } else if (selectedDocTab === 'both') {
        if (mainBlocks.length > 0 || rulesBlocks.length > 0) {
          return [
            ...mainBlocks,
            { type: 'h2', text: `${currentSubModule.shortTitle} — Mandatory Rules & Constraints` },
            ...rulesBlocks.filter((b) => b.type !== 'h1'),
          ];
        }
      }
    }

    // Mode 3: Specific root file (golden-rules, README, etc.)
    if (currentSubModule.relativePath) {
      const fileBlocks = effectiveBlocksMap[currentSubModule.relativePath];
      if (fileBlocks && fileBlocks.length > 0) {
        return fileBlocks;
      }
    }

    // Fallback if not in blocks map
    if (apiFetchedBlocks && apiFetchedBlocks.length > 0) {
      return apiFetchedBlocks;
    }

    return fallbackCategoryBlocks;
  }, [currentSubModule, subModules, selectedDocTab, effectiveBlocksMap, apiFetchedBlocks, fallbackCategoryBlocks]);

  // Fetch from FastAPI if blocks were missing
  useEffect(() => {
    let isMounted = true;
    async function loadFromBackend() {
      if (!currentSubModule || currentSubModule.id === 'all') return;

      const targetPath = currentSubModule.isTopic
        ? (selectedDocTab === 'rules' ? currentSubModule.rulesRelativePath : currentSubModule.mainRelativePath)
        : currentSubModule.relativePath;

      if (targetPath && effectiveBlocksMap[targetPath]?.length) {
        setApiFetchedBlocks(null);
        return;
      }

      // Fetch tab or file content
      if (currentSubModule.isTopic && currentSubModule.topicDir) {
        const cat = resolvedId === 'rules' ? '01-project-architecture' : '01-project-architecture';
        const tab = selectedDocTab === 'rules' ? 'rules' : 'main';
        const res = await fetchDocTabContent(cat, currentSubModule.topicDir, tab);
        if (res && res.blocks && res.blocks.length > 0 && isMounted) {
          setApiFetchedBlocks(res.blocks);
        }
      } else if (currentSubModule.relativePath) {
        const parts = currentSubModule.relativePath.split('/');
        const cat = parts[0];
        const docName = parts[parts.length - 1].replace('.md', '');
        const res = await fetchDocFileContent(cat, docName);
        if (res && res.blocks && res.blocks.length > 0 && isMounted) {
          setApiFetchedBlocks(res.blocks);
        }
      }
    }

    loadFromBackend();
    return () => {
      isMounted = false;
    };
  }, [currentSubModule, selectedDocTab, resolvedId, effectiveBlocksMap]);

  const finalBlocks = resolvedBlocks;

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

  // Active document path for breadcrumb and spec header
  const activeFilename = useMemo(() => {
    if (!currentSubModule) return guideMeta.filename;
    if (currentSubModule.id === 'all') return '01-project-architecture/* (All Modules)';
    if (currentSubModule.isTopic) {
      if (selectedDocTab === 'rules') return currentSubModule.rulesRelativePath || guideMeta.filename;
      if (selectedDocTab === 'both') return `${currentSubModule.topicDir}/(main.md + rules.md)`;
      return currentSubModule.mainRelativePath || guideMeta.filename;
    }
    return currentSubModule.relativePath || guideMeta.filename;
  }, [currentSubModule, selectedDocTab, guideMeta.filename]);

  return (
    <article className="w-full flex flex-col gap-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-200">
      {/* ── Main Hero Header ── */}
      <DocDetailHeader
        guideMeta={guideMeta}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        headingsCount={headings.length}
        codeBlocksCount={codeBlocks.length}
        tablesCount={tables.length}
        activeTitle={currentSubModule?.title}
        activeDescription={currentSubModule?.description}
        activeIcon={currentSubModule?.icon}
        activeBadge={currentSubModule?.tag}
        activeFilename={activeFilename}
        activeTag={currentSubModule?.isTopic ? (selectedDocTab === 'rules' ? 'RULES & INVARIANTS' : selectedDocTab === 'both' ? 'SPEC + RULES' : 'TECHNICAL SPEC') : undefined}
        onBack={onBack}
      />

      {/* ── Sub-Module / Architectural Topics Navigator Bar ── */}
      {subModules.length > 0 && (
        <nav
          className="w-full bg-[#111115] border border-white/[0.08] rounded-2xl p-4 shadow-xl flex flex-col gap-3"
          aria-label="Architectural Sub-Modules & Topics"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 pb-2.5 border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-400"></span>
              </span>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-300">
                ARCHITECTURAL SUB-MODULES &amp; SPECIFICATIONS ({subModules.length})
              </span>
              <span className="hidden sm:inline text-xs text-zinc-500 font-mono">
                — Select any architectural domain to inspect specifications &amp; invariants
              </span>
            </div>

            {/* Document Type Switcher (When active sub-module has main.md + rules.md) */}
            {currentSubModule?.isTopic && (
              <div className="inline-flex items-center gap-1 p-1 bg-[#09090c] border border-white/[0.08] rounded-xl shadow-inner">
                <button
                  type="button"
                  onClick={() => setSelectedDocTab('main')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    selectedDocTab === 'main'
                      ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-sm font-bold'
                      : 'text-zinc-400 hover:text-white hover:bg-white/[0.04] border border-transparent'
                  }`}
                  title="View Technical Specification (main.md)"
                >
                  <span>📘</span>
                  <span>Specification</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedDocTab('rules')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    selectedDocTab === 'rules'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm font-bold'
                      : 'text-zinc-400 hover:text-white hover:bg-white/[0.04] border border-transparent'
                  }`}
                  title="View Mandatory Rules & Invariants (rules.md)"
                >
                  <span>⚠️</span>
                  <span>Rules &amp; Invariants</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedDocTab('both')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    selectedDocTab === 'both'
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm font-bold'
                      : 'text-zinc-400 hover:text-white hover:bg-white/[0.04] border border-transparent'
                  }`}
                  title="View Both Combined"
                >
                  <span>📑</span>
                  <span>Both</span>
                </button>
              </div>
            )}
          </div>

          {/* Horizontal Scrolling Pill Selector */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-thin scrollbar-thumb-zinc-700">
            {subModules.map((sm) => {
              const isSelected = sm.id === selectedSubModuleId;
              return (
                <button
                  key={sm.id}
                  type="button"
                  onClick={() => setSelectedSubModuleId(sm.id)}
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold shrink-0 transition-all cursor-pointer select-none ${
                    isSelected
                      ? 'bg-zinc-800 text-white border border-white/25 shadow-lg scale-[1.02]'
                      : 'bg-[#16161c] text-zinc-400 border border-white/[0.06] hover:text-white hover:border-white/[0.15] hover:bg-white/[0.04]'
                  }`}
                  title={sm.description}
                >
                  <span className="text-sm shrink-0">{sm.icon}</span>
                  <span className="whitespace-nowrap">{sm.shortTitle}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider ${
                      isSelected ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30' : 'bg-[#09090c] text-zinc-500 border border-white/[0.04]'
                    }`}
                  >
                    {sm.tag}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>
      )}

      {/* ── Separate Tab Panels with Smooth Motion ── */}
      <div key={`${activeTab}-${selectedSubModuleId}-${selectedDocTab}`} className="w-full tab-content-animate">
        {activeTab === 'spec' && (
          <DocSpecTab
            headings={headings}
            finalBlocks={finalBlocks}
            guideMeta={guideMeta}
            activeTitle={currentSubModule?.title}
            activeFilename={activeFilename}
          />
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
