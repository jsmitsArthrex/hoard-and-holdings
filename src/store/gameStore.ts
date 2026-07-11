import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  GameState, GameStatus, KoboldEmployee, KoboldRole, KoboldTrait, KoboldSpecies,
  HoardItem, Rival, GameLogEntry, EveningResult,
  ActiveIncursion, StatusEffect, PendingEvent, GameSettings, Difficulty,
  CouncilVoteResult, Contract, ContractCondition, PropertyAuction, PrisonerRansom,
  BlackMarketItem, PropertyUpgradeId, PropertyUpgrade, ExpeditionResult,
  ActiveLoan, LoanTier, ActiveDispute, NemesisData, RumourBet, PendingKoboldLetter,
  LogCategory,
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
import { dragonBreeds } from '../data/dragonBreeds';
import {
  pickRandomCouncilMotion,
  buildCouncilVotePendingEvent,
  simulateRivalVotes,
  getCouncilMotion,
  getPlayerCouncilMotion,
  simulateRivalVotesForPlayerMotion,
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

const PROMOTION_COST = { basic: 60, standard: 100, skilled: 150, elite: 150 } as const;

const LIEUTENANT_SKILLS: Record<KoboldRole, string> = {
  miner: 'foreman',
  guard: 'warden',
  treasurer: 'chief_ledger',
  scout: 'infiltrator',
  cook: 'head_chef',
};

const BM_STOLEN_GOODS = [
  'Enchanted Lockbox', 'Moonstone Idol', 'Stolen Silverware',
  'Rare Tome', 'Cursed Amulet', 'Pilfered Gem Cluster',
  'Contraband Spice', 'Forged Deed',
];
const BM_KOBOLD_NAMES = ['Skrix', 'Venn', 'Nax', 'Birtle', 'Cruzz', 'Yelp', 'Doss', 'Frink'];
const BM_SPECIES: KoboldSpecies[] = ['red', 'blue', 'green', 'purple', 'white'];
const BM_ROLES: KoboldRole[] = ['miner', 'guard', 'treasurer', 'scout', 'cook'];

const LOAN_TIERS: Record<LoanTier, { borrowedAmount: number; repayAmount: number; windowDays: number }> = {
  small:  { borrowedAmount: 75,  repayAmount: 100, windowDays: 8  },
  medium: { borrowedAmount: 150, repayAmount: 210, windowDays: 12 },
  large:  { borrowedAmount: 300, repayAmount: 450, windowDays: 18 },
};

const INITIAL_RIVALS: Rival[] = [
  { id: 0, name: 'Scorch the Relentless', breedId: 'fire',  propertyIds: ['prop_03_00', 'prop_07_00'], relationship: 50 },
  { id: 1, name: 'Frostbite the Unyielding', breedId: 'ice',   propertyIds: ['prop_00_02', 'prop_08_00'], relationship: 50 },
  { id: 2, name: 'Shadowmere the Cunning', breedId: 'dark',  propertyIds: ['prop_06_04', 'prop_09_02'], relationship: 50 },
];

function generateKoboldLetter(
  koboldName: string,
  koboldRole: string,
  daysEmployed: number,
  dragonName: string,
  currentDay: number,
): { salutation: string; letterBody: string; closing: string } {
  const salutations = [
    'To Whom It May (Reluctantly) Concern,',
    `Dear ${dragonName},`,
    'I am writing because I have things to say.',
  ];
  const salutation = salutations[Math.floor(Math.random() * salutations.length)];

  const incursionDay = Math.max(1, currentDay - 1 - Math.floor(Math.random() * 4));
  const roleBodyMap: Record<string, string> = {
    miner: `I spent ${daysEmployed} days in that mine. ${daysEmployed} days. I have counted the rocks I moved. I have also counted my wages. The rocks were worth more.`,
    guard: `I want you to know that the incursion on Day ${incursionDay} was entirely preventable. I told you. You were busy 'strategising.' I have enclosed my notes on what 'strategising' appears to mean in practice.`,
    treasurer: `The accounts were fine when I left. They will not remain fine. I say this not with malice but with professional certainty.`,
    scout: `The tunnel on the east side is still blocked. You never asked. I never volunteered it. Consider this my final report.`,
    cook: `I have taken the good pot. I believe we both know this is justified.`,
  };
  const letterBody = roleBodyMap[koboldRole] ?? roleBodyMap['miner'];

  const closings = [
    `Regards, ${koboldName} (formerly of your employ)`,
    `Do not write back. ${koboldName}`,
    `Sincerely, ${koboldName}. P.S. The morale was never 'fine.'`,
  ];
  const closing = closings[Math.floor(Math.random() * closings.length)];

  return { salutation, letterBody, closing };
}

function makeLog(day: number, tod: GameState['timeOfDay'], message: string, category: LogCategory = 'system'): GameLogEntry {
  return { id: `${Date.now()}-${Math.random()}`, day, timeOfDay: tod, message, category };
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
  logEvent: (message: string, category?: LogCategory) => void;
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
  setHoardArrangement: (type: 'pile' | 'wall' | 'cabinet') => void;
  sendRivalGift: (rivalId: number, tier: 'trinket' | 'curated' | 'legendary') => void;
  takeLoan: (tier: LoanTier) => void;
  repayLoan: () => void;
  fileDispute: (rivalId: number, propertyId: string) => void;
  makeDisputeArgument: (type: 'strong' | 'bluff' | 'weak') => void;
  resolveDispute: () => void;
  recordPartyDefeat: (partyName: string, leaderName: string, leaderClass: string) => void;
  resolveNemesisOutcome: (won: boolean, leaderName: string) => void;
  attemptAuctionBluff: (bluffAmount: number) => void;
  judgeAct: (koboldId: string, choice: 'praise' | 'critique' | 'bribe') => void;
  finishTalentShow: (score: number) => void;
  generateRumourBet: (day: number) => void;
  placeRumourBet: () => void;
  playDrinkingGame: (tier: 'copper' | 'silver' | 'dragon', outcome: 'win' | 'lose', naturalTwelve?: boolean) => void;
  proposeCouncilMotion: (motionId: string) => void;
  generateWantedPoster: () => void;
  promoteKobold: (koboldId: string) => void;
  setLieutenantAssignment: (koboldId: string, assignment: 'defence' | 'recruitment' | 'trade' | null) => void;
  enterAerialDisplay: () => void;
  purchaseFestivalItem: (itemId: string) => void;
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
  hoardArrangement: undefined,
  lastArrangementChangeDay: 0,
  activeLoan: undefined,
  activeDispute: null,
  heroPartyDefeatCounts: {},
  nemesis: undefined,
  auctionLockoutUntilDay: 0,
  lastTalentShowDay: 0,
  drinkingGamePlayedToday: false,
  rumourBet: undefined,
  councilSessionsAttended: 0,
  activeWantedPoster: undefined,
  festival: undefined,
  pendingKoboldLetters: [],
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
        get().generateRumourBet(1);
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
        const buyMarkup = getModifier(state.statusEffects, 'propertyBuyPriceModifier');
        const effectivePrice = Math.max(1, Math.round(price * (1 + buyDiscount + buyMarkup)));
        if (state.gold < effectivePrice) return;
        const prop = districts.flatMap(d => d.properties).find(p => p.id === propertyId);
        const newGold = state.gold - effectivePrice;
        const newPlayerIds = [...state.playerPropertyIds, propertyId];
        const winThreshold = state.gameSettings?.winThreshold ?? TOTAL_PROPERTIES;
        const newStatus: GameStatus = newPlayerIds.length >= winThreshold ? 'won' : state.status;
        const logs: GameLogEntry[] = [makeLog(state.day, state.timeOfDay, `Acquired ${prop?.name ?? propertyId} for ${effectivePrice} gold!`, 'property')];

        const isFestivalChallengeProp =
          state.festival?.active &&
          !state.festival.rivalChallengeWinner &&
          propertyId === state.festival.rivalChallengePropertyId;
        const festivalAfterBuy = isFestivalChallengeProp
          ? { ...state.festival!, rivalChallengeWinner: 'player' as const }
          : state.festival;
        const challengeDreadBonus = isFestivalChallengeProp ? 8 : 0;
        if (isFestivalChallengeProp) {
          logs.push(makeLog(state.day, state.timeOfDay, `You beat ${state.rivals.find(r => r.id === state.festival!.rivalChallengeRivalId)?.name ?? 'the rival'} to the festival challenge property! +8 Dread.`, 'event'));
          playSound('koboldCheer');
        }

        set({
          gold: newGold,
          playerPropertyIds: newPlayerIds,
          status: newStatus,
          dread: Math.min(100, state.dread + challengeDreadBonus),
          festival: festivalAfterBuy,
          playerPropertyAcquiredDays: { ...(state.playerPropertyAcquiredDays ?? {}), [propertyId]: state.day },
          gameLog: [...state.gameLog.slice(-500), ...logs],
          goldHistory: [...state.goldHistory, { day: state.day, gold: newGold }],
        });
        get().updateContractProgress('buyProperty');
      },

      buyFromRival: (rivalId, propertyId, price) => {
        const state = get();
        const buyDiscountRival = getModifier(state.statusEffects, 'councilVoteBonus');
        const buyMarkupRival = getModifier(state.statusEffects, 'propertyBuyPriceModifier');
        const effectivePriceRival = Math.max(1, Math.round(price * (1 + buyDiscountRival + buyMarkupRival)));
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
        const log = makeLog(state.day, state.timeOfDay, `Bought ${prop?.name ?? propertyId} from rival for ${effectivePriceRival} gold.`, 'property');
        set({
          gold: newGold,
          playerPropertyIds: newPlayerIds,
          rivals: updatedRivals,
          status: newStatus,
          playerPropertyAcquiredDays: { ...(state.playerPropertyAcquiredDays ?? {}), [propertyId]: state.day },
          gameLog: [...state.gameLog.slice(-500), log],
          goldHistory: [...state.goldHistory, { day: state.day, gold: newGold }],
        });
      },

      hireKobold: (kobold) => {
        const state = get();
        const hasRecruitmentLieutenant = state.kobolds.some(k => k.isLieutenant && k.lieutenantAssignment === 'recruitment');
        const finalKobold = hasRecruitmentLieutenant ? { ...kobold, morale: Math.min(100, kobold.morale + 10) } : kobold;
        const newGold = state.gold - finalKobold.dailyWage;
        const log = makeLog(state.day, state.timeOfDay, `Hired ${finalKobold.name} (${finalKobold.tier} ${finalKobold.role}) for ${finalKobold.dailyWage} gold/day.`, 'kobold');
        set({
          gold: newGold,
          kobolds: [...state.kobolds, finalKobold],
          gameLog: [...state.gameLog.slice(-500), log],
          goldHistory: [...state.goldHistory, { day: state.day, gold: newGold }],
        });
      },

      dismissKobold: (koboldId) => {
        const state = get();
        const k = state.kobolds.find(k => k.id === koboldId);
        const log = makeLog(state.day, state.timeOfDay, `Dismissed ${k?.name ?? 'kobold'} from the colony.`, 'kobold');
        set({
          kobolds: state.kobolds.filter(k => k.id !== koboldId),
          gameLog: [...state.gameLog.slice(-500), log],
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
        const log = makeLog(state.day, state.timeOfDay, `Bought back ${kobold.name} from ${rival.name} for ${price} gold.`, 'kobold');
        set({
          gold: newGold,
          kobolds: [...state.kobolds, kobold],
          rivals: state.rivals.map(r => r.id === rivalId ? { ...r, poachedKobold: undefined } : r),
          gameLog: [...state.gameLog.slice(-500), log],
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
        const cabinetBonus = state.hoardArrangement === 'cabinet' ? 0.05 : 0;
        const tradeAssignmentBonus = state.kobolds.some(k => k.isLieutenant && k.lieutenantAssignment === 'trade') ? 0.03 : 0;
        const mult = baseMult + sellBonus + cabinetBonus + tradeAssignmentBonus;
        const salePrice = Math.round(item.baseValue * mult);
        const newGold = state.gold + salePrice;
        const log = makeLog(state.day, state.timeOfDay, `Sold ${item.name} at auction for ${salePrice} gold.`, 'economy');
        set({
          gold: newGold,
          hoardItems: state.hoardItems.filter(h => h.id !== itemId),
          itemsSold: state.itemsSold + 1,
          gameLog: [...state.gameLog.slice(-500), log],
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
        const hasActiveDispute = !!(state.activeDispute && !state.activeDispute.resolved);
        const { rivalActions, updatedRivalPropertyIds, poachedKoboldIds, poachedKoboldsByRivalId, disputeToFile } =
          runRivalAI(state.rivals, state.playerPropertyIds, poachingFrozen ? [] : state.kobolds, state.day, aggMultiplier, hasActiveDispute);

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
          const ledgerPct = sharpLedgerKobold.isLieutenant && sharpLedgerKobold.lieutenantSkill === 'chief_ledger' ? 5 : sharpLedgerKobold.trait!.value;
          traitGoldBonus += Math.round(koboldGross * (ledgerPct / 100));
        }
        const foremanCount = state.kobolds.filter(k => k.isLieutenant && k.lieutenantSkill === 'foreman' && !k.onExpedition).length;
        if (foremanCount > 0) {
          const otherMinerCount = state.kobolds.filter(k => k.role === 'miner' && !(k.isLieutenant && k.lieutenantSkill === 'foreman') && !k.onExpedition).length;
          traitGoldBonus += otherMinerCount * foremanCount;
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
        const newKoboldLetters: PendingKoboldLetter[] = [];
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

            newLogs.push(makeLog(state.day, 'evening', revoltMsg, 'kobold'));
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

            if (Math.random() < 0.4) {
              const dragonName = state.dragon?.name ?? 'Dragon';
              const { salutation, letterBody, closing } = generateKoboldLetter(
                rebel.name, rebel.role, rebel.daysEmployed, dragonName, state.day
              );
              newKoboldLetters.push({
                koboldName: rebel.name,
                koboldRole: rebel.role,
                daysEmployed: rebel.daysEmployed,
                deliverOnDay: state.day + 3 + Math.floor(Math.random() * 3),
                letterBody,
                salutation,
                closing,
              });
            }
          }
          updatedKobolds = updatedKobolds.filter(k => k.morale > 0);
        }

        // ── Master Cook: morale regen for all surviving kobolds ──────────────
        const masterCookRegen = updatedKobolds
          .filter(k => k.trait?.id === 'master_cook')
          .reduce((sum, k) => sum + (k.isLieutenant && k.lieutenantSkill === 'head_chef' ? 3 : k.trait!.value), 0);
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
            newLogs.push(makeLog(state.day, 'evening', spawnMsg, 'combat'));
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

        // ── Nemesis Incursion Spawn ──────────────────────────────────────────
        let updatedNemesis = state.nemesis;
        const hasActiveNemesisInc = newIncursions.some(inc => inc.isNemesis);
        if (state.nemesis && !state.nemesis.isCurrentlyActive && !hasActiveNemesisInc && state.day >= state.nemesis.nextSpawnDay) {
          const visitNum = state.nemesis.nemesisVisitCount + 1;
          const visitLabel = visitNum === 1 ? '1st' : visitNum === 2 ? '2nd' : visitNum === 3 ? '3rd' : `${visitNum}th`;
          const nemInc: ActiveIncursion = {
            id: `nemesis-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            partyName: state.nemesis.partyName,
            tier: 4,
            daySpawned: state.day,
            isNemesis: true,
          };
          newIncursions.push(nemInc);
          const spawnMsg = `⚔ ${state.nemesis.leaderName} has returned — this is their ${visitLabel} visit. The air tastes of unresolved business.`;
          events.push(spawnMsg);
          newLogs.push(makeLog(state.day, 'evening', spawnMsg, 'combat'));
          newPendingEvents.push({
            defId: 'nemesis_incursion',
            title: '⚔ Nemesis Returns!',
            icon: '⚔',
            description: spawnMsg,
            effectSummary: 'Visit Hunt Adventurers to confront your nemesis before they raid!',
            isPassive: true,
          });
          updatedNemesis = { ...state.nemesis, isCurrentlyActive: true };
        }

        // ── Trophy Hall: dread bonus per hoard item ────────────────────────
        const trophyDreadBonus = lairRooms.includes('trophy-hall')
          ? Math.floor(state.hoardItems.length / 5)
          : 0;
        const grandHallCount = propertyUpgrades.filter(u => u.upgradeId === 'grand-hall' && state.playerPropertyIds.includes(u.propertyId)).length;
        const grandHallDread = grandHallCount * 2;

        // ── Hoard Arrangement Bonuses ────────────────────────────────────────
        const pileDreadBonus = state.hoardArrangement === 'pile'
          ? Math.floor(state.hoardItems.length / 10)
          : 0;
        if (state.hoardArrangement === 'wall') {
          const wallGold = Math.min(Math.floor(state.hoardItems.length * 0.5), 10);
          goldAfterNet += wallGold;
          if (wallGold > 0) events.push(`Trophy Wall arrangement granted +${wallGold} gold from kobold admiration.`);
        }

        const eveningResults: EveningResult = {
          koboldIncome: Math.round(koboldGross),
          koboldWages: Math.round(koboldWages),
          netIncome,
          rivalActions,
          events,
        };

        const logMsg = `Evening: ${netIncome >= 0 ? '+' : ''}${netIncome} gold net.${rivalActions.length ? ' ' + rivalActions[0] : ''}`;
        const log = makeLog(state.day, 'evening', logMsg, 'economy');
        const newStatus: GameStatus = goldAfterNet <= 0 ? 'lost' : state.status;

        // ── Loan Default Check ──────────────────────────────────────────────
        let updatedActiveLoan = state.activeLoan;
        let loanStatusEffects = [...state.statusEffects];
        if (state.activeLoan && state.activeLoan.dueByDay < state.day && !state.activeLoan.defaulted) {
          updatedActiveLoan = { ...state.activeLoan, defaulted: true };
          loanStatusEffects = [...loanStatusEffects, makeStatusEffect({
            name: 'Loan Default',
            icon: '⚠️',
            description: "Barrax has filed a complaint with the Dragon Council. Property purchase prices are elevated.",
            affectedStat: 'propertyBuyPriceModifier',
            modifier: 0.25,
            expiresOnDay: state.day + 10,
          })];
          updatedRivalsAfterRevolt = updatedRivalsAfterRevolt.map(r => ({
            ...r,
            relationship: Math.max(0, r.relationship - 5),
          }));
          playSound('alert');
          newPendingEvents.push({
            defId: 'loan_default',
            title: 'Barrax Default Notice',
            icon: '⚠️',
            description: `Barrax has filed a formal complaint with the Dragon Council regarding your unpaid loan of ${state.activeLoan.repayAmount}g. Word has spread through the district. Property purchase prices are inflated by 25% for 10 days, and your rivals regard you with renewed suspicion.`,
            effectSummary: 'Property buy prices +25% for 10 days. All rival relationships −5.',
            isPassive: true,
          });
          newLogs.push(makeLog(state.day, 'evening', `Loan defaulted! Barrax has filed a complaint. Property prices +25% for 10 days.`, 'economy'));
        }

        // ── Festival Rival Property Challenge ────────────────────────────────
        let updatedFestival = state.festival;
        if (state.festival?.active && !state.festival.rivalChallengeWinner && state.festival.rivalChallengePropertyId) {
          const propOwnedByPlayer = state.playerPropertyIds.includes(state.festival.rivalChallengePropertyId);
          if (propOwnedByPlayer) {
            updatedFestival = { ...state.festival, rivalChallengeWinner: 'player' };
          } else if (Math.random() < 0.3) {
            const fRival = updatedRivalsAfterRevolt.find(r => r.id === state.festival!.rivalChallengeRivalId);
            updatedFestival = { ...state.festival, rivalChallengeWinner: 'rival' };
            if (fRival) {
              updatedRivalsAfterRevolt = updatedRivalsAfterRevolt.map(r =>
                r.id === fRival.id
                  ? { ...r, relationship: Math.max(0, r.relationship - 10), propertyIds: [...r.propertyIds, state.festival!.rivalChallengePropertyId!] }
                  : r
              );
              const challengeMsg = `${fRival.name} purchased the festival challenge property before you could! ${fRival.name} relationship −10.`;
              events.push(challengeMsg);
              newLogs.push(makeLog(state.day, 'evening', challengeMsg));
              newPendingEvents.push({
                defId: 'festival_rival_won',
                title: '🎪 Festival Challenge Lost',
                icon: '🎪',
                description: `${fRival.name} swept in and secured the festival challenge property. They are very smug about it. Your relationship with them has soured further.`,
                effectSummary: `${fRival.name} acquired the challenge property. Relationship −10.`,
                isPassive: true,
              });
            }
          }
        }

        // ── Kobold Letter Delivery ────────────────────────────────────────────
        const existingKoboldLetters = state.pendingKoboldLetters ?? [];
        const dueLetters = existingKoboldLetters.filter(l => l.deliverOnDay <= state.day);
        const remainingKoboldLetters = existingKoboldLetters.filter(l => l.deliverOnDay > state.day);
        for (const letter of dueLetters) {
          newPendingEvents.push({
            defId: 'koboldLetter',
            title: `A Letter Arrived`,
            icon: '✉️',
            description: letter.letterBody,
            effectSummary: '',
            isPassive: true,
            letterSalutation: letter.salutation,
            letterBody: letter.letterBody,
            letterClosing: letter.closing,
          });
          newLogs.push(makeLog(state.day, 'evening', `A letter arrived from ${letter.koboldName}.`));
        }

        set(s => ({
          gold: goldAfterNet,
          rivals: updatedRivalsAfterRevolt,
          kobolds: updatedKobolds,
          eveningResults,
          timeOfDay: 'evening',
          activeIncursions: newIncursions,
          pendingEvents: [...s.pendingEvents, ...newPendingEvents],
          gameLog: [...s.gameLog.slice(-500), log, ...newLogs],
          goldHistory: [...s.goldHistory, { day: state.day, gold: goldAfterNet }],
          status: newStatus,
          dread: Math.min(100, s.dread + trophyDreadBonus + grandHallDread + pileDreadBonus),
          activeLoan: updatedActiveLoan,
          statusEffects: loanStatusEffects,
          nemesis: updatedNemesis,
          festival: updatedFestival,
          activeWantedPoster: s.activeWantedPoster?.expiresOnDay != null && s.activeWantedPoster.expiresOnDay <= s.day
            ? undefined
            : s.activeWantedPoster,
          pendingKoboldLetters: [...remainingKoboldLetters, ...newKoboldLetters],
        }));

        if (disputeToFile) {
          get().fileDispute(disputeToFile.rivalId, disputeToFile.propertyId);
        }
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
            newLogs.push(makeLog(newDay, 'morning', `Expedition returned with loot: ${lootName} (~${baseValue}g).`, 'kobold'));
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
            newLogs.push(makeLog(newDay, 'morning', 'Expedition returned with field intel. +3 combat bonus for 3 days.', 'kobold'));
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
            newLogs.push(makeLog(newDay, 'morning', `${expNames} returned injured. Morale −30.`, 'kobold'));
          } else if (expResult.outcome === 'captured') {
            for (const kid of expIds) {
              const k = updatedKobolds.find(k => k.id === kid);
              if (k) newLogs.push(makeLog(newDay, 'morning', `${k.name} was captured on expedition and won't return.`, 'kobold'));
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

        // ── Dispute Expiry (score 0 if unresolved past deadline) ────────────
        if (state.activeDispute && !state.activeDispute.resolved && newDay > state.activeDispute.expiresOnDay) {
          const expiredDispute = state.activeDispute;
          const expiredPropIds = state.playerPropertyIds.filter(id => id !== expiredDispute.propertyId);
          updatedRivals = updatedRivals.map(r =>
            r.id === expiredDispute.rivalId
              ? { ...r, relationship: Math.min(100, r.relationship + 10), propertyIds: [...r.propertyIds, expiredDispute.propertyId] }
              : r
          );
          newLogs.push(makeLog(newDay, 'morning', `Dispute over ${expiredDispute.propertyName} expired unresolved — property transferred to ${expiredDispute.rivalName}.`, 'rival'));
          newPendingEvents.push({
            defId: 'dispute_expired',
            title: '⚖️ Dispute Decided in Absentia',
            icon: '⚖️',
            description: `You failed to appear before the court within the allotted time. The dispute over ${expiredDispute.propertyName} has been settled in favour of ${expiredDispute.rivalName} by default. Saeloril notes she did warn you.`,
            effectSummary: `${expiredDispute.propertyName} transferred to ${expiredDispute.rivalName}. ${expiredDispute.rivalName} relationship +10.`,
            isPassive: true,
          });
          set(s => ({
            activeDispute: { ...expiredDispute, resolved: true, playerScore: 0 },
            playerPropertyIds: expiredPropIds,
          }));
        }

        // ── Auto-raid stale incursions (older than 2 days) ───────────────────
        const hasGuardPost = (state.lairRooms ?? []).includes('guard-post');
        const hasFortifiedWalls = (state.propertyUpgrades ?? []).some(u => u.upgradeId === 'fortified-walls' && state.playerPropertyIds.includes(u.propertyId));
        const hasWarden = state.kobolds.some(k => k.isLieutenant && k.lieutenantSkill === 'warden');
        const hasDefenceAssignment = state.kobolds.some(k => k.isLieutenant && k.lieutenantAssignment === 'defence');
        const staleIncursions = state.activeIncursions.filter(
          inc => newDay - inc.daySpawned > 2
        );
        for (const inc of staleIncursions) {
          let goldLost = Math.round(state.gold * 0.15);
          if (hasGuardPost) goldLost = Math.round(goldLost * 0.5);
          if (hasFortifiedWalls) goldLost = Math.round(goldLost * 0.6);
          if (hasWarden) goldLost = Math.round(goldLost * 0.9);
          if (hasDefenceAssignment) goldLost = Math.round(goldLost * 0.85);
          newGold = Math.max(0, newGold - goldLost);
          updatedKobolds = updatedKobolds.map(k => ({
            ...k,
            morale: Math.max(0, k.morale - 20),
          }));
          const raidMsg = `${inc.partyName} raided your undefended lair! Lost ${goldLost} gold and kobold morale dropped.`;
          newLogs.push(makeLog(newDay, 'morning', raidMsg, 'combat'));
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

        // ── Nemesis stale-incursion reset ────────────────────────────────────
        let updatedNemesisAdv = state.nemesis;
        const hadStaleNemesisInc = staleIncursions.some(inc => inc.isNemesis);
        if (hadStaleNemesisInc && updatedNemesisAdv) {
          updatedNemesisAdv = {
            ...updatedNemesisAdv,
            isCurrentlyActive: false,
            nextSpawnDay: newDay + 10 + Math.floor(Math.random() * 6),
          };
        }

        // ── Festival End Check ───────────────────────────────────────────────
        let newFestival = state.festival;
        if (state.festival?.active && newDay > state.festival.endsOnDay) {
          newFestival = { ...state.festival, active: false };
          newPendingEvents.push({
            defId: 'festival_ends',
            title: '🎪 Festival Concludes',
            icon: '🎪',
            description: 'The coloured smoke has cleared. The Grand Dragon Festival is over for another year. The realm returns to its usual schedule of petty squabbles and property disputes.',
            effectSummary: 'Festival window closed.',
            isPassive: true,
          });
          newLogs.push(makeLog(newDay, 'morning', 'The Grand Dragon Festival has concluded.', 'event'));
        }

        // ── Seasonal Event / Annual Festival ─────────────────────────────────
        const season = getSeasonTransition(newDay);
        const isFestivalTrigger = season === 'spring' && newDay > 1;

        if (isFestivalTrigger) {
          const allPropsFest = districts.flatMap(d => d.properties);
          const rivalOwnedFest = new Set(updatedRivals.flatMap(r => r.propertyIds));
          const unclaimedFest = allPropsFest.filter(
            p => !state.playerPropertyIds.includes(p.id) && !rivalOwnedFest.has(p.id)
          );
          const challengeProp = unclaimedFest.length > 0
            ? unclaimedFest[Math.floor(Math.random() * unclaimedFest.length)]
            : null;
          const challengeRival = updatedRivals.length > 0
            ? updatedRivals[Math.floor(Math.random() * updatedRivals.length)]
            : null;
          newFestival = {
            active: true,
            startsOnDay: newDay,
            endsOnDay: newDay + 2,
            aerialDisplayUsed: false,
            rivalChallengePropertyId: challengeProp?.id,
            rivalChallengeRivalId: challengeRival?.id,
            rivalChallengeWinner: null,
            festivalStockPurchased: [],
          };
          newPendingEvents.push({
            defId: 'festival_begins',
            title: '🎪 Grand Dragon Festival Begins!',
            icon: '🎪',
            description: "The sky fills with coloured smoke. The Dragon Council has declared the annual Grand Festival — three days of competitive excess, inflated prices, and dragons showing off at each other. A letter from Grixle's Realty advises that property sales will 'proceed with festive urgency.' Scorch has apparently already sent a challenge.",
            effectSummary: `Festival active for 3 days. Aerial Display available. ${challengeRival?.name ?? 'A rival'} has issued a property race challenge.`,
            isPassive: true,
          });
          newLogs.push(makeLog(newDay, 'morning', 'The Grand Dragon Festival begins. Even the heroes take a week off.', 'event'));
          playSound('dragonRoar');
        } else if (season) {
          const result = buildSeasonalEvent(season, newDay, state.playerPropertyIds.length);
          newPendingEvents.push(result.event);
          newLogs.push(makeLog(newDay, 'morning', result.logMessage, 'event'));
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
                newLogs.push(makeLog(newDay, 'morning', `Spring subsidies bolster ${r.name}, who seizes ${seized.name}!`, 'rival'));
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
              newLogs.push(makeLog(newDay, 'morning', `Harvest Tax Levy: −${tax} gold taxed by the council.`, 'event'));
            } else {
              const narrativeEvent = buildNarrativeSeasonalEvent(narrativeSeason, newDay);
              newPendingEvents.push(narrativeEvent);
              newLogs.push(makeLog(newDay, 'morning', `Seasonal event: ${narrativeEvent.title}!`, 'event'));
            }
            newSeasonalEventFiredThisSeason = true;
          }
        }

        // ── Random Morning Event (8% chance) ────────────────────────────────
        let wantedPosterFired = false;
        if (Math.random() < 0.08) {
          const snap = {
            dread: newDread,
            kobolds: updatedKobolds,
            rivals: updatedRivals,
            hoardItems: newHoardItems,
            gold: newGold,
            day: newDay,
            dragon: state.dragon,
            playerPropertyIds: state.playerPropertyIds,
            adventurersDefeated: state.adventurersDefeated,
            activeWantedPoster: state.activeWantedPoster,
          };
          const eventDef = pickRandomEvent(snap);
          if (eventDef) {
            if (eventDef.id === 'wantedPoster') {
              wantedPosterFired = true;
              playSound('alert');
            }
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
                newLogs.push(makeLog(newDay, 'morning', outcome.logMessage, 'event'));
              }
            }
          }
        }

        // ── Kobold Experience: increment daysEmployed, assign trait at 15 days ─
        updatedKobolds = updatedKobolds.map(k => {
          const newDaysEmployed = (k.daysEmployed ?? 0) + 1;
          if (!k.trait && newDaysEmployed >= 15) {
            const trait = ROLE_TRAIT_DEFINITIONS[k.role];
            newLogs.push(makeLog(newDay, 'morning', `${k.name} earned the ${trait.label} trait after ${newDaysEmployed} days of service!`, 'kobold'));
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
            newLogs.push(makeLog(newDay, 'morning', `Deed auction opened for ${picked.name}! Opening bid: ${initialBid}g.`, 'economy'));
          }
        }

        // ── Prisoner Ransom Resolution ─────────────────────────────────────
        let updatedRansom: PrisonerRansom | null = state.activeRansom ?? null;
        if (updatedRansom && !updatedRansom.collected && newDay === updatedRansom.dueOnDay) {
          const sabotaged = Math.random() < 0.15;
          if (sabotaged) {
            const sabotagingRival = updatedRivals[Math.floor(Math.random() * updatedRivals.length)];
            const escapeMsg = `A rival helped ${updatedRansom.heroName} escape! The ransom was lost.`;
            newLogs.push(makeLog(newDay, 'morning', escapeMsg, 'rival'));
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
            newLogs.push(makeLog(newDay, 'morning', payoutMsg, 'economy'));
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
          newLogs.push(makeLog(newDay, 'morning', 'The Fence has new wares. Visit the Back Room to browse stolen goods.', 'economy'));
        }

        // ── Rumour Bet Resolution ─────────────────────────────────────────
        const currentBet = state.rumourBet;
        let updatedRumourBet = currentBet;
        if (currentBet && currentBet.betPlaced && !currentBet.resolved) {
          let conditionMet = false;
          switch (currentBet.betType) {
            case 'rival_buys_property':
              conditionMet = (state.eveningResults?.rivalActions ?? []).some(a => a.toLowerCase().includes('seized'));
              break;
            case 'hero_spawn':
              conditionMet = (state.eveningResults?.events ?? []).some(e => e.toLowerCase().includes('hero party'));
              break;
            case 'economy_peak':
              conditionMet = priceIndex[(state.day - 1) % priceIndex.length] > 1.2;
              break;
            case 'seasonal_event':
              conditionMet = getSeasonTransition(newDay) !== null;
              break;
          }
          const won = currentBet.isActuallyTrue && conditionMet;
          if (won) {
            newGold += 45;
            playSound('coinPickup');
            newLogs.push(makeLog(newDay, 'morning', `Rosie's rumour came true! Bet won — +45 gold.`, 'economy'));
          } else {
            newLogs.push(makeLog(newDay, 'morning', `Rosie's rumour bet resolved. No payout.`, 'economy'));
          }
          updatedRumourBet = { ...currentBet, resolved: true, won };
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
          gameLog: [...state.gameLog.slice(-500), ...newLogs],
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
          drinkingGamePlayedToday: false,
          seasonalEventFiredThisSeason: newSeasonalEventFiredThisSeason,
          tournamentActive: newTournamentActive,
          nemesis: updatedNemesisAdv,
          rumourBet: updatedRumourBet,
          festival: newFestival,
        });
        get().generateRumourBet(newDay);
        if (wantedPosterFired) get().generateWantedPoster();
      },

      generateRumourBet: (day) => {
        const state = get();
        const bet = state.rumourBet;
        if (bet && !bet.resolved && bet.expiresOnDay >= day) return;

        const RIVAL_RUMOURS = [
          (rName: string) => `Word from the road is that ${rName} has his eye on some prime real estate. I'd wager he makes a move by week's end — and I rarely wager wrong, love.`,
          (rName: string) => `My pot-boy overheard ${rName}'s envoys at the crossroads. Something about "expanding the portfolio". Mark my words.`,
          (rName: string) => `${rName} has been suspiciously charming with the property clerks lately. That's never innocent, is it.`,
        ];
        const HERO_RUMOURS = [
          () => `My cousin runs the gate at the Western Pass, and she says adventuring parties have been gathering. Something tells me they fancy a dragon hunt before week's end.`,
          () => `A cleric came through here last night, all full of righteous purpose. You know the type. I'd wager someone's pointed them in your direction.`,
          () => `Three separate parties of heroes have paid for rooms in the last two days. Not for pleasure, I'd wager.`,
        ];
        const ECONOMY_RUMOURS = [
          () => `I've been running this inn long enough to know the smell of money in the air. Trade's about to peak — you can practically hear the merchants counting coin already.`,
          () => `The Merchant Guild is unusually busy this week. When the Guild is busy, the prices follow.`,
          () => `A travelling economist stopped here last night and wouldn't stop talking about "market conditions". Insufferable man, but he had a point.`,
        ];
        const SEASONAL_RUMOURS = [
          () => `The hedge witches were in here last night, all whispering about a change coming. When the hedge witches whisper, love, the world tends to listen.`,
          () => `I can feel it in my knees — a seasonal shift is brewing. Thirty years behind this bar teaches you these things.`,
          () => `The birds have been acting strangely. Something's about to turn. I'd wager my best barrel on it.`,
        ];

        const betTypes = ['rival_buys_property', 'hero_spawn', 'economy_peak', 'seasonal_event'] as const;
        const betType = betTypes[Math.floor(Math.random() * betTypes.length)];
        const isActuallyTrue = Math.random() < 0.6;

        let rumourText = '';
        let betTarget: string | undefined;

        if (betType === 'rival_buys_property') {
          const rival = state.rivals[Math.floor(Math.random() * state.rivals.length)];
          betTarget = rival?.name;
          const pool = RIVAL_RUMOURS;
          rumourText = pool[Math.floor(Math.random() * pool.length)](rival?.name ?? 'a rival');
        } else if (betType === 'hero_spawn') {
          rumourText = HERO_RUMOURS[Math.floor(Math.random() * HERO_RUMOURS.length)]();
        } else if (betType === 'economy_peak') {
          rumourText = ECONOMY_RUMOURS[Math.floor(Math.random() * ECONOMY_RUMOURS.length)]();
        } else {
          rumourText = SEASONAL_RUMOURS[Math.floor(Math.random() * SEASONAL_RUMOURS.length)]();
        }

        const newBet: RumourBet = {
          id: `rumour-${day}-${Math.random().toString(36).slice(2, 6)}`,
          rumourText,
          betType,
          betTarget,
          expiresOnDay: day + 5,
          betPlaced: false,
          resolved: false,
          isActuallyTrue,
        };
        set({ rumourBet: newBet });
      },

      placeRumourBet: () => {
        const state = get();
        if (!state.rumourBet || state.rumourBet.betPlaced || state.rumourBet.resolved) return;
        if (state.gold < 15) return;
        playSound('coinLoss');
        const newGold = state.gold - 15;
        const log = makeLog(state.day, state.timeOfDay, `Placed a 15g rumour bet with Rosie.`, 'economy');
        set({
          gold: newGold,
          rumourBet: { ...state.rumourBet, betPlaced: true },
          gameLog: [...state.gameLog.slice(-500), log],
          goldHistory: [...state.goldHistory, { day: state.day, gold: newGold }],
        });
      },

      playDrinkingGame: (tier, outcome, naturalTwelve = false) => {
        const state = get();
        const TIER_DATA = {
          copper: { wager: 10, payout: 25, label: 'Copper Round' },
          silver: { wager: 30, payout: 75, label: 'Silver Round' },
          dragon: { wager: 75, payout: 200, label: "Dragon's Gamble" },
        };
        const td = TIER_DATA[tier];
        const logs: GameLogEntry[] = [];
        let newGold = state.gold;
        let newDread = state.dread;

        if (outcome === 'win') {
          newGold += td.payout;
          playSound('coinPickup');
          if (naturalTwelve && tier === 'dragon') playSound('koboldCheer');
          logs.push(makeLog(state.day, state.timeOfDay, `Won the High Roller game (${td.label})! +${td.payout} gold.`, 'economy'));
        } else {
          newGold = Math.max(0, newGold - td.wager);
          playSound('coinLoss');
          logs.push(makeLog(state.day, state.timeOfDay, `Lost the High Roller game (${td.label}). −${td.wager} gold.`, 'economy'));
        }

        if (naturalTwelve && tier === 'dragon') {
          newDread = Math.min(100, newDread + 3);
          logs.push(makeLog(state.day, state.timeOfDay, `Natural 12 at the High Roller table! Word spreads of the dragon's luck. +3 Dread.`, 'event'));
        }

        set({
          gold: newGold,
          dread: newDread,
          drinkingGamePlayedToday: true,
          gameLog: [...state.gameLog.slice(-500), ...logs],
          goldHistory: [...state.goldHistory, { day: state.day, gold: newGold }],
        });
      },

      sendExpedition: (koboldIds) => {
        const state = get();
        if (koboldIds.length === 0 || state.pendingExpeditionResult) return;

        const scoutCount = koboldIds.filter(id =>
          state.kobolds.find(k => k.id === id)?.role === 'scout'
        ).length;
        const hasInfiltrator = state.kobolds.some(k => k.isLieutenant && k.lieutenantSkill === 'infiltrator' && !koboldIds.includes(k.id));
        const lootChance = 40 + scoutCount * 10 + (hasInfiltrator ? 10 : 0);
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
        const log = makeLog(state.day, state.timeOfDay, `Expedition dispatched — ${koboldNames} sent into the ruins.`, 'kobold');

        set({
          kobolds: state.kobolds.map(k =>
            koboldIds.includes(k.id) ? { ...k, onExpedition: true } : k
          ),
          pendingExpeditionResult: result,
          gameLog: [...state.gameLog.slice(-500), log],
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
          makeLog(state.day, state.timeOfDay, `You bid ${amount}g on ${propName}.`, 'economy'),
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
          newLogs.push(makeLog(state.day, state.timeOfDay, `${rival.name} counter-bids ${counterBid}g! Rounds left: ${newRoundsLeft}.`, 'economy'));

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
              gameLog: [...s.gameLog.slice(-500), ...newLogs],
            }));
            return;
          }

          set(s => ({
            activePropertyAuction: { ...auction, currentBid: counterBid, currentLeader: rival.id, roundsLeft: newRoundsLeft },
            gameLog: [...s.gameLog.slice(-500), ...newLogs],
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
            gameLog: [...s.gameLog.slice(-500), ...newLogs],
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
            const log = makeLog(state.day, state.timeOfDay, `Auction settled — acquired ${propName} for ${auction.currentBid} gold.`, 'property');
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
              gameLog: [...s.gameLog.slice(-500), log],
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

      attemptAuctionBluff: (bluffAmount) => {
        const state = get();
        const auction = state.activePropertyAuction;
        if (!auction || auction.bluffAttempted) return;

        const allProps = districts.flatMap(d => d.properties);
        const prop = allProps.find(p => p.id === auction.propertyId);
        const propName = prop?.name ?? auction.propertyId;

        const competingRivalId = typeof auction.currentLeader === 'number'
          ? auction.currentLeader
          : state.rivals[0]?.id ?? 0;
        const competingRival = state.rivals.find(r => r.id === competingRivalId)
          ?? state.rivals[0];
        const rivalName = competingRival?.name ?? 'The rival';

        const relationshipScore = competingRival?.relationship ?? 50;
        const foldProbability = (relationshipScore / 100) * 0.7;
        const rivalFolds = Math.random() < foldProbability;

        const markedAuction: typeof auction = { ...auction, bluffAttempted: true, bluffAmount };

        if (rivalFolds) {
          const winPrice = auction.currentBid;
          const newGold = state.gold - winPrice;
          const newPlayerIds = [...state.playerPropertyIds, auction.propertyId];
          const winThreshold = state.gameSettings?.winThreshold ?? TOTAL_PROPERTIES;
          const newStatus: GameStatus = newPlayerIds.length >= winThreshold ? 'won' : state.status;
          const log = makeLog(state.day, state.timeOfDay,
            `Bluff succeeded — ${rivalName} withdrew! Acquired ${propName} for ${winPrice} gold.`, 'property');
          playSound('coinPickup');
          set(s => ({
            gold: newGold,
            playerPropertyIds: newPlayerIds,
            status: newStatus,
            activePropertyAuction: null,
            playerPropertyAcquiredDays: { ...(s.playerPropertyAcquiredDays ?? {}), [auction.propertyId]: state.day },
            gameLog: [...s.gameLog.slice(-500), log],
            goldHistory: [...s.goldHistory, { day: state.day, gold: newGold }],
            pendingEvents: [...s.pendingEvents, {
              defId: 'bluff_fold',
              title: 'Bluff Succeeded!',
              icon: '🃏',
              description: `${rivalName} withdraws their bid. A tactical retreat, they'll call it later. ${propName} is yours for just ${winPrice} gold.`,
              effectSummary: `Acquired ${propName} for ${winPrice} gold.`,
              isPassive: true,
            }],
          }));
        } else {
          if (state.gold >= bluffAmount) {
            const newGold = state.gold - bluffAmount;
            const newPlayerIds = [...state.playerPropertyIds, auction.propertyId];
            const winThreshold = state.gameSettings?.winThreshold ?? TOTAL_PROPERTIES;
            const newStatus: GameStatus = newPlayerIds.length >= winThreshold ? 'won' : state.status;
            const log = makeLog(state.day, state.timeOfDay,
              `Bluff called — but you covered it! Acquired ${propName} for ${bluffAmount} gold.`, 'property');
            playSound('coinLoss');
            set(s => ({
              gold: newGold,
              playerPropertyIds: newPlayerIds,
              status: newStatus,
              activePropertyAuction: null,
              playerPropertyAcquiredDays: { ...(s.playerPropertyAcquiredDays ?? {}), [auction.propertyId]: state.day },
              gameLog: [...s.gameLog.slice(-500), log],
              goldHistory: [...s.goldHistory, { day: state.day, gold: newGold }],
              pendingEvents: [...s.pendingEvents, {
                defId: 'bluff_called_covered',
                title: 'Bluff Called — And Matched!',
                icon: '😅',
                description: `${rivalName} called your bluff. Luckily you scraped together the ${bluffAmount} gold. ${propName} is yours, but at full cost.`,
                effectSummary: `Acquired ${propName} for ${bluffAmount} gold.`,
                isPassive: true,
              }],
            }));
          } else {
            const penaltyGold = Math.max(0, state.gold - 10);
            const lockoutDay = state.day + 3;
            const log = makeLog(state.day, state.timeOfDay,
              `Bluff busted! Lost 10g embarrassment fee. Auction lockout until day ${lockoutDay}.`, 'economy');
            playSound('alert');
            set(s => ({
              gold: penaltyGold,
              auctionLockoutUntilDay: lockoutDay,
              activePropertyAuction: { ...markedAuction, bluffBusted: true },
              gameLog: [...s.gameLog.slice(-500), log],
              goldHistory: [...s.goldHistory, { day: state.day, gold: penaltyGold }],
              pendingEvents: [...s.pendingEvents, {
                defId: 'bluff_busted',
                title: 'Bluff Busted!',
                icon: '😬',
                description: `Your bluff was called. ${rivalName} looks delighted. Grixle looks embarrassed on your behalf. You've been barred from auction bidding for 3 days.`,
                effectSummary: `Lost 10 gold. Auction lockout for 3 days.`,
                isPassive: true,
              }],
            }));
            const rival = state.rivals.find(r => r.id === competingRivalId);
            if (rival) {
              set(s => ({
                rivals: s.rivals.map(r =>
                  r.id === competingRivalId ? { ...r, propertyIds: [...r.propertyIds, auction.propertyId] } : r
                ),
                activePropertyAuction: null,
              }));
            } else {
              set({ activePropertyAuction: null });
            }
          }
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
        const log = makeLog(state.day, state.timeOfDay, `Built ${upgradeDef.name} at ${prop.name} for ${upgradeDef.cost} gold.`, 'property');
        playSound('coinLoss');
        set({
          gold: newGold,
          propertyUpgrades: [...(state.propertyUpgrades ?? []), newUpgrade],
          gameLog: [...state.gameLog.slice(-500), log],
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

      sendRivalGift: (rivalId, tier) => {
        const state = get();
        if (state.afternoonActionUsed || state.timeOfDay !== 'afternoon') return;
        const rival = state.rivals.find(r => r.id === rivalId);
        if (!rival) return;
        if (rival.lastGiftDay !== undefined && state.day - rival.lastGiftDay < 5) return;
        const GIFT_CONFIG = {
          trinket:   { cost: 20,  baseGain: 8  },
          curated:   { cost: 50,  baseGain: 18 },
          legendary: { cost: 120, baseGain: 30 },
        } as const;
        const cfg = GIFT_CONFIG[tier];
        if (state.gold < cfg.cost) return;
        let gain: number = cfg.baseGain;
        let dreadPenalty = 0;
        if (state.dread >= 60) {
          gain += 5;
        } else if (state.dread < 30) {
          gain = Math.floor(gain / 2);
          dreadPenalty = -3;
        }
        const newGold = state.gold - cfg.cost;
        const newDread = Math.max(0, state.dread + dreadPenalty);
        const updatedRivals = state.rivals.map(r =>
          r.id === rivalId
            ? { ...r, relationship: Math.min(100, r.relationship + gain), lastGiftDay: state.day }
            : r
        );
        const tierLabel = { trinket: 'Trinket', curated: 'Curated Hoard Item', legendary: 'Legendary Offering' }[tier];
        let logMsg: string;
        if (state.dread >= 60) {
          logMsg = `Sent a ${tierLabel} to ${rival.name}. Received with respect (+5 dread bonus). Relationship +${gain}. −${cfg.cost} gold.`;
        } else if (state.dread < 30) {
          logMsg = `Sent a ${tierLabel} to ${rival.name}. They mocked the gesture. Relationship +${gain} (halved). −3 Dread. −${cfg.cost} gold.`;
        } else {
          logMsg = `Sent a ${tierLabel} to ${rival.name}. Accepted neutrally. Relationship +${gain}. −${cfg.cost} gold.`;
        }
        const log = makeLog(state.day, state.timeOfDay, logMsg, 'rival');
        playSound('coinLoss');
        setTimeout(() => playSound('uiClick'), 500);
        set({
          gold: newGold,
          dread: newDread,
          rivals: updatedRivals,
          afternoonActionUsed: true,
          gameLog: [...state.gameLog.slice(-500), log],
          goldHistory: [...state.goldHistory, { day: state.day, gold: newGold }],
        });
        get().resolveEvening();
      },

      logEvent: (message, category = 'system') => {
        const state = get();
        const log = makeLog(state.day, state.timeOfDay, message, category);
        set({ gameLog: [...state.gameLog.slice(-500), log] });
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
              choiceLogs.push(makeLog(state.day, state.timeOfDay, 'Accepted the Guild Tournament! Combat rewards ×2 for 5 days. Incursion rate doubled.', 'event'));
            } else {
              choiceLogs.push(makeLog(state.day, state.timeOfDay, 'Laid low during the Guild Tournament. No extra risk or reward.', 'event'));
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
              choiceLogs.push(makeLog(state.day, state.timeOfDay, 'Opened hoard for the Grand Trade Fair. Auction prices +30% for 4 days.', 'event'));
            } else {
              choiceLogs.push(makeLog(state.day, state.timeOfDay, 'Ignored the Grand Trade Fair.', 'event'));
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
              choiceLogs.push(makeLog(state.day, state.timeOfDay, 'Mountain passes frozen. No property purchases for 6 days.', 'event'));
            } else {
              newGold = Math.max(0, state.gold - 80);
              choiceLogs.push(makeLog(state.day, state.timeOfDay, 'Bribed the road wardens for 80 gold. Mountain passes remain open.', 'event'));
            }
          }

          set({
            pendingEvents: state.pendingEvents.slice(1),
            statusEffects: newStatusEffects,
            gold: newGold,
            tournamentActive: newTournamentActive,
            gameLog: [...state.gameLog.slice(-500), ...choiceLogs],
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
          playerPropertyIds: state.playerPropertyIds,
          adventurersDefeated: state.adventurersDefeated,
          activeWantedPoster: state.activeWantedPoster,
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

        const log = makeLog(state.day, state.timeOfDay, outcome.logMessage, 'event');
        set({
          gold: newGold,
          dread: newDread,
          kobolds: applied.kobolds,
          statusEffects: newStatusEffects,
          hoardItems: newHoardItems,
          rivals: newRivals,
          pendingEvents: state.pendingEvents.slice(1),
          gameLog: [...state.gameLog.slice(-500), log],
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
          councilSessionsAttended: (state.councilSessionsAttended ?? 0) + 1,
          gameLog: [...state.gameLog.slice(-500), log],
        });
      },

      proposeCouncilMotion: (motionId) => {
        const state = get();
        const motion = getPlayerCouncilMotion(motionId);
        if (!motion) return;

        const rivalVotes = simulateRivalVotesForPlayerMotion(state.rivals);
        const tallyAye = rivalVotes.filter(v => v.votedAye).length;
        const tallyNay = rivalVotes.length - tallyAye;
        const passed = tallyAye >= 2;

        let newStatusEffects = [...state.statusEffects];
        let updatedRivals = [...state.rivals];
        let newGold = state.gold;
        let newGoldHistory = [...state.goldHistory];

        if (passed) {
          if (motionId === 'kobold-labour-reform') {
            newStatusEffects.push(makeStatusEffect({
              name: 'Kobold Labour Reform',
              icon: '🪖',
              description: 'Council decree has frozen kobold wage costs for 5 days.',
              affectedStat: 'wageCostModifier',
              modifier: -0.5,
              expiresOnDay: state.day + 5,
            }));
          } else if (motionId === 'hoard-authenticity-act') {
            newStatusEffects.push(makeStatusEffect({
              name: 'Hoard Authenticity Act',
              icon: '📋',
              description: 'Certified authentic dragon hoards command a premium at auction.',
              affectedStat: 'sellMultiplier',
              modifier: 0.15,
              expiresOnDay: state.day + 8,
            }));
          } else if (motionId === 'territorial-boundary-charter') {
            newStatusEffects.push(makeStatusEffect({
              name: 'Territorial Boundary Charter',
              icon: '🗺️',
              description: 'Rival dragons are barred from acquiring new properties while the realm is being surveyed.',
              affectedStat: 'propertyFreeze',
              modifier: 1,
              expiresOnDay: state.day + 5,
            }));
          } else if (motionId === 'dragon-solidarity-tax') {
            let taxTotal = 0;
            state.rivals.forEach(r => {
              taxTotal += r.relationship > 50 ? 30 : 10;
            });
            newGold = state.gold + taxTotal;
            newGoldHistory = [...state.goldHistory, { day: state.day, gold: newGold }];
          } else if (motionId === 'adventurer-amnesty') {
            newStatusEffects.push(makeStatusEffect({
              name: 'Adventurer Amnesty',
              icon: '🕊️',
              description: 'A seasonal truce with the Adventurers\' Guild. Hero incursions halted for 5 days.',
              affectedStat: 'heroSpawnBonus',
              modifier: -1.0,
              expiresOnDay: state.day + 5,
            }));
          } else if (motionId === 'rival-audit') {
            if (state.rivals.length > 0) {
              const auditIdx = Math.floor(Math.random() * state.rivals.length);
              updatedRivals = state.rivals.map((r, i) => {
                if (i === auditIdx) {
                  return { ...r, relationship: Math.max(0, r.relationship - 10) };
                }
                return { ...r, relationship: Math.max(0, r.relationship - 5) };
              });
            }
          }
        }

        const moodOptions = ['suspicion', 'respect', 'confusion'];
        const mood = moodOptions[Math.floor(Math.random() * moodOptions.length)];
        const flavourLog = `You table the ${motion.name}. The council eyes you with ${mood}.`;
        const log = makeLog(state.day, state.timeOfDay, flavourLog);

        const nayVoters = rivalVotes.filter(v => !v.votedAye);
        const failFlavourRival = nayVoters.length > 0
          ? nayVoters[Math.floor(Math.random() * nayVoters.length)].name
          : (state.rivals[0]?.name ?? 'Scorch');
        const failFlavourText = `The council voted down your proposal. ${failFlavourRival} appeared to enjoy this.`;

        const result: import('../types').CouncilVoteResult = {
          motionId,
          motionName: motion.name,
          playerVoteAye: false,
          rivalVotes,
          tallyAye,
          tallyNay,
          passed,
          playerFavored: passed,
          isPlayerProposal: true,
          proposedEffectSummary: motion.effectSummary,
          failFlavourText,
        };

        set({
          councilVoteResult: result,
          statusEffects: newStatusEffects,
          rivals: updatedRivals,
          gold: newGold,
          goldHistory: newGoldHistory,
          councilSessionsAttended: (state.councilSessionsAttended ?? 0) + 1,
          gameLog: [...state.gameLog.slice(-500), log],
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
        const log = makeLog(state.day, state.timeOfDay, `Forged a territorial accord with ${rival.name}. Relationship +30.`, 'rival');
        set({
          rivals: state.rivals.map(r =>
            r.id === rivalId ? { ...r, relationship: Math.min(100, r.relationship + 30) } : r
          ),
          gameLog: [...state.gameLog.slice(-500), log],
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
        const log = makeLog(state.day, state.timeOfDay, `Constructed ${room.name} in the lair for ${room.cost} gold.`, 'property');
        set({
          gold: newGold,
          lairRooms: [...(state.lairRooms ?? []), roomId],
          kobolds: newKobolds,
          gameLog: [...state.gameLog.slice(-500), log],
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
            'rival',
          );
          set({ rivals: updatedRivals, kobolds: updatedKobolds, gameLog: [...state.gameLog.slice(-500), log] });

        } else {
          const ageTier = state.dragon?.ageTier ?? 1;
          const roll = theftRoll ?? (Math.floor(Math.random() * 20) + 1);
          const amount = roll + ageTier * 5;
          const success = roll >= 11;
          const newGold = Math.max(0, state.gold + (success ? amount : -amount));

          const resultText = success
            ? `Heist against ${rival.name} succeeded! Stole ${amount} gold. (Roll: ${roll})`
            : `Heist against ${rival.name} failed — guards were waiting. Lost ${amount} gold. (Roll: ${roll})`;

          const log = makeLog(state.day, state.timeOfDay, resultText, 'rival');
          set({
            gold: newGold,
            gameLog: [...state.gameLog.slice(-500), log],
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
          gameLog: [...state.gameLog.slice(-500), ...newLogs],
          ...(goldReward !== 0 ? { goldHistory: [...state.goldHistory, { day: state.day, gold: newGold }] } : {}),
        });
      },

      captureForRansom: (heroName, baseAmount) => {
        const state = get();
        const rawOffset = 3 - Math.floor(state.dread / 30);
        const daysOffset = Math.max(1, rawOffset);
        const dueOnDay = state.day + daysOffset;
        const expectedPayout = baseAmount + Math.floor(state.dread / 10) * 5;
        const log = makeLog(state.day, state.timeOfDay, `Captured ${heroName} for ransom. Payment expected in ${daysOffset} day(s).`, 'combat');
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
          gameLog: [...s.gameLog.slice(-500), log],
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
          makeLog(state.day, state.timeOfDay, `Purchased "${item.label}" from The Fence for ${item.cost} gold.`, 'economy'),
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
          newLogs.push(makeLog(state.day, state.timeOfDay, `${item.koboldData.name} joins your colony as a ${item.koboldData.tier} ${item.koboldData.role}.`, 'kobold'));
        } else if (item.type === 'intel' && item.rivalId !== undefined) {
          const rival = state.rivals.find(r => r.id === item.rivalId);
          if (rival) {
            const estimatedGold = rival.propertyIds.length * 60 + Math.round(Math.random() * 40);
            newLogs.push(makeLog(state.day, state.timeOfDay, `The Fence's intel on ${rival.name}: they hold approximately ${estimatedGold} gold.`, 'rival'));
          }
        }

        set({
          gold: newGold,
          blackMarketStock: updatedStock,
          kobolds: newKobolds,
          hoardItems: newHoardItems,
          gameLog: [...state.gameLog.slice(-500), ...newLogs],
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
          gameLog: [...s.gameLog.slice(-500), log],
          ...(newGold !== state.gold ? { goldHistory: [...s.goldHistory, { day: state.day, gold: newGold }] } : {}),
        }));
      },

      setHoardArrangement: (type) => {
        const state = get();
        const lastChange = state.lastArrangementChangeDay ?? 0;
        const canChange = state.hoardArrangement === undefined || (state.day - lastChange) >= 3;
        if (!canChange) return;
        const ARRANGEMENT_NAMES: Record<'pile' | 'wall' | 'cabinet', string> = {
          pile: 'Treasure Pile',
          wall: 'Trophy Wall',
          cabinet: 'Curiosity Cabinet',
        };
        const log = makeLog(state.day, state.timeOfDay, `You spend the afternoon rearranging your hoard into a ${ARRANGEMENT_NAMES[type]}. Deeply satisfying.`);
        playSound('uiClick');
        set(s => ({
          hoardArrangement: type,
          lastArrangementChangeDay: state.day,
          gameLog: [...s.gameLog.slice(-500), log],
        }));
      },

      fileDispute: (rivalId, propertyId) => {
        const state = get();
        if (state.activeDispute && !state.activeDispute.resolved) return;
        const rival = state.rivals.find(r => r.id === rivalId);
        if (!rival) return;
        const allProps = districts.flatMap(d => d.properties);
        const prop = allProps.find(p => p.id === propertyId);
        if (!prop) return;
        const dispute: ActiveDispute = {
          id: `dispute-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          rivalId,
          rivalName: rival.name,
          propertyId,
          propertyName: prop.name,
          filedOnDay: state.day,
          expiresOnDay: state.day + 5,
          round: 0,
          playerScore: 0,
          resolved: false,
        };
        const log = makeLog(state.day, 'evening', `${rival.name} has filed a Property Dispute over ${prop.name}! Visit the Arcane Law Office to argue your case.`, 'rival');
        playSound('alert');
        set(s => ({
          activeDispute: dispute,
          gameLog: [...s.gameLog.slice(-500), log],
          pendingEvents: [...s.pendingEvents, {
            defId: 'dispute_filed',
            title: '⚖️ Property Dispute Filed!',
            icon: '⚖️',
            description: `${rival.name} has engaged legal counsel and filed a formal Property Dispute over ${prop.name}. You have 5 days to visit Saeloril Vethran and argue your case before the matter is decided in absentia.`,
            effectSummary: 'Visit the Arcane Law Office to defend your claim.',
            isPassive: true,
          }],
        }));
      },

      makeDisputeArgument: (type) => {
        const state = get();
        const dispute = state.activeDispute;
        if (!dispute || dispute.resolved || dispute.round >= 3) return;

        const nextRound = dispute.round + 1;
        let roundWon = false;
        let goldCost = 0;

        if (type === 'strong') {
          roundWon = true;
          goldCost = 10;
          if (state.gold < goldCost) return;
          playSound('coinLoss');
        } else if (type === 'bluff') {
          roundWon = Math.random() < 0.5;
          playSound('uiClick');
        } else {
          roundWon = false;
          playSound('uiClick');
        }

        const newScore = dispute.playerScore + (roundWon ? 1 : 0);
        const newGold = state.gold - goldCost;
        const updatedDispute: ActiveDispute = {
          ...dispute,
          round: nextRound,
          playerScore: newScore,
          resolved: nextRound >= 3,
        };

        set(s => ({
          activeDispute: updatedDispute,
          gold: newGold,
          goldHistory: goldCost > 0 ? [...s.goldHistory, { day: state.day, gold: newGold }] : s.goldHistory,
        }));

        if (nextRound >= 3) {
          get().resolveDispute();
        }
      },

      resolveDispute: () => {
        const state = get();
        const dispute = state.activeDispute;
        if (!dispute) return;

        const score = dispute.playerScore;
        const logs: GameLogEntry[] = [];
        let newGold = state.gold;
        let newDread = state.dread;
        let newPlayerPropertyIds = [...state.playerPropertyIds];
        let newRivals = [...state.rivals];
        let verdictTitle = '';
        let verdictDesc = '';
        let verdictSummary = '';

        if (score === 3) {
          newDread = Math.min(100, newDread + 5);
          newRivals = newRivals.map(r =>
            r.id === dispute.rivalId ? { ...r, relationship: Math.max(0, r.relationship - 15) } : r
          );
          verdictTitle = '⚖️ Verdict: Outright Victory!';
          verdictDesc = `The court finds entirely in your favour. ${dispute.rivalName}'s counsel offered no credible rebuttal. ${dispute.propertyName} remains uncontested in your portfolio.`;
          verdictSummary = `Kept ${dispute.propertyName}. +5 Dread. ${dispute.rivalName} relationship −15.`;
          logs.push(makeLog(state.day, state.timeOfDay, `Dispute resolved — won outright. Kept ${dispute.propertyName}. +5 Dread. ${dispute.rivalName} −15 relationship.`, 'rival'));
          playSound('uiOpen');
        } else if (score === 2) {
          const fine = 30;
          newGold = Math.max(0, newGold - fine);
          verdictTitle = '⚖️ Verdict: Partial Win';
          verdictDesc = `The court acknowledges your rightful claim on ${dispute.propertyName}, though the proceedings were not without cost. Saeloril collects her fees with professional efficiency.`;
          verdictSummary = `Kept ${dispute.propertyName}. Paid 30g legal fees.`;
          logs.push(makeLog(state.day, state.timeOfDay, `Dispute resolved — partial win. Kept ${dispute.propertyName}, paid 30g in fees.`, 'rival'));
          playSound('coinLoss');
        } else if (score === 1) {
          const fine = 60;
          newGold = Math.max(0, newGold - fine);
          newRivals = newRivals.map(r =>
            r.id === dispute.rivalId ? { ...r, relationship: Math.min(100, r.relationship + 5) } : r
          );
          verdictTitle = '⚖️ Verdict: Narrow Loss';
          verdictDesc = `The court allows you to retain ${dispute.propertyName} by the slimmest of margins, but the fees are substantial and ${dispute.rivalName} departs with an unsettling air of satisfaction.`;
          verdictSummary = `Kept ${dispute.propertyName}. Paid 60g legal fees. ${dispute.rivalName} relationship +5.`;
          logs.push(makeLog(state.day, state.timeOfDay, `Dispute resolved — narrow loss. Kept ${dispute.propertyName}, paid 60g in fees.`, 'rival'));
          playSound('coinLoss');
        } else {
          newPlayerPropertyIds = newPlayerPropertyIds.filter(id => id !== dispute.propertyId);
          newRivals = newRivals.map(r =>
            r.id === dispute.rivalId
              ? { ...r, relationship: Math.min(100, r.relationship + 10), propertyIds: [...r.propertyIds, dispute.propertyId] }
              : r
          );
          verdictTitle = '⚖️ Verdict: Full Loss';
          verdictDesc = `The court transfers title of ${dispute.propertyName} to ${dispute.rivalName}. The gavel falls. Saeloril offers her condolences in the same tone she uses to describe the weather.`;
          verdictSummary = `${dispute.propertyName} transferred to ${dispute.rivalName}. ${dispute.rivalName} relationship +10.`;
          logs.push(makeLog(state.day, state.timeOfDay, `Dispute resolved — full loss. ${dispute.propertyName} transferred to ${dispute.rivalName}.`, 'rival'));
          playSound('alert');
        }

        const resolvedDispute: ActiveDispute = { ...dispute, resolved: true };

        set(s => ({
          activeDispute: resolvedDispute,
          gold: newGold,
          dread: newDread,
          playerPropertyIds: newPlayerPropertyIds,
          rivals: newRivals,
          gameLog: [...s.gameLog.slice(-500), ...logs],
          goldHistory: newGold !== state.gold ? [...s.goldHistory, { day: state.day, gold: newGold }] : s.goldHistory,
          pendingEvents: [...s.pendingEvents, {
            defId: 'dispute_resolved',
            title: verdictTitle,
            icon: '⚖️',
            description: verdictDesc,
            effectSummary: verdictSummary,
            isPassive: true,
          }],
        }));
      },

      judgeAct: (koboldId, choice) => {
        const state = get();
        if (choice === 'bribe' && state.gold < 10) return;
        const performerDelta = choice === 'praise' ? 15 : choice === 'critique' ? -5 : 25;
        const audienceDelta = choice === 'praise' ? 5 : choice === 'critique' ? 3 : -3;
        const updatedKobolds = state.kobolds.map(k => {
          const delta = k.id === koboldId ? performerDelta : audienceDelta;
          return { ...k, morale: Math.max(0, Math.min(100, k.morale + delta)) };
        });
        const newGold = choice === 'bribe' ? state.gold - 10 : state.gold;
        set({
          kobolds: updatedKobolds,
          gold: newGold,
          ...(choice === 'bribe' ? { goldHistory: [...state.goldHistory, { day: state.day, gold: newGold }] } : {}),
        });
      },

      promoteKobold: (koboldId: string) => {
        const state = get();
        const kobold = state.kobolds.find(k => k.id === koboldId);
        if (!kobold || kobold.isLieutenant || !kobold.trait || kobold.daysEmployed < 30) return;
        const cost = PROMOTION_COST[kobold.tier];
        if (state.gold < cost) return;
        const skill = LIEUTENANT_SKILLS[kobold.role];
        const newGold = state.gold - cost;
        const log = makeLog(state.day, state.timeOfDay, `${kobold.name} promoted to Lieutenant. They stand a little straighter. You think.`, 'kobold');
        playSound('koboldCheer');
        set({
          gold: newGold,
          kobolds: state.kobolds.map(k =>
            k.id === koboldId
              ? { ...k, isLieutenant: true, lieutenantSkill: skill, loyalty: 95, lieutenantAssignment: null }
              : k
          ),
          gameLog: [...state.gameLog.slice(-500), log],
          goldHistory: [...state.goldHistory, { day: state.day, gold: newGold }],
        });
      },

      setLieutenantAssignment: (koboldId: string, assignment: 'defence' | 'recruitment' | 'trade' | null) => {
        set({
          kobolds: get().kobolds.map(k =>
            k.id === koboldId && k.isLieutenant
              ? { ...k, lieutenantAssignment: assignment }
              : k
          ),
        });
      },

      finishTalentShow: (score) => {
        const state = get();
        let goldDelta = 0;
        let dreadDelta = 0;
        let resultText = '';
        if (score >= 30) {
          goldDelta = 20;
          resultText = 'Crowd Pleaser! The audience donates 20 gold.';
          playSound('koboldCheer');
        } else if (score >= 15) {
          dreadDelta = 5;
          resultText = 'Decent Show. Word spreads of your patronage. +5 Dread.';
          playSound('koboldCheer');
        } else {
          dreadDelta = -3;
          resultText = 'Critical Flop. Rosie hears about it. −3 Dread.';
          playSound('alert');
        }
        const newGold = state.gold + goldDelta;
        const newDread = Math.max(0, Math.min(100, state.dread + dreadDelta));
        const log = makeLog(state.day, state.timeOfDay, `Kobold Talent Show concluded. ${resultText}`, 'event');
        set({
          lastTalentShowDay: state.day,
          gold: newGold,
          dread: newDread,
          gameLog: [...state.gameLog.slice(-500), log],
          ...(goldDelta !== 0 ? { goldHistory: [...state.goldHistory, { day: state.day, gold: newGold }] } : {}),
        });
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
          gameLog: [...state.gameLog.slice(-500), log],
          goldHistory: [...state.goldHistory, { day: state.day, gold: newGold }],
        });
      },

      takeLoan: (tier) => {
        const state = get();
        if (state.activeLoan) return;
        const def = LOAN_TIERS[tier];
        const dueByDay = state.day + def.windowDays;
        const loan: ActiveLoan = {
          id: `loan-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          tier,
          borrowedAmount: def.borrowedAmount,
          repayAmount: def.repayAmount,
          takenOnDay: state.day,
          dueByDay,
          defaulted: false,
        };
        const newGold = state.gold + def.borrowedAmount;
        const log = makeLog(state.day, state.timeOfDay, `Barrax lends you ${def.borrowedAmount}g. Repay ${def.repayAmount}g by Day ${dueByDay}.`, 'economy');
        playSound('coinPickup');
        set({
          gold: newGold,
          activeLoan: loan,
          gameLog: [...state.gameLog.slice(-500), log],
          goldHistory: [...state.goldHistory, { day: state.day, gold: newGold }],
        });
      },

      repayLoan: () => {
        const state = get();
        const loan = state.activeLoan;
        if (!loan || loan.defaulted) return;
        if (state.gold < loan.repayAmount) return;
        const newGold = state.gold - loan.repayAmount;
        const log = makeLog(state.day, state.timeOfDay, `Loan repaid in full — ${loan.repayAmount}g returned to Barrax. Debt cleared.`, 'economy');
        playSound('coinPickup');
        set({
          gold: newGold,
          activeLoan: undefined,
          gameLog: [...state.gameLog.slice(-500), log],
          goldHistory: [...state.goldHistory, { day: state.day, gold: newGold }],
        });
      },

      recordPartyDefeat: (partyName, leaderName, leaderClass) => {
        const state = get();
        const newCount = (state.heroPartyDefeatCounts?.[partyName] ?? 0) + 1;
        const newCounts = { ...(state.heroPartyDefeatCounts ?? {}), [partyName]: newCount };
        if (newCount === 3 && !state.nemesis) {
          const nextSpawnDay = state.day + 10 + Math.floor(Math.random() * 6);
          const newNemesis: NemesisData = {
            partyName, leaderName, leaderClass,
            defeatCount: 3,
            nemesisVisitCount: 0,
            isCurrentlyActive: false,
            nextSpawnDay,
          };
          const log = makeLog(state.day, state.timeOfDay, `${leaderName} swears vengeance. A named nemesis has emerged.`, 'combat');
          set(s => ({
            heroPartyDefeatCounts: newCounts,
            nemesis: newNemesis,
            gameLog: [...s.gameLog.slice(-500), log],
            pendingEvents: [...s.pendingEvents, {
              defId: 'nemesis_created',
              title: '⚔ A Grudge is Born',
              icon: '⚔',
              description: `${leaderName} has been defeated three times. They did not take it gracefully. Reports suggest they are now training "with intent". You will see them again — personally.`,
              effectSummary: `${leaderName} will return as a Named Nemesis in ${10 + Math.floor(Math.random() * 6)} days.`,
              isPassive: true,
            }],
          }));
        } else {
          set({ heroPartyDefeatCounts: newCounts });
        }
      },

      enterAerialDisplay: () => {
        const state = get();
        if (!state.festival?.active || state.festival.aerialDisplayUsed || state.morningActionUsed) return;

        const breed = dragonBreeds.find(b => b.id === state.dragon?.breedId);
        const ageTier = state.dragon?.ageTier ?? 1;
        const combatBonus = getModifier(state.statusEffects, 'combatBonus');
        const playerRoll = Math.floor(Math.random() * 20) + 1 + Math.round((breed?.baseStats.attack ?? 70) / 10) + ageTier + combatBonus;
        const spectralRoll = Math.floor(Math.random() * 20) + 12;
        const won = playerRoll >= spectralRoll;

        const newDread = won ? Math.min(100, state.dread + 10) : Math.max(0, state.dread - 5);
        const newGold = won ? state.gold + 50 : state.gold;

        const resultMsg = won
          ? `You outperformed the Spectral Challenger in the Aerial Display! The realm applauds. +10 Dread, +50 gold.`
          : `The Spectral Challenger outmanoeuvred you before the assembled realm. A humbling performance. −5 Dread.`;

        const log = makeLog(state.day, state.timeOfDay, resultMsg, 'event');
        playSound(won ? 'koboldCheer' : 'alert');

        set(s => ({
          dread: newDread,
          gold: newGold,
          festival: s.festival ? { ...s.festival, aerialDisplayUsed: true } : s.festival,
          morningActionUsed: true,
          timeOfDay: 'afternoon',
          pendingEvents: [...s.pendingEvents, {
            defId: 'aerial_display_result',
            title: won ? '🐉 Aerial Display: Victory!' : '🎪 Aerial Display: Humbled',
            icon: '🐉',
            description: resultMsg,
            effectSummary: won ? '+10 Dread, +50 gold.' : '−5 Dread.',
            isPassive: true,
          }],
          gameLog: [...s.gameLog.slice(-500), log],
          ...(won ? { goldHistory: [...s.goldHistory, { day: state.day, gold: newGold }] } : {}),
        }));
      },

      purchaseFestivalItem: (itemId) => {
        const state = get();
        if (!state.festival?.active) return;
        if (state.festival.festivalStockPurchased.includes(itemId)) return;

        const FESTIVAL_ITEMS = [
          { id: 'festival-goblet', label: 'Ancient Ceremonial Goblet', baseValue: 200, cost: 120 },
          { id: 'festival-scale', label: 'Spectral Dragon Scale', baseValue: 250, cost: 150 },
        ];
        const item = FESTIVAL_ITEMS.find(i => i.id === itemId);
        if (!item || state.gold < item.cost) return;

        const newGold = state.gold - item.cost;
        const hoardItem: HoardItem = {
          id: `festival-item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          name: item.label,
          baseValue: item.baseValue,
          lootedOnDay: state.day,
        };
        const log = makeLog(state.day, state.timeOfDay, `Purchased "${item.label}" from the Festival Market for ${item.cost} gold.`, 'event');
        playSound('coinLoss');

        set(s => ({
          gold: newGold,
          hoardItems: [...s.hoardItems, hoardItem],
          festival: s.festival
            ? { ...s.festival, festivalStockPurchased: [...s.festival.festivalStockPurchased, itemId] }
            : s.festival,
          gameLog: [...s.gameLog.slice(-500), log],
          goldHistory: [...s.goldHistory, { day: state.day, gold: newGold }],
        }));
      },

      resolveNemesisOutcome: (won, leaderName) => {
        const state = get();
        if (!state.nemesis) return;
        const visitCount = state.nemesis.nemesisVisitCount;
        const newVisitCount = won ? visitCount + 1 : visitCount;
        const nextSpawnDay = state.day + 10 + Math.floor(Math.random() * 6);
        if (!won) {
          const log = makeLog(state.day, state.timeOfDay, `${leaderName} withdraws unhurried. They leave a taunt behind.`, 'combat');
          set(s => ({
            nemesis: s.nemesis ? {
              ...s.nemesis,
              nemesisVisitCount: newVisitCount,
              isCurrentlyActive: false,
              nextSpawnDay,
            } : undefined,
            gameLog: [...s.gameLog.slice(-500), log],
            pendingEvents: [...s.pendingEvents, {
              defId: 'nemesis_taunt',
              title: '⚔ The Nemesis Withdraws',
              icon: '⚔',
              description: `${leaderName} stands over you. "Next time," they say, cleaning their blade. "I will not be in a hurry." They leave. Slowly.`,
              effectSummary: 'No healing fee charged. The nemesis retreats dramatically.',
              isPassive: true,
            }],
          }));
        } else {
          const log = makeLog(state.day, state.timeOfDay, `${leaderName} defeated as nemesis (visit ${visitCount + 1}).`, 'combat');
          set(s => ({
            nemesis: s.nemesis ? {
              ...s.nemesis,
              nemesisVisitCount: newVisitCount,
              isCurrentlyActive: false,
              nextSpawnDay,
            } : undefined,
            gameLog: [...s.gameLog.slice(-500), log],
          }));
        }
      },

      generateWantedPoster: () => {
        const state = get();
        if (!state.dragon) return;

        const dread = state.dread;
        let threatLevel: string;
        if (dread >= 90) threatLevel = 'DO NOT APPROACH UNDER ANY CIRCUMSTANCES';
        else if (dread >= 75) threatLevel = 'EXTREMELY DANGEROUS';
        else threatLevel = 'DANGEROUS';

        const allCrimes: string[] = [
          'General Menace to the Realm',
          'Unlicensed Hoard Accumulation',
          'Failure to Register as a Dread Entity',
        ];
        if (state.hoardItems.length > 5) {
          const item = state.hoardItems[Math.floor(Math.random() * state.hoardItems.length)];
          allCrimes.push(`Theft of ${item.name} (witnesses still traumatised)`);
        }
        if (state.kobolds.length > 3) {
          allCrimes.push('Running an Unlicensed Labour Colony');
        }
        if (state.adventurersDefeated > 0) {
          const n = state.adventurersDefeated;
          allCrimes.push(`Assault Upon ${n} Adventuring ${n === 1 ? 'Party' : 'Parties'} (Survivors Pending)`);
        }
        if (state.playerPropertyIds.length > 5) {
          allCrimes.push('Monopolistic Land Acquisition Practices');
        }
        if (dread >= 75) {
          allCrimes.push('Making the Region Genuinely Unpleasant for Everyone');
        }

        const shuffled = [...allCrimes].sort(() => Math.random() - 0.5);
        const crimes = shuffled.slice(0, 3);
        const districtName = districts[Math.floor(Math.random() * districts.length)].name;

        set({
          activeWantedPoster: {
            dragonName: state.dragon.name,
            bounty: dread * 3,
            crimes,
            threatLevel,
            issuedOnDay: state.day,
            expiresOnDay: state.day + 7,
            districtName,
          },
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
