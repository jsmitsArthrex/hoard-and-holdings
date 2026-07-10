import type { PropertyUpgradeId } from '../types';

export interface UpgradeDef {
  id: PropertyUpgradeId;
  name: string;
  icon: string;
  cost: number;
  description: string;
  effectSummary: string;
  requiresLairSize?: 'medium' | 'large';
  minDaysOwned: number;
}

export const PROPERTY_UPGRADES: UpgradeDef[] = [
  {
    id: 'deep-mine',
    name: 'Deep Mine Shaft',
    icon: '⛏️',
    cost: 120,
    description: 'A network of tunnels dug deep into the bedrock, exposing rich ore veins for your miners to exploit.',
    effectSummary: 'Miners assigned here earn +50% gross income.',
    minDaysOwned: 5,
  },
  {
    id: 'watchtower',
    name: 'Watchtower',
    icon: '🗼',
    cost: 100,
    description: 'A tall stone tower staffed with keen-eyed scouts who warn of approaching adventurer parties.',
    effectSummary: 'Incursion spawn chance −20% globally while you own this.',
    minDaysOwned: 3,
  },
  {
    id: 'fortified-walls',
    name: 'Fortified Walls',
    icon: '🧱',
    cost: 140,
    description: 'Thick stone ramparts and iron-banded gates that make a raiding adventurer think twice.',
    effectSummary: 'Auto-raid gold loss reduced by 40%.',
    minDaysOwned: 5,
    requiresLairSize: 'medium',
  },
  {
    id: 'grand-hall',
    name: 'Grand Hall',
    icon: '🏛️',
    cost: 200,
    description: 'An imposing audience chamber that broadcasts your dominance across the region.',
    effectSummary: '+2 Dread each evening while you own this.',
    minDaysOwned: 7,
    requiresLairSize: 'large',
  },
];
