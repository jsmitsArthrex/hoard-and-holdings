import { Hammer, ArrowLeft, CheckCircle } from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { LAIR_ROOMS } from '../data/lairRooms';
import { playSound } from '../audio/audioEngine';

const INK = '#2C1810';
const PARCHMENT = '#C4934A';
const GOLD = '#C9A227';

export default function LairScreen() {
  const { gold, lairRooms, buildLairRoom, setActiveScreen } = useGameStore();
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
