import React from 'react';
import Markdown from '../../../components/Markdown';
import { MarkdownBlock } from '../../../types';

export interface DocTablesTabProps {
  tables: MarkdownBlock[];
}

export default function DocTablesTab({ tables }: DocTablesTabProps) {
  return (
    <section className="detail-section doc-tables-section">
      <div className="section-heading">
        <div>
          <span className="section-kicker">SPECIFICATION TABLES</span>
          <h2>Extracted Matrices &amp; Schema Tables</h2>
        </div>
        <span className="group-badge">{tables.length} tables</span>
      </div>

      {tables.length > 0 ? (
        <div className="markdown-content" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <Markdown blocks={tables} />
        </div>
      ) : (
        <div className="empty-tab-box">
          <p>No structured tables found in this guide specification.</p>
        </div>
      )}
    </section>
  );
}
