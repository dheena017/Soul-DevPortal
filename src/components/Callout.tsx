import React, { ReactNode } from 'react';

export type CalloutType = 'note' | 'tip' | 'important' | 'warning' | 'caution';

interface CalloutConfig {
  title: string;
  badgeClass: string;
  containerClass: string;
  icon: ReactNode;
}

const CALLOUT_CONFIGS: Record<CalloutType, CalloutConfig> = {
  note: {
    title: 'Note',
    badgeClass: 'text-neutral-300 bg-[#151519] border border-white/[0.08]',
    containerClass: 'neu-card bg-[#151519] border border-white/[0.08] text-neutral-200',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
      </svg>
    ),
  },
  tip: {
    title: 'Tip',
    badgeClass: 'text-neutral-300 bg-[#151519] border border-[#212126]',
    containerClass: 'bg-[#151519] border border-[#212126] text-neutral-200',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 3.5z" />
      </svg>
    ),
  },
  important: {
    title: 'Important',
    badgeClass: 'text-neutral-300 bg-[#151519] border border-[#212126]',
    containerClass: 'bg-[#151519] border border-[#212126] text-neutral-200',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    ),
  },
  warning: {
    title: 'Warning',
    badgeClass: 'text-neutral-300 bg-[#151519] border-[#212126]',
    containerClass: 'bg-[#151519] border-[#212126] text-neutral-200',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
  },
  caution: {
    title: 'Caution',
    badgeClass: 'text-rose-400 bg-rose-500/10 border-rose-500/25',
    containerClass: 'bg-rose-500/5 border-rose-500/20 text-rose-200',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    ),
  },
};

export interface CalloutProps {
  key?: React.Key;
  type?: CalloutType | string;
  title?: string;
  children: ReactNode;
}

export default function Callout({ type = 'note', title, children }: CalloutProps) {
  const normalizedType = (type?.toLowerCase() || 'note') as CalloutType;
  const config = CALLOUT_CONFIGS[normalizedType] || CALLOUT_CONFIGS.note;
  const displayTitle = title || config.title;

  return (
    <div
      className={`my-3 p-4 rounded-xl neu-tile border flex flex-col gap-2 text-xs md:text-sm fade-in-up portal-card-hover ${config.containerClass}`}
      role="note"
    >
      <div className="flex items-center gap-2 font-semibold">
        <span
          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-mono font-bold uppercase tracking-wider border ${config.badgeClass}`}
        >
          {config.icon}
          <span>{displayTitle}</span>
        </span>
      </div>
      <div className="text-neutral-300 leading-relaxed pl-1">{children}</div>
    </div>
  );
}
