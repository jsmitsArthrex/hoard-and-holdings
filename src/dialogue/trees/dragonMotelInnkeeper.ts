import type { DialogueTree } from '../types';

export const dragonMotelInnkeeperTree: DialogueTree = {
  greeting: {
    npcLine:
      'Oh! Oh goodness, you ARE big, aren\'t you. Welcome, welcome to the Ember & Straw!' +
      ' I\'m Rosie Tumblefoot, proprietress! We — we do our best, {playerName}, we really do.' +
      ' Now, I won\'t lie to you, we were not DESIGNED with a {dragonBreed} in mind.' +
      ' The door is — well, the door is more of a suggestion at this point, isn\'t it.' +
      ' But you are HERE, and we are DELIGHTED, and I have just put the kettle on!' +
      ' Shall I show you the room? I use "room" loosely. Lovingly, but loosely.',
    playerOptions: [
      { label: 'Tell me about the room.',      nextNode: 'roomDescription' },
      { label: 'How much is a night?',         nextNode: 'roomDescription' },
      { label: 'I need to check out.',         nextNode: 'checkOut' },
      { label: 'I am just browsing.',          nextNode: 'farewell' },
    ],
  },

  roomDescription: {
    npcLine:
      'RIGHT! So. The Ember Suite — we call it that now, we renamed it for you, that\'s personal service —' +
      ' is what used to be the ground floor, the second floor, AND the courtyard.' +
      ' The roof is... optional. We removed it. That\'s a feature, not a deficiency.' +
      ' Heating is included, which is to say — the fireplace IS you, dear, we\'ve thought this through.' +
      ' The bed is twelve mattresses stacked. Stuffed with premium straw. And one feather — we only had one.' +
      ' Cost is {gold>50: 8}{gold<=50: 6} gold per night. Breakfast is a goat. Just the one, I\'m afraid.' +
      ' We\'ve had no complaints! Mostly because our previous guests were... smaller.',
    playerOptions: [
      { label: 'I will take it. One night.',    nextNode: 'farewell', effect: 'rent_room' },
      { label: 'What about two nights?',        nextNode: 'roomDescription' },
      { label: 'This is not quite what I imagined.', nextNode: 'checkOut' },
    ],
  },

  checkOut: {
    npcLine:
      'Checking out already! Oh, {playerName}, we\'ll miss you terribly.' +
      ' You were our best guest this season — technically our only guest this season, but BEST nonetheless.' +
      ' The scorch mark on the east wall is staying. We\'re calling it a mural.' +
      ' It really opens up the space.' +
      ' Please do come back! We\'re installing a larger door.' +
      ' Well. We\'re removing the remaining wall. Same result, really.' +
      ' Travel safe, dear! Don\'t eat any Knights errant on the road, the paperwork is awful!',
    playerOptions: [
      { label: 'Farewell, Rosie.', nextNode: 'farewell', effect: 'check_out' },
    ],
  },

  farewell: {
    npcLine:
      'Goodbye, goodbye! Come again any time! Day or night!' +
      ' We\'re always open — mostly because we no longer have a front door.' +
      ' {playerName} is welcome at the Ember & Straw always!' +
      ' There is still half a scone if you want it!' +
      ' It might be a rock at this point but the THOUGHT is there!',
    playerOptions: [],
  },
};
