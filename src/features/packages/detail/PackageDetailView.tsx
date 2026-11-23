import React, { useState } from 'react';
import { PackageData } from '../../../types';
import PackageDetailHeader, { PackageDetailTab } from './PackageDetailHeader';
import PackageDocsTab from './PackageDocsTab';
import PackageApiTab from './PackageApiTab';
import PackagePlaygroundTab from './PackagePlaygroundTab';
import PackageManifestTab from './PackageManifestTab';

export type { PackageDetailTab };

export interface PackageDetailViewProps {
  key?: React.Key;
  pkg: PackageData;
  onBack?: () => void;
}

export default function PackageDetailView({ pkg, onBack }: PackageDetailViewProps) {
  const [activeTab, setActiveTab] = useState<PackageDetailTab>('docs');
  const headings = (pkg.readmeBlocks || []).filter((block) => block.type === 'h2' || block.type === 'h3');
  const totalExports = (pkg.exports || []).length + (pkg.pythonExports || []).length + (pkg.typeScriptExports || []).length;

  return (
    <article className="w-full flex flex-col gap-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-300">
      {/* ── Main Hero Header & Tabs Bar ── */}
      <PackageDetailHeader
        pkg={pkg}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        totalExports={totalExports}
        onBack={onBack}
      />

      {/* ── Separate Tab Panels with Smooth Motion ── */}
      <div key={activeTab} className="w-full tab-content-animate">
        {activeTab === 'docs' && (
          <PackageDocsTab pkg={pkg} headings={headings} />
        )}

        {activeTab === 'api' && (
          <PackageApiTab pkg={pkg} />
        )}

        {activeTab === 'playground' && (
          <PackagePlaygroundTab pkgId={pkg.id} />
        )}

        {activeTab === 'manifest' && (
          <PackageManifestTab pkg={pkg} />
        )}
      </div>
    </article>
  );
}
