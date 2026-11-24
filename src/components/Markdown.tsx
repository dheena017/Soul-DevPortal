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
  text?: string;
}

function InlineText({ text = '' }: InlineTextProps) {
  if (!text) return null;

  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*|~~[^~]+~~|\[[^\]]+\]\([^)]+\)|\*[^*]+\*|_[^_]+_)/g);

  return (
    <>
      {parts.map((part, index) => {
        if (!part) return null;
        if (part.startsWith('`') && part.endsWith('`')) {
          return (
            <code
              key={index}
              className="px-1.5 py-0.5 rounded bg-[#111111] border border-[#222222] text-[11px] font-mono text-blue-300"
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
            <del key={index} className="text-neutral-500 line-through">
              {part.slice(2, -2)}
            </del>
          );
        }
        if ((part.startsWith('*') && part.endsWith('*')) || (part.startsWith('_') && part.endsWith('_'))) {
          return (
            <em key={index} className="italic text-neutral-300">
              {part.slice(1, -1)}
            </em>
          );
        }

        const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
        if (link) {
          return (
            <a
              key={index}
              href={link[2]}
              target={link[2].startsWith('http') ? '_blank' : undefined}
              rel={link[2].startsWith('http') ? 'noreferrer' : undefined}
              className="text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors font-medium"
            >
              {link[1]}
            </a>
          );
        }
        return <React.Fragment key={index}>{part}</React.Fragment>;
      })}
    </>
  );
}

interface CodeBlockProps {
  key?: React.Key;
  code: string;
  language?: string;
}

