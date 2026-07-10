import { useState, useRef } from 'react';
import { ArrowLeft, Skull } from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { dragonBreeds } from '../data/dragonBreeds';
import { playSound } from '../audio/audioEngine';
import type { Rival } from '../types';

const INK = '#2C1810';
const PARCHMENT = '#C4934A';
const GOLD = '#C9A227';
const DANGER = '#8B1A1A';
const GREEN = '#4ACC7A';

const RIVAL_ICONS: Record<string, string> = {
  fire: '🔥', ice: '❄️', dragon: '🐲', poison: '☠️',
  electric: '⚡', dark: '🌑', ghost: '👻', steel: '⚙️',
};

type Phase = 'pick-rival' | 'pick-mission' | 'rolling' | 'result';
type MissionType = 'sabotage' | 'theft';

interface TheftResult {
  roll: number;
  amount: number;
  success: boolean;
}

export default function SabotageScreen() {
  const {
    rivals, kobolds, dragon, gold,
    setActiveScreen, sabotageRival,
  } = useGameStore();

  const ageTier = dragon?.ageTier ?? 1;
  const currentDay = dragon?.age ?? 1;

  const [phase, setPhase] = useState<Phase>('pick-rival');
  const [selectedRival, setSelectedRival] = useState<Rival | null>(null);
  const [missionType, setMissionType] = useState<MissionType | null>(null);
  const [rollingDisplay, setRollingDisplay] = useState(1);
  const [theftResult, setTheftResult] = useState<TheftResult | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const noKobolds = kobolds.length === 0;

  const handlePickRival = (rival: Rival) => {
    playSound('pageFlip');
    setSelectedRival(rival);
    setPhase('pick-mission');
  };

  const handlePickMission = (type: MissionType) => {
    if (!selectedRival) return;
    playSound('pageFlip');
    setMissionType(type);
    const rivalId = selectedRival.id;

    if (type === 'sabotage') {
      sabotageRival(rivalId, 'sabotage');
      setPhase('result');
    } else {
      setPhase('rolling');
      let ticks = 0;
      intervalRef.current = setInterval(() => {
        setRollingDisplay(Math.floor(Math.random() * 20) + 1);
        ticks++;
        if (ticks >= 22) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          const finalRoll = Math.floor(Math.random() * 20) + 1;
          const amount = finalRoll + ageTier * 5;
          const success = finalRoll >= 11;
          playSound('diceRoll');
          setTimeout(() => playSound(success ? 'coinPickup' : 'coinLoss'), 300);
          setRollingDisplay(finalRoll);
          setTheftResult({ roll: finalRoll, amount, success });
          sabotageRival(rivalId, 'theft', finalRoll);
          setPhase('result');
        }
      }, 60);
    }
  };

  const liveRival = selectedRival
    ? rivals.find(r => r.id === selectedRival.id) ?? selectedRival
    : null;

  return (
    <div style={{ height: '100%', overflowY: 'auto', fontFamily: '"Crimson Text", Georgia, serif', background: '#0D0500' }}>
      <div style={{ maxWidth: 700, margin: '0 auto', padding: '20px' }}>

        <button
          onClick={() => setActiveScreen('hub')}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'none', border: 'none', color: PARCHMENT,
            cursor: 'pointer', fontFamily: '"Cinzel", serif', fontSize: 17,
            marginBottom: 16, padding: 0,
          }}
        >
          <ArrowLeft size={19} /> Return to Lair
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <Skull size={26} color={DANGER} />
          <h2 style={{ fontFamily: '"Cinzel", serif', color: PARCHMENT, fontSize: 22, fontWeight: 700, margin: 0 }}>
            Sabotage &amp; Heist
          </h2>
        </div>

        {noKobolds && (
          <div style={{
            background: `${DANGER}20`, border: `2px solid ${DANGER}50`,
            borderRadius: 8, padding: '16px 20px',
            color: '#CC4444', fontSize: 20, marginBottom: 20,
          }}>
            ⚠️ You need at least one kobold scout to execute a mission.
          </div>
        )}

        {/* ── Phase: pick-rival ── */}
        {phase === 'pick-rival' && !noKobolds && (
          <div>
            <p style={{ color: '#C4934A80', fontSize: 19, marginBottom: 16 }}>
              Choose a rival to target.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {rivals.map(rival => {
                const breed = dragonBreeds.find(b => b.id === rival.breedId);
                const isSabotaged = rival.sabotagedUntilDay !== undefined && rival.sabotagedUntilDay > currentDay;
                return (
                  <button
                    key={rival.id}
                    onClick={() => handlePickRival(rival)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 16, padding: '16px',
                      background: '#2C181040', border: `2px solid ${PARCHMENT}25`,
                      borderRadius: 8, cursor: 'pointer', textAlign: 'left',
                    }}
                  >
                    <div style={{ fontSize: 36, flexShrink: 0 }}>
                      {RIVAL_ICONS[rival.breedId] ?? '🐉'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontFamily: '"Cinzel", serif', fontWeight: 700,
                        color: PARCHMENT, fontSize: 19, marginBottom: 3,
                      }}>
                        {rival.name}
                      </div>
                      <div style={{ fontSize: 17, color: '#C4934A70' }}>
                        {breed?.breed ?? 'Unknown'} · {rival.propertyIds.length} properties · Relation: {rival.relationship}
                      </div>
                      {isSabotaged && (
                        <div style={{ fontSize: 16, color: '#CC8844', marginTop: 4 }}>
                          ⛔ Already disrupted — operations stalled
                        </div>
                      )}
                    </div>
                    <div style={{ color: PARCHMENT, fontSize: 20 }}>›</div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Phase: pick-mission ── */}
        {phase === 'pick-mission' && liveRival && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <span style={{ color: '#C4934A80', fontSize: 19 }}>Target: </span>
              <span style={{ fontFamily: '"Cinzel", serif', color: PARCHMENT, fontSize: 19, fontWeight: 700 }}>
                {liveRival.name}
              </span>
            </div>
            <p style={{ color: '#C4934A80', fontSize: 19, marginBottom: 20 }}>
              Choose your mission:
            </p>

            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>

              {/* Sabotage card */}
              <button
                onClick={() => handlePickMission('sabotage')}
                disabled={liveRival.propertyIds.length === 0}
                style={{
                  flex: 1, minWidth: 230, padding: '20px', textAlign: 'left',
                  background: liveRival.propertyIds.length === 0 ? '#2C181020' : `${DANGER}15`,
                  border: `2px solid ${liveRival.propertyIds.length === 0 ? PARCHMENT + '20' : DANGER + '50'}`,
                  borderRadius: 8,
                  cursor: liveRival.propertyIds.length === 0 ? 'not-allowed' : 'pointer',
                  opacity: liveRival.propertyIds.length === 0 ? 0.5 : 1,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <span style={{ fontSize: 26 }}>🔥</span>
                  <div style={{
                    fontFamily: '"Cinzel", serif', fontWeight: 700,
                    color: liveRival.propertyIds.length === 0 ? '#C4934A50' : '#CC4444',
                    fontSize: 19,
                  }}>
                    Sabotage
                  </div>
                </div>
                <div style={{ fontSize: 17, color: '#C4934A80', lineHeight: 1.6, marginBottom: 12 }}>
                  Infiltrate a rival property and disrupt operations — their expansion stalls for 3 days.
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 16 }}>
                  <CostLine icon="⛔" label="Rival expansion blocked 3 days" color="#CC4444" />
                  <CostLine icon="⚠️" label="−10 morale to a kobold scout" color="#CC8844" />
                  <CostLine icon="💔" label={`−5 relationship with ${liveRival.name}`} color="#CC8844" />
                  {liveRival.propertyIds.length === 0 && (
                    <div style={{ color: '#CC4444', marginTop: 4, fontSize: 15 }}>
                      No properties to sabotage
                    </div>
                  )}
                </div>
              </button>

              {/* Hoard Theft card */}
              <button
                onClick={() => handlePickMission('theft')}
                style={{
                  flex: 1, minWidth: 230, padding: '20px', textAlign: 'left',
                  background: `${GOLD}10`,
                  border: `2px solid ${GOLD}40`,
                  borderRadius: 8, cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <span style={{ fontSize: 26 }}>💰</span>
                  <div style={{ fontFamily: '"Cinzel", serif', fontWeight: 700, color: GOLD, fontSize: 19 }}>
                    Hoard Theft
                  </div>
                </div>
                <div style={{ fontSize: 17, color: '#C4934A80', lineHeight: 1.6, marginBottom: 12 }}>
                  Send thieves to plunder the rival's hoard. High risk, high reward.
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 16 }}>
                  <CostLine icon="🎲" label="Roll d20 — ≥ 11 succeeds" color={PARCHMENT} />
                  <CostLine icon="✓" label={`Success: +d20 + ${ageTier * 5} gold`} color={GREEN} />
                  <CostLine icon="✗" label={`Failure: −d20 + ${ageTier * 5} gold`} color="#CC4444" />
                  <div style={{ color: '#C4934A50', fontSize: 15, marginTop: 2 }}>
                    Range: {1 + ageTier * 5}–{20 + ageTier * 5} gold
                  </div>
                </div>
              </button>

            </div>

            <button
              onClick={() => { setSelectedRival(null); setPhase('pick-rival'); }}
              style={{
                marginTop: 16, padding: '8px 16px',
                background: 'transparent', border: `1px solid ${PARCHMENT}30`,
                borderRadius: 4, color: '#C4934A60', cursor: 'pointer', fontSize: 17,
              }}
            >
              ← Back
            </button>
          </div>
        )}

        {/* ── Phase: rolling ── */}
        {phase === 'rolling' && (
          <div style={{ textAlign: 'center', padding: '50px 20px' }}>
            <div style={{
              fontFamily: '"Cinzel", serif', color: PARCHMENT,
              fontSize: 21, marginBottom: 28,
            }}>
              🎲 Rolling the Dice...
            </div>
            <div style={{
              fontSize: 110, fontFamily: '"Cinzel", serif',
              color: GOLD, textShadow: `0 0 40px ${GOLD}80`,
              lineHeight: 1,
            }}>
              {rollingDisplay}
            </div>
            <div style={{ marginTop: 24, color: '#C4934A60', fontSize: 18, fontStyle: 'italic' }}>
              Your thieves slip through the shadows...
            </div>
          </div>
        )}

        {/* ── Phase: result ── */}
        {phase === 'result' && (
          <div>
            {missionType === 'sabotage' && liveRival ? (
              <SabotageResult rival={liveRival} />
            ) : theftResult && liveRival ? (
              <TheftResultPanel rival={liveRival} result={theftResult} gold={gold} ageTier={ageTier} />
            ) : null}

            <button
              onClick={() => setActiveScreen('hub')}
              style={{
                marginTop: 20, width: '100%', padding: '14px',
                background: PARCHMENT, border: `2px solid ${INK}`,
                borderRadius: 6, color: INK, cursor: 'pointer',
                fontFamily: '"Cinzel", serif', fontWeight: 700, fontSize: 19,
              }}
            >
              Return to Lair
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

function SabotageResult({ rival }: { rival: Rival }) {
  return (
    <div style={{
      background: `${DANGER}15`, border: `2px solid ${DANGER}40`,
      borderRadius: 8, padding: '24px',
    }}>
      <div style={{
        fontFamily: '"Cinzel", serif', fontSize: 22, fontWeight: 700,
        color: '#CC4444', marginBottom: 16,
      }}>
        🔥 Sabotage Executed
      </div>
      <p style={{ fontSize: 20, color: '#E8D5A0', lineHeight: 1.65, marginBottom: 18 }}>
        Your scouts infiltrated <strong>{rival.name}</strong>'s territory and sabotaged
        their operations. Rival expansion is stalled for the next <strong>3 days</strong>.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <ResultRow icon="⛔" label="Rival property expansion blocked for 3 days" color="#CC4444" />
        <ResultRow icon="⚠️" label="A kobold scout suffered −10 morale" color="#CC8844" />
        <ResultRow icon="💔" label={`Relationship with ${rival.name} −5`} color="#CC8844" />
      </div>
    </div>
  );
}

function TheftResultPanel({
  rival, result, gold, ageTier,
}: {
  rival: Rival;
  result: TheftResult;
  gold: number;
  ageTier: number;
}) {
  const { roll, amount, success } = result;
  const tierBonus = ageTier * 5;
  return (
    <div style={{
      background: success ? '#4ACC7A15' : '#CC222215',
      border: `2px solid ${success ? '#4ACC7A' : '#CC2222'}40`,
      borderRadius: 8, padding: '24px',
    }}>
      <div style={{
        fontFamily: '"Cinzel", serif', fontSize: 22, fontWeight: 700,
        color: success ? GREEN : '#CC4444', marginBottom: 16,
      }}>
        {success ? '💰 Heist Succeeded!' : '💸 Heist Failed!'}
      </div>

      {/* Roll breakdown */}
      <div style={{
        background: '#2C181040', border: `1px solid ${PARCHMENT}20`,
        borderRadius: 6, padding: '12px 16px', marginBottom: 18,
      }}>
        <div style={{
          fontFamily: '"Cinzel", serif', color: '#C4934A80',
          fontSize: 14, marginBottom: 8, letterSpacing: '0.06em',
        }}>
          DICE ROLL
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <span style={{
            fontFamily: '"Cinzel", serif', fontSize: 52, fontWeight: 900,
            color: success ? GREEN : '#CC4444', lineHeight: 1,
          }}>
            {roll}
          </span>
          <div style={{ fontSize: 18, color: '#C4934A70' }}>
            <div>+ {tierBonus} (tier bonus)</div>
            <div>= <span style={{ color: GOLD, fontWeight: 700 }}>{amount} gold</span></div>
          </div>
          <div style={{
            marginLeft: 'auto', fontSize: 16,
            color: success ? `${GREEN}80` : '#CC444480',
            background: success ? `${GREEN}15` : '#CC444415',
            border: `1px solid ${success ? GREEN : '#CC4444'}30`,
            borderRadius: 4, padding: '4px 10px',
          }}>
            {roll} vs DC 11 — {success ? 'PASS' : 'FAIL'}
          </div>
        </div>
      </div>

      <p style={{ fontSize: 20, color: '#E8D5A0', lineHeight: 1.65, marginBottom: 16 }}>
        {success
          ? `Your thieves slipped past ${rival.name}'s guards and made off with ${amount} gold!`
          : `${rival.name}'s guards were waiting. Your thieves fled empty-handed — you lost ${amount} gold covering their escape.`}
      </p>

      <ResultRow
        icon={success ? '🪙' : '💸'}
        label={`${success ? '+' : '−'}${amount} gold`}
        color={success ? GREEN : '#CC4444'}
      />
      <div style={{ marginTop: 8, fontSize: 17, color: '#C4934A60' }}>
        Current gold: <span style={{ color: GOLD }}>{gold}</span> 🪙
      </div>
    </div>
  );
}

function CostLine({ icon, label, color }: { icon: string; label: string; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color }}>
      <span style={{ fontSize: 15 }}>{icon}</span>
      <span>{label}</span>
    </div>
  );
}

function ResultRow({ icon, label, color }: { icon: string; label: string; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
      <span style={{ fontSize: 18 }}>{icon}</span>
      <span style={{ color, fontSize: 18 }}>{label}</span>
    </div>
  );
}
