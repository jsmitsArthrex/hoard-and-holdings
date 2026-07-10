import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import NPCPortrait from '../components/npcs/NPCPortrait';
import { useGameStore } from '../store/gameStore';
import { dragonBreeds } from '../data/dragonBreeds';
import { districts } from '../data/districts';
import { getDialogueLine } from '../dialogue/dialogueEngine';
import type { ResolvedDialogue, DialogueContext } from '../dialogue';
import { playSound } from '../audio/audioEngine';
import type { Rival } from '../types';

const INK = '#2C1810';
const PARCHMENT = '#C4934A';
const GOLD = '#C9A227';

const RIVAL_ICONS: Record<string, string> = {
  fire: '🔥', ice: '❄️', dragon: '🐲', poison: '☠️',
  electric: '⚡', dark: '🌑', ghost: '👻', steel: '⚙️',
};

type Phase = 'select' | 'dialogue' | 'rolling' | 'roll-result';
type ContestType = 'reputation' | 'dread';

export default function RivalScreen() {
  const {
    rivals, gold, dragon, dread,
    updateRivalRelationship, buyFromRival, buyBackKobold,
    formAlliance, setActiveScreen, logEvent,
  } = useGameStore();

  const [selected, setSelected] = useState<Rival | null>(null);
  const [phase, setPhase] = useState<Phase>('select');
  const [resolved, setResolved] = useState<ResolvedDialogue | null>(null);
  const [targetPropId, setTargetPropId] = useState<string | null>(null);
  const [contestType, setContestType] = useState<ContestType>('reputation');
  const [rollingDisplay, setRollingDisplay] = useState(0);
  const [rollResult, setRollResult] = useState<{ roll: number; dreadMod: number; success: boolean; type: ContestType } | null>(null);

  const allProperties = districts.flatMap(d => d.properties);

  const buildCtx = (rival: Rival): DialogueContext => {
    const focusProp = targetPropId
      ? allProperties.find(p => p.id === targetPropId)
      : allProperties.find(p => rival.propertyIds.includes(p.id));
    return {
      playerName: dragon?.name ?? 'Dragon',
      dragonBreed: dragonBreeds.find(b => b.id === dragon?.breedId)?.breed ?? 'Dragon',
      gold,
      dreadRating: dread,
      currentDay: dragon?.age ?? 1,
      dragonAge: dragon?.age ?? 1,
      rivalName: rival.name,
      propertyName: focusProp?.name ?? 'your territory',
      price: focusProp ? Math.round(focusProp.goldPrice * 1.2) : undefined,
      koboldName: rival.poachedKobold?.name ?? 'your kobold',
      relationshipScore: rival.relationship,
    };
  };

  const selectRival = (rival: Rival) => {
    const firstPropId = rival.propertyIds[0] ?? null;
    setTargetPropId(firstPropId);
    setSelected(rival);
    const ctx = buildCtx({ ...rival });
    const initial = getDialogueLine('rivalBodyguard', 'greeting', ctx, rival.breedId);
    setResolved(initial);
    setPhase('dialogue');
    setRollResult(null);
    logEvent(`Visited ${rival.name}. Opening negotiations.`);
  };

  const handleOption = (nextNode: string, effect?: string) => {
    if (!selected) return;
    playSound('pageFlip');

    const liveRival = rivals.find(r => r.id === selected.id) ?? selected;

    if (effect === 'buy_rival_property') {
      const propId = targetPropId ?? liveRival.propertyIds[0];
      const prop = allProperties.find(p => p.id === propId);
      const price = prop ? Math.round(prop.goldPrice * 1.2) : 0;
      if (propId && gold >= price) {
        buyFromRival(liveRival.id, propId, price);
        logEvent(`Purchased ${prop?.name ?? propId} from ${liveRival.name} for ${price} gold.`);
        setTargetPropId(liveRival.propertyIds.find(id => id !== propId) ?? null);
      }
    } else if (effect === 'form_alliance') {
      formAlliance(liveRival.id);
    } else if (effect === 'reputation_contest') {
      startContest('reputation', liveRival);
      return;
    } else if (effect === 'dread_contest') {
      startContest('dread', liveRival);
      return;
    }

    const updatedRival = rivals.find(r => r.id === selected.id) ?? liveRival;
    const ctx = buildCtx(updatedRival);
    const next = getDialogueLine('rivalBodyguard', nextNode, ctx, updatedRival.breedId);
    setResolved(next);
  };

  const startContest = (type: ContestType, rival: Rival) => {
    setContestType(type);
    setPhase('rolling');
    let ticks = 0;
    const interval = setInterval(() => {
      setRollingDisplay(Math.floor(Math.random() * 20) + 1);
      ticks++;
      if (ticks >= 20) {
        clearInterval(interval);
        const finalRoll = Math.floor(Math.random() * 20) + 1;
        const dreadMod = Math.round(dread / 20);
        const total = finalRoll + dreadMod;
        const dc = type === 'dread' ? 17 : 12;
        const success = total >= dc;

        setRollingDisplay(finalRoll);
        setRollResult({ roll: finalRoll, dreadMod, success, type });
        setPhase('roll-result');

        if (success) {
          if (type === 'reputation') {
            updateRivalRelationship(rival.id, -5);
            logEvent(`Reputation contest vs ${rival.name}: won! Dread asserted. Rival relationship −5.`);
          } else {
            if (rival.propertyIds.length > 0) {
              const propId = targetPropId ?? rival.propertyIds[0];
              const prop = allProperties.find(p => p.id === propId);
              buyFromRival(rival.id, propId, prop?.goldPrice ?? 0);
              logEvent(`Dread contest vs ${rival.name}: seized ${prop?.name ?? propId} at market price!`);
            }
          }
        } else {
          updateRivalRelationship(rival.id, type === 'dread' ? -15 : -8);
          logEvent(`Contest vs ${rival.name} failed. Relationship damaged.`);
        }
      }
    }, 60);
  };

  const resumeDialogue = () => {
    if (!selected) return;
    const liveRival = rivals.find(r => r.id === selected.id) ?? selected;
    const ctx = buildCtx(liveRival);
    const next = getDialogueLine('rivalBodyguard', 'farewell', ctx, liveRival.breedId);
    setResolved(next);
    setPhase('dialogue');
  };

  const currentRival = selected ? rivals.find(r => r.id === selected.id) ?? selected : null;
  const isFarewell = resolved && resolved.playerOptions.length === 0;

  return (
    <div style={{ height: '100%', overflowY: 'auto', fontFamily: '"Crimson Text", Georgia, serif', background: '#0D0500' }}>
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '20px' }}>

        <button
          onClick={() => setActiveScreen('hub')}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'none', border: 'none', color: PARCHMENT, cursor: 'pointer',
            fontFamily: '"Cinzel", serif', fontSize: 17, marginBottom: 16, padding: 0,
          }}
        >
          <ArrowLeft size={19} /> Return to Lair
        </button>

        <h2 style={{ fontFamily: '"Cinzel", serif', color: PARCHMENT, fontSize: 22, fontWeight: 700, marginBottom: 20 }}>
          🐉 Visit a Rival Dragon
        </h2>

        {/* ── Rival select ── */}
        {phase === 'select' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {rivals.map(rival => {
              const breed = dragonBreeds.find(b => b.id === rival.breedId);
              return (
                <button
                  key={rival.id}
                  onClick={() => selectRival(rival)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 16, padding: '16px',
                    background: '#2C181040', border: `2px solid ${PARCHMENT}25`,
                    borderRadius: 8, cursor: 'pointer', textAlign: 'left',
                  }}
                >
                  <div style={{
                    width: 56, height: 56, borderRadius: '50%',
                    background: '#1A0A2E', border: `2px solid ${PARCHMENT}40`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 28, flexShrink: 0,
                  }}>
                    {RIVAL_ICONS[rival.breedId] ?? '🐉'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: '"Cinzel", serif', fontWeight: 700, color: PARCHMENT, fontSize: 21, marginBottom: 2 }}>
                      {rival.name}
                    </div>
                    <div style={{ fontSize: 18, color: '#C4934A70', marginBottom: 6 }}>
                      {breed?.breed ?? 'Unknown'} · {rival.propertyIds.length} properties owned
                    </div>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      <RelBar label="Relationship" value={rival.relationship} />
                      {rival.poachedKobold && (
                        <span style={{ fontSize: 16, color: '#CC8844', background: '#CC884420', padding: '2px 6px', borderRadius: 4 }}>
                          ⚠️ Has your kobold
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ color: PARCHMENT, fontSize: 20 }}>›</div>
                </button>
              );
            })}
          </div>
        )}

        {/* ── Dialogue / rolling / result ── */}
        {currentRival && phase !== 'select' && (
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            {/* Portrait column */}
            <div style={{ width: 200, flexShrink: 0 }}>
              <NPCPortrait role="rival-dragon" size={200} breedId={currentRival.breedId} />
              <div style={{ fontFamily: '"Cinzel", serif', fontWeight: 700, color: PARCHMENT, fontSize: 19, marginTop: 10 }}>
                {currentRival.name}
              </div>
              <div style={{ fontSize: 16, color: '#C4934A60' }}>
                {dragonBreeds.find(b => b.id === currentRival.breedId)?.breed ?? 'Dragon'}
              </div>
              <div style={{ marginTop: 8 }}>
                <RelBar label="Relationship" value={currentRival.relationship} />
              </div>
              <div style={{ fontSize: 15, color: '#C4934A50', marginTop: 4 }}>
                {currentRival.propertyIds.length} properties
              </div>

              {/* Property focus picker */}
              {currentRival.propertyIds.length > 1 && phase === 'dialogue' && (
                <div style={{ marginTop: 12 }}>
                  <div style={{ fontSize: 14, color: '#C4934A50', marginBottom: 4 }}>Negotiating for:</div>
                  {currentRival.propertyIds.slice(0, 4).map(pid => {
                    const prop = allProperties.find(p => p.id === pid);
                    if (!prop) return null;
                    return (
                      <button
                        key={pid}
                        onClick={() => setTargetPropId(pid)}
                        style={{
                          display: 'block', width: '100%', textAlign: 'left',
                          padding: '4px 6px', marginBottom: 3, fontSize: 14,
                          background: targetPropId === pid ? `${GOLD}20` : 'transparent',
                          border: `1px solid ${targetPropId === pid ? GOLD + '50' : PARCHMENT + '20'}`,
                          borderRadius: 3, color: targetPropId === pid ? GOLD : '#C4934A60',
                          cursor: 'pointer',
                        }}
                      >
                        {prop.name}
                      </button>
                    );
                  })}
                </div>
              )}

              <button
                onClick={() => { setSelected(null); setPhase('select'); setResolved(null); }}
                style={{
                  marginTop: 14, width: '100%', padding: '6px',
                  background: 'transparent', border: `1px solid ${PARCHMENT}30`,
                  borderRadius: 4, color: '#C4934A60', cursor: 'pointer', fontSize: 16,
                }}
              >
                ← Back to rivals
              </button>
            </div>

            {/* Dialogue panel */}
            <div style={{ flex: 1, minWidth: 280 }}>
              {/* Speech / roll display */}
              <div style={{
                background: '#2C181040', border: `1px solid ${PARCHMENT}30`,
                borderRadius: 6, padding: '14px 16px', marginBottom: 16,
                fontSize: 20, color: '#E8D5A0', lineHeight: 1.65,
                fontStyle: 'italic', minHeight: 80,
              }}>
                {phase === 'rolling' ? (
                  <div style={{ textAlign: 'center', fontSize: 60, fontFamily: '"Cinzel", serif', color: GOLD }}>
                    {rollingDisplay}
                  </div>
                ) : phase === 'roll-result' && rollResult ? (
                  <div>
                    <div style={{ fontStyle: 'normal', fontWeight: 700, fontSize: 20, color: rollResult.success ? '#4ACC7A' : '#CC4444', marginBottom: 8 }}>
                      {rollResult.success ? '✓ Contest Won!' : '✗ Contest Lost!'}
                    </div>
                    <div style={{ fontSize: 17, color: '#C4934A80', fontStyle: 'normal' }}>
                      Roll: {rollResult.roll} + {rollResult.dreadMod} (dread) = {rollResult.roll + rollResult.dreadMod}{' '}
                      vs DC {rollResult.type === 'dread' ? 17 : 12}
                    </div>
                    {rollResult.success && rollResult.type === 'reputation' && (
                      <div style={{ fontSize: 17, color: '#4ACC7A', marginTop: 6 }}>
                        Your dominance is noted. Rival relationship −5.
                      </div>
                    )}
                    {rollResult.success && rollResult.type === 'dread' && (
                      <div style={{ fontSize: 17, color: '#4ACC7A', marginTop: 6 }}>
                        Property seized at market price under your dread.
                      </div>
                    )}
                    {!rollResult.success && (
                      <div style={{ fontSize: 17, color: '#CC4444', marginTop: 6 }}>
                        The gambit failed. Relationship {rollResult.type === 'dread' ? '−15' : '−8'}.
                      </div>
                    )}
                  </div>
                ) : resolved ? (
                  `"${resolved.npcLine}"`
                ) : null}
              </div>

              {/* Options */}
              {phase === 'dialogue' && resolved && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {!isFarewell ? (
                    resolved.playerOptions.map((opt, i) => {
                      const isContest = opt.effect === 'reputation_contest' || opt.effect === 'dread_contest';
                      const isBuy = opt.effect === 'buy_rival_property';
                      const focusProp = targetPropId
                        ? allProperties.find(p => p.id === targetPropId)
                        : allProperties.find(p => currentRival.propertyIds.includes(p.id));
                      const buyPrice = focusProp ? Math.round(focusProp.goldPrice * 1.2) : 0;
                      const cantAfford = isBuy && gold < buyPrice;
                      return (
                        <button
                          key={i}
                          onClick={() => !cantAfford && handleOption(opt.nextNode, opt.effect)}
                          disabled={cantAfford}
                          style={{
                            padding: '10px 14px', textAlign: 'left', width: '100%',
                            background: isContest ? '#8B1A1A20' : i === 0 ? `${GOLD}15` : '#2C181030',
                            border: `1px solid ${isContest ? '#8B1A1A60' : i === 0 ? GOLD + '40' : PARCHMENT + '20'}`,
                            borderRadius: 5,
                            color: cantAfford ? '#C4934A30' : isContest ? '#CC4444' : i === 0 ? GOLD : '#E8D5A0',
                            cursor: cantAfford ? 'not-allowed' : 'pointer',
                            fontSize: 18, fontFamily: '"Crimson Text", serif',
                          }}
                        >
                          {opt.label}
                          {isBuy && focusProp && (
                            <span style={{ fontSize: 15, color: cantAfford ? '#CC4444' : `${GOLD}80`, marginLeft: 8 }}>
                              🪙 {buyPrice}
                            </span>
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

                  {/* Buy back kobold — always shown when available */}
                  {currentRival.poachedKobold && !isFarewell && (
                    <button
                      onClick={() => {
                        const kobold = currentRival.poachedKobold!;
                        const price = kobold.dailyWage * 10;
                        if (gold < price) return;
                        buyBackKobold(currentRival.id);
                        logEvent(`Bought back ${kobold.name} from ${currentRival.name} for ${price} gold.`);
                        const ctx = buildCtx(currentRival);
                        setResolved(getDialogueLine('rivalBodyguard', 'farewell', ctx, currentRival.breedId));
                      }}
                      disabled={gold < (currentRival.poachedKobold.dailyWage * 10)}
                      style={{
                        padding: '10px 14px', textAlign: 'left', width: '100%',
                        background: '#CC882215',
                        border: `1px solid #CC882250`,
                        borderRadius: 5, color: gold >= (currentRival.poachedKobold.dailyWage * 10) ? '#CC8822' : '#C4934A30',
                        cursor: gold >= (currentRival.poachedKobold.dailyWage * 10) ? 'pointer' : 'not-allowed',
                        fontSize: 18, fontFamily: '"Crimson Text", serif',
                      }}
                    >
                      🪨 Buy back {currentRival.poachedKobold.name} — 🪙{currentRival.poachedKobold.dailyWage * 10}
                    </button>
                  )}
                </div>
              )}

              {phase === 'roll-result' && (
                <button
                  onClick={resumeDialogue}
                  style={{
                    padding: '12px 20px', background: PARCHMENT, border: `2px solid ${INK}`,
                    borderRadius: 6, color: INK, cursor: 'pointer',
                    fontFamily: '"Cinzel", serif', fontWeight: 700, fontSize: 18,
                  }}
                >
                  Continue
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function RelBar({ label, value }: { label: string; value: number }) {
  const color = value < 30 ? '#CC4444' : value < 60 ? '#CC8844' : '#4ACC7A';
  return (
    <div>
      <div style={{ fontSize: 16, color: '#C4934A60', marginBottom: 2 }}>{label}: {value}</div>
      <div style={{ height: 5, background: '#2C181060', borderRadius: 3, overflow: 'hidden', width: '100%' }}>
        <div style={{ width: `${value}%`, height: '100%', background: color, borderRadius: 3 }} />
      </div>
    </div>
  );
}
