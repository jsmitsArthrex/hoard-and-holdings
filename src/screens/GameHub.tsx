import { useState } from 'react';
import { Home, Users, ClipboardList, Sword, MessageCircle, Gavel, Moon, SkipForward, Building2, Scale, Hotel, ChevronDown, ChevronUp, Hammer, Skull, Map, ShoppingBag, Compass } from 'lucide-react';
import { generateRumours } from '../engine/rumoursEngine';
import { useGameStore } from '../store/gameStore';
import DragonAbilityPanel from '../components/ui/DragonAbilityPanel';
import { playSound } from '../audio/audioEngine';
import WorldMap from '../components/map/WorldMap';
import { districts } from '../data/districts';
import type { RivalEntry } from '../components/map/WorldMap';
import type { GameState } from '../types';

const INK = '#2C1810';
const PARCHMENT = '#C4934A';
const GOLD = '#C9A227';

interface ActionBtn {
  icon: React.ReactNode;
  label: string;
  sub: string;
  screen: string;
}

const MORNING_ACTIONS: ActionBtn[] = [
  { icon: <Home size={25} />, label: "Grixle's Realty", sub: 'Browse & buy properties', screen: 'real-estate' },
  { icon: <Users size={25} />, label: 'Kobold Agency', sub: 'Hire new workers', screen: 'kobold-agency' },
  { icon: <ClipboardList size={25} />, label: 'Manage Colony', sub: 'Reassign roles, review roster', screen: 'kobold-management' },
  { icon: <Compass size={25} />, label: 'Send Expedition', sub: 'Scout ruins for loot & intel', screen: 'expedition' },
];

const FREE_VISITS: ActionBtn[] = [
  { icon: <Building2 size={22} />, label: 'Ironclad Bank', sub: 'Speak with Barrax', screen: 'bank' },
  { icon: <Scale size={22} />, label: 'Arcane Law Office', sub: 'Consult Saeloril Vethran', screen: 'lawyer' },
  { icon: <Hotel size={22} />, label: 'The Ember & Straw', sub: 'Visit Rosie Tumblefoot', screen: 'innkeeper' },
  { icon: <Hammer size={22} />, label: 'Upgrade Lair', sub: 'Build rooms & fortifications', screen: 'lair' },
  { icon: <ShoppingBag size={22} />, label: 'The Back Room', sub: 'Stolen goods & whispers', screen: 'black-market' },
];

const AFTERNOON_ACTIONS: ActionBtn[] = [
  { icon: <Sword size={25} />, label: 'Hunt Adventurers', sub: 'Roll dice, earn loot & gold', screen: 'combat' },
  { icon: <MessageCircle size={25} />, label: 'Visit a Rival', sub: 'Negotiate, taunt, or scheme', screen: 'rival' },
  { icon: <Gavel size={25} />, label: 'Sell at Auction', sub: 'Convert hoard to gold', screen: 'auction' },
  { icon: <Skull size={25} />, label: 'Sabotage / Heist', sub: 'Disrupt rivals or steal their gold', screen: 'sabotage' },
  { icon: <Map size={25} />, label: 'Explore Ruins', sub: 'Venture out for rare loot', screen: 'dungeon' },
];

function ActionButton({ btn, disabled, used, onClick, disabledReason }: {
  btn: ActionBtn; disabled: boolean; used: boolean; onClick: () => void; disabledReason?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || used}
      style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
        background: used ? '#2C181030' : disabled ? '#2C181015' : '#E8D5A0',
        border: `2px solid ${used ? '#2C181040' : disabled ? '#2C181030' : INK}`,
        borderRadius: 6, cursor: used || disabled ? 'default' : 'pointer',
        opacity: used || disabled ? 0.55 : 1, width: '100%', textAlign: 'left',
        transition: 'all 0.15s',
      }}
    >
      <div style={{ color: used ? '#2C181060' : INK, flexShrink: 0 }}>{btn.icon}</div>
      <div>
        <div style={{ fontFamily: '"Cinzel", serif', fontWeight: 700, color: INK, fontSize: 18, lineHeight: 1.2 }}>
          {used ? '✓ ' : ''}{btn.label}
        </div>
        <div style={{ fontSize: 16, color: disabled && disabledReason ? '#8B1A1A' : '#5A3A1A' }}>
          {disabled && disabledReason ? `⚠ ${disabledReason}` : btn.sub}
        </div>
      </div>
    </button>
  );
}

