import React, { useEffect, useState, useRef } from 'react';
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
    const activeEl = document.querySelector(`.toc-item[href="#${activeHeading}"]`) as HTMLElement;
    if (activeEl) {
      activeEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [activeHeading]);

  // Reactive scrollspy tracking the window scroll position
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

      const topbar = document.querySelector('.topbar');
      const topbarHeight = topbar ? topbar.getBoundingClientRect().height : 58;
      const threshold = topbarHeight + 50;

      // Bottom of page check
      const docHeight = document.documentElement.scrollHeight;
      const scrollPos = window.scrollY + window.innerHeight;
      if (docHeight - scrollPos < 70 && targets.length > 0) {
        setActiveHeading(targets[targets.length - 1].id);
        return;
      }

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

    window.addEventListener('scroll', updateActiveOnScroll, { passive: true });
    updateActiveOnScroll();
    const timer = setTimeout(updateActiveOnScroll, 120);

    return () => {
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
      const topbar = document.querySelector('.topbar');
      const topbarHeight = topbar ? topbar.getBoundingClientRect().height : 58;
      const targetTop = target.getBoundingClientRect().top + window.scrollY;
      const offsetPosition = Math.max(0, targetTop - topbarHeight - 20);

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });

      // Update URL hash without jumping
      if (window.history?.replaceState) {
        window.history.replaceState(null, '', `#${id}`);
      }
    }
  };

  return (
    <nav className={`toc-container package-contents ${className}`} aria-label="Table of contents navigation">
      {/* Refined Card Header */}
      <div className="toc-card-header">
        <div className="toc-header-left">
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="toc-header-icon"
            aria-hidden="true"
          >
            <line x1="8" y1="6" x2="21" y2="6" />
            <line x1="8" y1="12" x2="21" y2="12" />
            <line x1="8" y1="18" x2="21" y2="18" />
            <line x1="3" y1="6" x2="3.01" y2="6" />
            <line x1="3" y1="12" x2="3.01" y2="12" />
            <line x1="3" y1="18" x2="3.01" y2="18" />
          </svg>
          <span className="toc-header-title">{title}</span>
        </div>
        <span className="toc-counter-badge">{headings.length}</span>
      </div>

      {/* Navigation List */}
      <div className="toc-list contents-list">
        {headings.map((heading, index) => {
          const rawText = heading.text || '';
          const cleanText = rawText.replace(/`/g, '');
          const id = headingId(rawText);
          const isActive = activeHeading === id;
          const isH3 = heading.type === 'h3';
          const prevHeading = index > 0 ? headings[index - 1] : null;
          const isNewMajorSection = !isH3 && prevHeading && prevHeading.type === 'h3';

          // Extract number prefix if present (e.g. "1.", "2.1", "3. ")
          const numberMatch = cleanText.match(/^(\d+(?:\.\d+)?\.?)\s*(.+)$/);
          const numberPart = numberMatch ? numberMatch[1] : null;
          const titlePart = numberMatch ? numberMatch[2] : cleanText;

          return (
            <a
              className={`toc-item ${isH3 ? 'toc-nested nested' : 'toc-major'}${isNewMajorSection ? ' toc-section-break' : ''}${isActive ? ' active' : ''}`}
              aria-current={isActive ? 'location' : undefined}
              href={`#${id}`}
              key={`${heading.type}-${index}-${rawText}`}
              onClick={(event) => handleItemClick(event, id, titlePart)}
            >
              {isH3 && <span className="toc-tree-dot" aria-hidden="true" />}
              {numberPart && <span className="toc-num-tag">{numberPart}</span>}
              <span className="toc-label-text">{titlePart}</span>
            </a>
          );
        })}
      </div>
    </nav>
  );
}
