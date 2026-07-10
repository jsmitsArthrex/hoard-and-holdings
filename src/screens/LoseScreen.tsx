import { useGameStore } from '../store/gameStore';
import { AGE_TIER_LABELS } from '../engine/gameClock';
import { TITLE_DEFS } from '../data/titles';

const INK = '#2C1810';
const PARCHMENT = '#C4934A';
const GOLD = '#C9A227';
const DANGER = '#8B1A1A';

function buildLoseNarrative(
  dragonName: string,
  tierLabel: string,
  dread: number,
  earnedTitles: string[],
  day: number,
  adventurersDefeated: number,
  combatLosses: number,
): string {
  const hasAnyTitle = earnedTitles.length > 0;
  const hasDreaded = earnedTitles.includes('dreaded');
  const hasUndefeated = earnedTitles.includes('undefeated');
  const hasCommerce = earnedTitles.includes('wyrm_of_commerce');

  if (combatLosses > adventurersDefeated && adventurersDefeated === 0) {
    return `${dragonName} the ${tierLabel} managed to lose every single combat without winning a single one — a statistic so unusual the guild of adventurers filed it under "morale booster." The kobolds were briefly employed. Day ${day} arrived and departed, and so did the gold.`;
  }
  if (hasDreaded && dread >= 75) {
    return `They called ${dragonName} the ${tierLabel} dreaded. They were not wrong. They were, however, ultimately broke, which somewhat undermined the mystique. The realm notes that fear alone does not pay the motel bill.`;
  }
  if (hasCommerce) {
    return `${dragonName} the ${tierLabel} sold more hoard items than most dragons accumulate in a lifetime, which was impressive right up until the moment the gold ran out anyway. A cautionary tale about overextension, or possibly about adventure parties.`;
  }
  if (hasAnyTitle) {
    return `For ${day} days, ${dragonName} the ${tierLabel} earned titles, slew ${adventurersDefeated} adventurers, and generally made a creditable attempt at draconic capitalism. Then the ledger closed. The titles remain. The gold does not.`;
  }
  if (day <= 10) {
    return `${dragonName} the ${tierLabel} arrived in the realm with ambition and limited capital. The capital ran out first. A promising career ended before the bards had even agreed on a key signature.`;
  }
  return `With your last gold coin spent on emergency wound salve, ${dragonName} the ${tierLabel} slinks back to the Crimson Caldera. The door opens before you knock. Your mother already has tea made. She says nothing. She does not need to.`;
}

const LOSE_TIPS = [
  '💡 Hire kobolds early — passive income compounds quickly.',
  '💡 Fight adventurers in the afternoon for bonus gold and hoard items.',
  '💡 Buy cheap properties first — even a small lair doubles kobold income.',
  '💡 Rival AI buys unowned properties nightly. Move fast!',
  '💡 High Dread makes persuasion rolls easier in RivalScreen.',
];

