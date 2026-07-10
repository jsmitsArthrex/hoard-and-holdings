import { useGameStore } from '../store/gameStore';
import { AGE_TIER_LABELS } from '../engine/gameClock';
import { TITLE_DEFS } from '../data/titles';

const INK = '#2C1810';
const PARCHMENT = '#C4934A';
const GOLD = '#C9A227';

function buildWinNarrative(
  dragonName: string,
  tierLabel: string,
  dread: number,
  earnedTitles: string[],
  day: number,
  adventurersDefeated: number,
): string {
  const hasLandlord = earnedTitles.includes('landlord');
  const hasDreaded = earnedTitles.includes('dreaded');
  const hasUndefeated = earnedTitles.includes('undefeated');
  const hasCommerce = earnedTitles.includes('wyrm_of_commerce');
  const hasPeacemaker = earnedTitles.includes('peacemaker');

  if (hasDreaded && hasUndefeated) {
    return `${dragonName} the ${tierLabel} carved a path of utterly uncontested dominion across the realm in ${day} days. No adventurer who raised a sword against them returned with the sword — or, indeed, the hand. Property deeds arrived by the cartload. Rivals signed things they did not fully understand. The Legendary Dread rating was, by all accounts, understated.`;
  }
  if (hasPeacemaker && hasCommerce) {
    return `History will remember ${dragonName} the ${tierLabel} as the dragon who conquered the realm without once raising a claw in anger — except at the auction house, where they raised it quite aggressively. Rival dragons spoke of them with a mix of admiration and mild financial ruin. ${day} days. Breathtaking, really.`;
  }
  if (hasLandlord && dread >= 75) {
    return `At ${dread} Dread and ${adventurersDefeated} defeated adventurers, the realm had little choice but to acknowledge ${dragonName} the ${tierLabel} as its supreme landlord. Bards began writing songs, then reconsidered, then wrote them anyway in a much lower key.`;
  }
  if (hasCommerce) {
    return `${dragonName} the ${tierLabel} discovered early that the real hoard was the properties acquired along the way. And also the literal hoard, sold at auction for considerable profit. ${day} days of shrewd economics later, the entire realm was technically on a rent-payment schedule.`;
  }
  return `In ${day} days, ${dragonName} the ${tierLabel} went from a motel-dwelling wyrmling to the undisputed landlord of the realm. The property registry required a second volume. Rivals were asked, politely, to leave. The kobolds got dental.`;
}

