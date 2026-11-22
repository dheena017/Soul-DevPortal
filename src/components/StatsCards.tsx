import React, { ReactNode } from 'react';
import { StatsData } from '../types';

export interface StatsCardsProps {
  stats?: StatsData;
  packagesCount?: number;
  projectsCount?: number;
}

interface StatItem {
  label: string;
  value: string | number;
  sub: string;
  icon: ReactNode;
}

export default function StatsCards({ stats, packagesCount = 3, projectsCount = 8 }: StatsCardsProps) {
  const displayStats: StatItem[] = [
    {
      label: 'Shared Packages',
      value: packagesCount,
      sub: 'Ecosystem packages',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
          <line x1="12" y1="22.08" x2="12" y2="12" />
        </svg>
      ),
    },
    {
      label: 'Integrated Apps',
      value: projectsCount,
      sub: 'Monorepo services',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
          <line x1="8" y1="21" x2="16" y2="21" />
          <line x1="12" y1="17" x2="12" y2="21" />
        </svg>
      ),
    },
    {
      label: 'Public Exports & APIs',
      value: stats?.totalSymbols || 59,
      sub: 'Exported symbols',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="16 18 22 12 16 6" />
          <polyline points="8 6 2 12 8 18" />
        </svg>
      ),
    },
    {
      label: 'Source Lines of Code',
      value: (stats?.totalLines || 4191).toLocaleString(),
      sub: `${stats?.totalFiles || 41} source files`,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      ),
    },
  ];

  return (
    <section className="stats-cards-grid" aria-label="Monorepo metrics">
      {displayStats.map((item, index) => (
        <div className="stat-card" key={index}>
          <div className="stat-card-icon" aria-hidden="true">{item.icon}</div>
          <div className="stat-card-info">
            <span className="stat-card-label">{item.label}</span>
            <strong className="stat-card-value">{item.value}</strong>
            <span className="stat-card-sub">{item.sub}</span>
          </div>
        </div>
      ))}
    </section>
  );
}
