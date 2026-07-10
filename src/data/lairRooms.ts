export interface LairRoom {
  id: string;
  name: string;
  cost: number;
  icon: string;
  description: string;
  effectSummary: string;
}

export const LAIR_ROOMS: LairRoom[] = [
  {
    id: 'kobold-barracks',
    name: 'Kobold Barracks',
    cost: 80,
    icon: '🪖',
    description: 'A proper bunk-and-mess hall carved into the rock. Your kobolds finally have somewhere to sleep that isn\'t your hoard pile.',
    effectSummary: 'On build: all kobolds +10 morale. Each evening: all kobolds +5 morale.',
  },
  {
    id: 'guard-post',
    name: 'Guard Post',
    cost: 100,
    icon: '🛡️',
    description: 'A fortified watchpost manned by your sharpest-eyed kobolds, covering every approach to the lair. No hero party sneaks in unscathed.',
    effectSummary: 'Auto-raid gold loss reduced by 50%.',
  },
  {
    id: 'trophy-hall',
    name: 'Trophy Hall',
    cost: 120,
    icon: '🏆',
    description: 'Skulls, banners, and the remnants of those who dared challenge you — displayed for all to see and fear. Word spreads quickly.',
    effectSummary: '+1 Dread per 5 hoard items held, recalculated each evening.',
  },
  {
    id: 'treasure-vault',
    name: 'Treasure Vault',
    cost: 150,
    icon: '🔒',
    description: 'A reinforced vault of enchanted stone. Kobolds work harder knowing the gold is secure — and that you can see exactly how much is missing.',
    effectSummary: 'Kobold gross income +10%.',
  },
];
