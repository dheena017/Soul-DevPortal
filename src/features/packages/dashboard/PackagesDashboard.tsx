import React, { useState, useMemo, useRef, useEffect } from 'react';
import EmptyState from '../../../components/EmptyState';
import { PackageData } from '../../../types';
import { PACKAGE_METADATA_MAP } from '../packagesConstants';
import PackagesHeader from './PackagesHeader';
import PackageCard from './PackageCard';

export interface PackagesDashboardProps {
  packages?: PackageData[];
  onSelectPackage?: (id: string) => void;
  onClearSearch?: () => void;
  onBack?: () => void;
}

export type PackagesViewProps = PackagesDashboardProps;

export default function PackagesDashboard({
  packages = [],
  onSelectPackage,
  onClearSearch,
  onBack,
}: PackagesDashboardProps) {
  const [query, setQuery] = useState<string>('');
  const [ecosystemFilter, setEcosystemFilter] = useState<'all' | 'npm' | 'python' | 'config'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'exports' | 'version'>('name');
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === '/' &&
        document.activeElement !== searchInputRef.current &&
        !['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName || '')
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === 'Escape' && document.activeElement === searchInputRef.current) {
        if (query) {
          setQuery('');
        } else {
          searchInputRef.current?.blur();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [query]);

  const filteredPackages = useMemo(() => {
    let list = [...packages];

    if (query.trim()) {
      const needle = query.trim().toLowerCase();
      list = list.filter((p) => {
        const meta = PACKAGE_METADATA_MAP[p.id];
        const tags = meta?.tags?.join(' ') || '';
        const role = meta?.role || '';
        return [
          p.name,
          p.displayName,
          p.id,
          p.description,
          p.pythonName,
          p.pythonModule,
          role,
          tags,
          ...(p.exports || []),
          ...(p.pythonExports || []),
          ...(p.typeScriptExports || []),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(needle);
      });
    }

    if (ecosystemFilter === 'npm') {
      list = list.filter((p) => p.hasNpmManifest && !p.name.includes('config'));
    } else if (ecosystemFilter === 'python') {
      list = list.filter((p) => p.hasPythonManifest);
    } else if (ecosystemFilter === 'config') {
      list = list.filter((p) => p.name.includes('config'));
    }

    if (sortBy === 'name') {
      list.sort((a, b) => (a.displayName || a.name).localeCompare(b.displayName || b.name));
    } else if (sortBy === 'exports') {
      list.sort(
        (a, b) =>
          ((b.exports?.length || 0) + (b.pythonExports?.length || 0)) -
          ((a.exports?.length || 0) + (a.pythonExports?.length || 0))
      );
    } else if (sortBy === 'version') {
      list.sort((a, b) => (b.version || '').localeCompare(a.version || ''));
    }

    return list;
  }, [packages, query, ecosystemFilter, sortBy]);

  return (
    <div className="w-full flex flex-col gap-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-300 portal-stagger">
      {/* ── Sub-component 1: Header (Breadcrumb, Metrics, Search, Filters, Sort) ── */}
      <PackagesHeader
        packagesCount={packages.length}
        query={query}
        onQueryChange={setQuery}
        ecosystemFilter={ecosystemFilter}
        onEcosystemFilterChange={setEcosystemFilter}
        sortBy={sortBy}
        onSortByChange={setSortBy}
        searchInputRef={searchInputRef}
        onBack={onBack}
      />

      {/* ── Sub-component 2: Package Grid of Package Cards ── */}
      <section className="w-full" aria-label="Shared packages explorer">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 portal-grid-stagger">
          {filteredPackages.map((pkg) => (
            <PackageCard
              key={pkg.id}
              pkg={pkg}
              onSelectPackage={onSelectPackage}
            />
          ))}
        </div>

        {filteredPackages.length === 0 && (
          <EmptyState
            title="No packages match your filter"
            description="Clear your filter criteria or search keyword to view all workspace packages."
            actionLabel="Reset Filters"
            onAction={() => {
              setEcosystemFilter('all');
              setQuery('');
              if (onClearSearch) onClearSearch();
            }}
          />
        )}
      </section>
    </div>
  );
}

export { PackagesHeader, PackageCard };
