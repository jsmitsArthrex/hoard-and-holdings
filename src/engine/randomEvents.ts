import type { GameState, PendingEvent } from '../types';
import type { StatusEffect } from '../types';
import { makeStatusEffect } from './statusEffects';
import { LOOT_TABLE } from './gameClock';

export type StateSnap = Pick<
  GameState,
  'dread' | 'kobolds' | 'rivals' | 'hoardItems' | 'gold' | 'day' | 'dragon' |
  'playerPropertyIds' | 'adventurersDefeated' | 'activeWantedPoster'
>;

export interface EventOutcome {
  goldDelta?: number;
  dreadDelta?: number;
  allKoboldMoraleDelta?: number;
  specificKoboldId?: string;
  specificKoboldMoraleDelta?: number;
  statusEffect?: StatusEffect;
  hoardItemAdd?: { name: string; baseValue: number };
  hoardItemRemoveRandom?: boolean;
  rivalRelDelta?: { rivalId: number; delta: number };
  logMessage: string;
  effectSummary: string;
}

export interface RandomEventChoice {
  label: string;
  description: string;
  apply: (state: StateSnap) => EventOutcome;
}

export interface RandomEventDef {
  id: string;
  title: string;
  icon: string;
  weight: number;
  canFire?: (state: StateSnap) => boolean;
  passive?: (state: StateSnap) => { description: string; outcome: EventOutcome };
  choices?: RandomEventChoice[];
  getDescription?: (state: StateSnap) => string;
}

function pickRandomKoboldId(state: StateSnap): string | undefined {
  if (state.kobolds.length === 0) return undefined;
  return state.kobolds[Math.floor(Math.random() * state.kobolds.length)].id;
}

function pickRandomRivalId(state: StateSnap): number | undefined {
  if (state.rivals.length === 0) return undefined;
  return state.rivals[Math.floor(Math.random() * state.rivals.length)].id;
}

function randomLootItem() {
  return LOOT_TABLE[Math.floor(Math.random() * LOOT_TABLE.length)];
}

