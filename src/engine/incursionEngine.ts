import type { ActiveIncursion, StatusEffect } from '../types';
import { heroTiers } from '../data/heroParties';
import { getModifier } from './statusEffects';

export function shouldSpawnIncursion(
  dread: number,
  statusEffects: StatusEffect[],
  spawnChanceReduction: number = 0,
): boolean {
  let spawnChance = dread / 200;
  if (dread > 75) spawnChance *= 2;
  spawnChance += getModifier(statusEffects, 'heroSpawnBonus');
  spawnChance = Math.max(0, spawnChance - spawnChanceReduction);
  return Math.random() < Math.min(spawnChance, 0.95);
}

export function createIncursion(ageTier: 1 | 2 | 3 | 4 | 5, day: number): ActiveIncursion {
  const tierOptions: (1 | 2 | 3 | 4)[] = (() => {
    if (ageTier === 1) return [1];
    if (ageTier === 2) return [1, 2];
    if (ageTier === 3) return [2, 3];
    return [3, 4];
  })();
  const tier = tierOptions[Math.floor(Math.random() * tierOptions.length)] as 1 | 2 | 3 | 4;
  const tierDef = heroTiers.find(t => t.tier === tier)!;
  const rep = tierDef.representatives[Math.floor(Math.random() * tierDef.representatives.length)];
  return {
    id: `inc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    partyName: `${rep.name}'s Party`,
    tier,
    daySpawned: day,
  };
}