function CodeBlock({ code, language }: CodeBlockProps) {
  const [wrap, setWrap] = useState<boolean>(false);
  const lines = (code || '').split('\n');
  const lineCount = lines.length;

  return (
    <div className="my-4 rounded-xl bg-[#0a0a0a] border border-[#1a1a1a] overflow-hidden shadow-lg group">
      {/* Code Toolbar */}
      <div className="flex items-center justify-between px-3.5 py-2 bg-[#111111] border-b border-[#1a1a1a] text-xs">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-[#111111] text-blue-400 border border-[#222222]">
            {language || 'text'}
          </span>
          <span className="text-[11px] font-mono text-neutral-500">
            {lineCount} {lineCount === 1 ? 'line' : 'lines'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
              wrap
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                : 'text-neutral-500 hover:text-neutral-300 hover:bg-[#111111]'
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
        className={`p-4 text-xs font-mono text-neutral-300 leading-relaxed overflow-x-auto ${
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
    const hash = window.location.hash.split('#')[1] ? '#' + window.location.hash.split('#')[1].split('?')[0] : '';
    const url = `${window.location.origin}${window.location.pathname}${hash}#${id}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedAnchor(true);
      window.setTimeout(() => setCopiedAnchor(false), 1200);
    });
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const Tag = (`h${level}` as 'h1' | 'h2' | 'h3' | 'h4');

  const levelStyles: Record<number, string> = {
    1: 'text-2xl md:text-3xl font-extrabold text-white mt-8 mb-4 tracking-tight pb-2 border-b border-[#1a1a1a]',
    2: 'text-xl md:text-2xl font-bold text-white mt-8 mb-3 tracking-tight pb-1.5 border-b border-[#1a1a1a]',
    3: 'text-base md:text-lg font-semibold text-neutral-100 mt-6 mb-2',
    4: 'text-sm font-semibold text-neutral-200 mt-4 mb-2',
  };

  return (
    <Tag id={id} className={`group flex items-center gap-2 ${levelStyles[level] || ''}`}>
      <span>
        <InlineText text={text} />
      </span>
      <button
        type="button"
        className={`opacity-0 group-hover:opacity-100 transition-opacity text-xs font-mono px-1.5 py-0.5 rounded text-neutral-500 hover:text-blue-400 hover:bg-[#111111] ${
          copiedAnchor ? '!opacity-100 !text-blue-400' : ''
        }`}
        onClick={copyAnchorLink}
        title={copiedAnchor ? 'Anchor link copied!' : 'Copy link to this section'}
        aria-label={`Copy link to section ${text}`}
      >
        {copiedAnchor ? 'copied!' : '#'}
      </button>
    </Tag>
  );
}

export interface MarkdownProps {
  blocks?: MarkdownBlock[];
  skipFirstHeading?: boolean;
}

export default function Markdown({ blocks = [], skipFirstHeading = false }: MarkdownProps) {
  let skippedHeading = false;
  const groupedBlocks: any[] = [];

  for (let index = 0; index < blocks.length; index += 1) {
    const block = blocks[index];

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

  return (
    <div className="w-full flex flex-col text-neutral-300 leading-relaxed text-xs md:text-sm">
      {groupedBlocks.map((block, index) => {
        if (block.type === 'h1') {
          if (skipFirstHeading && !skippedHeading) {
            skippedHeading = true;
            return null;
          }
          return <HeadingWithAnchor level={1} text={block.text} key={index} />;
        }
        if (block.type === 'h2') return <HeadingWithAnchor level={2} text={block.text} key={index} />;
        if (block.type === 'h3') return <HeadingWithAnchor level={3} text={block.text} key={index} />;
        if (block.type === 'h4') return <HeadingWithAnchor level={4} text={block.text} key={index} />;
        if (block.type === 'p') {
          const trimmed = (block.text || '').trim();
          if (trimmed.startsWith('```')) {
            const lines = trimmed.split('\n');
            const lang = lines[0].replace(/^```/, '').trim();
            const lastLine = lines[lines.length - 1].trim();
            const body = lastLine === '```' ? lines.slice(1, -1) : lines.slice(1);
            return <CodeBlock code={body.join('\n')} language={lang || 'text'} key={index} />;
          }
          return (
            <p className="my-2 text-neutral-300 leading-relaxed" key={index}>
              <InlineText text={block.text} />
            </p>
          );
        }

        if (block.type === 'callout') {
          return (
            <Callout type={block.calloutType} key={index}>
              <InlineText text={block.text} />
            </Callout>
          );
        }

        if (block.type === 'list-group') {
          const List = block.ordered ? 'ol' : 'ul';
          const firstNumber = block.items[0]?.number;
          const taskItems = block.items.map((item: MarkdownBlock) => item.text?.match(/^\[([ xX])\]\s+(.*)$/));
          const isTaskList = !block.ordered && taskItems.length > 0 && taskItems.every(Boolean);

          return (
            <List
              className={`my-2 space-y-1 pl-5 ${
                block.ordered ? 'list-decimal' : isTaskList ? 'list-none !pl-0 space-y-2' : 'list-disc'
              }`}
              start={block.ordered ? firstNumber : undefined}
              key={index}
            >
              {block.items.map((item: MarkdownBlock, itemIndex: number) => {
                const task = taskItems[itemIndex];
                return (
                  <li className={`text-neutral-300 leading-relaxed ${task ? 'flex items-center gap-2.5' : ''}`} key={itemIndex}>
                    {task && (
                      <input
                        type="checkbox"
                        checked={task[1].toLowerCase() === 'x'}
                        disabled
                        className="rounded border-[#222222] bg-[#111111] text-blue-500 focus:ring-0 w-3.5 h-3.5"
                        aria-label={task[1].toLowerCase() === 'x' ? 'Completed task' : 'Pending task'}
                      />
                    )}
                    {task ? (
                      <span className={task[1].toLowerCase() === 'x' ? 'line-through text-neutral-500' : ''}>
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
          return (
            <blockquote
              key={index}
              className="my-3 pl-4 border-l-2 border-blue-500/40 bg-[#111111]/50 py-2 pr-3 rounded-r-lg italic text-neutral-400"
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
            <div key={index} className="my-4 w-full overflow-x-auto rounded-xl border border-[#1a1a1a] bg-[#0a0a0a]">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#1a1a1a] bg-[#111111]">
                    {(block.headers || []).map((header: string, headerIndex: number) => (
                      <th key={headerIndex} className="p-3 font-semibold text-neutral-200">
                        <InlineText text={header} />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1a1a1a]">
                  {(block.rows || []).map((row: string[], rowIndex: number) => (
                    <tr key={rowIndex} className="hover:bg-[#111111] transition-colors">
                      {row.map((cell: string, cellIndex: number) => (
                        <td key={cellIndex} className="p-3 text-neutral-400">
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
}
