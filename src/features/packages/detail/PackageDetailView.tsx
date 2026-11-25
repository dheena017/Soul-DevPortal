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
  const [loadingTabs, setLoadingTabs] = useState<Record<PackageDetailTab, boolean>>({
    docs: true,
    api: true,
    manifest: true,
    playground: true,
  });

  useEffect(() => {
    let isMounted = true;
    const tabNames: PackageDetailTab[] = ['docs', 'api', 'manifest', 'playground'];

    setTabData({});
    setLoadingTabs({ docs: true, api: true, manifest: true, playground: true });

    // Preload all tabs concurrently so exports, docs, and manifests always resolve
    tabNames.forEach(async (tab) => {
      try {
        const data = await fetchPackageTab(pkg.id, tab);
        if (data && isMounted) {
          setTabData((prev) => ({ ...prev, [tab]: data }));
        }
      } catch {
        // Fallback to static props
      } finally {
        if (isMounted) {
          setLoadingTabs((prev) => ({ ...prev, [tab]: false }));
        }
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
      const pySyms: string[] = Array.from(
        new Set(symbols.filter((s: any) => s.language === 'python').map((s: any) => String(s.name)))
      );
      const tsSyms: string[] = Array.from(
        new Set(symbols.filter((s: any) => s.language === 'typescript').map((s: any) => String(s.name)))
      );
      if (pySyms.length > 0) updated.pythonExports = pySyms;
      if (tsSyms.length > 0) updated.typeScriptExports = tsSyms;
    }
    const manifestPayload = tabData.manifest;
    if (manifestPayload) {
      const npmManifest = manifestPayload.npmManifest || manifestPayload.manifests?.npm;
      const pyManifest = manifestPayload.pythonManifest || manifestPayload.manifests?.python;
      if (npmManifest?.scripts && Object.keys(npmManifest.scripts).length > 0) {
        updated.scripts = npmManifest.scripts;
      }
      if (npmManifest?.exports && typeof npmManifest.exports === 'object') {
        updated.exports = Object.keys(npmManifest.exports);
      } else if (manifestPayload.exports?.length > 0) {
        updated.exports = manifestPayload.exports;
      }
      if (manifestPayload.dependencies && Object.keys(manifestPayload.dependencies).length > 0) {
        updated.dependencies = manifestPayload.dependencies;
      }
      if (manifestPayload.devDependencies && Object.keys(manifestPayload.devDependencies).length > 0) {
        updated.devDependencies = manifestPayload.devDependencies;
      }
      if (manifestPayload.peerDependencies && Object.keys(manifestPayload.peerDependencies).length > 0) {
        updated.peerDependencies = manifestPayload.peerDependencies;
      }
      if (pyManifest?.dependencies?.length > 0) {
        updated.pythonDependencies = pyManifest.dependencies;
      } else if (manifestPayload.pythonDependencies?.length > 0) {
        updated.pythonDependencies = manifestPayload.pythonDependencies;
      }
    }
    return updated;
  }, [pkg, tabData]);

  const headings = useMemo(
    () => (livePkg.readmeBlocks || []).filter((block) => block.type === 'h2' || block.type === 'h3'),
    [livePkg.readmeBlocks]
  );
  const totalExports = (livePkg.exports || []).length + (livePkg.pythonExports || []).length + (livePkg.typeScriptExports || []).length;

  return (
    <article className="w-full flex flex-col gap-6 pb-12 portal-stagger">
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
          <PackageDocsTab
            pkg={livePkg}
            headings={headings}
            isLoading={loadingTabs.docs && !(livePkg.readmeBlocks && livePkg.readmeBlocks.length > 0)}
          />
        )}

        {activeTab === 'api' && (
          <PackageApiTab
            pkg={livePkg}
            isLoading={loadingTabs.api && totalExports === 0}
          />
        )}

        {activeTab === 'playground' && (
          <PackagePlaygroundTab pkgId={livePkg.id} pkg={livePkg} />
        )}

        {activeTab === 'manifest' && (
          <PackageManifestTab
            pkg={livePkg}
            isLoading={loadingTabs.manifest && !livePkg.hasNpmManifest && !livePkg.hasPythonManifest}
          />
        )}
      </div>
    </article>
  );
}
