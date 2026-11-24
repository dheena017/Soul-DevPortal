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

  // Reset active heading only if current active heading is not in headings list
  useEffect(() => {
    if (!headings.length) return;
    const ids = headings.map((h) => headingId(h.text || ''));
    setActiveHeading((prev) => (prev && ids.includes(prev) ? prev : ids[0] || ''));
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

      if (elTop < containerScrollTop + 20) {
        container.scrollTo({ top: Math.max(0, elTop - 20), behavior: 'smooth' });
      } else if (elTop + elHeight > containerScrollTop + containerHeight - 20) {
        container.scrollTo({ top: elTop + elHeight - containerHeight + 20, behavior: 'smooth' });
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

      if (scroller) {
        const isScrollable = scroller.scrollHeight > scroller.clientHeight + 80;
        const isBottom =
          isScrollable &&
          scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight < 50;

        if (isBottom && targets.length > 0) {
          setActiveHeading(targets[targets.length - 1].id);
          return;
        }

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

      const viewportOffset = 140;
      let closest: HTMLElement | null = null;
      let minDistance = Infinity;

      for (const target of targets) {
        const rect = target.getBoundingClientRect();
        const dist = Math.abs(rect.top - viewportOffset);

        if (rect.top <= viewportOffset + 120) {
          if (rect.top >= -250 && dist < minDistance) {
            minDistance = dist;
            closest = target;
          }
        }
      }

      if (!closest && targets.length > 0) {
        const aboveTargets = targets.filter((t) => t.getBoundingClientRect().top < viewportOffset);
        if (aboveTargets.length > 0) {
          closest = aboveTargets[aboveTargets.length - 1];
        } else {
          closest = targets[0];
        }
      }

      if (closest && closest.id && closest.id !== activeHeading) {
        setActiveHeading(closest.id);
      }
    };

    const scroller = getScrollContainer(navRef.current);
    if (scroller) {
      scroller.addEventListener('scroll', updateActiveOnScroll, { passive: true });
    }
    window.addEventListener('scroll', updateActiveOnScroll, { passive: true });

    updateActiveOnScroll();

    return () => {
      if (scroller) {
        scroller.removeEventListener('scroll', updateActiveOnScroll);
      }
      window.removeEventListener('scroll', updateActiveOnScroll);
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
      }
    };
  }, [headings, activeHeading]);

  const handleItemClick = (
    event: React.MouseEvent<HTMLAnchorElement>,
    id: string,
    cleanText: string
  ) => {
    event.preventDefault();
    setActiveHeading(id);
    isClickingRef.current = true;

    if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current);
    clickTimeoutRef.current = setTimeout(() => {
      isClickingRef.current = false;
    }, 900);

    let target = document.getElementById(id);
    if (!target) {
      const candidates = document.querySelectorAll('.heading-with-anchor, h1, h2, h3, h4');
      for (const el of candidates) {
        if (el.textContent?.toLowerCase().includes(cleanText.trim().toLowerCase())) {
          target = el as HTMLElement;
          break;
        }
      }
    }

    if (target) {
      consoleLogger.action('TOC', `Jumped to section: #${id} (${cleanText.slice(0, 50)})`);

      const scroller = getScrollContainer(navRef.current);
      if (scroller) {
        const targetRect = target.getBoundingClientRect();
        const containerRect = scroller.getBoundingClientRect();
        const targetTopRelativeToContainer = targetRect.top - containerRect.top + scroller.scrollTop;
        scroller.scrollTo({
          top: Math.max(0, targetTopRelativeToContainer - 24),
          behavior: 'smooth',
        });
      } else {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }

      target.classList.add('ring-2', 'ring-sky-400/50', 'rounded-lg', 'transition-all');
      setTimeout(() => {
        target?.classList.remove('ring-2', 'ring-sky-400/50', 'rounded-lg', 'transition-all');
      }, 1500);
    }
  };

  const filteredHeadings = useMemo(() => {
    const q = filterText.trim().toLowerCase();
    if (!q) return headings;
    return headings.filter((h) => (h.text || '').toLowerCase().includes(q));
  }, [headings, filterText]);

  const stats = useMemo(() => {
    const h2Count = headings.filter((h) => h.type === 'h2').length;
    const h3Count = headings.filter((h) => h.type === 'h3').length;
    return { h2Count, h3Count, total: headings.length };
  }, [headings]);

  if (!headings.length) return null;

  return (
    <nav
      ref={navRef}
      className={`sticky top-4 flex flex-col gap-3 p-4 rounded-2xl bg-[#111115] border border-white/[0.08] shadow-2xl shadow-black/60 backdrop-blur-md transition-all ${className}`}
      aria-label="Table of contents navigation"
    >
      {/* ── Modern Header: Topic & Subtopic Count ── */}
      <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-sky-500/10 border border-sky-500/25 flex items-center justify-center text-sky-400 shadow-sm">
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
          <span className="text-xs font-bold text-white tracking-wider font-mono uppercase">
            {title}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-sky-500/15 border border-sky-500/30 text-sky-300"
            title={`${stats.h2Count} Header Topics`}
          >
            {stats.h2Count} Topics
          </span>
          {stats.h3Count > 0 && (
            <span
              className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-white/[0.04] border border-white/[0.08] text-zinc-400"
              title={`${stats.h3Count} Subtopics`}
            >
              {stats.h3Count} Sub
            </span>
          )}
        </div>
      </div>

      {/* ── Filter Search (for long docs) ── */}
      {headings.length > 7 && (
        <div className="relative flex items-center">
          <svg
            className="absolute left-2.5 w-3 h-3 text-zinc-500 pointer-events-none"
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
            placeholder="Filter topics & subtopics..."
            className="w-full h-7 pl-7 pr-6 rounded-lg bg-[#09090c] border border-white/[0.08] text-[11px] text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-sky-500/50 transition-all font-mono"
          />
          {filterText && (
            <button
              type="button"
              onClick={() => setFilterText('')}
              className="absolute right-2 text-zinc-500 hover:text-zinc-300 text-xs cursor-pointer"
              title="Clear filter"
            >
              ✕
            </button>
          )}
        </div>
      )}

      {/* ── Clean Developer Documentation Guide Rail ── */}
      <div
        ref={listRef}
        className="relative border-l border-white/[0.08] ml-2 pl-2 flex flex-col gap-0.5 max-h-[calc(100vh-220px)] overflow-y-auto pr-1 select-none py-1"
      >
        {filteredHeadings.map((heading, index) => {
          const rawText = heading.text || '';
          const cleanText = rawText.replace(/`/g, '');
          const id = headingId(rawText);
          const isActive = activeHeading === id;

          const isH2 = heading.type === 'h2';
          const isH3 = heading.type === 'h3';

          // ── H2: Header Topic ──
          if (isH2) {
            return (
              <a
                key={`${heading.type}-${index}-${rawText}`}
                href={`#${id}`}
                data-toc-id={id}
                aria-current={isActive ? 'location' : undefined}
                title={cleanText}
                className={`group relative flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-all duration-150 text-left ${
                  index > 0 ? 'mt-2' : 'mt-0'
                } ${
                  isActive
                    ? 'bg-sky-500/15 text-white font-bold shadow-sm before:absolute before:-left-[9px] before:top-1.5 before:bottom-1.5 before:w-[2px] before:rounded-full before:bg-sky-400 before:shadow-[0_0_8px_rgba(56,189,248,0.8)]'
                    : 'text-zinc-200 hover:text-white hover:bg-white/[0.04]'
                }`}
                onClick={(event) => handleItemClick(event, id, cleanText)}
              >
                <span className="truncate leading-tight font-semibold tracking-tight">
                  {cleanText}
                </span>
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-400 shrink-0 ml-2 shadow-[0_0_6px_rgba(56,189,248,0.8)]" />
                )}
              </a>
            );
          }

          // ── H3: Sub Topic ──
          if (isH3) {
            return (
              <a
                key={`${heading.type}-${index}-${rawText}`}
                href={`#${id}`}
                data-toc-id={id}
                aria-current={isActive ? 'location' : undefined}
                title={cleanText}
                className={`group relative flex items-center justify-between pl-4 pr-2 py-1 rounded-md text-[11px] transition-all duration-150 text-left ${
                  isActive
                    ? 'bg-emerald-500/15 text-emerald-300 font-semibold before:absolute before:-left-[9px] before:top-1 before:bottom-1 before:w-[2px] before:rounded-full before:bg-emerald-400 before:shadow-[0_0_6px_rgba(52,211,153,0.8)]'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03]'
                }`}
                onClick={(event) => handleItemClick(event, id, cleanText)}
              >
                <div className="flex items-center gap-1.5 truncate">
                  <span
                    className={`w-1 h-1 rounded-full shrink-0 transition-all ${
                      isActive
                        ? 'bg-emerald-400 shadow-[0_0_4px_rgba(52,211,153,0.8)]'
                        : 'bg-zinc-600 group-hover:bg-zinc-400'
                    }`}
                  />
                  <span className="truncate leading-tight font-normal">
                    {cleanText}
                  </span>
                </div>
              </a>
            );
          }

          // ── H4: Sub-Sub Topic / Details ──
          return (
            <a
              key={`${heading.type}-${index}-${rawText}`}
              href={`#${id}`}
              data-toc-id={id}
              aria-current={isActive ? 'location' : undefined}
              title={cleanText}
              className={`group relative flex items-center pl-7 pr-2 py-0.5 rounded text-[10.5px] font-mono transition-all duration-150 text-left ${
                isActive
                  ? 'text-amber-300 font-medium bg-amber-500/10 before:absolute before:-left-[9px] before:top-1 before:bottom-1 before:w-[2px] before:rounded-full before:bg-amber-400'
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.02]'
              }`}
              onClick={(event) => handleItemClick(event, id, cleanText)}
            >
              <span className="text-zinc-600 text-[9px] mr-1.5 shrink-0">▸</span>
              <span className="truncate leading-tight">
                {cleanText}
              </span>
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
        className="pt-2.5 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-mono text-zinc-500 hover:text-sky-400 transition-colors mt-0.5 group cursor-pointer"
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
