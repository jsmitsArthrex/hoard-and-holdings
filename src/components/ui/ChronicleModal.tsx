import { useState, useMemo, useRef, useEffect } from 'react';
import { useGameStore } from '../../store/gameStore';
import type { LogCategory } from '../../types';

const PARCHMENT = '#C4934A';

const CATEGORY_META: Record<LogCategory, { label: string; color: string; icon: string }> = {
  combat:   { label: 'Combat',   color: '#CC3333', icon: '⚔️' },
  economy:  { label: 'Economy',  color: '#C9A227', icon: '💰' },
  kobold:   { label: 'Kobold',   color: '#3A9A2A', icon: '🐉' },
  rival:    { label: 'Rival',    color: '#9B44C0', icon: '👁️' },
  event:    { label: 'Event',    color: '#2A9AAA', icon: '✨' },
  property: { label: 'Property', color: '#A06020', icon: '🏰' },
  system:   { label: 'System',   color: '#888888', icon: '⚙️' },
};

const TOD_ORDER: Record<string, number> = { morning: 0, afternoon: 1, evening: 2 };
const ALL_CATEGORIES: LogCategory[] = ['combat', 'economy', 'kobold', 'rival', 'event', 'property', 'system'];

const INPUT_STYLE: React.CSSProperties = {
  background: '#1A0A00', border: `1px solid ${PARCHMENT}40`,
  borderRadius: 3, color: PARCHMENT, fontSize: 15,
  padding: '3px 8px', fontFamily: '"Crimson Text", Georgia, serif',
};