export const ALL_RANDOM_EVENTS: RandomEventDef[] = [
  // ── PASSIVE EVENTS ─────────────────────────────────────────────────────────

  {
    id: 'earthquake',
    title: 'Catastrophic Tremor',
    icon: '🌋',
    weight: 3,
    passive: (state) => {
      const hasItem = state.hoardItems.length > 0;
      const itemName = hasItem
        ? state.hoardItems[Math.floor(Math.random() * state.hoardItems.length)].name
        : null;
      return {
        description:
          'The earth shakes with terrifying force! Cracks split your lair floor and dust rains from the ceiling. Your kobolds scatter in panic, and something precious tumbles into a fissure.',
        outcome: {
          allKoboldMoraleDelta: -15,
          hoardItemRemoveRandom: hasItem,
          logMessage: itemName
            ? `Earthquake! Kobold morale -15. ${itemName} lost to a fissure.`
            : `Earthquake! Kobold morale -15. Fortunately your hoard survived.`,
          effectSummary: hasItem
            ? `All kobold morale −15. Lost ${itemName} to the cracks.`
            : 'All kobold morale −15.',
        },
      };
    },
  },

  {
    id: 'bardBallad',
    title: 'A Bard Takes Notice',
    icon: '🎵',
    weight: 6,
    passive: (state) => {
      const fearsome = state.dread >= 50;
      return {
        description: fearsome
          ? `A renowned bard has composed "The Ballad of ${state.dragon?.name ?? 'the Terror"'} — a haunting epic of your devastating reign. Travelers dare not approach your mountains.`
          : `A wandering bard has written "The Bumbling of ${state.dragon?.name ?? 'the Dragon"'} — a comedic ditty mocking your failed schemes. It is, unfortunately, quite catchy.`,
        outcome: {
          dreadDelta: fearsome ? 5 : -5,
          logMessage: fearsome
            ? 'Bard ballad of terror spreads! Dread +5.'
            : 'Bard ballad of bumbling spreads! Dread −5.',
          effectSummary: fearsome ? 'Dread +5 (ballad of terror).' : 'Dread −5 (ballad of bumbling).',
        },
      };
    },
  },

  {
    id: 'rivalInsult',
    title: 'Rival Mockery',
    icon: '🗣️',
    weight: 5,
    canFire: (state) => state.rivals.length > 0,
    passive: (state) => {
      const rival = state.rivals[Math.floor(Math.random() * state.rivals.length)];
      return {
        description: `${rival.name} has been spreading vicious rumours about your lair at the Dragon Council. "Barely a cave," they were overheard saying. "The hoard is mostly receipts and old bones." Outrageous.`,
        outcome: {
          dreadDelta: -3,
          rivalRelDelta: { rivalId: rival.id, delta: -10 },
          logMessage: `${rival.name} mocked your lair publicly! Dread −3, relationship −10.`,
          effectSummary: `Dread −3. Relationship with ${rival.name} −10.`,
        },
      };
    },
  },

  {
    id: 'dragonFlu',
    title: 'The Dragon Flu',
    icon: '🤧',
    weight: 3,
    passive: (state) => ({
      description: `You have contracted a particularly undignified ailment: Dragon Flu. Your scales itch, your fire breath sputters, and your roar comes out as an embarrassing squeak. Combat effectiveness reduced for 3 days.`,
      outcome: {
        statusEffect: makeStatusEffect({
          name: 'Dragon Flu',
          icon: '🤧',
          description: 'Combat rolls −4',
          affectedStat: 'combatBonus',
          modifier: -4,
          expiresOnDay: state.day + 3,
        }),
        logMessage: 'Dragon Flu! Combat rolls −4 for 3 days.',
        effectSummary: 'Combat roll modifier −4 for 3 days.',
      },
    }),
  },

  {
    id: 'koboldGenius',
    title: 'A Flash of Kobold Brilliance',
    icon: '💡',
    weight: 5,
    canFire: (state) => state.kobolds.length > 0,
    passive: (state) => {
      const kobold = state.kobolds[Math.floor(Math.random() * state.kobolds.length)];
      return {
        description: `${kobold.name} has invented an ingenious new trap system using materials they found in the back of the lair. You didn't understand a word of the explanation, but the results speak for themselves.`,
        outcome: {
          specificKoboldId: kobold.id,
          specificKoboldMoraleDelta: 15,
          logMessage: `${kobold.name} invented a better trap system! Morale +15.`,
          effectSummary: `${kobold.name}'s morale +15 permanently.`,
        },
      };
    },
  },

  {
    id: 'lostTraveler',
    title: 'Lost Traveler',
    icon: '🧭',
    weight: 6,
    passive: () => ({
      description:
        'A wealthy merchant took a wrong turn and wandered into your mountain pass. Upon recognising your silhouette, they immediately "donated" their coin purse in exchange for their continued survival. A mutually beneficial arrangement.',
      outcome: {
        goldDelta: 20,
        logMessage: 'Lost traveler donated 20 gold for safe passage.',
        effectSummary: '+20 gold.',
      },
    }),
  },

  {
    id: 'badHarvest',
    title: 'Poor Harvest Season',
    icon: '🌾',
    weight: 4,
    canFire: (state) => state.kobolds.length > 0,
    passive: () => ({
      description:
        'The surrounding farmlands have suffered a terrible harvest. Grain is scarce and expensive. Your kobolds, already subsisting on cave mushrooms and dubious mystery stew, are understandably displeased.',
      outcome: {
        allKoboldMoraleDelta: -10,
        logMessage: 'Poor harvest! All kobold morale −10.',
        effectSummary: 'All kobold morale −10.',
      },
    }),
  },

  {
    id: 'goodHarvest',
    title: 'Bountiful Harvest',
    icon: '🌻',
    weight: 4,
    canFire: (state) => state.kobolds.length > 0,
    passive: () => ({
      description:
        'An unusually bountiful harvest has flooded the local markets with affordable food. Your kobolds have been secretly trading their scavenged copper pieces for real vegetables. Morale is up. You choose not to investigate further.',
      outcome: {
        allKoboldMoraleDelta: 10,
        logMessage: 'Bountiful harvest! All kobold morale +10.',
        effectSummary: 'All kobold morale +10.',
      },
    }),
  },

  {
    id: 'koboldParty',
    title: 'Mushroom Wine Discovery',
    icon: '🍄',
    weight: 5,
    canFire: (state) => state.kobolds.length > 0,
    passive: () => ({
      description:
        'Your kobolds discovered a cache of extremely potent mushroom wine in a forgotten tunnel. You chose to look the other way. They return the next morning slightly green but in remarkably good spirits.',
      outcome: {
        allKoboldMoraleDelta: 5,
        logMessage: 'Kobolds found mushroom wine! All morale +5.',
        effectSummary: 'All kobold morale +5.',
      },
    }),
  },

  {
    id: 'heroRumor',
    title: 'Rumour of Dragon Gold',
    icon: '📜',
    weight: 4,
    passive: (state) => ({
      description:
        'A tavern braggart has been spinning wild tales of your hoard\'s impossible riches. Three separate adventuring parties are now reportedly heading your direction, maps in hand and confidence tragically misplaced.',
      outcome: {
        statusEffect: makeStatusEffect({
          name: 'Hero Rumour',
          icon: '📜',
          description: 'Hero spawn +10%',
          affectedStat: 'heroSpawnBonus',
          modifier: 0.1,
          expiresOnDay: state.day + 3,
        }),
        logMessage: 'Hero rumour spreading! Spawn chance +10% for 3 days.',
        effectSummary: 'Hero spawn chance +10% for 3 days.',
      },
    }),
  },

  {
    id: 'diplomaticVisit',
    title: 'Unexpected Olive Branch',
    icon: '🕊️',
    weight: 4,
    canFire: (state) => state.rivals.length > 0,
    passive: (state) => {
      const rival = state.rivals[Math.floor(Math.random() * state.rivals.length)];
      return {
        description: `A well-dressed kobold messenger arrives bearing a letter from ${rival.name}. "Dearest colleague," it begins, with surprising sincerity. "Let us set aside our petty squabbles. Temporarily." A suspicious but welcome gesture.`,
        outcome: {
          rivalRelDelta: { rivalId: rival.id, delta: 15 },
          logMessage: `${rival.name} sent a diplomatic olive branch. Relationship +15.`,
          effectSummary: `Relationship with ${rival.name} +15.`,
        },
      };
    },
  },

  {
    id: 'kingdomDecree',
    title: 'Royal Decree of Tolerance',
    icon: '📋',
    weight: 3,
    passive: () => ({
      description:
        'The Kingdom has issued an official Royal Decree declaring you "Not An Immediate Threat, Probably." While this is faint praise, it does calm the local militias considerably. Adventurers find other dragons to harass for a while.',
      outcome: {
        dreadDelta: -8,
        logMessage: 'Royal Decree of Tolerance! Dread −8.',
        effectSummary: 'Dread −8.',
      },
    }),
  },

  {
    id: 'volcano',
    title: 'Volcanic Rumbling',
    icon: '🌋',
    weight: 4,
    canFire: (state) => state.kobolds.length > 0,
    passive: () => ({
      description:
        'Your mountain home has chosen today to remind everyone why it is called Dreadpeak. Ominous rumbling, sulphur fumes, and minor lava flows have your kobolds in a state of existential dread. On the bright side, your reputation improves.',
      outcome: {
        dreadDelta: 5,
        allKoboldMoraleDelta: -5,
        logMessage: 'Volcanic rumbling! Dread +5, kobold morale −5.',
        effectSummary: 'Dread +5. All kobold morale −5.',
      },
    }),
  },

  {
    id: 'ancientTreasure',
    title: 'Ancient Cache Discovered',
    icon: '📦',
    weight: 4,
    passive: () => {
      const item = randomLootItem();
      return {
        description:
          'While expanding your lair tunnels, a kobold struck a hidden chamber sealed since before the Third Age. Inside: the desiccated remains of a very unlucky adventurer, and their impressive equipment, now yours.',
        outcome: {
          hoardItemAdd: item,
          logMessage: `Ancient cache discovered! Found ${item.name}.`,
          effectSummary: `Added ${item.name} to your hoard.`,
        },
      };
    },
  },

  {
    id: 'koboldBrawl',
    title: 'Kobold Brawl Erupts',
    icon: '🥊',
    weight: 5,
    canFire: (state) => state.kobolds.length >= 2,
    passive: (state) => {
      const shuffled = [...state.kobolds].sort(() => Math.random() - 0.5);
      const a = shuffled[0];
      const b = shuffled[1];
      return {
        description: `${a.name} and ${b.name} have come to blows over something trivial — reportedly a dispute about whose turn it was to clean the treasure sorting chamber. You chose not to intervene. It resolved itself eventually. Mostly.`,
        outcome: {
          specificKoboldId: a.id,
          specificKoboldMoraleDelta: -10,
          allKoboldMoraleDelta: -3,
          logMessage: `Kobold brawl between ${a.name} and ${b.name}! Morale damage.`,
          effectSummary: `${a.name} morale −10. All kobolds morale −3.`,
        },
      };
    },
  },

  {
    id: 'dragonRumor',
    title: 'Tales of Your Deeds',
    icon: '🐉',
    weight: 6,
    passive: (state) => ({
      description: `Travelers in the nearest three kingdoms have been whispering about ${state.dragon?.name ?? 'you'}. The stories grow with each telling — by now you have apparently devoured twelve knights, bankrupted a duke, and personally caused a flood. None of this is accurate, but the fear is real.`,
      outcome: {
        dreadDelta: 4,
        logMessage: 'Dragon rumours spread! Dread +4.',
        effectSummary: 'Dread +4.',
      },
    }),
  },

  {
    id: 'merchantGuild',
    title: 'Merchant Guild Notice',
    icon: '🏛️',
    weight: 4,
    passive: (state) => ({
      description:
        'The Merchant Guild has issued an official market notice listing your lair\'s goods as "Authentically Looted — Provenance Guaranteed." Collectors and nobles are suddenly very interested. Prices tick upward.',
      outcome: {
        statusEffect: makeStatusEffect({
          name: 'Guild Notice',
          icon: '🏛️',
          description: 'Sell prices +15%',
          affectedStat: 'sellMultiplier',
          modifier: 0.15,
          expiresOnDay: state.day + 3,
        }),
        logMessage: 'Merchant Guild notice! Sell prices +15% for 3 days.',
        effectSummary: 'Sell prices +15% for 3 days.',
      },
    }),
  },

  {
    id: 'koboldFestival',
    title: 'Kobold Cultural Festival',
    icon: '🎉',
    weight: 5,
    canFire: (state) => state.kobolds.length > 0,
    passive: () => ({
      description:
        'Your kobolds have unilaterally declared today a cultural festival holiday. You were not consulted. They have been surprisingly enthusiastic, though you notice the larder is now suspiciously lighter and there are streamers everywhere.',
      outcome: {
        goldDelta: -5,
        allKoboldMoraleDelta: 8,
        logMessage: 'Kobold festival! Morale +8, but −5 gold (they raided the larder).',
        effectSummary: 'All kobold morale +8. −5 gold (larder raid).',
      },
    }),
  },

  {
    id: 'spyReport',
    title: 'Spy Returns with Intelligence',
    icon: '🕵️',
    weight: 4,
    passive: (state) => {
      const rival = state.rivals.length > 0
        ? state.rivals[Math.floor(Math.random() * state.rivals.length)]
        : null;
      return {
        description: rival
          ? `One of your kobold scouts returns with news: ${rival.name} has been overextending on property purchases and is reportedly short on gold. This information may prove useful. You feel slightly more terrifying just knowing it.`
          : 'Your kobold scouts return with a map of the surrounding region. No rival activity detected, which is either good news or very suspicious.',
        outcome: {
          dreadDelta: 2,
          logMessage: rival
            ? `Spy report on ${rival.name}: they are financially stretched. Dread +2.`
            : 'Spy report: no rival activity detected. Dread +2.',
          effectSummary: `Dread +2 (strategic knowledge is power).`,
        },
      };
    },
  },

  {
    id: 'ancientCurse',
    title: 'Ancient Curse Lifted',
    icon: '✨',
    weight: 3,
    passive: () => ({
      description:
        'A wandering hedge-witch has apparently reversed a decades-old curse that had been suppressing your reputation. You were unaware of the curse. You are now unsure whether to feel grateful or offended that it existed in the first place.',
      outcome: {
        dreadDelta: -5,
        logMessage: 'Ancient curse lifted! Dread −5 (it was suppressing you apparently).',
        effectSummary: 'Dread −5.',
      },
    }),
  },

  // ── CHOICE EVENTS ───────────────────────────────────────────────────────────

  {
    id: 'merchantCaravan',
    title: 'Wandering Merchant Arrives',
    icon: '🛻',
    weight: 5,
    getDescription: () =>
      'A hooded merchant of dubious credentials has appeared at the mouth of your lair. They claim to carry a rare and authentic artifact of great power. The price is steep but their collection is… intriguing.',
    choices: [
      {
        label: 'Buy for 50 gold',
        description: 'Purchase the rare artifact for your hoard.',
        apply: (state) => {
          if (state.gold < 50) {
            return {
              logMessage: 'Could not afford the merchant\'s artifact.',
              effectSummary: 'Not enough gold — merchant left empty-handed.',
            };
          }
          const item = randomLootItem();
          return {
            goldDelta: -50,
            hoardItemAdd: { name: `Rare: ${item.name}`, baseValue: Math.round(item.baseValue * 1.8) },
            logMessage: `Bought rare artifact "${item.name}" for 50 gold.`,
            effectSummary: `-50 gold. Added rare ${item.name} to hoard.`,
          };
        },
      },
      {
        label: 'Decline',
        description: 'Send the merchant away.',
        apply: () => ({
          logMessage: 'Declined the merchant\'s offer. They shuffled off, muttering.',
          effectSummary: 'Merchant departed. No effect.',
        }),
      },
    ],
  },

  {
    id: 'koboldStrike',
    title: 'Kobold Labour Action',
    icon: '✊',
    weight: 4,
    canFire: (state) => state.kobolds.length > 0,
    getDescription: (state) =>
      `Your kobolds have assembled outside your chamber holding signs that read "FAIR SCALES FOR ALL KOBOLDS" and "WE DESERVE BETTER MUSHROOMS." ${state.kobolds[0]?.name ?? 'Their spokesperson'} has presented formal demands.`,
    choices: [
      {
        label: 'Meet demands (+wages)',
        description: 'Agree to better conditions. Wages increase 10% for 10 days.',
        apply: (state) => ({
          statusEffect: makeStatusEffect({
            name: 'Kobold Demands Met',
            icon: '✊',
            description: 'Wages +10%',
            affectedStat: 'wageCostModifier',
            modifier: 0.1,
            expiresOnDay: state.day + 10,
          }),
          logMessage: 'Met kobold demands. Wages +10% for 10 days.',
          effectSummary: 'Kobold wages +10% for 10 days. Morale maintained.',
        }),
      },
      {
        label: 'Refuse (morale hit)',
        description: 'Dismiss their demands. All kobold morale −20.',
        apply: () => ({
          allKoboldMoraleDelta: -20,
          logMessage: 'Refused kobold demands! All kobold morale −20.',
          effectSummary: 'All kobold morale −20.',
        }),
      },
    ],
  },

  {
    id: 'taxCollector',
    title: 'Royal Tax Collector',
    icon: '📊',
    weight: 5,
    getDescription: (state) => {
      const tax = Math.max(5, Math.round(state.gold * 0.05));
      return `A nervous Kingdom tax collector has arrived at your lair entrance, clutching a scroll. They are officially requesting ${tax} gold in "Dragon Activity Levies." They look extremely uncomfortable but remarkably determined.`;
    },
    choices: [
      {
        label: 'Pay the tax (Dread −2)',
        description: 'Comply with the Kingdom\'s demand. Lose 5% gold, gain some goodwill.',
        apply: (state) => {
          const tax = Math.max(5, Math.round(state.gold * 0.05));
          return {
            goldDelta: -tax,
            dreadDelta: -2,
            logMessage: `Paid ${tax} gold tax. Dread −2. Kingdom appeased.`,
            effectSummary: `−${tax} gold. Dread −2.`,
          };
        },
      },
      {
        label: 'Refuse & eat the scroll',
        description: 'Defy the Kingdom. Dread +5, hero spawn +20% for 3 days.',
        apply: (state) => ({
          dreadDelta: 5,
          statusEffect: makeStatusEffect({
            name: 'Defied the Crown',
            icon: '👑',
            description: 'Hero spawn +20%',
            affectedStat: 'heroSpawnBonus',
            modifier: 0.2,
            expiresOnDay: state.day + 3,
          }),
          logMessage: 'Refused tax collector! Dread +5. Hero spawn +20% for 3 days.',
          effectSummary: 'Dread +5. Hero spawn +20% for 3 days.',
        }),
      },
    ],
  },

  {
    id: 'curse',
    title: 'Wandering Witch\'s Curse',
    icon: '🔮',
    weight: 3,
    getDescription: () =>
      'A wandering witch stands at the edge of your territory, weaving unpleasant magic. She claims you wronged her in a past life. This seems unlikely but she is clearly powerful. Your hoard has begun to vibrate ominously.',
    choices: [
      {
        label: 'Ward it off (30 gold)',
        description: 'Pay the witch to reverse the curse. −30 gold.',
        apply: (state) => {
          if (state.gold < 30) {
            return {
              allKoboldMoraleDelta: -10,
              statusEffect: makeStatusEffect({
                name: 'Witch\'s Curse',
                icon: '🔮',
                description: 'Sell prices −30%',
                affectedStat: 'sellMultiplier',
                modifier: -0.3,
                expiresOnDay: state.day + 7,
              }),
              logMessage: 'Could not afford to ward the curse! Hoard values −30% for 7 days.',
              effectSummary: 'Too poor to ward off! Hoard sell prices −30% for 7 days.',
            };
          }
          return {
            goldDelta: -30,
            logMessage: 'Paid witch 30 gold to lift the curse. Crisis averted.',
            effectSummary: '−30 gold. Curse averted.',
          };
        },
      },
      {
        label: 'Endure the curse',
        description: 'Suffer the curse. Hoard sell prices −30% for 7 days.',
        apply: (state) => ({
          statusEffect: makeStatusEffect({
            name: 'Witch\'s Curse',
            icon: '🔮',
            description: 'Sell prices −30%',
            affectedStat: 'sellMultiplier',
            modifier: -0.3,
            expiresOnDay: state.day + 7,
          }),
          logMessage: 'Endured the witch\'s curse. Hoard sell prices −30% for 7 days.',
          effectSummary: 'Hoard sell prices −30% for 7 days.',
        }),
      },
    ],
  },

  {
    id: 'wantedPoster',
    title: 'A Bounty Is Posted',
    icon: '📜',
    weight: 4,
    canFire: (state) => state.dread >= 50 && !state.activeWantedPoster,
    passive: (state) => ({
      description: `The Adventurers' Guild has officially posted a bounty on you. A courier was paid extra to nail it to your front door. The audacity.`,
      outcome: {
        logMessage: `Wanted poster issued! Bounty: ${state.dread * 3}g on your head.`,
        effectSummary: 'Wanted poster now active.',
      },
    }),
  },

  {
    id: 'witchVisit',
    title: 'The Blessing of the Void Witch',
    icon: '🌙',
    weight: 3,
    getDescription: () =>
      'A cloaked figure calling herself the Void Witch has appeared unbidden in your throne room. She offers a blessing of fearsome power — but such gifts always come with a cost to one\'s reputation for subtlety.',
    choices: [
      {
        label: 'Accept the blessing',
        description: 'Dread +8. Combat rolls +3 for 3 days.',
        apply: (state) => ({
          dreadDelta: 8,
          statusEffect: makeStatusEffect({
            name: 'Void Witch Blessing',
            icon: '🌙',
            description: 'Combat rolls +3',
            affectedStat: 'combatBonus',
            modifier: 3,
            expiresOnDay: state.day + 3,
          }),
          logMessage: 'Accepted Void Witch blessing! Dread +8, combat +3 for 3 days.',
          effectSummary: 'Dread +8. Combat rolls +3 for 3 days.',
        }),
      },
      {
        label: 'Decline politely',
        description: 'She leaves. No effect.',
        apply: () => ({
          logMessage: 'Declined the Void Witch\'s blessing. She vanished without comment.',
          effectSummary: 'No effect.',
        }),
      },
    ],
  },
];

export function pickRandomEvent(state: StateSnap): RandomEventDef | null {
  const eligible = ALL_RANDOM_EVENTS.filter(
    e => !e.canFire || e.canFire(state),
  );
  if (eligible.length === 0) return null;
  const totalWeight = eligible.reduce((s, e) => s + e.weight, 0);
  let roll = Math.random() * totalWeight;
  for (const ev of eligible) {
    roll -= ev.weight;
    if (roll <= 0) return ev;
  }
  return eligible[eligible.length - 1];
}

export function buildPendingEvent(def: RandomEventDef, state: StateSnap): PendingEvent {
  if (def.passive) {
    const { description, outcome } = def.passive(state);
    return {
      defId: def.id,
      title: def.title,
      icon: def.icon,
      description,
      effectSummary: outcome.effectSummary,
      isPassive: true,
    };
  }
  return {
    defId: def.id,
    title: def.title,
    icon: def.icon,
    description: def.getDescription ? def.getDescription(state) : '',
    effectSummary: '',
    isPassive: false,
    choices: def.choices?.map(c => ({ label: c.label, description: c.description })),
  };
}
