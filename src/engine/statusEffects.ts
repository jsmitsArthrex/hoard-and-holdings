import type { StatusEffect } from '../types';

export function clearExpiredEffects(
  effects: StatusEffect[],
  currentDay: number,
): StatusEffect[] {
  return effects.filter(e => e.expiresOnDay > currentDay);
}

export function getModifier(effects: StatusEffect[], stat: string): number {
  return effects
    .filter(e => e.affectedStat === stat)
    .reduce((sum, e) => sum + e.modifier, 0);
}

export function makeStatusEffect(
  partial: Omit<StatusEffect, 'id'>,
): StatusEffect {
  return { ...partial, id: `fx-${Date.now()}-${Math.random().toString(36).slice(2, 7)}` };
}
