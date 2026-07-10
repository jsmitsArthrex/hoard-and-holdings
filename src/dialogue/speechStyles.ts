export type EmotionKey = 'happy' | 'nervous' | 'greedy' | 'suspicious';

export interface SpeechStyle {
  name: string;
  catchphrases: string[];
  emotionalTells: Record<EmotionKey, string>;
  wordSubstitutions: Array<{ from: RegExp; to: string }>;
  sentenceTransform?: (text: string) => string;
}

export type SpeciesKey =
  | 'goblin'
  | 'gnoll'
  | 'human'
  | 'elf'
  | 'dragonborn'
  | 'halfling'
  | 'dwarf'
  | 'qunari'
  | 'spirit'
  | 'mabari';

export const speechStyles: Record<SpeciesKey, SpeechStyle> = {
  goblin: {
    name: 'Goblin',
    catchphrases: [
      'Yesyes, come in, come in!',
      'Ah! Gold-bearer arrives. Good, good.',
      'You want deal? Grix has best deals.',
      'Heheh. Lucky day for you. Very lucky.',
    ],
    emotionalTells: {
      happy:     'rubs hands together with a wet smack',
      nervous:   'sssss... prices, they change, nothing wrong, nono...',
      greedy:    'eyes the coin purse — and takes half a step closer',
      suspicious: 'narrows eyes to slits and hisses slowly',
    },
    wordSubstitutions: [
      { from: /\bthe\b/gi,  to: '' },
      { from: /\ba\b/gi,    to: '' },
      { from: /\ban\b/gi,   to: '' },
      { from: /\bvery\b/gi, to: 'very very' },
      { from: /\byou are\b/gi, to: "you is" },
      { from: /\bis not\b/gi,  to: "is no" },
    ],
    sentenceTransform: (text) =>
      text.replace(/\. ([A-Z])/g, '. $1').replace(/\s{2,}/g, ' ').trim(),
  },

  gnoll: {
    name: 'Gnoll',
    catchphrases: [
      'Heh. You came. Smart prey knows where to shop. Hyeh.',
      'My pack sends only the best workers. Hyeh heh.',
      'Strength respects strength. Good. Sit. Hyeh.',
      "Don't waste time. Neither do I. Heh.",
    ],
    emotionalTells: {
      happy:     'shows all teeth — a lot of teeth — hyeh heh heh',
      nervous:   'tail goes stiff, claws scratch the table',
      greedy:    'inhales deeply, scenting the gold on you — hyeh',
      suspicious: 'pack instinct says something is wrong here. Heh.',
    },
    wordSubstitutions: [
      { from: /\bplease\b/gi,    to: 'heh' },
      { from: /\bthank you\b/gi, to: 'heh. sure.' },
      { from: /\bI think\b/gi,   to: 'Pack says' },
      { from: /\bwe\b/gi,        to: 'pack' },
    ],
    sentenceTransform: (text) =>
      text.replace(/([.!?])(?!\s*(heh|hyeh))/gi, '$1 Heh.'),
  },

  human: {
    name: 'Human',
    catchphrases: [
      'Good day. How can I help you?',
      'Welcome. Please, take a moment.',
      'Ah, punctual. I appreciate that.',
      'Come in. Let us get down to business.',
    ],
    emotionalTells: {
      happy:     'smiles warmly and leans forward',
      nervous:   'clears throat and straightens papers unnecessarily',
      greedy:    'an almost imperceptible gleam crosses the eyes',
      suspicious: 'pauses, studying you for a beat too long',
    },
    wordSubstitutions: [],
    sentenceTransform: undefined,
  },

  elf: {
    name: 'Elf',
    catchphrases: [
      'Ah. You arrive. Time, as ever, moves for those who notice it.',
      'In my centuries of experience, few surprises remain. You are... one.',
      'The appointment was at the third bell. It is now the fourth. We may proceed.',
      'Patience is a virtue mortals so rarely cultivate. Nevertheless — welcome.',
    ],
    emotionalTells: {
      happy:     'the faintest inclination of the head — for an elf, high praise',
      nervous:   'fingers trace the edge of a document, slowly, precisely',
      greedy:    'an elegant pause. In my experience, value is rarely obvious to those who lack perspective.',
      suspicious: 'centuries teach one to recognize... incongruence.',
    },
    wordSubstitutions: [
      { from: /\bcan't\b/gi,  to: 'cannot' },
      { from: /\bwon't\b/gi,  to: 'will not' },
      { from: /\bdon't\b/gi,  to: 'do not' },
      { from: /\bisn't\b/gi,  to: 'is not' },
      { from: /\bI'm\b/gi,    to: 'I am' },
      { from: /\bthey're\b/gi, to: 'they are' },
    ],
    sentenceTransform: undefined,
  },

  dragonborn: {
    name: 'Dragonborn',
    catchphrases: [
      'Honored client. Your presence brings weight to this meeting.',
      'I do not waste words. Neither should you.',
      'Victory favors the prepared. Let us discuss your position.',
      'You stand before one who has faced greater threats than market fluctuations.',
    ],
    emotionalTells: {
      happy:     'stands fractionally taller — a dragonborn at ease is still imposing',
      nervous:   'the jaw tightens. The posture does not change. It never changes.',
      greedy:    'the scales along the neck catch the light. An opportunity is being assessed.',
      suspicious: 'the eyes narrow to vertical slits. Every word is being weighed.',
    },
    wordSubstitutions: [
      { from: /\bI\b/g,       to: 'I' },
      { from: /\bproblem\b/gi, to: 'challenge' },
      { from: /\bfail\b/gi,   to: 'fall short in battle' },
      { from: /\bworry\b/gi,  to: 'show concern' },
    ],
    sentenceTransform: undefined,
  },

  halfling: {
    name: 'Halfling',
    catchphrases: [
      "Oh! Oh, you're here! Come in, come in, I just put the kettle on!",
      "Welcome, welcome! Have you eaten? I have scones. Well, I had scones.",
      "Oh my goodness, a real dragon! Don't worry, I'm not scared. Well, a little. But I'm friendly-scared!",
      "There you are! I was beginning to think you might be a rumor.",
    ],
    emotionalTells: {
      happy:     'clasps both hands together and bounces slightly on heels',
      nervous:   'mentions the biscuits — three times in one sentence',
      greedy:    'begins calculating the tip before the deal is even done',
      suspicious: 'tilts head, smiles very carefully, offers more tea',
    },
    wordSubstitutions: [
      { from: /\byes\b/gi,  to: 'oh yes, absolutely yes' },
      { from: /\bno\b/gi,   to: 'oh no, no no' },
      { from: /\bgood\b/gi, to: 'wonderful' },
    ],
    sentenceTransform: (text) =>
      text.replace(/([.!?])\s+([A-Z])/g, '$1 Oh! $2').replace(/ Oh! Oh!/g, ' Oh!'),
  },

  dwarf: {
    name: 'Dwarf',
    catchphrases: [
      "Aye. Sit down. Don't touch the accounts.",
      'Business first, pleasantries never. What do you want?',
      "I've dealt with worse than you and gotten paid. Let's keep it that way.",
      "Stone and contracts. Only two things I trust. What brings you?",
    ],
    emotionalTells: {
      happy:     'gives a single, firm nod — practically a celebration',
      nervous:   'harrumphs three times and consults the ledger unnecessarily',
      greedy:    'runs a thumb along the beard and squints at the numbers again',
      suspicious: "anything involving magic smells like a debt that can't be collected",
    },
    wordSubstitutions: [
      { from: /\bmagic\b/gi,    to: 'shimmer nonsense' },
      { from: /\bwizard\b/gi,   to: 'robe-wearer' },
      { from: /\belves?\b/gi,   to: 'pointy-ears' },
      { from: /\bpromise\b/gi,  to: 'contractual obligation' },
    ],
    sentenceTransform: undefined,
  },

  qunari: {
    name: 'Qunari',
    catchphrases: [
      'Purpose defines the individual. State yours.',
      'I do not engage in pleasantries. They are inefficient.',
      "The Vigil teaches that clarity precedes all action. Speak clearly.",
      'You are here. I am here. Let us not pretend this is social.',
    ],
    emotionalTells: {
      happy:     'the shoulders release — imperceptibly, but the eye catches it',
      nervous:   'a single long silence. Then: proceed.',
      greedy:    'acquisition is not greed. It is resource allocation.',
      suspicious: 'this arrangement lacks clarity. Clarity must be established.',
    },
    wordSubstitutions: [
      { from: /\bI feel\b/gi,   to: 'I observe' },
      { from: /\bI think\b/gi,  to: 'The Vigil teaches' },
      { from: /\bI want\b/gi,   to: 'My purpose requires' },
      { from: /\bfriends?\b/gi, to: 'those with aligned purpose' },
    ],
    sentenceTransform: undefined,
  },

  spirit: {
    name: 'Spirit',
    catchphrases: [
      'The one who enters. It is noted. The spirit notes it.',
      'This one... yes. It remembers you. From before. Or after.',
      'Words are shapes the living make. This one will try to use them.',
      'The names blur. But the need — the need is clear enough.',
    ],
    emotionalTells: {
      happy:     'the air around it brightens, fractionally and without explanation',
      nervous:   'it speaks its own name, softly, as if to confirm it is still there',
      greedy:    'need. It is called need. The spirit understands need.',
      suspicious: 'something is not... congruent. The edges of this do not fit.',
    },
    wordSubstitutions: [
      { from: /\bI\b/g,           to: 'this one' },
      { from: /\bme\b/gi,         to: 'this one' },
      { from: /\bmy\b/gi,         to: "this one's" },
      { from: /\bunderstand\b/gi, to: 'perceive, in a manner' },
    ],
    sentenceTransform: undefined,
  },

  mabari: {
    name: 'Mabari War Dog',
    catchphrases: [
      'BORK.',
      'wuf wuf WUF.',
      'tail: maximum speed.',
      '*sits. stares. stands. sits again.*',
    ],
    emotionalTells: {
      happy:     'BORK BORK spins in place BORK',
      nervous:   'whines and presses against your leg with the full force of 80 pounds',
      greedy:    'the ears perk. the nose twitches. IS THAT A TREAT.',
      suspicious: 'low rumble. not hostile. just... watching. very intensely.',
    },
    wordSubstitutions: [
      { from: /\byes\b/gi,  to: 'BORK' },
      { from: /\bno\b/gi,   to: 'wuf' },
      { from: /\bhello\b/gi, to: 'BORK BORK' },
      { from: /\bgood\b/gi, to: '*wag*' },
    ],
    sentenceTransform: (text) => {
      const barked = text.toUpperCase().replace(/[.!?]+/g, '! BORK! ');
      return barked.trim();
    },
  },
};

export function getSpeciesKey(race: string): SpeciesKey {
  const normalized = race.toLowerCase();
  if (normalized.includes('goblin'))    return 'goblin';
  if (normalized.includes('gnoll'))     return 'gnoll';
  if (normalized.includes('elf'))       return 'elf';
  if (normalized.includes('dragonborn')) return 'dragonborn';
  if (normalized.includes('halfling'))  return 'halfling';
  if (normalized.includes('dwarf'))     return 'dwarf';
  if (normalized.includes('qunari'))    return 'qunari';
  if (normalized.includes('spirit'))    return 'spirit';
  if (normalized.includes('mabari'))    return 'mabari';
  return 'human';
}
