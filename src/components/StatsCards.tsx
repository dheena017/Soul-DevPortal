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
  color: string;
  bgColor: string;
  borderColor: string;
}

export default function StatsCards({ stats, packagesCount = 3, projectsCount = 8 }: StatsCardsProps) {
  const displayStats: StatItem[] = [
    {
      label: 'Shared Packages',
      value: packagesCount,
      sub: 'Ecosystem packages',
      color: '#38bdf8',
      bgColor: 'rgba(56, 189, 248, 0.1)',
      borderColor: 'rgba(56, 189, 248, 0.25)',
      icon: (
        <svg className="w-5 h-5 text-neutral-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
      color: '#34d399',
      bgColor: 'rgba(52, 211, 153, 0.1)',
      borderColor: 'rgba(52, 211, 153, 0.25)',
      icon: (
        <svg className="w-5 h-5 text-neutral-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
      color: '#c084fc',
      bgColor: 'rgba(192, 132, 252, 0.1)',
      borderColor: 'rgba(192, 132, 252, 0.25)',
      icon: (
        <svg className="w-5 h-5 text-neutral-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="16 18 22 12 16 6" />
          <polyline points="8 6 2 12 8 18" />
        </svg>
      ),
    },
    {
      label: 'Source Lines of Code',
      value: (stats?.totalLines || 4191).toLocaleString(),
      sub: `${stats?.totalFiles || 41} source files`,
      color: '#fbbf24',
      bgColor: 'rgba(251, 191, 36, 0.1)',
      borderColor: 'rgba(251, 191, 36, 0.25)',
      icon: (
        <svg className="w-5 h-5 text-neutral-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" aria-label="Monorepo metrics">
      {displayStats.map((item, index) => (
        <div
          key={index}
          className="flex items-center gap-4 p-4 md:p-5 rounded-2xl bg-[#161b22] border border-[#30363d] hover:border-neutral-500 hover:bg-[#161b22] transition-all duration-200 shadow-xl shadow-black/40 group cursor-default"
        >
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border"
            style={{
              backgroundColor: item.bgColor,
              borderColor: item.borderColor,
            }}
            aria-hidden="true"
          >
            {item.icon}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs text-neutral-400 font-medium truncate">{item.label}</span>
            <strong className="text-xl md:text-2xl font-extrabold text-neutral-200 font-mono mt-0.5 tracking-tight group-hover:text-neutral-200 transition-colors">
              {item.value}
            </strong>
            <span className="text-[11px] text-neutral-500 font-mono truncate">{item.sub}</span>
          </div>
        </div>
      ))}
    </section>
  );
}
