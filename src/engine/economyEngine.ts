import { priceIndex, economyEvents } from '../data/economyIndex';
import type { EconomyEvent } from '../data/economyIndex';
import { koboldWages } from '../data/koboldWages';
import type { Property } from '../data/districts';
import type { Kobold, HoardItem, ItemRarity, MarketCondition, EconomyState } from '../store/types';

export interface EconomyUpdate {
  multiplier: number;
  activeEvent: EconomyEvent | null;
  marketCondition: MarketCondition;
}

export interface PriceDisplay {
  adjustedPrice: number;
  trend: 'up' | 'down' | 'stable';
  percentChange: number;
}

const RARITY_MULTIPLIERS: Record<ItemRarity, number> = {
  common: 1,
  uncommon: 2,
  rare: 5,
  legendary: 15,
};

function classifyMarket(multiplier: number): MarketCondition {
  if (multiplier > 1.4) return 'booming';
  if (multiplier >= 0.8) return 'stable';
  if (multiplier >= 0.5) return 'depressed';
  return 'crash';
}

export function tickEconomy(currentDay: number): EconomyUpdate {
  const idx = Math.min(Math.max(currentDay, 0), priceIndex.length - 1);
  const base = priceIndex[idx];

  const activeEvent = economyEvents.find(e => e.gameDay === currentDay) ?? null;

  let multiplier = base;
  if (activeEvent) {
    multiplier = Math.min(3.0, Math.max(0.3, base + activeEvent.multiplierDelta));
  }

  return { multiplier, activeEvent, marketCondition: classifyMarket(multiplier) };
}

export function getAdjustedPrice(baseGoldPrice: number, multiplier: number): number {
  return Math.round(baseGoldPrice * multiplier);
}

export function getKoboldDailyIncome(
  kobold: Kobold,
  hasLair: boolean,
  multiplier: number,
): number {
  const wage = koboldWages.find(w => w.tier === kobold.tier);
  const base = wage?.dailyWage ?? 2;
  const lairFactor = hasLair ? 1 : 0.5;
  const moraleFactor = kobold.morale / 100;
  return Math.round(base * lairFactor * multiplier * moraleFactor * 100) / 100;
}

export function getLootValue(item: HoardItem, multiplier: number): number {
  const rarityMult = RARITY_MULTIPLIERS[item.rarity];
  return Math.round(item.baseValue * rarityMult * multiplier);
}

export function getPriceDisplay(property: Property, economy: EconomyState): PriceDisplay {
  const adjustedPrice = getAdjustedPrice(property.goldPrice, economy.currentMultiplier);
  const history = economy.priceHistory;
  const prevMultiplier =
    history.length >= 2 ? history[history.length - 2].multiplier : 1.0;
  const percentChange =
    Math.round(((economy.currentMultiplier - prevMultiplier) / prevMultiplier) * 100 * 10) / 10;
  const trend: PriceDisplay['trend'] =
    percentChange > 0.5 ? 'up' : percentChange < -0.5 ? 'down' : 'stable';
  return { adjustedPrice, trend, percentChange };
}
