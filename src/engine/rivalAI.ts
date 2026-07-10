import type { Rival, KoboldEmployee } from '../types';
import { districts } from '../data/districts';

export interface RivalAIResult {
  rivalActions: string[];
  updatedRivalPropertyIds: Map<number, string[]>;
  poachedKoboldIds: string[];
  poachedKoboldsByRivalId: Map<number, KoboldEmployee>;
}

export function runRivalAI(
  rivals: Rival[],
  playerPropertyIds: string[],
  kobolds: KoboldEmployee[],
  currentDay: number,
  aggressionMultiplier = 1.0,
): RivalAIResult {
  const allProperties = districts.flatMap(d => d.properties);
  const playerSet = new Set(playerPropertyIds);
  const allRivalOwnedIds = new Set(rivals.flatMap(r => r.propertyIds));

  const unownedIds = allProperties
    .filter(p => !playerSet.has(p.id) && !allRivalOwnedIds.has(p.id))
    .map(p => p.id);

  const rivalActions: string[] = [];
  const updatedRivalPropertyIds = new Map<number, string[]>();
  const poachedKoboldIds: string[] = [];
  const poachedKoboldsByRivalId = new Map<number, KoboldEmployee>();

  const available = [...unownedIds];
  const koboldPool = [...kobolds];

  rivals.forEach(rival => {
    updatedRivalPropertyIds.set(rival.id, [...rival.propertyIds]);

    const isSabotaged =
      rival.sabotagedUntilDay !== undefined && rival.sabotagedUntilDay > currentDay;

    if (!isSabotaged && available.length > 0 && Math.random() < 0.15 * aggressionMultiplier) {
      const idx = Math.floor(Math.random() * available.length);
      const propId = available[idx];
      available.splice(idx, 1);
      updatedRivalPropertyIds.get(rival.id)!.push(propId);
      const prop = allProperties.find(p => p.id === propId);
      if (prop) {
        rivalActions.push(`${rival.name} seized ${prop.name}!`);
      }
    }

    if (!rival.poachedKobold && koboldPool.length > 0 && Math.random() < 0.05) {
      const poachablePool = koboldPool.filter(k => k.trait?.effect !== 'poachImmune');
      if (poachablePool.length > 0) {
        const idx = Math.floor(Math.random() * poachablePool.length);
        const target = poachablePool[idx];
        const poolIdx = koboldPool.indexOf(target);
        koboldPool.splice(poolIdx, 1);
        poachedKoboldIds.push(target.id);
        poachedKoboldsByRivalId.set(rival.id, target);
        rivalActions.push(`${rival.name} lured ${target.name} away from your colony!`);
      }
    }
  });

  return { rivalActions, updatedRivalPropertyIds, poachedKoboldIds, poachedKoboldsByRivalId };
}
