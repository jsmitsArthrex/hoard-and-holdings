import React from 'react';
import type { HeroMonster } from '../../data/heroParties';

type AdventurerClass = 'fighter' | 'wizard' | 'rogue' | 'cleric' | 'barbarian' | 'bard';

function nameHash(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffffffff;
  return Math.abs(h);
}

function getAdventurerClass(hero: HeroMonster): AdventurerClass {
  const entries: { cls: AdventurerClass; v: number }[] = [
    { cls: 'fighter', v: hero.str },
    { cls: 'rogue', v: hero.dex },
    { cls: 'barbarian', v: hero.con },
    { cls: 'wizard', v: hero.int },
    { cls: 'cleric', v: hero.wis },
    { cls: 'bard', v: hero.cha },
  ];
  return entries.sort((a, b) => b.v - a.v)[0].cls;
}

const SKIN_TONES = ['#F2C49B', '#E8A87C', '#C68642', '#8D5524', '#FDDBB4'];

interface Props {
  hero: HeroMonster;
  size?: number;
}

export default function AdventurerPortrait({ hero, size = 48 }: Props) {
  const cls = getAdventurerClass(hero);
  const hash = nameHash(hero.name);
  const skin = SKIN_TONES[hash % SKIN_TONES.length];

  return (
    <div style={{ width: size, height: size, borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}>
      <svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" width={size} height={size}>
        {cls === 'fighter'   && <FighterPortrait skin={skin} hash={hash} />}
        {cls === 'wizard'    && <WizardPortrait skin={skin} hash={hash} />}
        {cls === 'rogue'     && <RoguePortrait skin={skin} hash={hash} />}
        {cls === 'cleric'    && <ClericPortrait skin={skin} hash={hash} />}
        {cls === 'barbarian' && <BarbarianPortrait skin={skin} hash={hash} />}
        {cls === 'bard'      && <BardPortrait skin={skin} hash={hash} />}
      </svg>
    </div>
  );
}

export function adventurerClassLabel(hero: HeroMonster): string {
  const labels: Record<AdventurerClass, string> = {
    fighter: 'Fighter', wizard: 'Wizard', rogue: 'Rogue',
    cleric: 'Cleric', barbarian: 'Barbarian', bard: 'Bard',
  };
  return labels[getAdventurerClass(hero)];
}

/* ── Fighter: armored knight helmet ─────────────────────────── */
function FighterPortrait({ skin, hash }: { skin: string; hash: number }) {
  const steel = hash % 2 === 0 ? '#7A8EA0' : '#6688AA';
  const steelDark = '#3A4A5A';
  return <>
    <circle cx="24" cy="24" r="24" fill="#0D1820" />
    {/* Armored shoulders */}
    <ellipse cx="24" cy="52" rx="19" ry="12" fill={steelDark} />
    <ellipse cx="24" cy="48" rx="15" ry="9" fill={steel} opacity="0.8" />
    {/* Pauldron rivets */}
    <circle cx="15" cy="46" r="1.2" fill={steelDark} opacity="0.8" />
    <circle cx="33" cy="46" r="1.2" fill={steelDark} opacity="0.8" />
    {/* Gorget / neck */}
    <rect x="18" y="37" width="12" height="7" rx="2" fill={steelDark} />
    {/* Helmet back dome */}
    <ellipse cx="24" cy="21" rx="13" ry="14" fill={steel} />
    {/* Helmet top curve */}
    <ellipse cx="24" cy="12" rx="12" ry="7" fill={steel} />
    {/* Cheek guards */}
    <rect x="10" y="19" width="5" height="14" rx="2" fill="#556677" />
    <rect x="33" y="19" width="5" height="14" rx="2" fill="#556677" />
    {/* Face window */}
    <rect x="15" y="22" width="18" height="10" rx="2" fill={skin} />
    {/* Eyes */}
    <ellipse cx="20" cy="26" rx="2.2" ry="2" fill="#2A1800" />
    <ellipse cx="28" cy="26" rx="2.2" ry="2" fill="#2A1800" />
    <circle cx="21" cy="25" r="0.8" fill="white" opacity="0.6" />
    <circle cx="29" cy="25" r="0.8" fill="white" opacity="0.6" />
    {/* Visor bar */}
    <rect x="15" y="29" width="18" height="2.5" rx="1" fill={steelDark} opacity="0.7" />
    {/* Helmet ridge crest */}
    <path d="M 24 6 L 22 14 L 26 14 Z" fill="#99AACC" opacity="0.7" />
    {/* Highlight */}
    <ellipse cx="17" cy="15" rx="4" ry="2.5" fill="white" opacity="0.1" transform="rotate(-25 17 15)" />
  </>;
}

/* ── Wizard: tall pointed hat, robes ─────────────────────────── */
function WizardPortrait({ skin, hash }: { skin: string; hash: number }) {
  const robeColors = ['#5533AA', '#226699', '#883399'];
  const robe = robeColors[hash % 3];
  return <>
    <circle cx="24" cy="24" r="24" fill="#0D0520" />
    {/* Robe body */}
    <ellipse cx="24" cy="52" rx="18" ry="14" fill={robe} opacity="0.85" />
    <path d="M 12 44 Q 24 38 36 44 L 36 52 Q 24 48 12 52 Z" fill={robe} opacity="0.6" />
    {/* Neck */}
    <rect x="20" y="35" width="8" height="7" rx="3" fill={skin} />
    {/* Face */}
    <ellipse cx="24" cy="28" rx="9" ry="10" fill={skin} />
    {/* Eyebrows (bushy) */}
    {hash % 2 === 0 && <>
      <path d="M 18.5 24.5 Q 21 23 23 24.5" stroke="#665544" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <path d="M 25 24.5 Q 27 23 29.5 24.5" stroke="#665544" strokeWidth="1.8" fill="none" strokeLinecap="round" />
    </>}
    {/* Eyes */}
    <ellipse cx="21" cy="27" rx="2.2" ry="2" fill="#2A1800" />
    <ellipse cx="27" cy="27" rx="2.2" ry="2" fill="#2A1800" />
    <circle cx="22" cy="26" r="0.8" fill="white" opacity="0.6" />
    <circle cx="28" cy="26" r="0.8" fill="white" opacity="0.6" />
    {/* Beard */}
    {hash % 2 === 0 && <ellipse cx="24" cy="36" rx="6" ry="4" fill="#CCCCBB" opacity="0.65" />}
    {/* Hat cone */}
    <polygon points="24,2 11,20 37,20" fill={robe} />
    <polygon points="24,2 18,16 21,16" fill="white" opacity="0.08" />
    {/* Hat brim */}
    <ellipse cx="24" cy="20" rx="14" ry="4.5" fill={robe} />
    {/* Stars on hat */}
    <circle cx="20" cy="9" r="1.4" fill="#FFDD00" opacity="0.85" />
    <circle cx="28" cy="12" r="1.1" fill="#FFDD00" opacity="0.75" />
    <circle cx="24" cy="6" r="0.9" fill="#FFEE88" opacity="0.7" />
    <circle cx="18" cy="14" r="0.7" fill="#FFDD00" opacity="0.5" />
  </>;
}

/* ── Rogue: deep hood, glowing eyes ─────────────────────────── */
function RoguePortrait({ skin, hash }: { skin: string; hash: number }) {
  const cloakColor = hash % 2 === 0 ? '#1C1408' : '#0C1018';
  const eyeGlow = hash % 2 === 0 ? '#CC8800' : '#44AACC';
  return <>
    <circle cx="24" cy="24" r="24" fill="#08080A" />
    {/* Cloak body */}
    <ellipse cx="24" cy="52" rx="20" ry="14" fill={cloakColor} />
    {/* Hood outer */}
    <path d="M 8 30 Q 10 8 24 7 Q 38 8 40 30 Q 34 22 24 22 Q 14 22 8 30 Z" fill={cloakColor} />
    {/* Shadow inside hood */}
    <path d="M 12 30 Q 14 12 24 11 Q 34 12 36 30 Q 30 23 24 23 Q 18 23 12 30 Z" fill="#050505" />
    {/* Face — barely lit */}
    <ellipse cx="24" cy="29" rx="8" ry="8" fill={skin} opacity="0.45" />
    {/* Glowing eyes */}
    <ellipse cx="20" cy="27" rx="2.8" ry="1.8" fill={eyeGlow} />
    <ellipse cx="28" cy="27" rx="2.8" ry="1.8" fill={eyeGlow} />
    <ellipse cx="20" cy="27" rx="1.6" ry="1.2" fill="#0A0A0A" />
    <ellipse cx="28" cy="27" rx="1.6" ry="1.2" fill="#0A0A0A" />
    {/* Eye rim glow */}
    <ellipse cx="20" cy="27" rx="3.2" ry="2.2" fill={eyeGlow} opacity="0.2" />
    <ellipse cx="28" cy="27" rx="3.2" ry="2.2" fill={eyeGlow} opacity="0.2" />
    {/* Smirk */}
    <path d="M 22 33 Q 24 35 26 33" stroke={skin} strokeWidth="0.9" fill="none" opacity="0.4" strokeLinecap="round" />
    {/* Hood inner rim */}
    <path d="M 14 30 Q 16 15 24 13 Q 32 15 34 30" stroke="#2A2010" strokeWidth="1.2" fill="none" opacity="0.4" />
  </>;
}

/* ── Cleric: halo, cowl, holy symbol ────────────────────────── */
function ClericPortrait({ skin, hash }: { skin: string; hash: number }) {
  const holyColor = hash % 2 === 0 ? '#FFD700' : '#88CCFF';
  const robeColor = hash % 2 === 0 ? '#8B6A22' : '#446688';
  return <>
    <circle cx="24" cy="24" r="24" fill="#150D05" />
    {/* Halo glow */}
    <circle cx="24" cy="15" r="13" fill={holyColor} opacity="0.12" />
    <circle cx="24" cy="15" r="12" fill="none" stroke={holyColor} strokeWidth="2.5" opacity="0.75" />
    {/* Robe */}
    <ellipse cx="24" cy="52" rx="18" ry="14" fill={robeColor} opacity="0.6" />
    <path d="M 13 42 Q 24 37 35 42 L 35 52 Q 24 47 13 52 Z" fill={robeColor} opacity="0.5" />
    {/* Neck */}
    <rect x="20" y="35" width="8" height="7" rx="3" fill={skin} />
    {/* Face */}
    <ellipse cx="24" cy="28" rx="9" ry="10" fill={skin} />
    {/* Eyes — serene */}
    <ellipse cx="21" cy="26" rx="2" ry="1.8" fill="#3A2810" />
    <ellipse cx="27" cy="26" rx="2" ry="1.8" fill="#3A2810" />
    <circle cx="22" cy="25.2" r="0.7" fill="white" opacity="0.6" />
    <circle cx="28" cy="25.2" r="0.7" fill="white" opacity="0.6" />
    {/* Gentle smile */}
    <path d="M 21 31 Q 24 33.5 27 31" stroke="#8B6040" strokeWidth="1" fill="none" strokeLinecap="round" />
    {/* Circlet / headband */}
    <path d="M 15 23 Q 24 18 33 23" stroke={holyColor} strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.85" />
    {/* Holy symbol on chest */}
    <circle cx="24" cy="43" r="3.5" fill="none" stroke={holyColor} strokeWidth="1.5" opacity="0.75" />
    <line x1="24" y1="39.5" x2="24" y2="46.5" stroke={holyColor} strokeWidth="1.2" opacity="0.65" />
    <line x1="20.5" y1="43" x2="27.5" y2="43" stroke={holyColor} strokeWidth="1.2" opacity="0.65" />
  </>;
}

/* ── Barbarian: wild hair, warpaint, bare shoulders ─────────── */
function BarbarianPortrait({ skin, hash }: { skin: string; hash: number }) {
  const hairColors = ['#AA4400', '#332211', '#886622'];
  const hair = hairColors[hash % 3];
  const paint = hash % 2 === 0 ? '#CC2222' : '#2244CC';
  return <>
    <circle cx="24" cy="24" r="24" fill="#150500" />
    {/* Bare shoulders */}
    <ellipse cx="24" cy="52" rx="19" ry="14" fill={skin} opacity="0.8" />
    <ellipse cx="24" cy="46" rx="16" ry="9" fill={skin} opacity="0.7" />
    {/* Neck */}
    <rect x="19" y="36" width="10" height="7" rx="3" fill={skin} />
    {/* Wild hair mass */}
    <ellipse cx="24" cy="14" rx="13" ry="10" fill={hair} />
    <path d="M 11 20 Q 7 8 14 6 Q 12 14 17 18" fill={hair} />
    <path d="M 37 20 Q 41 8 34 6 Q 36 14 31 18" fill={hair} />
    <path d="M 15 12 Q 12 3 19 4 Q 17 9 20 13" fill={hair} />
    <path d="M 33 12 Q 36 3 29 4 Q 31 9 28 13" fill={hair} />
    {/* Face */}
    <ellipse cx="24" cy="27" rx="10" ry="11" fill={skin} />
    {/* Fierce eyes */}
    <ellipse cx="20.5" cy="25" rx="2.5" ry="2.2" fill="#1A0A00" />
    <ellipse cx="27.5" cy="25" rx="2.5" ry="2.2" fill="#1A0A00" />
    <circle cx="21.5" cy="24" r="0.8" fill="white" opacity="0.5" />
    <circle cx="28.5" cy="24" r="0.8" fill="white" opacity="0.5" />
    {/* Brow furrow */}
    <path d="M 17.5 22.5 L 21.5 24" stroke="#2A1000" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    <path d="M 26.5 24 L 30.5 22.5" stroke="#2A1000" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    {/* Warpaint */}
    <line x1="16" y1="24" x2="20" y2="26.5" stroke={paint} strokeWidth="2.2" strokeLinecap="round" opacity="0.8" />
    <line x1="15.5" y1="27.5" x2="19" y2="28.5" stroke={paint} strokeWidth="1.6" strokeLinecap="round" opacity="0.7" />
    <line x1="28" y1="26.5" x2="32" y2="24" stroke={paint} strokeWidth="2.2" strokeLinecap="round" opacity="0.8" />
    <line x1="29" y1="28.5" x2="32.5" y2="27.5" stroke={paint} strokeWidth="1.6" strokeLinecap="round" opacity="0.7" />
    {/* Snarl */}
    <path d="M 21 32 Q 24 34 27 32" stroke="#8B5030" strokeWidth="1.5" fill="none" strokeLinecap="round" />
  </>;
}

/* ── Bard: wide-brimmed hat with feather, vibrant ────────────── */
function BardPortrait({ skin, hash }: { skin: string; hash: number }) {
  const outfitColors = ['#AA2266', '#AA6600', '#6622AA'];
  const outfit = outfitColors[hash % 3];
  const feather = hash % 2 === 0 ? '#FFCC00' : '#FF6633';
  return <>
    <circle cx="24" cy="24" r="24" fill="#150510" />
    {/* Colorful outfit */}
    <ellipse cx="24" cy="52" rx="18" ry="14" fill={outfit} opacity="0.85" />
    <path d="M 14 41 Q 24 37 34 41 L 34 52 Q 24 47 14 52 Z" fill={outfit} opacity="0.7" />
    {/* Neck */}
    <rect x="20" y="35" width="8" height="7" rx="3" fill={skin} />
    {/* Face */}
    <ellipse cx="24" cy="28" rx="9" ry="10" fill={skin} />
    {/* Charming eyes */}
    <ellipse cx="21" cy="26" rx="2.2" ry="2" fill="#2A1800" />
    <ellipse cx="27" cy="26" rx="2.2" ry="2" fill="#2A1800" />
    <circle cx="22" cy="25" r="0.8" fill="white" opacity="0.7" />
    <circle cx="28" cy="25" r="0.8" fill="white" opacity="0.7" />
    {/* Smile */}
    <path d="M 20 31 Q 24 34.5 28 31" stroke="#AA7755" strokeWidth="1.2" fill="none" strokeLinecap="round" />
    {/* Wide hat brim */}
    <ellipse cx="24" cy="19" rx="16" ry="4.5" fill={outfit} />
    {/* Hat crown */}
    <ellipse cx="24" cy="14" rx="10" ry="6.5" fill={outfit} />
    <ellipse cx="24" cy="10" rx="9.5" ry="5.5" fill={outfit} opacity="0.9" />
    {/* Hat shine */}
    <ellipse cx="19" cy="12" rx="3.5" ry="1.8" fill="white" opacity="0.1" transform="rotate(-20 19 12)" />
    {/* Hat band */}
    <path d="M 14.5 19 Q 24 15.5 33.5 19" stroke="white" strokeWidth="1" fill="none" opacity="0.25" />
    {/* Feather */}
    <path d="M 35 18 Q 42 8 40 2 Q 37 9 35 15" fill={feather} opacity="0.9" />
    <path d="M 35 18 Q 41 9 38 3" stroke={feather} strokeWidth="1" fill="none" opacity="0.5" />
    <path d="M 35 18 Q 40 11 37 5" fill={feather} opacity="0.4" />
  </>;
}
