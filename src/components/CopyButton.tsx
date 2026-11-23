import React, { useState, MouseEvent } from 'react';
import { consoleLogger } from '@workspace/logger';

export interface CopyButtonProps {
  text?: string;
  label?: string;
  copiedLabel?: string;
  className?: string;
  variant?: 'default' | 'compact' | 'icon-only' | 'ghost';
  title?: string;
}

export default function CopyButton({
  text = '',
  label = 'Copy',
  copiedLabel = 'Copied',
  className = '',
  variant = 'default',
  title = 'Copy to clipboard',
}: CopyButtonProps) {
  const [copied, setCopied] = useState<boolean>(false);

  async function handleCopy(e: MouseEvent<HTMLButtonElement>) {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      consoleLogger.action('CLIPBOARD', `Copied text to clipboard (${text.length} chars)`, {
        preview: text.slice(0, 100),
      });
      window.setTimeout(() => setCopied(false), 1400);
    } catch (err) {
      setCopied(false);
      consoleLogger.error('CLIPBOARD', 'Failed to copy to clipboard', err);
    }
  }

  const iconOnly = variant === 'icon-only';
  const displayLabel = copied ? copiedLabel : label;

  const variantStyles = {
    default: copied
      ? 'bg-emerald-500/15 border-emerald-500/35 text-emerald-400'
      : 'bg-[#181818] border-[#2c2c2c] text-neutral-300 hover:text-white hover:bg-[#202020] hover:border-[#3a3a3a]',
    compact: copied
      ? 'bg-emerald-500/15 border-emerald-500/35 text-emerald-400'
      : 'bg-[#161616] border-[#282828] text-neutral-300 hover:text-white hover:bg-[#1e1e1e] hover:border-[#383838]',
    'icon-only': copied
      ? 'bg-emerald-500/15 border-emerald-500/35 text-emerald-400'
      : 'bg-[#161616] border-[#282828] text-neutral-400 hover:text-white hover:bg-[#1e1e1e] hover:border-[#383838]',
    ghost: copied
      ? 'bg-emerald-500/10 text-emerald-400 border-transparent'
      : 'bg-transparent text-neutral-400 hover:text-white hover:bg-[#1a1a1a] border-transparent',
  };

  const sizeStyles = {
    default: 'px-3 py-1.5 rounded-lg text-xs font-semibold gap-1.5',
    compact: 'px-2.5 py-1 rounded-md text-[11px] font-semibold gap-1.5',
    'icon-only': 'p-1.5 rounded-md text-xs',
    ghost: 'px-2 py-1 rounded-md text-xs font-medium gap-1',
  };

  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center border font-sans transition-all cursor-pointer select-none shrink-0 shadow-sm group ${
        sizeStyles[variant] || sizeStyles.default
      } ${variantStyles[variant] || variantStyles.default} ${className}`.trim()}
      onClick={handleCopy}
      aria-label={copied ? copiedLabel : title}
      title={copied ? copiedLabel : title}
    >
      <span className="shrink-0 flex items-center justify-center" aria-hidden="true">
        {copied ? (
          <svg className="w-3.5 h-3.5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : (
          <svg className="w-3.5 h-3.5 text-neutral-400 group-hover:text-neutral-200 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
        )}
      </span>
      {!iconOnly && displayLabel && (
        <span className="truncate leading-none">{displayLabel}</span>
      )}
    </button>
  );
}
