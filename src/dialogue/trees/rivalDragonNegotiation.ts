import type { DialogueTree } from '../types';

export const rivalDragonNegotiationTree: DialogueTree = {
  greeting: {
    npcLine:
      '{dreadRating>75: *a long pause before speaking* ...{playerName}. Your reputation reaches this meeting before you do. I had prepared for an inferior opponent. I may have miscalculated.}' +
      '{dreadRating<=75,dreadRating>40: {rivalName} does not waste breath on those below notice. And yet here I stand. Make this worth the contempt I am suppressing.}' +
      '{dreadRating<=40: Ah, {playerName}. The {dragonBreed} who dares call themselves a rival. Ambitious. Charmingly so. What brings you to my territory?}' +
      ' I am {rivalName}. I know what you want. I know what you have.' +
      ' What I do not yet know is whether this conversation is worth having.',
    playerOptions: [
      { label: 'I want to buy {propertyName} from you.',   nextNode: 'sellProperty' },
      { label: 'I want my kobold back.',                    nextNode: 'buyKoboldBack' },
      { label: 'Let us check where we stand.',             nextNode: 'reputationCheck' },
      { label: 'I came to propose an alliance.',           nextNode: 'alliance' },
      { label: 'I am here to deliver an insult.',          nextNode: 'insult' },
      { label: 'This was a mistake. Leaving.',             nextNode: 'farewell' },
    ],
  },

  sellProperty: {
    npcLine:
      '{propertyName}. Of course you want it.' +
      ' {relationshipScore>60: Given our... history, I would consider parting with it. For the right number.}' +
      ' {relationshipScore<=60,relationshipScore>20: My asking price is {price} gold. Do not negotiate. I do not negotiate. I assess and I decide.}' +
      ' {relationshipScore<=20: {propertyName} is not for sale to you. Not today. Not while your dread rating is {dreadRating} and mine is higher.}' +
      ' You have {gold} gold. I have done the calculation.' +
      ' The question is whether you have the nerve to meet my terms.',
    playerOptions: [
      { label: 'Agreed. {price} gold.',                    nextNode: 'farewell', effect: 'buy_rival_property' },
      { label: 'Counter-offer: half of {price}.',          nextNode: 'insult' },
      { label: 'I will take it by force if needed.',       nextNode: 'reputationCheck' },
      { label: 'Not today. Step back.',                    nextNode: 'farewell' },
    ],
  },

  buyKoboldBack: {
    npcLine:
      '{koboldName}. Hm. Yes, that one defected.' +
      ' {relationshipScore>50: I will return them. You paid for them. Our agreement stands, even if our relationship is... complex.}' +
      ' {relationshipScore<=50: {koboldName} is mine now. They came willingly.' +
      ' You want them back? Offer me something worth more than their current productivity.}' +
      ' Kobolds are not items. They are assets. I treat them accordingly.' +
      ' Which is why they keep coming to MY lair, {playerName}.',
    playerOptions: [
      { label: 'Name your price.',                        nextNode: 'sellProperty' },
      { label: 'This is beneath both of us.',             nextNode: 'alliance' },
      { label: 'Fine. Keep the kobold.',                  nextNode: 'farewell' },
    ],
  },

  reputationCheck: {
    npcLine:
      '{dreadRating>80: Your dread rating precedes you like a herald of catastrophe. I concede that this meeting carries weight I had not initially assigned it.}' +
      '{dreadRating>50,dreadRating<=80: You are formidable. I do not deny it. But formidable is not dominant. Not yet.}' +
      '{dreadRating<=50: {dreadRating}. That number tells a story, {playerName}. It is a story still being written. I am ahead of you in that narrative. For now.}' +
      ' Relationship between us: {relationshipScore} points. I track these.' +
      ' {relationshipScore>70: I find myself... open to a different kind of conversation with you.}' +
      ' {relationshipScore<=30: You have burned bridges I have not yet forgotten building.}' +
      ' What do you intend to do with this information?',
    playerOptions: [
      { label: 'Propose an alliance.',           nextNode: 'alliance' },
      { label: 'Test my dread against yours.',   nextNode: 'insult', effect: 'reputation_contest' },
      { label: 'Nothing. I only wanted to know.', nextNode: 'farewell' },
    ],
  },

  insult: {
    npcLine:
      '{dreadRating>70: The insult lands. {rivalName}\'s scales ripple with visible fury. "You dare." The temperature in the room rises. "We are not done, {playerName}. Not nearly."}' +
      '{dreadRating<=70: {rivalName} laughs — a low, resonant sound with no warmth in it at all. "Charming. {playerName} plays at dominance. Come back when your dread rating exceeds your ambitions."}' +
      ' {gold<100: Also — and this is observation, not mockery — you have {gold} gold. That is a number that should embarrass a dragon of your age.}' +
      ' This meeting is deteriorating. Rapidly.',
    playerOptions: [
      { label: 'Press the advantage.',           nextNode: 'reputationCheck', effect: 'dread_contest' },
      { label: 'I apologize. Let us reset.',     nextNode: 'alliance' },
      { label: 'Leave before this gets worse.',  nextNode: 'farewell' },
    ],
  },

  alliance: {
    npcLine:
      '{relationshipScore>50: An alliance. I have considered this. Your territory and mine share a border — cooperation is not weakness, it is geometry.}' +
      '{relationshipScore<=50: You ask for alliance after... everything. Bold. I respect boldness.}' +
      ' Here is what I propose: {playerName}\'s hoard stays north. My hoard stays south.' +
      ' Shared kobold neutrality — neither of us poaches the other\'s workers.' +
      ' {dreadRating>60: Your dread rating is leverage. I acknowledge this. The alliance uses it without being threatened by it.}' +
      ' This benefits both of us on day {currentDay} and beyond.' +
      ' Do we have an accord, {playerName}?',
    playerOptions: [
      { label: 'We have an accord.',             nextNode: 'farewell', effect: 'form_alliance' },
      { label: 'Your terms are unacceptable.',   nextNode: 'insult' },
      { label: 'I need time to consider.',       nextNode: 'farewell' },
    ],
  },

  farewell: {
    npcLine:
      '{relationshipScore>60: Until next time, {playerName}. The sky is large enough for both of us. For now.}' +
      '{relationshipScore<=60,relationshipScore>20: We are done. For today. {rivalName} does not forget conversations.}' +
      '{relationshipScore<=20: Leave. The next time you enter this territory uninvited, we skip the conversation entirely.}' +
      ' Day {currentDay}. Noted.',
    playerOptions: [],
  },
};
