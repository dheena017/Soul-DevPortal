import React, { useState, MouseEvent } from 'react';

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
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      setCopied(false);
    }
  }

  const iconOnly = variant === 'icon-only';

  return (
    <button
      type="button"
      className={`copy-button ${variant} ${copied ? 'copied' : ''} ${className}`.trim()}
      onClick={handleCopy}
      aria-label={copied ? copiedLabel : title}
      title={copied ? copiedLabel : title}
    >
      <span className="copy-button-icon" aria-hidden="true">
        {copied ? (
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : (
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
        )}
      </span>
      {!iconOnly && <span className="copy-button-text">{copied ? copiedLabel : label}</span>}
    </button>
  );
}
