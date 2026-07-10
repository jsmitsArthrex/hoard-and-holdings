import type { DialogueTree } from '../types';

export const koboldTempAgencyTree: DialogueTree = {
  greeting: {
    npcLine:
      'Heh. {playerName}. Pack has heard of you. {dreadRating>50: Fearsome reputation. Pack respects this. Hyeh.}' +
      ' {dreadRating<=50: Still building that reputation? Pack has seen worse. Heh.}' +
      ' Grukk runs best kobold agency in district. Not just saying this. It is fact.' +
      ' You need workers, you come to Grukk. You come to Grukk, you get workers. Simple. Hyeh heh.',
    playerOptions: [
      { label: 'What kobolds do you have available?', nextNode: 'availableKobolds' },
      { label: 'I want to hire one kobold.',          nextNode: 'hireSingle' },
      { label: 'I need a full crew.',                 nextNode: 'hireBulk' },
      { label: 'Not today.',                          nextNode: 'farewell' },
    ],
  },

  availableKobolds: {
    npcLine:
      'Pack sends four tiers. Listen. Hyeh.' +
      ' BASIC: 2 gold per day. Shows up. Does task. Does not question. Good for digging.' +
      ' STANDARD: 4 gold per day. Skilled hands, moderate morale. Packs own lunch. Heh.' +
      ' SKILLED: 7 gold per day. Specialist. Trap-layer, gem-sorter, alarm-keeper. Good quality.' +
      ' ELITE: 11 gold per day. Pack\'s finest. Do not waste on menial work or they sulk. Hyeh heh.' +
      ' {koboldName} is available today. Day {currentDay}. Fresh batch.',
    playerOptions: [
      { label: 'Hire one kobold.',      nextNode: 'hireSingle' },
      { label: 'Hire the whole batch.', nextNode: 'hireBulk' },
      { label: 'Too expensive.',        nextNode: 'cannotAfford' },
      { label: 'I have enough kobolds.', nextNode: 'farewell' },
    ],
  },

  hireSingle: {
    npcLine:
      'One kobold. Smart. Controlled costs. Heh.' +
      ' {koboldName} is available. Reliable. Will not steal more than is traditional.' +
      ' Warning: kobold morale is real thing. You treat {koboldName} badly, pack hears about it.' +
      ' Pack does not forget. Hyeh.' +
      ' Payment up front. Daily rate. No refunds for heroic sacrifice.',
    playerOptions: [
      { label: 'Hire {koboldName}. Pay daily rate.',        nextNode: 'farewell', effect: 'hire_kobold_single' },
      { label: 'What if I mistreat them?',                  nextNode: 'hireSingle' },
      { label: 'I cannot afford this right now.',           nextNode: 'cannotAfford' },
    ],
  },

  hireBulk: {
    npcLine:
      'Bulk hire! Heh heh, now {playerName} is thinking big. Pack approves.' +
      ' Discount: 10% off four or more kobolds. Pack likes volume business.' +
      ' Morale warning doubled: large groups develop... opinions. About working conditions.' +
      ' {dreadRating>60: Your dread rating helps. Kobolds will work harder when afraid. Hyeh. Efficient.}' +
      ' {dreadRating<=60: Kobolds may require motivational bonuses. Pack suggests snacks. Heh.}' +
      ' You have {gold} gold. Pack can work with that.',
    playerOptions: [
      { label: 'Hire the full crew at bulk rate.',   nextNode: 'farewell', effect: 'hire_kobold_bulk' },
      { label: 'Just one for now.',                  nextNode: 'hireSingle' },
      { label: 'I cannot afford this.',              nextNode: 'cannotAfford' },
    ],
  },

  cannotAfford: {
    npcLine:
      '{gold} gold. Heh. Heh heh. Pack has seen this.' +
      ' {playerName} is temporarily... resource-constrained. This is polite way of saying it.' +
      ' Pack does not offer credit. Pack learned this lesson. Once. Very expensive lesson. Hyeh.' +
      ' Come back on day {currentDay} plus some days. With more gold. Pack will still be here.',
    playerOptions: [
      { label: 'I will return when I have gold.', nextNode: 'farewell' },
      { label: 'What about a single basic kobold?', nextNode: 'hireSingle' },
    ],
  },

  farewell: {
    npcLine:
      'Business concluded. Heh.' +
      ' Pack remembers all clients. Their payments. Their morale records. Their... habits.' +
      ' {playerName} is noted. Day {currentDay} noted. Come back. Hyeh heh.' +
      ' Pack watches.',
    playerOptions: [],
  },
};
