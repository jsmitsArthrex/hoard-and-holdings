import React, { useState, useCallback, useEffect } from 'react';
import { ChevronRight, Shuffle } from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { dragonBreeds } from '../data/dragonBreeds';
import { randomDragonName } from '../engine/gameClock';
import type { Difficulty } from '../types';

const INK = '#2C1810';
const PARCHMENT = '#C4934A';
const GOLD = '#C9A227';

const DIFFICULTY_OPTIONS: { id: Difficulty; label: string; desc: string; color: string }[] = [
  { id: 'easy',   label: 'Scroll of Comfort', desc: '30 props · 200g start · 2g/night motel', color: '#4A8A4A' },
  { id: 'normal', label: 'Standard Conquest',  desc: '50 props · 150g start · 5g/night motel', color: '#7A5A00' },
  { id: 'hard',   label: 'Ordeal of Flames',   desc: '75 props · 80g start · 10g/night motel',  color: '#8B1A1A' },
];

/* ─── Scene Illustrations ─── */

function VolcanoScene() {
  return (
    <svg viewBox="0 0 280 230" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="vs-sky" cx="50%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#3A1A2A" />
          <stop offset="100%" stopColor="#0D0508" />
        </radialGradient>
      </defs>
      <rect width="280" height="230" fill="url(#vs-sky)" />
      {/* Stars */}
      {([[40,18],[85,12],[135,22],[172,10],[215,28],[252,16],[22,48],[100,8],[258,42]] as [number,number][]).map(([x,y],i) => (
        <circle key={i} cx={x} cy={y} r="1.2" fill="white" opacity={0.5 + (i % 3) * 0.18}>
          <animate attributeName="opacity" values={`${0.3};${0.9};${0.3}`} dur={`${2 + i * 0.35}s`} repeatCount="indefinite" />
        </circle>
      ))}
      {/* Background mountain range */}
      <path d="M0,230 L30,195 L80,215 L115,182 L155,208 L195,178 L240,202 L280,188 L280,230 Z" fill="#160A04" />
      {/* Main volcano */}
      <path d="M0,230 L55,230 L80,175 L105,138 L128,108 L142,98 L156,108 L180,138 L204,175 L228,230 Z" fill="#240E06" />
      {/* Lava crater glow */}
      <ellipse cx="142" cy="100" rx="20" ry="9" fill="#FF5500" opacity="0.95">
        <animate attributeName="rx" values="16;26;16" dur="2.2s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.75;1;0.75" dur="2.2s" repeatCount="indefinite" />
      </ellipse>
      {/* Lava streams */}
      <path d="M134,108 Q130,128 127,152 Q124,168 122,188" stroke="#FF5500" strokeWidth="4" fill="none" opacity="0.65" strokeLinecap="round" />
      <path d="M150,108 Q155,130 157,150 Q159,166 160,180" stroke="#FF3300" strokeWidth="3" fill="none" opacity="0.55" strokeLinecap="round" />
      {/* Smoke puffs */}
      <circle cx="136" cy="80" r="11" fill="#553322" opacity="0.5">
        <animate attributeName="cy" values="80;56;80" dur="3.2s" repeatCount="indefinite" />
        <animate attributeName="r" values="9;16;9" dur="3.2s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.5;0;0.5" dur="3.2s" repeatCount="indefinite" />
      </circle>
      <circle cx="150" cy="72" r="8" fill="#443322" opacity="0.4">
        <animate attributeName="cy" values="72;46;72" dur="3.8s" repeatCount="indefinite" />
        <animate attributeName="r" values="7;13;7" dur="3.8s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.4;0;0.4" dur="3.8s" repeatCount="indefinite" />
      </circle>
      {/* Young dragon perched on rim, looking bored */}
      <ellipse cx="164" cy="100" rx="11" ry="7" fill="#D08020" />
      <path d="M158,96 Q148,82 151,90 Z" fill="#A06010" opacity="0.9" />
      <path d="M153,103 Q143,109 138,107" stroke="#C07018" strokeWidth="3" fill="none" strokeLinecap="round" />
      <ellipse cx="174" cy="97" rx="8" ry="6" fill="#E09030" />
      <circle cx="177" cy="96" r="2" fill="#FFEE22" />
      <circle cx="177" cy="96" r="1" fill="#100" />
      <line x1="160" y1="106" x2="158" y2="114" stroke="#B07020" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="167" y1="107" x2="167" y2="115" stroke="#B07020" strokeWidth="2.5" strokeLinecap="round" />
      {/* Ground */}
      <path d="M0,230 L0,212 Q50,200 100,208 Q150,216 200,204 Q240,196 280,208 L280,230 Z" fill="#1E0C04" />
      <rect x="5" y="5" width="270" height="220" fill="none" stroke="#8B5A1A" strokeWidth="1.5" opacity="0.35" rx="2" />
    </svg>
  );
}

