import React from 'react';
import CodeSnippetGenerator from '../../../components/CodeSnippetGenerator';

export interface PackagePlaygroundTabProps {
  pkgId: string;
}

export default function PackagePlaygroundTab({ pkgId }: PackagePlaygroundTabProps) {
  return (
    <section className="detail-section playground-section">
      <CodeSnippetGenerator pkgId={pkgId} />
    </section>
  );
}
