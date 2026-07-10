import type { DialogueTree } from '../types';

export const elvenLawyerTree: DialogueTree = {
  greeting: {
    npcLine:
      'Ah. {playerName}. In my centuries of experience, few clients arrive without considerable' +
      ' documentation deficiencies. I am Saeloril Vethran, Arcane Law, Third Compact.' +
      ' You are a {dragonBreed}, which places you under the Hoard Domicile Statutes of {currentDay>100: late era}{currentDay<=100: early era} classification.' +
      ' Your dread rating of {dreadRating} is also a liability — we will return to that.' +
      ' Please. Sit. If the furniture survives, we may proceed.',
    playerOptions: [
      { label: 'Review my property contracts.',     nextNode: 'propertyContracts' },
      { label: 'I have a dispute with a rival.',    nextNode: 'rivalDispute' },
      { label: 'What is my legal exposure?',        nextNode: 'legalWarning' },
      { label: 'That will be all for now.',          nextNode: 'farewell' },
    ],
  },

  propertyContracts: {
    npcLine:
      '{propertyName} — I have reviewed it. The title is technically clean,' +
      ' although I use the word "technically" in a manner that should concern you.' +
      ' There is a clause — subparagraph 7(b), Second Compact, Fire Hazard Annex —' +
      ' which stipulates that any structure with more than three active scorch marks' +
      ' is subject to mandatory reassessment. In my centuries of experience,' +
      ' dragons tend to accumulate scorch marks.' +
      ' You purchased at {price} gold. The reassessment could alter that figure.' +
      ' I mention this as counsel, not alarm. Alarm would cost extra.',
    playerOptions: [
      { label: 'What do I do about the clause?',     nextNode: 'legalWarning' },
      { label: 'What about my rival?',               nextNode: 'rivalDispute' },
      { label: 'Thank you. I think.',                nextNode: 'farewell' },
    ],
  },

  rivalDispute: {
    npcLine:
      '{rivalName}. Yes. The matter is known to this office.' +
      ' In my considerable experience, rival dragon disputes resolve in one of three ways:' +
      ' negotiated partition, contested dominance, or — and I have seen this more than once —' +
      ' the wholesale incineration of the disputed property, which satisfies no one legally.' +
      ' Your dread rating of {dreadRating} is a factor. It functions as leverage, yes.' +
      ' However, a rating above 80 also constitutes a liability under the Civic Harmony Statutes.' +
      ' The law, {playerName}, is indifferent to your fire breath.' +
      ' That is what makes it useful — and why you need me.',
    playerOptions: [
      { label: 'How do I resolve it legally?',       nextNode: 'legalWarning' },
      { label: 'What about my contracts?',           nextNode: 'propertyContracts' },
      { label: 'I will handle it myself.',           nextNode: 'farewell' },
    ],
  },

  legalWarning: {
    npcLine:
      'I will be direct, {playerName}, as your counsel and as someone who has observed' +
      ' {dragonAge} years of accumulated decisions both wise and catastrophically otherwise.' +
      ' Your dread rating of {dreadRating} is a dual-edged instrument.' +
      ' {dreadRating>75: Above 75, you are legally classified as a "Civic Destabilization Vector." This is not a compliment. This is a billing category.}' +
      ' {dreadRating>=50,dreadRating<=75: You are approaching threshold. I recommend measured restraint.}' +
      ' {dreadRating<50: Your liability is relatively contained. Do not squander this.}' +
      ' I have prepared three protective clauses. They will cost you.' +
      ' Most things worth having do.',
    playerOptions: [
      { label: 'File the protective clauses.',      nextNode: 'farewell', effect: 'legal_protection' },
      { label: 'What else should I know?',          nextNode: 'propertyContracts' },
      { label: 'I will take my chances.',           nextNode: 'farewell' },
    ],
  },

  farewell: {
    npcLine:
      'Until next time, {playerName}. In my centuries of experience,' +
      ' the clients who dismiss counsel earliest tend to return most urgently.' +
      ' I will be here. Time, as I have noted, moves differently for those of us who notice it.' +
      ' The retainer, incidentally, is non-refundable.' +
      ' Good day.',
    playerOptions: [],
  },
};
