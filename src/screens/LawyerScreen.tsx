import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
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

const LEGAL_PROTECTION_COST = 30;

export default function LawyerScreen() {
  const {
    dragon, gold, dread, day,
    playerPropertyIds, rivals,
    setActiveScreen, applyLegalProtection, logEvent,
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
        logEvent(`Filed legal protective clauses. −${LEGAL_PROTECTION_COST} gold. Sell multiplier +0.2 for 10 days.`);
        setFeedbackMsg(`Clauses filed. −${LEGAL_PROTECTION_COST} gold. Auction sell prices +20% for 10 days.`);
      }
    }

    const next = getDialogueLine('arcaneLawyer', nextNode, buildCtx(), 'elf');
    setResolved(next);
    setCurrentNode(nextNode);
  };

  const isFarewell = currentNode === 'farewell' || resolved.playerOptions.length === 0;
  const canAfford = gold >= LEGAL_PROTECTION_COST;

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
