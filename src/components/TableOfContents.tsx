import React, { useEffect, useState, useRef } from 'react';
import { consoleLogger } from '@workspace/logger';
import { headingId } from './Markdown';
import { MarkdownBlock } from '../types';

export interface TableOfContentsProps {
  headings?: MarkdownBlock[];
  title?: string;
  className?: string;
}

export default function TableOfContents({
  headings = [],
  title = 'On this page',
  className = '',
}: TableOfContentsProps) {
  const [activeHeading, setActiveHeading] = useState<string>(
    headings[0]?.text ? headingId(headings[0].text) : ''
  );
  const isClickingRef = useRef<boolean>(false);
  const clickTimeoutRef = useRef<any>(null);

  // Reset active heading whenever headings list changes
  useEffect(() => {
    if (headings.length > 0 && headings[0]?.text) {
      setActiveHeading(headingId(headings[0].text));
    }
  }, [headings]);

  // Keep active item visible within the TOC scrollable container
  useEffect(() => {
    if (!activeHeading || isClickingRef.current) return;
    const activeEl = document.querySelector(`[data-toc-id="${activeHeading}"]`) as HTMLElement;
    if (activeEl) {
      activeEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [activeHeading]);

  // Reactive scrollspy tracking the scroll position inside .main or window
  useEffect(() => {
    if (!headings.length) return undefined;

    const getTargets = () =>
      headings
        .map((h) => document.getElementById(headingId(h.text || '')))
        .filter(Boolean) as HTMLElement[];

    let targets = getTargets();

    const updateActiveOnScroll = () => {
      if (isClickingRef.current) return;
      if (targets.length < headings.length) {
        targets = getTargets();
      }
      if (!targets.length) return;

      const mainEl = document.querySelector('.main') as HTMLElement | null;

      // Check if user scrolled to bottom of main scroll container
      if (mainEl) {
        const isBottom = mainEl.scrollHeight - mainEl.scrollTop - mainEl.clientHeight < 40;
        if (isBottom && targets.length > 0) {
          setActiveHeading(targets[targets.length - 1].id);
          return;
        }
      } else {
        const docHeight = document.documentElement.scrollHeight;
        const scrollPos = window.scrollY + window.innerHeight;
        if (docHeight - scrollPos < 70 && targets.length > 0) {
          setActiveHeading(targets[targets.length - 1].id);
          return;
        }
      }

      const threshold = 120;
      let currentId = targets[0]?.id || '';
      for (const target of targets) {
        const rect = target.getBoundingClientRect();
        if (rect.top <= threshold) {
          currentId = target.id;
        } else {
          break;
        }
      }

      if (currentId) {
        setActiveHeading(currentId);
      }
    };

    const mainEl = document.querySelector('.main');
    if (mainEl) {
      mainEl.addEventListener('scroll', updateActiveOnScroll, { passive: true });
    }
    window.addEventListener('scroll', updateActiveOnScroll, { passive: true });
    updateActiveOnScroll();
    const timer = setTimeout(updateActiveOnScroll, 120);

    return () => {
      if (mainEl) {
        mainEl.removeEventListener('scroll', updateActiveOnScroll);
      }
      window.removeEventListener('scroll', updateActiveOnScroll);
      clearTimeout(timer);
      if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current);
    };
  }, [headings]);

  if (!headings.length) return null;

  const handleItemClick = (event: React.MouseEvent<HTMLAnchorElement>, id: string, titlePart: string) => {
    event.preventDefault();
    setActiveHeading(id);
    isClickingRef.current = true;

    if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current);
    clickTimeoutRef.current = setTimeout(() => {
      isClickingRef.current = false;
    }, 900);

    // Locate target element by ID or content fallback
    let target = document.getElementById(id);
    if (!target) {
      const candidates = document.querySelectorAll('.heading-with-anchor, h1, h2, h3, h4');
      for (const el of candidates) {
        if (el.textContent?.toLowerCase().includes(titlePart.trim().toLowerCase())) {
          target = el as HTMLElement;
          break;
        }
      }
    }

    if (target) {
      consoleLogger.action('TOC', `Jumped to section: #${id} (${titlePart.slice(0, 50)})`);
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });

      // Update URL hash without jumping
      if (window.history?.replaceState) {
        window.history.replaceState(null, '', `#${id}`);
      }
    }
  };

  return (
    <nav
      className={`sticky top-3.5 flex flex-col gap-2.5 p-4 rounded-2xl bg-[#111111] border border-[#222222] shadow-xl shadow-black/60 ${className}`}
      aria-label="Table of contents navigation"
    >
      {/* Card Header using Theme Palette */}
      <div className="flex items-center justify-between pb-2.5 border-b border-[#1f1f1f]">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-[#161616] border border-[#262626] flex items-center justify-center text-sky-400">
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="8" y1="6" x2="21" y2="6" />
              <line x1="8" y1="12" x2="21" y2="12" />
              <line x1="8" y1="18" x2="21" y2="18" />
              <line x1="3" y1="6" x2="3.01" y2="6" />
              <line x1="3" y1="12" x2="3.01" y2="12" />
              <line x1="3" y1="18" x2="3.01" y2="18" />
            </svg>
          </div>
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-200">
            {title}
          </span>
        </div>
        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#161616] border border-[#262626] text-neutral-300">
          {headings.length}
        </span>
      </div>

      {/* Navigation List using Theme Palette */}
      <div className="flex flex-col gap-1 max-h-[calc(100vh-140px)] overflow-y-auto pr-1">
        {headings.map((heading, index) => {
          const rawText = heading.text || '';
          const cleanText = rawText.replace(/`/g, '');
          const id = headingId(rawText);
          const isActive = activeHeading === id;
          const isH3 = heading.type === 'h3';

          // Extract number prefix if present (e.g. "1.", "2.1", "3. ")
          const numberMatch = cleanText.match(/^(\d+(?:\.\d+)?\.?)\s*(.+)$/);
          const numberPart = numberMatch ? numberMatch[1] : null;
          const titlePart = numberMatch ? numberMatch[2] : cleanText;

          return (
            <a
              key={`${heading.type}-${index}-${rawText}`}
              href={`#${id}`}
              data-toc-id={id}
              aria-current={isActive ? 'location' : undefined}
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-all duration-150 text-left ${
                isH3 ? 'pl-5 text-neutral-400' : 'text-neutral-300'
              } ${
                isActive
                  ? 'bg-[#222222] text-white font-semibold border border-[#333333] shadow-sm'
                  : 'hover:text-white hover:bg-[#161616] border border-transparent'
              }`}
              onClick={(event) => handleItemClick(event, id, titlePart)}
            >
              {isH3 && (
                <span
                  className={`w-1.5 h-1.5 rounded-full shrink-0 transition-all ${
                    isActive
                      ? 'bg-neutral-200'
                      : 'bg-neutral-600'
                  }`}
                  aria-hidden="true"
                />
              )}
              {numberPart && (
                <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-[#161616] border border-[#262626] text-neutral-400 shrink-0">
                  {numberPart}
                </span>
              )}
              <span className="truncate leading-tight">{titlePart}</span>
            </a>
          );
        })}
      </div>
    </nav>
  );
}
