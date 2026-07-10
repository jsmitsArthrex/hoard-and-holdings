import type { KoboldTier } from '../data/koboldWages';

export type MarketCondition = 'booming' | 'stable' | 'depressed' | 'crash';
export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'legendary';

export interface Kobold {
  id: string;
  name: string;
  tier: KoboldTier;
  morale: number;
  role?: string;
}

export interface HoardItem {
  id: string;
  name: string;
  baseValue: number;
  rarity: ItemRarity;
}

export interface PriceHistoryEntry {
  day: number;
  multiplier: number;
  marketCondition: MarketCondition;
}

export interface EconomyState {
  currentMultiplier: number;
  activeEventId: string | null;
  marketCondition: MarketCondition;
  priceHistory: PriceHistoryEntry[];
}
