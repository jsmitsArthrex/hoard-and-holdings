import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  GameState, GameStatus, KoboldEmployee, KoboldRole, KoboldTrait, KoboldSpecies,
  HoardItem, Rival, GameLogEntry, EveningResult,
  ActiveIncursion, StatusEffect, PendingEvent, GameSettings, Difficulty,
  CouncilVoteResult, Contract, ContractCondition, PropertyAuction, PrisonerRansom,
  BlackMarketItem, PropertyUpgradeId, PropertyUpgrade, ExpeditionResult,
} from '../types';
import { districts } from '../data/districts';
import { priceIndex } from '../data/economyIndex';
import { runRivalAI } from '../engine/rivalAI';
import { getAgeTier, koboldGrossIncome, AGE_TIER_LABELS, AGE_TIER_UNLOCK_TEXT, LOOT_TABLE } from '../engine/gameClock';
import { DRAGON_ABILITIES } from '../data/dragonAbilities';
import { clearExpiredEffects, getModifier, makeStatusEffect } from '../engine/statusEffects';
import { shouldSpawnIncursion, createIncursion } from '../engine/incursionEngine';
import { getSeasonTransition, buildSeasonalEvent } from '../engine/seasonalEvents';
import { buildNarrativeSeasonalEvent } from '../data/seasonalEvents';
import { pickRandomEvent, buildPendingEvent, ALL_RANDOM_EVENTS } from '../engine/randomEvents';
import type { EventOutcome } from '../engine/randomEvents';
import { TITLE_DEFS } from '../data/titles';
import { LAIR_ROOMS } from '../data/lairRooms';
import { PROPERTY_UPGRADES } from '../data/propertyUpgrades';
import { playSound } from '../audio/audioEngine';
import {
  pickRandomCouncilMotion,
  buildCouncilVotePendingEvent,
  simulateRivalVotes,
  getCouncilMotion,
} from '../engine/councilMotions';

const TOTAL_PROPERTIES = districts.flatMap(d => d.properties).length;

const DIFFICULTY_SETTINGS: Record<Difficulty, GameSettings> = {
  easy:   { difficulty: 'easy',   winThreshold: 30, startingGold: 200, motelCostPerNight: 2 },
  normal: { difficulty: 'normal', winThreshold: 50, startingGold: 150, motelCostPerNight: 5 },
  hard:   { difficulty: 'hard',   winThreshold: Math.min(75, TOTAL_PROPERTIES), startingGold: 80, motelCostPerNight: 10 },
};

const ROLE_TRAIT_DEFINITIONS: Record<KoboldRole, KoboldTrait> = {
  miner:     { id: 'veteran_miner', label: 'Veteran Miner',  description: 'Years of toil have sharpened this kobold\'s pickaxe technique.',         effect: 'extraGold',   value: 2 },
  guard:     { id: 'loyal_guard',   label: 'Loyal Guard',    description: 'Unwavering loyalty makes this kobold immune to rival poaching.',         effect: 'poachImmune', value: 1 },
  treasurer: { id: 'sharp_ledger',  label: 'Sharp Ledger',   description: 'Meticulous bookkeeping increases total kobold income by 3%.',            effect: 'extraGold',   value: 3 },
  scout:     { id: 'shadow_step',   label: 'Shadow Step',    description: 'Expert scouting grants +1 to all of your combat attack rolls.',          effect: 'combatBonus', value: 1 },
  cook:      { id: 'master_cook',   label: 'Master Cook',    description: 'Hearty meals restore +2 morale per day to every kobold in the colony.', effect: 'moraleRegen', value: 2 },
};

const BM_STOLEN_GOODS = [
  'Enchanted Lockbox', 'Moonstone Idol', 'Stolen Silverware',
  'Rare Tome', 'Cursed Amulet', 'Pilfered Gem Cluster',
  'Contraband Spice', 'Forged Deed',
];
const BM_KOBOLD_NAMES = ['Skrix', 'Venn', 'Nax', 'Birtle', 'Cruzz', 'Yelp', 'Doss', 'Frink'];
const BM_SPECIES: KoboldSpecies[] = ['red', 'blue', 'green', 'purple', 'white'];
const BM_ROLES: KoboldRole[] = ['miner', 'guard', 'treasurer', 'scout', 'cook'];

const INITIAL_RIVALS: Rival[] = [
  { id: 0, name: 'Scorch the Relentless', breedId: 'fire',  propertyIds: ['prop_03_00', 'prop_07_00'], relationship: 50 },
  { id: 1, name: 'Frostbite the Unyielding', breedId: 'ice',   propertyIds: ['prop_00_02', 'prop_08_00'], relationship: 50 },
  { id: 2, name: 'Shadowmere the Cunning', breedId: 'dark',  propertyIds: ['prop_06_04', 'prop_09_02'], relationship: 50 },
];

function makeLog(day: number, tod: GameState['timeOfDay'], message: string): GameLogEntry {
  return { id: `${Date.now()}-${Math.random()}`, day, timeOfDay: tod, message };
}

export interface GameStore extends GameState {
  initGame: (dragonName: string, breedId: string, difficulty?: Difficulty) => void;
  resetGame: () => void;
  goToIntro: () => void;
  goToTitle: () => void;
  loadGame: () => void;
  setActiveScreen: (screen: string) => void;
  highlightProperty: (id: string | null) => void;

  useMorningAction: () => void;
  useAfternoonAction: () => void;

  buyProperty: (propertyId: string, price: number) => void;
  buyFromRival: (rivalId: number, propertyId: string, price: number) => void;

  hireKobold: (kobold: KoboldEmployee) => void;
  dismissKobold: (koboldId: string) => void;
  changeKoboldRole: (koboldId: string, role: KoboldRole) => void;
  buyBackKobold: (rivalId: number) => void;

  addHoardItem: (item: HoardItem) => void;
  sellHoardItem: (itemId: string) => void;

  addGold: (amount: number) => void;
  addDread: (delta: number) => void;
  updateDragonHP: (hp: number | null) => void;

  resolveEvening: () => void;
  advanceDay: () => void;

  updateRivalRelationship: (rivalId: number, delta: number) => void;
  logEvent: (message: string) => void;
  trackAdventurerDefeated: () => void;
  trackCombatLoss: () => void;

  dismissPendingEvent: () => void;
  resolveEventChoice: (choiceIndex: number) => void;
  resolveCouncilVote: (motionId: string, playerVoteAye: boolean) => void;
  clearCouncilVoteResult: () => void;
  dismissIncursion: (id: string) => void;
  formAlliance: (rivalId: number) => void;
  applyLegalProtection: () => void;
  buildLairRoom: (roomId: string) => void;
  sabotageRival: (rivalId: number, type: 'sabotage' | 'theft', theftRoll?: number) => void;
  updateContractProgress: (type: ContractCondition, amount?: number) => void;
  placeBid: (amount: number) => void;
  resolvePropertyAuction: () => void;
  buildPropertyUpgrade: (propertyId: string, upgradeId: PropertyUpgradeId) => void;
  captureForRansom: (heroName: string, baseAmount: number) => void;
  purchaseBlackMarketItem: (itemId: string) => void;
  sendExpedition: (koboldIds: string[]) => void;
  useDragonAbility: (abilityId: string, targetRivalId?: number) => void;
}

const DEFAULT_SETTINGS: GameSettings = DIFFICULTY_SETTINGS.normal;

const BLANK_STATE: GameState = {
  status: 'title',
  dragon: null,
  gold: 150,
  day: 1,
  timeOfDay: 'morning',
  dread: 10,
  morningActionUsed: false,
  afternoonActionUsed: false,
  playerPropertyIds: [],
  kobolds: [],
  hoardItems: [],
  rivals: INITIAL_RIVALS,
  gameLog: [],
  goldHistory: [{ day: 1, gold: 150 }],
  adventurersDefeated: 0,
  activeScreen: 'hub',
  highlightedPropertyId: null,
  eveningResults: null,
  activeIncursions: [],
  statusEffects: [],
  pendingEvents: [],
  gameSettings: DEFAULT_SETTINGS,
  ageTierAchieved: [1],
  dragonCurrentHP: null,
  earnedTitles: [],
  itemsSold: 0,
  combatLosses: 0,
  lairRooms: [],
  councilVoteResult: null,
  activeContracts: [],
  activePropertyAuction: null,
  activeRansom: null,
  blackMarketStock: null,
  blackMarketRefreshDay: 0,
  propertyUpgrades: [],
  playerPropertyAcquiredDays: {},
  pendingExpeditionResult: null,
  dragonAbilityUsedToday: false,
  seasonalEventFiredThisSeason: false,
  tournamentActive: false,
};

interface AppliedOutcome {
  goldDelta: number;
  dreadDelta: number;
  kobolds: KoboldEmployee[];
  statusEffect: StatusEffect | null;
  hoardItemAdd: HoardItem | null;
  hoardItemRemoveRandom: boolean;
  rivalRelDelta: { rivalId: number; delta: number } | null;
}