function ConversationScene() {
  return (
    <svg viewBox="0 0 280 230" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="cs-bg" cx="50%" cy="60%" r="70%">
          <stop offset="0%" stopColor="#2A1A0A" />
          <stop offset="100%" stopColor="#0A0500" />
        </radialGradient>
      </defs>
      <rect width="280" height="230" fill="url(#cs-bg)" />
      {/* Cave floor */}
      <path d="M0,192 Q70,182 140,188 Q210,194 280,184 L280,230 L0,230 Z" fill="#180A02" />
      {/* Hoard glints */}
      {([[55,196],[78,198],[98,194],[120,197],[148,195],[170,199]] as [number,number][]).map(([x,y],i) => (
        <ellipse key={i} cx={x} cy={y} rx={3 + i % 3} ry={2} fill={i % 2 === 0 ? '#C9A227' : '#8B6914'} opacity="0.55" />
      ))}
      {/* Father dragon — large, stern, facing right */}
      <ellipse cx="62" cy="162" rx="38" ry="24" fill="#8A3A08" />
      <ellipse cx="57" cy="168" rx="26" ry="15" fill="#CC7818" opacity="0.55" />
      <path d="M52,142 Q47,128 50,116" stroke="#8A3A08" strokeWidth="18" fill="none" strokeLinecap="round" />
      <path d="M52,142 Q47,128 50,116" stroke="#AA5A18" strokeWidth="13" fill="none" strokeLinecap="round" />
      <ellipse cx="56" cy="108" rx="27" ry="19" fill="#9A4A10" />
      <circle cx="64" cy="105" r="8" fill="#FF8800" />
      <ellipse cx="64" cy="105" rx="3" ry="7" fill="#1A0800" />
      <path d="M57,98 Q65,96 72,99" stroke="#5A2A08" strokeWidth="3" fill="none" />
      <path d="M32,112 Q24,116 27,122 Q32,126 38,118" fill="#8A4010" />
      <path d="M47,91 Q41,73 44,83" fill="#5A2808" />
      <path d="M64,89 Q64,70 66,81" fill="#5A2808" />
      <path d="M70,152 Q98,126 110,104 Q90,124 84,138 Z" fill="#6A2808" opacity="0.8" />
      <path d="M100,164 Q122,158 132,150 Q142,142 138,134" stroke="#7A3008" strokeWidth="6" fill="none" strokeLinecap="round" />
      <polygon points="136,132 142,136 133,140" fill="#5A2208" />
      <line x1="46" y1="183" x2="42" y2="196" stroke="#7A3808" strokeWidth="7" strokeLinecap="round" />
      <line x1="66" y1="184" x2="64" y2="196" stroke="#7A3808" strokeWidth="7" strokeLinecap="round" />
      {/* Speech bubble */}
      <rect x="68" y="73" width="96" height="44" rx="7" fill="#F0E8C0" stroke="#8B5A1A" strokeWidth="1.5" />
      <polygon points="76,117 71,128 92,117" fill="#F0E8C0" stroke="#8B5A1A" strokeWidth="1.5" strokeLinejoin="round" />
      <line x1="77" y1="117" x2="91" y2="117" stroke="#F0E8C0" strokeWidth="3" />
      <text x="116" y="91" fontFamily="Crimson Text, serif" fontSize="9" fill="#2C1810" fontWeight="bold" textAnchor="middle">Freeloading.</text>
      <text x="116" y="106" fontFamily="Crimson Text, serif" fontSize="8.5" fill="#5A3810" textAnchor="middle">No hoard. No lair.</text>
      {/* Young dragon — smaller, sheepish, facing parent */}
      <ellipse cx="212" cy="172" rx="23" ry="16" fill="#D08020" />
      <ellipse cx="208" cy="177" rx="15" ry="10" fill="#FFCF50" opacity="0.55" />
      <path d="M202,160 Q198,148 200,138" stroke="#C07020" strokeWidth="11" fill="none" strokeLinecap="round" />
      <path d="M202,160 Q198,148 200,138" stroke="#E09030" strokeWidth="8" fill="none" strokeLinecap="round" />
      <ellipse cx="195" cy="131" rx="17" ry="13" fill="#D08030" />
      <circle cx="187" cy="128" r="5" fill="#FFEE22" />
      <ellipse cx="186" cy="128" rx="2" ry="4.5" fill="#0A0300" />
      <path d="M190,119 Q186,106 188,114" fill="#8A4A10" />
      <path d="M200,118 Q198,105 200,112" fill="#8A4A10" />
      <path d="M222,165 Q236,149 240,135 Q226,151 220,160 Z" fill="#A06010" opacity="0.8" />
      <path d="M233,175 Q250,169 254,161" stroke="#B07020" strokeWidth="4" fill="none" strokeLinecap="round" />
      <line x1="206" y1="187" x2="202" y2="198" stroke="#B07020" strokeWidth="5" strokeLinecap="round" />
      <line x1="218" y1="187" x2="217" y2="198" stroke="#B07020" strokeWidth="5" strokeLinecap="round" />
      {/* Mother silhouette BG */}
      <ellipse cx="158" cy="186" rx="13" ry="7" fill="#3A1A08" opacity="0.6" />
      <path d="M151,180 Q149,172 151,166" stroke="#3A1A08" strokeWidth="8" fill="none" strokeLinecap="round" opacity="0.6" />
      <ellipse cx="153" cy="162" rx="9" ry="6" fill="#3A1A08" opacity="0.6" />
      <rect x="5" y="5" width="270" height="220" fill="none" stroke="#8B5A1A" strokeWidth="1.5" opacity="0.35" rx="2" />
    </svg>
  );
}

