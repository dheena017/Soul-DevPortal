import React, { useMemo } from 'react';
import Markdown from '../../../components/Markdown';
import TableOfContents from '../../../components/TableOfContents';
import { ProjectData } from '../../../types';

export interface ProjectReadmeTabProps {
  project: ProjectData;
}

export default function ProjectReadmeTab({ project }: ProjectReadmeTabProps) {
  const blocks = project.readmeBlocks || [];
  const headings = useMemo(
    () => blocks.filter((block) => block.type === 'h2' || block.type === 'h3'),
    [blocks]
  );

  if (blocks.length === 0) {
    return null;
  }

  return (
    <div className="package-document-layout doc-document-layout">
      {headings.length > 0 && (
        <TableOfContents headings={headings} title="On this page" />
      )}
      <section className="detail-section readme-section">
        <div className="section-heading readme-heading">
          <div>
            <span className="section-kicker">REFERENCE</span>
            <h2>Project README.md</h2>
          </div>
          <span className="readme-source">Soul-DevPortal-Projects/{project.id}/README.md</span>
        </div>
        <div className="markdown-content">
          <Markdown blocks={blocks} skipFirstHeading />
        </div>
      </section>
    </div>
  );
}
