import type { DialogueTree } from '../types';

export const dragonbornBankerTree: DialogueTree = {
  greeting: {
    npcLine:
      'Honored client. Barrax stands before you — Senior Vault Keeper, Third Scale, Ironclad District.' +
      ' You are {playerName}, {dragonBreed}. Your account record is known to this institution.' +
      ' I do not waste words. Neither should you.' +
      ' State your business.',
    playerOptions: [
      { label: 'What is my account balance?', nextNode: 'accountBalance' },
      { label: 'I want to take out a loan.',  nextNode: 'loanDenied' },
      { label: 'Give me a market update.',    nextNode: 'economyReport' },
      { label: 'That will be all.',           nextNode: 'farewell' },
    ],
  },

  accountBalance: {
    npcLine:
      'Current holdings: {gold} gold pieces, verified and vaulted.' +
      ' This institution does not round. This institution does not estimate.' +
      ' {gold} gold. Exactly. As of day {currentDay}.' +
      ' {gold>300: Your position is... adequate. For a dragon your age. Do not grow complacent.}' +
      ' {gold<=100: I will not editorialize. But I will note that {gold} gold is a number that invites strategic reflection.}' +
      ' Dread rating on file: {dreadRating}. For collateral assessment purposes only.',
    playerOptions: [
      { label: 'What is the market doing?', nextNode: 'economyReport' },
      { label: 'That is all I needed.',     nextNode: 'farewell' },
    ],
  },

  loanDenied: {
    npcLine:
      'This institution does not offer loans to dragons.' +
      ' It is not a question of creditworthiness. Your dread rating of {dreadRating} is noted.' +
      ' It is a question of collateral. A dragon\'s hoard is also its home.' +
      ' We attempted a repossession once. In the Year of the Second Scorching.' +
      ' We no longer attempt repossessions.' +
      ' Explore other avenues.',
    playerOptions: [
      { label: 'What other avenues?',       nextNode: 'economyReport' },
      { label: 'Understood. Good day.',     nextNode: 'farewell' },
    ],
  },

  economyReport: {
    npcLine:
      'Current market multiplier: {economyMultiplier}x baseline.' +
      ' {economyMultiplier>1.2: Conditions are favorable. Property values are ascending. This institution recommends acquisition if liquidity permits.}' +
      ' {economyMultiplier<0.9: Market is contracting. Sellers are desperate. This is, strategically, an opportunity.}' +
      ' {economyMultiplier>=0.9,economyMultiplier<=1.2: Market is stable. Neither aggressive expansion nor withdrawal is indicated at this time.}' +
      ' Day {currentDay} data. The battlefield changes daily.' +
      ' Position accordingly, {playerName}. Victory favors the prepared.',
    playerOptions: [
      { label: 'Check my balance.',     nextNode: 'accountBalance' },
      { label: 'I am done here.',       nextNode: 'farewell' },
    ],
  },

  farewell: {
    npcLine:
      'This institution thanks you for your visit, {playerName}.' +
      ' Your account remains active. Your reputation precedes you.' +
      ' Return when circumstances warrant.' +
      ' Walk with strength.',
    playerOptions: [],
  },
};