export default function WinScreen() {
  const { dragon, day, gold, adventurersDefeated, dread, rivals, playerPropertyIds, earnedTitles, itemsSold, resetGame } = useGameStore();
  const tierLabel = dragon ? AGE_TIER_LABELS[dragon.ageTier] : 'Unknown';

  const totalRivalProperties = rivals.reduce((s, r) => s + r.propertyIds.length, 0);
  const safeEarnedTitles = earnedTitles ?? [];
  const narrative = buildWinNarrative(dragon?.name ?? 'The Dragon', tierLabel, dread, safeEarnedTitles, day, adventurersDefeated);

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'radial-gradient(ellipse at center, #3A2A00 0%, #0D0500 100%)',
      fontFamily: '"Crimson Text", Georgia, serif', padding: '20px',
    }}>
      <div style={{
        maxWidth: 660, width: '100%', textAlign: 'center',
        background: 'linear-gradient(160deg, #C4934A 0%, #A07030 100%)',
        border: `4px solid ${INK}`, borderRadius: 8, padding: '48px 40px',
        boxShadow: '0 16px 64px rgba(201,162,39,0.3)',
      }}>
        <div style={{ fontSize: 72, marginBottom: 12, filter: 'drop-shadow(0 0 20px #C9A22780)' }}>👑</div>

        <h1 style={{
          fontFamily: '"Cinzel", serif', fontWeight: 900, fontSize: 34,
          color: INK, marginBottom: 8, letterSpacing: 2,
        }}>
          LEGEND COMPLETE
        </h1>
        <div style={{ fontFamily: '"Cinzel", serif', fontSize: 20, color: '#5A3A1A', marginBottom: 28 }}>
          {dragon?.name} the {tierLabel}
        </div>

        {/* Stats grid */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
          gap: 10, marginBottom: 28,
        }}>
          <StatBox icon='📅' label='Days Survived' value={String(day)} />
          <StatBox icon='🪙' label='Gold Amassed' value={gold.toLocaleString()} />
          <StatBox icon='🏠' label='Properties' value={String(playerPropertyIds.length)} />
          <StatBox icon='⚔️' label='Heroes Slain' value={String(adventurersDefeated)} />
          <StatBox icon='💀' label='Dread' value={`${dread}/100`} />
          <StatBox icon='�' label='Items Sold' value={String(itemsSold)} />
        </div>

        <div style={{
          background: '#2C181020', border: `1px solid ${INK}30`,
          borderRadius: 6, padding: '10px 14px', marginBottom: 28, fontSize: 18, color: '#3A2010',
        }}>
          {playerPropertyIds.length} properties under your claw. {totalRivalProperties} still in rival hands — for now.
        </div>

        {/* ── Dragon Chronicle ── */}
        <div style={{
          background: '#2C1810', border: `2px solid ${GOLD}50`,
          borderRadius: 8, padding: '20px 24px', marginBottom: 28, textAlign: 'left',
        }}>
          <div style={{
            fontFamily: '"Cinzel", serif', fontWeight: 700, fontSize: 18,
            color: GOLD, marginBottom: 16, letterSpacing: 1, textAlign: 'center',
          }}>
            📜 CHRONICLE OF {(dragon?.name ?? 'THE DRAGON').toUpperCase()}
          </div>

          {/* Narrative paragraph */}
          <p style={{ fontSize: 19, color: PARCHMENT + 'CC', lineHeight: 1.75, fontStyle: 'italic', marginBottom: 20 }}>
            {narrative}
          </p>

          {/* Earned Titles */}
          {safeEarnedTitles.length > 0 ? (
            <div>
              <div style={{ fontFamily: '"Cinzel", serif', fontSize: 15, color: GOLD + '90', letterSpacing: 1, marginBottom: 8 }}>
                TITLES EARNED
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {safeEarnedTitles.map(id => {
                  const def = TITLE_DEFS.find(t => t.id === id);
                  if (!def) return null;
                  return (
                    <div
                      key={id}
                      title={def.description}
                      style={{
                        background: GOLD + '18', border: `1px solid ${GOLD}50`,
                        borderRadius: 4, padding: '4px 10px',
                        fontFamily: '"Cinzel", serif', fontSize: 14,
                        color: GOLD, cursor: 'help',
                      }}
                    >
                      🏅 {def.label}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div style={{ fontSize: 17, color: PARCHMENT + '50', fontStyle: 'italic' }}>
              No milestone titles earned. Perhaps next time the bards will have something to sing about.
            </div>
          )}
        </div>

        <button
          onClick={resetGame}
          style={{
            padding: '16px 48px', background: INK, color: GOLD,
            border: `2px solid ${INK}`, borderRadius: 6,
            fontFamily: '"Cinzel", serif', fontWeight: 700, fontSize: 21,
            cursor: 'pointer', letterSpacing: 1,
          }}
        >
          🐣 Hatch a New Legend
        </button>
      </div>
    </div>
  );
}

function StatBox({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div style={{
      background: '#2C181025', border: `1px solid #2C181030`,
      borderRadius: 6, padding: '12px 8px',
    }}>
      <div style={{ fontSize: 22, marginBottom: 4 }}>{icon}</div>
      <div style={{ fontFamily: '"Cinzel", serif', fontSize: 16, color: '#5A3A1A', marginBottom: 2 }}>{label}</div>
      <div style={{ fontFamily: '"Cinzel", serif', fontWeight: 700, fontSize: 21, color: INK }}>{value}</div>
    </div>
  );
}
