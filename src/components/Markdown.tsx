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
          return <code key={index}>{part.slice(1, -1)}</code>;
        }
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={index}>{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith('~~') && part.endsWith('~~')) {
          return <del key={index}>{part.slice(2, -2)}</del>;
        }
        if ((part.startsWith('*') && part.endsWith('*')) || (part.startsWith('_') && part.endsWith('_'))) {
          return <em key={index}>{part.slice(1, -1)}</em>;
        }

        const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
        if (link) {
          return (
            <a
              className="document-link"
              href={link[2]}
              target={link[2].startsWith('http') ? '_blank' : undefined}
              rel={link[2].startsWith('http') ? 'noreferrer' : undefined}
              key={index}
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
  code: string;
  language?: string;
}

function CodeBlock({ code, language }: CodeBlockProps) {
  const [wrap, setWrap] = useState<boolean>(false);
  const lines = (code || '').split('\n');
  const lineCount = lines.length;

  return (
    <div className={`code-block ${wrap ? 'wrapped' : ''}`}>
      <div className="code-toolbar">
        <div className="code-lang-group">
          <span className="code-lang-badge">{language || 'text'}</span>
          <span className="code-lines-badge">{lineCount} {lineCount === 1 ? 'line' : 'lines'}</span>
        </div>
        <div className="code-actions">
          <button
            type="button"
            className={`code-wrap-btn ${wrap ? 'active' : ''}`}
            onClick={() => setWrap(!wrap)}
            title={wrap ? 'Disable line wrap' : 'Enable line wrap'}
          >
            wrap
          </button>
          <CopyButton text={code} label="Copy" copiedLabel="Copied" />
        </div>
      </div>
      <pre>
        <code>{code}</code>
      </pre>
    </div>
  );
}

interface HeadingWithAnchorProps {
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

  const Tag = `h${level}` as keyof JSX.IntrinsicElements;
  const classNameMap: Record<number, string> = {
    1: 'document-title',
    2: 'document-heading',
    3: 'document-subheading',
    4: 'document-mini-heading',
  };

  return (
    <Tag id={id} className={`heading-with-anchor ${classNameMap[level] || ''}`}>
      <InlineText text={text} />
      <button
        type="button"
        className={`heading-anchor-link ${copiedAnchor ? 'copied' : ''}`}
        onClick={copyAnchorLink}
        title={copiedAnchor ? 'Anchor link copied!' : 'Copy link to this section'}
        aria-label={`Copy link to section ${text}`}
      >
        #
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
    <>
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
          return <p className="document-paragraph" key={index}><InlineText text={block.text} /></p>;
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
            <List className={`document-list${block.ordered ? ' ordered' : ''}${isTaskList ? ' task-list' : ''}`} start={block.ordered ? firstNumber : undefined} key={index}>
              {block.items.map((item: MarkdownBlock, itemIndex: number) => {
                const task = taskItems[itemIndex];
                return (
                  <li className={task ? 'task-list-item' : undefined} key={itemIndex}>
                    {task && (
                      <input
                        type="checkbox"
                        checked={task[1].toLowerCase() === 'x'}
                        disabled
                        aria-label={task[1].toLowerCase() === 'x' ? 'Completed task' : 'Pending task'}
                      />
                    )}
                    {task ? (
                      <span><InlineText text={task[2]} /></span>
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
            <blockquote className="document-quote" key={index}>
              <InlineText text={block.text} />
            </blockquote>
          );
        }

        if (block.type === 'code') {
          return <CodeBlock code={block.text || ''} language={block.language} key={index} />;
        }

        if (block.type === 'table') {
          return (
            <div className="markdown-table-wrapper" key={index}>
              <div className="markdown-table">
                <table>
                  <thead>
                    <tr>
                      {(block.headers || []).map((header: string, headerIndex: number) => (
                        <th key={headerIndex}><InlineText text={header} /></th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(block.rows || []).map((row: string[], rowIndex: number) => (
                      <tr key={rowIndex}>
                        {row.map((cell: string, cellIndex: number) => (
                          <td key={cellIndex}><InlineText text={cell} /></td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        }

        return null;
      })}
    </>
  );
}
