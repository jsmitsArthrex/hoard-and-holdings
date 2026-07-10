import type { Rival, PendingEvent, StatusEffect } from '../types';
import { makeStatusEffect } from './statusEffects';

export interface CouncilMotion {
  id: string;
  name: string;
  icon: string;
  description: string;
  ayeSummary: string;
  statusEffectOnPass: ((day: number) => StatusEffect) | null;
  solidarityOnPass: boolean;
}

export const COUNCIL_MOTIONS: CouncilMotion[] = [
  {
    id: 'adventurer-licensing',
    name: 'Adventurer Licensing Fee',
    icon: '📜',
    description:
      'The Council proposes imposing a mandatory guild tax on all adventuring parties operating in dragon territories. Passage would discourage heroes from venturing into the region for a fortnight.',
    ayeSummary: 'Hero spawn chance −15% for 15 days.',
    statusEffectOnPass: (day: number): StatusEffect =>
      makeStatusEffect({
        name: 'Adventurer Licensing Fee',
        icon: '📜',
        description: 'Guild taxes have discouraged adventuring activity in the region.',
        affectedStat: 'heroSpawnBonus',
        modifier: -0.15,
        expiresOnDay: day + 15,
      }),
    solidarityOnPass: false,
  },
  {
    id: 'property-tax-exemption',
    name: 'Property Tax Exemption',
    icon: '🏛️',
    description:
      'The Council proposes a temporary waiver on civic property levies for all dragon-owned acquisitions. Passage would reduce the cost of seizing new holdings across the realm.',
    ayeSummary: 'Property buy prices −20% for 10 days.',
    statusEffectOnPass: (day: number): StatusEffect =>
      makeStatusEffect({
        name: 'Property Tax Exemption',
        icon: '🏛️',
        description: 'Council decree waives property levies on dragon acquisitions.',
        affectedStat: 'councilVoteBonus',
        modifier: -0.2,
        expiresOnDay: day + 10,
      }),
    solidarityOnPass: false,
  },
  {
    id: 'free-market-declaration',
    name: 'Free Market Declaration',
    icon: '📈',
    description:
      'The Council proposes dissolving all territorial acquisition restrictions. Passage would unleash unfettered competition — rival dragons will greatly accelerate their property grabs.',
    ayeSummary: 'Rivals acquire properties twice as aggressively for 10 days.',
    statusEffectOnPass: (day: number): StatusEffect =>
      makeStatusEffect({
        name: 'Free Market Declaration',
        icon: '📈',
        description: 'Deregulated markets send rival dragons into a buying frenzy.',
        affectedStat: 'rivalAggressionMultiplier',
        modifier: 1.0,
        expiresOnDay: day + 10,
      }),
    solidarityOnPass: false,
  },
  {
    id: 'dragon-solidarity',
    name: 'Dragon Solidarity Pact',
    icon: '🤝',
    description:
      'The Council proposes a binding solidarity accord among all dragon lords. Passage would strengthen inter-dragon relations and foster cooperative territory stewardship across the realm.',
    ayeSummary: 'All rival relationships +10.',
    statusEffectOnPass: null,
    solidarityOnPass: true,
  },
];

export function getCouncilMotion(id: string): CouncilMotion | undefined {
  return COUNCIL_MOTIONS.find(m => m.id === id);
}

export function pickRandomCouncilMotion(): CouncilMotion {
  return COUNCIL_MOTIONS[Math.floor(Math.random() * COUNCIL_MOTIONS.length)];
}

export function buildCouncilVotePendingEvent(motion: CouncilMotion): PendingEvent {
  return {
    defId: 'council_vote',
    councilMotionId: motion.id,
    title: `Dragon Council — ${motion.name}`,
    icon: motion.icon,
    description: motion.description,
    effectSummary: `If passed: ${motion.ayeSummary}`,
    isPassive: false,
    choices: [
      { label: 'Vote Aye', description: 'Support the motion.' },
      { label: 'Vote Nay', description: 'Oppose the motion.' },
    ],
  };
}

export function simulateRivalVotes(
  rivals: Rival[],
  playerVoteAye: boolean,
): Array<{ name: string; votedAye: boolean }> {
  return rivals.map(r => {
    const alignProbability = r.relationship > 50 ? 0.6 : 0.4;
    const sameAsPlayer = Math.random() < alignProbability;
    const votedAye = sameAsPlayer ? playerVoteAye : !playerVoteAye;
    return { name: r.name, votedAye };
  });
}
