import React, { useState, MouseEvent } from 'react';
import CopyButton from './CopyButton';
import Callout, { CalloutType } from './Callout';
import { MarkdownBlock } from '../types';

export function headingId(text: string): string {
  return String(text || '')
    .toLowerCase()
    .replace(/[`"'()[\]{}]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

interface InlineTextProps {
  key?: React.Key;
  text?: string;
}

interface LinkedBadgeProps {
  key?: React.Key;
  alt: string;
  imgSrc: string;
  href: string;
}

function LinkedBadge({
  alt,
  imgSrc,
  href,
}: LinkedBadgeProps) {
  const [imgFailed, setImgFailed] = useState<boolean>(false);
  const isExternal = href.startsWith('http');

  const handleAnchorClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (!href.startsWith('#')) return;
    e.preventDefault();
    const targetId = headingId(href.slice(1));
    const el = document.getElementById(targetId) || document.getElementById(href.slice(1));
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <a
      href={href}
      target={isExternal ? '_blank' : undefined}
      rel={isExternal ? 'noopener noreferrer' : undefined}
      onClick={handleAnchorClick}
      title={alt || href}
      className="inline-flex items-center align-middle transition-transform hover:-translate-y-0.5"
    >
      {!imgFailed ? (
        <img
          src={imgSrc}
          alt={alt || 'Badge'}
          loading="lazy"
          className="h-6 w-auto rounded-[5px] neu-btn border border-white/[0.08]"
          onError={() => setImgFailed(true)}
        />
      ) : (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono font-semibold bg-[#16161c] border border-white/[0.12] text-zinc-200 hover:border-sky-400/40 hover:text-white transition-colors">
          <span>{alt || 'Link'}</span>
          {isExternal && <span className="text-[10px] text-zinc-400">↗</span>}
        </span>
      )}
    </a>
  );
}

interface MarkdownImageProps {
  key?: React.Key;
  src: string;
  alt?: string;
  width?: string;
}

function MarkdownImage({
  src,
  alt,
  width,
}: MarkdownImageProps) {
  const [failed, setFailed] = useState<boolean>(false);
  const parsedWidth = width ? Number.parseInt(width, 10) : NaN;
  const maxWidthStyle =
    !Number.isNaN(parsedWidth) && parsedWidth > 0 ? { maxWidth: `${parsedWidth}px` } : undefined;

  if (failed) {
    return (
      <span className="inline-flex items-center gap-2 my-1.5 px-3 py-1.5 rounded-lg bg-[#16161c] border border-white/[0.08] text-[11px] font-mono text-zinc-400">
        <span aria-hidden="true">🖼️</span>
        <span className="truncate max-w-xs">{alt || src}</span>
      </span>
    );
  }

  return (
    <span className="inline-block my-2 max-w-full align-middle">
      <img
        src={src}
        alt={alt || 'Preview'}
        loading="lazy"
        style={maxWidthStyle}
        className="w-auto max-w-full max-h-96 rounded-xl neu-card border border-white/[0.08] object-contain"
        onError={() => setFailed(true)}
      />
    </span>
  );
}

function InlineText({ text = '' }: InlineTextProps) {
  if (!text) return null;

  const parts = text.split(
    /(\[!\[[^\]]*\]\([^)]+\)\]\([^)]+\)|!\[[^\]]*\]\([^)]+\)|<img\s+[^>]+>|`[^`]+`|\*\*[^*]+\*\*|~~[^~]+~~|\[[^\]]+\]\([^)]+\)|\*[^*]+\*|_[^_]+_|<br\s*\/?>)/gi
  );

  return (
    <>
      {parts.map((part, index) => {
        if (!part) return null;

        if (/^<br\s*\/?>$/i.test(part)) {
          return <br key={index} />;
        }

        // Linked Markdown Image / Badge: [![alt](imgSrc)](href)
        const linkedImgMatch = part.match(/^\[!\[([^\]]*)\]\(([^)]+)\)\]\(([^)]+)\)$/);
        if (linkedImgMatch) {
          return (
            <LinkedBadge
              key={index}
              alt={linkedImgMatch[1]}
              imgSrc={linkedImgMatch[2]}
              href={linkedImgMatch[3]}
            />
          );
        }

        // Markdown Image: ![alt](url)
        const imgMatch = part.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
        if (imgMatch) {
          return <MarkdownImage key={index} src={imgMatch[2]} alt={imgMatch[1]} />;
        }

        // HTML Image: <img src="..." />
        const htmlImgMatch = part.match(/<img\s+([^>]+)\/?>/i);
        if (htmlImgMatch) {
          const attrs = htmlImgMatch[1];
          const srcMatch = attrs.match(/src=["']([^"']+)["']/i);
          const altMatch = attrs.match(/alt=["']([^"']+)["']/i);
          const widthMatch = attrs.match(/width=["']?(\d+)["']?/i);
          if (srcMatch) {
            return (
              <MarkdownImage
                key={index}
                src={srcMatch[1]}
                alt={altMatch?.[1]}
                width={widthMatch?.[1]}
              />
            );
          }
        }

        if (part.startsWith('`') && part.endsWith('`')) {
          return (
            <code
              key={index}
              className="px-1.5 py-0.5 rounded bg-[#16161c] border border-white/[0.1] text-[11px] font-mono text-zinc-200"
            >
              {part.slice(1, -1)}
            </code>
          );
        }
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <strong key={index} className="font-bold text-white">
              {part.slice(2, -2)}
            </strong>
          );
        }
        if (part.startsWith('~~') && part.endsWith('~~')) {
          return (
            <del key={index} className="text-zinc-500 line-through">
              {part.slice(2, -2)}
            </del>
          );
        }
        if (
          (part.startsWith('*') && part.endsWith('*')) ||
          (part.startsWith('_') && part.endsWith('_'))
        ) {
          return (
            <em key={index} className="italic text-zinc-300">
              {part.slice(1, -1)}
            </em>
          );
        }

        const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
        if (link) {
          const href = link[2];
          const isExternal = href.startsWith('http');
          const isHash = href.startsWith('#');
          return (
            <a
              key={index}
              href={href}
              target={isExternal ? '_blank' : undefined}
              rel={isExternal ? 'noopener noreferrer' : undefined}
              onClick={(e) => {
                if (!isHash) return;
                e.preventDefault();
                const targetId = headingId(href.slice(1));
                const el =
                  document.getElementById(targetId) || document.getElementById(href.slice(1));
                if (el) {
                  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }}
              className="text-sky-400 hover:text-sky-300 underline decoration-sky-400/40 hover:decoration-sky-300 transition-colors font-medium"
            >
              {link[1]}
            </a>
          );
        }

        return <span key={index}>{part}</span>;
      })}
    </>
  );
}

