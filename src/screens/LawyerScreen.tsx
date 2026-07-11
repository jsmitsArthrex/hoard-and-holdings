import { useState } from 'react';
import { ArrowLeft, Scale, AlertTriangle, CheckCircle, XCircle, Gavel } from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import NPCPortrait from '../components/npcs/NPCPortrait';
import { getDialogueLine } from '../dialogue/dialogueEngine';
import type { ResolvedDialogue, DialogueContext } from '../dialogue';
import { dragonBreeds } from '../data/dragonBreeds';
import { districts } from '../data/districts';
import { playSound } from '../audio/audioEngine';

const INK = '#2C1810';
const PARCHMENT = '#C4934A';
const GOLD = '#C9A227';
const AMBER = '#F59E0B';

const LEGAL_PROTECTION_COST = 30;

const ROUND_HEADERS = [
  'Round 1 of 3 — Establish Ownership',
  'Round 2 of 3 — Challenge Intent',
  'Round 3 of 3 — Final Summation',
];

const WIN_REACTIONS = [
  'The court notes the defendant\'s superior grasp of property law. The rival\'s counsel goes visibly pale.',
  'A murmur of approval from the gallery. Your argument lands with the precision of a well-drafted deed.',
  'The judge nods, almost imperceptibly. Saeloril marks her ledger with the air of someone who expected nothing less.',
];

const LOSS_REACTIONS: Record<'strong' | 'bluff' | 'weak', string[]> = {
  strong: [
    'The judge peers over his spectacles. Your argument has the structural integrity of wet parchment.',
    'A ripple of discomfort crosses the court. Even your own counsel looks away.',
    'The judge\'s expression suggests he has seen better arguments scratched on tavern walls.',
  ],
  bluff: [
    'Saeloril winces almost imperceptibly. The bluff did not land.',
    'The opposing counsel smiles. You press forward, hoping no one noticed the wobble.',
    'The judge sets down his quill. He noticed.',
  ],
  weak: [
    'The judge peers over his spectacles. Your argument has the structural integrity of wet parchment.',
    'Your rival\'s counsel suppresses a smile. The gallery shifts uncomfortably.',
    'Saeloril makes a small note. You suspect it says "desperate".',
  ],
};

const SCORE_OUTCOMES = [
  { label: 'Score 0', verdict: 'Full Loss', colour: '#CC4444' },
  { label: 'Score 1', verdict: 'Narrow Loss', colour: '#E07840' },
  { label: 'Score 2', verdict: 'Partial Win', colour: AMBER },
  { label: 'Score 3', verdict: 'Outright Victory', colour: '#44CC88' },
];

