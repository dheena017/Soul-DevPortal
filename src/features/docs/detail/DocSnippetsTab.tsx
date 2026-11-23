import React from 'react';
import Markdown from '../../../components/Markdown';
import { MarkdownBlock } from '../../../types';

export interface DocSnippetsTabProps {
  codeBlocks: MarkdownBlock[];
}

export default function DocSnippetsTab({ codeBlocks }: DocSnippetsTabProps) {
  return (
    <section className="detail-section doc-snippets-section">
      <div className="section-heading">
        <div>
          <span className="section-kicker">CODE EXAMPLES</span>
          <h2>Extracted Implementation Snippets</h2>
        </div>
        <span className="group-badge">{codeBlocks.length} snippets</span>
      </div>

      {codeBlocks.length > 0 ? (
        <div className="markdown-content" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <Markdown blocks={codeBlocks} />
        </div>
      ) : (
        <div className="empty-tab-box">
          <p>No dedicated code snippets found in this guide specification.</p>
        </div>
      )}
    </section>
  );
}
