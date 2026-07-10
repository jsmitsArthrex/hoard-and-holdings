import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import AboutModal from '../components/ui/AboutModal';
import { dragonBreeds } from '../data/dragonBreeds';
import { AGE_TIER_LABELS } from '../engine/gameClock';

const INK = '#2C1810';
const PARCHMENT = '#C4934A';
const GOLD = '#C9A227';
const SHADOW = '#1A0A2E';

const BREED_ICONS: Record<string, string> = {
  fire: '🔥', ice: '❄️', dark: '🌑', storm: '⚡', earth: '🪨',
  nature: '🌿', water: '🌊', arcane: '✨', poison: '☠️', metal: '⚙️',
};

export default function TitleScreen() {
  const { dragon, day, gold, playerPropertyIds, kobolds, goToIntro, loadGame } = useGameStore();
  const [showAbout, setShowAbout] = useState(false);

  const hasSave = dragon !== null;
  const breed = hasSave ? dragonBreeds.find(b => b.id === dragon.breedId) : null;
  const tierLabel = hasSave ? AGE_TIER_LABELS[dragon.ageTier] : '';
  const breedIcon = hasSave ? (BREED_ICONS[dragon.breedId] ?? '🐉') : '';

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: `radial-gradient(ellipse at 50% 30%, #3A1A0A 0%, #1A0A00 50%, ${SHADOW} 100%)`,
        fontFamily: '"Crimson Text", Georgia, serif',
        padding: '24px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Ambient ember particles */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              width: 3,
              height: 3,
              borderRadius: '50%',
              background: GOLD,
              opacity: 0.15 + (i % 5) * 0.08,
              left: `${(i * 7 + 5) % 95}%`,
              top: `${(i * 13 + 10) % 90}%`,
              boxShadow: `0 0 6px ${GOLD}`,
              animation: `pulse 3s ease-in-out ${i * 0.4}s infinite`,
            }}
          />
        ))}
      </div>

      {/* Main card */}
      <div
        style={{
          maxWidth: 560,
          width: '100%',
          textAlign: 'center',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Dragon icon with glow */}
        <div
          style={{
            fontSize: 96,
            lineHeight: 1,
            marginBottom: 16,
            filter: 'drop-shadow(0 0 32px #C9A22760)',
            animation: 'pulse 4s ease-in-out infinite',
          }}
        >
          🐉
        </div>

        {/* Title */}
        <h1
          style={{
            fontFamily: '"Cinzel", serif',
            fontWeight: 900,
            fontSize: 42,
            color: GOLD,
            margin: '0 0 6px',
            letterSpacing: 4,
            textShadow: `0 0 40px ${GOLD}60, 0 2px 0 ${INK}`,
          }}
        >
          HOARD & HOLDINGS
        </h1>

        <p
          style={{
            fontFamily: '"Crimson Text", Georgia, serif',
            fontSize: 18,
            color: PARCHMENT + 'AA',
            margin: '0 0 36px',
            fontStyle: 'italic',
            letterSpacing: 1,
          }}
        >
          Conquer the realm. One property at a time.
        </p>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 36 }}>
          <div style={{ flex: 1, height: 1, background: `linear-gradient(to right, transparent, ${GOLD}50)` }} />
          <div style={{ color: GOLD, fontSize: 16, opacity: 0.6 }}>✦</div>
          <div style={{ flex: 1, height: 1, background: `linear-gradient(to left, transparent, ${GOLD}50)` }} />
        </div>

        {/* Save preview */}
        {hasSave && (
          <div
            style={{
              background: `linear-gradient(135deg, #2C181080 0%, #1A0A0080 100%)`,
              border: `1px solid ${GOLD}40`,
              borderRadius: 8,
              padding: '20px 24px',
              marginBottom: 28,
              textAlign: 'left',
            }}
          >
            <div
              style={{
                fontFamily: '"Cinzel", serif',
                fontSize: 11,
                color: GOLD + '90',
                letterSpacing: 2,
                marginBottom: 14,
                textTransform: 'uppercase',
              }}
            >
              Existing Legend
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
              <span style={{ fontSize: 32 }}>{breedIcon}</span>
              <div>
                <div
                  style={{
                    fontFamily: '"Cinzel", serif',
                    fontWeight: 700,
                    fontSize: 20,
                    color: PARCHMENT,
                  }}
                >
                  {dragon!.name}
                </div>
                <div style={{ fontSize: 15, color: PARCHMENT + '80' }}>
                  {breed?.breed ?? dragon!.breedId} · {tierLabel}
                </div>
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: 8,
              }}
            >
              <SaveStat icon="📅" label="Day" value={String(day)} />
              <SaveStat icon="🪙" label="Gold" value={gold.toLocaleString()} />
              <SaveStat icon="🏠" label="Props" value={String(playerPropertyIds.length)} />
              <SaveStat icon="🪨" label="Kobolds" value={String(kobolds.length)} />
            </div>
          </div>
        )}

        {/* Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {hasSave && (
            <button
              onClick={loadGame}
              style={{
                padding: '16px 32px',
                background: `linear-gradient(135deg, ${GOLD} 0%, #A07830 100%)`,
                color: INK,
                border: 'none',
                borderRadius: 6,
                fontFamily: '"Cinzel", serif',
                fontWeight: 700,
                fontSize: 18,
                cursor: 'pointer',
                letterSpacing: 1,
                boxShadow: `0 4px 20px ${GOLD}40`,
                transition: 'filter 0.15s, transform 0.1s',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.filter = 'brightness(1.1)';
                (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.filter = 'brightness(1)';
                (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
              }}
            >
              ⚔️ Continue Your Reign
            </button>
          )}

          <button
            onClick={goToIntro}
            style={{
              padding: '16px 32px',
              background: hasSave ? 'transparent' : `linear-gradient(135deg, ${GOLD} 0%, #A07830 100%)`,
              color: hasSave ? PARCHMENT : INK,
              border: hasSave ? `1px solid ${PARCHMENT}50` : 'none',
              borderRadius: 6,
              fontFamily: '"Cinzel", serif',
              fontWeight: 700,
              fontSize: 18,
              cursor: 'pointer',
              letterSpacing: 1,
              boxShadow: hasSave ? 'none' : `0 4px 20px ${GOLD}40`,
              transition: 'filter 0.15s, transform 0.1s, border-color 0.15s',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.filter = 'brightness(1.15)';
              (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)';
              if (hasSave) (e.currentTarget as HTMLButtonElement).style.borderColor = PARCHMENT + 'AA';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.filter = 'brightness(1)';
              (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
              if (hasSave) (e.currentTarget as HTMLButtonElement).style.borderColor = PARCHMENT + '50';
            }}
          >
            🐣 Begin New Conquest
          </button>
        </div>

        {/* Footer note */}
        <p
          style={{
            marginTop: 32,
            fontSize: 13,
            color: PARCHMENT + '40',
            fontStyle: 'italic',
          }}
        >
          {hasSave
            ? 'Starting a new conquest will overwrite your current legend.'
            : 'No existing legend found. Begin your conquest.'}
        </p>

        {/* About link */}
        <button
          onClick={() => setShowAbout(true)}
          style={{
            marginTop: 16,
            background: 'none',
            border: `1px solid ${PARCHMENT}30`,
            borderRadius: 4,
            padding: '7px 18px',
            cursor: 'pointer',
            color: PARCHMENT + '70',
            fontFamily: '"Cinzel", serif',
            fontSize: 13,
            letterSpacing: 1,
            transition: 'border-color 0.15s, color 0.15s',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.color = PARCHMENT;
            (e.currentTarget as HTMLButtonElement).style.borderColor = PARCHMENT + '70';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.color = PARCHMENT + '70';
            (e.currentTarget as HTMLButtonElement).style.borderColor = PARCHMENT + '30';
          }}
        >
          📖 How to Play
        </button>
      </div>

      {showAbout && <AboutModal onClose={() => setShowAbout(false)} />}
    </div>
  );
}

function SaveStat({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div
      style={{
        background: '#FFFFFF08',
        borderRadius: 6,
        padding: '8px 6px',
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: 18, marginBottom: 2 }}>{icon}</div>
      <div style={{ fontFamily: '"Cinzel", serif', fontSize: 11, color: PARCHMENT + '70', marginBottom: 2 }}>
        {label}
      </div>
      <div style={{ fontFamily: '"Cinzel", serif', fontWeight: 700, fontSize: 15, color: PARCHMENT }}>
        {value}
      </div>
    </div>
  );
}
