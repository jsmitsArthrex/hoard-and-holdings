import type { PendingEvent, SeasonName, StatusEffect } from '../types';
import { makeStatusEffect } from './statusEffects';

export function getSeason(day: number): SeasonName {
  const dayInYear = ((day - 1) % 200) + 1;
  if (dayInYear <= 50) return 'spring';
  if (dayInYear <= 100) return 'summer';
  if (dayInYear <= 150) return 'autumn';
  return 'winter';
}

export function getSeasonTransition(day: number): SeasonName | null {
  const dayInYear = ((day - 1) % 200) + 1;
  if (dayInYear === 1) return 'spring';
  if (dayInYear === 51) return 'summer';
  if (dayInYear === 101) return 'autumn';
  if (dayInYear === 151) return 'winter';
  return null;
}

export interface SeasonalEventResult {
  event: PendingEvent;
  statusEffect?: StatusEffect;
  newDread?: number;
  rivalBonus?: boolean;
  logMessage: string;
}

export function buildSeasonalEvent(
  season: SeasonName,
  day: number,
  propertyCount: number,
): SeasonalEventResult {
  switch (season) {
    case 'spring': {
      const newDread = Math.min(100, Math.round(propertyCount * 3 + 5));
      return {
        event: {
          defId: 'seasonal_spring',
          title: 'Season of Stirring',
          icon: '🌱',
          description:
            'The Kingdom conducts its annual census. Scribes tally your domain across the land. Word of your growing empire spreads — and so does your reputation. Rival dragons receive royal subsidies to "counterbalance the draconic threat."',
          effectSummary: `Your Dread recalculated to ${newDread}. Each rival may seize an unclaimed property.`,
          isPassive: true,
        },
        newDread,
        rivalBonus: true,
        logMessage: `Spring Census: dread recalculated to ${newDread}. Rivals bolstered by royal subsidies.`,
      };
    }
    case 'summer': {
      const effect = makeStatusEffect({
        name: 'Merchant Festival',
        icon: '🛒',
        description: 'Sell prices +25%',
        affectedStat: 'sellMultiplier',
        modifier: 0.25,
        expiresOnDay: day + 5,
      });
      return {
        event: {
          defId: 'seasonal_summer',
          title: 'Season of the Long Sun',
          icon: '☀️',
          description:
            'The great Merchant Festival draws traders from across the realm! Caravans fill the roads and buyers are flush with summer coin. Even a dragon\'s stolen goods fetch a handsome price at market.',
          effectSummary: 'All item sell prices +25% for 5 days.',
          isPassive: true,
        },
        statusEffect: effect,
        logMessage: 'Merchant Festival begins! Sell prices +25% for 5 days.',
      };
    }
    case 'autumn': {
      const effect = makeStatusEffect({
        name: 'Adventurer Season',
        icon: '⚔️',
        description: 'Hero spawn +15%',
        affectedStat: 'heroSpawnBonus',
        modifier: 0.15,
        expiresOnDay: day + 10,
      });
      return {
        event: {
          defId: 'seasonal_autumn',
          title: 'Season of the Fading Flame',
          icon: '🍂',
          description:
            'Adventuring season is in full swing! Bands of heroes comb the countryside, seeking glory and dragon lairs to plunder. The Adventurers\' Guild has issued new bounties. Stay vigilant.',
          effectSummary: 'Hero spawn chance +15% for 10 days.',
          isPassive: true,
        },
        statusEffect: effect,
        logMessage: 'Adventurer Season: hero spawn chance +15% for 10 days!',
      };
    }
    case 'winter': {
      const effect = makeStatusEffect({
        name: 'Winter Scarcity',
        icon: '❄️',
        description: 'Kobold wages +20%',
        affectedStat: 'wageCostModifier',
        modifier: 0.2,
        expiresOnDay: day + 50,
      });
      return {
        event: {
          defId: 'seasonal_winter',
          title: 'Season of the Iron Cold',
          icon: '❄️',
          description:
            'Winter grips the land with iron teeth. Resources are scarce, and your kobolds demand higher wages to survive the brutal cold. The Motel of Marginal Comfort has also raised its nightly rates considerably.',
          effectSummary: 'Kobold wages +20% for 50 days.',
          isPassive: true,
        },
        statusEffect: effect,
        logMessage: 'Winter Scarcity: kobold wages +20% for 50 days.',
      };
    }
  }
}
