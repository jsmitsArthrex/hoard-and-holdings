import { useState } from 'react';
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

export default function InnkeeperScreen() {
  const {
    dragon, gold, dread, day,
    playerPropertyIds, gameSettings, activeContracts,
    setActiveScreen, logEvent,
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

        {/* Motel status banner */}
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
          {/* Portrait */}
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
      </div>
    </div>
  );
}