export default function ChronicleModal({ onClose }: { onClose: () => void }) {
  const { gameLog, day: currentDay } = useGameStore();

  const minDayAll = gameLog.length > 0 ? gameLog[0].day : 1;

  const [dayMin, setDayMin] = useState(Math.max(minDayAll, currentDay - 20));
  const [dayMax, setDayMax] = useState(currentDay);
  const [search, setSearch] = useState('');
  const [activeCategories, setActiveCategories] = useState<Set<LogCategory>>(new Set(ALL_CATEGORIES));

  const toggleCategory = (cat: LogCategory) => {
    setActiveCategories(prev => {
      const next = new Set(prev);
      if (next.has(cat)) { next.delete(cat); } else { next.add(cat); }
      return next;
    });
  };

  const selectOnly = (cat: LogCategory) => {
    setActiveCategories(new Set([cat]));
  };

  const lowerSearch = search.toLowerCase();

  const allFiltered = useMemo(() => {
    return gameLog.filter(e => {
      const cat: LogCategory = (e as any).category ?? 'system';
      return (
        e.day >= dayMin &&
        e.day <= dayMax &&
        activeCategories.has(cat) &&
        (!lowerSearch || e.message.toLowerCase().includes(lowerSearch))
      );
    });
  }, [gameLog, dayMin, dayMax, activeCategories, lowerSearch]);

  const capped = allFiltered.length > 200;
  const filteredEntries = useMemo(() => allFiltered.slice(-200), [allFiltered]);

  const grouped = useMemo(() => {
    const map = new Map<number, typeof filteredEntries>();
    for (const entry of filteredEntries) {
      if (!map.has(entry.day)) map.set(entry.day, []);
      map.get(entry.day)!.push(entry);
    }
    for (const entries of map.values()) {
      entries.sort((a, b) => (TOD_ORDER[a.timeOfDay] ?? 0) - (TOD_ORDER[b.timeOfDay] ?? 0));
    }
    return [...map.entries()].sort(([a], [b]) => b - a);
  }, [filteredEntries]);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 900,
        background: 'rgba(0,0,0,0.88)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: '"Crimson Text", Georgia, serif',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: 'min(880px, 96vw)',
          maxHeight: '92vh',
          background: '#0D0500',
          border: `2px solid ${PARCHMENT}60`,
          borderRadius: 8,
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 8px 40px rgba(0,0,0,0.9)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 20px',
          borderBottom: `1px solid ${PARCHMENT}30`,
          background: '#160800',
          flexShrink: 0,
        }}>
          <div style={{ fontFamily: '"Cinzel", serif', color: PARCHMENT, fontSize: 22, fontWeight: 700, letterSpacing: 1 }}>
            📖 Full Chronicle
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ color: '#C4934A70', fontSize: 15 }}>
              {filteredEntries.length}{capped ? `+ (showing 200 of ${allFiltered.length})` : ''} entr{filteredEntries.length === 1 ? 'y' : 'ies'}
            </span>
            <button
              onClick={onClose}
              style={{
                background: 'none', border: `1px solid ${PARCHMENT}40`,
                borderRadius: 4, padding: '4px 10px', cursor: 'pointer',
                color: PARCHMENT, fontSize: 18, lineHeight: 1,
                fontFamily: '"Cinzel", serif',
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* ── Filters ── */}
        <div style={{
          padding: '10px 20px',
          borderBottom: `1px solid ${PARCHMENT}20`,
          background: '#110600',
          flexShrink: 0,
          display: 'flex', flexDirection: 'column', gap: 8,
        }}>
          {/* Day range + search */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ color: PARCHMENT, fontSize: 15, whiteSpace: 'nowrap' }}>Days:</span>
            <input
              type="number"
              min={minDayAll} max={dayMax}
              value={dayMin}
              onChange={e => setDayMin(Math.max(minDayAll, Math.min(dayMax, Number(e.target.value))))}
              style={{ ...INPUT_STYLE, width: 60, textAlign: 'center' }}
            />
            <span style={{ color: '#C4934A50', fontSize: 14 }}>–</span>
            <input
              type="number"
              min={dayMin} max={currentDay}
              value={dayMax}
              onChange={e => setDayMax(Math.max(dayMin, Math.min(currentDay, Number(e.target.value))))}
              style={{ ...INPUT_STYLE, width: 60, textAlign: 'center' }}
            />
            <button
              onClick={() => { setDayMin(minDayAll); setDayMax(currentDay); }}
              style={{
                background: 'none', border: `1px solid ${PARCHMENT}30`,
                borderRadius: 3, color: '#C4934A80', fontSize: 13,
                padding: '2px 8px', cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              All
            </button>
            <button
              onClick={() => { setDayMin(Math.max(minDayAll, currentDay - 7)); setDayMax(currentDay); }}
              style={{
                background: 'none', border: `1px solid ${PARCHMENT}30`,
                borderRadius: 3, color: '#C4934A80', fontSize: 13,
                padding: '2px 8px', cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              Last 7
            </button>
            <input
              type="text"
              placeholder="Search entries…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ ...INPUT_STYLE, flex: 1, minWidth: 130 }}
            />
          </div>

          {/* Category chips */}
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ color: '#C4934A60', fontSize: 13, marginRight: 2, whiteSpace: 'nowrap' }}>Filter:</span>
            {ALL_CATEGORIES.map(cat => {
              const meta = CATEGORY_META[cat];
              const active = activeCategories.has(cat);
              return (
                <button
                  key={cat}
                  onClick={() => toggleCategory(cat)}
                  onDoubleClick={() => selectOnly(cat)}
                  title={`Toggle ${meta.label} entries (double-click to show only this)`}
                  style={{
                    background: active ? `${meta.color}22` : 'transparent',
                    border: `1px solid ${active ? meta.color : meta.color + '35'}`,
                    borderRadius: 10, padding: '2px 9px',
                    cursor: 'pointer', fontSize: 13,
                    color: active ? meta.color : meta.color + '55',
                    fontFamily: '"Cinzel", serif',
                    transition: 'all 0.12s',
                    userSelect: 'none',
                  }}
                >
                  {meta.icon} {meta.label}
                </button>
              );
            })}
            {activeCategories.size < ALL_CATEGORIES.length && (
              <button
                onClick={() => setActiveCategories(new Set(ALL_CATEGORIES))}
                style={{
                  background: 'none', border: `1px solid ${PARCHMENT}30`,
                  borderRadius: 10, padding: '2px 9px', cursor: 'pointer',
                  color: '#C4934A60', fontSize: 13, fontFamily: 'inherit',
                }}
              >
                All
              </button>
            )}
          </div>
        </div>

        {/* ── Log Entries ── */}
        <div
          ref={scrollRef}
          style={{ flex: 1, overflowY: 'auto', padding: '10px 20px 20px' }}
        >
          {grouped.length === 0 ? (
            <div style={{
              color: '#C4934A35', fontSize: 18, fontStyle: 'italic',
              textAlign: 'center', marginTop: 52,
            }}>
              No chronicle entries match your filters.
            </div>
          ) : (
            grouped.map(([dayNum, entries]) => (
              <div key={dayNum} style={{ marginBottom: 14 }}>
                <div style={{
                  fontFamily: '"Cinzel", serif', color: PARCHMENT,
                  fontSize: 13, letterSpacing: 1,
                  borderBottom: `1px solid ${PARCHMENT}18`,
                  paddingBottom: 3, marginBottom: 5,
                  opacity: 0.7,
                }}>
                  — Day {dayNum} —
                </div>
                {entries.map(entry => {
                  const cat: LogCategory = (entry as any).category ?? 'system';
                  const meta = CATEGORY_META[cat] ?? CATEGORY_META.system;
                  return (
                    <div
                      key={entry.id}
                      style={{
                        display: 'flex', gap: 7, alignItems: 'baseline',
                        marginBottom: 3, lineHeight: 1.45,
                      }}
                    >
                      <span style={{ color: '#C4934A35', fontSize: 12, whiteSpace: 'nowrap', flexShrink: 0 }}>
                        [{entry.timeOfDay}]
                      </span>
                      <span
                        title={meta.label}
                        style={{ color: meta.color + 'BB', fontSize: 13, flexShrink: 0 }}
                      >
                        {meta.icon}
                      </span>
                      <span style={{ color: '#C4934A99', fontSize: 16 }}>
                        {entry.message}
                      </span>
                    </div>
                  );
                })}
              </div>
            ))
          )}
          {capped && (
            <div style={{ color: '#C4934A40', fontSize: 14, fontStyle: 'italic', textAlign: 'center', marginTop: 8 }}>
              Showing the 200 most recent matching entries. Narrow your filters to see earlier records.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
