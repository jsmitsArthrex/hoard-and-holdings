import { useState, useRef, useEffect, useCallback } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import NPCPortrait from '../components/npcs/NPCPortrait';
import { getDialogueLine } from '../dialogue/dialogueEngine';
import type { ResolvedDialogue, DialogueContext } from '../dialogue';
import { dragonBreeds } from '../data/dragonBreeds';
import { playSound } from '../audio/audioEngine';
import ContractCard from '../components/ui/ContractCard';

const INK = '#2C1810';
const PARCHMENT = '#C4934A';
const GOLD = '#C9A227';
const CRIMSON = '#8B1A1A';
const GREEN = '#2E7D32';

type GameTier = 'copper' | 'silver' | 'dragon';

interface RoundResult {
  playerDice: [number, number];
  rosieDice: [number, number];
  playerTotal: number;
  rosieTotal: number;
  playerWon: boolean;
  naturalTwelve: boolean;
}

const TIER_DATA: Record<GameTier, { label: string; wager: number; payout: number; color: string }> = {
  copper: { label: 'Copper Round',    wager: 10,  payout: 25,  color: '#B87333' },
  silver: { label: 'Silver Round',   wager: 30,  payout: 75,  color: '#A8A9AD' },
  dragon: { label: "Dragon's Gamble", wager: 75,  payout: 200, color: '#C9A227' },
};

function rollD6(): number { return Math.floor(Math.random() * 6) + 1; }

