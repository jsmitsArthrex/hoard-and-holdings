import React from 'react';
import { useStore } from '../../store';
import { useGameStore } from '../../store/gameStore';
import { economyEvents } from '../../data/economyIndex';
import type { MarketCondition } from '../../store/types';

const REALM_NEWS: string[] = [
  'LOCAL HERO: Adventurer slays ancient dragon, sells entire loot haul at 40% below estimated market value',
  'BREAKING: Man mistakes gelatinous cube for glass door — survives, sues dungeon owner for emotional distress',
  'OPINION: Are kobolds people? Kingdom Census Bureau declines to comment for third year running',
  'WEATHER: Fog of War expected to lift by mid-morning; Fog of War II confirmed for winter',
  'CLASSIFIED: Lost — one ring. If found, please do NOT attempt to return it to a volcano',
  'FINANCE: Adventurers\' union demands hazard pay after final boss described as "completely unfair and also cheating"',
  'CULTURE: Elvish bakery under fire for describing sourdough as "artisanal, hand-crafted since the Second Age"',
  'CRIME: Thief arrested for robbing dragon hoard — described by witnesses as "brave, stupid, and also on fire"',
  'SPORTS: Jousting tournament delayed after knight\'s steed refuses to cooperate — steed unavailable for comment',
  'HEALTH: Healers warn: drinking from random dungeon fountains is, quote, "extremely inadvisable and we\'ve told you this before"',
  'TRAVEL: Kingdom toll roads raise prices; bridges now cost more than the properties they connect',
  'EMPLOYMENT: Goblin temp agency reports record demand; wages described as "competitive" (they are not)',
  'SCIENCE: Alchemists announce discovery of new element: Unobtainium — immediately lost in dungeon collapse',
  'POLITICS: King announces third consecutive "Final War" — citizens respond with familiar, weary acceptance',
  'BUSINESS: Rival dragon convicted of illegal price-fixing; released on own recognizance, immediately fled eastward',
  'REAL ESTATE: Haunted manor sells for 12% above asking price after ghost described as "adding character"',
  'OBITUARY: The Chosen One passes peacefully — was apparently chosen for a different prophecy entirely',
  'AGRICULTURE: Beanstalk market in freefall as giant threatens legal action over trespassing and property damage',
  'TECHNOLOGY: Magic mirror rebrands, launches subscription tier; enchantment update breaks all older curses',
  'COMMUNITY: Villagers petition to rename "Cursed Forest" district; council rules name is "accurate, actually"',
  'BREAKING: Necromancer three months in arrears on HOA fees; undead neighbours lodge noise complaint',
  'FINANCE: Potion market oversaturated as every dungeon shop sells identical product at identical 400% markup',
  'LIFESTYLE: "Loot Minimalism" trend surges as adventurers struggle to carry less while still taking everything',
  'SPORT: Annual Dragon Race cancelled — only one entrant appeared, and that entrant was the dragon',
  'CRIME: Bard arrested for performing economically irresponsible ballads glamourising reckless hoard speculation',
  'OPINION: Dark Lord\'s annual "Darkness Spreads Across the Land" address widely considered his weakest yet',
  'BUSINESS: Local wizard dissolves partnership after familiar "ate" 40,000 gold in client billings, claims he cannot explain it',
  'SCIENCE: Scholars confirm the Dungeon was, in fact, there the whole time — hikers "should have looked down"',
  'CULTURE: Bards\' Guild issues cease-and-desist to rival for plagiarising melody that is, technically, just four notes',
  'REAL ESTATE: "Cozy cave with river access" listing removed after buyers discover river is lava',
];

const FLAVOR_NEWS: Record<MarketCondition, [string, string, string]> = {
  booming: [
    'Merchants report record gold flows in the Eastern Districts',
    'Dragon hoard valuations reach historic peak — now is the time to sell',
    'Kobold labor demand surges as lair expansions accelerate kingdom-wide',
  ],
  stable: [
    'Kingdom treasury rates hold steady for third moon',
    'Real estate agents report normal transaction volumes across all districts',
    'Trade caravans moving without incident along the southern roads',
  ],
  depressed: [
    'Adventurers flood market with looted goods, prices fall',
    'Kobold temp agencies report reduced bookings as lairs cut spending',
    'Property valuations slip across the outer districts — buyers cautious',
  ],
  crash: [
    'PANIC: Kingdom currency devalued — hoard now worth more than gold',
    'CRISIS: Markets in freefall — hold your hoard and wait it out',
    'ALERT: Mass kobold walkouts reported across three districts',
  ],
};

interface ConditionStyle {
  label: string;
  color: string;
  bg: string;
}

const CONDITION_STYLES: Record<MarketCondition, ConditionStyle> = {
  booming:   { label: '▲ BOOMING',    color: '#22c55e', bg: '#14532d' },
  stable:    { label: '● STABLE',     color: '#fde047', bg: '#713f12' },
  depressed: { label: '▼ DEPRESSED',  color: '#fb923c', bg: '#7c2d12' },
  crash:     { label: '⚠ CRASH',      color: '#ef4444', bg: '#450a0a' },
};

export function EconomyTicker() {
  const currentMultiplier = useStore((s) => s.currentMultiplier);
  const activeEventId     = useStore((s) => s.activeEventId);
  const marketCondition   = useStore((s) => s.marketCondition);

  const activeEvent = activeEventId
    ? economyEvents.find((e) => e.id === activeEventId) ?? null
    : null;

  const style = CONDITION_STYLES[marketCondition];
  const pctDelta = (currentMultiplier - 1) * 100;
  const pctStr =
    pctDelta >= 0
      ? `+${pctDelta.toFixed(1)}% above baseline`
      : `${pctDelta.toFixed(1)}% below baseline`;

  const day = useGameStore((s) => s.day);

  const flavorItems = FLAVOR_NEWS[marketCondition];

  const realmNewsA = REALM_NEWS[day % REALM_NEWS.length];
  const realmNewsB = REALM_NEWS[(day + Math.floor(REALM_NEWS.length / 2)) % REALM_NEWS.length];

  const segments: string[] = [
    pctStr,
    ...(activeEvent
      ? [`⚡ ${activeEvent.name} — prices ${pctDelta >= 0 ? 'rising' : 'falling'}`]
      : []),
    ...flavorItems,
    '⚔  REALM NEWS  ⚔',
    realmNewsA,
    realmNewsB,
  ];

  const tickerContent = segments.join('   ◆   ');

  return (
    <div
      className="relative flex items-center overflow-hidden select-none"
      style={{
        backgroundColor: '#1A0A2E',
        borderTop: '1px solid #C4934A',
        borderBottom: '1px solid #C4934A',
        height: '2rem',
        fontFamily: 'Crimson Text, serif',
      }}
    >
      <style>{`
        @keyframes economy-ticker-scroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>

      <div
        className="flex-shrink-0 flex items-center justify-center px-3 h-full text-xs font-bold tracking-widest z-10"
        style={{
          backgroundColor: style.bg,
          color: style.color,
          minWidth: '9.5rem',
          borderRight: '1px solid #C4934A',
          letterSpacing: '0.08em',
        }}
      >
        {style.label}
      </div>

      <div className="flex-1 overflow-hidden h-full flex items-center">
        <div
          className="inline-flex items-center whitespace-nowrap text-sm"
          style={{
            color: '#C4934A',
            animation: 'economy-ticker-scroll 40s linear infinite',
          }}
        >
          <span className="px-6">{tickerContent}</span>
          <span className="px-6">{tickerContent}</span>
        </div>
      </div>
    </div>
  );
}
