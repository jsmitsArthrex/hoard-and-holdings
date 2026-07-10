import type { DialogueTree } from '../types';

export const realEstateAgentTree: DialogueTree = {
  greeting: {
    npcLine:
      '{playerName}! Yes yes, Grix was expecting you. Come in, come in.' +
      ' You looking for lair? {playerName} has {gold} gold — good! Good amount.' +
      ' Grix has properties, many properties. Best in whole district.' +
      ' [dreadRating>75: *gulps* We are... honored... by your fearsome reputation, very honored, no sudden moves from Grix, nono.]' +
      ' [dreadRating<25: Heh, {playerName} is still small dragon. Good! Small dragons spend gold more carefully. Grix likes careful spenders.]',
    playerOptions: [
      { label: 'Show me what you have.',       nextNode: 'browseListings' },
      { label: 'I want to negotiate a price.', nextNode: 'negotiatePrice' },
      { label: 'I am leaving.',                nextNode: 'farewell' },
    ],
  },

  browseListings: {
    npcLine:
      'Yesyes! Grix has many fine properties. {propertyName} — very nice, very sturdy ceiling.' +
      ' Price: {price} gold. Dragons love high ceilings! This one has them.' +
      ' Natural cave ventilation, very good for fire breath. No extra charge.' +
      ' Also has nice neighbors — they moved away recently. Very convenient timing.',
    playerOptions: [
      { label: 'I want to buy it.',       nextNode: 'negotiatePrice' },
      { label: 'Too expensive.',          nextNode: 'tooExpensive' },
      { label: 'Show me something else.', nextNode: 'browseListings' },
      { label: 'Forget it.',              nextNode: 'farewell' },
    ],
  },

  negotiatePrice: {
    npcLine:
      'Negotiate?! Grix has overhead costs! Staff! Licensing! Very many fees!' +
      ' [gold<price: But... {playerName} only has {gold} gold. Grix sees this. Perhaps... small discount? Maybe. Small. Very small.]' +
      ' [dreadRating>75: *nervous laugh* Of course! Reasonable price for such an, ah, impressively dangerous client!]' +
      ' Fine. Grix can do {price} gold. Final offer. Almost final.',
    playerOptions: [
      { label: 'Agreed. I will pay {price} gold.',  nextNode: 'purchaseSuccess', effect: 'purchase_property' },
      { label: 'Still too much. Walk away.',         nextNode: 'tooExpensive' },
      { label: 'Counter-offer: half price.',         nextNode: 'tooExpensive' },
    ],
  },

  tooExpensive: {
    npcLine:
      '[gold<50: *whispers* Grix has seen this before. Dragon with big dreams and empty hoard. Sssss... maybe come back when {playerName} has more? Grix will be here. Waiting.]' +
      ' [gold>=50: You have {gold} gold and say price is too high? Grix does not understand math that badly. Property is worth {price}. This is FACT.]' +
      ' But Grix is generous. Grix will leave listing open. In case {playerName} finds... more gold.',
    playerOptions: [
      { label: 'Fine. What else do you have?', nextNode: 'browseListings' },
      { label: 'I am done here.',              nextNode: 'farewell' },
    ],
  },

  purchaseSuccess: {
    npcLine:
      'Excellent! EXCELLENT! {propertyName} is now property of great {dragonBreed} {playerName}!' +
      ' Grix will prepare papers. Many papers. Dragon must sign with claw — not fire breath, please.' +
      ' This is day {currentDay}. Grix will note date for records.' +
      ' Pleasure doing business! Come again when you have more gold! Which Grix hopes is soon!',
    playerOptions: [
      { label: 'Thank you. Farewell.', nextNode: 'farewell' },
      { label: 'Show me another property.', nextNode: 'browseListings' },
    ],
  },

  farewell: {
    npcLine:
      'Come back with gold! Grix is always here! Always! Even when you wish Grix was not!' +
      ' {playerName} is valued customer. Best customer. [dreadRating>50: Also very scary customer, Grix notes this diplomatically.]' +
      ' Yesyes. Safe travels!',
    playerOptions: [],
  },
};
