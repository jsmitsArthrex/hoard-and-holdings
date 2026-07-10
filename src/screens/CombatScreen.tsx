import { useState, useEffect, useRef } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { playSound } from '../audio/audioEngine';
import { heroTiers } from '../data/heroParties';
import { dragonBreeds } from '../data/dragonBreeds';
import { randomLoot } from '../engine/gameClock';
import { getModifier } from '../engine/statusEffects';
import AdventurerPortrait, { adventurerClassLabel } from '../components/npcs/AdventurerPortrait';
import type { HeroMonster } from '../data/heroParties';

const INK = '#2C1810';
const PARCHMENT = '#C4934A';
const GOLD = '#C9A227';
const DANGER = '#8B1A1A';
const GREEN = '#4ACC7A';

function d(sides: number) { return Math.floor(Math.random() * sides) + 1; }
function statMod(stat: number) { return Math.floor((stat - 10) / 2); }
function clamp(n: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, n)); }

function generateParty(ageTier: number): HeroMonster[] {
  const tier = heroTiers[Math.min(ageTier - 1, heroTiers.length - 1)];
  const count = 2 + Math.floor(Math.random() * 3);
  const shuffled = [...tier.representatives].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function getGoldReward(ageTier: number): number {
  const tier = heroTiers[Math.min(ageTier - 1, heroTiers.length - 1)];
  const [min, max] = tier.goldRewardRange;
  return min + Math.floor(Math.random() * (max - min + 1));
}

type CombatPhase = 'preview' | 'fighting' | 'outcome';
interface LogEntry { text: string; color?: string; }

export default function CombatScreen() {
  const { dragon, addGold, addHoardItem, addDread, logEvent, setActiveScreen, trackAdventurerDefeated, trackCombatLoss, statusEffects, activeIncursions, dismissIncursion, kobolds, dragonCurrentHP, updateDragonHP, activeRansom, captureForRansom, day, dread } = useGameStore();
  const ageTier = dragon?.ageTier ?? 1;
  const breed = dragonBreeds.find(b => b.id === (dragon?.breedId ?? 'fire'));
  const scoutTraitBonus = kobolds
    .filter(k => k.role === 'scout' && k.trait?.effect === 'combatBonus')
    .reduce((sum, k) => sum + k.trait!.value, 0);
  const attackMod = (breed ? Math.round((breed.baseStats.attack - 70) / 10) : 0) + Math.round(getModifier(statusEffects, 'combatBonus')) + scoutTraitBonus;
  const dragonAC = 12 + ageTier * 2 + (breed ? Math.round((breed.baseStats.defense - 70) / 10) : 0);
  const dragonMaxHP = breed ? Math.round(breed.baseStats.hp * 1.5 + ageTier * 20) : 100;
  const koboldBonus = Math.min(kobolds.length, 3);
  const persistedHP = dragonCurrentHP ?? dragonMaxHP;

  const [party] = useState<HeroMonster[]>(() => generateParty(ageTier));
  const [goldReward] = useState(() => getGoldReward(ageTier));
  const combatRewardMult = Math.max(1, getModifier(statusEffects, 'combatReward'));
  const effectiveGoldReward = Math.round(goldReward * combatRewardMult);
  const [heroHPs, setHeroHPs] = useState<number[]>([]);
  const [dragonHP, setDragonHP] = useState(persistedHP);
  const [phase, setPhase] = useState<CombatPhase>('preview');
  const [round, setRound] = useState(1);
  const [breathUsedOnRound, setBreathUsedOnRound] = useState(-10);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [win, setWin] = useState(false);
  const [busy, setBusy] = useState(false);
  const [goldLost, setGoldLost] = useState(0);
  const [healAmount, setHealAmount] = useState(0);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [log]);

  function startCombat() {
    setHeroHPs(party.map(h => h.hp));
    setDragonHP(persistedHP);
    setPhase('fighting');
    setLog([{ text: `⚔️ Round 1 — ${party.length} adventurers storm your lair!`, color: PARCHMENT }]);
  }

  function finishCombat(won: boolean, finalHP: number) {
    setWin(won);
    setPhase('outcome');
    if (won) {
      playSound('coinPickup');
      addGold(effectiveGoldReward);
      const loot = randomLoot();
      addHoardItem({ id: `loot-${Date.now()}`, name: loot.name, baseValue: loot.baseValue, lootedOnDay: dragon?.age ?? 1 });
      addDread(3);
      trackAdventurerDefeated();
      if (activeIncursions.length > 0) dismissIncursion(activeIncursions[0].id);
      const regenAmt = Math.floor((dragonMaxHP - finalHP) * 0.4);
      updateDragonHP(Math.min(dragonMaxHP, finalHP + regenAmt));
      setHealAmount(regenAmt);
      logEvent(`Defeated ${party.length} adventurers! Earned ${effectiveGoldReward} gold and looted ${loot.name}.`);
    } else {
      playSound('coinLoss');
      trackCombatLoss();
      const healCost = 10 + Math.floor(Math.random() * 11);
      setGoldLost(healCost);
      addGold(-healCost);
      addDread(-1);
      const restoredHP = Math.floor(dragonMaxHP * 0.5);
      updateDragonHP(restoredHP);
      setHealAmount(restoredHP);
      logEvent(`Driven off by adventurers! Lost ${healCost} gold in healing costs.`);
    }
  }

  function doAction(action: 'claw' | 'breath' | 'tail' | 'intimidate') {
    if (busy) return;
    setBusy(true);
    playSound('diceRoll');

    const newHPs = [...heroHPs];
    const entries: LogEntry[] = [{ text: `— Round ${round} —`, color: GOLD }];

    if (action === 'claw') {
      const targetIdx = newHPs.reduce((best, hp, i) => hp > 0 && (best === -1 || hp < newHPs[best]) ? i : best, -1);
      if (targetIdx >= 0) {
        const hero = party[targetIdx];
        const roll = d(20) + attackMod + koboldBonus;
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
        ? { text: `😱 Intimidating Roar! ${fled} weakened adventurer(s) flee in terror!`, color: GREEN }
        : { text: `😱 Your roar echoes... the adventurers grit their teeth and hold.`, color: '#C4934A70' }
      );
    }

    setHeroHPs(newHPs);

    if (newHPs.every(hp => hp <= 0)) {
      entries.push({ text: '🏆 All adventurers have been defeated!', color: GREEN });
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
        setLog(prev => [...prev, { text: `💨 Critically wounded — you disengage and retreat!`, color: '#CC4444' }]);
        finishCombat(false, curDragonHP);
      }
      setBusy(false);
    }, 150);
  }

  const breathCooldownLeft = Math.max(0, 3 - (round - breathUsedOnRound));
  const breathReady = breathCooldownLeft === 0;
  const tierLabel = heroTiers[Math.min(ageTier - 1, heroTiers.length - 1)].label;

  const prisonerHero = [...party].sort((a, b) => b.cr - a.cr)[0] ?? null;
  const ransomDaysOffset = Math.max(1, 3 - Math.floor(dread / 30));
  const ransomExpectedPayout = goldReward + Math.floor(dread / 10) * 5;
  const hasActivePrisoner = activeRansom !== null;

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

        <button onClick={() => setActiveScreen('hub')} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: PARCHMENT, cursor: 'pointer', fontFamily: '"Cinzel", serif', fontSize: 17, marginBottom: 16, padding: 0 }}>
          <ArrowLeft size={19} /> Return to Lair
        </button>
        <h2 style={{ fontFamily: '"Cinzel", serif', color: PARCHMENT, fontSize: 22, fontWeight: 700, marginBottom: 4 }}>⚔️ Hunt Adventurers</h2>
        <div style={{ color: '#C4934A60', fontSize: 18, marginBottom: 20 }}>Tier: {tierLabel} party</div>

        {/* ── PREVIEW ── */}
        {phase === 'preview' && (
          <>
            <div style={{ background: '#2C181040', border: `2px solid ${PARCHMENT}30`, borderRadius: 8, padding: '18px', marginBottom: 16 }}>
              <div style={{ fontFamily: '"Cinzel", serif', color: PARCHMENT, fontSize: 20, fontWeight: 700, marginBottom: 12 }}>Approaching Party</div>
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
                <Info label="Gold Reward" value={`🪙 ${effectiveGoldReward}${combatRewardMult > 1 ? ` (×${combatRewardMult} 🏆)` : ''}`} color={GOLD} />
              </div>
            </div>
            <div style={{ background: '#1A0A2E60', border: `1px solid ${PARCHMENT}20`, borderRadius: 8, padding: '12px 16px', marginBottom: 20, fontSize: 16, color: '#C4934A80', lineHeight: 1.7 }}>
              <strong style={{ color: PARCHMENT, fontFamily: '"Cinzel", serif' }}>Your Actions:</strong>
              {' '}🐾 <strong style={{ color: PARCHMENT }}>Claw</strong> — focus weakest target &nbsp;·&nbsp;
              � <strong style={{ color: PARCHMENT }}>Breath</strong> — AoE, 3-round cooldown &nbsp;·&nbsp;
              🌀 <strong style={{ color: PARCHMENT }}>Tail Sweep</strong> — AoE &nbsp;·&nbsp;
              😱 <strong style={{ color: PARCHMENT }}>Intimidate</strong> — route weakened foes
              {kobolds.length > 0 && <div style={{ marginTop: 6, color: '#4ACC7A90' }}>🐉 {kobolds.length} kobold{kobolds.length > 1 ? 's' : ''} provide +{koboldBonus} to hit</div>}
              {scoutTraitBonus > 0 && <div style={{ marginTop: 4, color: '#C9A22790' }}>🔭 Shadow Step scouts: +{scoutTraitBonus} to hit</div>}
            </div>
            <button onClick={startCombat} style={{ width: '100%', padding: '18px', background: DANGER, border: `2px solid ${INK}`, borderRadius: 6, color: '#E8D5A0', fontFamily: '"Cinzel", serif', fontWeight: 700, fontSize: 20, cursor: 'pointer' }}>
              ⚔️ Enter Battle!
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
              <div style={{ fontFamily: '"Cinzel", serif', color: PARCHMENT, fontSize: 15, fontWeight: 700, marginBottom: 10 }}>Adventurers</div>
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
              <ActionBtn onClick={() => doAction('breath')} disabled={busy || !breathReady} icon="🔥" label={breathReady ? 'Breath Weapon' : `Breath (${breathCooldownLeft})`} desc="Hits all · 3-rnd cooldown" color={breathReady ? '#CC5500' : '#444'} />
              <ActionBtn onClick={() => doAction('tail')} disabled={busy} icon="🌀" label="Tail Sweep" desc="AoE, no cooldown" color='#5544AA' />
              <ActionBtn onClick={() => doAction('intimidate')} disabled={busy} icon="😱" label="Intimidate" desc="Route weakened foes" color='#226699' />
            </div>
          </div>
        )}

        {/* ── OUTCOME ── */}
        {phase === 'outcome' && (
          <div style={{ background: win ? '#4ACC7A15' : '#CC222215', border: `2px solid ${win ? '#4ACC7A' : '#CC2222'}40`, borderRadius: 8, padding: '24px', textAlign: 'center' }}>
            <div style={{ fontSize: 26, fontFamily: '"Cinzel", serif', fontWeight: 700, color: win ? GREEN : '#CC4444', marginBottom: 16 }}>
              {win ? '⚔️ VICTORY!' : '💨 RETREAT!'}
            </div>
            <div ref={logRef} style={{ background: '#080303', border: `1px solid ${PARCHMENT}20`, borderRadius: 6, padding: '10px 14px', maxHeight: 200, overflowY: 'auto', fontSize: 15, lineHeight: 1.65, marginBottom: 20, textAlign: 'left' }}>
              {log.map((e, i) => <div key={i} style={{ color: e.color ?? '#C4934A60' }}>{e.text}</div>)}
            </div>
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 24 }}>
              {win ? (
                <>
                  <Reward icon="🪙" label={`+${effectiveGoldReward} gold${combatRewardMult > 1 ? ' ×2' : ''}`} color={GOLD} />
                  <Reward icon="📦" label="+1 loot item" color='#8A7ACC' />
                  <Reward icon="💀" label="+3 Dread" color='#CC4444' />
                  {healAmount > 0
                    ? <Reward icon="❤️‍🔥" label={`+${healAmount} HP regenerated`} color={GREEN} />
                    : <Reward icon="❤️" label="Full health maintained" color={GREEN} />
                  }
                </>
              ) : (
                <>
                  <Reward icon="💸" label={`−${goldLost} gold (healing)`} color='#CC4444' />
                  <Reward icon="🩹" label={`Healed to ${healAmount} HP`} color={GOLD} />
                  <Reward icon="💀" label="−1 Dread" color='#8A8A8A' />
                </>
              )}
            </div>
            {win && (
              <div style={{ marginBottom: 20 }}>
                {hasActivePrisoner ? (
                  <div style={{ background: '#1A0A2E', border: `1px solid ${PARCHMENT}30`, borderRadius: 6, padding: '12px 16px', fontSize: 16, color: '#C4934A60', textAlign: 'center' }}>
                    ⛓️ Prisoner already held — <span style={{ color: PARCHMENT }}>{activeRansom!.heroName}</span> (due Day {activeRansom!.dueOnDay})
                  </div>
                ) : (
                  <div style={{ background: '#1A0A2E50', border: `1px solid ${PARCHMENT}25`, borderRadius: 6, padding: '14px 16px', textAlign: 'left' }}>
                    <div style={{ fontFamily: '"Cinzel", serif', color: PARCHMENT, fontSize: 15, fontWeight: 700, marginBottom: 8 }}>⛓️ TAKE PRISONER</div>
                    <div style={{ fontSize: 15, color: '#C4934A80', marginBottom: 10 }}>
                      Capture <span style={{ color: PARCHMENT }}>{prisonerHero?.name ?? 'hero'}</span> (CR {prisonerHero?.cr}) for ransom.
                    </div>
                    <div style={{ display: 'flex', gap: 14, marginBottom: 12, flexWrap: 'wrap', fontSize: 15 }}>
                      <span style={{ color: GOLD }}>💰 ~{ransomExpectedPayout} gold expected</span>
                      <span style={{ color: PARCHMENT }}>📅 Arrives Day {day + ransomDaysOffset}</span>
                      <span style={{ color: '#8A7ACC' }}>💀 Dread bonus: +{Math.floor(dread / 10) * 5}g</span>
                    </div>
                    <button
                      onClick={() => prisonerHero && captureForRansom(prisonerHero.name, goldReward)}
                      style={{ padding: '10px 22px', background: DANGER, border: `2px solid ${INK}`, borderRadius: 6, color: '#E8D5A0', fontFamily: '"Cinzel", serif', fontWeight: 700, fontSize: 16, cursor: 'pointer' }}
                    >
                      ⛓️ Take Prisoner
                    </button>
                  </div>
                )}
              </div>
            )}
            <button onClick={() => setActiveScreen('hub')} style={{ padding: '12px 32px', background: PARCHMENT, border: `2px solid ${INK}`, borderRadius: 6, color: INK, fontFamily: '"Cinzel", serif', fontWeight: 700, fontSize: 19, cursor: 'pointer' }}>
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

function ActionBtn({ onClick, disabled, icon, label, desc, color }: { onClick: () => void; disabled: boolean; icon: string; label: string; desc: string; color: string }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{ background: disabled ? '#0D0D0D' : `${color}18`, border: `2px solid ${disabled ? '#2A2A2A' : color}50`, borderRadius: 8, padding: '12px 8px', cursor: disabled ? 'not-allowed' : 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, opacity: disabled ? 0.45 : 1, width: '100%', transition: 'opacity 0.2s' }}>
      <span style={{ fontSize: 26 }}>{icon}</span>
      <span style={{ color: disabled ? '#555' : color, fontFamily: '"Cinzel", serif', fontSize: 13, fontWeight: 700 }}>{label}</span>
      <span style={{ color: '#C4934A50', fontSize: 13 }}>{desc}</span>
    </button>
  );
}