function applyEventOutcome(
  outcome: EventOutcome,
  snap: { kobolds: KoboldEmployee[]; gold: number; day: number },
  _day: number,
): AppliedOutcome {
  let kobolds = [...snap.kobolds];

  if (outcome.allKoboldMoraleDelta) {
    const delta = outcome.allKoboldMoraleDelta;
    kobolds = kobolds.map(k => ({ ...k, morale: Math.max(0, Math.min(100, k.morale + delta)) }));
  }
  if (outcome.specificKoboldId && outcome.specificKoboldMoraleDelta !== undefined) {
    const delta = outcome.specificKoboldMoraleDelta;
    kobolds = kobolds.map(k =>
      k.id === outcome.specificKoboldId
        ? { ...k, morale: Math.max(0, Math.min(100, k.morale + delta)) }
        : k
    );
  }

  return {
    goldDelta: outcome.goldDelta ?? 0,
    dreadDelta: outcome.dreadDelta ?? 0,
    kobolds,
    statusEffect: outcome.statusEffect ?? null,
    hoardItemAdd: outcome.hoardItemAdd
      ? { id: `ev-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, lootedOnDay: snap.day, ...outcome.hoardItemAdd }
      : null,
    hoardItemRemoveRandom: outcome.hoardItemRemoveRandom ?? false,
    rivalRelDelta: outcome.rivalRelDelta ?? null,
  };
}

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      ...BLANK_STATE,

      initGame: (dragonName, breedId, difficulty = 'normal') => {
        const settings = DIFFICULTY_SETTINGS[difficulty];
        const firstLog = makeLog(1, 'morning', `${dragonName} checks into the Smoldering Hearth Motel, hoardless and determined!`);
        set({
          ...BLANK_STATE,
          status: 'playing',
          dragon: { name: dragonName, breedId, age: 1, ageTier: 1 },
          rivals: INITIAL_RIVALS.map(r => ({ ...r })),
          gameLog: [firstLog],
          gold: settings.startingGold,
          goldHistory: [{ day: 1, gold: settings.startingGold }],
          gameSettings: settings,
          ageTierAchieved: [1],
          earnedTitles: [],
          itemsSold: 0,
          combatLosses: 0,
        });
      },

      resetGame: () => set({ ...BLANK_STATE }),

      goToIntro: () => set({ status: 'intro' }),

      goToTitle: () => set({ status: 'title' }),

      loadGame: () => set({ status: 'playing' }),

      setActiveScreen: (screen) => set({ activeScreen: screen }),

      highlightProperty: (id) => set({ highlightedPropertyId: id }),

      useMorningAction: () => set({ morningActionUsed: true, timeOfDay: 'afternoon' }),

      useAfternoonAction: () => {
        set({ afternoonActionUsed: true });
        get().resolveEvening();
      },

      buyProperty: (propertyId, price) => {
        const state = get();
        const buyDiscount = getModifier(state.statusEffects, 'councilVoteBonus');
        const effectivePrice = Math.max(1, Math.round(price * (1 + buyDiscount)));
        if (state.gold < effectivePrice) return;
        const prop = districts.flatMap(d => d.properties).find(p => p.id === propertyId);
        const newGold = state.gold - effectivePrice;
        const newPlayerIds = [...state.playerPropertyIds, propertyId];
        const winThreshold = state.gameSettings?.winThreshold ?? TOTAL_PROPERTIES;
        const newStatus: GameStatus = newPlayerIds.length >= winThreshold ? 'won' : state.status;
        const log = makeLog(state.day, state.timeOfDay, `Acquired ${prop?.name ?? propertyId} for ${effectivePrice} gold!`);
        set({
          gold: newGold,
          playerPropertyIds: newPlayerIds,
          status: newStatus,
          playerPropertyAcquiredDays: { ...(state.playerPropertyAcquiredDays ?? {}), [propertyId]: state.day },
          gameLog: [...state.gameLog.slice(-100), log],
          goldHistory: [...state.goldHistory, { day: state.day, gold: newGold }],
        });
        get().updateContractProgress('buyProperty');
      },

      buyFromRival: (rivalId, propertyId, price) => {
        const state = get();
        const buyDiscountRival = getModifier(state.statusEffects, 'councilVoteBonus');
        const effectivePriceRival = Math.max(1, Math.round(price * (1 + buyDiscountRival)));
        if (state.gold < effectivePriceRival) return;
        const prop = districts.flatMap(d => d.properties).find(p => p.id === propertyId);
        const newGold = state.gold - effectivePriceRival;
        const newPlayerIds = [...state.playerPropertyIds, propertyId];
        const updatedRivals = state.rivals.map(r =>
          r.id === rivalId
            ? { ...r, propertyIds: r.propertyIds.filter(id => id !== propertyId) }
            : r
        );
        const winThreshold2 = state.gameSettings?.winThreshold ?? TOTAL_PROPERTIES;
        const newStatus: GameStatus = newPlayerIds.length >= winThreshold2 ? 'won' : state.status;
        const log = makeLog(state.day, state.timeOfDay, `Bought ${prop?.name ?? propertyId} from rival for ${effectivePriceRival} gold.`);
        set({
          gold: newGold,
          playerPropertyIds: newPlayerIds,
          rivals: updatedRivals,
          status: newStatus,
          playerPropertyAcquiredDays: { ...(state.playerPropertyAcquiredDays ?? {}), [propertyId]: state.day },
          gameLog: [...state.gameLog.slice(-100), log],
          goldHistory: [...state.goldHistory, { day: state.day, gold: newGold }],
        });
      },

      hireKobold: (kobold) => {
        const state = get();
        const newGold = state.gold - kobold.dailyWage;
        const log = makeLog(state.day, state.timeOfDay, `Hired ${kobold.name} (${kobold.tier} ${kobold.role}) for ${kobold.dailyWage} gold/day.`);
        set({
          gold: newGold,
          kobolds: [...state.kobolds, kobold],
          gameLog: [...state.gameLog.slice(-100), log],
          goldHistory: [...state.goldHistory, { day: state.day, gold: newGold }],
        });
      },

      dismissKobold: (koboldId) => {
        const state = get();
        const k = state.kobolds.find(k => k.id === koboldId);
        const log = makeLog(state.day, state.timeOfDay, `Dismissed ${k?.name ?? 'kobold'} from the colony.`);
        set({
          kobolds: state.kobolds.filter(k => k.id !== koboldId),
          gameLog: [...state.gameLog.slice(-100), log],
        });
      },

      changeKoboldRole: (koboldId, role) => set({
        kobolds: get().kobolds.map(k => k.id === koboldId ? { ...k, role } : k),
      }),

      buyBackKobold: (rivalId) => {
        const state = get();
        const rival = state.rivals.find(r => r.id === rivalId);
        if (!rival?.poachedKobold) return;
        const kobold = rival.poachedKobold;
        const price = kobold.dailyWage * 10;
        if (state.gold < price) return;
        const newGold = state.gold - price;
        const log = makeLog(state.day, state.timeOfDay, `Bought back ${kobold.name} from ${rival.name} for ${price} gold.`);
        set({
          gold: newGold,
          kobolds: [...state.kobolds, kobold],
          rivals: state.rivals.map(r => r.id === rivalId ? { ...r, poachedKobold: undefined } : r),
          gameLog: [...state.gameLog.slice(-100), log],
          goldHistory: [...state.goldHistory, { day: state.day, gold: newGold }],
        });
      },

      addHoardItem: (item) => set({ hoardItems: [...get().hoardItems, item] }),

      sellHoardItem: (itemId) => {
        const state = get();
        const item = state.hoardItems.find(h => h.id === itemId);
        if (!item) return;
        const baseMult = priceIndex[(state.day - 1) % priceIndex.length];
        const sellBonus = getModifier(state.statusEffects, 'sellMultiplier');
        const mult = baseMult + sellBonus;
        const salePrice = Math.round(item.baseValue * mult);
        const newGold = state.gold + salePrice;
        const log = makeLog(state.day, state.timeOfDay, `Sold ${item.name} at auction for ${salePrice} gold.`);
        set({
          gold: newGold,
          hoardItems: state.hoardItems.filter(h => h.id !== itemId),
          itemsSold: state.itemsSold + 1,
          gameLog: [...state.gameLog.slice(-100), log],
          goldHistory: [...state.goldHistory, { day: state.day, gold: newGold }],
        });
        get().updateContractProgress('sellItems');
      },

      addGold: (amount) => {
        const state = get();
        const newGold = state.gold + amount;
        set({
          gold: newGold,
          goldHistory: [...state.goldHistory, { day: state.day, gold: newGold }],
        });
      },

      addDread: (delta) => set({ dread: Math.max(0, Math.min(100, get().dread + delta)) }),

      updateDragonHP: (hp) => set({ dragonCurrentHP: hp }),

      resolveEvening: () => {
        const state = get();
        const hasLair = state.playerPropertyIds.length > 0;
        const lairRooms = state.lairRooms ?? [];
        const motelCost = hasLair ? 0 : (state.gameSettings?.motelCostPerNight ?? 5);

        const wageModifier = getModifier(state.statusEffects, 'wageCostModifier');
        const propertyUpgrades = state.propertyUpgrades ?? [];
        const hasDeepMine = propertyUpgrades.some(u => u.upgradeId === 'deep-mine' && state.playerPropertyIds.includes(u.propertyId));
        let koboldGross = state.kobolds.reduce((sum, k) => {
          if (k.onExpedition) return sum;
          let gross = koboldGrossIncome(k.dailyWage, hasLair);
          if (k.role === 'miner' && hasDeepMine) gross = Math.round(gross * 1.5);
          return sum + gross;
        }, 0);
        if (lairRooms.includes('treasure-vault')) koboldGross = Math.round(koboldGross * 1.1);
        const koboldWages = state.kobolds.reduce(
          (sum, k) => sum + k.dailyWage * (1 + wageModifier), 0
        );
        const netIncome = Math.round(koboldGross - koboldWages - motelCost);

        const aggMultiplier = 1.0 + getModifier(state.statusEffects, 'rivalAggressionMultiplier');
        const poachingFrozen = state.statusEffects.some(e => e.affectedStat === 'propertyFreeze');
        const { rivalActions, updatedRivalPropertyIds, poachedKoboldIds, poachedKoboldsByRivalId } =
          runRivalAI(state.rivals, state.playerPropertyIds, poachingFrozen ? [] : state.kobolds, state.day, aggMultiplier);

        const updatedRivals = state.rivals.map(r => ({
          ...r,
          propertyIds: updatedRivalPropertyIds.get(r.id) ?? r.propertyIds,
          poachedKobold: poachedKoboldsByRivalId.has(r.id)
            ? poachedKoboldsByRivalId.get(r.id)!
            : r.poachedKobold,
        }));

        const poachedKobolds = state.kobolds.filter(k => poachedKoboldIds.includes(k.id));
        let updatedKobolds = state.kobolds.filter(k => !poachedKoboldIds.includes(k.id));
        const newLogs: GameLogEntry[] = [];
        const events: string[] = [];
        const newPendingEvents: PendingEvent[] = [];
        let goldAfterNet = Math.max(0, state.gold + netIncome);

        // ── Trait Gold Bonuses (Veteran Miner flat, Sharp Ledger %) ─────────
        let traitGoldBonus = 0;
        state.kobolds.forEach(k => {
          if (k.trait?.id === 'veteran_miner') traitGoldBonus += k.trait.value;
        });
        const sharpLedgerKobold = state.kobolds.find(k => k.trait?.id === 'sharp_ledger');
        if (sharpLedgerKobold) {
          traitGoldBonus += Math.round(koboldGross * (sharpLedgerKobold.trait!.value / 100));
        }
        goldAfterNet += traitGoldBonus;

        if (!hasLair) events.push(`Working from the Motel — income reduced 50%, motel costs ${motelCost} gold/night.`);
        if (traitGoldBonus > 0) events.push(`Kobold traits contributed +${traitGoldBonus} gold.`);
        if (poachedKobolds.length > 0) {
          events.push(...poachedKobolds.map(k => `${k.name} was lured away by a rival!`));
        }

        // ── Kobold Revolt Check ──────────────────────────────────────────────
        const revoltingKobolds = updatedKobolds.filter(k => k.morale <= 0);
        let updatedRivalsAfterRevolt = [...updatedRivals];
        if (revoltingKobolds.length > 0) {
          for (const rebel of revoltingKobolds) {
            const goldStolen = Math.round(goldAfterNet * (0.1 + Math.random() * 0.2));
            goldAfterNet = Math.max(0, goldAfterNet - goldStolen);

            let stolenItem: HoardItem | null = null;
            let updatedHoardItems = get().hoardItems;
            if (updatedHoardItems.length > 0) {
              const idx = Math.floor(Math.random() * updatedHoardItems.length);
              stolenItem = updatedHoardItems[idx];
              updatedHoardItems = updatedHoardItems.filter((_, i) => i !== idx);
            }

            const joinsRival = Math.random() < 0.5 && updatedRivalsAfterRevolt.length > 0;
            if (joinsRival) {
              const rIdx = Math.floor(Math.random() * updatedRivalsAfterRevolt.length);
              updatedRivalsAfterRevolt = updatedRivalsAfterRevolt.map((r, i) =>
                i === rIdx ? { ...r, poachedKobold: rebel } : r
              );
            }

            const itemNote = stolenItem ? ` and ${stolenItem.name}` : '';
            const destNote = joinsRival ? ' They were last seen joining a rival dragon.' : ' They vanished into the wilderness.';
            const revoltMsg = `${rebel.name} has revolted! They stole ${goldStolen} gold${itemNote} on their way out.${destNote}`;

            newLogs.push(makeLog(state.day, 'evening', revoltMsg));
            events.push(revoltMsg);
            newPendingEvents.push({
              defId: 'revolt',
              title: 'Kobold Revolt!',
              icon: '⚔️',
              description: revoltMsg,
              effectSummary: `Lost ${goldStolen} gold${stolenItem ? ` and ${stolenItem.name}` : ''}. ${joinsRival ? 'Rebel joined a rival.' : 'Rebel fled the region.'}`,
              isPassive: true,
            });

            set(state => ({ hoardItems: state.hoardItems.filter(h => !stolenItem || h.id !== stolenItem.id) }));
          }
          updatedKobolds = updatedKobolds.filter(k => k.morale > 0);
        }

        // ── Master Cook: morale regen for all surviving kobolds ──────────────
        const masterCookRegen = updatedKobolds
          .filter(k => k.trait?.id === 'master_cook')
          .reduce((sum, k) => sum + k.trait!.value, 0);
        if (masterCookRegen > 0) {
          updatedKobolds = updatedKobolds.map(k => ({
            ...k,
            morale: Math.min(100, k.morale + masterCookRegen),
          }));
        }

        // ── Kobold Barracks: nightly morale bonus ────────────────────────────
        if (lairRooms.includes('kobold-barracks')) {
          updatedKobolds = updatedKobolds.map(k => ({ ...k, morale: Math.min(100, k.morale + 5) }));
        }

        // ── Hero Incursion Spawn ─────────────────────────────────────────────
        const ageTier = state.dragon?.ageTier ?? 1;
        const newIncursions: ActiveIncursion[] = [...state.activeIncursions];
        const watchtowerReduction = propertyUpgrades.some(u => u.upgradeId === 'watchtower' && state.playerPropertyIds.includes(u.propertyId)) ? 0.2 : 0;
        const spawnAttempts = (state.tournamentActive ?? false) ? 2 : 1;
        for (let si = 0; si < spawnAttempts; si++) {
          if (shouldSpawnIncursion(state.dread, state.statusEffects, watchtowerReduction)) {
            const incursion = createIncursion(ageTier, state.day);
            newIncursions.push(incursion);
            const spawnMsg = `A hero party — ${incursion.partyName} — has been spotted heading toward your lair!`;
            events.push(spawnMsg);
            newLogs.push(makeLog(state.day, 'evening', spawnMsg));
            newPendingEvents.push({
              defId: 'incursion_spawn',
              title: 'Hero Party Spotted!',
              icon: '⚔️',
              description: `Scouts report that ${incursion.partyName} (Tier ${incursion.tier}) is marching toward your lair. You have 2 days to confront them before they raid without mercy.`,
              effectSummary: 'Visit Hunt Adventurers to engage them before they auto-raid!',
              isPassive: true,
            });
          }
        }

        // ── Trophy Hall: dread bonus per hoard item ────────────────────────
        const trophyDreadBonus = lairRooms.includes('trophy-hall')
          ? Math.floor(state.hoardItems.length / 5)
          : 0;
        const grandHallCount = propertyUpgrades.filter(u => u.upgradeId === 'grand-hall' && state.playerPropertyIds.includes(u.propertyId)).length;
        const grandHallDread = grandHallCount * 2;

        const eveningResults: EveningResult = {
          koboldIncome: Math.round(koboldGross),
          koboldWages: Math.round(koboldWages),
          netIncome,
          rivalActions,
          events,
        };

        const logMsg = `Evening: ${netIncome >= 0 ? '+' : ''}${netIncome} gold net.${rivalActions.length ? ' ' + rivalActions[0] : ''}`;
        const log = makeLog(state.day, 'evening', logMsg);
        const newStatus: GameStatus = goldAfterNet <= 0 ? 'lost' : state.status;

        set(s => ({
          gold: goldAfterNet,
          rivals: updatedRivalsAfterRevolt,
          kobolds: updatedKobolds,
          eveningResults,
          timeOfDay: 'evening',
          activeIncursions: newIncursions,
          pendingEvents: [...s.pendingEvents, ...newPendingEvents],
          gameLog: [...s.gameLog.slice(-100), log, ...newLogs],
          goldHistory: [...s.goldHistory, { day: state.day, gold: goldAfterNet }],
          status: newStatus,
          dread: Math.min(100, s.dread + trophyDreadBonus + grandHallDread),
        }));
      },

      advanceDay: () => {
        const state = get();
        const newDay = state.day + 1;
        const ageTier = getAgeTier(newDay);
        const winThreshold = state.gameSettings?.winThreshold ?? TOTAL_PROPERTIES;
        const newStatus: GameStatus =
          state.playerPropertyIds.length >= winThreshold ? 'won' : state.status;

        const newPendingEvents: PendingEvent[] = [];
        const newLogs: GameLogEntry[] = [];
        let newStatusEffects = clearExpiredEffects(state.statusEffects, newDay);
        let newDread = state.dread;
        let newGold = state.gold;
        let updatedRivals = [...state.rivals];
        let updatedKobolds = [...state.kobolds];
        let newIncursions = [...state.activeIncursions];
        let newHoardItems = [...state.hoardItems];
        let newSeasonalEventFiredThisSeason = state.seasonalEventFiredThisSeason ?? false;
        let newTournamentActive = state.tournamentActive ?? false;

        // ── Expedition Resolution ─────────────────────────────────────────────
        if (state.pendingExpeditionResult) {
          const expResult = state.pendingExpeditionResult;
          const expIds = expResult.koboldIds;
          const expNames = expIds
            .map(id => updatedKobolds.find(k => k.id === id)?.name ?? 'a kobold')
            .join(' and ');

          if (expResult.outcome === 'loot') {
            const lootPool = ['Cracked Runestone', 'Dented Shield', "Alchemist's Flask",
              'Tarnished Medallion', 'Ruin Shard', 'Forgotten Idol',
              'Ancient Coin Hoard', 'Dusty Tome', 'Serpent Fang', 'Obsidian Fragment'];
            const lootName = lootPool[Math.floor(Math.random() * lootPool.length)];
            const baseValue = Math.floor(Math.random() * 91) + 30;
            newHoardItems = [...newHoardItems, {
              id: `exp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              name: lootName, baseValue, lootedOnDay: newDay,
            }];
            newPendingEvents.push({
              defId: 'expedition_loot', title: '🗺️ Expedition Returns!', icon: '💎',
              description: expResult.detail,
              effectSummary: `Found ${lootName} (worth ~${baseValue}g). Added to hoard.`,
              isPassive: true,
            });
            newLogs.push(makeLog(newDay, 'morning', `Expedition returned with loot: ${lootName} (~${baseValue}g).`));
          } else if (expResult.outcome === 'intel') {
            const intelEffect: StatusEffect = {
              id: 'expedition-intel', name: 'Field Intel', icon: '🗺️',
              description: 'Scout reports provide a combat advantage.',
              affectedStat: 'combatBonus', modifier: 3, expiresOnDay: newDay + 3,
            };
            newStatusEffects = [...newStatusEffects, intelEffect];
            newPendingEvents.push({
              defId: 'expedition_intel', title: '🗺️ Expedition Returns!', icon: '🧭',
              description: expResult.detail,
              effectSummary: 'Field Intel active: +3 combat bonus for 3 days.',
              isPassive: true,
            });
            newLogs.push(makeLog(newDay, 'morning', 'Expedition returned with field intel. +3 combat bonus for 3 days.'));
          } else if (expResult.outcome === 'injury') {
            updatedKobolds = updatedKobolds.map(k =>
              expIds.includes(k.id) ? { ...k, morale: Math.max(0, k.morale - 30) } : k
            );
            newPendingEvents.push({
              defId: 'expedition_injury', title: '🗺️ Expedition Returns Injured!', icon: '🩹',
              description: expResult.detail,
              effectSummary: `${expNames} — morale −30.`,
              isPassive: true,
            });
            newLogs.push(makeLog(newDay, 'morning', `${expNames} returned injured. Morale −30.`));
          } else if (expResult.outcome === 'captured') {
            for (const kid of expIds) {
              const k = updatedKobolds.find(k => k.id === kid);
              if (k) newLogs.push(makeLog(newDay, 'morning', `${k.name} was captured on expedition and won't return.`));
            }
            updatedKobolds = updatedKobolds.filter(k => !expIds.includes(k.id));
            newPendingEvents.push({
              defId: 'expedition_captured', title: '🗺️ Expedition Failed — Captured!', icon: '⛓️',
              description: expResult.detail,
              effectSummary: `${expNames} lost permanently.`,
              isPassive: true,
            });
          }
          updatedKobolds = updatedKobolds.map(k =>
            expIds.includes(k.id) ? { ...k, onExpedition: false } : k
          );
        }

        // ── Auto-raid stale incursions (older than 2 days) ───────────────────
        const hasGuardPost = (state.lairRooms ?? []).includes('guard-post');
        const hasFortifiedWalls = (state.propertyUpgrades ?? []).some(u => u.upgradeId === 'fortified-walls' && state.playerPropertyIds.includes(u.propertyId));
        const staleIncursions = state.activeIncursions.filter(
          inc => newDay - inc.daySpawned > 2
        );
        for (const inc of staleIncursions) {
          let goldLost = Math.round(state.gold * 0.15);
          if (hasGuardPost) goldLost = Math.round(goldLost * 0.5);
          if (hasFortifiedWalls) goldLost = Math.round(goldLost * 0.6);
          newGold = Math.max(0, newGold - goldLost);
          updatedKobolds = updatedKobolds.map(k => ({
            ...k,
            morale: Math.max(0, k.morale - 20),
          }));
          const raidMsg = `${inc.partyName} raided your undefended lair! Lost ${goldLost} gold and kobold morale dropped.`;
          newLogs.push(makeLog(newDay, 'morning', raidMsg));
          newPendingEvents.push({
            defId: 'auto_raid',
            title: 'Lair Raided!',
            icon: '💀',
            description: `You ignored ${inc.partyName} for too long. They stormed your lair at dawn, helping themselves to your gold and terrorising your kobolds before disappearing back into the wilds.`,
            effectSummary: `Lost ${goldLost} gold. All kobold morale −20.`,
            isPassive: true,
          });
        }
        newIncursions = newIncursions.filter(inc => newDay - inc.daySpawned <= 2);

        // ── Seasonal Event ───────────────────────────────────────────────────
        const season = getSeasonTransition(newDay);
        if (season) {
          const result = buildSeasonalEvent(season, newDay, state.playerPropertyIds.length);
          newPendingEvents.push(result.event);
          newLogs.push(makeLog(newDay, 'morning', result.logMessage));
          if (result.statusEffect) {
            newStatusEffects = [...newStatusEffects, result.statusEffect];
          }
          if (result.newDread !== undefined) {
            newDread = result.newDread;
          }
          if (result.rivalBonus) {
            const allProps = districts.flatMap(d => d.properties);
            const rivalOwnedSet = new Set(updatedRivals.flatMap(r => r.propertyIds));
            const pool = allProps.filter(
              p => !state.playerPropertyIds.includes(p.id) && !rivalOwnedSet.has(p.id)
            );
            updatedRivals = updatedRivals.map(r => {
              if (pool.length > 0 && Math.random() < 0.6) {
                const idx = Math.floor(Math.random() * pool.length);
                const seized = pool.splice(idx, 1)[0];
                newLogs.push(makeLog(newDay, 'morning', `Spring subsidies bolster ${r.name}, who seizes ${seized.name}!`));
                return { ...r, propertyIds: [...r.propertyIds, seized.id] };
              }
              return r;
            });
          }
        }

        // ── Narrative Seasonal Events (10-day mini-seasons) ──────────────────
        {
          const prevNarrativeSeasonIdx = Math.floor((state.day - 1) / 10) % 4;
          const currNarrativeSeasonIdx = Math.floor((newDay - 1) / 10) % 4;
          if (currNarrativeSeasonIdx !== prevNarrativeSeasonIdx) {
            newSeasonalEventFiredThisSeason = false;
          }
          if (newTournamentActive && !newStatusEffects.some(e => e.affectedStat === 'combatReward')) {
            newTournamentActive = false;
          }
          if (!newSeasonalEventFiredThisSeason && (newDay % 10) >= 3 && Math.random() < 0.4) {
            const narrativeSeasons = ['spring', 'summer', 'autumn', 'winter'] as const;
            const narrativeSeason = narrativeSeasons[currNarrativeSeasonIdx];
            if (narrativeSeason === 'autumn') {
              const tax = 15 * state.playerPropertyIds.length;
              newGold = Math.max(0, newGold - tax);
              newPendingEvents.push({
                defId: 'narrative_autumn',
                title: 'Harvest Tax Levy',
                icon: '📜',
                description: 'The Dragon Council has levied its annual Harvest Tax. Every property in your portfolio is assessed.',
                effectSummary: `Council taxed ${tax} gold (15 × ${state.playerPropertyIds.length} properties).`,
                isPassive: true,
              });
              newLogs.push(makeLog(newDay, 'morning', `Harvest Tax Levy: −${tax} gold taxed by the council.`));
            } else {
              const narrativeEvent = buildNarrativeSeasonalEvent(narrativeSeason, newDay);
              newPendingEvents.push(narrativeEvent);
              newLogs.push(makeLog(newDay, 'morning', `Seasonal event: ${narrativeEvent.title}!`));
            }
            newSeasonalEventFiredThisSeason = true;
          }
        }

        // ── Random Morning Event (8% chance) ────────────────────────────────
        if (Math.random() < 0.08) {
          const snap = {
            dread: newDread,
            kobolds: updatedKobolds,
            rivals: updatedRivals,
            hoardItems: newHoardItems,
            gold: newGold,
            day: newDay,
            dragon: state.dragon,
          };
          const eventDef = pickRandomEvent(snap);
          if (eventDef) {
            const pending = buildPendingEvent(eventDef, snap);
            newPendingEvents.push(pending);

            if (eventDef.passive) {
              const { outcome } = eventDef.passive(snap);
              const applied = applyEventOutcome(outcome, snap, newDay);
              newGold += applied.goldDelta;
              newDread = Math.max(0, Math.min(100, newDread + applied.dreadDelta));
              updatedKobolds = applied.kobolds;
              newStatusEffects = applied.statusEffect
                ? [...newStatusEffects, applied.statusEffect]
                : newStatusEffects;
              if (applied.hoardItemAdd) newHoardItems = [...newHoardItems, applied.hoardItemAdd];
              if (applied.hoardItemRemoveRandom && newHoardItems.length > 0) {
                const idx = Math.floor(Math.random() * newHoardItems.length);
                newHoardItems = newHoardItems.filter((_, i) => i !== idx);
              }
              if (applied.rivalRelDelta) {
                updatedRivals = updatedRivals.map(r =>
                  r.id === applied.rivalRelDelta!.rivalId
                    ? { ...r, relationship: Math.max(0, Math.min(100, r.relationship + applied.rivalRelDelta!.delta)) }
                    : r
                );
              }
              if (outcome.logMessage) {
                newLogs.push(makeLog(newDay, 'morning', outcome.logMessage));
              }
            }
          }
        }

        // ── Kobold Experience: increment daysEmployed, assign trait at 15 days ─
        updatedKobolds = updatedKobolds.map(k => {
          const newDaysEmployed = (k.daysEmployed ?? 0) + 1;
          if (!k.trait && newDaysEmployed >= 15) {
            const trait = ROLE_TRAIT_DEFINITIONS[k.role];
            newLogs.push(makeLog(newDay, 'morning', `${k.name} earned the ${trait.label} trait after ${newDaysEmployed} days of service!`));
            return { ...k, daysEmployed: newDaysEmployed, trait };
          }
          return { ...k, daysEmployed: newDaysEmployed };
        });

        // ── Age Tier Celebration ──────────────────────────────────────────────
        const prevTier = state.dragon?.ageTier ?? 1;
        const newAgeTierAchieved = [...(state.ageTierAchieved ?? [1])];
        if (ageTier > prevTier && !newAgeTierAchieved.includes(ageTier)) {
          newAgeTierAchieved.push(ageTier);
          const tierName = AGE_TIER_LABELS[ageTier] ?? `Tier ${ageTier}`;
          const unlockText = AGE_TIER_UNLOCK_TEXT[ageTier] ?? '';
          newPendingEvents.push({
            defId: `age_tier_${ageTier}`,
            title: `Age Tier Reached: ${tierName}!`,
            icon: '🐉',
            description: `Your dragon has grown into a ${tierName}! The land trembles at the news.`,
            effectSummary: unlockText,
            isPassive: true,
          });
          newLogs.push(makeLog(newDay, 'morning', `You have ascended to ${tierName}! ${unlockText}`));
        }

        // ── Contract Expiry ───────────────────────────────────────────────────
        let updatedContracts = [...(state.activeContracts ?? [])];
        const expiredContracts = updatedContracts.filter(
          c => !c.completed && !c.failed && c.deadline < newDay
        );
        for (const c of expiredContracts) {
          if (c.npcId === 'grixle' || c.npcId === 'bank') {
            newGold = Math.max(0, newGold - 10);
            newLogs.push(makeLog(newDay, 'morning', `Contract "${c.title}" expired — 10 gold penalty.`));
          } else if (c.npcId === 'innkeeper') {
            updatedKobolds = updatedKobolds.map(k => ({ ...k, morale: Math.max(0, k.morale - 5) }));
            newLogs.push(makeLog(newDay, 'morning', `Contract "${c.title}" expired — kobold morale −5.`));
          }
        }
        if (expiredContracts.length > 0) {
          const expiredIds = new Set(expiredContracts.map(c => c.id));
          updatedContracts = updatedContracts.map(c => expiredIds.has(c.id) ? { ...c, failed: true } : c);
        }

        // ── Contract Generation (every 7 days) ───────────────────────────────
        if (newDay % 7 === 0) {
          const districtNames = districts.map(d => d.name);
          const hasGrixle = updatedContracts.some(c => c.npcId === 'grixle' && !c.completed && !c.failed);
          const hasBank = updatedContracts.some(c => c.npcId === 'bank' && !c.completed && !c.failed);
          const hasInnkeeper = updatedContracts.some(c => c.npcId === 'innkeeper' && !c.completed && !c.failed);
          if (!hasGrixle) {
            const dName = districtNames[Math.floor(Math.random() * districtNames.length)];
            updatedContracts.push({
              id: `contract-grixle-${newDay}`,
              npcId: 'grixle',
              title: 'Territory Acquisition',
              description: `Grixle needs a buyer to snap up 2 properties in ${dName} by Day ${newDay + 14}. A finder's fee awaits.`,
              reward: { gold: 50, dread: 5 },
              deadline: newDay + 14,
              condition: 'buyProperty',
              targetCount: 2,
              progress: 0,
              completed: false,
              failed: false,
            });
            newLogs.push(makeLog(newDay, 'morning', 'Grixle has posted a new contract: Territory Acquisition.'));
          }
          if (!hasBank) {
            updatedContracts.push({
              id: `contract-bank-${newDay}`,
              npcId: 'bank',
              title: 'Vault Liquidation',
              description: `Barrax needs you to sell 3 hoard items through the auction house by Day ${newDay + 14}.`,
              reward: { gold: 40 },
              deadline: newDay + 14,
              condition: 'sellItems',
              targetCount: 3,
              progress: 0,
              completed: false,
              failed: false,
            });
            newLogs.push(makeLog(newDay, 'morning', 'Barrax has posted a new contract: Vault Liquidation.'));
          }
          if (!hasInnkeeper) {
            updatedContracts.push({
              id: `contract-innkeeper-${newDay}`,
              npcId: 'innkeeper',
              title: 'Pest Control',
              description: `Rosie wants adventurers driven off. Defeat 2 by Day ${newDay + 14} and she'll treat your kobolds to a feast.`,
              reward: { koboldMorale: 15 },
              deadline: newDay + 14,
              condition: 'defeatAdventurers',
              targetCount: 2,
              progress: 0,
              completed: false,
              failed: false,
            });
            newLogs.push(makeLog(newDay, 'morning', 'Rosie has posted a new contract: Pest Control.'));
          }
        }

        // ── Dragon Council Vote (every 25 days) ──────────────────────────
        if (newDay % 25 === 0) {
          const motion = pickRandomCouncilMotion();
          newPendingEvents.push(buildCouncilVotePendingEvent(motion));
          newLogs.push(makeLog(newDay, 'morning', `The Dragon Council convenes! A vote on "${motion.name}" is called.`));
        }

        // ── Property Deed Auction (20% chance each morning) ──────────────────
        let newAuction: PropertyAuction | null = state.activePropertyAuction ?? null;
        if (!newAuction && Math.random() < 0.20) {
          const allProps = districts.flatMap(d => d.properties);
          const rivalOwnedSet = new Set(updatedRivals.flatMap(r => r.propertyIds));
          const unclaimed = allProps.filter(
            p => !state.playerPropertyIds.includes(p.id) && !rivalOwnedSet.has(p.id)
          );
          if (unclaimed.length > 0) {
            const picked = unclaimed[Math.floor(Math.random() * unclaimed.length)];
            const auctionMult = getModifier(newStatusEffects, 'auctionBonus') || 1;
            const initialBid = Math.round(picked.goldPrice * 0.65 * auctionMult);
            const initRival = updatedRivals[Math.floor(Math.random() * updatedRivals.length)];
            newAuction = {
              propertyId: picked.id,
              currentBid: initialBid,
              currentLeader: initRival.id,
              roundsLeft: 3,
            };
            newPendingEvents.push({
              defId: 'auction_started',
              title: '⚡ Deed Auction Opened!',
              icon: '🏷️',
              description: `A deed for ${picked.name} has entered competitive auction! ${initRival.name} opened with a bid of ${initialBid} gold. Visit the Realty to counter-bid — you have 3 rounds!`,
              effectSummary: `Opening bid: ${initialBid}g. Rounds remaining: 3.`,
              isPassive: true,
            });
            newLogs.push(makeLog(newDay, 'morning', `Deed auction opened for ${picked.name}! Opening bid: ${initialBid}g.`));
          }
        }

        // ── Prisoner Ransom Resolution ─────────────────────────────────────
        let updatedRansom: PrisonerRansom | null = state.activeRansom ?? null;
        if (updatedRansom && !updatedRansom.collected && newDay === updatedRansom.dueOnDay) {
          const sabotaged = Math.random() < 0.15;
          if (sabotaged) {
            const sabotagingRival = updatedRivals[Math.floor(Math.random() * updatedRivals.length)];
            const escapeMsg = `A rival helped ${updatedRansom.heroName} escape! The ransom was lost.`;
            newLogs.push(makeLog(newDay, 'morning', escapeMsg));
            newPendingEvents.push({
              defId: 'ransom_sabotaged',
              title: 'Prisoner Escaped!',
              icon: '🔓',
              description: `${sabotagingRival.name} orchestrated the escape of ${updatedRansom.heroName}! Your captive slipped away in the night and the guild's gold never arrived.`,
              effectSummary: 'Ransom sabotaged — no gold collected.',
              isPassive: true,
            });
            updatedRansom = null;
          } else {
            const payout = updatedRansom.baseAmount + Math.floor(newDread / 10) * 5;
            newGold += payout;
            const payoutMsg = `Ransom paid — ${updatedRansom.heroName}'s guild paid ${payout} gold for their return.`;
            newLogs.push(makeLog(newDay, 'morning', payoutMsg));
            newPendingEvents.push({
              defId: 'ransom_paid',
              title: 'Ransom Paid!',
              icon: '💰',
              description: `${updatedRansom.heroName}'s adventuring guild has delivered ${payout} gold to secure their companion's release. A most profitable arrangement.`,
              effectSummary: `+${payout} gold received.`,
              isPassive: true,
            });
            updatedRansom = null;
          }
        }

        // ── Black Market Stock Generation (every 5 days) ─────────────────
        let newBlackMarketStock = state.blackMarketStock;
        let newBlackMarketRefreshDay = state.blackMarketRefreshDay ?? 0;
        if (newDay % 5 === 0) {
          const bmItems: BlackMarketItem[] = [];
          const hoardName = BM_STOLEN_GOODS[Math.floor(Math.random() * BM_STOLEN_GOODS.length)];
          const baseValue = Math.round(40 + Math.random() * 60);
          bmItems.push({
            id: `bm-hoard-${newDay}`,
            type: 'hoard',
            label: hoardName,
            description: `Stolen goods of uncertain provenance. Worth approximately ${baseValue} gold at auction.`,
            cost: Math.round(baseValue * 0.6),
            purchased: false,
          });
          const bmTier: 'standard' | 'skilled' = Math.random() < 0.5 ? 'standard' : 'skilled';
          const bmWage = bmTier === 'standard' ? 4 : 7;
          const bmRole = BM_ROLES[Math.floor(Math.random() * BM_ROLES.length)];
          const bmSpecies = BM_SPECIES[Math.floor(Math.random() * BM_SPECIES.length)];
          const bmName = BM_KOBOLD_NAMES[Math.floor(Math.random() * BM_KOBOLD_NAMES.length)];
          const bmTrait = ROLE_TRAIT_DEFINITIONS[bmRole];
          bmItems.push({
            id: `bm-kobold-${newDay}`,
            type: 'kobold',
            label: `${bmName} the ${bmTier} ${bmRole}`,
            description: `A ${bmSpecies} kobold seeking new employment. Already has the ${bmTrait.label} trait.`,
            cost: bmWage * 8,
            purchased: false,
            koboldData: { name: bmName, species: bmSpecies, role: bmRole, tier: bmTier, dailyWage: bmWage, morale: 70, loyalty: 60, daysEmployed: 0, trait: bmTrait },
          });
          const intelCount = 1 + Math.floor(Math.random() * 2);
          const shuffledRivals = [...updatedRivals].sort(() => Math.random() - 0.5);
          for (let i = 0; i < Math.min(intelCount, shuffledRivals.length); i++) {
            const ir = shuffledRivals[i];
            bmItems.push({
              id: `bm-intel-${newDay}-${ir.id}`,
              type: 'intel',
              label: `Intel on ${ir.name}`,
              description: `Whispered intelligence on ${ir.name}'s financial position and current holdings.`,
              cost: Math.round(40 + Math.random() * 40),
              purchased: false,
              rivalId: ir.id,
            });
          }
          if (newDread > 50) {
            const eliteTier: 'skilled' | 'elite' = Math.random() < 0.5 ? 'skilled' : 'elite';
            const eliteWage = eliteTier === 'skilled' ? 7 : 12;
            const eliteRole = BM_ROLES[Math.floor(Math.random() * BM_ROLES.length)];
            const eliteSpecies = BM_SPECIES[Math.floor(Math.random() * BM_SPECIES.length)];
            const eliteName = BM_KOBOLD_NAMES[Math.floor(Math.random() * BM_KOBOLD_NAMES.length)];
            const eliteTrait = ROLE_TRAIT_DEFINITIONS[eliteRole];
            bmItems.push({
              id: `bm-kobold-elite-${newDay}`,
              type: 'kobold',
              label: `${eliteName} the ${eliteTier} ${eliteRole}`,
              description: `A fearsome ${eliteSpecies} kobold drawn by your dread. Has the ${eliteTrait.label} trait.`,
              cost: eliteWage * 8,
              purchased: false,
              koboldData: { name: eliteName, species: eliteSpecies, role: eliteRole, tier: eliteTier, dailyWage: eliteWage, morale: 80, loyalty: 70, daysEmployed: 0, trait: eliteTrait },
            });
          }
          newBlackMarketStock = bmItems;
          newBlackMarketRefreshDay = newDay + 5;
          newLogs.push(makeLog(newDay, 'morning', 'The Fence has new wares. Visit the Back Room to browse stolen goods.'));
        }

        // ── Title Checks ──────────────────────────────────────────────────
        const snapForTitles: GameState = {
          ...state,
          day: newDay,
          dread: newDread,
          gold: newGold,
          kobolds: updatedKobolds,
          rivals: updatedRivals,
          hoardItems: newHoardItems,
          dragon: state.dragon ? { ...state.dragon, age: newDay, ageTier } : null,
          activeContracts: updatedContracts,
        };
        const currentEarnedTitles = [...(state.earnedTitles ?? [])];
        for (const def of TITLE_DEFS) {
          if (!currentEarnedTitles.includes(def.id) && def.check(snapForTitles)) {
            currentEarnedTitles.push(def.id);
            newPendingEvents.push({
              defId: `title_${def.id}`,
              title: `Title Earned: ${def.label}!`,
              icon: '🏅',
              description: `Your deeds have earned you the title of ${def.label}. ${def.description}`,
              effectSummary: 'A new title has been added to your Chronicle.',
              isPassive: true,
            });
            newLogs.push(makeLog(newDay, 'morning', `New title earned: ${def.label}!`));
          }
        }

        set({
          day: newDay,
          timeOfDay: 'morning',
          morningActionUsed: false,
          afternoonActionUsed: false,
          eveningResults: null,
          activeScreen: 'hub',
          status: newStatus,
          dragon: state.dragon ? { ...state.dragon, age: newDay, ageTier } : null,
          statusEffects: newStatusEffects,
          pendingEvents: [...state.pendingEvents, ...newPendingEvents],
          activeIncursions: newIncursions,
          dread: newDread,
          gold: newGold,
          kobolds: updatedKobolds,
          rivals: updatedRivals,
          hoardItems: newHoardItems,
          gameLog: [...state.gameLog.slice(-100), ...newLogs],
          goldHistory: newGold !== state.gold
            ? [...state.goldHistory, { day: newDay, gold: newGold }]
            : state.goldHistory,
          ageTierAchieved: newAgeTierAchieved,
          dragonCurrentHP: null,
          earnedTitles: currentEarnedTitles,
          activeContracts: updatedContracts,
          activePropertyAuction: newAuction,
          activeRansom: updatedRansom,
          blackMarketStock: newBlackMarketStock,
          blackMarketRefreshDay: newBlackMarketRefreshDay,
          pendingExpeditionResult: null,
          dragonAbilityUsedToday: false,
          seasonalEventFiredThisSeason: newSeasonalEventFiredThisSeason,
          tournamentActive: newTournamentActive,
        });
      },

      sendExpedition: (koboldIds) => {
        const state = get();
        if (koboldIds.length === 0 || state.pendingExpeditionResult) return;

        const scoutCount = koboldIds.filter(id =>
          state.kobolds.find(k => k.id === id)?.role === 'scout'
        ).length;

        const lootChance = 40 + scoutCount * 10;
        const intelChance = 30;
        const injuryChance = Math.max(0, 20 - scoutCount * 5);
        const capturedChance = Math.max(0, 10 - scoutCount * 5);

        const roll = Math.random() * 100;
        let outcome: ExpeditionResult['outcome'];
        if (roll < lootChance) outcome = 'loot';
        else if (roll < lootChance + intelChance) outcome = 'intel';
        else if (roll < lootChance + intelChance + injuryChance) outcome = 'injury';
        else outcome = 'captured';

        const koboldNames = koboldIds
          .map(id => state.kobolds.find(k => k.id === id)?.name ?? 'Unknown')
          .join(' and ');

        const detailMap: Record<ExpeditionResult['outcome'], string> = {
          loot:     `${koboldNames} returned from the ruins bearing salvaged treasure!`,
          intel:    `${koboldNames} scouted the ruins and returned with valuable field intelligence.`,
          injury:   `${koboldNames} encountered hostile forces and returned battered and bruised.`,
          captured: `${koboldNames} did not return. They were captured by hostile forces.`,
        };

        const result: ExpeditionResult = { koboldIds, outcome, detail: detailMap[outcome] };
        const log = makeLog(state.day, state.timeOfDay, `Expedition dispatched — ${koboldNames} sent into the ruins.`);

        set({
          kobolds: state.kobolds.map(k =>
            koboldIds.includes(k.id) ? { ...k, onExpedition: true } : k
          ),
          pendingExpeditionResult: result,
          gameLog: [...state.gameLog.slice(-100), log],
        });
      },

      placeBid: (amount) => {
        const state = get();
        const auction = state.activePropertyAuction;
        if (!auction) return;
        if (amount < auction.currentBid + 5) return;
        if (state.gold < amount) return;

        const allProps = districts.flatMap(d => d.properties);
        const prop = allProps.find(p => p.id === auction.propertyId);
        const propName = prop?.name ?? auction.propertyId;

        const newLogs: GameLogEntry[] = [
          makeLog(state.day, state.timeOfDay, `You bid ${amount}g on ${propName}.`),
        ];

        const rivalCandidates = state.rivals
          .filter(r => r.propertyIds.length < 6)
          .map(r => {
            const counterBid = amount + Math.floor(Math.random() * 10) + 5;
            const virtualGold = 400 - r.propertyIds.length * 30;
            return { rival: r, counterBid, canBid: virtualGold >= counterBid };
          })
          .filter(c => c.canBid);

        if (rivalCandidates.length > 0) {
          const { rival, counterBid } = rivalCandidates[Math.floor(Math.random() * rivalCandidates.length)];
          const newRoundsLeft = auction.roundsLeft - 1;
          newLogs.push(makeLog(state.day, state.timeOfDay, `${rival.name} counter-bids ${counterBid}g! Rounds left: ${newRoundsLeft}.`));

          if (newRoundsLeft <= 0) {
            const updatedRivals = state.rivals.map(r =>
              r.id === rival.id ? { ...r, propertyIds: [...r.propertyIds, auction.propertyId] } : r
            );
            set(s => ({
              rivals: updatedRivals,
              activePropertyAuction: null,
              pendingEvents: [...s.pendingEvents, {
                defId: 'auction_rival_won',
                title: 'Auction Lost!',
                icon: '😤',
                description: `${rival.name} outbid you on ${propName} with a final offer of ${counterBid} gold. The deed is theirs!`,
                effectSummary: `${propName} claimed by ${rival.name}.`,
                isPassive: true,
              }],
              gameLog: [...s.gameLog.slice(-100), ...newLogs],
            }));
            return;
          }

          set(s => ({
            activePropertyAuction: { ...auction, currentBid: counterBid, currentLeader: rival.id, roundsLeft: newRoundsLeft },
            gameLog: [...s.gameLog.slice(-100), ...newLogs],
          }));
        } else {
          const newGold = state.gold - amount;
          const newPlayerIds = [...state.playerPropertyIds, auction.propertyId];
          const winThreshold = state.gameSettings?.winThreshold ?? TOTAL_PROPERTIES;
          const newStatus: GameStatus = newPlayerIds.length >= winThreshold ? 'won' : state.status;
          set(s => ({
            gold: newGold,
            playerPropertyIds: newPlayerIds,
            status: newStatus,
            activePropertyAuction: null,
            pendingEvents: [...s.pendingEvents, {
              defId: 'auction_player_won',
              title: 'Auction Won!',
              icon: '🏆',
              description: `No rival dared to match your offer! ${propName} is yours for ${amount} gold.`,
              effectSummary: `Acquired ${propName} for ${amount} gold.`,
              isPassive: true,
            }],
            playerPropertyAcquiredDays: { ...(s.playerPropertyAcquiredDays ?? {}), [auction.propertyId]: state.day },
            gameLog: [...s.gameLog.slice(-100), ...newLogs],
            goldHistory: [...s.goldHistory, { day: state.day, gold: newGold }],
          }));
        }
      },

      resolvePropertyAuction: () => {
        const state = get();
        const auction = state.activePropertyAuction;
        if (!auction) return;
        const allProps = districts.flatMap(d => d.properties);
        const prop = allProps.find(p => p.id === auction.propertyId);
        const propName = prop?.name ?? auction.propertyId;

        if (auction.currentLeader === 'player') {
          if (state.gold < auction.currentBid) {
            const fallbackRival = state.rivals[Math.floor(Math.random() * state.rivals.length)];
            set(s => ({
              rivals: state.rivals.map(r =>
                r.id === fallbackRival.id ? { ...r, propertyIds: [...r.propertyIds, auction.propertyId] } : r
              ),
              activePropertyAuction: null,
              pendingEvents: [...s.pendingEvents, {
                defId: 'auction_forfeit',
                title: 'Auction Forfeited!',
                icon: '😰',
                description: `You couldn't cover the winning bid for ${propName}. ${fallbackRival.name} swooped in to claim the deed.`,
                effectSummary: `${propName} claimed by ${fallbackRival.name}.`,
                isPassive: true,
              }],
            }));
          } else {
            const newGold = state.gold - auction.currentBid;
            const newPlayerIds = [...state.playerPropertyIds, auction.propertyId];
            const winThreshold = state.gameSettings?.winThreshold ?? TOTAL_PROPERTIES;
            const newStatus: GameStatus = newPlayerIds.length >= winThreshold ? 'won' : state.status;
            const log = makeLog(state.day, state.timeOfDay, `Auction settled — acquired ${propName} for ${auction.currentBid} gold.`);
            set(s => ({
              gold: newGold,
              playerPropertyIds: newPlayerIds,
              status: newStatus,
              activePropertyAuction: null,
              pendingEvents: [...s.pendingEvents, {
                defId: 'auction_player_won',
                title: 'Auction Won!',
                icon: '🏆',
                description: `${propName} is yours! Final price: ${auction.currentBid} gold.`,
                effectSummary: `Acquired ${propName} for ${auction.currentBid} gold.`,
                isPassive: true,
              }],
              playerPropertyAcquiredDays: { ...(s.playerPropertyAcquiredDays ?? {}), [auction.propertyId]: state.day },
              gameLog: [...s.gameLog.slice(-100), log],
              goldHistory: [...s.goldHistory, { day: state.day, gold: newGold }],
            }));
          }
        } else {
          const rivalId = auction.currentLeader as number;
          const rival = state.rivals.find(r => r.id === rivalId);
          set(s => ({
            rivals: state.rivals.map(r =>
              r.id === rivalId ? { ...r, propertyIds: [...r.propertyIds, auction.propertyId] } : r
            ),
            activePropertyAuction: null,
            pendingEvents: [...s.pendingEvents, {
              defId: 'auction_rival_won',
              title: 'Auction Lost!',
              icon: '😤',
              description: `${rival?.name ?? 'A rival'} secured the deed to ${propName} for ${auction.currentBid} gold. Better luck next time.`,
              effectSummary: `${propName} claimed by ${rival?.name ?? 'a rival'}.`,
              isPassive: true,
            }],
          }));
        }
      },

      buildPropertyUpgrade: (propertyId, upgradeId) => {
        const state = get();
        if (!state.playerPropertyIds.includes(propertyId)) return;
        const upgradeDef = PROPERTY_UPGRADES.find(u => u.id === upgradeId);
        if (!upgradeDef) return;
        if (state.gold < upgradeDef.cost) return;
        const alreadyBuilt = (state.propertyUpgrades ?? []).some(
          u => u.propertyId === propertyId && u.upgradeId === upgradeId
        );
        if (alreadyBuilt) return;
        const acquiredDay = (state.playerPropertyAcquiredDays ?? {})[propertyId] ?? state.day;
        const daysOwned = state.day - acquiredDay;
        if (daysOwned < upgradeDef.minDaysOwned) return;
        const allProps = districts.flatMap(d => d.properties);
        const prop = allProps.find(p => p.id === propertyId);
        if (!prop) return;
        const SIZE_RANK: Record<string, number> = { small: 0, medium: 1, large: 2, grand: 3 };
        if (upgradeDef.requiresLairSize && SIZE_RANK[prop.lairSize] < SIZE_RANK[upgradeDef.requiresLairSize]) return;
        const newGold = state.gold - upgradeDef.cost;
        const newUpgrade: PropertyUpgrade = { propertyId, upgradeId, builtOnDay: state.day };
        const log = makeLog(state.day, state.timeOfDay, `Built ${upgradeDef.name} at ${prop.name} for ${upgradeDef.cost} gold.`);
        playSound('coinLoss');
        set({
          gold: newGold,
          propertyUpgrades: [...(state.propertyUpgrades ?? []), newUpgrade],
          gameLog: [...state.gameLog.slice(-100), log],
          goldHistory: [...state.goldHistory, { day: state.day, gold: newGold }],
        });
      },

      updateRivalRelationship: (rivalId, delta) => set({
        rivals: get().rivals.map(r =>
          r.id === rivalId
            ? { ...r, relationship: Math.max(0, Math.min(100, r.relationship + delta)) }
            : r
        ),
      }),

      logEvent: (message) => {
        const state = get();
        const log = makeLog(state.day, state.timeOfDay, message);
        set({ gameLog: [...state.gameLog.slice(-100), log] });
      },

      trackAdventurerDefeated: () => {
        set({ adventurersDefeated: get().adventurersDefeated + 1 });
        get().updateContractProgress('defeatAdventurers');
      },

      trackCombatLoss: () => set({ combatLosses: get().combatLosses + 1 }),

      dismissPendingEvent: () => {
        const state = get();
        set({ pendingEvents: state.pendingEvents.slice(1) });
      },

      resolveEventChoice: (choiceIndex) => {
        const state = get();
        const ev = state.pendingEvents[0];
        if (!ev) return;

        // ── Narrative Seasonal Event Choices ──────────────────────────────────
        if (ev.defId.startsWith('narrative_')) {
          const choiceLogs: GameLogEntry[] = [];
          let newStatusEffects = [...state.statusEffects];
          let newGold = state.gold;
          let newTournamentActive = state.tournamentActive ?? false;

          if (ev.defId === 'narrative_spring') {
            if (choiceIndex === 0) {
              newStatusEffects = [...newStatusEffects, makeStatusEffect({
                name: 'Guild Tournament',
                icon: '🏆',
                description: 'Combat gold & loot rewards ×2.',
                affectedStat: 'combatReward',
                modifier: 2,
                expiresOnDay: state.day + 5,
              })];
              newTournamentActive = true;
              choiceLogs.push(makeLog(state.day, state.timeOfDay, 'Accepted the Guild Tournament! Combat rewards ×2 for 5 days. Incursion rate doubled.'));
            } else {
              choiceLogs.push(makeLog(state.day, state.timeOfDay, 'Laid low during the Guild Tournament. No extra risk or reward.'));
            }
          } else if (ev.defId === 'narrative_summer') {
            if (choiceIndex === 0) {
              newStatusEffects = [...newStatusEffects, makeStatusEffect({
                name: 'Grand Trade Fair',
                icon: '🛒',
                description: 'Auction starting prices +30%.',
                affectedStat: 'auctionBonus',
                modifier: 1.3,
                expiresOnDay: state.day + 4,
              })];
              choiceLogs.push(makeLog(state.day, state.timeOfDay, 'Opened hoard for the Grand Trade Fair. Auction prices +30% for 4 days.'));
            } else {
              choiceLogs.push(makeLog(state.day, state.timeOfDay, 'Ignored the Grand Trade Fair.'));
            }
          } else if (ev.defId === 'narrative_winter') {
            if (choiceIndex === 0) {
              newStatusEffects = [...newStatusEffects, makeStatusEffect({
                name: 'Frozen Passes',
                icon: '❄️',
                description: 'Roads frozen — no property purchases for 6 days.',
                affectedStat: 'propertyFreeze',
                modifier: 1,
                expiresOnDay: state.day + 6,
              })];
              choiceLogs.push(makeLog(state.day, state.timeOfDay, 'Mountain passes frozen. No property purchases for 6 days.'));
            } else {
              newGold = Math.max(0, state.gold - 80);
              choiceLogs.push(makeLog(state.day, state.timeOfDay, 'Bribed the road wardens for 80 gold. Mountain passes remain open.'));
            }
          }

          set({
            pendingEvents: state.pendingEvents.slice(1),
            statusEffects: newStatusEffects,
            gold: newGold,
            tournamentActive: newTournamentActive,
            gameLog: [...state.gameLog.slice(-100), ...choiceLogs],
            ...(newGold !== state.gold ? { goldHistory: [...state.goldHistory, { day: state.day, gold: newGold }] } : {}),
          });
          return;
        }

        const def = ALL_RANDOM_EVENTS.find(e => e.id === ev.defId);
        if (!def?.choices) {
          set({ pendingEvents: state.pendingEvents.slice(1) });
          return;
        }
        const choiceFn = def.choices[choiceIndex];
        if (!choiceFn) {
          set({ pendingEvents: state.pendingEvents.slice(1) });
          return;
        }
        const snap = {
          dread: state.dread,
          kobolds: state.kobolds,
          rivals: state.rivals,
          hoardItems: state.hoardItems,
          gold: state.gold,
          day: state.day,
          dragon: state.dragon,
        };
        const outcome = choiceFn.apply(snap);
        const applied = applyEventOutcome(outcome, snap, state.day);

        const newGold = Math.max(0, state.gold + applied.goldDelta);
        const newDread = Math.max(0, Math.min(100, state.dread + applied.dreadDelta));
        let newStatusEffects = [...state.statusEffects];
        if (applied.statusEffect) newStatusEffects = [...newStatusEffects, applied.statusEffect];
        let newHoardItems = [...state.hoardItems];
        if (applied.hoardItemAdd) newHoardItems = [...newHoardItems, applied.hoardItemAdd];
        if (applied.hoardItemRemoveRandom && newHoardItems.length > 0) {
          const idx = Math.floor(Math.random() * newHoardItems.length);
          newHoardItems = newHoardItems.filter((_, i) => i !== idx);
        }
        let newRivals = [...state.rivals];
        if (applied.rivalRelDelta) {
          newRivals = newRivals.map(r =>
            r.id === applied.rivalRelDelta!.rivalId
              ? { ...r, relationship: Math.max(0, Math.min(100, r.relationship + applied.rivalRelDelta!.delta)) }
              : r
          );
        }

        const log = makeLog(state.day, state.timeOfDay, outcome.logMessage);
        set({
          gold: newGold,
          dread: newDread,
          kobolds: applied.kobolds,
          statusEffects: newStatusEffects,
          hoardItems: newHoardItems,
          rivals: newRivals,
          pendingEvents: state.pendingEvents.slice(1),
          gameLog: [...state.gameLog.slice(-100), log],
          goldHistory: newGold !== state.gold
            ? [...state.goldHistory, { day: state.day, gold: newGold }]
            : state.goldHistory,
        });
      },

      resolveCouncilVote: (motionId, playerVoteAye) => {
        const state = get();
        const motion = getCouncilMotion(motionId);
        if (!motion) return;

        const rivalVotes = simulateRivalVotes(state.rivals, playerVoteAye);
        const allAye = [playerVoteAye, ...rivalVotes.map(v => v.votedAye)];
        const tallyAye = allAye.filter(Boolean).length;
        const tallyNay = allAye.length - tallyAye;
        const passed = tallyAye > tallyNay;
        const playerFavored = (passed && playerVoteAye) || (!passed && !playerVoteAye);

        const result: CouncilVoteResult = {
          motionId,
          motionName: motion.name,
          playerVoteAye,
          rivalVotes,
          tallyAye,
          tallyNay,
          passed,
          playerFavored,
        };

        let newStatusEffects = [...state.statusEffects];
        let updatedRivals = [...state.rivals];

        if (passed) {
          if (motion.statusEffectOnPass) {
            newStatusEffects = [...newStatusEffects, motion.statusEffectOnPass(state.day)];
          }
          if (motion.solidarityOnPass) {
            updatedRivals = updatedRivals.map(r => ({
              ...r,
              relationship: Math.min(100, r.relationship + 10),
            }));
          }
        }

        const outcome = passed
          ? `Council motion "${motion.name}" PASSED (${tallyAye}–${tallyNay}). ${motion.ayeSummary}`
          : `Council motion "${motion.name}" failed (${tallyAye}–${tallyNay}).`;
        const log = makeLog(state.day, state.timeOfDay, outcome);

        set({
          councilVoteResult: result,
          statusEffects: newStatusEffects,
          rivals: updatedRivals,
          gameLog: [...state.gameLog.slice(-100), log],
        });
      },

      clearCouncilVoteResult: () => {
        const state = get();
        set({
          councilVoteResult: null,
          pendingEvents: state.pendingEvents.slice(1),
        });
      },

      dismissIncursion: (id) => {
        set(s => ({ activeIncursions: s.activeIncursions.filter(i => i.id !== id) }));
      },

      formAlliance: (rivalId) => {
        const state = get();
        const rival = state.rivals.find(r => r.id === rivalId);
        if (!rival) return;
        const log = makeLog(state.day, state.timeOfDay, `Forged a territorial accord with ${rival.name}. Relationship +30.`);
        set({
          rivals: state.rivals.map(r =>
            r.id === rivalId ? { ...r, relationship: Math.min(100, r.relationship + 30) } : r
          ),
          gameLog: [...state.gameLog.slice(-100), log],
          pendingEvents: [...state.pendingEvents, {
            defId: 'alliance_formed',
            title: 'Alliance Forged!',
            icon: '🤝',
            description: `A territorial accord has been struck with ${rival.name}. Kobold neutrality is agreed upon — neither side poaches the other's workers while the pact holds.`,
            effectSummary: `Relationship with ${rival.name} +30.`,
            isPassive: true,
          }],
        });
      },

      buildLairRoom: (roomId) => {
        const state = get();
        const room = LAIR_ROOMS.find(r => r.id === roomId);
        if (!room || state.gold < room.cost || (state.lairRooms ?? []).includes(roomId)) return;
        let newKobolds = state.kobolds;
        if (roomId === 'kobold-barracks') {
          newKobolds = state.kobolds.map(k => ({ ...k, morale: Math.min(100, k.morale + 10) }));
        }
        const newGold = state.gold - room.cost;
        playSound('coinLoss');
        const log = makeLog(state.day, state.timeOfDay, `Constructed ${room.name} in the lair for ${room.cost} gold.`);
        set({
          gold: newGold,
          lairRooms: [...(state.lairRooms ?? []), roomId],
          kobolds: newKobolds,
          gameLog: [...state.gameLog.slice(-100), log],
          goldHistory: [...state.goldHistory, { day: state.day, gold: newGold }],
        });
      },

      sabotageRival: (rivalId, type, theftRoll) => {
        const state = get();
        const rival = state.rivals.find(r => r.id === rivalId);
        if (!rival) return;

        if (type === 'sabotage') {
          const allProps = districts.flatMap(d => d.properties);
          const propId = rival.propertyIds[Math.floor(Math.random() * rival.propertyIds.length)];
          const prop = allProps.find(p => p.id === propId);

          let updatedKobolds = [...state.kobolds];
          if (updatedKobolds.length > 0) {
            const idx = Math.floor(Math.random() * updatedKobolds.length);
            updatedKobolds[idx] = {
              ...updatedKobolds[idx],
              morale: Math.max(0, updatedKobolds[idx].morale - 10),
            };
          }

          const updatedRivals = state.rivals.map(r =>
            r.id === rivalId
              ? { ...r, relationship: Math.max(0, r.relationship - 5), sabotagedUntilDay: state.day + 3 }
              : r
          );

          const log = makeLog(
            state.day, state.timeOfDay,
            `Scouts sabotaged ${prop?.name ?? 'rival territory'} belonging to ${rival.name}. Operations disrupted for 3 days. Relationship −5.`,
          );
          set({ rivals: updatedRivals, kobolds: updatedKobolds, gameLog: [...state.gameLog.slice(-100), log] });

        } else {
          const ageTier = state.dragon?.ageTier ?? 1;
          const roll = theftRoll ?? (Math.floor(Math.random() * 20) + 1);
          const amount = roll + ageTier * 5;
          const success = roll >= 11;
          const newGold = Math.max(0, state.gold + (success ? amount : -amount));

          const resultText = success
            ? `Heist against ${rival.name} succeeded! Stole ${amount} gold. (Roll: ${roll})`
            : `Heist against ${rival.name} failed — guards were waiting. Lost ${amount} gold. (Roll: ${roll})`;

          const log = makeLog(state.day, state.timeOfDay, resultText);
          set({
            gold: newGold,
            gameLog: [...state.gameLog.slice(-100), log],
            goldHistory: [...state.goldHistory, { day: state.day, gold: newGold }],
          });
        }
      },

      updateContractProgress: (type: ContractCondition, amount = 1) => {
        const state = get();
        let goldReward = 0;
        let dreadReward = 0;
        let koboldMoraleReward = 0;
        const completedTitles: string[] = [];
        const newContracts = (state.activeContracts ?? []).map((c: Contract) => {
          if (c.completed || c.failed || c.condition !== type) return c;
          const newProgress = Math.min(c.progress + amount, c.targetCount);
          const justCompleted = newProgress >= c.targetCount;
          if (justCompleted) {
            goldReward += c.reward.gold ?? 0;
            dreadReward += c.reward.dread ?? 0;
            koboldMoraleReward += c.reward.koboldMorale ?? 0;
            completedTitles.push(c.title);
          }
          return { ...c, progress: newProgress, completed: justCompleted };
        });
        const newGold = state.gold + goldReward;
        const newDread = Math.max(0, Math.min(100, state.dread + dreadReward));
        const newKobolds = koboldMoraleReward > 0
          ? state.kobolds.map(k => ({ ...k, morale: Math.min(100, k.morale + koboldMoraleReward) }))
          : state.kobolds;
        const newLogs = completedTitles.map(title =>
          makeLog(state.day, state.timeOfDay, `Contract completed: "${title}"! Reward applied.`)
        );
        set({
          activeContracts: newContracts,
          gold: newGold,
          dread: newDread,
          kobolds: newKobolds,
          gameLog: [...state.gameLog.slice(-100), ...newLogs],
          ...(goldReward !== 0 ? { goldHistory: [...state.goldHistory, { day: state.day, gold: newGold }] } : {}),
        });
      },

      captureForRansom: (heroName, baseAmount) => {
        const state = get();
        const rawOffset = 3 - Math.floor(state.dread / 30);
        const daysOffset = Math.max(1, rawOffset);
        const dueOnDay = state.day + daysOffset;
        const expectedPayout = baseAmount + Math.floor(state.dread / 10) * 5;
        const log = makeLog(state.day, state.timeOfDay, `Captured ${heroName} for ransom. Payment expected in ${daysOffset} day(s).`);
        set(s => ({
          activeRansom: { heroName, baseAmount, dueOnDay, collected: false },
          pendingEvents: [...s.pendingEvents, {
            defId: 'ransom_captured',
            title: 'Prisoner Taken!',
            icon: '⛓️',
            description: `${heroName} has been taken captive! Their guild has been contacted — expect a ransom payment of approximately ${expectedPayout} gold by Day ${dueOnDay}.`,
            effectSummary: `Ransom due Day ${dueOnDay}. Expected payout: ~${expectedPayout} gold.`,
            isPassive: true,
          }],
          gameLog: [...s.gameLog.slice(-100), log],
        }));
      },

      purchaseBlackMarketItem: (itemId) => {
        const state = get();
        const stock = state.blackMarketStock;
        if (!stock) return;
        const item = stock.find(i => i.id === itemId);
        if (!item || item.purchased || state.gold < item.cost) return;

        const newGold = state.gold - item.cost;
        const newLogs: GameLogEntry[] = [
          makeLog(state.day, state.timeOfDay, `Purchased "${item.label}" from The Fence for ${item.cost} gold.`),
        ];
        const updatedStock = stock.map(i => i.id === itemId ? { ...i, purchased: true } : i);

        let newKobolds = state.kobolds;
        let newHoardItems = state.hoardItems;

        if (item.type === 'hoard') {
          const hoardItem: HoardItem = {
            id: `bm-hoard-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            name: item.label,
            baseValue: Math.round(item.cost / 0.6),
            lootedOnDay: state.day,
          };
          newHoardItems = [...state.hoardItems, hoardItem];
        } else if (item.type === 'kobold' && item.koboldData) {
          const newKobold: KoboldEmployee = {
            ...item.koboldData,
            id: `bm-kobold-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          };
          newKobolds = [...state.kobolds, newKobold];
          newLogs.push(makeLog(state.day, state.timeOfDay, `${item.koboldData.name} joins your colony as a ${item.koboldData.tier} ${item.koboldData.role}.`));
        } else if (item.type === 'intel' && item.rivalId !== undefined) {
          const rival = state.rivals.find(r => r.id === item.rivalId);
          if (rival) {
            const estimatedGold = rival.propertyIds.length * 60 + Math.round(Math.random() * 40);
            newLogs.push(makeLog(state.day, state.timeOfDay, `The Fence's intel on ${rival.name}: they hold approximately ${estimatedGold} gold.`));
          }
        }

        set({
          gold: newGold,
          blackMarketStock: updatedStock,
          kobolds: newKobolds,
          hoardItems: newHoardItems,
          gameLog: [...state.gameLog.slice(-100), ...newLogs],
          goldHistory: [...state.goldHistory, { day: state.day, gold: newGold }],
        });
      },

      useDragonAbility: (abilityId, targetRivalId) => {
        const state = get();
        if (state.dragonAbilityUsedToday || !state.dragon) return;
        const { ageTier, name: dragonName } = state.dragon;
        const ability = DRAGON_ABILITIES.find(a => a.id === abilityId);
        if (!ability || ability.minAgeTier > ageTier) return;

        let newGold = state.gold;
        let newDread = state.dread;
        let newRivals = [...state.rivals];
        let newIncursions = [...state.activeIncursions];
        let newHoardItems = [...state.hoardItems];
        let logMsg = '';

        switch (abilityId) {
          case 'intimidate': {
            if (state.rivals.length === 0) return;
            const rId = targetRivalId ?? state.rivals[0].id;
            const rival = newRivals.find(r => r.id === rId);
            newDread = Math.min(100, newDread + 8);
            newRivals = newRivals.map(r =>
              r.id === rId ? { ...r, relationship: Math.max(0, r.relationship - 10) } : r
            );
            logMsg = `${dragonName} unleashes a Territorial Roar! +8 Dread. ${rival?.name ?? 'Rival'} relationship −10.`;
            break;
          }
          case 'breath-cache': {
            const goldGain = 20 + ageTier * 15;
            newGold += goldGain;
            const loot = LOOT_TABLE[Math.floor(Math.random() * LOOT_TABLE.length)];
            newHoardItems = [...newHoardItems, {
              id: `dragon-cache-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              name: loot.name,
              baseValue: loot.baseValue,
              lootedOnDay: state.day,
            }];
            logMsg = `${dragonName}'s Searing Cache scorches an adventurer camp! +${goldGain} gold. Recovered ${loot.name}.`;
            break;
          }
          case 'delay-incursion': {
            newIncursions = newIncursions.map(inc => ({
              ...inc,
              tier: Math.max(1, inc.tier - 1) as 1 | 2 | 3 | 4,
            }));
            const count = state.activeIncursions.length;
            logMsg = count > 0
              ? `${dragonName}'s Dreadful Presence weakens approaching threats! ${count} incursion tier${count > 1 ? 's' : ''} reduced by 1.`
              : `${dragonName}'s Dreadful Presence radiates across the land. No incursions to delay.`;
            break;
          }
          case 'demand-tribute': {
            if (state.rivals.length === 0) return;
            const rId = targetRivalId ?? state.rivals[0].id;
            const rival = newRivals.find(r => r.id === rId);
            if (!rival) return;
            const tribute = rival.propertyIds.length * 20;
            if (rival.relationship >= 30) {
              newGold += tribute;
              logMsg = `${rival.name} begrudgingly delivers ${tribute} gold in tribute to ${dragonName}!`;
            } else {
              newRivals = newRivals.map(r =>
                r.id === rId ? { ...r, relationship: Math.max(0, r.relationship - 25) } : r
              );
              logMsg = `${rival.name} defiantly refuses ${dragonName}'s demand for tribute! Relationship −25. You receive nothing.`;
            }
            break;
          }
          case 'ancient-terror': {
            newDread = Math.min(100, newDread + 15);
            newRivals = newRivals.map(r => ({ ...r, relationship: Math.max(0, r.relationship - 5) }));
            newIncursions = [];
            logMsg = `${dragonName}'s Ancient Terror echoes across the realm! +15 Dread. All rival relationships −5. All incursions dismissed.`;
            break;
          }
          default:
            return;
        }

        const log = makeLog(state.day, state.timeOfDay, logMsg);
        set(s => ({
          dragonAbilityUsedToday: true,
          gold: newGold,
          dread: newDread,
          rivals: newRivals,
          activeIncursions: newIncursions,
          hoardItems: newHoardItems,
          gameLog: [...s.gameLog.slice(-100), log],
          ...(newGold !== state.gold ? { goldHistory: [...s.goldHistory, { day: state.day, gold: newGold }] } : {}),
        }));
      },

      applyLegalProtection: () => {
        const state = get();
        const cost = 30;
        if (state.gold < cost) return;
        const effect = makeStatusEffect({
          name: 'Legal Protection',
          icon: '⚖️',
          description: "Saeloril's protective clauses improve market confidence.",
          affectedStat: 'sellMultiplier',
          modifier: 0.2,
          expiresOnDay: state.day + 10,
        });
        const newGold = state.gold - cost;
        const log = makeLog(state.day, state.timeOfDay, `Filed protective clauses with Saeloril Vethran. −${cost} gold. Sell multiplier +0.2 for 10 days.`);
        set({
          gold: newGold,
          statusEffects: [...state.statusEffects, effect],
          gameLog: [...state.gameLog.slice(-100), log],
          goldHistory: [...state.goldHistory, { day: state.day, gold: newGold }],
        });
      },
    }),
    {
      name: 'hoard-holdings-save',
      partialize: (state) => {
        const { status: _s, ...rest } = state;
        return rest as Omit<GameStore, 'status'>;
      },
    }
  )
);