interface CodeBlockProps {
  key?: React.Key;
  code: string;
  language?: string;
}

function CodeBlock({ code, language = 'text' }: CodeBlockProps) {
  const [wrap, setWrap] = useState<boolean>(false);
  const linesCount = code.split('\n').length;
  const langLower = (language || 'text').toLowerCase();

  const isMermaid = langLower === 'mermaid';

  const langBadges: Record<string, { label: string; color: string }> = {
    typescript: { label: 'TS', color: 'bg-sky-500/15 text-sky-300 border-sky-500/30' },
    ts: { label: 'TS', color: 'bg-sky-500/15 text-sky-300 border-sky-500/30' },
    javascript: { label: 'JS', color: 'bg-amber-500/15 text-amber-300 border-amber-500/30' },
    js: { label: 'JS', color: 'bg-amber-500/15 text-amber-300 border-amber-500/30' },
    python: { label: 'PYTHON', color: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30' },
    py: { label: 'PYTHON', color: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30' },
    json: { label: 'JSON', color: 'bg-amber-500/15 text-amber-300 border-amber-500/30' },
    bash: { label: 'BASH', color: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' },
    sh: { label: 'SHELL', color: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' },
    sql: { label: 'SQL', color: 'bg-rose-500/15 text-rose-300 border-rose-500/30' },
    mermaid: { label: 'MERMAID DIAGRAM', color: 'bg-purple-500/20 text-purple-300 border-purple-500/40' },
  };

  const badge = langBadges[langLower] || {
    label: langLower.toUpperCase(),
    color: 'bg-white/[0.05] text-zinc-400 border-white/[0.08]',
  };

  return (
    <div className={`my-4 w-full rounded-2xl neu-inset border ${isMermaid ? 'border-purple-500/30 bg-[#0d0914]' : 'border-white/[0.07] bg-[#09090c]'} overflow-hidden`}>
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/[0.06] bg-[#121217]">
        <div className="flex items-center gap-2">
          {isMermaid && <span className="text-xs">📊</span>}
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border tracking-wider ${badge.color}`}
          >
            {badge.label}
          </span>
          <span className="text-[11px] font-mono text-zinc-500">{linesCount} lines</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors cursor-pointer ${
              wrap
                ? 'bg-white/[0.1] text-white border border-white/20'
                : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04]'
            }`}
            onClick={() => setWrap(!wrap)}
            title={wrap ? 'Disable line wrap' : 'Enable line wrap'}
          >
            wrap
          </button>
          <CopyButton text={code} label="Copy" copiedLabel="Copied" variant="compact" />
        </div>
      </div>
      <pre
        className={`p-4 text-xs font-mono text-zinc-300 leading-relaxed overflow-x-auto ${
          wrap ? 'whitespace-pre-wrap break-all' : 'whitespace-pre'
        }`}
      >
        <code>{code}</code>
      </pre>
    </div>
  );
}

interface HeadingWithAnchorProps {
  key?: React.Key;
  level: 1 | 2 | 3 | 4;
  text?: string;
}

function HeadingWithAnchor({ level, text = '' }: HeadingWithAnchorProps) {
  const id = headingId(text);
  const [copiedAnchor, setCopiedAnchor] = useState<boolean>(false);

  const copyAnchorLink = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const hash = window.location.hash.split('#')[1]
      ? '#' + window.location.hash.split('#')[1].split('?')[0]
      : '';
    const url = `${window.location.origin}${window.location.pathname}${hash}#${id}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedAnchor(true);
      window.setTimeout(() => setCopiedAnchor(false), 1200);
    });
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // ── LEVEL 1: Document Hero Title ──
  if (level === 1) {
    return (
      <div className="mb-8 pb-5 border-b border-white/[0.1] flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse"></span>
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-sky-400">
            DOCUMENTATION BLUEPRINT &amp; SPECIFICATION
          </span>
        </div>
        <h1 id={id} className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
          <InlineText text={text} />
        </h1>
      </div>
    );
  }

  // ── LEVEL 2: Header Topic (Major Section) ──
  if (level === 2) {
    return (
      <div className="mt-8 mb-4 pt-6 border-t border-white/[0.1] first:mt-2 first:pt-0 first:border-t-0">
        <div className="group flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <span className="w-1.5 h-6 rounded-full bg-gradient-to-b from-sky-400 to-indigo-500 shrink-0"></span>
            <h2 id={id} className="text-xl md:text-2xl font-extrabold text-white tracking-tight leading-snug">
              <InlineText text={text} />
            </h2>
          </div>
          <button
            type="button"
            className={`opacity-0 group-hover:opacity-100 transition-opacity text-xs font-mono px-2 py-0.5 rounded text-zinc-500 hover:text-white hover:bg-white/[0.06] cursor-pointer shrink-0 ${
              copiedAnchor ? '!opacity-100 !text-sky-300' : ''
            }`}
            onClick={copyAnchorLink}
            title="Copy link to this topic"
            aria-label={`Copy link to section ${text}`}
          >
            {copiedAnchor ? 'copied!' : '#'}
          </button>
        </div>
      </div>
    );
  }

  // ── LEVEL 3: Sub Topic ──
  if (level === 3) {
    return (
      <div className="mt-7 mb-3">
        <div className="group flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-2 h-2 rounded-full bg-emerald-400/80 shrink-0"></span>
            <h3 id={id} className="text-base md:text-lg font-bold text-zinc-100 tracking-normal leading-snug">
              <InlineText text={text} />
            </h3>
          </div>
          <button
            type="button"
            className={`opacity-0 group-hover:opacity-100 transition-opacity text-xs font-mono px-1.5 py-0.5 rounded text-zinc-500 hover:text-white hover:bg-white/[0.06] cursor-pointer shrink-0 ${
              copiedAnchor ? '!opacity-100 !text-sky-300' : ''
            }`}
            onClick={copyAnchorLink}
            title="Copy link to this subtopic"
            aria-label={`Copy link to section ${text}`}
          >
            {copiedAnchor ? 'copied!' : '#'}
          </button>
        </div>
      </div>
    );
  }

  // ── LEVEL 4: Sub-Sub Topic / Details ──
  return (
    <div className="mt-5 mb-2 ml-1">
      <div className="group flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs text-amber-400 font-mono shrink-0">▸</span>
          <h4 id={id} className="text-xs md:text-sm font-semibold uppercase tracking-wider text-zinc-300 font-mono leading-normal">
            <InlineText text={text} />
          </h4>
        </div>
        <button
          type="button"
          className={`opacity-0 group-hover:opacity-100 transition-opacity text-xs font-mono px-1 py-0.5 rounded text-zinc-500 hover:text-white hover:bg-white/[0.06] cursor-pointer shrink-0 ${
            copiedAnchor ? '!opacity-100 !text-sky-300' : ''
          }`}
          onClick={copyAnchorLink}
          title="Copy link to details"
        >
          {copiedAnchor ? 'copied!' : '#'}
        </button>
      </div>
    </div>
  );
}

export interface MarkdownProps {
  blocks?: MarkdownBlock[];
  skipFirstHeading?: boolean;
}

function isPureHtmlWrapper(text: string): boolean {
  const trimmed = text.trim();
  return (
    /^<\/?(?:div|center|p|span|section|article|header|footer|details|summary|figure|figcaption)\b[^>]*>$/i.test(
      trimmed
    ) || /^<!--[\s\S]*-->$/.test(trimmed)
  );
}

function isHorizontalRule(text: string): boolean {
  const trimmed = text.trim();
  return /^(?:-{3,}|\*{3,}|_{3,})$/.test(trimmed) || /^<hr\s*\/?>$/i.test(trimmed);
}

function isBadgeOnlyLine(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;
  return /^(?:\[!\[[^\]]*\]\([^)]+\)\]\([^)]+\)|!\[[^\]]*\]\(https?:\/\/img\.shields\.io[^)]+\)|\s)+$/.test(
    trimmed
  );
}

export default React.memo(function Markdown({ blocks = [], skipFirstHeading = false }: MarkdownProps) {
  let skippedHeading = false;
  const groupedBlocks: any[] = [];

  for (let index = 0; index < blocks.length; index += 1) {
    const block = blocks[index];

    if (block.type === 'hr') {
      if (groupedBlocks[groupedBlocks.length - 1]?.type !== 'hr') {
        groupedBlocks.push({ type: 'hr' });
      }
      continue;
    }

    if (block.type === 'p' || block.type === 'paragraph') {
      const trimmed = (block.text || '').trim();
      if (!trimmed || isPureHtmlWrapper(trimmed)) {
        continue;
      }
      if (isHorizontalRule(trimmed)) {
        if (groupedBlocks[groupedBlocks.length - 1]?.type !== 'hr') {
          groupedBlocks.push({ type: 'hr' });
        }
        continue;
      }
      if (isBadgeOnlyLine(trimmed)) {
        const badgeTexts = [trimmed];
        while (
          index + 1 < blocks.length &&
          (blocks[index + 1].type === 'p' || blocks[index + 1].type === 'paragraph') &&
          isBadgeOnlyLine((blocks[index + 1].text || '').trim())
        ) {
          badgeTexts.push((blocks[index + 1].text || '').trim());
          index += 1;
        }
        groupedBlocks.push({ type: 'badge-group', items: badgeTexts });
        continue;
      }
      const bulletMatch = trimmed.match(/^[-*]\s+(.+)$/);
      if (bulletMatch) {
        const items = [{ type: 'list', text: bulletMatch[1] }];
        while (index + 1 < blocks.length) {
          const next = blocks[index + 1];
          const nextBullet =
            next.type === 'list'
              ? next.text
              : (next.type === 'p' || next.type === 'paragraph')
              ? next.text?.trim().match(/^[-*]\s+(.+)$/)?.[1]
              : undefined;
          if (!nextBullet) break;
          items.push({ type: 'list', text: nextBullet });
          index += 1;
        }
        groupedBlocks.push({ type: 'list-group', ordered: false, items });
        continue;
      }
    }

    // Check for callouts in quotes
    if (block.type === 'quote') {
      const alertMatch = block.text?.match(/^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*(.*)$/i);
      if (alertMatch) {
        groupedBlocks.push({
          type: 'callout',
          calloutType: alertMatch[1].toLowerCase() as CalloutType,
          text: alertMatch[2] || '',
        });
        continue;
      }
    }

    if (block.type !== 'list' && block.type !== 'ordered') {
      groupedBlocks.push(block);
      continue;
    }

    const items = [block];
    while (index + 1 < blocks.length && blocks[index + 1].type === block.type) {
      items.push(blocks[index + 1]);
      index += 1;
    }
    groupedBlocks.push({ type: 'list-group', ordered: block.type === 'ordered', items });
  }

  // Strip skipped first H1, leading/trailing dividers, and redundant dividers right before H2
  const withoutSkippedHeading = groupedBlocks.filter((b) => {
    if (b.type === 'h1' && skipFirstHeading && !skippedHeading) {
      skippedHeading = true;
      return false;
    }
    return true;
  });

  const cleanBlocks = withoutSkippedHeading.filter((b, idx, arr) => {
    if (b.type !== 'hr') return true;
    if (idx === 0 || idx === arr.length - 1) return false;
    if (arr[idx + 1]?.type === 'h2') return false;
    return true;
  });

  return (
    <div className="w-full flex flex-col text-zinc-300 leading-relaxed text-xs md:text-sm">
      {cleanBlocks.map((block, index) => {
        if (block.type === 'hr') {
          return <hr key={index} className="my-4 border-0 border-t border-white/[0.08]" />;
        }
        if (block.type === 'badge-group') {
          return (
            <div key={index} className="my-3 flex flex-wrap items-center gap-2">
              {block.items.map((badgeText: string, badgeIdx: number) => (
                <InlineText key={badgeIdx} text={badgeText} />
              ))}
            </div>
          );
        }
        if (block.type === 'h1') {
          return <HeadingWithAnchor level={1} text={block.text} key={index} />;
        }
        if (block.type === 'h2') return <HeadingWithAnchor level={2} text={block.text} key={index} />;
        if (block.type === 'h3') return <HeadingWithAnchor level={3} text={block.text} key={index} />;
        if (block.type === 'h4') return <HeadingWithAnchor level={4} text={block.text} key={index} />;

        if (block.type === 'p' || block.type === 'paragraph') {
          const trimmed = (block.text || '').trim();
          if (trimmed.startsWith('```')) {
            const lines = trimmed.split('\n');
            const lang = lines[0].replace(/^```/, '').trim();
            const lastLine = lines[lines.length - 1].trim();
            const body = lastLine === '```' ? lines.slice(1, -1) : lines.slice(1);
            return <CodeBlock code={body.join('\n')} language={lang || 'text'} key={index} />;
          }
          return (
            <p className="my-2 text-zinc-300 leading-relaxed" key={index}>
              <InlineText text={block.text} />
            </p>
          );
        }

        if (block.type === 'callout') {
          if (!(block.text || '').trim()) return null;
          return (
            <Callout type={block.calloutType} key={index}>
              <InlineText text={block.text} />
            </Callout>
          );
        }

        if (block.type === 'list-group') {
          const List = block.ordered ? 'ol' : 'ul';
          const firstNumber = block.items[0]?.number;
          const taskItems = block.items.map((item: MarkdownBlock) =>
            item.text?.match(/^\[([ xX])\]\s+(.*)$/)
          );
          const isTaskList = !block.ordered && taskItems.length > 0 && taskItems.every(Boolean);

          return (
            <List
              className={`my-2 space-y-1 pl-5 ${
                block.ordered
                  ? 'list-decimal'
                  : isTaskList
                  ? 'list-none !pl-0 space-y-2'
                  : 'list-disc'
              }`}
              start={block.ordered ? firstNumber : undefined}
              key={index}
            >
              {block.items.map((item: MarkdownBlock, itemIndex: number) => {
                const task = taskItems[itemIndex];
                return (
                  <li
                    className={`text-zinc-300 leading-relaxed ${task ? 'flex items-center gap-2.5' : ''}`}
                    key={itemIndex}
                  >
                    {task && (
                      <input
                        type="checkbox"
                        checked={task[1].toLowerCase() === 'x'}
                        disabled
                        className="rounded border-white/[0.1] bg-[#16161c] accent-sky-400 focus:ring-0 w-3.5 h-3.5"
                        aria-label={task[1].toLowerCase() === 'x' ? 'Completed task' : 'Pending task'}
                      />
                    )}
                    {task ? (
                      <span className={task[1].toLowerCase() === 'x' ? 'line-through text-zinc-500' : ''}>
                        <InlineText text={task[2]} />
                      </span>
                    ) : (
                      <InlineText text={item.text} />
                    )}
                  </li>
                );
              })}
            </List>
          );
        }

        if (block.type === 'quote') {
          const text = (block.text || '').trim();

          // ── Intelligent Scope Card ──
          if (/^Scope:\s*/i.test(text)) {
            return (
              <div
                key={index}
                className="my-2.5 p-3.5 rounded-xl neu-tile bg-sky-500/[0.06] border border-sky-500/25 text-xs text-sky-200 flex items-start gap-2.5"
              >
                <span className="text-base shrink-0">🎯</span>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-sky-400">
                    SCOPE
                  </span>
                  <p className="text-zinc-200 leading-relaxed font-medium">
                    <InlineText text={text.replace(/^Scope:\s*/i, '')} />
                  </p>
                </div>
              </div>
            );
          }

          // ── Intelligent Domain Card ──
          if (/^Domain:\s*/i.test(text)) {
            return (
              <div
                key={index}
                className="my-2.5 p-3.5 rounded-xl neu-tile bg-indigo-500/[0.06] border border-indigo-500/25 text-xs text-indigo-200 flex items-start gap-2.5"
              >
                <span className="text-base shrink-0">🌐</span>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-400">
                    ARCHITECTURE DOMAIN
                  </span>
                  <p className="text-zinc-200 leading-relaxed font-medium">
                    <InlineText text={text.replace(/^Domain:\s*/i, '')} />
                  </p>
                </div>
              </div>
            );
          }

          // ── Intelligent Target Surface Card ──
          if (/^Applies to:\s*/i.test(text) || /^Target:\s*/i.test(text)) {
            return (
              <div
                key={index}
                className="my-2.5 p-3.5 rounded-xl neu-tile bg-emerald-500/[0.06] border border-emerald-500/25 text-xs text-emerald-200 flex items-start gap-2.5"
              >
                <span className="text-base shrink-0">🛡️</span>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400">
                    APPLIES TO
                  </span>
                  <p className="text-zinc-200 leading-relaxed font-medium">
                    <InlineText text={text.replace(/^(?:Applies to|Target):\s*/i, '')} />
                  </p>
                </div>
              </div>
            );
          }

          // ── Inviolable Mandate Card ──
          if (/^Rule\s*#?\d+:?\s*/i.test(text) || /^Invariant\s*#?\d+:?\s*/i.test(text)) {
            return (
              <div
                key={index}
                className="my-2.5 p-3.5 rounded-xl neu-tile bg-amber-500/[0.06] border border-amber-500/30 text-xs text-amber-200 flex items-start gap-2.5"
              >
                <span className="text-base shrink-0">⚠️</span>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400">
                    INVIOLABLE MANDATE
                  </span>
                  <p className="text-zinc-200 leading-relaxed font-medium">
                    <InlineText text={text} />
                  </p>
                </div>
              </div>
            );
          }

          // Standard Quote
          return (
            <blockquote
              key={index}
              className="my-3 pl-4 border-l-2 border-zinc-600 bg-white/[0.02] py-2.5 pr-3 rounded-r-xl italic text-zinc-400 text-xs"
            >
              <InlineText text={block.text} />
            </blockquote>
          );
        }

        if (block.type === 'code') {
          return <CodeBlock code={block.text || ''} language={block.language} key={index} />;
        }

        if (block.type === 'table') {
          return (
            <div
              key={index}
              className="my-5 w-full overflow-x-auto rounded-2xl neu-inset border border-white/[0.07] bg-[#09090c]"
            >
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-white/[0.08] bg-[#121217]">
                    {(block.headers || []).map((header: string, headerIndex: number) => (
                      <th
                        key={headerIndex}
                        className="p-3.5 font-bold text-white tracking-wide uppercase text-[10.5px] font-mono border-r border-white/[0.04] last:border-r-0"
                      >
                        <InlineText text={header} />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.05]">
                  {(block.rows || []).map((row: string[], rowIndex: number) => (
                    <tr
                      key={rowIndex}
                      className="hover:bg-white/[0.03] transition-colors odd:bg-transparent even:bg-white/[0.01]"
                    >
                      {row.map((cell: string, cellIndex: number) => (
                        <td
                          key={cellIndex}
                          className="p-3.5 text-zinc-300 font-mono text-[11px] border-r border-white/[0.04] last:border-r-0 leading-relaxed"
                        >
                          <InlineText text={cell} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }

        return null;
      })}
    </div>
  );
});