function AmbitionScene() {
  return (
    <svg viewBox="0 0 280 230" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="as-sky" cx="50%" cy="20%" r="70%">
          <stop offset="0%" stopColor="#1A0A3A" />
          <stop offset="100%" stopColor="#050210" />
        </radialGradient>
        <radialGradient id="as-moon" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFFFD0" />
          <stop offset="100%" stopColor="#C8C060" />
        </radialGradient>
      </defs>
      <rect width="280" height="230" fill="url(#as-sky)" />
      {/* Stars */}
      {([[18,18],[52,32],[92,13],[142,26],[188,16],[224,33],[258,20],[268,46],[30,52],[162,40]] as [number,number][]).map(([x,y],i) => (
        <circle key={i} cx={x} cy={y} r="1.2" fill="white" opacity={0.4 + i * 0.04}>
          <animate attributeName="opacity" values={`${0.3};${0.95};${0.3}`} dur={`${1.6 + i * 0.38}s`} repeatCount="indefinite" />
        </circle>
      ))}
      {/* Crescent moon */}
      <circle cx="222" cy="40" r="20" fill="url(#as-moon)" opacity="0.9" />
      <circle cx="230" cy="34" r="15" fill="#1A0A3A" opacity="0.92" />
      {/* Distant town buildings */}
      <path d="M0,195 L280,195 L280,230 L0,230 Z" fill="#080614" />
      {([[18,178,10,17],[36,183,8,12],[58,173,13,22],[74,179,10,16],[92,168,16,27],[112,176,10,19],[132,165,18,30],[157,172,13,23],[178,177,10,18],[198,170,14,25],[218,176,10,19],[238,180,9,15],[258,173,12,22]] as [number,number,number,number][]).map(([x,y,w,h],i) => (
        <rect key={i} x={x} y={y} width={w} height={h} fill={i % 3 === 0 ? '#180E2A' : '#100820'} />
      ))}
      {/* Window lights */}
      {([[94,174],[98,182],[134,170],[138,179],[200,176]] as [number,number][]).map(([x,y],i) => (
        <rect key={i} x={x} y={y} width={3} height={3} fill="#C9A227" opacity="0.7">
          <animate attributeName="opacity" values="0.5;0.95;0.5" dur={`${1.5 + i}s`} repeatCount="indefinite" />
        </rect>
      ))}
      {/* Cliff silhouette */}
      <path d="M0,230 L0,172 Q35,158 65,148 Q95,138 108,132 L116,155 L132,140 L150,126 L162,146 L182,136 L204,150 Q225,162 255,167 Q268,170 280,165 L280,230 Z" fill="#160C04" />
      {/* Dragon — wings spread, triumphant */}
      <ellipse cx="152" cy="122" rx="22" ry="13" fill="#D08020" />
      <ellipse cx="148" cy="127" rx="14" ry="9" fill="#FFCF50" opacity="0.55" />
      <path d="M142,110 Q137,96 136,82" stroke="#C07020" strokeWidth="12" fill="none" strokeLinecap="round" />
      <path d="M142,110 Q137,96 136,82" stroke="#E09030" strokeWidth="9" fill="none" strokeLinecap="round" />
      <ellipse cx="132" cy="75" rx="18" ry="13" fill="#D08030" />
      <circle cx="124" cy="72" r="5.5" fill="#FFEE22" />
      <ellipse cx="123" cy="72" rx="2" ry="5" fill="#0A0300" />
      <circle cx="126" cy="70" r="1.8" fill="#FFFFC0" opacity="0.9">
        <animate attributeName="opacity" values="0.7;1;0.7" dur="2s" repeatCount="indefinite" />
      </circle>
      <path d="M124,62 Q118,48 121,58" fill="#8A4A10" />
      <path d="M136,61 Q132,46 134,57" fill="#8A4A10" />
      {/* Wings spread wide */}
      <path d="M150,112 Q180,86 202,64 Q180,88 170,106 Z" fill="#A06010" opacity="0.92" />
      <path d="M150,112 Q122,84 106,60 Q122,86 134,105 Z" fill="#A06010" opacity="0.88" />
      <line x1="150" y1="112" x2="202" y2="64" stroke="#7A4008" strokeWidth="1.5" opacity="0.45" />
      <line x1="150" y1="112" x2="106" y2="60" stroke="#7A4008" strokeWidth="1.5" opacity="0.45" />
      {/* Tail */}
      <path d="M172,126 Q190,120 198,112 Q204,106 200,100" stroke="#B07020" strokeWidth="4" fill="none" strokeLinecap="round" />
      <polygon points="198,98 204,102 197,106" fill="#8A5010" />
      {/* Aura glow */}
      <circle cx="136" cy="58" r="30" fill="#FFCC00" opacity="0.035">
        <animate attributeName="r" values="26;38;26" dur="3.5s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.03;0.09;0.03" dur="3.5s" repeatCount="indefinite" />
      </circle>
      <rect x="5" y="5" width="270" height="220" fill="none" stroke="#8B5A1A" strokeWidth="1.5" opacity="0.35" rx="2" />
    </svg>
  );
}

