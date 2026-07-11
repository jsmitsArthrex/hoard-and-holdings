import type { KoboldTier } from '../data/koboldWages';

export type GameStatus = 'title' | 'intro' | 'playing' | 'won' | 'lost';
export type TimeOfDay = 'morning' | 'afternoon' | 'evening';
export type KoboldRole = 'miner' | 'guard' | 'treasurer' | 'scout' | 'cook';
export type KoboldSpecies = 'red' | 'blue' | 'green' | 'purple' | 'white';
export type SeasonName = 'spring' | 'summer' | 'autumn' | 'winter';
export type Difficulty = 'easy' | 'normal' | 'hard';
export type ContractCondition = 'buyProperty' | 'sellItems' | 'defeatAdventurers' | 'payFee';

export interface Contract {
  id: string;
  npcId: 'grixle' | 'bank' | 'innkeeper';
  title: string;
  description: string;
  reward: { gold?: number; dread?: number; koboldMorale?: number };
  deadline: number;
  condition: ContractCondition;
  targetCount: number;
  progress: number;
  completed: boolean;
  failed: boolean;
}

export interface GameSettings {
  difficulty: Difficulty;
  winThreshold: number;
  startingGold: number;
  motelCostPerNight: number;
}

export interface DragonProfile {
  name: string;
  breedId: string;
  age: number;
  ageTier: 1 | 2 | 3 | 4 | 5;
}

export interface KoboldTrait {
  id: string;
  label: string;
  description: string;
  effect: 'extraGold' | 'poachImmune' | 'moraleRegen' | 'combatBonus';
  value: number;
}

export interface KoboldEmployee {
  id: string;
  name: string;
  species: KoboldSpecies;
  role: KoboldRole;
  tier: KoboldTier;
  dailyWage: number;
  morale: number;
  loyalty: number;
  daysEmployed: number;
  trait?: KoboldTrait;
  sabotagedUntilDay?: number;
  onExpedition?: boolean;
  isLieutenant?: boolean;
  lieutenantSkill?: string;
  lieutenantAssignment?: 'defence' | 'recruitment' | 'trade' | null;
}

export interface HoardItem {
  id: string;
  name: string;
  baseValue: number;
  lootedOnDay: number;
  legendary?: true;
}

export interface Rival {
  id: number;
  name: string;
  breedId: string;
  propertyIds: string[];
  relationship: number;
  poachedKobold?: KoboldEmployee;
  sabotagedUntilDay?: number;
  lastGiftDay?: number;
}

export type LogCategory = 'combat' | 'economy' | 'kobold' | 'rival' | 'event' | 'property' | 'system';

export interface GameLogEntry {
  id: string;
  day: number;
  timeOfDay: TimeOfDay;
  message: string;
  category: LogCategory;
}

export interface GoldHistoryEntry {
  day: number;
  gold: number;
}

export interface EveningResult {
  koboldIncome: number;
  koboldWages: number;
  netIncome: number;
  rivalActions: string[];
  events: string[];
}

export interface ActiveIncursion {
  id: string;
  partyName: string;
  tier: 1 | 2 | 3 | 4;
  daySpawned: number;
  isNemesis?: boolean;
}

export interface NemesisData {
  partyName: string;
  leaderName: string;
  leaderClass: string;
  defeatCount: number;
  nemesisVisitCount: number;
  isCurrentlyActive: boolean;
  nextSpawnDay: number;
}

export interface CouncilVoteResult {
  motionId: string;
  motionName: string;
  playerVoteAye: boolean;
  rivalVotes: Array<{ name: string; votedAye: boolean; flavour?: string }>;
  tallyAye: number;
  tallyNay: number;
  passed: boolean;
  playerFavored: boolean;
  isPlayerProposal?: boolean;
  proposedEffectSummary?: string;
  failFlavourText?: string;
}

export interface StatusEffect {
  id: string;
  name: string;
  icon: string;
  description: string;
  affectedStat: string;
  modifier: number;
  expiresOnDay: number;
}

export interface PendingEvent {
  defId: string;
  title: string;
  icon: string;
  description: string;
  effectSummary: string;
  isPassive: boolean;
  councilMotionId?: string;
  choices?: Array<{ label: string; description: string }>;
  letterSalutation?: string;
  letterBody?: string;
  letterClosing?: string;
}

export interface PendingKoboldLetter {
  koboldName: string;
  koboldRole: string;
  daysEmployed: number;
  deliverOnDay: number;
  letterBody: string;
  salutation: string;
  closing: string;
}

