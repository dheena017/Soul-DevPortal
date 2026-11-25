import React from 'react';
import DocsDashboard from './dashboard/DocsDashboard';
import DocDetailView from './detail/DocDetailView';
import { MarkdownBlock } from '../../types';

export interface DocsViewProps {
  blocks?: MarkdownBlock[];
  portGuideBlocks?: MarkdownBlock[];
  techStackBlocks?: MarkdownBlock[];
  projectRulesBlocks?: MarkdownBlock[];
  cheatsheetBlocks?: MarkdownBlock[];
  docsHierarchy?: any[];
  docsBlocksMap?: Record<string, MarkdownBlock[]>;
  activeGuideId?: string;
  initialSubModule?: string;
  onSelectGuide?: (id: string) => void;
  onBack?: () => void;
}

export default function DocsView({
  blocks = [],
  portGuideBlocks = [],
  techStackBlocks = [],
  projectRulesBlocks = [],
  cheatsheetBlocks = [],
  docsHierarchy,
  docsBlocksMap,
  activeGuideId = 'hub',
  initialSubModule,
  onSelectGuide,
  onBack,
}: DocsViewProps) {
  // If activeGuideId is 'hub' or 'docs' or not specified, render DocsDashboard
  if (activeGuideId === 'hub' || activeGuideId === 'docs' || !activeGuideId) {
    return (
      <DocsDashboard
        onSelectGuide={(id) => {
          if (onSelectGuide) onSelectGuide(id);
        }}
        onBackToOverview={onBack}
      />
    );
  }

  // Otherwise, render the specific Guide Detail view with back link to Docs Dashboard
  return (
    <DocDetailView
      key={activeGuideId}
      guideId={activeGuideId}
      blocks={blocks}
      portGuideBlocks={portGuideBlocks}
      techStackBlocks={techStackBlocks}
      projectRulesBlocks={projectRulesBlocks}
      cheatsheetBlocks={cheatsheetBlocks}
      docsHierarchy={docsHierarchy}
      docsBlocksMap={docsBlocksMap}
      initialSubModule={initialSubModule}
      onSelectGuide={onSelectGuide}
      onBack={() => {
        if (onBack) onBack();
        else if (onSelectGuide) onSelectGuide('hub');
      }}
    />
  );
}