/* ─── Panel data ─── */

const PANELS: {
  title: string;
  chapter: string;
  text: string[];
  isTutorial?: boolean;
  Scene: (() => React.ReactElement) | null;
}[] = [
  {
    title: 'The Volcano',
    chapter: 'Chapter I',
    Scene: VolcanoScene,
    text: [
      'Deep within the Crimson Caldera, between your father\'s legendary hoard and your mother\'s emergency phylactery collection, you have spent forty-seven years doing absolutely nothing of consequence.',
      'You are young. You are gifted. You have a magnificent set of scales, an impressive wingspan, and the attention span of a very distracted magpie.',
      'But a dragon without a lair is just a very large lizard. And you are tired of being just a very large lizard.',
    ],
  },
  {
    title: 'The Conversation',
    chapter: 'Chapter II',
    Scene: ConversationScene,
    text: [
      'One crisp Tuesday morning, your father clears his throat with the sound of distant thunder.',
      '"Your mother and I have been discussing your... situation." Your mother pretends to be fascinated by a rock.',
      '"You are nearly fifty years old," he continues, "and you still don\'t have a lair. Or a hoard. Or a single terrified kobold to your name." The word \'freeloading\' is used. Twice.',
      'Your belongings are packed before nightfall. The volcano door closes behind you with a very pointed slam.',
    ],
  },
  {
    title: 'The Ambition',
    chapter: 'Chapter III',
    Scene: AmbitionScene,
    text: [
      'Fine. FINE.',
      'You will acquire the finest lair in the region. You will build an empire of kobold labour. You will crush adventurers, corner the market, and become so legendarily wealthy and feared that bards will compose terrible songs about your glory.',
      'All fifty properties in this region will bow to your name. The rival dragons who sneer at you now will grovel for a seat at your board.',
      'Your parents will be insufferably proud. You will pretend not to care.',
    ],
  },
  {
    title: 'How It Works',
    chapter: 'The Rules',
    isTutorial: true,
    Scene: null,
    text: [],
  },
];

