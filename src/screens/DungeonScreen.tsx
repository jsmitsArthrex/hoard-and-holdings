import { useState, useEffect, useRef } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { playSound } from '../audio/audioEngine';
import { heroTiers } from '../data/heroParties';
import { dragonBreeds } from '../data/dragonBreeds';
import { getModifier } from '../engine/statusEffects';
import AdventurerPortrait, { adventurerClassLabel } from '../components/npcs/AdventurerPortrait';
import type { HeroMonster } from '../data/heroParties';
import type { HoardItem } from '../types/index';

const INK = '#2C1810';
const PARCHMENT = '#C4934A';
const GOLD = '#C9A227';
const DANGER = '#8B1A1A';
const GREEN = '#4ACC7A';

function d(sides: number) { return Math.floor(Math.random() * sides) + 1; }
function statMod(stat: number) { return Math.floor((stat - 10) / 2); }
function clamp(n: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, n)); }

interface LegendaryItemDef { name: string; flavorText: string; }

const LEGENDARY_ITEMS: LegendaryItemDef[] = [
  { name: 'The Obsidian Chalice of Nezznar', flavorText: 'Carved from a single obsidian shard, it whispers dark prayers at midnight.' },
  { name: "Halaster's Annotated Grimoire", flavorText: 'Margin notes in three dead languages. Some pages seem to rewrite themselves.' },
  { name: 'The Sunbreaker Crown', flavorText: 'Said to have snuffed out the last solar eclipse. Warm to the touch.' },
  { name: 'Amulet of the Undying Serpent', flavorText: 'It coils and uncoils on its own. A heartbeat pulses within the gem.' },
  { name: "Eternity's Edge (Shattered Fragment)", flavorText: 'Only a shard, yet it still cuts the fabric of time. Handle with great care.' },
  { name: 'The Gilded Tome of Forbidden Wishes', flavorText: 'Three wishes remain. The previous owner used theirs poorly.' },
];

const DUNGEON_LOOT_NAMES = [
  'Tarnished Silver Reliquary', "Worn Adventurer's Pack", "Sealed Alchemist's Vial",
  'Ancient Elven Brooch', 'Corroded Bronze Shield', 'Gilded Bone Fragment',
  "Scholar's Brass Compass", 'Cracked Obsidian Mirror', 'Enchanted Iron Gauntlet',
  'Faded Battle Standard', 'Dusty Spellbook Pages', 'Runic Stone Tablet',
];

interface DungeonTierDef {
  id: 'shallow' | 'vault' | 'sanctum';
  label: string;
  description: string;
  heroTierIdx: number;
  goldRange: [number, number];
  itemValueRange: [number, number];
  legendary: boolean;
  dreadBonus: number;
  lockUntilAgeTier?: number;
  icon: string;
}

const DUNGEON_TIERS: DungeonTierDef[] = [
  {
    id: 'shallow',
    label: 'Shallow Ruin',
    description: 'Crumbling walls and scavenging beasts. Low danger, modest reward.',
    heroTierIdx: 0,
    goldRange: [20, 50],
    itemValueRange: [40, 80],
    legendary: false,
    dreadBonus: 0,
    icon: '🏚️',
  },
  {
    id: 'vault',
    label: 'Ancient Vault',
    description: 'Sealed for centuries. Traps, constructs, and forgotten guardians.',
    heroTierIdx: 1,
    goldRange: [60, 130],
    itemValueRange: [80, 160],
    legendary: false,
    dreadBonus: 0,
    icon: '🏛️',
  },
  {
    id: 'sanctum',
    label: 'Forbidden Sanctum',
    description: 'A place mortals were never meant to enter. Legendary relics await the worthy.',
    heroTierIdx: 2,
    goldRange: [150, 300],
    itemValueRange: [200, 400],
    legendary: true,
    dreadBonus: 3,
    lockUntilAgeTier: 3,
    icon: '⛩️',
  },
];

