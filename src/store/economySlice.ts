import type { StateCreator } from 'zustand';
import { tickEconomy as computeEconomyTick } from '../engine/economyEngine';
import type { MarketCondition, PriceHistoryEntry } from './types';

export interface EconomySliceState {
  currentMultiplier: number;
  activeEventId: string | null;
  marketCondition: MarketCondition;
  priceHistory: PriceHistoryEntry[];
}

export interface EconomySliceActions {
  tickEconomy: (day: number) => void;
}

export type EconomySlice = EconomySliceState & EconomySliceActions;

export const createEconomySlice: StateCreator<EconomySlice, [], [], EconomySlice> = (set) => ({
  currentMultiplier: 1.0,
  activeEventId: null,
  marketCondition: 'stable',
  priceHistory: [],

  tickEconomy: (day: number) => {
    const update = computeEconomyTick(day);
    set((state) => ({
      currentMultiplier: update.multiplier,
      activeEventId: update.activeEvent?.id ?? null,
      marketCondition: update.marketCondition,
      priceHistory: [
        ...state.priceHistory,
        { day, multiplier: update.multiplier, marketCondition: update.marketCondition },
      ],
    }));
  },
});
