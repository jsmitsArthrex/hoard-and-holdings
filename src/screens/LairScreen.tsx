import { Hammer, ArrowLeft, CheckCircle } from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { LAIR_ROOMS } from '../data/lairRooms';
import { playSound } from '../audio/audioEngine';

const INK = '#2C1810';
const PARCHMENT = '#C4934A';
const GOLD = '#C9A227';

const ARRANGEMENTS = [
  {
    type: 'pile' as const,
    icon: '💰',
    name: 'Treasure Pile',
    bonus: '+1 Dread per 10 items held',
    flavour: '"Glitters so brightly travelers mistake it for a second sun."',
  },
  {
    type: 'wall' as const,
    icon: '🏆',
    name: 'Trophy Wall',
    bonus: '+0.5g/day per item (max +10g)',
    flavour: '"The count of mounted adventuring parties is disputed."',
  },
  {
    type: 'cabinet' as const,
    icon: '🔮',
    name: 'Curiosity Cabinet',
    bonus: '+5% sell prices at auction',
    flavour: '"Scholars have reportedly offered a small fortune just to catalogue it."',
  },
];

function getActiveBonusText(type: 'pile' | 'wall' | 'cabinet', itemCount: number): string {
  if (type === 'pile') {
    const bonus = Math.floor(itemCount / 10);
    return `currently granting +${bonus} Dread/evening`;
  }
  if (type === 'wall') {
    const bonus = Math.min(Math.floor(itemCount * 0.5), 10);
    return `currently granting +${bonus}g/day`;
  }
  return 'currently granting +5% sell prices';
}

