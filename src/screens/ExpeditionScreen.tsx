import { useState } from 'react';
import { Compass, ChevronLeft, Shield } from 'lucide-react';
import { useGameStore } from '../store/gameStore';

const INK = '#2C1810';
const PARCHMENT = '#C4934A';
const GOLD = '#C9A227';
const DANGER = '#8B1A1A';

function calcProbabilities(scoutCount: number) {
  const loot    = Math.min(90, 40 + scoutCount * 10);
  const injury  = Math.max(5,  20 - scoutCount * 5);
  const captured= Math.max(2,  10 - scoutCount * 5);
  const intel   = Math.max(5, 100 - loot - injury - captured);
  return { loot, intel, injury, captured };
}

interface ProbBarSegment { label: string; value: number; color: string }

function ProbabilityBar({ probs }: { probs: ReturnType<typeof calcProbabilities> }) {
  const segments: ProbBarSegment[] = [
    { label: 'Loot',     value: probs.loot,     color: GOLD },
    { label: 'Intel',    value: probs.intel,    color: '#4A90D9' },
    { label: 'Injury',   value: probs.injury,   color: '#E07B39' },
    { label: 'Captured', value: probs.captured, color: DANGER },
  ];
  return (
    <div>
      <div style={{ display: 'flex', height: 20, borderRadius: 4, overflow: 'hidden', border: `1px solid ${INK}40` }}>
        {segments.map(s => (
          <div
            key={s.label}
            style={{ width: `${s.value}%`, background: s.color, transition: 'width 0.3s' }}
            title={`${s.label}: ${s.value}%`}
          />
        ))}
      </div>
      <div style={{ display: 'flex', gap: 12, marginTop: 6, flexWrap: 'wrap' }}>
        {segments.map(s => (
          <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: s.color }} />
            <span style={{ color: INK }}>{s.label} {s.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ExpeditionScreen() {
  const { kobolds, morningActionUsed, sendExpedition, useMorningAction, setActiveScreen } = useGameStore();
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const availableKobolds = kobolds.filter(k => !k.onExpedition);
  const scoutCount = [...selected].filter(id => {
    const k = kobolds.find(k2 => k2.id === id);
    return k?.role === 'scout';
  }).length;
  const probs = calcProbabilities(scoutCount);

  const toggleKobold = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else if (next.size < 2) {
        next.add(id);
      }
      return next;
    });
  };

  const canDispatch = selected.size >= 1 && !morningActionUsed;

  const handleDispatch = () => {
    if (!canDispatch) return;
    sendExpedition([...selected]);
    useMorningAction();
    setActiveScreen('hub');
  };

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '24px 16px', fontFamily: '"Crimson Text", serif' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button
          onClick={() => setActiveScreen('hub')}
          style={{
            display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px',
            background: 'transparent', border: `1px solid ${INK}60`,
            borderRadius: 4, cursor: 'pointer', color: INK, fontSize: 15,
            fontFamily: '"Cinzel", serif',
          }}
        >
          <ChevronLeft size={16} /> Back
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Compass size={28} color={PARCHMENT} />
          <h1 style={{
            fontFamily: '"Cinzel", serif', fontWeight: 700, fontSize: 24,
            color: INK, margin: 0,
          }}>
            🗺️ Send an Expedition
          </h1>
        </div>
      </div>

      {morningActionUsed && (
        <div style={{
          padding: '10px 14px', marginBottom: 16,
          background: '#8B1A1A20', border: `1px solid ${DANGER}`,
          borderRadius: 6, color: DANGER, fontSize: 15,
        }}>
          Morning action already used today.
        </div>
      )}

      {/* Description */}
      <p style={{ color: '#5A3A1A', fontSize: 16, marginBottom: 20, lineHeight: 1.5 }}>
        Select 1–2 kobolds to send on an expedition. They will be unavailable today but return
        tomorrow with loot, intel — or worse. Scouts improve success odds.
      </p>

      {/* Probability Preview */}
      <div style={{
        background: '#E8D5A0', border: `2px solid ${INK}40`,
        borderRadius: 8, padding: '14px 16px', marginBottom: 20,
      }}>
        <div style={{ fontFamily: '"Cinzel", serif', fontWeight: 600, fontSize: 15, color: INK, marginBottom: 10 }}>
          Outcome Probabilities {selected.size > 0 ? `(${scoutCount} scout${scoutCount !== 1 ? 's' : ''})` : '(no selection)'}
        </div>
        <ProbabilityBar probs={probs} />
      </div>

      {/* Kobold list */}
      {availableKobolds.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#5A3A1A', padding: 24, fontSize: 16 }}>
          No kobolds available to send.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
          {availableKobolds.map(k => {
            const isSelected = selected.has(k.id);
            const isDisabled = !isSelected && selected.size >= 2;
            return (
              <button
                key={k.id}
                onClick={() => toggleKobold(k.id)}
                disabled={isDisabled}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 14px',
                  background: isSelected ? '#C9A22730' : isDisabled ? '#2C181010' : '#E8D5A080',
                  border: `2px solid ${isSelected ? GOLD : isDisabled ? '#2C181030' : INK + '50'}`,
                  borderRadius: 6, cursor: isDisabled ? 'default' : 'pointer',
                  opacity: isDisabled ? 0.5 : 1, textAlign: 'left', width: '100%',
                  transition: 'all 0.15s',
                }}
              >
                {/* Checkbox */}
                <div style={{
                  width: 20, height: 20, borderRadius: 4, flexShrink: 0,
                  border: `2px solid ${isSelected ? GOLD : INK + '60'}`,
                  background: isSelected ? GOLD : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {isSelected && <span style={{ color: INK, fontSize: 12, fontWeight: 700 }}>✓</span>}
                </div>

                {/* Info */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontFamily: '"Cinzel", serif', fontWeight: 700, color: INK, fontSize: 17 }}>
                      {k.name}
                    </span>
                    {k.role === 'scout' && (
                      <span style={{
                        padding: '1px 7px', borderRadius: 10,
                        background: '#4A90D920', border: '1px solid #4A90D9',
                        color: '#4A90D9', fontSize: 12, fontWeight: 700,
                      }}>
                        Scout ✓
                      </span>
                    )}
                    {k.trait && (
                      <span style={{
                        padding: '1px 7px', borderRadius: 10,
                        background: PARCHMENT + '30', border: `1px solid ${PARCHMENT}`,
                        color: INK, fontSize: 12,
                      }}>
                        {k.trait.label}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 14, color: '#5A3A1A', marginTop: 2, display: 'flex', gap: 14 }}>
                    <span style={{ textTransform: 'capitalize' }}>{k.tier} {k.role}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Shield size={12} />
                      Morale {k.morale}
                    </span>
                    <span>Wage {k.dailyWage}g/day</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Dispatch button */}
      <button
        onClick={handleDispatch}
        disabled={!canDispatch}
        style={{
          width: '100%', padding: '14px 0',
          background: canDispatch ? GOLD : '#2C181020',
          border: `2px solid ${canDispatch ? INK : '#2C181030'}`,
          borderRadius: 8, cursor: canDispatch ? 'pointer' : 'default',
          fontFamily: '"Cinzel", serif', fontWeight: 700, fontSize: 18,
          color: canDispatch ? INK : '#2C181050',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          transition: 'all 0.15s',
        }}
      >
        <Compass size={20} />
        {selected.size === 0 ? 'Select at least 1 kobold' : `Dispatch ${selected.size} Kobold${selected.size > 1 ? 's' : ''}`}
      </button>
    </div>
  );
}
