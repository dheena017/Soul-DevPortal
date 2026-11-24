import React, { useState, useEffect, useMemo } from 'react';
import { PackageData } from '../../../types';
import { fetchPackageTab } from '../../../services/api';
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
  const [tabData, setTabData] = useState<Record<string, any>>({});

  useEffect(() => {
    let isMounted = true;
    const tabNames: PackageDetailTab[] = ['docs', 'api', 'manifest', 'playground'];

    // Preload all tabs concurrently so exports and manifest tabs have live data
    tabNames.forEach(async (tab) => {
      try {
        const data = await fetchPackageTab(pkg.id, tab);
        if (data && isMounted) {
          setTabData((prev) => ({ ...prev, [tab]: data }));
        }
      } catch {
        // Fallback to static props
      }
    });

    return () => {
      isMounted = false;
    };
  }, [pkg.id]);

  const livePkg = useMemo(() => {
    const updated = { ...pkg };
    if (tabData.docs?.blocks && tabData.docs.blocks.length > 0) {
      updated.readmeBlocks = tabData.docs.blocks;
    }
    if (tabData.api?.symbols && tabData.api.symbols.length > 0) {
      const symbols = tabData.api.symbols;
      const pySyms = symbols.filter((s: any) => s.language === 'python').map((s: any) => s.name);
      const tsSyms = symbols.filter((s: any) => s.language === 'typescript').map((s: any) => s.name);
      if (pySyms.length > 0) updated.pythonExports = pySyms;
      if (tsSyms.length > 0) updated.typeScriptExports = tsSyms;
    }
    if (tabData.manifest?.npmManifest) {
      updated.scripts = tabData.manifest.npmManifest.scripts || updated.scripts;
    }
    return updated;
  }, [pkg, tabData]);

  const headings = useMemo(
    () => (livePkg.readmeBlocks || []).filter((block) => block.type === 'h2' || block.type === 'h3'),
    [livePkg.readmeBlocks]
  );
  const totalExports = (livePkg.exports || []).length + (livePkg.pythonExports || []).length + (livePkg.typeScriptExports || []).length;

  return (
    <article className="w-full flex flex-col gap-6 max-w-7xl mx-auto pb-12">
      {/* ── Main Hero Header & Tabs Bar ── */}
      <PackageDetailHeader
        pkg={livePkg}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        totalExports={totalExports}
        onBack={onBack}
      />

      {/* ── Separate Tab Panels with Smooth Motion ── */}
      <div key={activeTab} className="w-full tab-content-animate">
        {activeTab === 'docs' && (
          <PackageDocsTab pkg={livePkg} headings={headings} />
        )}

        {activeTab === 'api' && (
          <PackageApiTab pkg={livePkg} />
        )}

        {activeTab === 'playground' && (
          <PackagePlaygroundTab pkgId={livePkg.id} pkg={livePkg} />
        )}

        {activeTab === 'manifest' && (
          <PackageManifestTab pkg={livePkg} />
        )}
      </div>
    </article>
  );
}
