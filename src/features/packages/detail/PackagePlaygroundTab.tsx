import React from 'react';
import CodeSnippetGenerator from '../../../components/CodeSnippetGenerator';

export interface PackagePlaygroundTabProps {
  pkgId: string;
}

export default function PackagePlaygroundTab({ pkgId }: PackagePlaygroundTabProps) {
  return (
    <section className="detail-section playground-section">
      <div className="section-heading">
        <div>
          <span className="section-kicker">INTEGRATION PLAYGROUND</span>
          <h2>Interactive Code Snippet Generator</h2>
        </div>
      </div>
      <CodeSnippetGenerator pkgId={pkgId} />
    </section>
  );
}
