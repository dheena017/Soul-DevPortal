import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { consoleLogger } from '@workspace/logger';
import { headingId } from './Markdown';
import { MarkdownBlock } from '../types';

export interface TableOfContentsProps {
  headings?: MarkdownBlock[];
  title?: string;
  className?: string;
}

interface TocItem {
  id: string;
  rawText: string;
  cleanText: string;
  level: 2 | 3 | 4;
  index: number;
}

interface TocSection {
  key: string;
  parent: TocItem | null;
  children: TocItem[];
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

function highlightQuery(text: string, query: string, keyPrefix: string): React.ReactNode {
  if (!query) return text;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'ig');
  const parts = text.split(regex);
  return parts.map((part, idx) =>
    part.toLowerCase() === query.toLowerCase() ? (
      <mark
        key={`${keyPrefix}-m-${idx}`}
        className="bg-sky-400/25 text-sky-100 rounded-[3px] px-0.5 ring-1 ring-sky-400/30"
      >
        {part}
      </mark>
    ) : (
      <React.Fragment key={`${keyPrefix}-t-${idx}`}>{part}</React.Fragment>
    )
  );
}

function renderHeadingLabel(
  rawText: string,
  query: string,
  isActive: boolean,
  level: 2 | 3 | 4
): React.ReactNode {
  const segments = rawText.split(/(`[^`]+`)/g);
  return segments.map((seg, idx) => {
    if (seg.startsWith('`') && seg.endsWith('`') && seg.length > 2) {
      const codeText = seg.slice(1, -1);
      const codeClass = isActive
        ? level === 2
          ? 'bg-sky-400/18 text-sky-200 border-sky-400/35'
          : level === 3
          ? 'bg-emerald-400/18 text-emerald-200 border-emerald-400/35'
          : 'bg-amber-400/18 text-amber-200 border-amber-400/35'
        : 'bg-white/[0.06] text-sky-300/90 border-white/[0.09]';

      return (
        <code
          key={`code-${idx}`}
          className={`font-mono text-[0.88em] px-1.5 py-[0.5px] rounded-[4px] border ${codeClass}`}
        >
          {highlightQuery(codeText, query, `c-${idx}`)}
        </code>
      );
    }

    return (
      <React.Fragment key={`txt-${idx}`}>
        {highlightQuery(seg, query, `t-${idx}`)}
      </React.Fragment>
    );
  });
}

interface TocSearchBarProps {
  filterText: string;
  onFilterChange: (value: string) => void;
  matchCount: number;
  totalCount: number;
  firstMatch: TocItem | null;
  onJumpFirst: (item: TocItem) => void;
  inputRef?: React.RefObject<HTMLInputElement | null>;
}

const TocSearchBar = React.memo(function TocSearchBar({
  filterText,
  onFilterChange,
  matchCount,
  totalCount,
  firstMatch,
  onJumpFirst,
  inputRef,
}: TocSearchBarProps) {
  const isFiltering = filterText.trim().length > 0;

  return (
    <div className="relative z-10 shrink-0 group flex items-center">
      <svg
        className="absolute left-2.5 w-3.5 h-3.5 text-zinc-500 group-focus-within:text-sky-400 transition-colors pointer-events-none"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        aria-hidden="true"
      >
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
      <input
        ref={inputRef}
        type="text"
        value={filterText}
        onChange={(e) => onFilterChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            e.stopPropagation();
            if (filterText) {
              onFilterChange('');
            } else {
              inputRef?.current?.blur();
            }
          } else if (e.key === 'Enter' && firstMatch) {
            e.preventDefault();
            onJumpFirst(firstMatch);
          }
        }}
        placeholder="Filter topics & subtopics..."
        aria-label="Filter topics and subtopics"
        className="toc-search-input w-full h-8 pl-8 pr-16 rounded-[8px] text-xs sm:text-[11px] text-zinc-200 placeholder-zinc-500 font-mono"
      />
      {isFiltering && (
        <div className="absolute right-2 flex items-center gap-1.5">
          <span className="px-1 py-px rounded-[4px] bg-white/[0.05] text-[9.5px] font-mono text-zinc-400 tabular-nums">
            {matchCount}/{totalCount}
          </span>
          <button
            type="button"
            onClick={() => onFilterChange('')}
            className="w-4 h-4 rounded-[4px] flex items-center justify-center text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.08] text-[10px] cursor-pointer"
            title="Clear filter (Esc)"
            aria-label="Clear filter"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
});

interface TocTreeListProps {
  filteredSections: TocSection[];
  activeHeading: string;
  collapsedIds: Set<string>;
  isFiltering: boolean;
  trimmedQuery: string;
  normalizedQuery: string;
  onItemClick: (event: React.MouseEvent<HTMLAnchorElement>, item: TocItem) => void;
  onToggleSection: (sectionId: string) => void;
  onResetFilter: () => void;
  listRef?: React.RefObject<HTMLDivElement | null>;
  onScrollRail?: () => void;
  railFadeClass?: string;
}

const TocTreeList = React.memo(function TocTreeList({
  filteredSections,
  activeHeading,
  collapsedIds,
  isFiltering,
  trimmedQuery,
  normalizedQuery,
  onItemClick,
  onToggleSection,
  onResetFilter,
  listRef,
  onScrollRail,
  railFadeClass = '',
}: TocTreeListProps) {
  return (
    <div
      ref={listRef}
      onScroll={onScrollRail}
      className={`relative z-10 flex-1 min-h-0 overflow-y-auto overflow-x-hidden pr-1 select-none py-0.5 custom-scrollbar overscroll-contain ${railFadeClass}`}
    >
      <div className="toc-rail relative ml-1 pl-2.5 flex flex-col gap-1">
        {filteredSections.length === 0 ? (
          <div className="py-6 px-3 text-center flex flex-col items-center gap-2.5">
            <span className="text-[11px] font-mono text-zinc-500 break-words">
              No sections match &ldquo;{trimmedQuery}&rdquo;
            </span>
            <button
              type="button"
              onClick={onResetFilter}
              className="px-2.5 py-1 rounded-[6px] text-[10.5px] font-mono bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.09] text-zinc-300 cursor-pointer transition-colors"
            >
              Reset filter
            </button>
          </div>
        ) : (
          filteredSections.map((section, sectionIdx) => {
            const parent = section.parent;
            const hasChildren = section.children.length > 0;
            const isCollapsed =
              !isFiltering && parent ? collapsedIds.has(parent.id) : false;
            const isParentActive = parent ? activeHeading === parent.id : false;
            const hasActiveChild = section.children.some(
              (child) => child.id === activeHeading
            );
            const parentDirectMatch =
              isFiltering && parent
                ? parent.cleanText.toLowerCase().includes(normalizedQuery)
                : true;

            return (
              <div
                key={section.key}
                className={`flex flex-col gap-0.5 ${sectionIdx > 0 ? 'mt-2' : ''}`}
              >
                {parent && (
                  <div
                    className={`toc-item-h2 group/row relative flex items-stretch rounded-[8px] ${
                      isParentActive
                        ? 'toc-item-h2--active'
                        : hasActiveChild
                        ? 'toc-item-h2--parent-active'
                        : ''
                    }`}
                  >
                    {isParentActive && (
                      <span
                        className="toc-rail-bar toc-rail-bar--sky"
                        aria-hidden="true"
                      />
                    )}
                    <a
                      href={`#${parent.id}`}
                      data-toc-id={parent.id}
                      aria-current={isParentActive ? 'location' : undefined}
                      title={parent.cleanText}
                      onClick={(event) => onItemClick(event, parent)}
                      className={`flex-1 min-w-0 flex items-center gap-2 px-2.5 py-2 lg:py-1.5 text-left ${
                        isParentActive
                          ? 'text-white font-semibold'
                          : hasActiveChild
                          ? 'text-zinc-100 font-semibold'
                          : parentDirectMatch
                          ? 'text-zinc-200 hover:text-white font-semibold'
                          : 'text-zinc-400 hover:text-zinc-200 font-medium'
                      }`}
                    >
                      <span className="min-w-0 flex-1 text-[12.5px] lg:text-[12px] leading-[1.38] tracking-tight line-clamp-2 break-words">
                        {renderHeadingLabel(
                          parent.rawText,
                          trimmedQuery,
                          isParentActive,
                          2
                        )}
                      </span>
                    </a>

                    {hasChildren && !isFiltering && (
                      <button
                        type="button"
                        onClick={() => onToggleSection(parent.id)}
                        className="px-2 lg:px-1.5 flex items-center gap-1 text-zinc-500 hover:text-zinc-200 transition-colors cursor-pointer shrink-0"
                        title={
                          isCollapsed
                            ? `Expand ${section.children.length} subtopics`
                            : `Collapse ${section.children.length} subtopics`
                        }
                        aria-expanded={!isCollapsed}
                        aria-label={`${isCollapsed ? 'Expand' : 'Collapse'} ${parent.cleanText} subtopics`}
                      >
                        {isCollapsed && hasActiveChild && (
                          <span
                            className="toc-node-dot--emerald w-1.5 h-1.5 rounded-full"
                            aria-hidden="true"
                          />
                        )}
                        {isCollapsed && (
                          <span className="px-1 py-px rounded-[4px] bg-white/[0.05] text-[9.5px] font-mono text-zinc-400 tabular-nums">
                            {section.children.length}
                          </span>
                        )}
                        <svg
                          className={`w-3.5 h-3.5 lg:w-3 lg:h-3 transition-transform duration-150 ${
                            isCollapsed ? '-rotate-90' : 'rotate-0'
                          }`}
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </button>
                    )}
                  </div>
                )}

                {hasChildren && !isCollapsed && (
                  <div className="flex flex-col gap-0.5 mt-0.5">
                    {section.children.map((child) => {
                      const isChildActive = activeHeading === child.id;

                      if (child.level === 3) {
                        return (
                          <a
                            key={`${child.level}-${child.index}-${child.rawText}`}
                            href={`#${child.id}`}
                            data-toc-id={child.id}
                            aria-current={isChildActive ? 'location' : undefined}
                            title={child.cleanText}
                            onClick={(event) => onItemClick(event, child)}
                            className={`toc-item-sub group relative flex items-start gap-2 pl-4 pr-2 py-1.5 lg:py-1 rounded-[6px] text-[12px] lg:text-[11.5px] leading-[1.38] text-left ${
                              isChildActive
                                ? 'toc-item-h3--active text-emerald-200 font-medium'
                                : 'text-zinc-400 hover:text-zinc-100'
                            }`}
                          >
                            {isChildActive && (
                              <span
                                className="toc-rail-bar toc-rail-bar--emerald"
                                aria-hidden="true"
                              />
                            )}
                            <span
                              className={`mt-[5px] w-1.5 h-1.5 rounded-full shrink-0 transition-all ${
                                isChildActive
                                  ? 'toc-node-dot--emerald'
                                  : 'bg-zinc-600/90 group-hover:bg-zinc-400'
                              }`}
                              aria-hidden="true"
                            />
                            <span className="min-w-0 flex-1 line-clamp-2 break-words">
                              {renderHeadingLabel(
                                child.rawText,
                                trimmedQuery,
                                isChildActive,
                                3
                              )}
                            </span>
                          </a>
                        );
                      }

                      return (
                        <a
                          key={`${child.level}-${child.index}-${child.rawText}`}
                          href={`#${child.id}`}
                          data-toc-id={child.id}
                          aria-current={isChildActive ? 'location' : undefined}
                          title={child.cleanText}
                          onClick={(event) => onItemClick(event, child)}
                          className={`toc-item-sub group relative flex items-start gap-1.5 pl-6.5 pr-2 py-1.5 lg:py-1 rounded-[6px] text-[11px] leading-[1.35] font-mono text-left ${
                            isChildActive
                              ? 'toc-item-h4--active text-amber-200 font-medium'
                              : 'text-zinc-500 hover:text-zinc-200'
                          }`}
                        >
                          {isChildActive && (
                            <span
                              className="toc-rail-bar toc-rail-bar--amber"
                              aria-hidden="true"
                            />
                          )}
                          <span
                            className={`text-[9px] mt-[2px] shrink-0 transition-colors ${
                              isChildActive
                                ? 'text-amber-300'
                                : 'text-zinc-600 group-hover:text-zinc-400'
                            }`}
                            aria-hidden="true"
                          >
                            ▸
                          </span>
                          <span className="min-w-0 flex-1 line-clamp-2 break-words">
                            {renderHeadingLabel(
                              child.rawText,
                              trimmedQuery,
                              isChildActive,
                              4
                            )}
                          </span>
                        </a>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
});

export default function TableOfContents({
  headings = [],
  title = 'On this page',
  className = '',
}: TableOfContentsProps) {
  const [activeHeading, setActiveHeading] = useState<string>(
    headings[0]?.text ? headingId(headings[0].text) : ''
  );
  const [filterText, setFilterText] = useState<string>('');
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(() => new Set());
  const [scrollProgress, setScrollProgress] = useState<number>(0);
  const [mobileExpanded, setMobileExpanded] = useState<boolean>(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState<boolean>(false);
  const [railFade, setRailFade] = useState<{ top: boolean; bottom: boolean }>({
    top: false,
    bottom: false,
  });

  const isClickingRef = useRef<boolean>(false);
  const clickTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navRef = useRef<HTMLElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const sheetListRef = useRef<HTMLDivElement>(null);
  const filterInputRef = useRef<HTMLInputElement>(null);
  const sheetFilterInputRef = useRef<HTMLInputElement>(null);

  const items = useMemo<TocItem[]>(() => {
    return headings.map((heading, index) => {
      const rawText = heading.text || '';
      const cleanText = rawText.replace(/`/g, '');
      const level: 2 | 3 | 4 =
        heading.type === 'h2' ? 2 : heading.type === 'h3' ? 3 : 4;
      return {
        id: headingId(rawText),
        rawText,
        cleanText,
        level,
        index,
      };
    });
  }, [headings]);

  const sections = useMemo<TocSection[]>(() => {
    const grouped: TocSection[] = [];
    let current: TocSection | null = null;

    for (const item of items) {
      if (item.level === 2) {
        current = {
          key: `${item.index}-${item.id}`,
          parent: item,
          children: [],
        };
        grouped.push(current);
      } else {
        if (!current) {
          current = {
            key: `orphan-${item.index}`,
            parent: null,
            children: [],
          };
          grouped.push(current);
        }
        current.children.push(item);
      }
    }

    return grouped;
  }, [items]);

  const collapsibleIds = useMemo(
    () =>
      sections
        .filter((s) => s.parent && s.children.length > 0)
        .map((s) => s.parent!.id),
    [sections]
  );

  const allCollapsed =
    collapsibleIds.length > 0 &&
    collapsibleIds.every((id) => collapsedIds.has(id));

  const activeItem = useMemo(
    () => items.find((item) => item.id === activeHeading) || items[0] || null,
    [items, activeHeading]
  );

  const updateRailFade = useCallback(() => {
    const el = listRef.current;
    if (!el) return;
    const hasOverflow = el.scrollHeight > el.clientHeight + 4;
    if (!hasOverflow) {
      setRailFade((prev) => (prev.top || prev.bottom ? { top: false, bottom: false } : prev));
      return;
    }
    const showTop = el.scrollTop > 6;
    const showBottom = el.scrollTop + el.clientHeight < el.scrollHeight - 6;
    setRailFade((prev) =>
      prev.top === showTop && prev.bottom === showBottom
        ? prev
        : { top: showTop, bottom: showBottom }
    );
  }, []);

  // Reset active heading & collapsed state cleanly when document changes
  useEffect(() => {
    if (!items.length) return;
    const ids = items.map((item) => item.id);
    setActiveHeading((prev) => (prev && ids.includes(prev) ? prev : ids[0] || ''));
    setCollapsedIds(new Set());
    setMobileDrawerOpen(false);
  }, [items]);

  // Close mobile bottom sheet on Escape key
  useEffect(() => {
    if (!mobileDrawerOpen) return undefined;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        setMobileDrawerOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileDrawerOpen]);

  // Keep rail fade mask synchronized with list height & filter changes
  useEffect(() => {
    updateRailFade();
  }, [items, collapsedIds, filterText, mobileExpanded, updateRailFade]);

  // Keep active TOC item visible inside the TOC scroll rail
  useEffect(() => {
    if (!activeHeading || isClickingRef.current) return;
    const container = mobileDrawerOpen ? sheetListRef.current : listRef.current;
    if (!container) return;

    const activeEl = container.querySelector(
      `[data-toc-id="${activeHeading}"]`
    ) as HTMLElement | null;
    if (!activeEl) return;

    const elRect = activeEl.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    const elTopInContainer = elRect.top - containerRect.top + container.scrollTop;
    const elHeight = elRect.height;
    const containerScrollTop = container.scrollTop;
    const containerHeight = container.clientHeight;

    if (elTopInContainer < containerScrollTop + 28) {
      container.scrollTo({ top: Math.max(0, elTopInContainer - 28), behavior: 'smooth' });
    } else if (elTopInContainer + elHeight > containerScrollTop + containerHeight - 28) {
      container.scrollTo({
        top: elTopInContainer + elHeight - containerHeight + 28,
        behavior: 'smooth',
      });
    }
  }, [activeHeading, collapsedIds, mobileDrawerOpen]);

  // Reactive scrollspy & live reading progress tracking
  useEffect(() => {
    if (!items.length) return undefined;

    const getTargets = () =>
      items
        .map((item) => document.getElementById(item.id))
        .filter(Boolean) as HTMLElement[];

    const scroller = getScrollContainer(navRef.current);
    let targets = getTargets();
    let rafId: number | null = null;

    const updateActiveAndProgress = () => {
      rafId = null;

      // Update reading progress only when rounded integer percentage changes
      if (scroller) {
        const maxScroll = Math.max(0, scroller.scrollHeight - scroller.clientHeight);
        const pct = maxScroll > 0 ? Math.min(100, Math.max(0, Math.round((scroller.scrollTop / maxScroll) * 100))) : 100;
        setScrollProgress((prev) => (prev === pct ? prev : pct));
      } else {
        const maxScroll = Math.max(
          0,
          document.documentElement.scrollHeight - window.innerHeight
        );
        const pct = maxScroll > 0 ? Math.min(100, Math.max(0, Math.round((window.scrollY / maxScroll) * 100))) : 100;
        setScrollProgress((prev) => (prev === pct ? prev : pct));
      }

      if (isClickingRef.current) return;
      if (targets.length < items.length) {
        targets = getTargets();
      }
      if (!targets.length) return;

      if (scroller) {
        const isScrollable = scroller.scrollHeight > scroller.clientHeight + 80;
        const isBottom =
          isScrollable &&
          scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight < 50;

        if (isBottom) {
          const lastId = targets[targets.length - 1].id;
          setActiveHeading((prev) => (prev === lastId ? prev : lastId));
          return;
        }

        if (scroller.scrollTop < 50) {
          const firstId = targets[0].id;
          setActiveHeading((prev) => (prev === firstId ? prev : firstId));
          return;
        }
      } else {
        const docHeight = document.documentElement.scrollHeight;
        const scrollPos = window.scrollY + window.innerHeight;
        const isScrollable = docHeight > window.innerHeight + 80;
        if (isScrollable && docHeight - scrollPos < 70) {
          const lastId = targets[targets.length - 1].id;
          setActiveHeading((prev) => (prev === lastId ? prev : lastId));
          return;
        }

        if (window.scrollY < 50) {
          const firstId = targets[0].id;
          setActiveHeading((prev) => (prev === firstId ? prev : firstId));
          return;
        }
      }

      const scrollerTop = scroller ? scroller.getBoundingClientRect().top : 0;
      const threshold = scrollerTop + 96;
      let activeCandidate: HTMLElement | null = null;

      for (const target of targets) {
        const rect = target.getBoundingClientRect();
        if (rect.top <= threshold) {
          activeCandidate = target;
        } else {
          break;
        }
      }

      const resolved = activeCandidate || targets[0];
      if (resolved?.id) {
        const nextId = resolved.id;
        setActiveHeading((prev) => (prev === nextId ? prev : nextId));
      }
    };

    const scheduleUpdate = () => {
      if (rafId !== null) return;
      rafId = window.requestAnimationFrame(updateActiveAndProgress);
    };

    if (scroller) {
      scroller.addEventListener('scroll', scheduleUpdate, { passive: true });
    }
    window.addEventListener('scroll', scheduleUpdate, { passive: true });
    window.addEventListener('resize', scheduleUpdate, { passive: true });
    window.addEventListener('resize', updateRailFade, { passive: true });

    updateActiveAndProgress();

    return () => {
      if (scroller) {
        scroller.removeEventListener('scroll', scheduleUpdate);
      }
      window.removeEventListener('scroll', scheduleUpdate);
      window.removeEventListener('resize', scheduleUpdate);
      window.removeEventListener('resize', updateRailFade);
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
      }
    };
  }, [items, updateRailFade]);

  const scrollToTop = useCallback(() => {
    const scroller = getScrollContainer(navRef.current);
    if (scroller) scroller.scrollTo({ top: 0, behavior: 'smooth' });
    else window.scrollTo({ top: 0, behavior: 'smooth' });
    setMobileDrawerOpen(false);
  }, []);

  const jumpToItem = useCallback((item: TocItem) => {
    setActiveHeading(item.id);
    setMobileDrawerOpen(false);
    isClickingRef.current = true;

    if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current);
    clickTimeoutRef.current = setTimeout(() => {
      isClickingRef.current = false;
    }, 900);

    let target = document.getElementById(item.id);
    if (!target) {
      const candidates = document.querySelectorAll('.heading-with-anchor, h1, h2, h3, h4');
      for (const el of candidates) {
        if (el.textContent?.toLowerCase().includes(item.cleanText.trim().toLowerCase())) {
          target = el as HTMLElement;
          break;
        }
      }
    }

    if (target) {
      consoleLogger.action('TOC', `Jumped to section: #${item.id} (${item.cleanText.slice(0, 50)})`);

      const scroller = getScrollContainer(navRef.current);
      if (scroller) {
        const targetRect = target.getBoundingClientRect();
        const containerRect = scroller.getBoundingClientRect();
        const targetTopRelativeToContainer =
          targetRect.top - containerRect.top + scroller.scrollTop;
        scroller.scrollTo({
          top: Math.max(0, targetTopRelativeToContainer - 24),
          behavior: 'smooth',
        });
      } else {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }

      target.classList.add(
        'ring-1',
        'ring-sky-400/40',
        'bg-sky-500/10',
        'rounded-md',
        'px-2',
        '-mx-2',
        'transition-all',
        'duration-300'
      );
      setTimeout(() => {
        target?.classList.remove(
          'ring-1',
          'ring-sky-400/40',
          'bg-sky-500/10',
          'rounded-md',
          'px-2',
          '-mx-2',
          'transition-all',
          'duration-300'
        );
      }, 1500);
    }
  }, []);

  const handleResetFilter = useCallback(() => {
    setFilterText('');
    filterInputRef.current?.focus();
  }, []);

  const handleResetSheetFilter = useCallback(() => {
    setFilterText('');
    sheetFilterInputRef.current?.focus();
  }, []);

  const handleItemClick = useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>, item: TocItem) => {
      event.preventDefault();
      jumpToItem(item);
    },
    [jumpToItem]
  );

  const toggleSection = useCallback((sectionId: string) => {
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) next.delete(sectionId);
      else next.add(sectionId);
      return next;
    });
  }, []);

  const toggleAllSections = () => {
    if (allCollapsed) {
      setCollapsedIds(new Set());
    } else {
      setCollapsedIds(new Set(collapsibleIds));
    }
  };

  const trimmedQuery = filterText.trim();
  const normalizedQuery = trimmedQuery.toLowerCase();
  const isFiltering = normalizedQuery.length > 0;

  const { filteredSections, matchCount, firstMatch } = useMemo(() => {
    if (!isFiltering) {
      return {
        filteredSections: sections,
        matchCount: items.length,
        firstMatch: items[0] || null,
      };
    }

    const result: TocSection[] = [];
    let count = 0;
    let first: TocItem | null = null;

    for (const section of sections) {
      const parentMatches = section.parent
        ? section.parent.cleanText.toLowerCase().includes(normalizedQuery)
        : false;
      const matchingChildren = section.children.filter((child) =>
        child.cleanText.toLowerCase().includes(normalizedQuery)
      );

      if (parentMatches || matchingChildren.length > 0) {
        if (parentMatches) {
          count += 1;
          if (!first && section.parent) first = section.parent;
        }
        count += matchingChildren.length;
        if (!first && matchingChildren.length > 0) first = matchingChildren[0];

        result.push({
          key: section.key,
          parent: section.parent,
          children:
            matchingChildren.length > 0
              ? matchingChildren
              : parentMatches
              ? section.children
              : [],
        });
      }
    }

    return { filteredSections: result, matchCount: count, firstMatch: first };
  }, [sections, items, isFiltering, normalizedQuery]);

  const stats = useMemo(() => {
    const h2Count = items.filter((item) => item.level === 2).length;
    const subCount = items.filter((item) => item.level !== 2).length;
    return { h2Count, subCount, total: items.length };
  }, [items]);

  if (!headings.length) return null;

  const roundedProgress = Math.round(scrollProgress);
  const railFadeClass =
    railFade.top && railFade.bottom
      ? 'toc-scroll-fade-both'
      : railFade.top
      ? 'toc-scroll-fade-top'
      : railFade.bottom
      ? 'toc-scroll-fade-bottom'
      : '';

  const activeDotColor =
    activeItem?.level === 3
      ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.85)]'
      : activeItem?.level === 4
      ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.85)]'
      : 'bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.85)]';

  return (
    <>
      {/* ── Inline TOC Card (Collapsible Accordion on Mobile, Sticky Rail on Desktop) ── */}
      <nav
        ref={navRef}
        className={`toc-panel relative lg:sticky lg:top-4 flex flex-col gap-3 p-3.5 rounded-2xl max-h-[65vh] lg:max-h-[calc(100dvh-5.75rem)] ${className}`}
        aria-label="Table of contents navigation"
      >
        {/* Header */}
        <div className="relative z-10 shrink-0 flex flex-col gap-2.5">
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setMobileExpanded((prev) => !prev)}
              className="flex items-center gap-2 min-w-0 flex-1 text-left lg:pointer-events-none cursor-pointer lg:cursor-default"
              aria-expanded={mobileExpanded}
              aria-label={mobileExpanded ? 'Collapse table of contents' : 'Expand table of contents'}
            >
              <div className="toc-icon-badge w-6 h-6 rounded-[7px] flex items-center justify-center text-sky-300 shrink-0">
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
              <span className="text-[11px] font-bold text-zinc-100 tracking-[0.09em] font-mono uppercase truncate">
                {title}
              </span>
            </button>

            <div className="flex items-center gap-1 shrink-0">
              {stats.h2Count > 0 && (
                <span
                  className="px-1.5 py-0.5 rounded-[6px] text-[10px] font-mono font-semibold bg-sky-500/12 border border-sky-400/25 text-sky-300 whitespace-nowrap tabular-nums"
                  title={`${stats.h2Count} Header Topics`}
                >
                  {stats.h2Count} Topics
                </span>
              )}
              {stats.subCount > 0 && (
                <span
                  className="px-1.5 py-0.5 rounded-[6px] text-[10px] font-mono font-medium bg-white/[0.04] border border-white/[0.08] text-zinc-400 whitespace-nowrap tabular-nums"
                  title={`${stats.subCount} Subtopics`}
                >
                  {stats.subCount} Sub
                </span>
              )}
              {collapsibleIds.length > 0 && !isFiltering && (
                <button
                  type="button"
                  onClick={toggleAllSections}
                  className="hidden lg:flex w-6 h-6 rounded-[6px] items-center justify-center text-zinc-400 hover:text-white bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.07] hover:border-white/[0.16] transition-colors cursor-pointer"
                  title={allCollapsed ? 'Expand all subtopics' : 'Collapse all subtopics'}
                  aria-label={allCollapsed ? 'Expand all subtopics' : 'Collapse all subtopics'}
                  aria-pressed={allCollapsed}
                >
                  <svg
                    className={`w-3 h-3 transition-transform duration-150 ${allCollapsed ? '-rotate-90' : 'rotate-0'}`}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
              )}

              <button
                type="button"
                onClick={() => setMobileExpanded((prev) => !prev)}
                className="flex lg:hidden w-7 h-6 rounded-[6px] items-center justify-center text-zinc-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.09] border border-white/[0.09] transition-colors cursor-pointer"
                aria-expanded={mobileExpanded}
                aria-label={mobileExpanded ? 'Collapse table of contents' : 'Expand table of contents'}
              >
                <svg
                  className={`w-3.5 h-3.5 transition-transform duration-150 ${mobileExpanded ? 'rotate-180' : 'rotate-0'}`}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile Compact Active-Section Preview (shown only when collapsed on < lg) */}
          {!mobileExpanded && activeItem && (
            <button
              type="button"
              onClick={() => setMobileExpanded(true)}
              className="lg:hidden flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-[8px] bg-white/[0.03] border border-white/[0.06] text-left cursor-pointer hover:bg-white/[0.06] transition-colors"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${activeDotColor}`} />
                <span className="text-[11.5px] font-medium text-zinc-200 truncate">
                  {activeItem.cleanText}
                </span>
              </div>
              <span className="text-[10px] font-mono text-zinc-400 shrink-0 tabular-nums">
                {roundedProgress}% · Tap to browse
              </span>
            </button>
          )}

          {/* Reading Progress Track */}
          <div
            className="toc-progress-track h-[2px] w-full rounded-full overflow-hidden"
            role="progressbar"
            aria-valuenow={roundedProgress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Document reading progress"
          >
            <div
              className="toc-progress-fill h-full rounded-full"
              style={{ width: `${roundedProgress}%` }}
            />
          </div>
        </div>

        {/* Body (Hidden on collapsed mobile, always visible on desktop lg+) */}
        <div
          className={`${
            mobileExpanded ? 'flex' : 'hidden lg:flex'
          } flex-col gap-3 flex-1 min-h-0`}
        >
          {items.length > 5 && (
            <TocSearchBar
              filterText={filterText}
              onFilterChange={setFilterText}
              matchCount={matchCount}
              totalCount={items.length}
              firstMatch={firstMatch}
              onJumpFirst={jumpToItem}
              inputRef={filterInputRef}
            />
          )}

          <TocTreeList
            filteredSections={filteredSections}
            activeHeading={activeHeading}
            collapsedIds={collapsedIds}
            isFiltering={isFiltering}
            trimmedQuery={trimmedQuery}
            normalizedQuery={normalizedQuery}
            onItemClick={handleItemClick}
            onToggleSection={toggleSection}
            onResetFilter={handleResetFilter}
            listRef={listRef}
            onScrollRail={updateRailFade}
            railFadeClass={railFadeClass}
          />

          <div className="relative z-10 shrink-0 pt-2.5 border-t border-white/[0.06] flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-[10.5px] font-mono text-zinc-500 tabular-nums">
              <span className="px-1.5 py-0.5 rounded-[5px] bg-white/[0.04] border border-white/[0.08] text-zinc-300">
                {roundedProgress}%
              </span>
              <span>read</span>
            </div>

            <button
              type="button"
              onClick={scrollToTop}
              className="toc-footer-btn inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] text-[11px] font-mono text-zinc-300 group cursor-pointer"
            >
              <span>{roundedProgress > 2 ? 'Back to top' : 'Top of document'}</span>
              <svg
                className="w-3.5 h-3.5 group-hover:-translate-y-0.5 transition-transform"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <line x1="12" y1="19" x2="12" y2="5" />
                <polyline points="5 12 12 5 19 12" />
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {/* ── Mobile Floating Quick-Navigation Dock (< lg) ── */}
      <div className="fixed bottom-3.5 left-1/2 -translate-x-1/2 w-[calc(100%-1.5rem)] max-w-md z-40 lg:hidden">
        <div className="toc-mobile-dock relative overflow-hidden rounded-2xl p-1.5 flex items-center gap-1.5">
          {/* Thin top progress line */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-white/[0.05]">
            <div
              className="toc-progress-fill h-full"
              style={{ width: `${roundedProgress}%` }}
            />
          </div>

          <button
            type="button"
            onClick={() => setMobileDrawerOpen(true)}
            className="flex-1 min-w-0 flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl hover:bg-white/[0.05] text-left transition-colors cursor-pointer"
            aria-label="Open table of contents drawer"
          >
            <span className={`w-2 h-2 rounded-full shrink-0 ${activeDotColor}`} />
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-[9.5px] font-mono uppercase tracking-wider text-zinc-400 leading-none mb-0.5">
                {title} · {stats.total} sections
              </span>
              <span className="text-xs font-semibold text-zinc-100 truncate leading-tight">
                {activeItem?.cleanText || title}
              </span>
            </div>
            <svg
              className="w-4 h-4 text-zinc-400 shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="18 15 12 9 6 15" />
            </svg>
          </button>

          <span className="px-2 py-1 rounded-[8px] bg-white/[0.05] border border-white/[0.08] text-[10.5px] font-mono font-semibold text-zinc-300 tabular-nums shrink-0">
            {roundedProgress}%
          </span>

          {roundedProgress > 3 && (
            <button
              type="button"
              onClick={scrollToTop}
              className="w-8 h-8 rounded-xl bg-sky-500/15 border border-sky-400/30 text-sky-300 hover:bg-sky-500/25 flex items-center justify-center shrink-0 transition-colors cursor-pointer"
              title="Back to top"
              aria-label="Scroll to top of document"
            >
              <svg
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="12" y1="19" x2="12" y2="5" />
                <polyline points="5 12 12 5 19 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* ── Mobile Slide-Up Outline Bottom Sheet Drawer (< lg) ── */}
      {mobileDrawerOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden flex flex-col justify-end"
          role="dialog"
          aria-modal="true"
          aria-label="Document outline drawer"
        >
          <div
            className="toc-sheet-backdrop absolute inset-0 bg-black/75 backdrop-blur-sm"
            onClick={() => setMobileDrawerOpen(false)}
          />

          <div className="toc-mobile-sheet relative z-10 w-full max-w-lg mx-auto rounded-t-2xl max-h-[82dvh] flex flex-col gap-3 p-4 pb-5">
            <div className="w-10 h-1 rounded-full bg-white/20 mx-auto shrink-0" aria-hidden="true" />

            {/* Sheet Header */}
            <div className="shrink-0 flex flex-col gap-2.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="toc-icon-badge w-6 h-6 rounded-[7px] flex items-center justify-center text-sky-300 shrink-0">
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
                  <span className="text-[11px] font-bold text-zinc-100 tracking-[0.09em] font-mono uppercase truncate">
                    {title}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="px-1.5 py-0.5 rounded-[6px] text-[10px] font-mono font-semibold bg-sky-500/12 border border-sky-400/25 text-sky-300 tabular-nums">
                    {stats.h2Count} Topics
                  </span>
                  {stats.subCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded-[6px] text-[10px] font-mono font-medium bg-white/[0.04] border border-white/[0.08] text-zinc-400 tabular-nums">
                      {stats.subCount} Sub
                    </span>
                  )}
                  {collapsibleIds.length > 0 && !isFiltering && (
                    <button
                      type="button"
                      onClick={toggleAllSections}
                      className="w-7 h-7 rounded-[7px] flex items-center justify-center text-zinc-400 hover:text-white bg-white/[0.04] border border-white/[0.08] cursor-pointer"
                      title={allCollapsed ? 'Expand all subtopics' : 'Collapse all subtopics'}
                      aria-label={allCollapsed ? 'Expand all subtopics' : 'Collapse all subtopics'}
                    >
                      <svg
                        className={`w-3.5 h-3.5 transition-transform duration-150 ${allCollapsed ? '-rotate-90' : 'rotate-0'}`}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setMobileDrawerOpen(false)}
                    className="w-7 h-7 rounded-[7px] flex items-center justify-center text-zinc-400 hover:text-white bg-white/[0.04] border border-white/[0.08] text-xs cursor-pointer"
                    aria-label="Close document outline"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="toc-progress-track h-[2px] w-full rounded-full overflow-hidden">
                <div
                  className="toc-progress-fill h-full rounded-full"
                  style={{ width: `${roundedProgress}%` }}
                />
              </div>
            </div>

            {items.length > 5 && (
              <TocSearchBar
                filterText={filterText}
                onFilterChange={setFilterText}
                matchCount={matchCount}
                totalCount={items.length}
                firstMatch={firstMatch}
                onJumpFirst={jumpToItem}
                inputRef={sheetFilterInputRef}
              />
            )}

            <TocTreeList
              filteredSections={filteredSections}
              activeHeading={activeHeading}
              collapsedIds={collapsedIds}
              isFiltering={isFiltering}
              trimmedQuery={trimmedQuery}
              normalizedQuery={normalizedQuery}
              onItemClick={handleItemClick}
              onToggleSection={toggleSection}
              onResetFilter={handleResetSheetFilter}
              listRef={sheetListRef}
            />

            <div className="shrink-0 pt-2.5 border-t border-white/[0.06] flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-500 tabular-nums">
                <span className="px-1.5 py-0.5 rounded-[5px] bg-white/[0.04] border border-white/[0.08] text-zinc-300">
                  {roundedProgress}%
                </span>
                <span>read</span>
              </div>

              <button
                type="button"
                onClick={scrollToTop}
                className="toc-footer-btn inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-xs font-mono text-zinc-200 cursor-pointer"
              >
                <span>Back to top</span>
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
                  <line x1="12" y1="19" x2="12" y2="5" />
                  <polyline points="5 12 12 5 19 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