export interface PrisonerRansom {
  heroName: string;
  baseAmount: number;
  dueOnDay: number;
  collected: boolean;
}

export interface BlackMarketItem {
  id: string;
  type: 'hoard' | 'kobold' | 'intel';
  label: string;
  description: string;
  cost: number;
  purchased: boolean;
  koboldData?: Omit<KoboldEmployee, 'id'>;
  rivalId?: number;
}

export type PropertyUpgradeId = 'deep-mine' | 'watchtower' | 'fortified-walls' | 'grand-hall';

export interface PropertyUpgrade {
  propertyId: string;
  upgradeId: PropertyUpgradeId;
  builtOnDay: number;
}

export interface ExpeditionResult {
  koboldIds: string[];
  outcome: 'loot' | 'intel' | 'injury' | 'captured';
  detail: string;
}

export interface ActiveDispute {
  id: string;
  rivalId: number;
  rivalName: string;
  propertyId: string;
  propertyName: string;
  filedOnDay: number;
  expiresOnDay: number;
  round: number;
  playerScore: number;
  resolved: boolean;
}

export interface PropertyAuction {
  propertyId: string;
  currentBid: number;
  currentLeader: 'player' | number;
  roundsLeft: number;
  bluffAttempted?: boolean;
  bluffAmount?: number;
  bluffBusted?: boolean;
}

export type LoanTier = 'small' | 'medium' | 'large';

export interface ActiveLoan {
  id: string;
  tier: LoanTier;
  borrowedAmount: number;
  repayAmount: number;
  takenOnDay: number;
  dueByDay: number;
  defaulted: boolean;
}

export interface RumourBet {
  id: string;
  rumourText: string;
  betType: 'rival_buys_property' | 'hero_spawn' | 'economy_peak' | 'seasonal_event';
  betTarget?: string;
  expiresOnDay: number;
  betPlaced: boolean;
  resolved: boolean;
  won?: boolean;
  isActuallyTrue: boolean;
}

export interface GameState {
  status: GameStatus;
  dragon: DragonProfile | null;
  gold: number;
  day: number;
  timeOfDay: TimeOfDay;
  dread: number;
  morningActionUsed: boolean;
  afternoonActionUsed: boolean;
  playerPropertyIds: string[];
  kobolds: KoboldEmployee[];
  hoardItems: HoardItem[];
  rivals: Rival[];
  gameLog: GameLogEntry[];
  goldHistory: GoldHistoryEntry[];
  adventurersDefeated: number;
  activeScreen: string;
  highlightedPropertyId: string | null;
  eveningResults: EveningResult | null;
  activeIncursions: ActiveIncursion[];
  statusEffects: StatusEffect[];
  pendingEvents: PendingEvent[];
  gameSettings: GameSettings;
  ageTierAchieved: number[];
  dragonCurrentHP: number | null;
  earnedTitles: string[];
  itemsSold: number;
  combatLosses: number;
  lairRooms: string[];
  councilVoteResult: CouncilVoteResult | null;
  activeContracts: Contract[];
  activePropertyAuction: PropertyAuction | null;
  activeRansom: PrisonerRansom | null;
  blackMarketStock: BlackMarketItem[] | null;
  blackMarketRefreshDay: number;
  propertyUpgrades: PropertyUpgrade[];
  playerPropertyAcquiredDays: Record<string, number>;
  pendingExpeditionResult: ExpeditionResult | null;
  dragonAbilityUsedToday: boolean;
  seasonalEventFiredThisSeason: boolean;
  tournamentActive: boolean;
  hoardArrangement?: 'pile' | 'wall' | 'cabinet';
  lastArrangementChangeDay?: number;
  activeLoan?: ActiveLoan;
  activeDispute: ActiveDispute | null;
  heroPartyDefeatCounts: Record<string, number>;
  nemesis?: NemesisData;
  auctionLockoutUntilDay: number;
  lastTalentShowDay?: number;
  rumourBet?: RumourBet;
  drinkingGamePlayedToday: boolean;
  councilSessionsAttended: number;
  activeWantedPoster?: {
    dragonName: string;
    bounty: number;
    crimes: string[];
    threatLevel: string;
    issuedOnDay: number;
    expiresOnDay: number;
    districtName: string;
  };
  festival?: {
    active: boolean;
    startsOnDay: number;
    endsOnDay: number;
    aerialDisplayUsed: boolean;
    rivalChallengePropertyId?: string;
    rivalChallengeRivalId?: number;
    rivalChallengeWinner?: 'player' | 'rival' | null;
    festivalStockPurchased: string[];
  };
  pendingKoboldLetters: PendingKoboldLetter[];
}
