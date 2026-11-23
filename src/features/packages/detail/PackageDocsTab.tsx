import React from 'react';
import Markdown from '../../../components/Markdown';
import TableOfContents from '../../../components/TableOfContents';
import { PackageData, MarkdownBlock } from '../../../types';

export interface PackageDocsTabProps {
  pkg: PackageData;
  headings: MarkdownBlock[];
}

export default function PackageDocsTab({ pkg, headings }: PackageDocsTabProps) {
  return (
    <div className="package-document-layout">
      <TableOfContents headings={headings} title="On this page" />
      <section className="detail-section readme-section">
        <div className="section-heading readme-heading">
          <div>
            <span className="section-kicker">REFERENCE</span>
            <h2>Package documentation</h2>
          </div>
          <span className="readme-source">README.md</span>
        </div>
        <div className="markdown-content">
          <Markdown blocks={pkg.readmeBlocks || []} skipFirstHeading />
        </div>
      </section>
    </div>
  );
}
