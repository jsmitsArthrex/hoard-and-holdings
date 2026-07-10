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

export default function BankScreen() {
  const {
    dragon, gold, dread, day,
    activeContracts,
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
      </div>
    </div>
  );
}