export default function LoseScreen() {
  const { dragon, day, rivals, playerPropertyIds, adventurersDefeated, dread, earnedTitles, combatLosses, itemsSold, resetGame } = useGameStore();
  const tierLabel = dragon ? AGE_TIER_LABELS[dragon.ageTier] : 'Unknown';

  const tip = LOSE_TIPS[Math.floor(Math.random() * LOSE_TIPS.length)];
  const biggestRival = [...rivals].sort((a, b) => b.propertyIds.length - a.propertyIds.length)[0];
  const safeEarnedTitles = earnedTitles ?? [];
  const narrative = buildLoseNarrative(dragon?.name ?? 'The Dragon', tierLabel, dread, safeEarnedTitles, day, adventurersDefeated, combatLosses ?? 0);

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'radial-gradient(ellipse at center, #1A0A2E 0%, #050005 100%)',
      fontFamily: '"Crimson Text", Georgia, serif', padding: '20px',
    }}>
      <div style={{
        maxWidth: 620, width: '100%', textAlign: 'center',
        background: 'linear-gradient(160deg, #2C1810 0%, #1A0808 100%)',
        border: `3px solid ${DANGER}`, borderRadius: 8, padding: '44px 36px',
        boxShadow: '0 12px 48px rgba(139,26,26,0.3)',
      }}>
        <div style={{ fontSize: 64, marginBottom: 12 }}>😔</div>

        <h1 style={{
          fontFamily: '"Cinzel", serif', fontWeight: 900, fontSize: 28,
          color: '#CC4444', marginBottom: 6, letterSpacing: 2,
        }}>
          YOUR LEGEND ENDS HERE
        </h1>
        <div style={{ fontFamily: '"Cinzel", serif', fontSize: 19, color: PARCHMENT + '80', marginBottom: 24 }}>
          {dragon?.name} the {tierLabel} · Day {day} · Broke
        </div>

        {/* Stats row */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 24,
        }}>
          <MiniStat icon='📅' label='Days' value={String(day)} />
          <MiniStat icon='🏠' label='Properties' value={String(playerPropertyIds.length)} />
          <MiniStat icon='⚔️' label='Heroes Slain' value={String(adventurersDefeated)} />
          <MiniStat icon='💀' label='Dread' value={`${dread}/100`} />
          <MiniStat icon='🩹' label='Combat Losses' value={String(combatLosses ?? 0)} />
          <MiniStat icon='🔨' label='Items Sold' value={String(itemsSold ?? 0)} />
        </div>

        {/* Dominant rival */}
        {biggestRival && (
          <div style={{
            background: DANGER + '15', border: `1px solid ${DANGER}40`,
            borderRadius: 6, padding: '8px 14px', marginBottom: 20,
            fontSize: 17, color: '#CC6666',
          }}>
            Dominant rival: <strong>{biggestRival.name}</strong> ({biggestRival.propertyIds.length} properties)
          </div>
        )}

        {/* ── Dragon Chronicle ── */}
        <div style={{
          background: '#1A0A00', border: `2px solid ${PARCHMENT}30`,
          borderRadius: 8, padding: '18px 22px', marginBottom: 22, textAlign: 'left',
        }}>
          <div style={{
            fontFamily: '"Cinzel", serif', fontWeight: 700, fontSize: 16,
            color: PARCHMENT + '80', marginBottom: 14, letterSpacing: 1, textAlign: 'center',
          }}>
            📜 CHRONICLE OF {(dragon?.name ?? 'THE DRAGON').toUpperCase()}
          </div>

          <p style={{ fontSize: 18, color: PARCHMENT + '90', lineHeight: 1.75, fontStyle: 'italic', marginBottom: 16 }}>
            {narrative}
          </p>

          {safeEarnedTitles.length > 0 ? (
            <div>
              <div style={{ fontFamily: '"Cinzel", serif', fontSize: 13, color: GOLD + '70', letterSpacing: 1, marginBottom: 8 }}>
                TITLES EARNED
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {safeEarnedTitles.map(id => {
                  const def = TITLE_DEFS.find(t => t.id === id);
                  if (!def) return null;
                  return (
                    <div
                      key={id}
                      title={def.description}
                      style={{
                        background: GOLD + '12', border: `1px solid ${GOLD}40`,
                        borderRadius: 4, padding: '3px 9px',
                        fontFamily: '"Cinzel", serif', fontSize: 13,
                        color: GOLD + 'BB', cursor: 'help',
                      }}
                    >
                      🏅 {def.label}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div style={{ fontSize: 16, color: PARCHMENT + '40', fontStyle: 'italic' }}>
              No titles earned. The bards have nothing to work with.
            </div>
          )}
        </div>

        {/* Tip */}
        <div style={{
          background: '#2C181040', border: `1px solid ${PARCHMENT}20`,
          borderRadius: 6, padding: '10px 14px', marginBottom: 28,
          fontSize: 17, color: PARCHMENT + '70', textAlign: 'left',
        }}>
          {tip}
        </div>

        <button
          onClick={resetGame}
          style={{
            padding: '14px 48px', background: PARCHMENT, color: INK,
            border: `2px solid #5A3A1A`, borderRadius: 6,
            fontFamily: '"Cinzel", serif', fontWeight: 700, fontSize: 21,
            cursor: 'pointer', letterSpacing: 1,
          }}
        >
          🥚 Try Again
        </button>
      </div>
    </div>
  );
}

function MiniStat({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div style={{
      background: '#2C181030', border: `1px solid ${PARCHMENT}15`,
      borderRadius: 5, padding: '8px 6px',
    }}>
      <div style={{ fontSize: 18, marginBottom: 2 }}>{icon}</div>
      <div style={{ fontFamily: '"Cinzel", serif', fontSize: 13, color: PARCHMENT + '60', marginBottom: 1 }}>{label}</div>
      <div style={{ fontFamily: '"Cinzel", serif', fontWeight: 700, fontSize: 17, color: PARCHMENT }}>{value}</div>
    </div>
  );
}