export default function LairScreen() {
  const {
    gold, lairRooms, buildLairRoom, setActiveScreen,
    hoardItems, hoardArrangement, lastArrangementChangeDay, day, setHoardArrangement,
  } = useGameStore();
  const owned = lairRooms ?? [];
  const allBuilt = owned.length === LAIR_ROOMS.length;

  const handleBuild = (roomId: string) => {
    buildLairRoom(roomId);
  };

  return (
    <div style={{
      height: '100%', overflowY: 'auto',
      background: 'linear-gradient(180deg, #140802 0%, #1A0A0A 100%)',
      padding: '24px',
      display: 'flex', flexDirection: 'column', gap: 20,
    }}>
      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          onClick={() => { playSound('pageFlip'); setActiveScreen('hub'); }}
          style={{
            background: 'transparent', border: `1px solid ${PARCHMENT}40`,
            borderRadius: 4, padding: '6px 12px', cursor: 'pointer',
            color: PARCHMENT, display: 'flex', alignItems: 'center', gap: 6,
            fontSize: 16, fontFamily: '"Cinzel", serif',
          }}
        >
          <ArrowLeft size={15} /> Back
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
          <Hammer size={26} color={GOLD} />
          <div>
            <div style={{ fontFamily: '"Cinzel", serif', fontSize: 22, fontWeight: 700, color: PARCHMENT, lineHeight: 1.2 }}>
              Lair Construction
            </div>
            <div style={{ fontSize: 14, color: `${PARCHMENT}60` }}>
              Expand and fortify your mountain stronghold
            </div>
          </div>
        </div>
        <div style={{
          fontFamily: '"Cinzel", serif', fontSize: 18, fontWeight: 700,
          color: GOLD, flexShrink: 0,
        }}>
          🪙 {gold}g
        </div>
      </div>

      <div style={{ borderTop: `1px solid ${PARCHMENT}25` }} />

      {/* ── Rooms ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {LAIR_ROOMS.map(room => {
          const isOwned = owned.includes(room.id);
          const canAfford = gold >= room.cost;

          return (
            <div
              key={room.id}
              style={{
                background: isOwned
                  ? `linear-gradient(135deg, ${GOLD}10, #1A0A0A)`
                  : `linear-gradient(135deg, ${PARCHMENT}10, #1A0A0A)`,
                border: `2px solid ${isOwned ? GOLD + '50' : canAfford ? PARCHMENT + '45' : PARCHMENT + '18'}`,
                borderRadius: 8,
                padding: '18px 20px',
                transition: 'border-color 0.2s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                <div style={{ fontSize: 30, lineHeight: 1, flexShrink: 0, marginTop: 2 }}>{room.icon}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontFamily: '"Cinzel", serif', fontSize: 18, fontWeight: 700,
                    color: isOwned ? GOLD : PARCHMENT,
                    marginBottom: 6, display: 'flex', alignItems: 'center', gap: 10,
                  }}>
                    {room.name}
                    {isOwned && (
                      <span style={{
                        fontSize: 13, color: GOLD, fontWeight: 400,
                        background: `${GOLD}15`, border: `1px solid ${GOLD}40`,
                        borderRadius: 10, padding: '1px 8px',
                      }}>
                        ✓ Built
                      </span>
                    )}
                  </div>
                  <div style={{
                    fontFamily: '"Crimson Text", serif', fontSize: 17,
                    color: `${PARCHMENT}75`, lineHeight: 1.5, marginBottom: 10,
                  }}>
                    {room.description}
                  </div>
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    fontSize: 14, color: '#4ACC7A',
                    background: '#4ACC7A0F', border: '1px solid #4ACC7A28',
                    borderRadius: 4, padding: '3px 10px',
                  }}>
                    ✦ {room.effectSummary}
                  </div>
                </div>
                <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10 }}>
                  <div style={{
                    fontFamily: '"Cinzel", serif', fontWeight: 700, fontSize: 17,
                    color: !isOwned && canAfford ? GOLD : `${PARCHMENT}35`,
                  }}>
                    🪙 {room.cost}g
                  </div>
                  {isOwned ? (
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '7px 14px',
                      background: `${GOLD}18`, border: `1px solid ${GOLD}35`,
                      borderRadius: 4, color: GOLD,
                      fontFamily: '"Cinzel", serif', fontWeight: 600, fontSize: 15,
                    }}>
                      <CheckCircle size={14} /> Owned
                    </div>
                  ) : (
                    <button
                      onClick={() => handleBuild(room.id)}
                      disabled={!canAfford}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '8px 16px',
                        background: canAfford ? PARCHMENT : 'transparent',
                        border: `2px solid ${canAfford ? INK : `${PARCHMENT}25`}`,
                        borderRadius: 4,
                        color: canAfford ? INK : `${PARCHMENT}28`,
                        fontFamily: '"Cinzel", serif', fontWeight: 700, fontSize: 15,
                        cursor: canAfford ? 'pointer' : 'default',
                        transition: 'opacity 0.15s',
                      }}
                    >
                      <Hammer size={14} /> Build
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Hoard Arrangement ── */}
      {(() => {
        const itemCount = hoardItems.length;
        const lastChange = lastArrangementChangeDay ?? 0;
        const daysSinceChange = day - lastChange;
        const onCooldown = hoardArrangement !== undefined && daysSinceChange < 3;
        const daysRemaining = onCooldown ? (3 - daysSinceChange) : 0;
        const activeArrangement = ARRANGEMENTS.find(a => a.type === hoardArrangement);

        return (
          <div>
            <div style={{ borderTop: `1px solid ${PARCHMENT}25`, marginBottom: 18 }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <div style={{ fontSize: 22 }}>🏛️</div>
              <div>
                <div style={{ fontFamily: '"Cinzel", serif', fontSize: 19, fontWeight: 700, color: PARCHMENT }}>
                  Hoard Arrangement
                </div>
                <div style={{ fontSize: 14, color: `${PARCHMENT}60` }}>
                  Choose how your hoard is displayed — changed at most once every 3 days
                </div>
              </div>
            </div>

            {itemCount < 3 ? (
              <div style={{
                padding: '18px 20px',
                background: `${PARCHMENT}08`, border: `1px dashed ${PARCHMENT}25`,
                borderRadius: 8, fontFamily: '"Crimson Text", serif',
                fontSize: 17, color: `${PARCHMENT}60`, fontStyle: 'italic',
              }}>
                You need at least 3 hoard items before there's anything worth arranging. At the moment it's mostly dust.
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  {ARRANGEMENTS.map(arr => {
                    const isActive = hoardArrangement === arr.type;
                    const canArrange = !onCooldown && !isActive;

                    return (
                      <div
                        key={arr.type}
                        style={{
                          flex: '1 1 200px', minWidth: 180,
                          background: isActive
                            ? `linear-gradient(135deg, ${GOLD}15, #1A0A0A)`
                            : `linear-gradient(135deg, ${PARCHMENT}08, #1A0A0A)`,
                          border: `2px solid ${isActive ? GOLD + '70' : PARCHMENT + '22'}`,
                          borderRadius: 8, padding: '16px',
                          position: 'relative', transition: 'border-color 0.2s',
                        }}
                      >
                        {isActive && (
                          <span style={{
                            position: 'absolute', top: 10, right: 10,
                            fontSize: 12, color: GOLD, fontWeight: 700,
                            background: `${GOLD}18`, border: `1px solid ${GOLD}40`,
                            borderRadius: 10, padding: '1px 8px',
                          }}>
                            ✓ Active
                          </span>
                        )}
                        <div style={{ fontSize: 28, marginBottom: 8 }}>{arr.icon}</div>
                        <div style={{
                          fontFamily: '"Cinzel", serif', fontSize: 16, fontWeight: 700,
                          color: isActive ? GOLD : PARCHMENT, marginBottom: 6,
                        }}>
                          {arr.name}
                        </div>
                        <div style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          fontSize: 13, color: '#4ACC7A',
                          background: '#4ACC7A0F', border: '1px solid #4ACC7A28',
                          borderRadius: 4, padding: '2px 8px', marginBottom: 8,
                        }}>
                          ✦ {arr.bonus}
                        </div>
                        <div style={{
                          fontFamily: '"Crimson Text", serif', fontSize: 15,
                          color: `${PARCHMENT}55`, fontStyle: 'italic',
                          lineHeight: 1.4, marginBottom: 12,
                        }}>
                          {arr.flavour}
                        </div>
                        {!isActive && (
                          <button
                            onClick={() => { setHoardArrangement(arr.type); }}
                            disabled={!canArrange}
                            style={{
                              width: '100%', padding: '8px 0',
                              background: canArrange ? PARCHMENT : 'transparent',
                              border: `2px solid ${canArrange ? INK : `${PARCHMENT}20`}`,
                              borderRadius: 4,
                              color: canArrange ? INK : `${PARCHMENT}30`,
                              fontFamily: '"Cinzel", serif', fontWeight: 700, fontSize: 14,
                              cursor: canArrange ? 'pointer' : 'default',
                              transition: 'opacity 0.15s',
                            }}
                          >
                            {onCooldown
                              ? `${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} remaining`
                              : 'Arrange'}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {activeArrangement ? (
                    <div style={{
                      padding: '10px 16px',
                      background: `${GOLD}0C`, border: `1px solid ${GOLD}30`,
                      borderRadius: 6, fontFamily: '"Crimson Text", serif',
                      fontSize: 17, color: `${PARCHMENT}90`,
                    }}>
                      <span style={{ color: GOLD, fontWeight: 700 }}>{activeArrangement.name}</span>
                      {' — '}
                      {getActiveBonusText(activeArrangement.type, itemCount)}
                    </div>
                  ) : (
                    <div style={{
                      padding: '10px 16px',
                      background: `${PARCHMENT}08`, border: `1px dashed ${PARCHMENT}20`,
                      borderRadius: 6, fontFamily: '"Crimson Text", serif',
                      fontSize: 16, color: `${PARCHMENT}50`, fontStyle: 'italic',
                    }}>
                      No arrangement selected. Choose one above to activate its passive bonus.
                    </div>
                  )}
                  {onCooldown && (
                    <div style={{
                      padding: '8px 16px',
                      background: '#88442208', border: `1px solid #88442230`,
                      borderRadius: 6, fontFamily: '"Crimson Text", serif',
                      fontSize: 16, color: `${PARCHMENT}60`, fontStyle: 'italic',
                    }}>
                      You just rearranged the hoard. Give it a few days before upsetting the careful balance.
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        );
      })()}

      {/* ── All built banner ── */}
      {allBuilt && (
        <div style={{
          textAlign: 'center', padding: '20px 24px',
          fontFamily: '"Cinzel", serif', fontSize: 18, color: GOLD,
          background: `${GOLD}0C`, border: `2px solid ${GOLD}35`,
          borderRadius: 8, lineHeight: 1.6,
        }}>
          🐉 Your lair is fully upgraded — a fearsome fortress worthy of a Great Wyrm.
        </div>
      )}

      {/* ── Bottom padding ── */}
      <div style={{ height: 16 }} />
    </div>
  );
}
