import React, { useState } from 'react';

export interface NoteMarkdownPreviewProps {
  content: string;
  fontSize?: 'sm' | 'md' | 'lg';
  onToggleCheckbox: (lineIndex: number) => void;
  containerRef?: React.RefObject<HTMLDivElement | null>;
}

const FONT_SIZE_CLASS: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
};

function renderInlineSpans(text: string): React.ReactNode[] {
  const tokenRegex =
    /(\*\*[^*]+\*\*|\*[^*]+\*|~~[^~]+~~|`[^`]+`|\[[^\]]+\]\((https?:\/\/[^)\s]+)\))/g;
  const nodes: React.ReactNode[] = [];
  let lastIdx = 0;
  let match: RegExpExecArray | null;
  let keyCounter = 0;

  while ((match = tokenRegex.exec(text)) !== null) {
    if (match.index > lastIdx) {
      nodes.push(text.slice(lastIdx, match.index));
    }
    const token = match[0];
    keyCounter += 1;
    if (token.startsWith('**') && token.endsWith('**')) {
      nodes.push(
        <strong key={keyCounter} className="font-bold text-white">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith('*') && token.endsWith('*')) {
      nodes.push(
        <em key={keyCounter} className="italic text-zinc-200">
          {token.slice(1, -1)}
        </em>
      );
    } else if (token.startsWith('~~') && token.endsWith('~~')) {
      nodes.push(
        <del key={keyCounter} className="line-through text-zinc-500">
          {token.slice(2, -2)}
        </del>
      );
    } else if (token.startsWith('`') && token.endsWith('`')) {
      nodes.push(
        <code
          key={keyCounter}
          className="px-1.5 py-0.5 rounded bg-[#1a1c26] border border-white/[0.1] font-mono text-[0.88em] text-sky-300"
        >
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith('[')) {
      const m = /^\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)$/.exec(token);
      if (m) {
        nodes.push(
          <a
            key={keyCounter}
            href={m[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sky-300 underline decoration-sky-400/40 hover:text-sky-200"
          >
            {m[1]}
          </a>
        );
      } else {
        nodes.push(token);
      }
    }
    lastIdx = tokenRegex.lastIndex;
  }

  if (lastIdx < text.length) {
    nodes.push(text.slice(lastIdx));
  }
  return nodes;
}

export const NoteMarkdownPreview: React.FC<NoteMarkdownPreviewProps> = ({
  content,
  fontSize = 'md',
  onToggleCheckbox,
  containerRef,
}) => {
  const [copiedBlockKey, setCopiedBlockKey] = useState<string | null>(null);
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  const sizeClass = FONT_SIZE_CLASS[fontSize];

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // Fenced code blocks ```
    if (trimmed.startsWith('```')) {
      const lang = trimmed.slice(3).trim() || 'code';
      const codeLines: string[] = [];
      const startLine = i;
      i += 1;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i += 1;
      }
      const codeText = codeLines.join('\n');
      const blockKey = `code-${startLine}`;
      elements.push(
        <div
          key={blockKey}
          className="rounded-xl bg-[#07080b] border border-white/[0.09] overflow-hidden my-1"
        >
          <div className="px-3 py-1.5 bg-[#12141c] border-b border-white/[0.06] flex items-center justify-between text-[10px] font-mono text-zinc-400">
            <span>{lang}</span>
            <button
              type="button"
              onClick={() => {
                void navigator.clipboard.writeText(codeText);
                setCopiedBlockKey(blockKey);
                window.setTimeout(() => setCopiedBlockKey(null), 1500);
              }}
              className="text-sky-300 hover:text-sky-200 cursor-pointer"
            >
              {copiedBlockKey === blockKey ? '✓ Copied' : 'Copy'}
            </button>
          </div>
          <pre className="p-3 text-xs font-mono text-emerald-200 overflow-x-auto leading-relaxed">
            <code>{codeText}</code>
          </pre>
        </div>
      );
      i += 1;
      continue;
    }

    // Markdown Tables | col |
    if (
      trimmed.startsWith('|') &&
      i + 1 < lines.length &&
      /^\s*\|[\s:-]+\|/.test(lines[i + 1])
    ) {
      const parseRow = (rowStr: string) =>
        rowStr
          .trim()
          .replace(/^\|/, '')
          .replace(/\|$/, '')
          .split('|')
          .map((c) => c.trim());
      const headers = parseRow(line);
      const startRow = i;
      i += 2;
      const bodyRows: string[][] = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        bodyRows.push(parseRow(lines[i]));
        i += 1;
      }
      elements.push(
        <div key={`tbl-${startRow}`} className="overflow-x-auto rounded-xl border border-white/[0.09] my-1">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-[#161822] text-zinc-200 font-mono">
              <tr>
                {headers.map((h, hIdx) => (
                  <th key={hIdx} className="px-3 py-2 border-b border-white/[0.08] font-bold">
                    {renderInlineSpans(h)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06]">
              {bodyRows.map((row, rIdx) => (
                <tr key={rIdx} className="bg-[#0b0c11]">
                  {headers.map((_, cIdx) => (
                    <td key={cIdx} className="px-3 py-2 text-zinc-300">
                      {renderInlineSpans(row[cIdx] || '')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      continue;
    }

    if (!trimmed) {
      elements.push(<div key={`sp-${i}`} className="h-2" />);
    } else if (trimmed === '---' || trimmed === '***') {
      elements.push(<hr key={`hr-${i}`} className="border-white/[0.1] my-2" />);
    } else if (/^#\s+/.test(trimmed)) {
      const text = trimmed.replace(/^#\s+/, '');
      elements.push(
        <h2
          key={`h1-${i}`}
          data-note-heading={i}
          className="text-xl font-extrabold text-white mt-2 tracking-tight"
        >
          {renderInlineSpans(text)}
        </h2>
      );
    } else if (/^##\s+/.test(trimmed)) {
      const text = trimmed.replace(/^##\s+/, '');
      elements.push(
        <h3
          key={`h2-${i}`}
          data-note-heading={i}
          className="text-base font-bold text-sky-300 mt-2"
        >
          {renderInlineSpans(text)}
        </h3>
      );
    } else if (/^###\s+/.test(trimmed)) {
      const text = trimmed.replace(/^###\s+/, '');
      elements.push(
        <h4
          key={`h3-${i}`}
          data-note-heading={i}
          className={`${sizeClass} font-bold text-zinc-100 mt-1.5`}
        >
          {renderInlineSpans(text)}
        </h4>
      );
    } else if (/^-\s*\[[ xX]\]/.test(trimmed)) {
      const lineIdx = i;
      const checked = /^-\s*\[[xX]\]/.test(trimmed);
      const label = trimmed.replace(/^-\s*\[[ xX]\]\s*/, '');
      elements.push(
        <button
          key={`chk-${lineIdx}`}
          type="button"
          onClick={() => onToggleCheckbox(lineIdx)}
          className={`flex items-start gap-2.5 text-left py-0.5 ${sizeClass} text-zinc-200 hover:text-white cursor-pointer`}
        >
          <span
            className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 text-[10px] ${
              checked
                ? 'bg-emerald-400 border-emerald-400 text-zinc-950 font-bold'
                : 'border-white/30 bg-[#08090c]'
            }`}
          >
            {checked ? '✓' : ''}
          </span>
          <span className={checked ? 'line-through text-zinc-500' : ''}>
            {renderInlineSpans(label)}
          </span>
        </button>
      );
    } else if (/^>\s*/.test(trimmed)) {
      elements.push(
        <blockquote
          key={`qt-${i}`}
          className={`pl-3 border-l-2 border-sky-400/50 ${sizeClass} text-zinc-300 italic py-0.5`}
        >
          {renderInlineSpans(trimmed.replace(/^>\s*/, ''))}
        </blockquote>
      );
    } else if (/^\d+\.\s+/.test(trimmed)) {
      const m = /^(\d+\.)\s+(.*)$/.exec(trimmed);
      elements.push(
        <div key={`ol-${i}`} className={`flex items-start gap-2 ${sizeClass} text-zinc-200`}>
          <span className="font-mono text-sky-300 font-bold shrink-0">{m?.[1]}</span>
          <span>{renderInlineSpans(m?.[2] || trimmed)}</span>
        </div>
      );
    } else if (/^[-*]\s+/.test(trimmed)) {
      elements.push(
        <div key={`ul-${i}`} className={`flex items-start gap-2 ${sizeClass} text-zinc-200`}>
          <span className="text-sky-400 mt-0.5 shrink-0">•</span>
          <span>{renderInlineSpans(trimmed.replace(/^[-*]\s+/, ''))}</span>
        </div>
      );
    } else {
      elements.push(
        <p key={`p-${i}`} className={`${sizeClass} text-zinc-200 leading-relaxed`}>
          {renderInlineSpans(line)}
        </p>
      );
    }

    i += 1;
  }

  return (
    <div ref={containerRef} className="flex flex-col gap-2">
      {elements}
    </div>
  );
};