function generateParty(heroTierIdx: number): HeroMonster[] {
  const tier = heroTiers[heroTierIdx];
  const count = 2 + Math.floor(Math.random() * 2);
  const shuffled = [...tier.representatives].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

type DungeonPhase = 'tier-select' | 'preview' | 'fighting' | 'outcome';
interface LogEntry { text: string; color?: string; }

export default function DungeonScreen() {
  const {
    dragon, addGold, addHoardItem, addDread, logEvent,
    setActiveScreen, statusEffects, dragonCurrentHP, updateDragonHP,
  } = useGameStore();

  const ageTier = dragon?.ageTier ?? 1;
  const breed = dragonBreeds.find(b => b.id === (dragon?.breedId ?? 'fire'));
  const attackMod = (breed ? Math.round((breed.baseStats.attack - 70) / 10) : 0)
    + Math.round(getModifier(statusEffects, 'combatBonus'));
  const dragonAC = 12 + ageTier * 2 + (breed ? Math.round((breed.baseStats.defense - 70) / 10) : 0);
  const dragonMaxHP = breed ? Math.round(breed.baseStats.hp * 1.5 + ageTier * 20) : 100;
  const persistedHP = dragonCurrentHP ?? dragonMaxHP;

  const [selectedTier, setSelectedTier] = useState<DungeonTierDef | null>(null);
  const [party, setParty] = useState<HeroMonster[]>([]);
  const [goldReward, setGoldReward] = useState(0);
  const [heroHPs, setHeroHPs] = useState<number[]>([]);
  const [dragonHP, setDragonHP] = useState(persistedHP);
  const [phase, setPhase] = useState<DungeonPhase>('tier-select');
  const [round, setRound] = useState(1);
  const [breathUsedOnRound, setBreathUsedOnRound] = useState(-10);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [win, setWin] = useState(false);
  const [busy, setBusy] = useState(false);
  const [goldLost, setGoldLost] = useState(0);
  const [healAmount, setHealAmount] = useState(0);
  const [lootItem, setLootItem] = useState<HoardItem | null>(null);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [log]);

  function selectTier(tier: DungeonTierDef) {
    const newParty = generateParty(tier.heroTierIdx);
    const [gMin, gMax] = tier.goldRange;
    const gold = gMin + Math.floor(Math.random() * (gMax - gMin + 1));
    setSelectedTier(tier);
    setParty(newParty);
    setGoldReward(gold);
    setPhase('preview');
  }

  function startCombat() {
    setHeroHPs(party.map(h => h.hp));
    setDragonHP(persistedHP);
    setPhase('fighting');
    setLog([{ text: `🗺️ Round 1 — ${party.length} guardian${party.length > 1 ? 's' : ''} emerge from the darkness!`, color: PARCHMENT }]);
  }

  function finishCombat(won: boolean, finalHP: number) {
    if (!selectedTier) return;
    setWin(won);
    setPhase('outcome');

    if (won) {
      playSound('coinPickup');
      addGold(goldReward);

      let item: HoardItem;
      if (selectedTier.legendary) {
        const picked = LEGENDARY_ITEMS[Math.floor(Math.random() * LEGENDARY_ITEMS.length)];
        const [ivMin, ivMax] = selectedTier.itemValueRange;
        const baseValue = ivMin + Math.floor(Math.random() * (ivMax - ivMin + 1));
        item = { id: `dungeon-loot-${Date.now()}`, name: picked.name, baseValue, lootedOnDay: dragon?.age ?? 1, legendary: true };
      } else {
        const [ivMin, ivMax] = selectedTier.itemValueRange;
        const baseValue = ivMin + Math.floor(Math.random() * (ivMax - ivMin + 1));
        const name = DUNGEON_LOOT_NAMES[Math.floor(Math.random() * DUNGEON_LOOT_NAMES.length)];
        item = { id: `dungeon-loot-${Date.now()}`, name, baseValue, lootedOnDay: dragon?.age ?? 1 };
      }

      setLootItem(item);
      addHoardItem(item);

      if (selectedTier.dreadBonus > 0) {
        addDread(selectedTier.dreadBonus);
      }

      const regenAmt = Math.floor((dragonMaxHP - finalHP) * 0.4);
      updateDragonHP(Math.min(dragonMaxHP, finalHP + regenAmt));
      setHealAmount(regenAmt);
      logEvent(`Plundered the ${selectedTier.label}! Claimed ${item.name} and ${goldReward} gold.`, 'combat');
    } else {
      playSound('coinLoss');
      const penalty = 30 + Math.floor(Math.random() * 51);
      setGoldLost(penalty);
      addGold(-penalty);
      const restoredHP = Math.floor(dragonMaxHP * 0.5);
      updateDragonHP(restoredHP);
      setHealAmount(restoredHP);
      logEvent(`Driven back from the ${selectedTier.label}! Lost ${penalty} gold retreating.`, 'combat');
    }
  }

  function doAction(action: 'claw' | 'breath' | 'tail' | 'intimidate') {
    if (busy || !selectedTier) return;
    setBusy(true);
    playSound('diceRoll');

    const newHPs = [...heroHPs];
    const entries: LogEntry[] = [{ text: `— Round ${round} —`, color: GOLD }];

    if (action === 'claw') {
      const targetIdx = newHPs.reduce((best, hp, i) => hp > 0 && (best === -1 || hp < newHPs[best]) ? i : best, -1);
      if (targetIdx >= 0) {
        const hero = party[targetIdx];
        const roll = d(20) + attackMod;
        if (roll >= hero.ac) {
          const dmg = d(10) + Math.max(0, attackMod) + ageTier;
          newHPs[targetIdx] = Math.max(0, newHPs[targetIdx] - dmg);
          entries.push({ text: `🐾 Claw Strike hits ${hero.name} for ${dmg} damage! (${roll} vs AC ${hero.ac})`, color: GREEN });
        } else {
          entries.push({ text: `🐾 Claw Strike misses ${hero.name}. (${roll} vs AC ${hero.ac})`, color: '#C4934A70' });
        }
      }
    } else if (action === 'breath') {
      const dmg = d(6) * ageTier + d(6);
      const dc = 13 + ageTier;
      newHPs.forEach((hp, i) => {
        if (hp <= 0) return;
        const saveRoll = d(20) + statMod(party[i].dex);
        newHPs[i] = Math.max(0, hp - (saveRoll >= dc ? Math.floor(dmg / 2) : dmg));
      });
      entries.push({ text: `🔥 Breath Weapon scorches ALL for up to ${dmg} fire! (DC ${dc} DEX save)`, color: '#FF6633' });
      setBreathUsedOnRound(round);
    } else if (action === 'tail') {
      const dmg = d(6) + ageTier;
      newHPs.forEach((hp, i) => { if (hp > 0) newHPs[i] = Math.max(0, hp - dmg); });
      entries.push({ text: `🌀 Tail Sweep smashes ALL for ${dmg} damage!`, color: '#8A7ACC' });
    } else {
      let fled = 0;
      newHPs.forEach((hp, i) => {
        if (hp <= 0 || hp > party[i].hp * 0.4) return;
        if (Math.random() < 0.6) { newHPs[i] = 0; fled++; }
      });
      entries.push(fled > 0
        ? { text: `😱 Intimidating Roar! ${fled} weakened guardian(s) flee in terror!`, color: GREEN }
        : { text: `😱 Your roar echoes... the guardians grit their teeth and hold.`, color: '#C4934A70' }
      );
    }

    setHeroHPs(newHPs);

    if (newHPs.every(hp => hp <= 0)) {
      entries.push({ text: '🏆 All guardians defeated! The ruin is yours to plunder.', color: GREEN });
      setLog(prev => [...prev, ...entries]);
      setTimeout(() => { setBusy(false); finishCombat(true, dragonHP); }, 400);
      return;
    }

    let curDragonHP = dragonHP;
    newHPs.forEach((hp, i) => {
      if (hp <= 0) return;
      const hero = party[i];
      const atkRoll = d(20) + statMod(Math.max(hero.str, hero.dex));
      if (atkRoll >= dragonAC) {
        const dmg = Math.max(1, d(8) + statMod(Math.max(hero.str, hero.dex)));
        curDragonHP = Math.max(0, curDragonHP - dmg);
        entries.push({ text: `  ↩ ${hero.name} strikes for ${dmg}! (${atkRoll} vs your AC ${dragonAC})`, color: '#CC4444' });
      } else {
        entries.push({ text: `  ↩ ${hero.name} misses. (${atkRoll} vs your AC ${dragonAC})`, color: '#C4934A40' });
      }
    });

    setLog(prev => [...prev, ...entries]);
    setDragonHP(curDragonHP);
    setRound(r => r + 1);

    setTimeout(() => {
      if (curDragonHP <= dragonMaxHP * 0.2) {
        setLog(prev => [...prev, { text: `💨 Critically wounded — you escape the ruin before it claims you!`, color: '#CC4444' }]);
        finishCombat(false, curDragonHP);
      }
      setBusy(false);
    }, 150);
  }

  const breathCooldownLeft = Math.max(0, 5 - (round - breathUsedOnRound));
  const breathReady = breathCooldownLeft === 0;

  function HPBar({ current, max, color }: { current: number; max: number; color: string }) {
    return (
      <div style={{ height: 8, background: '#1A0A2E', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${clamp((current / max) * 100, 0, 100)}%`, background: color, borderRadius: 4, transition: 'width 0.3s ease' }} />
      </div>
    );
  }

  return (
    <div style={{ height: '100%', overflowY: 'auto', fontFamily: '"Crimson Text", Georgia, serif', background: '#0D0500' }}>
      <div style={{ maxWidth: 700, margin: '0 auto', padding: '20px' }}>

        <button
          onClick={() => setActiveScreen('hub')}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: PARCHMENT, cursor: 'pointer', fontFamily: '"Cinzel", serif', fontSize: 17, marginBottom: 16, padding: 0 }}
        >
          <ArrowLeft size={19} /> Return to Lair
        </button>
        <h2 style={{ fontFamily: '"Cinzel", serif', color: PARCHMENT, fontSize: 22, fontWeight: 700, marginBottom: 4 }}>🗺️ Explore Ruins</h2>
        <div style={{ color: '#C4934A60', fontSize: 18, marginBottom: 20 }}>Venture out alone for rare loot — no kobolds to lean on.</div>

        {/* ── TIER SELECT ── */}
        {phase === 'tier-select' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {DUNGEON_TIERS.map(tier => {
              const locked = tier.lockUntilAgeTier !== undefined && ageTier < tier.lockUntilAgeTier;
              return (
                <button
                  key={tier.id}
                  onClick={() => { if (!locked) { playSound('pageFlip'); selectTier(tier); } }}
                  disabled={locked}
                  style={{
                    background: locked ? '#1A0A2E30' : '#2C181040',
                    border: `2px solid ${tier.legendary ? GOLD : PARCHMENT}${locked ? '20' : '50'}`,
                    borderRadius: 8, padding: '18px 20px', textAlign: 'left',
                    cursor: locked ? 'not-allowed' : 'pointer',
                    opacity: locked ? 0.45 : 1, transition: 'all 0.15s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <span style={{ fontSize: 28 }}>{tier.icon}</span>
                    <div>
                      <div style={{ fontFamily: '"Cinzel", serif', color: tier.legendary ? GOLD : PARCHMENT, fontWeight: 700, fontSize: 20, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        {tier.label}
                        {tier.legendary && (
                          <span style={{ fontSize: 12, background: GOLD, color: INK, padding: '2px 8px', borderRadius: 10, fontWeight: 700 }}>
                            LEGENDARY
                          </span>
                        )}
                        {locked && (
                          <span style={{ fontSize: 13, color: '#CC4444', fontWeight: 400 }}>
                            🔒 Requires Age Tier {tier.lockUntilAgeTier}
                          </span>
                        )}
                      </div>
                      <div style={{ color: '#C4934A80', fontSize: 17, marginTop: 2 }}>{tier.description}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', paddingTop: 8, borderTop: `1px solid ${PARCHMENT}20` }}>
                    <RewardHint icon="🪙" label={`${tier.goldRange[0]}–${tier.goldRange[1]} gold`} color={GOLD} />
                    <RewardHint icon="📦" label={`Item value ${tier.itemValueRange[0]}–${tier.itemValueRange[1]}`} color='#8A7ACC' />
                    {tier.dreadBonus > 0 && <RewardHint icon="💀" label={`+${tier.dreadBonus} Dread`} color='#CC4444' />}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* ── PREVIEW ── */}
        {phase === 'preview' && selectedTier && (
          <>
            <div style={{ background: '#2C181040', border: `2px solid ${PARCHMENT}30`, borderRadius: 8, padding: '18px', marginBottom: 16 }}>
              <div style={{ fontFamily: '"Cinzel", serif', color: PARCHMENT, fontSize: 20, fontWeight: 700, marginBottom: 12 }}>
                {selectedTier.icon} {selectedTier.label} — Guardians
              </div>
              {party.map((hero, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', background: '#2C181030', borderRadius: 6, marginBottom: 8 }}>
                  <AdventurerPortrait hero={hero} size={48} />
                  <div style={{ flex: 1 }}>
                    <div style={{ color: PARCHMENT, fontWeight: 700, fontSize: 19 }}>{hero.name}</div>
                    <div style={{ color: '#C4934A60', fontSize: 17 }}>{adventurerClassLabel(hero)} · Size {hero.size} · CR {hero.cr}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 12, fontSize: 17 }}>
                    <span style={{ color: GREEN }}>❤️ {hero.hp}</span>
                    <span style={{ color: '#4A8ACC' }}>🛡️ {hero.ac}</span>
                  </div>
                </div>
              ))}
              <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${PARCHMENT}20`, display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                <Info label="Attack Mod" value={`${attackMod >= 0 ? '+' : ''}${attackMod}`} />
                <Info label="Your AC" value={String(dragonAC)} />
                <Info label="Your HP" value={persistedHP < dragonMaxHP ? `${persistedHP} / ${dragonMaxHP}` : String(dragonMaxHP)} color={persistedHP < dragonMaxHP ? GOLD : GREEN} />
                <Info label="Gold Reward" value={`🪙 ${goldReward}`} color={GOLD} />
              </div>
            </div>
            <div style={{ background: '#1A0A2E60', border: `1px solid ${PARCHMENT}20`, borderRadius: 8, padding: '12px 16px', marginBottom: 20, fontSize: 16, color: '#C4934A80', lineHeight: 1.7 }}>
              <strong style={{ color: PARCHMENT, fontFamily: '"Cinzel", serif' }}>Solo Expedition:</strong>
              {' '}No kobolds assist. Breath weapon has a 5-round cooldown.{' '}
              🐾 <strong style={{ color: PARCHMENT }}>Claw</strong> — weakest target &nbsp;·&nbsp;
              🔥 <strong style={{ color: PARCHMENT }}>Breath</strong> — AoE, 5-rnd cooldown &nbsp;·&nbsp;
              🌀 <strong style={{ color: PARCHMENT }}>Tail Sweep</strong> — AoE &nbsp;·&nbsp;
              😱 <strong style={{ color: PARCHMENT }}>Intimidate</strong> — route weakened foes
            </div>
            <button
              onClick={startCombat}
              style={{ width: '100%', padding: '18px', background: '#4A2200', border: `2px solid ${selectedTier.legendary ? GOLD : PARCHMENT}60`, borderRadius: 6, color: '#E8D5A0', fontFamily: '"Cinzel", serif', fontWeight: 700, fontSize: 20, cursor: 'pointer' }}
            >
              {selectedTier.icon} Enter the {selectedTier.label}!
            </button>
          </>
        )}

        {/* ── FIGHTING ── */}
        {phase === 'fighting' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ background: '#1A0A2E80', border: `2px solid ${PARCHMENT}30`, borderRadius: 8, padding: '14px 18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontFamily: '"Cinzel", serif', color: PARCHMENT, fontWeight: 700 }}>🐉 {dragon?.name ?? 'Dragon'}</span>
                <span style={{ color: dragonHP < dragonMaxHP * 0.3 ? '#CC4444' : GREEN, fontWeight: 700 }}>{dragonHP} / {dragonMaxHP} HP</span>
              </div>
              <HPBar current={dragonHP} max={dragonMaxHP} color={dragonHP < dragonMaxHP * 0.3 ? '#CC4444' : dragonHP < dragonMaxHP * 0.6 ? GOLD : GREEN} />
            </div>

            <div style={{ background: '#2C181040', border: `2px solid ${PARCHMENT}20`, borderRadius: 8, padding: '14px 18px' }}>
              <div style={{ fontFamily: '"Cinzel", serif', color: PARCHMENT, fontSize: 15, fontWeight: 700, marginBottom: 10 }}>Guardians</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {party.map((hero, i) => (
                  <div key={i} style={{ opacity: heroHPs[i] <= 0 ? 0.35 : 1, transition: 'opacity 0.3s' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 15 }}>
                      <span style={{ color: PARCHMENT }}>{heroHPs[i] <= 0 ? '💀 ' : ''}{hero.name}</span>
                      <span style={{ color: '#C4934A70' }}>{Math.max(0, heroHPs[i])} / {hero.hp}</span>
                    </div>
                    <HPBar current={heroHPs[i]} max={hero.hp} color={heroHPs[i] > hero.hp * 0.5 ? GREEN : heroHPs[i] > hero.hp * 0.25 ? GOLD : '#CC4444'} />
                  </div>
                ))}
              </div>
            </div>

            <div ref={logRef} style={{ background: '#080303', border: `1px solid ${PARCHMENT}20`, borderRadius: 6, padding: '10px 14px', maxHeight: 160, overflowY: 'auto', fontSize: 15, lineHeight: 1.65 }}>
              {log.map((e, i) => <div key={i} style={{ color: e.color ?? '#C4934A60' }}>{e.text}</div>)}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <ActionBtn onClick={() => doAction('claw')} disabled={busy} icon="🐾" label="Claw Strike" desc="Focus weakest target" color={DANGER} />
              <ActionBtn onClick={() => doAction('breath')} disabled={busy || !breathReady} icon="🔥" label={breathReady ? 'Breath Weapon' : `Breath (${breathCooldownLeft})`} desc="Hits all · 5-rnd cooldown" color={breathReady ? '#CC5500' : '#444'} />
              <ActionBtn onClick={() => doAction('tail')} disabled={busy} icon="🌀" label="Tail Sweep" desc="AoE, no cooldown" color='#5544AA' />
              <ActionBtn onClick={() => doAction('intimidate')} disabled={busy} icon="😱" label="Intimidate" desc="Route weakened foes" color='#226699' />
            </div>
          </div>
        )}

        {/* ── OUTCOME ── */}
        {phase === 'outcome' && selectedTier && (
          <div style={{ background: win ? '#4ACC7A15' : '#CC222215', border: `2px solid ${win ? '#4ACC7A' : '#CC2222'}40`, borderRadius: 8, padding: '24px', textAlign: 'center' }}>
            <div style={{ fontSize: 26, fontFamily: '"Cinzel", serif', fontWeight: 700, color: win ? GREEN : '#CC4444', marginBottom: 16 }}>
              {win ? '🗺️ PLUNDERED!' : '💨 DRIVEN BACK!'}
            </div>
            <div ref={logRef} style={{ background: '#080303', border: `1px solid ${PARCHMENT}20`, borderRadius: 6, padding: '10px 14px', maxHeight: 200, overflowY: 'auto', fontSize: 15, lineHeight: 1.65, marginBottom: 20, textAlign: 'left' }}>
              {log.map((e, i) => <div key={i} style={{ color: e.color ?? '#C4934A60' }}>{e.text}</div>)}
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 24 }}>
              {win ? (
                <>
                  <Reward icon="🪙" label={`+${goldReward} gold`} color={GOLD} />
                  {lootItem && (
                    <Reward
                      icon={lootItem.legendary ? '✨' : '📦'}
                      label={lootItem.name}
                      color={lootItem.legendary ? GOLD : '#8A7ACC'}
                    />
                  )}
                  {selectedTier.dreadBonus > 0 && <Reward icon="💀" label={`+${selectedTier.dreadBonus} Dread`} color='#CC4444' />}
                  {healAmount > 0
                    ? <Reward icon="❤️‍🔥" label={`+${healAmount} HP regenerated`} color={GREEN} />
                    : <Reward icon="❤️" label="Full health maintained" color={GREEN} />
                  }
                  {lootItem?.legendary && (
                    <div style={{ width: '100%', background: `${GOLD}15`, border: `1px solid ${GOLD}40`, borderRadius: 6, padding: '12px 16px', textAlign: 'left', marginTop: 4 }}>
                      <div style={{ fontFamily: '"Cinzel", serif', color: GOLD, fontWeight: 700, fontSize: 15, marginBottom: 6 }}>✨ Legendary Relic</div>
                      <div style={{ color: '#C4934A90', fontStyle: 'italic', fontSize: 16, lineHeight: 1.55 }}>
                        {LEGENDARY_ITEMS.find(li => li.name === lootItem.name)?.flavorText ?? ''}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <Reward icon="💸" label={`−${goldLost} gold (retreat)`} color='#CC4444' />
                  <Reward icon="🩹" label={`Healed to ${healAmount} HP`} color={GOLD} />
                </>
              )}
            </div>
            <button
              onClick={() => setActiveScreen('hub')}
              style={{ padding: '12px 32px', background: PARCHMENT, border: `2px solid ${INK}`, borderRadius: 6, color: INK, fontFamily: '"Cinzel", serif', fontWeight: 700, fontSize: 19, cursor: 'pointer' }}
            >
              Return to Lair
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

function Info({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <div style={{ color: '#C4934A60', fontSize: 14, fontFamily: '"Cinzel", serif' }}>{label}</div>
      <div style={{ color: color ?? PARCHMENT, fontWeight: 700, fontSize: 18 }}>{value}</div>
    </div>
  );
}

function Reward({ icon, label, color }: { icon: string; label: string; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#1A0A2E', borderRadius: 6, padding: '8px 14px', border: `1px solid ${color}30` }}>
      <span style={{ fontSize: 20 }}>{icon}</span>
      <span style={{ color, fontWeight: 700, fontSize: 16 }}>{label}</span>
    </div>
  );
}

function RewardHint({ icon, label, color }: { icon: string; label: string; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 16 }}>
      <span>{icon}</span>
      <span style={{ color }}>{label}</span>
    </div>
  );
}

function ActionBtn({ onClick, disabled, icon, label, desc, color }: { onClick: () => void; disabled: boolean; icon: string; label: string; desc: string; color: string }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{ background: disabled ? '#0D0D0D' : `${color}18`, border: `2px solid ${disabled ? '#2A2A2A' : color}50`, borderRadius: 8, padding: '12px 8px', cursor: disabled ? 'not-allowed' : 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, opacity: disabled ? 0.45 : 1, width: '100%', transition: 'opacity 0.2s' }}
    >
      <span style={{ fontSize: 26 }}>{icon}</span>
      <span style={{ color: disabled ? '#555' : color, fontFamily: '"Cinzel", serif', fontSize: 13, fontWeight: 700 }}>{label}</span>
      <span style={{ color: '#C4934A50', fontSize: 13 }}>{desc}</span>
    </button>
  );
}
