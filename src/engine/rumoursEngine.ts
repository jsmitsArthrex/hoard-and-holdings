import type { GameState } from '../types';
import { districts } from '../data/districts';

type RumourState = Pick<
  GameState,
  | 'dragon'
  | 'dread'
  | 'kobolds'
  | 'hoardItems'
  | 'rivals'
  | 'activeIncursions'
  | 'statusEffects'
  | 'playerPropertyIds'
  | 'adventurersDefeated'
  | 'gold'
  | 'day'
  | 'gameLog'
  | 'gameSettings'
  | 'hoardArrangement'
>;

interface RumourCandidate {
  score: number;
  text: string;
}

export function generateRumours(state: RumourState): string[] {
  const dragonName = state.dragon?.name ?? 'the dragon';
  const candidates: RumourCandidate[] = [];

  const recentLogs = state.gameLog.filter(l => state.day - l.day <= 2);
  const ownedCount = state.playerPropertyIds.length;
  const winThreshold = state.gameSettings?.winThreshold ?? 50;
  const avgMorale =
    state.kobolds.length > 0
      ? state.kobolds.reduce((s, k) => s + k.morale, 0) / state.kobolds.length
      : 100;

  // 1. Active incursion — most urgent
  if (state.activeIncursions.length > 0) {
    const party = state.activeIncursions[0].partyName;
    candidates.push({
      score: 100,
      text: `A bold adventuring party — ${party} — was spotted sharpening blades at the Copper Bell Inn.`,
    });
  }

  // 2. Rival seized a property in the last 2 days
  const seizureLog = recentLogs.find(l =>
    l.message.toLowerCase().includes('seized')
  );
  if (seizureLog) {
    const rival = state.rivals.find(r => seizureLog.message.includes(r.name));
    if (rival) {
      const lastPropId = rival.propertyIds[rival.propertyIds.length - 1];
      const districtName = lastPropId
        ? (districts.find(d => d.properties.some(p => p.id === lastPropId))
            ?.name ?? 'the highlands')
        : 'the highlands';
      candidates.push({
        score: 90,
        text: `Word from the merchant roads: ${rival.name} has been seen touring properties near ${districtName}.`,
      });
    }
  }

  // 3. High dread (≥75)
  if (state.dread >= 75) {
    candidates.push({
      score: 85,
      text: `Travelers are reportedly taking a 3-day detour to avoid ${dragonName}'s mountain.`,
    });
  }

  // 4. A rival poached a kobold (poachedKobold present on any rival)
  const poacherRival = state.rivals.find(r => r.poachedKobold !== undefined);
  if (poacherRival) {
    candidates.push({
      score: 80,
      text: `${poacherRival.name} has been spotted parading a new kobold worker through the market square.`,
    });
  }

  // 5. Win threshold almost met (within 5 properties)
  if (ownedCount > 0 && winThreshold - ownedCount <= 5) {
    candidates.push({
      score: 80,
      text: `Property deed clerks are working overtime — someone has been buying up lairs faster than a wildfire spreads.`,
    });
  }

  // 6. Low kobold morale average (<40)
  if (state.kobolds.length > 0 && avgMorale < 40) {
    candidates.push({
      score: 75,
      text: `Rumour has it your kobolds have been asking other dragons about job openings.`,
    });
  }

  // 7. Low gold (<50)
  if (state.gold < 50) {
    candidates.push({
      score: 75,
      text: `A gnome accountant near the docks was overheard saying a certain dragon is "running on fumes".`,
    });
  }

  // 8. No hoard items
  if (state.hoardItems.length === 0) {
    candidates.push({
      score: 70,
      text: `Bards in three kingdoms are mocking ${dragonName}'s allegedly empty hoard.`,
    });
  }

  // 9. No lair yet (no owned properties)
  if (ownedCount === 0) {
    candidates.push({
      score: 70,
      text: `Locals at the Smoldering Hearth say a dragon has been using the motel's complimentary breakfast three weeks running.`,
    });
  }

  // 10. Large kobold workforce (≥8 kobolds)
  if (state.kobolds.length >= 8) {
    candidates.push({
      score: 65,
      text: `The local kobold union has apparently started filing paperwork for a chapter near ${dragonName}'s territory.`,
    });
  }

  // 11. Hostile rival (relationship <30)
  const hostileRival = state.rivals.find(r => r.relationship < 30);
  if (hostileRival) {
    candidates.push({
      score: 60,
      text: `Envoys from ${hostileRival.name} were seen at the Merchant Guild, whispering to the trade assessors.`,
    });
  }

  // 12. Many adventurers defeated (≥5)
  if (state.adventurersDefeated >= 5) {
    candidates.push({
      score: 55,
      text: `${dragonName} has reportedly sent ${state.adventurersDefeated} adventuring parties fleeing with singed cloaks and wounded pride.`,
    });
  }

  // 13. Any status effect active
  if (state.statusEffects.length > 0) {
    const effect = state.statusEffects[0];
    candidates.push({
      score: 50,
      text: `A hedge witch was heard muttering about an unusual magical aura — "${effect.name}" — hanging over the mountains.`,
    });
  }

  // 14. Substantial hoard (≥5 items)
  if (state.hoardItems.length >= 5) {
    candidates.push({
      score: 48,
      text: `Treasure hunters' maps are apparently circulating the taverns, all marked with "${dragonName}'s Hoard" near a certain mountain.`,
    });
  }

  // 15. Dragon has reached Ancient or Great Wyrm tier (≥4)
  if ((state.dragon?.ageTier ?? 1) >= 4) {
    const tierLabel =
      state.dragon?.ageTier === 5 ? 'Great Wyrm' : 'Ancient';
    candidates.push({
      score: 45,
      text: `The Collegium's bestiary department has dedicated an entire chapter to the ${tierLabel} known as ${dragonName}.`,
    });
  }

  // 16. Very low dread (<20) — dragon is unknown
  if (state.dread < 20) {
    candidates.push({
      score: 35,
      text: `A pair of knights was overheard laughing, saying they'd never heard of ${dragonName}. They didn't seem worried.`,
    });
  }

  // 17. Mid-game milestone (day 30–70)
  if (state.day >= 30 && state.day < 70) {
    candidates.push({
      score: 25,
      text: `Cartographers in the capital have begun updating their regional maps with fresh markings near the mountains.`,
    });
  }

  // 18. Late game (day ≥70)
  if (state.day >= 70) {
    candidates.push({
      score: 20,
      text: `A merchant caravan was reportedly delayed three hours after accidentally wandering into disputed dragon territory.`,
    });
  }

  // 19. Hoard Arrangement flavour rumours
  if (state.hoardArrangement === 'pile' && state.hoardItems.length >= 3) {
    candidates.push({
      score: 52,
      text: `Word from the road: ${dragonName}'s cave glitters so brightly travelers mistake it for a second sun.`,
    });
  }
  if (state.hoardArrangement === 'wall' && state.hoardItems.length >= 3) {
    const partyCount = Math.max(1, Math.floor(state.hoardItems.length / 2));
    candidates.push({
      score: 52,
      text: `${dragonName}'s lair reportedly contains the mounted heads of ${partyCount} adventuring ${partyCount === 1 ? 'party' : 'parties'}. The count is disputed.`,
    });
  }
  if (state.hoardArrangement === 'cabinet' && state.hoardItems.length >= 3) {
    candidates.push({
      score: 52,
      text: `Scholars have reportedly offered ${dragonName} a small fortune simply for the right to catalogue the collection. Reportedly refused.`,
    });
  }

  // Always-on fallbacks — ensure we always have at least 3 candidates
  candidates.push(
    {
      score: 15,
      text: `The innkeeper at the Copper Bell Inn has raised room prices, citing "elevated draconic activity in the region".`,
    },
    {
      score: 12,
      text: `A cartwright's guild newsletter includes a brief notice: property values in mountainous regions are "fluctuating unusually".`,
    },
    {
      score: 10,
      text: `Rumours from the Merchants' Road suggest the dragon real estate market has never been more active.`,
    }
  );

  candidates.sort((a, b) => b.score - a.score);
  return candidates.slice(0, 3).map(c => c.text);
}
