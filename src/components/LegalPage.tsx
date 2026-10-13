import React from 'react';
import { LEGAL_DOCS, LegalDoc } from '../legal/legalDocs';

// A deliberately small, dependency-free Markdown renderer. It supports only
// the subset used by the Proteus legal documents (headings, paragraphs, bold,
// inline code, ordered/unordered lists, horizontal rules, and pipe tables).
// Content is rendered as React nodes — never as raw HTML — so there is no
// injection surface.

type Block =
  | { type: 'heading'; level: number; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'list'; ordered: boolean; items: string[] }
  | { type: 'table'; header: string[]; rows: string[][] }
  | { type: 'hr' };

function isBlockStart(line: string): boolean {
  const t = line.trim();
  return (
    /^#{1,6}\s+/.test(t) ||
    /^-{3,}$/.test(t) ||
    t.startsWith('|') ||
    /^[-*]\s+/.test(t) ||
    /^\d+\.\s+/.test(t)
  );
}

function isSeparatorRow(cells: string[]): boolean {
  return cells.length > 0 && cells.every((c) => /^:?-{1,}:?$/.test(c.replace(/\s/g, '')));
}

function splitRow(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((c) => c.trim());
}

function parseMarkdown(src: string): Block[] {
  const lines = src.replace(/\r\n/g, '\n').split('\n');
  const blocks: Block[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    if (line.trim() === '') {
      i++;
      continue;
    }

    if (/^\s*-{3,}\s*$/.test(line)) {
      blocks.push({ type: 'hr' });
      i++;
      continue;
    }

    const heading = line.match(/^(#{1,6})\s+(.*)$/);
    if (heading) {
      blocks.push({ type: 'heading', level: heading[1].length, text: heading[2].trim() });
      i++;
      continue;
    }

    if (line.trim().startsWith('|')) {
      const rows: string[][] = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        rows.push(splitRow(lines[i]));
        i++;
      }
      const header = rows[0] ?? [];
      const hasSeparator = rows.length >= 2 && isSeparatorRow(rows[1]);
      blocks.push({ type: 'table', header, rows: hasSeparator ? rows.slice(2) : rows.slice(1) });
      continue;
    }

    const ul = line.match(/^\s*[-*]\s+(.*)$/);
    const ol = line.match(/^\s*\d+\.\s+(.*)$/);
    if (ul || ol) {
      const ordered = Boolean(ol);
      const items: string[] = [];
      while (i < lines.length) {
        const m = ordered
          ? lines[i].match(/^\s*\d+\.\s+(.*)$/)
          : lines[i].match(/^\s*[-*]\s+(.*)$/);
        if (!m) break;
        items.push(m[1]);
        i++;
      }
      blocks.push({ type: 'list', ordered, items });
      continue;
    }

    const paragraph: string[] = [];
    while (i < lines.length && lines[i].trim() !== '' && !isBlockStart(lines[i])) {
      paragraph.push(lines[i].trim());
      i++;
    }
    blocks.push({ type: 'paragraph', text: paragraph.join(' ') });
  }

  return blocks;
}

function renderInline(text: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  const regex = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  let last = 0;
  let key = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) {
      nodes.push(text.slice(last, match.index));
    }
    const token = match[0];
    if (token.startsWith('**')) {
      nodes.push(
        <strong key={key++} className="font-semibold text-slate-900">
          {token.slice(2, -2)}
        </strong>
      );
    } else {
      nodes.push(
        <code key={key++} className="rounded bg-slate-100 px-1.5 py-0.5 text-[0.85em] text-indigo-700">
          {token.slice(1, -1)}
        </code>
      );
    }
    last = regex.lastIndex;
  }
  if (last < text.length) {
    nodes.push(text.slice(last));
  }
  return nodes;
}

function renderBlock(block: Block, index: number): React.ReactNode {
  switch (block.type) {
    case 'heading': {
      const sizes: Record<number, string> = {
        1: 'mt-0 mb-6 text-3xl sm:text-4xl font-bold font-serif text-slate-900',
        2: 'mt-10 mb-3 text-xl sm:text-2xl font-bold text-slate-900',
        3: 'mt-8 mb-2 text-lg font-semibold text-slate-900',
        4: 'mt-6 mb-2 text-base font-semibold text-slate-800',
        5: 'mt-4 mb-1 text-sm font-semibold text-slate-800',
        6: 'mt-4 mb-1 text-sm font-semibold text-slate-700',
      };
      const className = sizes[block.level] ?? sizes[4];
      const Tag = `h${Math.min(block.level, 6)}` as React.ElementType;
      return (
        <Tag key={index} className={className}>
          {renderInline(block.text)}
        </Tag>
      );
    }
    case 'paragraph':
      return (
        <p key={index} className="my-3 text-sm leading-relaxed text-slate-700">
          {renderInline(block.text)}
        </p>
      );
    case 'list': {
      const ListTag: React.ElementType = block.ordered ? 'ol' : 'ul';
      return (
        <ListTag
          key={index}
          className={`my-3 space-y-1.5 pl-5 text-sm leading-relaxed text-slate-700 ${
            block.ordered ? 'list-decimal' : 'list-disc'
          }`}
        >
          {block.items.map((item, idx) => (
            <li key={idx}>{renderInline(item)}</li>
          ))}
        </ListTag>
      );
    }
    case 'table':
      return (
        <div key={index} className="my-4 overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="bg-slate-100">
                {block.header.map((cell, idx) => (
                  <th key={idx} className="border border-slate-200 px-3 py-2 font-semibold text-slate-900">
                    {renderInline(cell)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, rIdx) => (
                <tr key={rIdx}>
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="border border-slate-200 px-3 py-2 align-top text-slate-700">
                      {renderInline(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case 'hr':
      return <hr key={index} className="my-8 border-slate-200" />;
    default:
      return null;
  }
}

export const LegalPage: React.FC<{ doc: LegalDoc }> = ({ doc }) => {
  const blocks = React.useMemo(() => parseMarkdown(doc.body), [doc.body]);

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-800">
      <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-900 text-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <a href="/" className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded bg-indigo-600 font-serif text-sm font-bold text-white">
              P
            </span>
            <span className="font-semibold text-slate-100">Proteus Legal</span>
          </a>
          <nav className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-300">
            {LEGAL_DOCS.map((item) => (
              <a
                key={item.slug}
                href={item.path}
                className={`transition hover:text-white ${item.slug === doc.slug ? 'font-semibold text-white' : ''}`}
              >
                {item.title}
              </a>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <a href="/" className="text-xs font-medium text-indigo-600 hover:text-indigo-500">
          &larr; Back to Proteus
        </a>

        <article className="mt-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
          {blocks.map(renderBlock)}
        </article>

        <p className="mt-6 text-center text-[11px] text-slate-500">
          Questions about these documents? Contact{' '}
          <a href="mailto:araddaoui@gmail.com" className="text-indigo-600 hover:text-indigo-500">
            araddaoui@gmail.com
          </a>
          .
        </p>
      </main>
    </div>
  );
};
