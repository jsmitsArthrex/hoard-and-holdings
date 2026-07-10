import { useState, useEffect } from 'react';
import { Coins, Settings, Skull, Sun, Swords } from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { useStore } from '../store';
import { EconomyTicker } from '../components/economy/EconomyTicker';
import { AGE_TIER_LABELS, AGE_TIER_THRESHOLDS, daysUntilNextTier } from '../engine/gameClock';
import { startMusic, stopMusic, playSound, setMusicTrack, type MusicTrack } from '../audio/audioEngine';
import { TITLE_DEFS } from '../data/titles';
import EventModal from '../components/events/EventModal';
import OptionsModal from '../components/ui/OptionsModal';
import AboutModal from '../components/ui/AboutModal';

const INK = '#2C1810';
const PARCHMENT = '#C4934A';
const GOLD = '#C9A227';
const DANGER = '#8B1A1A';

const DREAD_TIERS = [
  { min: 0,  max: 24,  label: 'Unknown',   barColor: '#6B6B6B', textColor: '#2C1810' },
  { min: 25, max: 49,  label: 'Noticed',   barColor: '#C9A227', textColor: '#3A2800' },
  { min: 50, max: 74,  label: 'Feared',    barColor: '#CC6622', textColor: '#5A2000' },
  { min: 75, max: 89,  label: 'Dreaded',   barColor: DANGER,   textColor: '#5A0000' },
  { min: 90, max: 100, label: 'LEGENDARY', barColor: '#8B0000', textColor: '#7A0000', pulse: true },
];

const DREAD_TOOLTIPS: Record<string, string> = {
  Unknown:   'You are beneath notice. Rivals ignore you, heroes wander carelessly nearby.',
  Noticed:   'Word has spread. Adventurers begin to plan. Rivals watch your moves.',
  Feared:    'The region trembles. Stronger hero parties form. Rivals think twice.',
  Dreaded:   'Bards sing dark songs of your deeds. Hero spawn rate doubles. Rivals flinch.',
  LEGENDARY: 'You are the stuff of nightmares. Maximum hero threat. Rivals flee negotiations.',
};

function getDreadTier(dread: number) {
  return DREAD_TIERS.find(t => dread >= t.min && dread <= t.max) ?? DREAD_TIERS[0];
}

function HoverTooltip({
  text,
  children,
  wrapperStyle,
}: {
  text: string;
  children: React.ReactNode;
  wrapperStyle?: React.CSSProperties;
}) {
  const [show, setShow] = useState(false);
  return (
    <div
      style={{ position: 'relative', display: 'flex', alignItems: 'center', ...wrapperStyle }}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: '50%', transform: 'translateX(-50%)',
          background: INK, color: PARCHMENT,
          padding: '6px 10px', borderRadius: 4, fontSize: 14, lineHeight: 1.5,
          whiteSpace: 'nowrap', zIndex: 100, boxShadow: '0 4px 12px rgba(0,0,0,0.7)',
          border: `1px solid ${PARCHMENT}40`, pointerEvents: 'none',
          fontFamily: '"Crimson Text", Georgia, serif',
        }}>
          {text}
        </div>
      )}
    </div>
  );
}

