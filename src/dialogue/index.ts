export type {
  DialogueContext,
  DialogueTree,
  DialogueNode,
  PlayerOption,
  ResolvedDialogue,
  ResolvedOption,
  NpcRole,
} from './types';

export {
  speechStyles,
  getSpeciesKey,
} from './speechStyles';
export type { SpeechStyle, SpeciesKey, EmotionKey } from './speechStyles';

export {
  resolveTemplate,
  applySpeciesInflection,
  getDialogueLine,
  getSpeciesCatchphrase,
  getEmotionalTell,
} from './dialogueEngine';

export { getClaudeDialogue } from './claudeDialogue';

export { realEstateAgentTree }        from './trees/realEstateAgent';
export { koboldTempAgencyTree }       from './trees/koboldTempAgency';
export { dragonbornBankerTree }       from './trees/dragonbornBanker';
export { elvenLawyerTree }            from './trees/elvenLawyer';
export { dragonMotelInnkeeperTree }   from './trees/dragonMotelInnkeeper';
export { rivalDragonNegotiationTree } from './trees/rivalDragonNegotiation';