export default function LawyerScreen() {
  const {
    dragon, gold, dread, day,
    playerPropertyIds, rivals,
    activeDispute,
    setActiveScreen, applyLegalProtection, logEvent,
    makeDisputeArgument,
  } = useGameStore();

  const breedName = dragonBreeds.find(b => b.id === dragon?.breedId)?.breed ?? 'Dragon';
  const allProperties = districts.flatMap(d => d.properties);

  const firstOwnedProp = allProperties.find(p => playerPropertyIds.includes(p.id));
  const mostRelatedRival = rivals.reduce<typeof rivals[0] | null>((worst, r) => {
    if (!worst) return r;
    return r.relationship < worst.relationship ? r : worst;
  }, null);

  const buildCtx = (): DialogueContext => ({
    playerName: dragon?.name ?? 'Dragon',
    dragonBreed: breedName,
    gold,
    dreadRating: dread,
    currentDay: day,
    dragonAge: dragon?.age ?? 1,
    propertyName: firstOwnedProp?.name ?? 'your holdings',
    price: firstOwnedProp?.goldPrice,
    rivalName: mostRelatedRival?.name ?? 'a rival',
  });

  const [resolved, setResolved] = useState<ResolvedDialogue>(() =>
    getDialogueLine('arcaneLawyer', 'greeting', buildCtx(), 'elf')
  );
  const [currentNode, setCurrentNode] = useState('greeting');
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [alreadyFiled, setAlreadyFiled] = useState(false);

  const [arguing, setArguing] = useState(false);
  const [roundResults, setRoundResults] = useState<Array<{ won: boolean; type: 'strong' | 'bluff' | 'weak' }>>([]);

  const handleOption = (_label: string, nextNode: string, effect?: string) => {
    playSound('pageFlip');

    if (effect === 'legal_protection') {
      if (alreadyFiled) {
        setFeedbackMsg('The clauses are already on file, client. Do not be redundant.');
      } else if (gold < LEGAL_PROTECTION_COST) {
        setFeedbackMsg(`Insufficient funds. The retainer is ${LEGAL_PROTECTION_COST} gold. I am not a charity.`);
        return;
      } else {
        applyLegalProtection();
        setAlreadyFiled(true);
        logEvent(`Filed legal protective clauses. −${LEGAL_PROTECTION_COST} gold. Sell multiplier +0.2 for 10 days.`, 'economy');
        setFeedbackMsg(`Clauses filed. −${LEGAL_PROTECTION_COST} gold. Auction sell prices +20% for 10 days.`);
      }
    }

    const next = getDialogueLine('arcaneLawyer', nextNode, buildCtx(), 'elf');
    setResolved(next);
    setCurrentNode(nextNode);
  };

  const handleArgument = (type: 'strong' | 'bluff' | 'weak') => {
    if (!activeDispute) return;
    const prevScore = activeDispute.playerScore;
    makeDisputeArgument(type);
    const newDispute = useGameStore.getState().activeDispute;
    const won = (newDispute?.playerScore ?? prevScore) > prevScore;
    setRoundResults(prev => [...prev, { won, type }]);
  };

  const handleOpenArguing = () => {
    setArguing(true);
    setRoundResults([]);
  };

  const isFarewell = currentNode === 'farewell' || resolved.playerOptions.length === 0;
  const canAfford = gold >= LEGAL_PROTECTION_COST;

  const hasDispute = !!activeDispute && !activeDispute.resolved;
  const disputeExpired = activeDispute && !activeDispute.resolved && day > activeDispute.expiresOnDay;
  const daysRemaining = activeDispute && !activeDispute.resolved
    ? Math.max(0, activeDispute.expiresOnDay - day)
    : 0;

  const currentRoundIndex = activeDispute ? activeDispute.round : 0;
  const lastRoundResult = roundResults.length > 0 ? roundResults[roundResults.length - 1] : null;
  const disputeFullyResolved = activeDispute?.resolved && roundResults.length === 3;
  const disputeVerdictInfo = activeDispute ? SCORE_OUTCOMES[activeDispute.playerScore] : null;

  return (
    <div style={{
      height: '100%', overflowY: 'auto',
      fontFamily: '"Crimson Text", Georgia, serif',
      background: '#040A06',
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

        {/* ── Active Dispute Banner ─────────────────────────────────────── */}
        {hasDispute && !arguing && (
          <div style={{
            background: '#2A1A0020',
            border: `2px solid ${AMBER}`,
            borderRadius: 8,
            padding: '14px 18px',
            marginBottom: 18,
            boxShadow: `0 0 18px ${AMBER}30`,
            animation: 'pulse-amber 2s infinite',
          }}>
            <style>{`@keyframes pulse-amber { 0%,100%{box-shadow:0 0 12px ${AMBER}30} 50%{box-shadow:0 0 28px ${AMBER}55} }`}</style>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <AlertTriangle size={20} color={AMBER} />
              <span style={{ fontFamily: '"Cinzel", serif', fontWeight: 700, color: AMBER, fontSize: 18 }}>
                Active Property Dispute
              </span>
            </div>
            <div style={{ color: '#E8D5A0', fontSize: 17, marginBottom: 4 }}>
              <strong style={{ color: PARCHMENT }}>{activeDispute.rivalName}</strong> has filed a claim over{' '}
              <strong style={{ color: PARCHMENT }}>{activeDispute.propertyName}</strong>.
            </div>
            <div style={{ color: `${PARCHMENT}80`, fontSize: 15, marginBottom: 12 }}>
              {disputeExpired
                ? '⏰ The deadline has passed — this will be resolved at the start of the next day.'
                : `⏰ ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} remaining to argue your case.`}
            </div>
            {!disputeExpired && (
              <button
                onClick={handleOpenArguing}
                style={{
                  padding: '10px 20px',
                  background: `${AMBER}18`, border: `1px solid ${AMBER}80`,
                  borderRadius: 6, color: AMBER, cursor: 'pointer',
                  fontFamily: '"Cinzel", serif', fontWeight: 700, fontSize: 16,
                }}
              >
                <Scale size={15} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                Argue My Case
              </button>
            )}
          </div>
        )}

        {/* ── No Active Dispute Placeholder ────────────────────────────── */}
        {!activeDispute && (
          <div style={{
            background: `${PARCHMENT}08`, border: `1px solid ${PARCHMENT}18`,
            borderRadius: 6, padding: '10px 14px', marginBottom: 16,
            fontSize: 16, color: `${PARCHMENT}50`, fontStyle: 'italic',
          }}>
            No active disputes. Saeloril looks almost disappointed.
          </div>
        )}

        {/* ── Resolved Dispute Notice ───────────────────────────────────── */}
        {activeDispute?.resolved && !arguing && (
          <div style={{
            background: '#1A1A2A30', border: `1px solid ${PARCHMENT}30`,
            borderRadius: 6, padding: '10px 14px', marginBottom: 16,
            fontSize: 16, color: `${PARCHMENT}70`,
          }}>
            ⚖️ The recent dispute over <strong>{activeDispute.propertyName}</strong> has been resolved.
          </div>
        )}

        {/* ── Argument Flow Panel ───────────────────────────────────────── */}
        {arguing && activeDispute && !activeDispute.resolved && (
          <div style={{
            background: '#0A1208', border: `1px solid ${PARCHMENT}35`,
            borderRadius: 10, padding: '20px 22px', marginBottom: 20,
          }}>
            {/* Round header */}
            <div style={{
              fontFamily: '"Cinzel", serif', fontWeight: 700,
              color: GOLD, fontSize: 18, marginBottom: 4,
            }}>
              {ROUND_HEADERS[currentRoundIndex] ?? 'Awaiting verdict…'}
            </div>
            <div style={{
              color: `${PARCHMENT}70`, fontSize: 14, marginBottom: 16,
            }}>
              {'⬜'.repeat(3 - activeDispute.playerScore - (3 - currentRoundIndex - (3 - activeDispute.playerScore)))}
              {/* Score display */}
              Score: <strong style={{ color: GOLD }}>{activeDispute.playerScore}</strong> / {currentRoundIndex} rounds won
            </div>

            {/* Previous round reaction */}
            {lastRoundResult && (
              <div style={{
                background: lastRoundResult.won ? '#22331820' : '#33110820',
                border: `1px solid ${lastRoundResult.won ? '#44AA6660' : '#AA334460'}`,
                borderRadius: 6, padding: '10px 14px', marginBottom: 16,
                fontSize: 16, color: lastRoundResult.won ? '#88CC88' : '#CC8866',
                display: 'flex', alignItems: 'flex-start', gap: 10,
              }}>
                {lastRoundResult.won
                  ? <CheckCircle size={18} color="#44CC88" style={{ flexShrink: 0, marginTop: 2 }} />
                  : <XCircle size={18} color="#CC4444" style={{ flexShrink: 0, marginTop: 2 }} />}
                <span style={{ fontStyle: 'italic' }}>
                  {lastRoundResult.won
                    ? WIN_REACTIONS[currentRoundIndex - 1] ?? WIN_REACTIONS[0]
                    : (LOSS_REACTIONS[lastRoundResult.type]?.[currentRoundIndex - 1] ?? LOSS_REACTIONS.weak[0])
                  }
                </span>
              </div>
            )}

            {/* Argument buttons */}
            {currentRoundIndex < 3 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button
                  onClick={() => gold >= 10 && handleArgument('strong')}
                  disabled={gold < 10}
                  style={{
                    padding: '12px 16px', textAlign: 'left',
                    background: gold >= 10 ? '#1A3A1A30' : '#1A1A1A20',
                    border: `1px solid ${gold >= 10 ? '#44AA6680' : '#44444440'}`,
                    borderRadius: 6,
                    color: gold >= 10 ? '#88CC88' : '#555',
                    cursor: gold >= 10 ? 'pointer' : 'not-allowed',
                    fontFamily: '"Crimson Text", serif', fontSize: 18,
                  }}
                >
                  <div style={{ fontWeight: 700, marginBottom: 2 }}>Strong Argument</div>
                  <div style={{ fontSize: 15, color: gold >= 10 ? '#88CC8880' : '#44444460' }}>
                    Legally sound and well-researched — guaranteed to win the round.{' '}
                    <span style={{ color: gold >= 10 ? '#FFAA44' : '#664422' }}>10g preparation fee.</span>
                  </div>
                </button>
                <button
                  onClick={() => handleArgument('bluff')}
                  style={{
                    padding: '12px 16px', textAlign: 'left',
                    background: `${GOLD}12`,
                    border: `1px solid ${GOLD}40`,
                    borderRadius: 6, color: '#E8D5A0',
                    cursor: 'pointer',
                    fontFamily: '"Crimson Text", serif', fontSize: 18,
                  }}
                >
                  <div style={{ fontWeight: 700, marginBottom: 2 }}>Bluff Argument</div>
                  <div style={{ fontSize: 15, color: '#E8D5A060' }}>
                    Moderately plausible — 50% chance to win the round. Free.
                  </div>
                </button>
                <button
                  onClick={() => handleArgument('weak')}
                  style={{
                    padding: '12px 16px', textAlign: 'left',
                    background: '#2A100820',
                    border: `1px solid ${PARCHMENT}25`,
                    borderRadius: 6, color: `${PARCHMENT}80`,
                    cursor: 'pointer',
                    fontFamily: '"Crimson Text", serif', fontSize: 18,
                  }}
                >
                  <div style={{ fontWeight: 700, marginBottom: 2 }}>Weak Argument</div>
                  <div style={{ fontSize: 15, color: `${PARCHMENT}50` }}>
                    A desperate plea — loses the round, but slightly warms the judge's mood. Free.
                  </div>
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Final Verdict Card ─────────────────────────────────────────── */}
        {arguing && activeDispute?.resolved && disputeFullyResolved && disputeVerdictInfo && (
          <div style={{
            background: '#0C1210', border: `2px solid ${disputeVerdictInfo.colour}60`,
            borderRadius: 10, padding: '22px 24px', marginBottom: 20,
            boxShadow: `0 0 24px ${disputeVerdictInfo.colour}25`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <Gavel size={22} color={disputeVerdictInfo.colour} />
              <span style={{
                fontFamily: '"Cinzel", serif', fontWeight: 700,
                color: disputeVerdictInfo.colour, fontSize: 20,
              }}>
                {disputeVerdictInfo.verdict}
              </span>
            </div>
            <div style={{
              background: '#0A1208', border: `1px solid ${PARCHMENT}25`,
              borderRadius: 6, padding: '14px 16px', marginBottom: 16,
              fontSize: 18, color: '#E8D5A0', lineHeight: 1.65, fontStyle: 'italic',
            }}>
              {activeDispute.playerScore === 3 && `The court finds entirely in your favour. ${activeDispute.rivalName}'s counsel offered no credible rebuttal. ${activeDispute.propertyName} remains uncontested in your portfolio.`}
              {activeDispute.playerScore === 2 && `The court acknowledges your rightful claim on ${activeDispute.propertyName}, though the proceedings were not without cost. Saeloril collects her fees with professional efficiency.`}
              {activeDispute.playerScore === 1 && `The court allows you to retain ${activeDispute.propertyName} by the slimmest of margins, but the fees are substantial and ${activeDispute.rivalName} departs with an unsettling air of satisfaction.`}
              {activeDispute.playerScore === 0 && `The court transfers title of ${activeDispute.propertyName} to ${activeDispute.rivalName}. The gavel falls. Saeloril offers her condolences in the same tone she uses to describe the weather.`}
            </div>
            <div style={{ fontSize: 15, color: `${PARCHMENT}70`, marginBottom: 16 }}>
              {activeDispute.playerScore === 3 && `+5 Dread. ${activeDispute.rivalName} relationship −15.`}
              {activeDispute.playerScore === 2 && '−30 gold in legal fees.'}
              {activeDispute.playerScore === 1 && `−60 gold in legal fees. ${activeDispute.rivalName} relationship +5.`}
              {activeDispute.playerScore === 0 && `${activeDispute.propertyName} transferred to ${activeDispute.rivalName}. ${activeDispute.rivalName} relationship +10.`}
            </div>
            <button
              onClick={() => setArguing(false)}
              style={{
                padding: '10px 20px',
                background: `${PARCHMENT}18`, border: `1px solid ${PARCHMENT}50`,
                borderRadius: 6, color: PARCHMENT, cursor: 'pointer',
                fontFamily: '"Cinzel", serif', fontWeight: 700, fontSize: 16,
              }}
            >
              Adjourn
            </button>
          </div>
        )}

        {/* Status effects notice */}
        {alreadyFiled && (
          <div style={{
            background: '#44CCAA18', border: `1px solid #44CCAA40`,
            borderRadius: 6, padding: '8px 14px', marginBottom: 16,
            fontSize: 17, color: '#44CCAA',
          }}>
            ⚖️ Legal Protection active — Sell multiplier +0.2 for 10 days.
          </div>
        )}
        {!alreadyFiled && (
          <div style={{
            background: `${PARCHMENT}10`, border: `1px solid ${PARCHMENT}25`,
            borderRadius: 6, padding: '8px 14px', marginBottom: 16,
            fontSize: 17, color: `${PARCHMENT}80`,
          }}>
            ⚖️ Protective clauses cost <strong style={{ color: canAfford ? GOLD : '#CC4444' }}>{LEGAL_PROTECTION_COST} gold</strong> — boost auction sell prices +20% for 10 days.
          </div>
        )}

        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          {/* Portrait */}
          <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <NPCPortrait role="elven-lawyer" size={160} />
            <div style={{ fontFamily: '"Cinzel", serif', fontWeight: 700, color: PARCHMENT, fontSize: 19, textAlign: 'center' }}>
              Saeloril Vethran
            </div>
            <div style={{ fontSize: 16, color: '#C4934A60', textAlign: 'center' }}>Arcane Law, Third Compact</div>
            <div style={{ fontSize: 15, color: '#C4934A50', textAlign: 'center', fontStyle: 'italic' }}>
              Counsel at Law
            </div>
          </div>

          {/* Dialogue */}
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
              background: '#0A1A0C40', border: `1px solid ${PARCHMENT}30`,
              borderRadius: 6, padding: '16px 18px', marginBottom: 16,
              fontSize: 20, color: '#E8D5A0', lineHeight: 1.65,
              fontStyle: 'italic', minHeight: 80,
            }}>
              "{resolved.npcLine}"
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {!isFarewell ? (
                resolved.playerOptions.map((opt, i) => {
                  const isProtectionOpt = opt.effect === 'legal_protection';
                  const disabled = isProtectionOpt && (!canAfford || alreadyFiled);
                  return (
                    <button
                      key={i}
                      onClick={() => !disabled && handleOption(opt.label, opt.nextNode, opt.effect)}
                      disabled={disabled}
                      style={{
                        padding: '10px 14px', textAlign: 'left', width: '100%',
                        background: isProtectionOpt
                          ? (canAfford && !alreadyFiled ? '#44CCAA18' : '#2C181030')
                          : i === 0 ? `${GOLD}12` : '#0A1A0C30',
                        border: `1px solid ${isProtectionOpt
                          ? (canAfford && !alreadyFiled ? '#44CCAA60' : PARCHMENT + '20')
                          : i === 0 ? GOLD + '40' : PARCHMENT + '20'}`,
                        borderRadius: 5,
                        color: disabled ? '#C4934A30' : isProtectionOpt && canAfford && !alreadyFiled
                          ? '#44CCAA'
                          : i === 0 ? GOLD : '#E8D5A0',
                        cursor: disabled ? 'not-allowed' : 'pointer',
                        fontSize: 18,
                        fontFamily: '"Crimson Text", serif',
                      }}
                    >
                      {opt.label}
                      {isProtectionOpt && !alreadyFiled && (
                        <span style={{ fontSize: 15, color: canAfford ? '#44CCAA80' : '#CC444480', marginLeft: 8 }}>
                          ({LEGAL_PROTECTION_COST} gold)
                        </span>
                      )}
                      {isProtectionOpt && alreadyFiled && (
                        <span style={{ fontSize: 15, color: '#44CCAA80', marginLeft: 8 }}>✓ Filed</span>
                      )}
                    </button>
                  );
                })
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
      </div>
    </div>
  );
}
