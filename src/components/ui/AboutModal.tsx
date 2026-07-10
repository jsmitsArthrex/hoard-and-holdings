import { useState } from 'react';
import { X } from 'lucide-react';
import readmeRaw from '../../../README.md?raw';

const INK = '#2C1810';
const PARCHMENT = '#C4934A';
const GOLD = '#C9A227';

// ── Inline text renderer (handles **bold** and `code`) ─────────────────────
function InlineText({ text, baseKey }: { text: string; baseKey: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <strong key={`${baseKey}-${i}`} style={{ color: PARCHMENT, fontWeight: 700 }}>
              {part.slice(2, -2)}
            </strong>
          );
        }
        if (part.startsWith('`') && part.endsWith('`')) {
          return (
            <code
              key={`${baseKey}-${i}`}
              style={{
                background: '#2C181040',
                border: `1px solid ${PARCHMENT}30`,
                borderRadius: 3,
                padding: '1px 5px',
                fontFamily: 'monospace',
                fontSize: '0.9em',
                color: GOLD,
              }}
            >
              {part.slice(1, -1)}
            </code>
          );
        }
        return <span key={`${baseKey}-${i}`}>{part}</span>;
      })}
    </>
  );
}

// ── Block types ─────────────────────────────────────────────────────────────
type Block =
  | { type: 'heading'; level: 1 | 2 | 3 | 4; text: string }
  | { type: 'rule' }
  | { type: 'code'; lang: string; content: string }
  | { type: 'table'; headers: string[]; rows: string[][] }
  | { type: 'list'; items: string[] }
  | { type: 'paragraph'; text: string };

function parseMarkdown(markdown: string): Block[] {
  const lines = markdown.split('\n');
  const blocks: Block[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Empty line
    if (line.trim() === '') { i++; continue; }

    // Horizontal rule
    if (/^---+$/.test(line.trim())) {
      blocks.push({ type: 'rule' });
      i++;
      continue;
    }

    // Heading
    const hMatch = line.match(/^(#{1,4})\s+(.+)$/);
    if (hMatch) {
      blocks.push({ type: 'heading', level: hMatch[1].length as 1 | 2 | 3 | 4, text: hMatch[2] });
      i++;
      continue;
    }

    // Fenced code block
    if (line.startsWith('```')) {
      const lang = line.slice(3).trim();
      const content: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) {
        content.push(lines[i]);
        i++;
      }
      blocks.push({ type: 'code', lang, content: content.join('\n') });
      i++;
      continue;
    }

    // Table
    if (line.startsWith('|')) {
      const rows: string[][] = [];
      while (i < lines.length && lines[i].startsWith('|')) {
        const cells = lines[i]
          .split('|')
          .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1)
          .map(c => c.trim());
        if (!cells.every(c => /^[-:]+$/.test(c))) {
          rows.push(cells);
        }
        i++;
      }
      if (rows.length > 0) {
        blocks.push({ type: 'table', headers: rows[0], rows: rows.slice(1) });
      }
      continue;
    }

    // List
    if (line.startsWith('- ')) {
      const items: string[] = [];
      while (i < lines.length && lines[i].startsWith('- ')) {
        items.push(lines[i].slice(2));
        i++;
      }
      blocks.push({ type: 'list', items });
      continue;
    }

    // Paragraph (collect consecutive non-special lines)
    const paraLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !lines[i].startsWith('#') &&
      !lines[i].startsWith('|') &&
      !lines[i].startsWith('```') &&
      !lines[i].startsWith('- ') &&
      !/^---+$/.test(lines[i].trim())
    ) {
      paraLines.push(lines[i]);
      i++;
    }
    if (paraLines.length > 0) {
      blocks.push({ type: 'paragraph', text: paraLines.join(' ') });
    }
  }

  return blocks;
}

