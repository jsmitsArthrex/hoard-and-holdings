import type { NpcRole } from '../data/npcTemplates';

export type { NpcRole };

export interface DialogueContext {
  playerName: string;
  dragonBreed: string;
  gold: number;
  dreadRating: number;
  currentDay: number;
  dragonAge: number;
  propertyName?: string;
  price?: number;
  koboldName?: string;
  rivalName?: string;
  economyMultiplier?: number;
  relationshipScore?: number;
}

export interface PlayerOption {
  label: string;
  nextNode: string;
  effect?: string;
}

export interface DialogueNode {
  npcLine: string;
  playerOptions: PlayerOption[];
}

export type DialogueTree = Record<string, DialogueNode>;

export interface ResolvedOption {
  label: string;
  nextNode: string;
  effect?: string;
}

export interface ResolvedDialogue {
  npcLine: string;
  playerOptions: ResolvedOption[];
}
