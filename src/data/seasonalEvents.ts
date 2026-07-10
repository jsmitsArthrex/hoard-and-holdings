import type { PendingEvent, SeasonName } from '../types';

export function buildNarrativeSeasonalEvent(season: SeasonName, _day: number): PendingEvent {
  switch (season) {
    case 'spring':
      return {
        defId: 'narrative_spring',
        title: "Adventurers' Guild Tournament",
        icon: '🏆',
        description:
          "The Adventurers' Guild has declared an open tournament, offering double bounties on dragon lairs. Hero parties are already signing up — and heading your way.",
        effectSummary: 'For the next 5 days: incursion spawn rate ×2, but gold & loot rewards ×2.',
        isPassive: false,
        choices: [
          { label: 'Accept the Challenge', description: 'Double incursions — and double combat rewards — for 5 days.' },
          { label: 'Lay Low', description: 'Let the tournament pass. No extra risk, no extra reward.' },
        ],
      };
    case 'summer':
      return {
        defId: 'narrative_summer',
        title: 'Grand Trade Fair',
        icon: '🛒',
        description:
          'The Grand Trade Fair has come to the region! Merchants from across the realm flood the markets, and rival dragons are sniffing out properties to expand their portfolios.',
        effectSummary: 'Auction prices +30% for 4 days. Rivals buy properties more aggressively.',
        isPassive: false,
        choices: [
          { label: 'Open Your Hoard for Trade', description: 'Auction starting prices +30% for 4 days.' },
          { label: 'Ignore It', description: "Let the fair pass without capitalising on it." },
        ],
      };
    case 'autumn':
      return {
        defId: 'narrative_autumn',
        title: 'Harvest Tax Levy',
        icon: '📜',
        description:
          'The Dragon Council has levied its annual Harvest Tax. Every property in your portfolio is assessed, and gold flows to the council coffers whether you like it or not.',
        effectSummary: 'The council levies 15 gold per property you own.',
        isPassive: true,
      };
    case 'winter':
      return {
        defId: 'narrative_winter',
        title: 'Frozen Mountain Passes',
        icon: '❄️',
        description:
          'A brutal early frost has sealed the mountain passes. No deeds can change hands and kobold poaching is suspended until the thaw — unless you can buy your way around the wardens.',
        effectSummary: 'No new properties can be bought for 6 days. Kobold poaching halted.',
        isPassive: false,
        choices: [
          { label: 'Accept the Decree', description: 'Roads frozen — no property purchases or poaching for 6 days.' },
          { label: 'Bribe the Road Wardens (−80 gold)', description: 'Pay 80 gold to keep the passes open. No freeze effects.' },
        ],
      };
  }
}