interface PropertyPopup {
  propertyId: string;
  districtId: string;
}

export default function GameHub() {
  const {
    timeOfDay, morningActionUsed, afternoonActionUsed,
    playerPropertyIds, rivals, eveningResults,
    useMorningAction, useAfternoonAction, setActiveScreen, advanceDay, logEvent,
    kobolds, gold, day,
    dread, hoardItems, activeIncursions, statusEffects, adventurersDefeated,
    gameLog, dragon, gameSettings, activeRansom, blackMarketStock, hoardArrangement,
  activeWantedPoster, festival, enterAerialDisplay,
  } = useGameStore();

  const hasBlackMarketStock = (blackMarketStock ?? []).some(i => !i.purchased);

  const [popup, setPopup] = useState<PropertyPopup | null>(null);
  const [rumoursOpen, setRumoursOpen] = useState(false);
  const [posterOpen, setPosterOpen] = useState(false);

  const rumours = generateRumours({
    dragon, dread, kobolds, hoardItems, rivals, activeIncursions,
    statusEffects, playerPropertyIds, adventurersDefeated, gold, day,
    gameLog, gameSettings, hoardArrangement,
  });

  const rivalEntries: RivalEntry[] = rivals.map(r => ({
    rivalId: r.id, propertyIds: r.propertyIds, rivalName: r.name,
  }));

  const handlePropertyClick = (propId: string) => {
    const dist = districts.find(d => d.properties.some(p => p.id === propId));
    if (dist) { playSound('uiOpen'); setPopup({ propertyId: propId, districtId: dist.id }); }
  };

  const popupProp = popup
    ? districts.flatMap(d => d.properties).find(p => p.id === popup.propertyId)
    : null;
  const popupDist = popup ? districts.find(d => d.id === popup.districtId) : null;

  const isPlayerOwned = popup ? playerPropertyIds.includes(popup.propertyId) : false;
  const isRivalOwned = popup
    ? rivals.some(r => r.propertyIds.includes(popup.propertyId))
    : false;

  const handleMorningAction = (screen: string) => {
    playSound('pageFlip');
    useMorningAction();
    setActiveScreen(screen);
  };

  const handleFreeVisit = (screen: string) => {
    playSound('pageFlip');
    setActiveScreen(screen);
  };

  const handleAfternoonAction = (screen: string) => {
    playSound('pageFlip');
    useAfternoonAction();
    setActiveScreen(screen);
  };

  const hasLair = playerPropertyIds.length > 0;
  const netIncomePerDay = kobolds.reduce((sum, k) => {
    const gross = k.dailyWage * 2 * (hasLair ? 1 : 0.5);
    return sum + gross - k.dailyWage;
  }, 0);

  return (
    <div style={{ display: 'flex', height: '100%', minHeight: 0 }}>

      {/* ── Map Panel ── */}
      <div style={{ flex: '0 0 auto', overflow: 'auto', padding: 12 }}>
        <WorldMap
          districts={districts}
          properties={[]}
          onPropertyClick={handlePropertyClick}
          playerPropertyIds={playerPropertyIds}
          rivalPropertyIds={rivalEntries}
          fogOfWar={new Set<string>()}
        />
        {/* Map legend inline */}
        <div style={{
          marginTop: 8, padding: '6px 12px',
          background: '#1A0A0A', border: `1px solid ${PARCHMENT}40`,
          borderRadius: 4, display: 'flex', gap: 16, flexWrap: 'wrap',
        }}>
          {[
            { color: GOLD, label: 'Yours' },
            { color: '#CC2222', label: 'Rival' },
            { color: '#D4B896', label: 'Unclaimed' },
          ].map(l => (
            <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 16, color: '#C4934A99' }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: l.color }} />
              {l.label}
            </div>
          ))}
          <div style={{ marginLeft: 'auto', fontSize: 16, color: '#C4934A60' }}>
            {playerPropertyIds.length}/{gameSettings?.winThreshold ?? 50} owned
          </div>
        </div>
      </div>

      {/* ── Action Panel ── */}
      <div style={{
        flex: 1, minWidth: 300, overflowY: 'auto',
        background: '#140802', borderLeft: `2px solid ${PARCHMENT}30`,
        display: 'flex', flexDirection: 'column',
      }}>

        {timeOfDay !== 'evening' ? (
          <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* ── Festival Banner ── */}
            {festival?.active && (
              <div style={{
                background: 'linear-gradient(135deg, #7A4400, #C9A22780, #7A4400)',
                border: `2px solid ${GOLD}`,
                borderRadius: 6,
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}>
                <span style={{ fontSize: 22, flexShrink: 0 }}>🎪</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: '"Cinzel", serif', fontWeight: 700, color: GOLD, fontSize: 15, letterSpacing: '0.05em' }}>
                    GRAND DRAGON FESTIVAL
                  </div>
                  <div style={{ fontSize: 13, color: '#C4934A99' }}>
                    Day {day} — Ends Day {festival.endsOnDay}
                  </div>
                </div>
                <div style={{ fontSize: 13, color: '#C4934A70', textAlign: 'right' }}>
                  {festival.aerialDisplayUsed ? '🐉 Display done' : '🐉 Display available'}
                </div>
              </div>
            )}

            {/* ── Economy ticker ── */}
            <div style={{
              background: '#2C181020', border: `1px solid ${PARCHMENT}30`,
              borderRadius: 6, padding: '10px 14px',
              display: 'flex', gap: 20, flexWrap: 'wrap',
            }}>
              <div style={{ fontSize: 17, color: '#C4934A99' }}>
                <span style={{ color: PARCHMENT, fontFamily: '"Cinzel", serif', fontWeight: 700 }}>{kobolds.length}</span> kobolds
              </div>
              <div style={{ fontSize: 17, color: '#C4934A99' }}>
                Net: <span style={{ color: netIncomePerDay >= 0 ? '#4ACC7A' : '#CC4444', fontWeight: 700 }}>
                  {netIncomePerDay >= 0 ? '+' : ''}{Math.round(netIncomePerDay)}/day
                </span>
              </div>
              <div style={{ fontSize: 17, color: '#C4934A99' }}>
                Lairs: <span style={{ color: PARCHMENT, fontWeight: 700 }}>{playerPropertyIds.length}</span>
              </div>
              {!hasLair && (
                <div style={{ fontSize: 16, color: '#CC8844', fontStyle: 'italic' }}>
                  🏨 Motel — income ×0.5
                </div>
              )}
            </div>

            {/* ── Town visits (free, anytime) ── */}
            <div>
              <div style={{
                fontFamily: '"Cinzel", serif', fontSize: 15, fontWeight: 700,
                color: '#C4934A60', marginBottom: 6, letterSpacing: '0.05em',
              }}>
                📍 TOWN — visit anytime
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {FREE_VISITS.map(btn => (
                  <button
                    key={btn.screen}
                    onClick={() => handleFreeVisit(btn.screen)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px',
                      background: '#2C181020', border: `1px solid ${PARCHMENT}30`,
                      borderRadius: 5, cursor: 'pointer', textAlign: 'left', width: '100%',
                      position: 'relative',
                    }}
                  >
                    <div style={{ color: '#C4934A80', flexShrink: 0 }}>{btn.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: '"Cinzel", serif', fontWeight: 600, color: PARCHMENT, fontSize: 16, lineHeight: 1.2 }}>
                        {btn.label}
                      </div>
                      <div style={{ fontSize: 14, color: '#C4934A60' }}>{btn.sub}</div>
                    </div>
                    {btn.screen === 'black-market' && hasBlackMarketStock && (
                      <div style={{
                        width: 10, height: 10, borderRadius: '50%',
                        background: '#C9A227', flexShrink: 0,
                        boxShadow: '0 0 6px #C9A22780',
                      }} />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Dragon Ability (free action) ── */}
            <DragonAbilityPanel />

            {/* ── Current Phase Actions ── */}
            {timeOfDay === 'morning' ? (
              <div>
                <div style={{
                  fontFamily: '"Cinzel", serif', fontSize: 18, fontWeight: 700,
                  color: PARCHMENT, marginBottom: 8,
                }}>
                  🌅 MORNING
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {festival?.active && !festival.aerialDisplayUsed && !morningActionUsed && (
                    <button
                      onClick={() => { playSound('dragonRoar'); enterAerialDisplay(); }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
                        background: `linear-gradient(135deg, #3A1A00, #C9A22715)`,
                        border: `2px solid ${GOLD}`,
                        borderRadius: 6, cursor: 'pointer', width: '100%', textAlign: 'left',
                        transition: 'all 0.15s',
                      }}
                    >
                      <span style={{ fontSize: 24, flexShrink: 0 }}>🐉</span>
                      <div>
                        <div style={{ fontFamily: '"Cinzel", serif', fontWeight: 700, color: GOLD, fontSize: 18, lineHeight: 1.2 }}>
                          Enter Aerial Display
                        </div>
                        <div style={{ fontSize: 16, color: '#C4934A80' }}>
                          Prestige combat — the realm watches
                        </div>
                      </div>
                    </button>
                  )}
                  {festival?.active && festival.aerialDisplayUsed && (
                    <div style={{
                      padding: '8px 14px',
                      background: '#2C181020', border: `1px dashed ${GOLD}40`,
                      borderRadius: 6, fontSize: 15, color: `${GOLD}60`,
                    }}>
                      ✓ Aerial Display complete for this festival
                    </div>
                  )}
                  {MORNING_ACTIONS.map(btn => (
                    <ActionButton
                      key={btn.screen}
                      btn={btn}
                      used={morningActionUsed}
                      disabled={
                        (btn.screen === 'kobold-management' && kobolds.length === 0) ||
                        (btn.screen === 'expedition' && kobolds.filter(k => !k.onExpedition).length === 0)
                      }
                      disabledReason={
                        btn.screen === 'kobold-management' ? 'No kobolds to manage' :
                        btn.screen === 'expedition' ? 'No kobolds available' : undefined
                      }
                      onClick={() => handleMorningAction(btn.screen)}
                    />
                  ))}
                  <button
                    onClick={() => { playSound('uiClick'); useMorningAction(); }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px',
                      background: 'transparent', border: `1px dashed ${PARCHMENT}40`,
                      borderRadius: 6, cursor: 'pointer', color: '#C4934A60', fontSize: 17,
                    }}
                  >
                    <SkipForward size={19} /> Rest morning (skip)
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div style={{
                  fontFamily: '"Cinzel", serif', fontSize: 18, fontWeight: 700,
                  color: PARCHMENT, marginBottom: 8,
                }}>
                  ☀️ AFTERNOON
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {AFTERNOON_ACTIONS.map(btn => (
                    <ActionButton
                      key={btn.screen}
                      btn={btn}
                      used={afternoonActionUsed}
                      disabled={btn.screen === 'sabotage' && kobolds.length === 0}
                      disabledReason={btn.screen === 'sabotage' ? 'Requires kobolds' : undefined}
                      onClick={() => handleAfternoonAction(btn.screen)}
                    />
                  ))}
                  {!afternoonActionUsed && (
                    <button
                      onClick={() => { playSound('uiClick'); useAfternoonAction(); }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px',
                        background: 'transparent', border: `1px dashed ${PARCHMENT}40`,
                        borderRadius: 6, cursor: 'pointer', color: '#C4934A60', fontSize: 17,
                      }}
                    >
                      <SkipForward size={19} /> Rest afternoon (skip)
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* ── Festival Rival Challenge Card ── */}
            {festival?.active && festival.rivalChallengePropertyId && (() => {
              const allProps = districts.flatMap(d => d.properties);
              const challengeProp = allProps.find(p => p.id === festival.rivalChallengePropertyId);
              const challengeRival = rivals.find(r => r.id === festival.rivalChallengeRivalId);
              const winner = festival.rivalChallengeWinner;
              const statusColor = winner === 'player' ? '#4ACC7A' : winner === 'rival' ? '#CC4444' : GOLD;
              const statusText = winner === 'player'
                ? '👑 You secured it!'
                : winner === 'rival'
                  ? `⚔️ ${challengeRival?.name ?? 'Rival'} won`
                  : '⏳ Race ongoing';
              return (
                <div style={{
                  background: '#2C181030',
                  border: `1px solid ${GOLD}50`,
                  borderRadius: 6,
                  padding: '10px 14px',
                }}>
                  <div style={{
                    fontFamily: '"Cinzel", serif', fontWeight: 700,
                    color: GOLD, fontSize: 13, letterSpacing: '0.04em', marginBottom: 6,
                  }}>
                    🎪 PROPERTY RACE CHALLENGE
                  </div>
                  <div style={{ fontSize: 14, color: PARCHMENT, marginBottom: 3 }}>
                    <strong>{challengeProp?.name ?? festival.rivalChallengePropertyId}</strong>
                  </div>
                  <div style={{ fontSize: 13, color: '#C4934A80', marginBottom: 4 }}>
                    vs. {challengeRival?.name ?? 'Unknown Rival'}
                  </div>
                  <div style={{ fontSize: 13, color: statusColor, fontWeight: 700 }}>
                    {statusText}
                  </div>
                </div>
              );
            })()}

            {/* ── Wanted Poster Badge ── */}
            {activeWantedPoster && (
              <div>
                <button
                  onClick={() => { playSound('uiOpen'); setPosterOpen(true); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    width: '100%', padding: '10px 14px',
                    background: '#8B1A1A20', border: '1px solid #CC444460',
                    borderRadius: 6, cursor: 'pointer', textAlign: 'left',
                  }}
                >
                  <span style={{ fontSize: 20 }}>📜</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: '"Cinzel", serif', fontWeight: 700, color: '#CC4444', fontSize: 15, lineHeight: 1.2 }}>
                      WANTED POSTER ACTIVE
                    </div>
                    <div style={{ fontSize: 13, color: '#CC444480', marginTop: 1 }}>
                      {activeWantedPoster.bounty}g bounty — tap to view
                    </div>
                  </div>
                </button>
              </div>
            )}

            {/* ── Rumours Board ── */}
            <div style={{ borderTop: `1px solid ${PARCHMENT}30`, paddingTop: 12 }}>
              <button
                onClick={() => setRumoursOpen(o => !o)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  width: '100%', background: 'none', border: 'none',
                  cursor: 'pointer', padding: '4px 0',
                }}
              >
                <div style={{
                  fontFamily: '"Cinzel", serif', fontSize: 15, fontWeight: 700,
                  color: `${PARCHMENT}80`, letterSpacing: '0.05em',
                }}>
                  📌 RUMOURS
                </div>
                {rumoursOpen
                  ? <ChevronUp size={16} color={`${PARCHMENT}80`} />
                  : <ChevronDown size={16} color={`${PARCHMENT}80`} />}
              </button>
              {rumoursOpen && (
                <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column' }}>
                  {rumours.map((r, i) => (
                    <div key={i}>
                      {i > 0 && (
                        <div style={{
                          height: 1, background: `${PARCHMENT}20`, margin: '8px 0',
                        }} />
                      )}
                      <p style={{
                        fontFamily: '"Crimson Text", serif', fontStyle: 'italic',
                        color: PARCHMENT, fontSize: 17, margin: 0, lineHeight: 1.55,
                      }}>
                        {r}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* ── Evening Resolution Panel ── */
          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 16, flex: 1 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>🌙</div>
              <div style={{ fontFamily: '"Cinzel", serif', fontSize: 20, fontWeight: 700, color: PARCHMENT }}>
                Night Falls on Day {day}
              </div>
            </div>

            {eveningResults && (
              <>
                {/* Income summary */}
                <div style={{
                  background: '#2C181030', border: `1px solid ${PARCHMENT}30`,
                  borderRadius: 6, padding: '14px 16px',
                }}>
                  <div style={{ fontFamily: '"Cinzel", serif', color: PARCHMENT, fontSize: 17, marginBottom: 10 }}>
                    KOBOLD LEDGER
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    <Row label="Gross income" value={`+${eveningResults.koboldIncome} gold`} color='#4ACC7A' />
                    <Row label="Wages paid" value={`−${eveningResults.koboldWages} gold`} color='#CC4444' />
                    <div style={{ borderTop: `1px solid ${PARCHMENT}30`, paddingTop: 6, marginTop: 4 }}>
                      <Row
                        label="Net income"
                        value={`${eveningResults.netIncome >= 0 ? '+' : ''}${eveningResults.netIncome} gold`}
                        color={eveningResults.netIncome >= 0 ? GOLD : '#CC4444'}
                        bold
                      />
                    </div>
                  </div>
                </div>

                {/* Events */}
                {eveningResults.events.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {eveningResults.events.map((e, i) => (
                      <div key={i} style={{
                        background: '#CC882220', border: '1px solid #CC882240',
                        borderRadius: 4, padding: '6px 10px', fontSize: 18, color: '#CC8822',
                      }}>
                        ⚠️ {e}
                      </div>
                    ))}
                  </div>
                )}

                {/* Rival actions */}
                {eveningResults.rivalActions.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ fontFamily: '"Cinzel", serif', color: PARCHMENT, fontSize: 16 }}>RIVAL ACTIVITY</div>
                    {eveningResults.rivalActions.map((a, i) => (
                      <div key={i} style={{
                        background: '#CC222220', border: '1px solid #CC222240',
                        borderRadius: 4, padding: '6px 10px', fontSize: 18, color: '#CC8888',
                      }}>
                        ⚔️ {a}
                      </div>
                    ))}
                  </div>
                )}

                {eveningResults.rivalActions.length === 0 && eveningResults.events.length === 0 && (
                  <div style={{ fontSize: 19, color: '#C4934A60', fontStyle: 'italic', textAlign: 'center' }}>
                    A quiet night. The rivals rest.
                  </div>
                )}
              </>
            )}

            {activeRansom && !activeRansom.collected && (
              <div style={{
                background: '#1A0A2E80', border: `1px solid ${PARCHMENT}30`,
                borderRadius: 6, padding: '12px 14px',
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <span style={{ fontSize: 22 }}>⛓️</span>
                <div>
                  <div style={{ fontFamily: '"Cinzel", serif', color: PARCHMENT, fontSize: 14, fontWeight: 700, letterSpacing: '0.04em' }}>
                    PRISONER: {activeRansom.heroName}
                  </div>
                  <div style={{ fontSize: 14, color: '#C4934A80', marginTop: 2 }}>
                    Ransom due Day {activeRansom.dueOnDay}
                    {' '}({Math.max(0, activeRansom.dueOnDay - day)} day{Math.max(0, activeRansom.dueOnDay - day) !== 1 ? 's' : ''} remaining)
                  </div>
                </div>
              </div>
            )}

            <div style={{ flex: 1 }} />

            <button
              onClick={() => { playSound('pageFlip'); advanceDay(); }}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                padding: '16px', width: '100%',
                background: PARCHMENT, color: INK,
                border: `2px solid ${INK}`, borderRadius: 6,
                fontFamily: '"Cinzel", serif', fontWeight: 700, fontSize: 21,
                cursor: 'pointer',
              }}
            >
              <Moon size={23} /> Sleep — Begin Day {day + 1}
            </button>
          </div>
        )}
      </div>

      {/* ── Wanted Poster Modal ── */}
      {posterOpen && activeWantedPoster && (
        <WantedPosterModal
          poster={activeWantedPoster}
          onClose={() => { playSound('uiClose'); setPosterOpen(false); }}
        />
      )}

      {/* ── Property Popup ── */}
      {popup && popupProp && popupDist && (
        <div
          style={{
            position: 'fixed', inset: 0, background: '#00000070',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 200,
          }}
          onClick={() => { playSound('uiClose'); setPopup(null); }}
        >
          <div
            style={{
              background: 'linear-gradient(160deg, #C4934A, #B07830)',
              border: `3px solid ${INK}`, borderRadius: 8,
              padding: '24px', maxWidth: 360, width: '90%',
              boxShadow: '0 8px 32px rgba(0,0,0,0.8)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ fontFamily: '"Cinzel", serif', fontSize: 20, fontWeight: 700, color: INK, marginBottom: 4 }}>
              {popupProp.name}
            </div>
            <div style={{ fontSize: 18, color: '#5A3A1A', marginBottom: 12 }}>{popupDist.name}</div>

            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontFamily: '"Cinzel", serif', fontWeight: 700, fontSize: 20, color: INK }}>
                🪙 {popupProp.goldPrice} gold
              </span>
              <span style={{ background: INK, color: PARCHMENT, padding: '2px 8px', borderRadius: 10, fontSize: 17 }}>
                {popupProp.lairSize}
              </span>
              <span style={{ fontSize: 19 }}>
                {Array.from({ length: 5 }, (_, i) => (
                  <span key={i} style={{ color: i < popupProp.dangerRating ? '#8B1A1A' : '#4A4A4A' }}>☠</span>
                ))}
              </span>
            </div>

            <div style={{ marginBottom: 16, fontSize: 18, color: '#5A3A1A' }}>
              {isPlayerOwned ? '👑 Owned by you' : isRivalOwned ? '⚔️ Owned by a rival' : '⬜ Unclaimed'}
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => { playSound('uiClose'); setPopup(null); }}
                style={{
                  flex: 1, padding: '10px',
                  background: 'transparent', border: `2px solid ${INK}`,
                  borderRadius: 4, color: INK, cursor: 'pointer',
                  fontFamily: '"Cinzel", serif', fontSize: 18,
                }}
              >
                Close
              </button>
              {!isPlayerOwned && !isRivalOwned && (
                <button
                  onClick={() => {
                    playSound('pageFlip');
                    setPopup(null);
                    if (!morningActionUsed) {
                      useMorningAction();
                    }
                    logEvent(`Heading to Grixle's Realty to inquire about ${popupProp.name}.`);
                    setActiveScreen('real-estate');
                  }}
                  style={{
                    flex: 2, padding: '10px',
                    background: GOLD, border: `2px solid ${INK}`,
                    borderRadius: 4, color: INK, cursor: 'pointer',
                    fontFamily: '"Cinzel", serif', fontWeight: 700, fontSize: 18,
                  }}
                >
                  📜 Visit Realtor
                </button>
              )}
              {isPlayerOwned && (
                <button
                  onClick={() => {
                    playSound('pageFlip');
                    setPopup(null);
                    if (!morningActionUsed) useMorningAction();
                    setActiveScreen('kobold-management');
                  }}
                  style={{
                    flex: 2, padding: '10px',
                    background: INK, border: `2px solid ${INK}`,
                    borderRadius: 4, color: PARCHMENT, cursor: 'pointer',
                    fontFamily: '"Cinzel", serif', fontWeight: 700, fontSize: 18,
                  }}
                >
                  ⚔ Manage Lair
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value, color, bold }: { label: string; value: string; color: string; bold?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: bold ? 14 : 13 }}>
      <span style={{ color: '#C4934A99' }}>{label}</span>
      <span style={{ color, fontWeight: bold ? 700 : 400 }}>{value}</span>
    </div>
  );
}