const TUTORIAL_POINTS = [
  { icon: '🌅', label: 'Morning', desc: 'Choose one action: visit the realtor, the kobold agency, or manage your colony.' },
  { icon: '☀️', label: 'Afternoon', desc: 'Choose one action: hunt adventurers for gold & loot, visit a rival, or auction hoard items.' },
  { icon: '🌙', label: 'Evening', desc: 'Auto-resolves: kobold income flows in, rivals act, events unfold. Then sleep.' },
  { icon: '🪙', label: 'Gold', desc: 'The lifeblood of your empire. Buy lairs, pay wages, buy out rivals. Don\'t run out.' },
  { icon: '💀', label: 'Dread', desc: 'Your fearsome reputation. High dread intimidates rivals and boosts persuasion rolls.' },
  { icon: '🏆', label: 'Win Condition', desc: 'Own all 50 properties in the region. Lose condition: go broke.' },
];

function StatBar({ value, max, color }: { value: number; max: number; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <div style={{ flex: 1, height: 5, background: '#2C181050', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${(value / max) * 100}%`, height: '100%', background: color, borderRadius: 3 }} />
      </div>
      <span style={{ fontSize: 15, color: INK, minWidth: 24, textAlign: 'right' }}>{Math.round(value)}</span>
    </div>
  );
}

/* ─── Decorative corner ─── */
function BookCorner({ flipX, flipY }: { flipX?: boolean; flipY?: boolean }) {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28"
      style={{ transform: `scale(${flipX ? -1 : 1}, ${flipY ? -1 : 1})`, display: 'block' }}>
      <path d="M2,26 L2,7 Q2,2 7,2 L26,2" fill="none" stroke="#8B5A1A" strokeWidth="1.5" opacity="0.55" />
      <circle cx="2" cy="2" r="2" fill="#8B5A1A" opacity="0.4" />
      <path d="M2,16 Q7,14 11,9" fill="none" stroke="#8B5A1A" strokeWidth="1" opacity="0.3" />
    </svg>
  );
}

/* ─── Horizontal rule with diamond ─── */
function BookRule({ dim }: { dim?: boolean }) {
  const opacity = dim ? 0.35 : 0.55;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
      <div style={{ flex: 1, height: 1, background: `rgba(139,90,26,${opacity})` }} />
      <div style={{ fontSize: 13, color: `rgba(139,90,26,${opacity + 0.1})`, lineHeight: 1 }}>✦</div>
      <div style={{ flex: 1, height: 1, background: `rgba(139,90,26,${opacity})` }} />
    </div>
  );
}

const PAGE_NUMS = ['i', 'ii', 'iii'];

export default function IntroScreen() {
  const [panel, setPanel] = useState(0);
  const [dragonName, setDragonName] = useState(() => randomDragonName());
  const [selectedBreed, setSelectedBreed] = useState(dragonBreeds[0].id);
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');
  const initGame = useGameStore(s => s.initGame);

  const advance = useCallback(() => {
    setPanel(p => Math.min(p + 1, PANELS.length));
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowRight') {
        if (panel < PANELS.length) advance();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [panel, advance]);

  const isCreation = panel === PANELS.length;
  const currentPanel = PANELS[panel];

  return (
    <div
      style={{
        position: 'relative', height: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
        background: 'radial-gradient(ellipse at center, #3A1A0A 0%, #0D0500 100%)',
        fontFamily: '"Crimson Text", Georgia, serif',
        padding: '16px',
      }}
      onClick={!isCreation ? advance : undefined}
    >
      {/* Ambient embers */}
      <div className="intro-bg-ember" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse 60% 40% at 18% 82%, #FF4400 0%, transparent 70%)', animationDelay: '0s' }} />
      <div className="intro-bg-ember" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse 40% 30% at 82% 18%, #FF6600 0%, transparent 70%)', animationDelay: '2s' }} />

      {/* Progress dots */}
      <div style={{ display: 'flex', gap: 7, marginBottom: 10, zIndex: 1 }}>
        {PANELS.map((_, i) => (
          <div key={i} style={{
            width: 8, height: 8, borderRadius: '50%',
            background: i <= panel ? PARCHMENT : `${PARCHMENT}40`,
            transition: 'background 0.3s',
          }} />
        ))}
        <div style={{
          width: 8, height: 8, borderRadius: '50%',
          background: isCreation ? PARCHMENT : `${PARCHMENT}40`,
          transition: 'background 0.3s',
        }} />
      </div>

      {/* Book */}
      <div style={{
        position: 'relative', zIndex: 1,
        width: '100%', maxWidth: isCreation ? 860 : 900,
        maxHeight: 'calc(100vh - 72px)',
        display: 'flex',
        boxShadow: '-6px 6px 32px rgba(0,0,0,0.7), 6px 6px 32px rgba(0,0,0,0.5)',
        cursor: !isCreation ? 'pointer' : 'default',
        borderRadius: '2px 4px 4px 2px',
        overflow: 'hidden',
      }}>

        {isCreation ? (
          /* ── Character Creation — full-width parchment page ── */
          <div key="creation" className="sb-page-turn" style={{
            flex: 1, background: 'linear-gradient(160deg, #EDE0B8 0%, #DECE98 100%)',
            padding: '28px 36px', overflowY: 'auto',
            borderLeft: '5px solid #5A2E08',
            position: 'relative',
          }}>
            {/* Corner ornaments */}
            <div style={{ position: 'absolute', top: 10, left: 10 }}><BookCorner /></div>
            <div style={{ position: 'absolute', top: 10, right: 10 }}><BookCorner flipX /></div>
            <div style={{ position: 'absolute', bottom: 10, left: 10 }}><BookCorner flipY /></div>
            <div style={{ position: 'absolute', bottom: 10, right: 10 }}><BookCorner flipX flipY /></div>

            <div style={{ textAlign: 'center', marginBottom: 14 }}>
              <div style={{ fontFamily: '"Cinzel", serif', fontSize: 10, letterSpacing: 4, color: '#8B5A1A', marginBottom: 5 }}>HOARD &amp; HOLDINGS</div>
              <h2 style={{ fontFamily: '"Cinzel", serif', fontSize: 26, fontWeight: 700, color: INK, margin: '0 0 6px' }}>Name Your Dragon</h2>
              <BookRule />
              <p style={{ color: '#5A3A1A', fontSize: 17, margin: '8px 0 0' }}>Choose wisely. Legends remember names.</p>
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <input
                value={dragonName}
                onChange={e => setDragonName(e.target.value)}
                onClick={e => e.stopPropagation()}
                maxLength={30}
                placeholder="Enter dragon name…"
                style={{
                  flex: 1, padding: '10px 14px', fontSize: 20,
                  fontFamily: '"Cinzel", serif', fontWeight: 700,
                  border: `2px solid ${INK}`, borderRadius: 4,
                  background: '#F4EAC4', color: INK, outline: 'none',
                }}
              />
              <button
                onClick={e => { e.stopPropagation(); setDragonName(randomDragonName()); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '10px 14px',
                  background: INK, color: PARCHMENT, border: 'none', borderRadius: 4,
                  cursor: 'pointer', fontFamily: '"Cinzel", serif', fontSize: 18,
                }}
              >
                <Shuffle size={19} /> Randomize
              </button>
            </div>

            <div style={{ marginBottom: 12 }}>
              <div style={{ fontFamily: '"Cinzel", serif', fontWeight: 700, color: INK, fontSize: 14, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ flex: 1, height: 1, background: `${INK}40` }} />
                CHOOSE YOUR LINEAGE
                <div style={{ flex: 1, height: 1, background: `${INK}40` }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
                {dragonBreeds.map(breed => {
                  const isSel = breed.id === selectedBreed;
                  const s = breed.baseStats;
                  return (
                    <button key={breed.id}
                      onClick={e => { e.stopPropagation(); setSelectedBreed(breed.id); }}
                      style={{
                        padding: '7px 6px', border: `2px solid ${isSel ? INK : '#2C181040'}`,
                        borderRadius: 6, background: isSel ? '#2C1810' : '#E8D5A080',
                        color: isSel ? PARCHMENT : INK, cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
                      }}
                    >
                      <div style={{ fontFamily: '"Cinzel", serif', fontWeight: 700, fontSize: 13, marginBottom: 2 }}>{breed.breed}</div>
                      <div style={{ fontSize: 11, marginBottom: 4, opacity: 0.8, lineHeight: 1.3 }}>{breed.description}</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <StatBar value={s.attack} max={120} color={GOLD} />
                        <StatBar value={s.defense} max={120} color='#4A7ACC' />
                        <StatBar value={s.speed} max={120} color='#4ACC7A' />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginTop: 4, opacity: 0.7 }}>
                        <span>ATK</span><span>DEF</span><span>SPD</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <div style={{ fontFamily: '"Cinzel", serif', fontWeight: 700, color: INK, fontSize: 14, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ flex: 1, height: 1, background: `${INK}40` }} />
                CHOOSE YOUR FATE
                <div style={{ flex: 1, height: 1, background: `${INK}40` }} />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {DIFFICULTY_OPTIONS.map(opt => {
                  const isSel = opt.id === difficulty;
                  return (
                    <button key={opt.id}
                      onClick={e => { e.stopPropagation(); setDifficulty(opt.id); }}
                      style={{
                        flex: 1, padding: '8px 10px', border: `2px solid ${isSel ? opt.color : '#2C181040'}`,
                        borderRadius: 4, background: isSel ? opt.color + '22' : '#E8D5A080',
                        color: INK, cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
                      }}
                    >
                      <div style={{ fontFamily: '"Cinzel", serif', fontWeight: 700, fontSize: 14, marginBottom: 4, color: isSel ? opt.color : INK }}>{opt.label}</div>
                      <div style={{ fontSize: 13, color: '#5A3A1A', lineHeight: 1.4 }}>{opt.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              onClick={e => { e.stopPropagation(); if (dragonName.trim()) initGame(dragonName.trim(), selectedBreed, difficulty); }}
              disabled={!dragonName.trim()}
              style={{
                width: '100%', padding: '13px', fontSize: 18,
                fontFamily: '"Cinzel", serif', fontWeight: 700, letterSpacing: 1,
                background: dragonName.trim() ? GOLD : '#8A7A40',
                color: INK, border: `2px solid ${INK}`, borderRadius: 4,
                cursor: dragonName.trim() ? 'pointer' : 'not-allowed', transition: 'background 0.2s',
              }}
            >
              ⚔ Begin Your Legend
            </button>
          </div>

        ) : currentPanel.isTutorial ? (
          /* ── Tutorial — full-width book page ── */
          <div key={`tutorial-${panel}`} className="sb-page-turn" style={{
            flex: 1, background: 'linear-gradient(160deg, #EDE0B8 0%, #DECE98 100%)',
            padding: '32px 48px', position: 'relative',
            borderLeft: '5px solid #5A2E08',
          }}>
            <div style={{ position: 'absolute', top: 10, left: 10 }}><BookCorner /></div>
            <div style={{ position: 'absolute', top: 10, right: 10 }}><BookCorner flipX /></div>
            <div style={{ position: 'absolute', bottom: 32, left: 10 }}><BookCorner flipY /></div>
            <div style={{ position: 'absolute', bottom: 32, right: 10 }}><BookCorner flipX flipY /></div>

            <div style={{ textAlign: 'center', marginBottom: 22 }}>
              <div style={{ fontFamily: '"Cinzel", serif', fontSize: 10, letterSpacing: 4, color: '#8B5A1A', marginBottom: 6 }}>THE RULES</div>
              <h2 style={{ fontFamily: '"Cinzel", serif', fontSize: 24, fontWeight: 700, color: INK, margin: '0 0 10px' }}>How It Works</h2>
              <BookRule />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 11 }}>
              {TUTORIAL_POINTS.map((pt, idx) => (
                <div key={pt.label} className="intro-fade-up" style={{
                  animationDelay: `${0.08 + idx * 0.07}s`,
                  background: '#2C181010', border: `1px solid #8B5A1A30`,
                  borderRadius: 4, padding: '11px 13px', display: 'flex', gap: 10, alignItems: 'flex-start',
                }}>
                  <span style={{ fontSize: 21, flexShrink: 0 }}>{pt.icon}</span>
                  <div>
                    <div style={{ fontFamily: '"Cinzel", serif', fontWeight: 700, color: INK, fontSize: 16, marginBottom: 2 }}>{pt.label}</div>
                    <div style={{ fontSize: 16, color: '#3A2010', lineHeight: 1.5 }}>{pt.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 24 }}><BookRule dim /></div>
            <div style={{ textAlign: 'center', marginTop: 12, color: '#8B5A1A', fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
              <ChevronRight size={16} /> Click or press Enter to continue
            </div>
            <div style={{ position: 'absolute', bottom: 14, right: 22, fontFamily: '"Cinzel", serif', fontSize: 11, color: '#8B5A1A', opacity: 0.5 }}>iv</div>
          </div>

        ) : (
          /* ── Story panel — open book spread ── */
          <div key={`panel-${panel}`} className="sb-page-turn" style={{ display: 'flex', flex: 1, minHeight: 480 }}>

            {/* Left page — illustration */}
            <div style={{
              width: '42%', flexShrink: 0,
              background: 'linear-gradient(168deg, #D6C484 0%, #C4B468 100%)',
              borderLeft: '5px solid #5A2E08',
              display: 'flex', flexDirection: 'column',
              padding: '14px 14px 10px',
              position: 'relative',
            }}>
              {/* Top label */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                <div style={{ flex: 1, height: 1, background: '#8B5A1A70' }} />
                <span style={{ fontFamily: '"Cinzel", serif', fontSize: 9, color: '#8B5A1A', letterSpacing: 3 }}>HOARD &amp; HOLDINGS</span>
                <div style={{ flex: 1, height: 1, background: '#8B5A1A70' }} />
              </div>
              {/* Illustration frame */}
              <div style={{
                flex: 1, borderRadius: 3, overflow: 'hidden',
                border: '2px solid #8B5A1A55',
                boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.25), 2px 2px 8px rgba(0,0,0,0.3)',
              }}>
                {currentPanel.Scene && <currentPanel.Scene />}
              </div>
              {/* Chapter & page number */}
              <div style={{ textAlign: 'center', marginTop: 9, fontFamily: '"Cinzel", serif', fontSize: 11, color: '#8B5A1A', letterSpacing: 2 }}>
                {currentPanel.chapter}
              </div>
              <div style={{ textAlign: 'center', marginTop: 2, fontFamily: '"Cinzel", serif', fontSize: 10, color: '#8B5A1A', opacity: 0.5 }}>
                {PAGE_NUMS[panel]}
              </div>
            </div>

            {/* Spine */}
            <div style={{
              width: 14, flexShrink: 0,
              background: 'linear-gradient(to right, #3A1A06, #6A3A10 50%, #3A1A06)',
              boxShadow: 'inset 3px 0 8px rgba(0,0,0,0.55), inset -3px 0 8px rgba(0,0,0,0.45)',
            }} />

            {/* Right page — story text */}
            <div style={{
              flex: 1,
              background: 'linear-gradient(158deg, #F4EAC8 0%, #E8DAB0 100%)',
              padding: '22px 26px 18px',
              display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
              position: 'relative',
            }}>
              <div style={{ position: 'absolute', top: 10, right: 10 }}><BookCorner flipX /></div>
              <div style={{ position: 'absolute', bottom: 30, right: 10 }}><BookCorner flipX flipY /></div>

              <div>
                <BookRule />
                <h2 className="intro-fade-up" style={{
                  fontFamily: '"Cinzel", serif', fontSize: 21, fontWeight: 700,
                  color: INK, margin: '13px 0 14px', animationDelay: '0.04s',
                }}>
                  {currentPanel.title}
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {currentPanel.text.map((t, i) => (
                    <p key={i} className="intro-fade-up" style={{
                      fontSize: 17, color: '#2C1810', lineHeight: 1.78, margin: 0,
                      animationDelay: `${0.1 + i * 0.1}s`,
                    }}>
                      {i === 0 ? (
                        <>
                          <span style={{
                            float: 'left', fontSize: 54, lineHeight: 0.78,
                            fontFamily: '"Cinzel", serif', fontWeight: 900,
                            color: '#8B1A1A', marginRight: 5, marginTop: 5, paddingTop: 2,
                          }}>{t[0]}</span>
                          {t.slice(1)}
                        </>
                      ) : t}
                    </p>
                  ))}
                </div>
              </div>

              <div>
                <BookRule dim />
                <div style={{ marginTop: 10, color: '#8B5A1A', fontSize: 15, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <ChevronRight size={16} /> Click or press Enter to turn the page
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