export default function InnkeeperScreen() {
  const {
    dragon, gold, dread, day,
    playerPropertyIds, gameSettings, activeContracts,
    rumourBet, drinkingGamePlayedToday,
    setActiveScreen, logEvent, placeRumourBet, playDrinkingGame,
  } = useGameStore();

  const innkeeperContract = (activeContracts ?? []).find(c => c.npcId === 'innkeeper' && !c.completed && !c.failed);
  const hasLair = playerPropertyIds.length > 0;
  const breedName = dragonBreeds.find(b => b.id === dragon?.breedId)?.breed ?? 'Dragon';

  const buildCtx = (): DialogueContext => ({
    playerName: dragon?.name ?? 'Dragon',
    dragonBreed: breedName,
    gold,
    dreadRating: dread,
    currentDay: day,
    dragonAge: dragon?.age ?? 1,
  });

  const [resolved, setResolved] = useState<ResolvedDialogue>(() =>
    getDialogueLine('innkeeper', 'greeting', buildCtx(), 'halfling')
  );
  const [currentNode, setCurrentNode] = useState('greeting');
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const handleOption = (label: string, nextNode: string, effect?: string) => {
    playSound('pageFlip');
    if (effect === 'rent_room') {
      logEvent('Confirmed another night at the Ember & Straw.');
      setFeedbackMsg(`Another night booked at ${gameSettings.motelCostPerNight} gold/night. Rosie is delighted.`);
    } else if (effect === 'check_out') {
      if (hasLair) {
        logEvent('Checked out of the Ember & Straw. Rosie waved goodbye from the (missing) doorway.');
        setFeedbackMsg('You have officially checked out. Your lair awaits.');
      } else {
        setFeedbackMsg("You have nowhere else to go yet. The Ember & Straw remains your home for now.");
      }
    }
    const next = getDialogueLine('innkeeper', nextNode, buildCtx(), 'halfling');
    setResolved(next);
    setCurrentNode(nextNode);
  };

  const isFarewell = currentNode === 'farewell' || resolved.playerOptions.length === 0;

  // ── Dice Game State ──────────────────────────────────────────────
  type DicePhase = 'idle' | 'tier-select' | 'playing' | 'done';
  const [dicePhase, setDicePhase] = useState<DicePhase>('idle');
  const [selectedTier, setSelectedTier] = useState<GameTier | null>(null);
  const [rounds, setRounds] = useState<RoundResult[]>([]);
  const [currentRound, setCurrentRound] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [displayDice, setDisplayDice] = useState<[number, number, number, number]>([1, 1, 1, 1]);
  const [naturalTwelveOccurred, setNaturalTwelveOccurred] = useState(false);
  const animRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearAnim = useCallback(() => {
    if (animRef.current) { clearInterval(animRef.current); animRef.current = null; }
  }, []);

  useEffect(() => () => clearAnim(), [clearAnim]);

  const startTierGame = (tier: GameTier) => {
    const td = TIER_DATA[tier];
    if (gold < td.wager) return;
    playSound('uiClick');
    setSelectedTier(tier);
    setRounds([]);
    setCurrentRound(0);
    setNaturalTwelveOccurred(false);
    setDicePhase('playing');
  };

  const handleRoll = () => {
    if (animating) return;
    playSound('diceRoll');
    setAnimating(true);

    const finalP1 = rollD6(), finalP2 = rollD6();
    const finalR1 = rollD6(), finalR2 = rollD6();

    animRef.current = setInterval(() => {
      setDisplayDice([rollD6(), rollD6(), rollD6(), rollD6()]);
    }, 60);

    setTimeout(() => {
      clearAnim();
      setDisplayDice([finalP1, finalP2, finalR1, finalR2]);
      setAnimating(false);

      const playerTotal = finalP1 + finalP2;
      const rosieTotal = finalR1 + finalR2;
      const isNat12 = finalP1 === 6 && finalP2 === 6 && selectedTier === 'dragon';
      const playerWon = isNat12 ? true : playerTotal > rosieTotal;

      if (isNat12) setNaturalTwelveOccurred(true);

      const result: RoundResult = {
        playerDice: [finalP1, finalP2],
        rosieDice: [finalR1, finalR2],
        playerTotal,
        rosieTotal,
        playerWon,
        naturalTwelve: isNat12,
      };

      setRounds(prev => {
        const next = [...prev, result];
        const playerWins = next.filter(r => r.playerWon).length;
        const rosieWins = next.filter(r => !r.playerWon).length;

        if (next.length === 3 || playerWins === 2 || rosieWins === 2) {
          const finalPlayerWins = next.filter(r => r.playerWon).length;
          const gameWon = finalPlayerWins >= 2;
          const anyNat12 = next.some(r => r.naturalTwelve);
          playDrinkingGame(selectedTier!, gameWon ? 'win' : 'lose', anyNat12);
          setDicePhase('done');
        } else {
          setCurrentRound(r => r + 1);
        }
        return next;
      });
    }, 650);
  };

  const resetDiceGame = () => {
    setDicePhase('idle');
    setSelectedTier(null);
    setRounds([]);
    setCurrentRound(0);
    setNaturalTwelveOccurred(false);
    setDisplayDice([1, 1, 1, 1]);
  };

  // ── Rumour Bet helpers ────────────────────────────────────────────
  const betActive = rumourBet && !rumourBet.resolved && rumourBet.expiresOnDay >= day;
  const betExpired = !rumourBet || (rumourBet.expiresOnDay < day && !rumourBet.resolved && !rumourBet.betPlaced);
  const daysUntilNext = rumourBet ? Math.max(0, rumourBet.expiresOnDay - day + 1) : 5;

  const finalPlayerWins = rounds.filter(r => r.playerWon).length;
  const gameWon = dicePhase === 'done' && finalPlayerWins >= 2;

  return (
    <div style={{
      height: '100%', overflowY: 'auto',
      fontFamily: '"Crimson Text", Georgia, serif',
      background: '#0D0500',
    }}>
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '20px' }}>

        <button
          onClick={() => setActiveScreen('hub')}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'none', border: 'none', color: PARCHMENT,
            cursor: 'pointer', fontFamily: '"Cinzel", serif',
            fontSize: 17, marginBottom: 16, padding: 0,
          }}
        >
          <ArrowLeft size={19} /> Return to Lair
        </button>

        {!hasLair && (
          <div style={{
            background: '#CC882215', border: `1px solid #CC882240`,
            borderRadius: 6, padding: '8px 14px', marginBottom: 16,
            fontSize: 17, color: '#CC8822',
          }}>
            🏨 Current lodgings: The Ember &amp; Straw — {gameSettings.motelCostPerNight} gold/night, income ×0.5 until you acquire a lair.
          </div>
        )}
        {hasLair && (
          <div style={{
            background: '#4ACC7A15', border: `1px solid #4ACC7A30`,
            borderRadius: 6, padding: '8px 14px', marginBottom: 16,
            fontSize: 17, color: '#4ACC7A',
          }}>
            🏰 You now own a lair! The Ember &amp; Straw charges are no longer deducted.
          </div>
        )}

        <ContractCard contract={innkeeperContract} currentDay={day} />

        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <NPCPortrait role="halfling-innkeeper" size={160} />
            <div style={{ fontFamily: '"Cinzel", serif', fontWeight: 700, color: PARCHMENT, fontSize: 19, textAlign: 'center' }}>
              Rosie Tumblefoot
            </div>
            <div style={{ fontSize: 16, color: '#C4934A60', textAlign: 'center' }}>Proprietress</div>
            <div style={{ fontSize: 15, color: '#C4934A50', textAlign: 'center', fontStyle: 'italic' }}>
              The Ember &amp; Straw
            </div>
          </div>

          <div style={{ flex: 1, minWidth: 260 }}>
            {feedbackMsg && (
              <div style={{
                background: `${GOLD}15`, border: `1px solid ${GOLD}40`,
                borderRadius: 6, padding: '8px 12px', marginBottom: 12,
                fontSize: 17, color: GOLD,
              }}>
                {feedbackMsg}
              </div>
            )}

            <div style={{
              background: '#2C181040', border: `1px solid ${PARCHMENT}30`,
              borderRadius: 6, padding: '16px 18px', marginBottom: 16,
              fontSize: 20, color: '#E8D5A0', lineHeight: 1.65,
              fontStyle: 'italic', minHeight: 80,
            }}>
              "{resolved.npcLine}"
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {!isFarewell ? (
                resolved.playerOptions.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => handleOption(opt.label, opt.nextNode, opt.effect)}
                    style={{
                      padding: '10px 14px', textAlign: 'left', width: '100%',
                      background: i === 0 ? `${GOLD}15` : '#2C181030',
                      border: `1px solid ${i === 0 ? GOLD + '50' : PARCHMENT + '25'}`,
                      borderRadius: 5, color: i === 0 ? GOLD : '#E8D5A0',
                      cursor: 'pointer', fontSize: 18,
                      fontFamily: '"Crimson Text", serif',
                    }}
                  >
                    {opt.label}
                  </button>
                ))
              ) : (
                <button
                  onClick={() => setActiveScreen('hub')}
                  style={{
                    padding: '12px', width: '100%',
                    background: PARCHMENT, border: `2px solid ${INK}`,
                    borderRadius: 6, color: INK, cursor: 'pointer',
                    fontFamily: '"Cinzel", serif', fontWeight: 700, fontSize: 19,
                  }}
                >
                  Take My Leave
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Feature 1: Rosie's Wager ─────────────────────────────── */}
        <div style={{
          marginTop: 28,
          background: '#1A0E0580', border: `1px solid ${PARCHMENT}25`,
          borderRadius: 8, padding: '20px 22px',
        }}>
          <div style={{
            fontFamily: '"Cinzel", serif', fontWeight: 700,
            color: PARCHMENT, fontSize: 20, marginBottom: 14,
          }}>
            🪙 Rosie's Wager
          </div>

          {betActive && !rumourBet!.betPlaced && !rumourBet!.resolved && (
            <>
              <div style={{
                background: '#2C181050', border: `1px solid ${PARCHMENT}30`,
                borderRadius: 6, padding: '14px 16px', marginBottom: 14,
                fontSize: 18, color: '#E8D5A0', lineHeight: 1.65, fontStyle: 'italic',
              }}>
                "{rumourBet!.rumourText}"
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                <div style={{ fontSize: 16, color: '#C4934A90' }}>
                  Wager: <span style={{ color: GOLD, fontWeight: 700 }}>15g</span>
                  &nbsp;·&nbsp;Payout: <span style={{ color: '#4ACC7A', fontWeight: 700 }}>45g</span>
                  &nbsp;·&nbsp;Expires Day {rumourBet!.expiresOnDay}
                </div>
                <button
                  onClick={() => { playSound('uiClick'); placeRumourBet(); }}
                  disabled={gold < 15}
                  style={{
                    padding: '8px 18px',
                    background: gold >= 15 ? `${GOLD}25` : '#2C181030',
                    border: `1px solid ${gold >= 15 ? GOLD + '60' : PARCHMENT + '20'}`,
                    borderRadius: 5, color: gold >= 15 ? GOLD : '#C4934A40',
                    cursor: gold >= 15 ? 'pointer' : 'not-allowed',
                    fontFamily: '"Crimson Text", serif', fontSize: 17,
                  }}
                >
                  {gold < 15 ? 'Insufficient gold' : 'Place Bet (15g)'}
                </button>
              </div>
            </>
          )}

          {betActive && rumourBet!.betPlaced && !rumourBet!.resolved && (
            <>
              <div style={{
                background: '#2C181050', border: `1px solid ${PARCHMENT}30`,
                borderRadius: 6, padding: '14px 16px', marginBottom: 12,
                fontSize: 18, color: '#E8D5A0', lineHeight: 1.65, fontStyle: 'italic',
              }}>
                "{rumourBet!.rumourText}"
              </div>
              <div style={{
                background: `${GOLD}12`, border: `1px solid ${GOLD}30`,
                borderRadius: 5, padding: '10px 14px',
                fontSize: 17, color: GOLD, fontStyle: 'italic',
              }}>
                Your 15g is on the table. We'll see, won't we?
              </div>
            </>
          )}

          {rumourBet?.resolved && (
            <>
              <div style={{
                background: '#2C181050', border: `1px solid ${PARCHMENT}20`,
                borderRadius: 6, padding: '14px 16px', marginBottom: 12,
                fontSize: 18, color: '#C4934A80', lineHeight: 1.65, fontStyle: 'italic',
              }}>
                "{rumourBet.rumourText}"
              </div>
              {rumourBet.won ? (
                <div style={{
                  background: `${GREEN}20`, border: `1px solid ${GREEN}50`,
                  borderRadius: 5, padding: '10px 14px',
                  fontSize: 17, color: '#4ACC7A',
                }}>
                  ✓ Rosie was right! +45 gold collected. Next wager available soon.
                </div>
              ) : (
                <div style={{
                  background: `${CRIMSON}20`, border: `1px solid ${CRIMSON}50`,
                  borderRadius: 5, padding: '10px 14px',
                  fontSize: 17, color: '#CC6666', fontStyle: 'italic',
                }}>
                  Rosie shrugs apologetically. "Better luck next time, love."
                  {!rumourBet.betPlaced && ' (Bet not placed — no gold lost.)'}
                </div>
              )}
              <div style={{ marginTop: 8, fontSize: 15, color: '#C4934A50' }}>
                Next wager available in {daysUntilNext > 0 ? `~${daysUntilNext} day(s)` : 'tomorrow'}.
              </div>
            </>
          )}

          {(betExpired || !rumourBet) && (
            <div style={{
              fontSize: 17, color: '#C4934A60', fontStyle: 'italic',
            }}>
              "Nothing worth wagering on at the moment. Come back tomorrow."
              {rumourBet && (
                <span style={{ display: 'block', fontSize: 15, marginTop: 4, color: '#C4934A40' }}>
                  Next wager in ~{daysUntilNext} day(s).
                </span>
              )}
            </div>
          )}
        </div>

        {/* ── Feature 7: High Roller Dice Game ─────────────────────── */}
        <div style={{
          marginTop: 20,
          background: '#1A0E0580', border: `1px solid ${PARCHMENT}25`,
          borderRadius: 8, padding: '20px 22px',
        }}>
          <div style={{
            fontFamily: '"Cinzel", serif', fontWeight: 700,
            color: PARCHMENT, fontSize: 20, marginBottom: 6,
          }}>
            🎲 High Roller
          </div>
          <div style={{ fontSize: 16, color: '#C4934A70', marginBottom: 16 }}>
            Best of 3 rounds. Ties go to Rosie. One game per day.
          </div>

          {drinkingGamePlayedToday && dicePhase === 'idle' && (
            <div style={{ fontSize: 17, color: '#C4934A70', fontStyle: 'italic' }}>
              "You've already tested your luck today. Come back tomorrow."
            </div>
          )}

          {!drinkingGamePlayedToday && dicePhase === 'idle' && (
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {(Object.entries(TIER_DATA) as [GameTier, typeof TIER_DATA[GameTier]][]).map(([tier, td]) => (
                <button
                  key={tier}
                  onClick={() => startTierGame(tier)}
                  disabled={gold < td.wager}
                  style={{
                    flex: '1 1 160px', padding: '14px 12px',
                    background: gold >= td.wager ? `${td.color}15` : '#1A0E0540',
                    border: `1px solid ${gold >= td.wager ? td.color + '50' : '#C4934A20'}`,
                    borderRadius: 7,
                    cursor: gold >= td.wager ? 'pointer' : 'not-allowed',
                    textAlign: 'left',
                    transition: 'background 0.15s',
                  }}
                >
                  <div style={{
                    fontFamily: '"Cinzel", serif', fontWeight: 700,
                    color: gold >= td.wager ? td.color : '#C4934A40', fontSize: 16,
                  }}>
                    {td.label}
                  </div>
                  <div style={{ fontSize: 15, color: '#C4934A80', marginTop: 4 }}>
                    Wager: <span style={{ color: gold >= td.wager ? '#CC8822' : '#C4934A40' }}>{td.wager}g</span>
                  </div>
                  <div style={{ fontSize: 15, color: '#C4934A80' }}>
                    Win pays: <span style={{ color: gold >= td.wager ? '#4ACC7A' : '#C4934A40' }}>{td.payout}g</span>
                  </div>
                  {tier === 'dragon' && (
                    <div style={{ fontSize: 13, color: gold >= td.wager ? '#C9A22780' : '#C4934A30', marginTop: 4, fontStyle: 'italic' }}>
                      Natural 12 = instant round win + 3 Dread
                    </div>
                  )}
                  {gold < td.wager && (
                    <div style={{ fontSize: 13, color: '#C4934A40', marginTop: 4 }}>
                      Need {td.wager - gold}g more
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}

          {(dicePhase === 'playing' || dicePhase === 'done') && selectedTier && (
            <div>
              <div style={{
                fontSize: 17, color: '#C4934A90', fontStyle: 'italic', marginBottom: 16,
              }}>
                "Rosie cracks her knuckles. 'Let's see what you've got.'"
              </div>
              <div style={{ marginBottom: 8, fontSize: 16, color: PARCHMENT }}>
                <span style={{ color: TIER_DATA[selectedTier].color, fontWeight: 700 }}>
                  {TIER_DATA[selectedTier].label}
                </span>
                {' '}— Wager: {TIER_DATA[selectedTier].wager}g · Win: {TIER_DATA[selectedTier].payout}g
              </div>

              {/* Rounds */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {rounds.map((r, i) => (
                  <RoundCard key={i} roundNum={i + 1} result={r} />
                ))}

                {/* Current round roll button */}
                {dicePhase === 'playing' && (
                  <div style={{
                    background: '#2C181040', border: `1px solid ${PARCHMENT}20`,
                    borderRadius: 6, padding: '14px 16px',
                  }}>
                    <div style={{ fontSize: 16, color: PARCHMENT, marginBottom: 12 }}>
                      Round {rounds.length + 1} of 3
                    </div>
                    {!animating ? (
                      <button
                        onClick={handleRoll}
                        style={{
                          padding: '10px 28px',
                          background: `${GOLD}20`, border: `1px solid ${GOLD}50`,
                          borderRadius: 5, color: GOLD, cursor: 'pointer',
                          fontFamily: '"Cinzel", serif', fontWeight: 700, fontSize: 17,
                        }}
                      >
                        Roll Dice
                      </button>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <DicePair values={[displayDice[0], displayDice[1]]} label="You" rolling />
                        <span style={{ color: PARCHMENT, fontSize: 18 }}>vs</span>
                        <DicePair values={[displayDice[2], displayDice[3]]} label="Rosie" rolling />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Final result */}
              {dicePhase === 'done' && (
                <div style={{
                  marginTop: 16,
                  background: gameWon ? `${GREEN}20` : '#2C181050',
                  border: `2px solid ${gameWon ? GREEN + '60' : CRIMSON + '40'}`,
                  borderRadius: 8, padding: '18px 20px',
                  animation: gameWon ? 'pulse 1.5s infinite' : undefined,
                }}>
                  {naturalTwelveOccurred && (
                    <div style={{
                      fontSize: 17, color: GOLD, fontStyle: 'italic',
                      marginBottom: 10,
                    }}>
                      "The entire inn goes quiet. Rosie stares at the dice. 'Well,' she says finally, 'I've never actually seen that happen.'"
                    </div>
                  )}
                  {gameWon ? (
                    <div style={{ fontSize: 18, color: '#4ACC7A', fontStyle: 'italic' }}>
                      "Rosie counts out the coins with a theatrical sigh. 'You're going to ruin my reputation, you know that?'"
                      <div style={{ marginTop: 8, color: '#4ACC7A', fontWeight: 700, fontStyle: 'normal' }}>
                        +{TIER_DATA[selectedTier].payout} gold
                        {naturalTwelveOccurred && selectedTier === 'dragon' && ' · +3 Dread'}
                      </div>
                    </div>
                  ) : (
                    <div style={{ fontSize: 18, color: '#CC8888', fontStyle: 'italic' }}>
                      "Rosie sweeps the coins into her apron with practiced efficiency. 'No hard feelings, love. My table, my odds.'"
                      <div style={{ marginTop: 8, color: '#CC6666', fontWeight: 700, fontStyle: 'normal' }}>
                        −{TIER_DATA[selectedTier].wager} gold
                      </div>
                    </div>
                  )}
                  <button
                    onClick={resetDiceGame}
                    style={{
                      marginTop: 14, padding: '8px 20px',
                      background: '#2C181040', border: `1px solid ${PARCHMENT}30`,
                      borderRadius: 5, color: PARCHMENT, cursor: 'pointer',
                      fontFamily: '"Crimson Text", serif', fontSize: 16,
                    }}
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

function DicePair({ values, label, rolling }: { values: [number, number]; label: string; rolling?: boolean }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 14, color: '#C4934A80', marginBottom: 4 }}>{label}</div>
      <div style={{ display: 'flex', gap: 6 }}>
        {values.map((v, i) => (
          <div
            key={i}
            style={{
              width: 44, height: 44, borderRadius: 8,
              background: rolling ? '#3A2010' : '#2C1810',
              border: `2px solid ${rolling ? GOLD : '#C4934A50'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: '"Cinzel", serif', fontWeight: 700, fontSize: 22,
              color: rolling ? GOLD : '#E8D5A0',
              transition: rolling ? 'none' : 'background 0.1s',
            }}
          >
            {v}
          </div>
        ))}
      </div>
      <div style={{ fontSize: 15, color: '#C4934A80', marginTop: 4 }}>= {values[0] + values[1]}</div>
    </div>
  );
}

function RoundCard({ roundNum, result }: { roundNum: number; result: RoundResult }) {
  const { playerDice, rosieDice, playerTotal, rosieTotal, playerWon, naturalTwelve } = result;
  return (
    <div style={{
      background: '#2C181040', border: `1px solid ${playerWon ? '#4ACC7A30' : '#CC666630'}`,
      borderRadius: 6, padding: '12px 16px',
    }}>
      <div style={{
        fontSize: 15, color: PARCHMENT, marginBottom: 10,
        fontFamily: '"Cinzel", serif',
      }}>
        Round {roundNum}
        {naturalTwelve && <span style={{ color: GOLD, marginLeft: 8, fontSize: 14 }}>⭐ Natural 12!</span>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <DicePair values={playerDice} label="You" />
        <span style={{ color: '#C4934A80', fontSize: 18 }}>vs</span>
        <DicePair values={rosieDice} label="Rosie" />
        <div style={{
          marginLeft: 'auto', padding: '4px 12px',
          background: playerWon ? '#4ACC7A20' : '#CC666620',
          border: `1px solid ${playerWon ? '#4ACC7A50' : '#CC666650'}`,
          borderRadius: 4, fontSize: 15,
          color: playerWon ? '#4ACC7A' : '#CC8888',
          fontWeight: 700,
        }}>
          {naturalTwelve ? 'Natural 12 — Instant Win!' : playerWon ? `You win (${playerTotal} vs ${rosieTotal})` : playerTotal === rosieTotal ? `Tie → Rosie (${playerTotal} = ${rosieTotal})` : `Rosie wins (${rosieTotal} vs ${playerTotal})`}
        </div>
      </div>
    </div>
  );
}
