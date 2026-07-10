import type { KoboldRole, KoboldSpecies } from '../types';

export const AGE_TIER_LABELS: Record<number, string> = {
  1: 'Wyrmling',
  2: 'Young Drake',
  3: 'Adult',
  4: 'Ancient',
  5: 'Great Wyrm',
};

export const AGE_TIER_UNLOCK_TEXT: Record<number, string> = {
  2: 'Combat rolls +2 · Tier 2 hero parties unlocked',
  3: 'Gold income +15% · Tier 3 hero parties unlocked · Can sell Uncommon items',
  4: 'Dread intimidation bonus +10 · Tier 4 hero parties unlocked',
  5: 'All income +25% · Rivals fear you (persuasion DC reduced to 10)',
};

export const AGE_TIER_THRESHOLDS: [number, number][] = [
  [1, 0],
  [2, 30],
  [3, 70],
  [4, 120],
  [5, 180],
];

export function getAgeTier(day: number): 1 | 2 | 3 | 4 | 5 {
  if (day < 30) return 1;
  if (day < 70) return 2;
  if (day < 120) return 3;
  if (day < 180) return 4;
  return 5;
}

export function daysUntilNextTier(day: number): number | null {
  if (day < 30) return 30 - day;
  if (day < 70) return 70 - day;
  if (day < 120) return 120 - day;
  if (day < 180) return 180 - day;
  return null;
}

const DRAGON_PREFIX = ['Ash', 'Ember', 'Blaze', 'Frost', 'Storm', 'Shadow', 'Iron', 'Gold', 'Cinder', 'Obsidian', 'Venom', 'Void', 'Scorch', 'Grim'];
const DRAGON_SUFFIX = ['wing', 'fang', 'scale', 'claw', 'breath', 'maw', 'spire', 'heart', 'bone', 'tail', 'fire', 'bane'];

export function randomDragonName(): string {
  const a = DRAGON_PREFIX[Math.floor(Math.random() * DRAGON_PREFIX.length)];
  const b = DRAGON_SUFFIX[Math.floor(Math.random() * DRAGON_SUFFIX.length)];
  return a + b;
}

const KOBOLD_FIRST = ['Grix', 'Zorp', 'Nibble', 'Klunk', 'Sprocket', 'Fizz', 'Grub', 'Wobble', 'Snick', 'Bonk', 'Glorp', 'Fizgig', 'Clank', 'Squib', 'Dripple', 'Muck'];
const KOBOLD_LAST = ['the Tiny', 'Ironscale', 'Stoneclaw', 'Mudcrawler', 'Dustfoot', 'the Brave', 'Pebbleback', 'Dirtclaw', 'Rockhead', 'Snaggletooth', 'Grumblewick', 'the Bold'];

export function randomKoboldName(): string {
  const a = KOBOLD_FIRST[Math.floor(Math.random() * KOBOLD_FIRST.length)];
  const b = KOBOLD_LAST[Math.floor(Math.random() * KOBOLD_LAST.length)];
  return `${a} ${b}`;
}

export const KOBOLD_ROLES: KoboldRole[] = ['miner', 'guard', 'treasurer', 'scout', 'cook'];
export const KOBOLD_SPECIES_LIST: KoboldSpecies[] = ['red', 'blue', 'green', 'purple', 'white'];

export const KOBOLD_ROLE_LABELS: Record<KoboldRole, string> = {
  miner: '⛏️ Miner',
  guard: '🛡️ Guard',
  treasurer: '💰 Treasurer',
  scout: '🔭 Scout',
  cook: '🍖 Cook',
};

export const KOBOLD_SPECIES_COLORS: Record<KoboldSpecies, string> = {
  red: '#CC4422',
  blue: '#2244CC',
  green: '#226622',
  purple: '#882299',
  white: '#AAAAAA',
};

export const KOBOLD_SPECIES_LABELS: Record<KoboldSpecies, string> = {
  red: 'Red',
  blue: 'Blue',
  green: 'Green',
  purple: 'Purple',
  white: 'White',
};

export const LOOT_TABLE = [
  { name: "Adventurer's Helm", baseValue: 45 },
  { name: 'Enchanted Longsword', baseValue: 75 },
  { name: 'Ancient Spellbook', baseValue: 40 },
  { name: 'Gem Pouch', baseValue: 30 },
  { name: 'Mithral Shield', baseValue: 65 },
  { name: 'Healing Draught Cache', baseValue: 25 },
  { name: "Wizard's Staff", baseValue: 80 },
  { name: 'Holy Relic', baseValue: 55 },
  { name: 'Cursed Idol', baseValue: 35 },
  { name: 'Dragon-Slayer Crossbow', baseValue: 70 },
  { name: 'Bag of Tricks', baseValue: 20 },
  { name: "Noble's Signet Ring", baseValue: 50 },
  { name: 'Platinum Chalice', baseValue: 60 },
  { name: 'Ancient Map Fragment', baseValue: 42 },
  { name: "Alchemist's Satchel", baseValue: 38 },
];

export function randomLoot() {
  return LOOT_TABLE[Math.floor(Math.random() * LOOT_TABLE.length)];
}

export function koboldGrossIncome(dailyWage: number, hasLair: boolean): number {
  const gross = dailyWage * 2;
  return hasLair ? gross : gross * 0.5;
}
