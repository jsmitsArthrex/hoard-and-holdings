import type { Rival, PendingEvent, StatusEffect, CouncilVoteResult } from '../types';
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

export interface PlayerCouncilMotion {
  id: string;
  name: string;
  icon: string;
  description: string;
  effectSummary: string;
}

export const PLAYER_COUNCIL_MOTIONS: PlayerCouncilMotion[] = [
  {
    id: 'kobold-labour-reform',
    name: 'Kobold Labour Reform',
    icon: '🪖',
    description:
      'You propose a sweeping reform of kobold labour contracts, citing unspecified productivity concerns. Passage would freeze all kobold wages for 5 days, including any seasonal adjustments.',
    effectSummary: 'Kobold wage costs −50% for 5 days.',
  },
  {
    id: 'hoard-authenticity-act',
    name: 'Hoard Authenticity Act',
    icon: '📋',
    description:
      'You table a certification scheme for dragon hoards, backed by a very official-looking wax seal you invented this morning. Passage grants a 15% auction premium on all hoard sales for 8 days.',
    effectSummary: 'Auction sell prices +15% for 8 days.',
  },
  {
    id: 'territorial-boundary-charter',
    name: 'Territorial Boundary Charter',
    icon: '🗺️',
    description:
      'You propose formalising territorial boundaries with a binding charter. Passage would prohibit rivals from acquiring new properties anywhere in the realm for 5 days while the maps are "professionally surveyed."',
    effectSummary: 'Rivals cannot acquire new properties for 5 days.',
  },
  {
    id: 'dragon-solidarity-tax',
    name: 'Dragon Solidarity Tax',
    icon: '💰',
    description:
      'You propose a one-time solidarity contribution from all council members toward "mutual draconic prosperity." The exact beneficiary is suspiciously unspecified. Passage collects gold from each rival immediately.',
    effectSummary: 'Collect 30g from allies (relationship > 50) and 10g from rivals.',
  },
  {
    id: 'adventurer-amnesty',
    name: 'Adventurer Amnesty',
    icon: '🕊️',
    description:
      'You propose a seasonal truce with the Adventurers\' Guild, citing "diplomatic fatigue" and "an excess of funerals." Passage halts all hero incursions for 5 days.',
    effectSummary: 'No hero incursions for 5 days.',
  },
  {
    id: 'rival-audit',
    name: 'Rival Audit',
    icon: '🔍',
    description:
      'You call for a surprise financial audit of a randomly selected council member. The auditor is, coincidentally, you. Passage forces one rival to disgorge 20g and damages their standing with the other council members.',
    effectSummary: 'One random rival loses 20g equivalent (relationship −10) and all other rivals lose 5 relationship with each other.',
  },
];

export function getPlayerCouncilMotion(id: string): PlayerCouncilMotion | undefined {
  return PLAYER_COUNCIL_MOTIONS.find(m => m.id === id);
}

const RIVAL_AYE_FLAVOURS = [
  'apparently impressed by the audacity.',
  'perhaps hoping to claim credit later.',
  'with the enthusiasm of someone who misread the motion.',
  'after a long, calculating pause.',
  'while refusing to make eye contact with anyone.',
];

const RIVAL_NAY_FLAVOURS = [
  'with barely concealed delight.',
  'citing three regulations that do not exist.',
  'before the proposal was even finished.',
  'and then wrote something in a small notebook.',
  'in a tone that suggested personal satisfaction.',
];

export function simulateRivalVotesForPlayerMotion(
  rivals: Rival[],
): CouncilVoteResult['rivalVotes'] {
  return rivals.map(r => {
    const ayeProbability = r.relationship > 50 ? 0.6 : 0.4;
    const votedAye = Math.random() < ayeProbability;
    const flavourPool = votedAye ? RIVAL_AYE_FLAVOURS : RIVAL_NAY_FLAVOURS;
    const flavour = `${r.name} votes ${votedAye ? 'Aye' : 'Nay'}, ${
      flavourPool[Math.floor(Math.random() * flavourPool.length)]
    }`;
    return { name: r.name, votedAye, flavour };
  });
}
