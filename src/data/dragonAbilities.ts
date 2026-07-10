export interface DragonAbility {
  id: string;
  name: string;
  icon: string;
  description: string;
  minAgeTier: number;
  effectSummary: string;
}

export const DRAGON_ABILITIES: DragonAbility[] = [
  {
    id: 'intimidate',
    name: 'Territorial Roar',
    icon: '😤',
    minAgeTier: 1,
    description: 'Unleash a bone-rattling roar.',
    effectSummary: '+8 Dread. Chosen rival relationship −10.',
  },
  {
    id: 'breath-cache',
    name: 'Searing Cache',
    icon: '🔥',
    minAgeTier: 2,
    description: 'Burn an adventurer camp, claiming their supplies.',
    effectSummary: 'Gain gold equal to 20 + ageTier×15. Adds 1 random hoard item.',
  },
  {
    id: 'delay-incursion',
    name: 'Dreadful Presence',
    icon: '🌑',
    minAgeTier: 3,
    description: 'Your aura delays all approaching threats.',
    effectSummary: 'All active incursions have their tier reduced by 1 (min 1) until resolved.',
  },
  {
    id: 'demand-tribute',
    name: 'Demand Tribute',
    icon: '👑',
    minAgeTier: 4,
    description: 'Impose your will on a rival.',
    effectSummary: 'Force chosen rival to pay you gold (propertyIds.length × 20). On refusal (relationship<30): rival relationship −25, you get nothing.',
  },
  {
    id: 'ancient-terror',
    name: 'Ancient Terror',
    icon: '🐉',
    minAgeTier: 5,
    description: 'Your legend eclipses all others.',
    effectSummary: '+15 Dread. All rival relationships −5. All active incursions auto-dismissed.',
  },
];
