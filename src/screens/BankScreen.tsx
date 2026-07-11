import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import NPCPortrait from '../components/npcs/NPCPortrait';
import { getDialogueLine } from '../dialogue/dialogueEngine';
import type { ResolvedDialogue, DialogueContext } from '../dialogue';
import { dragonBreeds } from '../data/dragonBreeds';
import { priceIndex } from '../data/economyIndex';
import { playSound } from '../audio/audioEngine';
import ContractCard from '../components/ui/ContractCard';

const INK = '#2C1810';
const PARCHMENT = '#C4934A';
const GOLD = '#C9A227';

const LOAN_TIER_DEFS = [
  { tier: 'small'  as const, label: 'Short-Term Note',    borrow: 75,  repay: 100, window: 8  },
  { tier: 'medium' as const, label: 'Standard Advance',   borrow: 150, repay: 210, window: 12 },
  { tier: 'large'  as const, label: 'Capital Loan',       borrow: 300, repay: 450, window: 18 },
];

export default function BankScreen() {
  const {
    dragon, gold, dread, day,
    activeContracts,
    activeLoan,
    takeLoan,
    repayLoan,
    setActiveScreen,
  } = useGameStore();

  const bankContract = (activeContracts ?? []).find(c => c.npcId === 'bank' && !c.completed && !c.failed);

  const breedName = dragonBreeds.find(b => b.id === dragon?.breedId)?.breed ?? 'Dragon';
  const economyMultiplier = parseFloat(priceIndex[(day - 1) % priceIndex.length].toFixed(2));

  const buildCtx = (): DialogueContext => ({
    playerName: dragon?.name ?? 'Dragon',
    dragonBreed: breedName,
    gold,
    dreadRating: dread,
    currentDay: day,
    dragonAge: dragon?.age ?? 1,
    economyMultiplier,
  });

  const [resolved, setResolved] = useState<ResolvedDialogue>(() =>
    getDialogueLine('banker', 'greeting', buildCtx(), 'dragonborn')
  );
  const [currentNode, setCurrentNode] = useState('greeting');

  const handleOption = (_label: string, nextNode: string) => {
    playSound('pageFlip');
    const next = getDialogueLine('banker', nextNode, buildCtx(), 'dragonborn');
    setResolved(next);
    setCurrentNode(nextNode);
  };

  const isFarewell = currentNode === 'farewell' || resolved.playerOptions.length === 0;

  const multColor = economyMultiplier > 1.1
    ? '#4ACC7A'
    : economyMultiplier < 0.9
    ? '#CC4444'
    : PARCHMENT;

  return (
    <div style={{
      height: '100%', overflowY: 'auto',
      fontFamily: '"Crimson Text", Georgia, serif',
      background: '#080616',
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

        {/* Market rate */}
        <div style={{
          background: '#22113060', border: `1px solid ${PARCHMENT}30`,
          borderRadius: 6, padding: '8px 14px', marginBottom: 16,
          fontSize: 17, color: '#C4934A80',
        }}>
          Today's market rate:{' '}
          <span style={{ color: multColor, fontWeight: 700, fontFamily: '"Cinzel", serif' }}>
            {economyMultiplier}×
          </span>
          {economyMultiplier > 1.1 && <span style={{ color: '#4ACC7A', marginLeft: 8 }}>▲ Above average</span>}
          {economyMultiplier < 0.9 && <span style={{ color: '#CC4444', marginLeft: 8 }}>▼ Below average</span>}
        </div>

        <ContractCard contract={bankContract} currentDay={day} />

        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          {/* Portrait */}
          <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <NPCPortrait role="dragonborn-banker" size={160} />
            <div style={{ fontFamily: '"Cinzel", serif', fontWeight: 700, color: PARCHMENT, fontSize: 19, textAlign: 'center' }}>
              Barrax
            </div>
            <div style={{ fontSize: 16, color: '#C4934A60', textAlign: 'center' }}>Senior Vault Keeper</div>
            <div style={{ fontSize: 15, color: '#C4934A50', textAlign: 'center', fontStyle: 'italic' }}>
              Ironclad District
            </div>
          </div>

          {/* Dialogue */}
          <div style={{ flex: 1, minWidth: 260 }}>
            <div style={{
              background: '#22113040', border: `1px solid ${PARCHMENT}30`,
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
                    onClick={() => handleOption(opt.label, opt.nextNode)}
                    style={{
                      padding: '10px 14px', textAlign: 'left', width: '100%',
                      background: i === 0 ? `${GOLD}15` : '#22113030',
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

        {/* ── Ironclad Lending ─────────────────────────────────────────────── */}
        <div style={{
          marginTop: 28,
          borderTop: `1px solid ${PARCHMENT}20`,
          paddingTop: 22,
        }}>
          {/* Section header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <h2 style={{
              fontFamily: '"Cinzel", serif', fontWeight: 700,
              color: PARCHMENT, fontSize: 20, margin: 0,
            }}>
              Ironclad Lending
            </h2>
            {activeLoan?.defaulted && (
              <span style={{
                background: '#5C0A0A', border: '1px solid #CC2222',
                borderRadius: 4, padding: '2px 8px',
                fontSize: 14, color: '#FF6666',
                fontFamily: '"Cinzel", serif', fontWeight: 700,
              }}>
                ⚠ In Default
              </span>
            )}
          </div>

          {/* Barrax quote */}
          <p style={{
            fontStyle: 'italic', fontSize: 17, color: '#C4934A70',
            margin: '0 0 18px', lineHeight: 1.5,
          }}>
            "I extend this credit on the basis of your current holdings, not your optimism. Do not confuse the two."
          </p>

          {/* No active loan — show tier cards */}
          {!activeLoan && (
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {LOAN_TIER_DEFS.map(def => (
                <div
                  key={def.tier}
                  style={{
                    flex: '1 1 180px',
                    background: '#22113030',
                    border: `1px solid ${PARCHMENT}25`,
                    borderRadius: 6, padding: '16px',
                    display: 'flex', flexDirection: 'column', gap: 8,
                  }}
                >
                  <div style={{ fontFamily: '"Cinzel", serif', fontWeight: 700, color: PARCHMENT, fontSize: 17 }}>
                    {def.label}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <span style={{ fontSize: 16, color: '#4ACC7A' }}>🪙 +{def.borrow} gold borrowed</span>
                    <span style={{ fontSize: 16, color: '#CC6644' }}>🪙 {def.repay} gold owed</span>
                    <span style={{ fontSize: 15, color: '#C4934A70' }}>⏳ {def.window}-day window</span>
                  </div>
                  <div style={{ fontSize: 14, color: '#C4934A50' }}>
                    Interest: {Math.round((def.repay / def.borrow - 1) * 100)}%
                  </div>
                  <button
                    onClick={() => { playSound('uiClick'); takeLoan(def.tier); }}
                    style={{
                      marginTop: 4, padding: '9px',
                      background: GOLD, border: 'none',
                      borderRadius: 5, color: INK,
                      fontFamily: '"Cinzel", serif', fontWeight: 700, fontSize: 16,
                      cursor: 'pointer',
                    }}
                  >
                    Request Loan
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Active loan — show status card */}
          {activeLoan && !activeLoan.defaulted && (
            <div style={{
              background: '#22113040',
              border: `1px solid ${PARCHMENT}30`,
              borderRadius: 6, padding: '18px',
              display: 'flex', flexDirection: 'column', gap: 12,
            }}>
              <div style={{ fontFamily: '"Cinzel", serif', fontWeight: 700, color: PARCHMENT, fontSize: 18 }}>
                Active Loan — {LOAN_TIER_DEFS.find(d => d.tier === activeLoan.tier)?.label}
              </div>
              <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: 14, color: '#C4934A60', marginBottom: 2 }}>BORROWED</div>
                  <div style={{ fontSize: 20, color: '#4ACC7A', fontWeight: 700 }}>🪙 {activeLoan.borrowedAmount}</div>
                </div>
                <div>
                  <div style={{ fontSize: 14, color: '#C4934A60', marginBottom: 2 }}>REPAY</div>
                  <div style={{ fontSize: 20, color: '#CC6644', fontWeight: 700 }}>🪙 {activeLoan.repayAmount}</div>
                </div>
                <div>
                  <div style={{ fontSize: 14, color: '#C4934A60', marginBottom: 2 }}>DAYS REMAINING</div>
                  {(() => {
                    const daysLeft = activeLoan.dueByDay - day;
                    const urgent = daysLeft <= 3;
                    return (
                      <div style={{
                        fontSize: 20, fontWeight: 700,
                        color: urgent ? '#FF4444' : '#E8D5A0',
                      }}>
                        {daysLeft > 0 ? `${daysLeft} day${daysLeft !== 1 ? 's' : ''}` : '⚠ Overdue'}
                      </div>
                    );
                  })()}
                </div>
                <div>
                  <div style={{ fontSize: 14, color: '#C4934A60', marginBottom: 2 }}>DUE BY</div>
                  <div style={{ fontSize: 20, color: '#E8D5A0' }}>Day {activeLoan.dueByDay}</div>
                </div>
              </div>
              {(() => {
                const canRepay = gold >= activeLoan.repayAmount;
                const shortfall = activeLoan.repayAmount - gold;
                return (
                  <div>
                    <button
                      onClick={() => { playSound('coinLoss'); repayLoan(); }}
                      disabled={!canRepay}
                      style={{
                        padding: '10px 24px',
                        background: canRepay ? PARCHMENT : '#2C181040',
                        border: `1px solid ${canRepay ? INK : PARCHMENT + '20'}`,
                        borderRadius: 5, color: canRepay ? INK : '#C4934A40',
                        fontFamily: '"Cinzel", serif', fontWeight: 700, fontSize: 17,
                        cursor: canRepay ? 'pointer' : 'not-allowed',
                      }}
                    >
                      {canRepay ? `Repay Now (${activeLoan.repayAmount}g)` : `Insufficient Gold — ${shortfall}g short`}
                    </button>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Defaulted loan notice */}
          {activeLoan?.defaulted && (
            <div style={{
              background: '#3A080840',
              border: '1px solid #CC222240',
              borderRadius: 6, padding: '16px',
              fontSize: 17, color: '#CC8888', lineHeight: 1.6,
            }}>
              <strong style={{ color: '#FF6666', fontFamily: '"Cinzel", serif' }}>Default on Record.</strong>{' '}
              This loan of {activeLoan.repayAmount}g was not repaid by Day {activeLoan.dueByDay}. Barrax has filed a formal complaint.
              The debt is no longer collectible, but the damage to your reputation stands.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