// ── Block renderer ──────────────────────────────────────────────────────────
function RenderBlocks({ blocks }: { blocks: Block[] }) {
  return (
    <>
      {blocks.map((block, bi) => {
        const key = `block-${bi}`;

        if (block.type === 'heading') {
          const sizes: Record<number, number> = { 1: 22, 2: 19, 3: 17, 4: 15 };
          const topMargins: Record<number, number> = { 1: 0, 2: 22, 3: 16, 4: 12 };
          return (
            <div
              key={key}
              style={{
                fontFamily: '"Cinzel", serif',
                fontWeight: block.level <= 2 ? 700 : 600,
                fontSize: sizes[block.level],
                color: block.level === 1 ? GOLD : block.level === 2 ? PARCHMENT : '#C8B07A',
                marginTop: topMargins[block.level],
                marginBottom: 8,
                letterSpacing: block.level <= 2 ? 1 : 0.5,
                borderBottom: block.level <= 2 ? `1px solid ${GOLD}25` : 'none',
                paddingBottom: block.level <= 2 ? 5 : 0,
              }}
            >
              <InlineText text={block.text} baseKey={key} />
            </div>
          );
        }

        if (block.type === 'rule') {
          return (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '18px 0' }}>
              <div style={{ flex: 1, height: 1, background: `linear-gradient(to right, transparent, ${GOLD}50)` }} />
              <span style={{ color: GOLD, fontSize: 13, opacity: 0.6 }}>✦</span>
              <div style={{ flex: 1, height: 1, background: `linear-gradient(to left, transparent, ${GOLD}50)` }} />
            </div>
          );
        }

        if (block.type === 'code') {
          return (
            <pre
              key={key}
              style={{
                background: '#120600',
                border: `1px solid ${PARCHMENT}25`,
                borderRadius: 5,
                padding: '12px 14px',
                fontFamily: 'monospace',
                fontSize: 14,
                color: '#CCAA70',
                overflowX: 'auto',
                margin: '8px 0',
                lineHeight: 1.6,
                whiteSpace: 'pre',
              }}
            >
              {block.content}
            </pre>
          );
        }

        if (block.type === 'table') {
          return (
            <div key={key} style={{ overflowX: 'auto', margin: '10px 0' }}>
              <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 16 }}>
                <thead>
                  <tr>
                    {block.headers.map((h, hi) => (
                      <th
                        key={hi}
                        style={{
                          fontFamily: '"Cinzel", serif',
                          fontWeight: 600,
                          fontSize: 14,
                          color: GOLD,
                          borderBottom: `1px solid ${GOLD}40`,
                          padding: '6px 10px',
                          textAlign: 'left',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        <InlineText text={h} baseKey={`${key}-h-${hi}`} />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {block.rows.map((row, ri) => (
                    <tr
                      key={ri}
                      style={{ background: ri % 2 === 0 ? '#FFFFFF05' : 'transparent' }}
                    >
                      {row.map((cell, ci) => (
                        <td
                          key={ci}
                          style={{
                            padding: '5px 10px',
                            color: '#C8A880',
                            borderBottom: `1px solid ${PARCHMENT}15`,
                            verticalAlign: 'top',
                            lineHeight: 1.5,
                          }}
                        >
                          <InlineText text={cell} baseKey={`${key}-r-${ri}-c-${ci}`} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }

        if (block.type === 'list') {
          return (
            <ul key={key} style={{ margin: '6px 0', paddingLeft: 20, listStyle: 'none' }}>
              {block.items.map((item, ii) => (
                <li
                  key={ii}
                  style={{
                    color: '#C8A880',
                    fontSize: 17,
                    lineHeight: 1.6,
                    paddingLeft: 4,
                    marginBottom: 3,
                    display: 'flex',
                    gap: 8,
                    alignItems: 'flex-start',
                  }}
                >
                  <span style={{ color: GOLD, flexShrink: 0 }}>›</span>
                  <span><InlineText text={item} baseKey={`${key}-li-${ii}`} /></span>
                </li>
              ))}
            </ul>
          );
        }

        if (block.type === 'paragraph') {
          return (
            <p
              key={key}
              style={{
                color: '#C8A880',
                fontSize: 17,
                lineHeight: 1.7,
                margin: '0 0 10px',
              }}
            >
              <InlineText text={block.text} baseKey={key} />
            </p>
          );
        }

        return null;
      })}
    </>
  );
}

// ── Section nav items parsed from H2 headings ───────────────────────────────
interface SectionLink { id: string; label: string }

function buildSectionLinks(blocks: Block[]): SectionLink[] {
  return blocks
    .filter((b): b is Extract<Block, { type: 'heading' }> => b.type === 'heading' && b.level === 2)
    .map(b => ({ id: b.text.replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase(), label: b.text }));
}

// ── Main modal ───────────────────────────────────────────────────────────────
interface AboutModalProps { onClose: () => void }

export default function AboutModal({ onClose }: AboutModalProps) {
  const blocks = parseMarkdown(readmeRaw);
  const sections = buildSectionLinks(blocks);
  const [activeSection, setActiveSection] = useState<string | null>(null);

  function scrollToSection(id: string) {
    setActiveSection(id);
    document.getElementById(`about-section-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // Attach IDs to H2 blocks for anchor scrolling
  let h2Index = 0;
  const blocksWithIds = blocks.map(block => {
    if (block.type === 'heading' && block.level === 2) {
      const id = sections[h2Index]?.id ?? '';
      h2Index++;
      return { block, anchorId: `about-section-${id}` };
    }
    return { block, anchorId: undefined };
  });

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 400,
        background: 'rgba(8,3,0,0.85)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '90vw', maxWidth: 900,
          height: '88vh',
          display: 'flex', flexDirection: 'column',
          background: '#160800',
          border: `2px solid ${GOLD}50`,
          borderRadius: 10,
          boxShadow: `0 12px 60px rgba(0,0,0,0.85), 0 0 0 1px ${PARCHMENT}15`,
          overflow: 'hidden',
          fontFamily: '"Crimson Text", Georgia, serif',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Header bar ── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 22px',
          background: `linear-gradient(135deg, #2C1200 0%, #1A0800 100%)`,
          borderBottom: `1px solid ${GOLD}30`,
          flexShrink: 0,
        }}>
          <div style={{
            fontFamily: '"Cinzel", serif', fontWeight: 700, fontSize: 18,
            color: GOLD, letterSpacing: 2,
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            📖 About Hoard & Holdings
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: `1px solid ${PARCHMENT}40`,
              borderRadius: 4, padding: '4px 7px', cursor: 'pointer',
              color: PARCHMENT, display: 'flex', alignItems: 'center',
            }}
            title="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* ── Body: sidebar + content ── */}
        <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
          {/* Section nav sidebar */}
          <nav style={{
            width: 200, flexShrink: 0,
            background: '#0D0400',
            borderRight: `1px solid ${GOLD}20`,
            overflowY: 'auto',
            padding: '14px 0',
          }}>
            {sections.map(sec => (
              <button
                key={sec.id}
                onClick={() => scrollToSection(sec.id)}
                style={{
                  display: 'block', width: '100%',
                  textAlign: 'left',
                  background: activeSection === sec.id ? `${GOLD}15` : 'none',
                  border: 'none',
                  borderLeft: activeSection === sec.id ? `2px solid ${GOLD}` : '2px solid transparent',
                  padding: '6px 16px',
                  cursor: 'pointer',
                  color: activeSection === sec.id ? GOLD : `${PARCHMENT}90`,
                  fontFamily: '"Cinzel", serif',
                  fontSize: 13,
                  letterSpacing: 0.3,
                  lineHeight: 1.4,
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => {
                  if (activeSection !== sec.id)
                    (e.currentTarget as HTMLButtonElement).style.color = PARCHMENT;
                }}
                onMouseLeave={e => {
                  if (activeSection !== sec.id)
                    (e.currentTarget as HTMLButtonElement).style.color = `${PARCHMENT}90`;
                }}
              >
                {sec.label}
              </button>
            ))}
          </nav>

          {/* Scrollable content */}
          <div style={{
            flex: 1, overflowY: 'auto',
            padding: '20px 28px 36px',
            scrollbarWidth: 'thin',
            scrollbarColor: `${GOLD}40 transparent`,
          }}>
            {blocksWithIds.map(({ block, anchorId }, bi) => (
              <div key={bi} id={anchorId}>
                <RenderBlocks blocks={[block]} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
