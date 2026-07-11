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

type GiftTier = 'trinket' | 'curated' | 'legendary';
type DreadBracket = 'high' | 'mid' | 'low';

const GIFT_TIERS: Array<{ tier: GiftTier; cost: number; baseGain: number; label: string; flavour: string }> = [
  { tier: 'trinket',   cost: 20,  baseGain: 8,  label: 'Trinket',             flavour: 'A minor curio from your hoard' },
  { tier: 'curated',   cost: 50,  baseGain: 18, label: 'Curated Hoard Item',  flavour: 'A respectable piece' },
  { tier: 'legendary', cost: 120, baseGain: 30, label: 'Legendary Offering',  flavour: 'A sacrifice of genuine treasure' },
];

function getGiftFlavourLine(rivalName: string, breedId: string, tier: GiftTier, bracket: DreadBracket): string {
  const lines: Partial<Record<string, Record<GiftTier, Record<DreadBracket, string>>>> = {
    fire: {
      trinket: {
        high: `Scorch barely glances at the trinket before pocketing it with one claw. "You know the tribute rate," he rumbles. "But this\u2026 is acceptable."`,
        mid:  `Scorch sniffs the trinket. Turns it over. Sets it down. Then picks it up again. "Fine," he says.`,
        low:  `Scorch holds the trinket up like evidence at a trial. "You flew here to give me this." It is not a question. He takes it anyway.`,
      },
      curated: {
        high: `Scorch turns the piece over in one claw, and for once does not immediately breathe fire on anything. "Acceptable provenance," he concedes.`,
        mid:  `Scorch accepts the hoard item without ceremony. "Don't expect applause," he says. He does not give any.`,
        low:  `Scorch examines the piece at arm's length. "You really are trying, aren't you," he says. It lands worse than insult. He accepts it anyway.`,
      },
      legendary: {
        high: `Scorch examines the offering with one claw. A pause. "Adequate," he says. For Scorch, this is a standing ovation.`,
        mid:  `Scorch receives the legendary offering in silence. He turns it over once, nods once. That is all. That is everything.`,
        low:  `Scorch stares at the legendary offering for a long time. "Is this meant seriously?" he asks. He takes it. You are still embarrassed.`,
      },
    },
    ice: {
      trinket: {
        high: `Frostbite accepts the trinket with a precision grip, as though cataloguing it. "Noted," she says. You count this as warmth.`,
        mid:  `Frostbite regards the trinket. "A gesture," she observes, and stores it somewhere. "Relationships are maintained through gestures," she adds.`,
        low:  `Frostbite holds up the trinket. Looks at you. Looks at the trinket. Sets it down. "Is this a joke?" Their relationship score improves anyway, if only out of pity.`,
      },
      curated: {
        high: `Frostbite inspects the piece in silence, turning it once. "You have marginally acceptable taste," she says. She keeps it.`,
        mid:  `Frostbite accepts the hoard piece with the expression of someone filing paperwork. "Serviceable," she says.`,
        low:  `Frostbite looks at the piece, then at you, then back. "You came in person," she notes. "Interesting choice." She accepts it. You feel judged.`,
      },
      legendary: {
        high: `Frostbite inspects each facet with glacial precision. After a long silence: "This will do." High praise.`,
        mid:  `Frostbite receives the legendary offering with a slow nod. "A serious gesture," she says, and means it.`,
        low:  `Frostbite stares at the offering. "The piece is fine," she says. "The context is not." She takes it anyway.`,
      },
    },
    dark: {
      trinket: {
        high: `Shadowmere plucks the trinket from the air before you finish presenting it. "Insurance," she murmurs.`,
        mid:  `Shadowmere materialises, glances at the trinket, and nods. "Every relationship has a price," she says. "You've started paying."`,
        low:  `Shadowmere peers at the trinket from the shadows. "Brave," she says, in a tone that doesn't mean brave. She takes it.`,
      },
      curated: {
        high: `Shadowmere melts into the shadows — then reappears with the gift already gone. "I'll remember this," she says. That could mean anything.`,
        mid:  `Shadowmere accepts the piece with professional detachment. "Not bad," she says, which from her is practically a feast in your honour.`,
        low:  `Shadowmere holds the piece at arm's length. "You have a charming sense of your own importance," she says. She takes it anyway. Progress.`,
      },
      legendary: {
        high: `Shadowmere melts into the shadows briefly — then reappears with the gift already gone. "Insurance," she murmurs. There is almost a smile.`,
        mid:  `Shadowmere receives the legendary offering without expression. "You're playing a longer game than I thought," she says. She disappears. The offering goes with her.`,
        low:  `Shadowmere regards the legendary offering, then you. "A generous bribe from an unconvincing source," she says. "Still a bribe, though." She takes it.`,
      },
    },
  };
  const rivalLines = lines[breedId];
  if (rivalLines?.[tier]?.[bracket]) return rivalLines[tier][bracket];
  if (bracket === 'high' && tier === 'legendary') return `${rivalName} examines the offering with one claw. A pause. "Adequate," they say. For ${rivalName}, this is a standing ovation.`;
  if (bracket === 'low'  && tier === 'trinket')   return `${rivalName} holds up the trinket. Looks at you. Looks at the trinket. Sets it down. "Is this a joke?" Their relationship score improves anyway, if only out of pity.`;
  if (bracket === 'high') return `${rivalName} nods slowly. "A reasonable gesture from a dragon of your standing." The relationship warms slightly.`;
  if (bracket === 'low')  return `${rivalName} stares at the gift for a long moment. "Is this\u2026 meant seriously?" They take it anyway, if only out of pity.`;
  return `${rivalName} receives the offering without comment. They don't refuse it, which passes for gratitude.`;
}

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
    rivals, gold, dragon, dread, day, timeOfDay, afternoonActionUsed,
    updateRivalRelationship, buyFromRival, buyBackKobold,
    formAlliance, setActiveScreen, logEvent, sendRivalGift,
  } = useGameStore();

  const [selected, setSelected] = useState<Rival | null>(null);
  const [phase, setPhase] = useState<Phase>('select');
  const [resolved, setResolved] = useState<ResolvedDialogue | null>(null);
  const [targetPropId, setTargetPropId] = useState<string | null>(null);
  const [contestType, setContestType] = useState<ContestType>('reputation');
  const [rollingDisplay, setRollingDisplay] = useState(0);
  const [rollResult, setRollResult] = useState<{ roll: number; dreadMod: number; success: boolean; type: ContestType } | null>(null);
  const [giftResult, setGiftResult] = useState<{ quote: string; gain: number; cost: number } | null>(null);

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
    setGiftResult(null);
    logEvent(`Visited ${rival.name}. Opening negotiations.`, 'rival');
  };

  const handleSendGift = (tier: GiftTier) => {
    if (!currentRival) return;
    const rival = rivals.find(r => r.id === currentRival.id) ?? currentRival;
    const cfg = GIFT_TIERS.find(g => g.tier === tier)!;
    let gain: number = cfg.baseGain;
    if (dread >= 60) gain += 5;
    else if (dread < 30) gain = Math.floor(gain / 2);
    const bracket: DreadBracket = dread >= 60 ? 'high' : dread >= 30 ? 'mid' : 'low';
    const quote = getGiftFlavourLine(rival.name, rival.breedId, tier, bracket);
    sendRivalGift(rival.id, tier);
    setGiftResult({ quote, gain, cost: cfg.cost });
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
        logEvent(`Purchased ${prop?.name ?? propId} from ${liveRival.name} for ${price} gold.`, 'property');
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
            logEvent(`Reputation contest vs ${rival.name}: won! Dread asserted. Rival relationship −5.`, 'rival');
          } else {
            if (rival.propertyIds.length > 0) {
              const propId = targetPropId ?? rival.propertyIds[0];
              const prop = allProperties.find(p => p.id === propId);
              buyFromRival(rival.id, propId, prop?.goldPrice ?? 0);
              logEvent(`Dread contest vs ${rival.name}: seized ${prop?.name ?? propId} at market price!`, 'rival');
            }
          }
        } else {
          updateRivalRelationship(rival.id, type === 'dread' ? -15 : -8);
          logEvent(`Contest vs ${rival.name} failed. Relationship damaged.`, 'rival');
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
                onClick={() => { setSelected(null); setPhase('select'); setResolved(null); setGiftResult(null); }}
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
                {giftResult ? (
                  <div>
                    <div style={{ fontStyle: 'italic', marginBottom: 10 }}>"{giftResult.quote}"</div>
                    <div style={{ fontStyle: 'normal', fontSize: 16, color: '#4ACC7A' }}>
                      Relationship +{giftResult.gain} &nbsp;·&nbsp; <span style={{ color: '#CC6644' }}>−{giftResult.cost} gold</span>
                    </div>
                  </div>
                ) : phase === 'rolling' ? (
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
                        logEvent(`Bought back ${kobold.name} from ${currentRival.name} for ${price} gold.`, 'kobold');
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

              {/* ── Send a Gift ── */}
              {phase === 'dialogue' && !isFarewell && currentRival && (
                <div style={{
                  marginTop: 20, borderTop: `1px solid ${PARCHMENT}20`,
                  paddingTop: 16,
                }}>
                  <div style={{ fontFamily: '"Cinzel", serif', fontSize: 15, color: PARCHMENT, marginBottom: 10, letterSpacing: '0.04em' }}>
                    🎁 Send a Gift
                  </div>
                  {(() => {
                    const liveRival = rivals.find(r => r.id === currentRival.id) ?? currentRival;
                    const onCooldown = liveRival.lastGiftDay !== undefined && day - liveRival.lastGiftDay < 5;
                    const actionBlocked = timeOfDay !== 'afternoon' || afternoonActionUsed;
                    const alreadySent = giftResult !== null;
                    if (alreadySent) return null;
                    if (onCooldown) {
                      return (
                        <div style={{ fontSize: 16, color: '#C4934A70', fontStyle: 'italic' }}>
                          {liveRival.name} has received a gift recently. Give it a few days.
                        </div>
                      );
                    }
                    if (actionBlocked) {
                      return (
                        <div style={{ fontSize: 16, color: '#C4934A70', fontStyle: 'italic' }}>
                          Gifts may only be presented during the afternoon. Your schedule is otherwise occupied.
                        </div>
                      );
                    }
                    return (
                      <div>
                        {dread < 30 && (
                          <div style={{ fontSize: 15, color: '#CC8844', marginBottom: 10 }}>
                            ⚠ Your low dread may undermine the gesture.
                          </div>
                        )}
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          {GIFT_TIERS.map(({ tier, cost, baseGain, label, flavour }) => {
                            let estGain: number = baseGain;
                            if (dread >= 60) estGain += 5;
                            else if (dread < 30) estGain = Math.floor(estGain / 2);
                            const cantAfford = gold < cost;
                            const wouldCap = liveRival.relationship >= 100;
                            const disabled = cantAfford || wouldCap;
                            return (
                              <button
                                key={tier}
                                onClick={() => !disabled && handleSendGift(tier)}
                                disabled={disabled}
                                style={{
                                  flex: '1 1 0', minWidth: 90,
                                  padding: '10px 8px', borderRadius: 6, textAlign: 'center',
                                  background: disabled ? '#2C181030' : `${GOLD}12`,
                                  border: `1px solid ${disabled ? PARCHMENT + '15' : GOLD + '35'}`,
                                  cursor: disabled ? 'not-allowed' : 'pointer',
                                  color: disabled ? '#C4934A30' : '#E8D5A0',
                                  fontFamily: '"Crimson Text", serif',
                                }}
                              >
                                <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 2, color: disabled ? '#C4934A30' : GOLD }}>
                                  {label}
                                </div>
                                <div style={{ fontSize: 14, color: disabled ? '#C4934A20' : '#C4934A80', marginBottom: 4 }}>
                                  {flavour}
                                </div>
                                <div style={{ fontSize: 14 }}>
                                  <span style={{ color: disabled ? '#C4934A20' : '#CC6644' }}>🪙 {cost}g</span>
                                  {' · '}
                                  <span style={{ color: disabled ? '#C4934A20' : '#4ACC7A' }}>+{estGain} rel</span>
                                </div>
                                {cantAfford && (
                                  <div style={{ fontSize: 12, color: '#CC4444', marginTop: 3 }}>Insufficient gold</div>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}
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
