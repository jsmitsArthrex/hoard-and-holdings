import { useState, useEffect } from 'react';
import { useGameStore } from '../../store/gameStore';
import { DRAGON_ABILITIES } from '../../data/dragonAbilities';
import { playSound } from '../../audio/audioEngine';

const INK = '#2C1810';
const PARCHMENT = '#C4934A';
const GOLD = '#C9A227';

const NEEDS_RIVAL = new Set(['intimidate', 'demand-tribute']);

export default function DragonAbilityPanel() {
  const { dragon, rivals, dragonAbilityUsedToday, useDragonAbility } = useGameStore();

  const ageTier = dragon?.ageTier ?? 1;
  const unlocked = DRAGON_ABILITIES.filter(a => a.minAgeTier <= ageTier);
  const defaultAbility = unlocked[unlocked.length - 1];

  const [selectedId, setSelectedId] = useState<string>(defaultAbility?.id ?? 'intimidate');
  const [targetRivalId, setTargetRivalId] = useState<number | undefined>(rivals[0]?.id);

  useEffect(() => {
    const highest = DRAGON_ABILITIES.filter(a => a.minAgeTier <= ageTier).pop();
    if (highest) setSelectedId(highest.id);
  }, [ageTier]);

  useEffect(() => {
    if (targetRivalId === undefined && rivals.length > 0) {
      setTargetRivalId(rivals[0].id);
    }
  }, [rivals, targetRivalId]);

  if (!dragon) return null;

  const selected = DRAGON_ABILITIES.find(a => a.id === selectedId) ?? defaultAbility;
  const needsRival = selected && NEEDS_RIVAL.has(selected.id);

  const handleUse = () => {
    if (dragonAbilityUsedToday || !selected) return;
    playSound('uiClick');
    useDragonAbility(selected.id, needsRival ? targetRivalId : undefined);
  };

  return (
    <div style={{
      background: '#110600',
      border: `1px solid ${PARCHMENT}35`,
      borderRadius: 6,
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '7px 12px',
        background: `linear-gradient(135deg, #2C1200 0%, #180A00 100%)`,
        borderBottom: `1px solid ${PARCHMENT}25`,
      }}>
        <div style={{
          fontFamily: '"Cinzel", serif', fontWeight: 700, fontSize: 13,
          color: GOLD, letterSpacing: 1,
        }}>
          🐉 DRAGON ABILITY
        </div>
        <div style={{
          fontSize: 10, fontFamily: '"Cinzel", serif', fontWeight: 600,
          color: dragonAbilityUsedToday ? '#66553A' : '#4ACC7A',
          background: dragonAbilityUsedToday ? '#2C181030' : '#4ACC7A15',
          border: `1px solid ${dragonAbilityUsedToday ? '#66553A50' : '#4ACC7A40'}`,
          borderRadius: 10, padding: '2px 7px', letterSpacing: 0.5,
        }}>
          {dragonAbilityUsedToday ? 'USED TODAY' : 'FREE ACTION'}
        </div>
      </div>

      <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {/* Ability tab selector — always visible */}
        <div style={{ display: 'flex', gap: 3 }}>
          {DRAGON_ABILITIES.map(ability => {
            const locked = ability.minAgeTier > ageTier;
            const isSel = selectedId === ability.id;
            return (
              <button
                key={ability.id}
                onClick={() => { if (!locked) setSelectedId(ability.id); }}
                disabled={locked}
                title={locked ? `Unlocks at Age Tier ${ability.minAgeTier}` : ability.name}
                style={{
                  flex: 1, padding: '5px 2px', display: 'flex',
                  flexDirection: 'column', alignItems: 'center', gap: 1,
                  background: isSel ? `${GOLD}25` : locked ? 'transparent' : '#2C181020',
                  border: `1px solid ${isSel ? GOLD : locked ? '#2C181035' : PARCHMENT + '25'}`,
                  borderRadius: 4,
                  cursor: locked ? 'default' : 'pointer',
                  opacity: locked ? 0.3 : 1,
                  transition: 'all 0.12s',
                }}
              >
                <span style={{ fontSize: 14 }}>{ability.icon}</span>
                <span style={{
                  fontSize: 9, lineHeight: 1,
                  fontFamily: '"Cinzel", serif',
                  color: isSel ? GOLD : locked ? '#888' : `${PARCHMENT}70`,
                }}>
                  T{ability.minAgeTier}
                </span>
              </button>
            );
          })}
        </div>

        {/* Selected ability detail */}
        {selected && (
          <div style={{
            background: '#2C181020',
            border: `1px solid ${PARCHMENT}20`,
            borderRadius: 4, padding: '8px 10px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 22, lineHeight: 1 }}>{selected.icon}</span>
              <div>
                <div style={{
                  fontFamily: '"Cinzel", serif', fontWeight: 700,
                  color: GOLD, fontSize: 14, lineHeight: 1.2,
                }}>
                  {selected.name}
                </div>
                <div style={{
                  fontSize: 13, color: `${PARCHMENT}70`,
                  fontFamily: '"Crimson Text", serif', fontStyle: 'italic',
                }}>
                  {selected.description}
                </div>
              </div>
            </div>
            <div style={{
              fontSize: 13, color: '#C8A880', lineHeight: 1.4,
              borderTop: `1px solid ${PARCHMENT}15`, paddingTop: 5, marginTop: 2,
            }}>
              ✦ {selected.effectSummary}
            </div>
          </div>
        )}

        {/* Rival target dropdown */}
        {needsRival && rivals.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 12, color: `${PARCHMENT}70`, fontFamily: '"Cinzel", serif', flexShrink: 0 }}>
              Target:
            </span>
            <select
              value={targetRivalId ?? rivals[0].id}
              onChange={e => setTargetRivalId(Number(e.target.value))}
              style={{
                flex: 1, background: '#1A0800',
                border: `1px solid ${PARCHMENT}40`,
                borderRadius: 4, color: PARCHMENT,
                fontFamily: '"Crimson Text", serif',
                fontSize: 14, padding: '3px 6px',
                cursor: 'pointer',
              }}
            >
              {rivals.map(r => (
                <option key={r.id} value={r.id} style={{ background: '#1A0800' }}>
                  {r.name} (Rel: {r.relationship})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Use button */}
        <button
          onClick={handleUse}
          disabled={dragonAbilityUsedToday}
          style={{
            width: '100%', padding: '8px 12px',
            background: dragonAbilityUsedToday ? '#2C181030' : `${GOLD}20`,
            border: `1px solid ${dragonAbilityUsedToday ? '#2C181050' : GOLD + '60'}`,
            borderRadius: 4,
            cursor: dragonAbilityUsedToday ? 'default' : 'pointer',
            color: dragonAbilityUsedToday ? `${PARCHMENT}40` : GOLD,
            fontFamily: '"Cinzel", serif', fontWeight: 700, fontSize: 13,
            letterSpacing: 0.5,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            opacity: dragonAbilityUsedToday ? 0.6 : 1,
            transition: 'all 0.12s',
          }}
          onMouseEnter={e => {
            if (!dragonAbilityUsedToday)
              (e.currentTarget as HTMLButtonElement).style.background = `${GOLD}35`;
          }}
          onMouseLeave={e => {
            if (!dragonAbilityUsedToday)
              (e.currentTarget as HTMLButtonElement).style.background = `${GOLD}20`;
          }}
        >
          {dragonAbilityUsedToday
            ? '✓ Used Today'
            : selected
              ? `${selected.icon} Use ${selected.name}`
              : 'Use Ability'}
        </button>
      </div>
    </div>
  );
}