export default function GameLayout({ children }: { children: React.ReactNode }) {
  const { dragon, gold, dread, day, timeOfDay, gameLog, statusEffects, activeIncursions, pendingEvents, activeScreen, earnedTitles } = useGameStore();
  const tickEconomy = useStore((s) => s.tickEconomy);
  const [showOptions, setShowOptions] = useState(false);
  const [showAbout, setShowAbout] = useState(false);

  useEffect(() => {
    startMusic();
    return () => { stopMusic(); };
  }, []);

  const NPC_SCREENS = new Set(['rival', 'innkeeper', 'bank', 'lawyer']);
  useEffect(() => {
    const track: MusicTrack = activeScreen === 'combat' ? 'combat'
      : NPC_SCREENS.has(activeScreen) ? 'npc'
      : 'ambient';
    setMusicTrack(track);
  }, [activeScreen]);

  useEffect(() => {
    tickEconomy(day);
  }, [day]);

  const timeLabel = timeOfDay === 'morning' ? '🌅 Morning'
    : timeOfDay === 'afternoon' ? '☀️ Afternoon'
    : '🌙 Evening';

  const latestTitleId = (earnedTitles ?? []).length > 0 ? earnedTitles[earnedTitles.length - 1] : null;
  const latestTitleLabel = latestTitleId ? (TITLE_DEFS.find(t => t.id === latestTitleId)?.label ?? null) : null;

  const ageTier = dragon?.ageTier ?? 1;
  const tierLabel = AGE_TIER_LABELS[ageTier] ?? 'Wyrmling';
  const daysLeft = daysUntilNextTier(day);
  const dreadInfo = getDreadTier(dread);

  return (
    <div style={{
      height: '100vh', display: 'flex', flexDirection: 'column',
      background: '#1A0A0A', fontFamily: '"Crimson Text", Georgia, serif', position: 'relative',
    }}>
      {/* ── Top Bar ── */}
      <div
        className="parchment-grain"
        style={{
          background: `linear-gradient(135deg, ${PARCHMENT} 0%, #B07830 100%)`,
          borderBottom: `3px solid ${INK}`,
          boxShadow: `0 2px 8px rgba(0,0,0,0.5)`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '6px 16px', flexShrink: 0, gap: 12,
        }}
      >
        {/* Dragon identity */}
        <HoverTooltip text="Your dragon's name and the current day of your reign" wrapperStyle={{ flexShrink: 0, gap: 10 }}>
          <span style={{ fontSize: 24 }}>🐉</span>
          <div>
            <div style={{ fontFamily: '"Cinzel", serif', fontWeight: 700, color: INK, fontSize: 21, lineHeight: 1.1 }}>
              {dragon?.name ?? 'Unnamed Dragon'}
            </div>
            {latestTitleLabel && (
              <div style={{ color: GOLD, fontSize: 14, fontStyle: 'italic', lineHeight: 1.2 }}>
                {latestTitleLabel}
              </div>
            )}
            <div style={{ color: '#5A3A1A', fontSize: 16 }}>Day {day}</div>
          </div>
        </HoverTooltip>

        {/* Dragon Age Tier bar */}
        <HoverTooltip
          text={`Age Tier: ${tierLabel}${daysLeft !== null ? ` · ${daysLeft} days until next tier` : ' · Maximum tier reached'} — older dragons unlock stronger incursions and events`}
          wrapperStyle={{ flexDirection: 'column', gap: 3, flexShrink: 0, alignItems: 'flex-start' }}
        >
          <div style={{ fontSize: 14, color: '#5A3A1A', fontFamily: '"Cinzel", serif', letterSpacing: 1 }}>
            AGE — {tierLabel}{daysLeft !== null ? ` · ${daysLeft}d to next` : ' · MAX'}
          </div>
          <div style={{ display: 'flex', gap: 3 }}>
            {AGE_TIER_THRESHOLDS.map(([tier]) => {
              const active = ageTier === tier;
              const passed = ageTier > tier;
              return (
                <div
                  key={tier}
                  title={AGE_TIER_LABELS[tier]}
                  style={{
                    width: 28, height: 8,
                    background: passed ? GOLD : active ? GOLD : '#2C181040',
                    border: `1px solid ${active ? INK : '#2C181030'}`,
                    borderRadius: 2,
                    boxShadow: active ? `0 0 6px ${GOLD}88` : undefined,
                    transition: 'all 0.3s',
                  }}
                />
              );
            })}
          </div>
        </HoverTooltip>

        {/* Stats row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1, justifyContent: 'flex-end' }}>
          {/* Gold */}
          <HoverTooltip text="Gold — your treasury. Spend wisely; hitting zero ends your reign!" wrapperStyle={{ gap: 5 }}>
            <Coins size={25} color="#7A5A00" />
            <span style={{ fontFamily: '"Cinzel", serif', fontWeight: 700, color: INK, fontSize: 19 }}>
              {gold.toLocaleString()}
            </span>
          </HoverTooltip>

          {/* Dread visual meter */}
          <HoverTooltip text={DREAD_TOOLTIPS[dreadInfo.label]} wrapperStyle={{ gap: 6, cursor: 'help' }}>
            <Skull size={23} color={dreadInfo.textColor} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <div style={{
                fontSize: 14, fontFamily: '"Cinzel", serif',
                color: dreadInfo.textColor,
                animation: dreadInfo.pulse ? 'pulse 1s ease-in-out infinite' : undefined,
              }}>
                {dreadInfo.label}
              </div>
              <div style={{ width: 80, height: 7, background: '#2C1810', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{
                  width: `${dread}%`, height: '100%',
                  background: dreadInfo.barColor,
                  transition: 'width 0.4s',
                  animation: dreadInfo.pulse ? 'pulse 0.8s ease-in-out infinite' : undefined,
                }} />
              </div>
            </div>
            <span style={{ fontSize: 16, color: INK, minWidth: 22 }}>{dread}</span>
          </HoverTooltip>

          {/* Active incursions badge */}
          {activeIncursions.length > 0 && (
            <HoverTooltip text="Active hero incursions threatening your hoard! Head to the Combat screen to defend.">
              <div style={{
                display: 'flex', alignItems: 'center', gap: 4,
                background: DANGER, color: '#FFCCCC',
                padding: '3px 8px', borderRadius: 3,
                fontFamily: '"Cinzel", serif', fontSize: 16,
                animation: 'pulse 1.5s ease-in-out infinite',
                border: `1px solid #FF000040`,
              }}>
                <Swords size={17} />
                {activeIncursions.length} incursion{activeIncursions.length > 1 ? 's' : ''}
              </div>
            </HoverTooltip>
          )}

          {/* Status effect icons */}
          {statusEffects.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              {statusEffects.map(fx => (
                <div
                  key={fx.id}
                  title={`${fx.name}: ${fx.description} (expires day ${fx.expiresOnDay})`}
                  style={{ fontSize: 19, cursor: 'help', filter: 'drop-shadow(0 0 3px rgba(255,200,100,0.6))' }}
                >
                  {fx.icon}
                </div>
              ))}
            </div>
          )}

          {/* Time of day */}
          <HoverTooltip text="Time of day — Morning and Afternoon allow actions; Evening resolves events and deducts expenses.">
            <div style={{
              display: 'flex', alignItems: 'center', gap: 5,
              background: INK, color: PARCHMENT,
              padding: '3px 10px', borderRadius: 3,
              fontFamily: '"Cinzel", serif', fontSize: 17,
              border: `1px solid ${PARCHMENT}40`,
            }}>
              <Sun size={21} />
              {timeLabel}
            </div>
          </HoverTooltip>

          {/* About button */}
          <button
            onClick={() => { playSound('uiOpen'); setShowAbout(true); }}
            title="About / How to Play"
            style={{
              background: 'none', border: `1px solid ${INK}60`,
              borderRadius: 3, padding: '3px 6px', cursor: 'pointer',
              color: INK, display: 'flex', alignItems: 'center',
              fontFamily: '"Cinzel", serif', fontSize: 15, fontWeight: 700,
            }}
          >
            ?
          </button>

          {/* Options button */}
          <button
            onClick={() => { playSound('uiOpen'); setShowOptions(true); }}
            title="Options"
            style={{
              background: 'none', border: `1px solid ${INK}60`,
              borderRadius: 3, padding: '3px 6px', cursor: 'pointer',
              color: INK, display: 'flex', alignItems: 'center',
            }}
          >
            <Settings size={19} />
          </button>
        </div>
      </div>

      {/* ── Economy Ticker ── */}
      <EconomyTicker />

      {/* ── Main Content ── */}
      <div style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
        {children}
      </div>

      {/* ── Event Modal overlay ── */}
      {pendingEvents.length > 0 && <EventModal />}

      {/* ── Options Modal ── */}
      {showOptions && (
        <OptionsModal
          onClose={() => { playSound('uiClose'); setShowOptions(false); }}
        />
      )}

      {/* ── About Modal ── */}
      {showAbout && (
        <AboutModal onClose={() => { playSound('uiClose'); setShowAbout(false); }} />
      )}

      {/* ── Game Log ── */}
      <div style={{
        background: '#0D0500',
        borderTop: `2px solid ${PARCHMENT}40`,
        padding: '5px 16px 7px',
        flexShrink: 0,
      }}>
        <div style={{ color: PARCHMENT, fontSize: 14, fontFamily: '"Cinzel", serif', letterSpacing: 1, marginBottom: 2 }}>
          CHRONICLE
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {gameLog.slice(-3).reverse().map(entry => (
            <div key={entry.id} style={{ color: '#C4934A99', fontSize: 16, lineHeight: 1.4 }}>
              <span style={{ color: '#C4934A55', fontSize: 15 }}>[Day {entry.day} · {entry.timeOfDay}]</span>{' '}
              {entry.message}
            </div>
          ))}
          {gameLog.length === 0 && (
            <div style={{ color: '#C4934A44', fontSize: 16, fontStyle: 'italic' }}>
              Your legend has not yet begun…
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
