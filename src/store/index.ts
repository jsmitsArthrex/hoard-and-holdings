import { create } from 'zustand';
import { createEconomySlice } from './economySlice';
import type { EconomySlice } from './economySlice';

export type RootState = EconomySlice;

export const useStore = create<RootState>()((...args) => ({
  ...createEconomySlice(...args),
}));

export type { EconomySlice };
export * from './types';
