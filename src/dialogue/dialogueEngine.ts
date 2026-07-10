import { speechStyles, getSpeciesKey } from './speechStyles';
import type { SpeciesKey } from './speechStyles';
import type { DialogueContext, DialogueTree, NpcRole, ResolvedDialogue } from './types';

import { realEstateAgentTree }        from './trees/realEstateAgent';
import { koboldTempAgencyTree }       from './trees/koboldTempAgency';
import { dragonbornBankerTree }       from './trees/dragonbornBanker';
import { elvenLawyerTree }            from './trees/elvenLawyer';
import { dragonMotelInnkeeperTree }   from './trees/dragonMotelInnkeeper';
import { rivalDragonNegotiationTree } from './trees/rivalDragonNegotiation';

const roleToTree: Record<NpcRole, DialogueTree> = {
  realEstate:    realEstateAgentTree,
  koboldAgency:  koboldTempAgencyTree,
  banker:        dragonbornBankerTree,
  arcaneLawyer:  elvenLawyerTree,
  innkeeper:     dragonMotelInnkeeperTree,
  rivalBodyguard: rivalDragonNegotiationTree,
};

type ContextValue = string | number | undefined;

function getContextValue(context: DialogueContext, key: string): ContextValue {
  return (context as unknown as Record<string, ContextValue>)[key];
}

function evaluateCondition(condStr: string, context: DialogueContext): boolean {
  const ops = ['>=', '<=', '>', '<', '=='] as const;
  for (const op of ops) {
    const idx = condStr.indexOf(op);
    if (idx === -1) continue;
    const key   = condStr.slice(0, idx).trim();
    const right = Number(condStr.slice(idx + op.length).trim());
    const left  = Number(getContextValue(context, key) ?? 0);
    if (isNaN(left) || isNaN(right)) return false;
    switch (op) {
      case '>':  return left > right;
      case '<':  return left < right;
      case '>=': return left >= right;
      case '<=': return left <= right;
      case '==': return left === right;
    }
  }
  return false;
}

function evaluateConditions(condBlock: string, context: DialogueContext): boolean {
  return condBlock.split(',').every((c) => evaluateCondition(c.trim(), context));
}

/**
 * Interpolates all {variables} from context and evaluates {condition: text} blocks.
 */
export function resolveTemplate(template: string, context: DialogueContext): string {
  let text = template;

  // Pass 1: substitute simple {varName} tokens (no operators, no colon)
  text = text.replace(/\{([a-zA-Z]\w*)\}/g, (_match, key) => {
    const val = getContextValue(context, key);
    return val !== undefined ? String(val) : _match;
  });

  // Pass 2: evaluate {condition(s): display text} blocks — up to 3 nesting levels
  for (let i = 0; i < 3; i++) {
    text = text.replace(/\{([^{}:,][^{}:]*):([^{}]*)\}/g, (_match, conds, body) => {
      return evaluateConditions(conds.trim(), context) ? body : '';
    });
  }

  // Clean up multiple spaces / leading-trailing whitespace left by removed blocks
  return text.replace(/\s{2,}/g, ' ').trim();
}

/**
 * Applies the speech style of a species to a resolved text string.
 */
export function applySpeciesInflection(text: string, species: string): string {
  const key: SpeciesKey = getSpeciesKey(species);
  const style = speechStyles[key];
  if (!style) return text;

  let result = text;
  for (const sub of style.wordSubstitutions) {
    result = result.replace(sub.from, sub.to);
  }
  if (style.sentenceTransform) {
    result = style.sentenceTransform(result);
  }
  return result;
}

/**
 * Returns a fully resolved dialogue node with inflected NPC line and resolved player options.
 */
export function getDialogueLine(
  role: NpcRole,
  node: string,
  context: DialogueContext,
  species: string,
): ResolvedDialogue {
  const tree = roleToTree[role];
  const treeNode = tree?.[node] ?? tree?.['farewell'];

  if (!treeNode) {
    return {
      npcLine: '...',
      playerOptions: [],
    };
  }

  const rawLine    = resolveTemplate(treeNode.npcLine, context);
  const npcLine    = applySpeciesInflection(rawLine, species);
  const playerOptions = treeNode.playerOptions.map((opt) => ({
    label:    resolveTemplate(opt.label, context),
    nextNode: opt.nextNode,
    effect:   opt.effect,
  }));

  return { npcLine, playerOptions };
}

/**
 * Picks a random catchphrase from the species speech style.
 */
export function getSpeciesCatchphrase(species: string): string {
  const key   = getSpeciesKey(species);
  const style = speechStyles[key];
  const pool  = style?.catchphrases ?? [];
  return pool[Math.floor(Math.random() * pool.length)] ?? '';
}

/**
 * Returns an emotional tell string for a species + emotion combination.
 */
export function getEmotionalTell(species: string, emotion: 'happy' | 'nervous' | 'greedy' | 'suspicious'): string {
  const key   = getSpeciesKey(species);
  const style = speechStyles[key];
  return style?.emotionalTells[emotion] ?? '';
}
