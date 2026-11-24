import React, { useEffect, useState, useRef, useMemo } from 'react';
import { consoleLogger } from '@workspace/logger';
import { headingId } from './Markdown';
import { MarkdownBlock } from '../types';

export interface TableOfContentsProps {
  headings?: MarkdownBlock[];
  title?: string;
  className?: string;
}

function getScrollContainer(tocElement?: HTMLElement | null): HTMLElement | null {
  if (tocElement) {
    let parent = tocElement.parentElement;
    while (parent && parent !== document.body && parent !== document.documentElement) {
      const style = window.getComputedStyle(parent);
      const overflowY = style.overflowY;
      if (overflowY === 'auto' || overflowY === 'scroll') {
        return parent;
      }
      parent = parent.parentElement;
    }
  }
  return (
    (document.querySelector('main') as HTMLElement | null) ||
    (document.querySelector('.main') as HTMLElement | null)
  );
}

export default function TableOfContents({
  headings = [],
  title = 'On this page',
  className = '',
}: TableOfContentsProps) {
  const [activeHeading, setActiveHeading] = useState<string>(
    headings[0]?.text ? headingId(headings[0].text) : ''
  );
  const [filterText, setFilterText] = useState<string>('');
  const isClickingRef = useRef<boolean>(false);
  const clickTimeoutRef = useRef<any>(null);
  const navRef = useRef<HTMLElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Reset active heading whenever headings list changes
  useEffect(() => {
    if (headings.length > 0 && headings[0]?.text) {
      setActiveHeading(headingId(headings[0].text));
    }
  }, [headings]);

  // Keep active item visible within the TOC scrollable container
  useEffect(() => {
    if (!activeHeading || isClickingRef.current || !listRef.current) return;
    const activeEl = listRef.current.querySelector(`[data-toc-id="${activeHeading}"]`) as HTMLElement;
    if (activeEl) {
      const container = listRef.current;
      const elTop = activeEl.offsetTop;
      const elHeight = activeEl.offsetHeight;
      const containerScrollTop = container.scrollTop;
      const containerHeight = container.clientHeight;

      if (elTop < containerScrollTop) {
        container.scrollTo({ top: elTop, behavior: 'smooth' });
      } else if (elTop + elHeight > containerScrollTop + containerHeight) {
        container.scrollTo({ top: elTop + elHeight - containerHeight, behavior: 'smooth' });
      }
    }
  }, [activeHeading]);

  // Reactive scrollspy tracking the scroll position inside main or window
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

      const scroller = getScrollContainer(navRef.current);

      // Check if user scrolled to bottom of scroll container
      if (scroller) {
        const isScrollable = scroller.scrollHeight > scroller.clientHeight + 80;
        const isBottom =
          isScrollable &&
          scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight < 50;

        if (isBottom && targets.length > 0) {
          setActiveHeading(targets[targets.length - 1].id);
          return;
        }

        // If user is at the very top of container
        if (scroller.scrollTop < 50) {
          setActiveHeading(targets[0].id);
          return;
        }
      } else {
        const docHeight = document.documentElement.scrollHeight;
        const scrollPos = window.scrollY + window.innerHeight;
        const isScrollable = docHeight > window.innerHeight + 80;
        if (isScrollable && docHeight - scrollPos < 70 && targets.length > 0) {
          setActiveHeading(targets[targets.length - 1].id);
          return;
        }

        if (window.scrollY < 50) {
          setActiveHeading(targets[0].id);
          return;
        }
      }

      const containerTop = scroller ? scroller.getBoundingClientRect().top : 0;
      const threshold = containerTop + 140;
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

    const scroller = getScrollContainer(navRef.current);
    if (scroller) {
      scroller.addEventListener('scroll', updateActiveOnScroll, { passive: true });
    }
    window.addEventListener('scroll', updateActiveOnScroll, { passive: true });
    window.addEventListener('resize', updateActiveOnScroll, { passive: true });

    updateActiveOnScroll();
    const timer1 = setTimeout(updateActiveOnScroll, 100);
    const timer2 = setTimeout(updateActiveOnScroll, 350);

    return () => {
      if (scroller) {
        scroller.removeEventListener('scroll', updateActiveOnScroll);
      }
      window.removeEventListener('scroll', updateActiveOnScroll);
      window.removeEventListener('resize', updateActiveOnScroll);
      clearTimeout(timer1);
      clearTimeout(timer2);
      if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current);
    };
  }, [headings]);

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

      const scroller = getScrollContainer(navRef.current);
      if (scroller) {
        const targetRect = target.getBoundingClientRect();
        const containerRect = scroller.getBoundingClientRect();
        const targetTopRelativeToContainer = targetRect.top - containerRect.top + scroller.scrollTop;
        scroller.scrollTo({
          top: Math.max(0, targetTopRelativeToContainer - 20),
          behavior: 'smooth',
        });
      } else {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }

      // Highlight target temporarily
      target.classList.add('ring-2', 'ring-emerald-400/50', 'rounded-lg', 'transition-all');
      setTimeout(() => {
        target?.classList.remove('ring-2', 'ring-emerald-400/50', 'rounded-lg', 'transition-all');
      }, 1500);

      // Update URL hash without jumping
      if (window.history?.replaceState) {
        window.history.replaceState(null, '', `#${id}`);
      }
    }
  };

  const filteredHeadings = useMemo(() => {
    const q = filterText.trim().toLowerCase();
    if (!q) return headings;
    return headings.filter((h) => (h.text || '').toLowerCase().includes(q));
  }, [headings, filterText]);

  if (!headings.length) return null;

  return (
    <nav
      ref={navRef}
      className={`sticky top-4 flex flex-col gap-3 p-4 rounded-2xl bg-[#141418] border border-[#22222a] shadow-2xl shadow-black/50 backdrop-blur-md transition-all ${className}`}
      aria-label="Table of contents navigation"
    >
      {/* ── Modern Sleek Header ── */}
      <div className="flex items-center justify-between pb-3 border-b border-[#212128]">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 shadow-sm">
            <svg
              className="w-3.5 h-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
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
          <span className="text-xs font-semibold text-neutral-200 tracking-wide font-mono uppercase">
            {title}
          </span>
        </div>
        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-[#1a1a20] border border-[#262630] text-neutral-400">
          {headings.length}
        </span>
      </div>

      {/* ── Optional Filter Search (for long docs) ── */}
      {headings.length > 7 && (
        <div className="relative flex items-center">
          <svg
            className="absolute left-2.5 w-3 h-3 text-neutral-500 pointer-events-none"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            placeholder="Filter sections..."
            className="w-full h-7 pl-7 pr-6 rounded-lg bg-[#0c0c0e] border border-[#22222a] text-[11px] text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-emerald-500/50 transition-all font-mono"
          />
          {filterText && (
            <button
              type="button"
              onClick={() => setFilterText('')}
              className="absolute right-2 text-neutral-500 hover:text-neutral-300 text-xs"
              title="Clear filter"
            >
              ✕
            </button>
          )}
        </div>
      )}

      {/* ── Modern Tree Guide Rail with Elegant Active Indicator ── */}
      <div ref={listRef} className="relative border-l border-[#22222a] ml-1.5 pl-2 flex flex-col gap-0.5 max-h-[calc(100vh-220px)] overflow-y-auto pr-1">
        {filteredHeadings.map((heading, index) => {
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
              title={cleanText}
              className={`group relative flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-all duration-150 text-left ${
                isH3 ? 'pl-5 text-[11px]' : ''
              } ${
                isActive
                  ? 'bg-emerald-500/10 text-emerald-300 font-semibold shadow-sm before:absolute before:-left-[9px] before:top-1.5 before:bottom-1.5 before:w-[2px] before:rounded-full before:bg-emerald-400 before:shadow-[0_0_8px_rgba(52,211,153,0.8)]'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40'
              }`}
              onClick={(event) => handleItemClick(event, id, titlePart)}
            >
              <span
                className={`rounded-full shrink-0 transition-all ${
                  isActive
                    ? 'w-1.5 h-1.5 bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]'
                    : isH3
                    ? 'w-1 h-1 bg-neutral-700 group-hover:bg-neutral-500'
                    : 'w-1.5 h-1.5 bg-neutral-600 group-hover:bg-neutral-400'
                }`}
                aria-hidden="true"
              />
              {numberPart && (
                <span
                  className={`px-1.5 py-0.2 rounded text-[10px] font-mono shrink-0 transition-colors ${
                    isActive
                      ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30'
                      : 'bg-[#18181e] text-neutral-400 border border-[#24242e]'
                  }`}
                >
                  {numberPart}
                </span>
              )}
              <span className="truncate leading-tight flex-1">{titlePart}</span>
            </a>
          );
        })}
      </div>

      {/* ── Footer: Scroll to Top Quick Action ── */}
      <button
        type="button"
        onClick={() => {
          const scroller = getScrollContainer(navRef.current);
          if (scroller) scroller.scrollTo({ top: 0, behavior: 'smooth' });
          else window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        className="pt-2.5 border-t border-[#1f1f26] flex items-center justify-between text-[11px] font-mono text-neutral-500 hover:text-emerald-400 transition-colors mt-0.5 group"
      >
        <span className="group-hover:translate-x-0.5 transition-transform">Top of document</span>
        <svg
          className="w-3.5 h-3.5 group-hover:-translate-y-0.5 transition-transform"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="12" y1="19" x2="12" y2="5" />
          <polyline points="5 12 12 5 19 12" />
        </svg>
      </button>
    </nav>
  );
}
