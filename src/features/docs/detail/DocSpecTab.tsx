import React from 'react';
import Markdown from '../../../components/Markdown';
import TableOfContents from '../../../components/TableOfContents';
import { MarkdownBlock } from '../../../types';
import { GuideMeta } from '../docsConstants';

export interface DocSpecTabProps {
  headings: MarkdownBlock[];
  finalBlocks: MarkdownBlock[];
  guideMeta: GuideMeta;
}

export default function DocSpecTab({ headings, finalBlocks, guideMeta }: DocSpecTabProps) {
  return (
    <div className="package-document-layout doc-document-layout">
      <TableOfContents headings={headings} title="On this page" />
      <section className="detail-section readme-section">
        <div className="section-heading readme-heading">
          <div>
            <span className="section-kicker">DOCUMENTATION SPECIFICATION</span>
            <h2>{guideMeta.title}</h2>
          </div>
          <span className="readme-source">Soul-DevPortal-Docs/{guideMeta.filename}</span>
        </div>
        <div className="markdown-content">
          <Markdown blocks={finalBlocks || []} skipFirstHeading />
        </div>
      </section>
    </div>
  );
}