type WantedPoster = NonNullable<GameState['activeWantedPoster']>;

function WantedPosterModal({ poster, onClose }: { poster: WantedPoster; onClose: () => void }) {
  const THREAT_COLORS: Record<string, string> = {
    'DANGEROUS': '#CC2222',
    'EXTREMELY DANGEROUS': '#8B0000',
    'DO NOT APPROACH UNDER ANY CIRCUMSTANCES': '#4A0000',
  };
  const badgeColor = THREAT_COLORS[poster.threatLevel] ?? '#CC2222';

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: '#00000080',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 300,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'linear-gradient(170deg, #F4E4B0, #EBDA96, #E0CE80)',
          border: '4px solid #5A3A1A',
          borderRadius: '3px 5px 4px 3px',
          boxShadow: '0 8px 40px rgba(0,0,0,0.85), inset 0 0 80px rgba(90,58,26,0.1)',
          padding: '28px 32px',
          maxWidth: 420, width: '90%',
          maxHeight: '90vh', overflowY: 'auto',
          color: '#3A2A1A',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          fontFamily: '"Cinzel", serif', fontWeight: 900, fontSize: 54,
          textAlign: 'center', letterSpacing: '0.12em', color: '#3A2A1A',
          lineHeight: 1, marginBottom: 6,
          textShadow: '1px 2px 0 rgba(90,58,26,0.25)',
        }}>
          WANTED
        </div>

        {/* Name plate */}
        <div style={{
          borderTop: '2px solid #5A3A1A', borderBottom: '2px solid #5A3A1A',
          textAlign: 'center', padding: '8px 0', marginBottom: 14,
        }}>
          <div style={{ fontFamily: '"Cinzel", serif', fontSize: 22, fontWeight: 700, color: '#3A2A1A' }}>
            {poster.dragonName}
          </div>
          <div style={{ fontFamily: '"Crimson Text", serif', fontSize: 15, color: '#5A3A1A', fontStyle: 'italic', marginTop: 2 }}>
            Known Dragon. Extremely Bad-Tempered.
          </div>
        </div>

        {/* Threat badge */}
        <div style={{ textAlign: 'center', marginBottom: 18 }}>
          <span style={{
            background: badgeColor, color: '#F5F0E8',
            fontFamily: '"Cinzel", serif', fontWeight: 700,
            fontSize: poster.threatLevel.length > 20 ? 11 : 13,
            padding: '5px 14px', borderRadius: 3, letterSpacing: '0.06em',
            display: 'inline-block', lineHeight: 1.4,
          }}>
            ⚠ {poster.threatLevel}
          </span>
        </div>

        {/* Crimes */}
        <div style={{ marginBottom: 18 }}>
          <div style={{
            fontFamily: '"Cinzel", serif', fontSize: 13, fontWeight: 700,
            color: '#3A2A1A', marginBottom: 8, letterSpacing: '0.04em',
          }}>
            For crimes including:
          </div>
          <ul style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {poster.crimes.map((crime, i) => (
              <li key={i} style={{ fontFamily: '"Crimson Text", serif', fontSize: 17, color: '#3A2A1A', lineHeight: 1.45 }}>
                {crime}
              </li>
            ))}
          </ul>
        </div>

        {/* Reward */}
        <div style={{
          borderTop: '1px solid #5A3A1A80', paddingTop: 14,
          marginBottom: 16, textAlign: 'center',
        }}>
          <div style={{ fontFamily: '"Crimson Text", serif', fontSize: 15, color: '#5A3A1A', marginBottom: 2 }}>
            Reward offered by the
          </div>
          <div style={{ fontFamily: '"Cinzel", serif', fontSize: 15, fontWeight: 700, color: '#3A2A1A', marginBottom: 8 }}>
            {poster.districtName} Adventurers' Guild
          </div>
          <div style={{ fontFamily: '"Cinzel", serif', fontSize: 36, fontWeight: 900, color: '#8B1A1A', letterSpacing: '0.04em' }}>
            🪙 {poster.bounty}g
          </div>
        </div>

        {/* Footer disclaimer */}
        <div style={{ borderTop: '1px solid #5A3A1A40', paddingTop: 10, marginBottom: 16 }}>
          <div style={{
            fontFamily: '"Crimson Text", serif', fontSize: 13,
            color: '#5A3A1A80', fontStyle: 'italic', textAlign: 'center', lineHeight: 1.55,
          }}>
            Guild assumes no liability for any dragon-related injuries<br />
            sustained during apprehension attempts.
          </div>
        </div>

        {/* Close */}
        <button
          onClick={onClose}
          style={{
            width: '100%', padding: '10px',
            background: '#5A3A1A', color: '#F4E4B0',
            border: '2px solid #3A2A1A', borderRadius: 4,
            fontFamily: '"Cinzel", serif', fontWeight: 700, fontSize: 16,
            cursor: 'pointer',
          }}
        >
          Note Taken. Flee Accordingly.
        </button>
      </div>
    </div>
  );
}
