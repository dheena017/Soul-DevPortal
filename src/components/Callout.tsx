import React, { ReactNode } from 'react';

export type CalloutType = 'note' | 'tip' | 'important' | 'warning' | 'caution';

interface CalloutConfig {
  title: string;
  colorClass: string;
  icon: ReactNode;
}

const CALLOUT_CONFIGS: Record<CalloutType, CalloutConfig> = {
  note: {
    title: 'Note',
    colorClass: 'callout-note',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
      </svg>
    ),
  },
  tip: {
    title: 'Tip',
    colorClass: 'callout-tip',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 3.5z" />
      </svg>
    ),
  },
  important: {
    title: 'Important',
    colorClass: 'callout-important',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    ),
  },
  warning: {
    title: 'Warning',
    colorClass: 'callout-warning',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
  },
  caution: {
    title: 'Caution',
    colorClass: 'callout-caution',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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
    <div className={`callout-card ${config.colorClass}`} role="note">
      <div className="callout-header">
        <span className="callout-icon" aria-hidden="true">{config.icon}</span>
        <strong className="callout-title">{displayTitle}</strong>
      </div>
      <div className="callout-body">
        {children}
      </div>
    </div>
  );
}
