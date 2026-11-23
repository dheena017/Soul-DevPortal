import React from 'react';
import Markdown from '../../../components/Markdown';
import { MarkdownBlock } from '../../../types';

export interface DocTablesTabProps {
  tables: MarkdownBlock[];
}

export default function DocTablesTab({ tables }: DocTablesTabProps) {
  return (
    <div className="doc-tables-tab" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '14px 18px',
          borderRadius: '8px',
          background: '#131313',
          border: '1px solid #242424',
        }}
      >
        <span style={{ fontSize: '13px', color: '#94a3b8' }}>
          Extracted <strong style={{ color: '#ffffff' }}>{tables.length}</strong> structured specification tables and matrices from this guide.
        </span>
      </div>

      {tables.length > 0 ? (
        <div className="markdown-content" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <Markdown blocks={tables} />
        </div>
      ) : (
        <div
          style={{
            padding: '40px 20px',
            textAlign: 'center',
            borderRadius: '8px',
            background: '#131313',
            border: '1px solid #242424',
            color: '#94a3b8',
          }}
        >
          No structured tables found in this guide specification.
        </div>
      )}
    </div>
  );
}
