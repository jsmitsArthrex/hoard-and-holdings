import type { GameState } from '../types';

export interface TitleDef {
  id: string;
  label: string;
  description: string;
  check: (state: GameState) => boolean;
}

export const TITLE_DEFS: TitleDef[] = [
  {
    id: 'landlord',
    label: 'The Landlord',
    description: 'Own 10 or more properties.',
    check: (s) => s.playerPropertyIds.length >= 10,
  },
  {
    id: 'kobold_shepherd',
    label: 'The Kobold Shepherd',
    description: 'Have 5 or more kobolds, all with morale ≥ 70.',
    check: (s) => s.kobolds.length >= 5 && s.kobolds.every(k => k.morale >= 70),
  },
  {
    id: 'dreaded',
    label: 'The Dreaded',
    description: 'Reach a Dread score of 75 or higher.',
    check: (s) => s.dread >= 75,
  },
  {
    id: 'wyrm_of_commerce',
    label: 'The Wyrm of Commerce',
    description: 'Sell 10 or more hoard items at auction.',
    check: (s) => s.itemsSold >= 10,
  },
  {
    id: 'undefeated',
    label: 'The Undefeated',
    description: 'Defeat 10 or more adventurers without a single combat loss.',
    check: (s) => s.adventurersDefeated >= 10 && s.combatLosses === 0,
  },
  {
    id: 'peacemaker',
    label: 'The Peacemaker',
    description: 'Bring all rival relationships to 70 or above.',
    check: (s) => s.rivals.length > 0 && s.rivals.every(r => r.relationship >= 70),
  },
];
