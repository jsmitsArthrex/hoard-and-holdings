import React from 'react';

export type NPCRole =
  | 'goblin-realtor'
  | 'gnoll-agency'
  | 'dragonborn-banker'
  | 'elven-lawyer'
  | 'halfling-innkeeper'
  | 'rival-dragon';

interface Props {
  role: NPCRole;
  size?: number;
  breedId?: string;
}

interface DragonPalette {
  bgFrom: string; bgTo: string;
  scaleFrom: string; scaleTo: string;
  glowColor: string; glowOuter: string;
  wingFill: string; wingStroke: string;
  bodyDark: string; bodyMid: string;
  neckScale: string;
  hornFill: string; hornStroke: string;
  scaleTex: string;
  browColor: string;
  eyeOuter: string; eyeInner: string;
  snout: string; nostril: string;
  smokeColor: string;
  mouthLine: string; mouthFill: string;
}

const DRAGON_PALETTES: Record<string, DragonPalette> = {
  fire: {
    bgFrom:'#2A0808', bgTo:'#0A0202',
    scaleFrom:'#E03020', scaleTo:'#880808',
    glowColor:'#FF6020', glowOuter:'#880000',
    wingFill:'#661010', wingStroke:'#881818',
    bodyDark:'#880808', bodyMid:'#AA1010',
    neckScale:'#CC2010',
    hornFill:'#5A1010', hornStroke:'#8A2020',
    scaleTex:'#AA1808',
    browColor:'#6A0808',
    eyeOuter:'#FFEE00', eyeInner:'#DDCC00',
    snout:'#CC2010', nostril:'#880808',
    smokeColor:'#FF8040',
    mouthLine:'#6A0808', mouthFill:'#8B1010',
  },
  ice: {
    bgFrom:'#080A2A', bgTo:'#020408',
    scaleFrom:'#60C8E0', scaleTo:'#1A6A88',
    glowColor:'#80EEFF', glowOuter:'#003358',
    wingFill:'#104458', wingStroke:'#186888',
    bodyDark:'#1A6A88', bodyMid:'#2A8AAA',
    neckScale:'#40AABB',
    hornFill:'#0A3050', hornStroke:'#1A5070',
    scaleTex:'#2A8898',
    browColor:'#0A4060',
    eyeOuter:'#AAEEFF', eyeInner:'#88CCEE',
    snout:'#40AABB', nostril:'#1A6A88',
    smokeColor:'#AAEEFF',
    mouthLine:'#0A4060', mouthFill:'#1A6A88',
  },
  dragon: {
    bgFrom:'#1A0A2E', bgTo:'#080410',
    scaleFrom:'#9040C8', scaleTo:'#4A0888',
    glowColor:'#C060FF', glowOuter:'#440066',
    wingFill:'#3A1060', wingStroke:'#6020A0',
    bodyDark:'#4A0888', bodyMid:'#6A10AA',
    neckScale:'#8830CC',
    hornFill:'#2A0850', hornStroke:'#5010A0',
    scaleTex:'#6020A8',
    browColor:'#3A0068',
    eyeOuter:'#FF88AA', eyeInner:'#DD6688',
    snout:'#8830CC', nostril:'#4A0888',
    smokeColor:'#FF88CC',
    mouthLine:'#3A0068', mouthFill:'#5A1088',
  },
  poison: {
    bgFrom:'#0A1A08', bgTo:'#020A02',
    scaleFrom:'#40BB20', scaleTo:'#1A6A08',
    glowColor:'#88FF40', glowOuter:'#004400',
    wingFill:'#206010', wingStroke:'#408020',
    bodyDark:'#1A6A08', bodyMid:'#2A8A18',
    neckScale:'#50AA28',
    hornFill:'#0A3808', hornStroke:'#206010',
    scaleTex:'#30AA18',
    browColor:'#0A4008',
    eyeOuter:'#AAFF44', eyeInner:'#88DD22',
    snout:'#50AA28', nostril:'#1A6A08',
    smokeColor:'#CCFF88',
    mouthLine:'#0A4008', mouthFill:'#1A6A08',
  },
  electric: {
    bgFrom:'#1A1A08', bgTo:'#080802',
    scaleFrom:'#E0CC20', scaleTo:'#888010',
    glowColor:'#FFEE40', glowOuter:'#665500',
    wingFill:'#505008', wingStroke:'#807010',
    bodyDark:'#888010', bodyMid:'#AAAA18',
    neckScale:'#CCCC20',
    hornFill:'#3A3808', hornStroke:'#706808',
    scaleTex:'#AABB10',
    browColor:'#505008',
    eyeOuter:'#FFFFFF', eyeInner:'#EEEEBB',
    snout:'#CCCC20', nostril:'#888010',
    smokeColor:'#FFFFFF',
    mouthLine:'#505008', mouthFill:'#888810',
  },
  dark: {
    bgFrom:'#0A0A0A', bgTo:'#020202',
    scaleFrom:'#3A1A50', scaleTo:'#180A28',
    glowColor:'#8840CC', glowOuter:'#220044',
    wingFill:'#1A0A30', wingStroke:'#2A1040',
    bodyDark:'#180A28', bodyMid:'#281440',
    neckScale:'#4A2060',
    hornFill:'#0A0A18', hornStroke:'#1A0A28',
    scaleTex:'#2A1040',
    browColor:'#100818',
    eyeOuter:'#DD4488', eyeInner:'#BB2266',
    snout:'#4A2060', nostril:'#180A28',
    smokeColor:'#CC44AA',
    mouthLine:'#100818', mouthFill:'#1A0828',
  },
  ghost: {
    bgFrom:'#0A0A1A', bgTo:'#020208',
    scaleFrom:'#D0C8E8', scaleTo:'#6A60A8',
    glowColor:'#EEEEFF', glowOuter:'#8880CC',
    wingFill:'#5050A0', wingStroke:'#7070C0',
    bodyDark:'#6A60A8', bodyMid:'#8A80C8',
    neckScale:'#B0A8D8',
    hornFill:'#3A3878', hornStroke:'#5050A0',
    scaleTex:'#8880C0',
    browColor:'#4848A0',
    eyeOuter:'#EEEEFF', eyeInner:'#CCCCEE',
    snout:'#B0A8D8', nostril:'#6A60A8',
    smokeColor:'#EEEEFF',
    mouthLine:'#4848A0', mouthFill:'#7070A8',
  },
  steel: {
    bgFrom:'#181820', bgTo:'#080810',
    scaleFrom:'#A0B0C8', scaleTo:'#505870',
    glowColor:'#D0E0F0', glowOuter:'#304050',
    wingFill:'#404860', wingStroke:'#607080',
    bodyDark:'#505870', bodyMid:'#7080A0',
    neckScale:'#90A8C0',
    hornFill:'#303848', hornStroke:'#506070',
    scaleTex:'#708098',
    browColor:'#404858',
    eyeOuter:'#88CCFF', eyeInner:'#5599CC',
    snout:'#90A8C0', nostril:'#505870',
    smokeColor:'#DDEEFF',
    mouthLine:'#404858', mouthFill:'#607080',
  },
};

function GoblinRealtor() {
  return (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="gob-bg" cx="50%" cy="70%" r="60%">
          <stop offset="0%" stopColor="#1C3A10" />
          <stop offset="100%" stopColor="#0A1A06" />
        </radialGradient>
        <radialGradient id="gob-face" cx="50%" cy="40%" r="55%">
          <stop offset="0%" stopColor="#72C048" />
          <stop offset="100%" stopColor="#4A8020" />
        </radialGradient>
      </defs>
      <rect width="100" height="100" fill="url(#gob-bg)" />
      {/* Shoulders / jacket */}
      <ellipse cx="50" cy="100" rx="38" ry="22" fill="#5A4010" />
      <ellipse cx="50" cy="96" rx="32" ry="18" fill="#3A2808" />
      {/* Gold tie */}
      <polygon points="50,82 46,90 50,98 54,90" fill="#C9A227" />
      <rect x="47" y="80" width="6" height="4" fill="#C9A227" />
      {/* Collar */}
      <polygon points="35,80 50,78 65,80 60,90 50,84 40,90" fill="#2A1C08" />
      {/* Neck */}
      <rect x="43" y="74" width="14" height="10" rx="4" fill="url(#gob-face)" />
      {/* Big ears */}
      <ellipse cx="18" cy="56" rx="10" ry="14" fill="#4A8020" />
      <ellipse cx="18" cy="56" rx="6" ry="9" fill="#3A6015" />
      <ellipse cx="82" cy="56" rx="10" ry="14" fill="#4A8020" />
      <ellipse cx="82" cy="56" rx="6" ry="9" fill="#3A6015" />
      {/* Head */}
      <ellipse cx="50" cy="52" rx="26" ry="28" fill="url(#gob-face)" />
      {/* Top hat brim */}
      <rect x="24" y="26" width="52" height="5" rx="2" fill="#1A1208" />
      {/* Top hat crown */}
      <rect x="30" y="6" width="40" height="22" rx="4" fill="#1A1208" />
      {/* Hat band */}
      <rect x="30" y="24" width="40" height="4" fill="#C9A227" />
      {/* Hat shine */}
      <rect x="33" y="8" width="6" height="16" rx="3" fill="#2C2010" opacity="0.5" />
      {/* Eyes */}
      <ellipse cx="40" cy="52" rx="6" ry="7" fill="#FF5500" />
      <ellipse cx="60" cy="52" rx="6" ry="7" fill="#FF5500" />
      <ellipse cx="40" cy="52" rx="3" ry="5" fill="#CC2200" />
      <ellipse cx="60" cy="52" rx="3" ry="5" fill="#CC2200" />
      <circle cx="41" cy="50" r="1.5" fill="#FFAA88" />
      <circle cx="61" cy="50" r="1.5" fill="#FFAA88" />
      {/* Eyebrows - sly */}
      <line x1="34" y1="44" x2="46" y2="46" stroke="#1A3A0A" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="54" y1="46" x2="66" y2="44" stroke="#1A3A0A" strokeWidth="2.5" strokeLinecap="round" />
      {/* Wide grin */}
      <path d="M 36 65 Q 50 74 64 65" stroke="#1A3A0A" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M 38 66 Q 50 73 62 66" fill="#8B1A1A" opacity="0.7" />
      {/* Pointy teeth */}
      <polygon points="42,68 45,68 43.5,73" fill="#E8E0C8" />
      <polygon points="46,69 49,69 47.5,74" fill="#E8E0C8" />
      <polygon points="51,69 54,69 52.5,74" fill="#E8E0C8" />
      <polygon points="55,68 58,68 56.5,73" fill="#E8E0C8" />
      {/* Nose - small bulbous */}
      <ellipse cx="50" cy="61" rx="5" ry="3.5" fill="#3A6815" />
      <circle cx="47" cy="62" r="1.5" fill="#2A5010" />
      <circle cx="53" cy="62" r="1.5" fill="#2A5010" />
      {/* Warts */}
      <circle cx="35" cy="58" r="2" fill="#3A6010" />
      <circle cx="65" cy="60" r="1.5" fill="#3A6010" />
    </svg>
  );
}

function GnollAgency() {
  return (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="gn-bg" cx="50%" cy="70%" r="60%">
          <stop offset="0%" stopColor="#2A1A08" />
          <stop offset="100%" stopColor="#0E0804" />
        </radialGradient>
        <radialGradient id="gn-fur" cx="50%" cy="35%" r="60%">
          <stop offset="0%" stopColor="#C8956A" />
          <stop offset="100%" stopColor="#8A5A2A" />
        </radialGradient>
      </defs>
      <rect width="100" height="100" fill="url(#gn-bg)" />
      {/* Shoulders / vest */}
      <ellipse cx="50" cy="102" rx="42" ry="24" fill="#2A2018" />
      <ellipse cx="50" cy="98" rx="34" ry="18" fill="#1A1408" />
      {/* Mane / ruff */}
      {[...Array(12)].map((_, i) => {
        const angle = (i / 12) * Math.PI + 0.1;
        const cx2 = 50 + Math.cos(angle) * 30;
        const cy2 = 78 + Math.sin(angle) * 12;
        return <ellipse key={i} cx={cx2} cy={cy2} rx="7" ry="5" fill="#6A4020" transform={`rotate(${angle * 57 - 90} ${cx2} ${cy2})`} />;
      })}
      {/* Neck */}
      <rect x="42" y="72" width="16" height="12" rx="5" fill="url(#gn-fur)" />
      {/* Head - slightly elongated for hyena */}
      <ellipse cx="50" cy="48" rx="26" ry="28" fill="url(#gn-fur)" />
      {/* Spotted pattern on head */}
      <circle cx="36" cy="40" r="4" fill="#7A4820" opacity="0.5" />
      <circle cx="64" cy="38" r="3" fill="#7A4820" opacity="0.5" />
      <circle cx="55" cy="60" r="3" fill="#7A4820" opacity="0.4" />
      {/* Rounded ears */}
      <ellipse cx="28" cy="26" rx="10" ry="12" fill="#9A6A3A" />
      <ellipse cx="72" cy="26" rx="10" ry="12" fill="#9A6A3A" />
      <ellipse cx="28" cy="26" rx="6" ry="7" fill="#7A4820" />
      <ellipse cx="72" cy="26" rx="6" ry="7" fill="#7A4820" />
      {/* Muzzle */}
      <ellipse cx="50" cy="63" rx="14" ry="10" fill="#D0A870" />
      <ellipse cx="50" cy="60" rx="12" ry="8" fill="#C89858" />
      {/* Nose - wide */}
      <ellipse cx="50" cy="56" rx="7" ry="4" fill="#3A2010" />
      <circle cx="46" cy="57" r="2" fill="#1A0E06" />
      <circle cx="54" cy="57" r="2" fill="#1A0E06" />
      {/* Amber eyes */}
      <ellipse cx="38" cy="46" rx="7" ry="6" fill="#FFAA20" />
      <ellipse cx="62" cy="46" rx="7" ry="6" fill="#FFAA20" />
      <ellipse cx="38" cy="46" rx="4" ry="5" fill="#CC7700" />
      <ellipse cx="62" cy="46" rx="4" ry="5" fill="#CC7700" />
      <ellipse cx="38" cy="46" rx="1.5" ry="4" fill="#1A0E06" />
      <ellipse cx="62" cy="46" rx="1.5" ry="4" fill="#1A0E06" />
      <circle cx="39" cy="44" r="1.5" fill="#FFDD88" opacity="0.8" />
      <circle cx="63" cy="44" r="1.5" fill="#FFDD88" opacity="0.8" />
      {/* Eyebrows - thick */}
      <path d="M 31 40 Q 38 37 44 40" stroke="#5A3010" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M 56 40 Q 62 37 69 40" stroke="#5A3010" strokeWidth="3" fill="none" strokeLinecap="round" />
      {/* Mouth / grin */}
      <path d="M 38 67 Q 50 72 62 67" stroke="#3A2010" strokeWidth="2" fill="none" strokeLinecap="round" />
      {/* Scars */}
      <line x1="30" y1="44" x2="34" y2="52" stroke="#6A3A18" strokeWidth="1.5" opacity="0.7" />
    </svg>
  );
}

function DragonbornBanker() {
  return (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="db-bg" cx="50%" cy="60%" r="65%">
          <stop offset="0%" stopColor="#1A1040" />
          <stop offset="100%" stopColor="#080616" />
        </radialGradient>
        <radialGradient id="db-scale" cx="40%" cy="30%" r="65%">
          <stop offset="0%" stopColor="#E8962A" />
          <stop offset="100%" stopColor="#A05A10" />
        </radialGradient>
      </defs>
      <rect width="100" height="100" fill="url(#db-bg)" />
      {/* Formal jacket */}
      <ellipse cx="50" cy="102" rx="40" ry="22" fill="#0A0A2A" />
      <ellipse cx="50" cy="98" rx="33" ry="17" fill="#06061C" />
      {/* White shirt / cravat */}
      <polygon points="50,80 44,92 50,98 56,92" fill="#E8E0D0" />
      <rect x="46" y="78" width="8" height="5" fill="#E8E0D0" />
      {/* Lapels */}
      <polygon points="33,80 50,75 67,80 60,94 50,86 40,94" fill="#0A0A2A" />
      {/* Neck / scales */}
      <rect x="42" y="72" width="16" height="12" rx="4" fill="url(#db-scale)" />
      {/* Scale texture on neck */}
      {[44, 48, 52, 56].map(x => <circle key={x} cx={x} cy={76} r="2" fill="#C07020" opacity="0.6" />)}
      {/* Head */}
      <ellipse cx="50" cy="48" rx="25" ry="28" fill="url(#db-scale)" />
      {/* Scale texture pattern on face */}
      {[
        [38,38],[46,34],[54,34],[62,38],
        [34,46],[42,42],[50,40],[58,42],[66,46],
        [36,54],[44,50],[52,48],[60,50],[64,54],
      ].map(([x,y],i) => <circle key={i} cx={x} cy={y} r="2.5" fill="#C07020" opacity="0.45" />)}
      {/* No hair - draconic ridges on top */}
      <path d="M 34 28 Q 38 18 42 24 Q 46 14 50 22 Q 54 14 58 24 Q 62 18 66 28" stroke="#8A4A10" strokeWidth="3" fill="none" />
      {/* Ears - swept back fins */}
      <path d="M 25 44 L 18 30 L 26 36 L 28 42" fill="#A05A10" />
      <path d="M 75 44 L 82 30 L 74 36 L 72 42" fill="#A05A10" />
      {/* Blue eyes */}
      <ellipse cx="39" cy="48" rx="6.5" ry="6" fill="#22AAFF" />
      <ellipse cx="61" cy="48" rx="6.5" ry="6" fill="#22AAFF" />
      <ellipse cx="39" cy="48" rx="4" ry="5" fill="#1166CC" />
      <ellipse cx="61" cy="48" rx="4" ry="5" fill="#1166CC" />
      <ellipse cx="39" cy="48" rx="1.5" ry="4" fill="#0A0A0A" />
      <ellipse cx="61" cy="48" rx="1.5" ry="4" fill="#0A0A0A" />
      <circle cx="40" cy="46" r="1.5" fill="#88DDFF" opacity="0.9" />
      <circle cx="62" cy="46" r="1.5" fill="#88DDFF" opacity="0.9" />
      {/* Monocle on right eye */}
      <circle cx="61" cy="48" r="9" stroke="#C9A227" strokeWidth="1.5" fill="none" />
      <line x1="70" y1="48" x2="74" y2="52" stroke="#C9A227" strokeWidth="1.5" />
      {/* Snout */}
      <path d="M 38 60 Q 50 68 62 60 Q 58 70 50 72 Q 42 70 38 60 Z" fill="#C07020" />
      {/* Nostrils */}
      <ellipse cx="45" cy="62" rx="3" ry="2" fill="#8A4A10" />
      <ellipse cx="55" cy="62" rx="3" ry="2" fill="#8A4A10" />
      {/* Slight smirk */}
      <path d="M 42 66 Q 50 70 58 66" stroke="#8A4A10" strokeWidth="2" fill="none" strokeLinecap="round" />
      {/* Eyebrow ridges */}
      <path d="M 32 42 Q 39 38 46 42" stroke="#8A4A10" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M 54 42 Q 61 38 68 42" stroke="#8A4A10" strokeWidth="3" fill="none" strokeLinecap="round" />
    </svg>
  );
}

function ElvenLawyer() {
  return (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="el-bg" cx="50%" cy="60%" r="65%">
          <stop offset="0%" stopColor="#0C1A10" />
          <stop offset="100%" stopColor="#04080A" />
        </radialGradient>
        <radialGradient id="el-skin" cx="45%" cy="35%" r="60%">
          <stop offset="0%" stopColor="#E8D8B8" />
          <stop offset="100%" stopColor="#C4A880" />
        </radialGradient>
      </defs>
      <rect width="100" height="100" fill="url(#el-bg)" />
      {/* Robes */}
      <ellipse cx="50" cy="104" rx="44" ry="26" fill="#2A3C28" />
      <ellipse cx="50" cy="100" rx="36" ry="20" fill="#1E2E1C" />
      {/* Robe details - gold trim */}
      <path d="M 14 90 Q 50 82 86 90" stroke="#C9A227" strokeWidth="1.5" fill="none" />
      {/* Collar - formal */}
      <path d="M 32 80 Q 50 74 68 80 L 62 94 L 50 88 L 38 94 Z" fill="#2A3C28" />
      <path d="M 36 80 Q 50 76 64 80 L 60 90 L 50 86 L 40 90 Z" fill="#1E2E1C" />
      {/* Silver brooch */}
      <circle cx="50" cy="80" r="4" fill="#D0D8E0" />
      <circle cx="50" cy="80" r="2" fill="#44CCAA" />
      {/* Neck */}
      <rect x="43" y="72" width="14" height="12" rx="5" fill="url(#el-skin)" />
      {/* Silver hair flowing down sides */}
      <path d="M 24 36 Q 20 50 22 72 Q 26 80 34 82" stroke="#C8D4DC" strokeWidth="8" fill="none" strokeLinecap="round" />
      <path d="M 76 36 Q 80 50 78 72 Q 74 80 66 82" stroke="#C8D4DC" strokeWidth="8" fill="none" strokeLinecap="round" />
      {/* Head */}
      <ellipse cx="50" cy="46" rx="22" ry="26" fill="url(#el-skin)" />
      {/* Pointed ears */}
      <polygon points="28,46 18,30 30,40" fill="#D8C8A8" />
      <polygon points="28,46 20,32 29,42" fill="#C4A880" />
      <polygon points="72,46 82,30 70,40" fill="#D8C8A8" />
      <polygon points="72,46 80,32 71,42" fill="#C4A880" />
      {/* Silver circlet */}
      <path d="M 28 30 Q 50 22 72 30" stroke="#D8E0E8" strokeWidth="3" fill="none" strokeLinecap="round" />
      {/* Gem on circlet */}
      <ellipse cx="50" cy="25" rx="5" ry="4" fill="#44CCAA" />
      <ellipse cx="50" cy="25" rx="3" ry="2.5" fill="#66EEBB" />
      {/* Silver hair on top */}
      <path d="M 30 32 Q 50 24 70 32 Q 60 28 50 26 Q 40 28 30 32" fill="#C8D4DC" />
      {/* Eyebrows - elegant arched */}
      <path d="M 33 38 Q 40 33 47 37" stroke="#8A7A60" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M 53 37 Q 60 33 67 38" stroke="#8A7A60" strokeWidth="2" fill="none" strokeLinecap="round" />
      {/* Teal eyes - almond shaped */}
      <ellipse cx="40" cy="44" rx="7" ry="5" fill="#44CCAA" />
      <ellipse cx="60" cy="44" rx="7" ry="5" fill="#44CCAA" />
      <ellipse cx="40" cy="44" rx="4" ry="4" fill="#228866" />
      <ellipse cx="60" cy="44" rx="4" ry="4" fill="#228866" />
      <ellipse cx="40" cy="44" rx="2" ry="3" fill="#0A1A10" />
      <ellipse cx="60" cy="44" rx="2" ry="3" fill="#0A1A10" />
      <circle cx="41" cy="42" r="1.5" fill="#AAEEDD" opacity="0.9" />
      <circle cx="61" cy="42" r="1.5" fill="#AAEEDD" opacity="0.9" />
      {/* Upper eyelashes */}
      <path d="M 33 41 Q 40 38 47 41" stroke="#4A3A20" strokeWidth="1.5" fill="none" />
      <path d="M 53 41 Q 60 38 67 41" stroke="#4A3A20" strokeWidth="1.5" fill="none" />
      {/* Nose - refined */}
      <path d="M 48 50 Q 50 54 52 50" stroke="#C4A880" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <circle cx="47" cy="54" r="1.5" fill="#C0A070" opacity="0.6" />
      <circle cx="53" cy="54" r="1.5" fill="#C0A070" opacity="0.6" />
      {/* Neutral, cool mouth */}
      <path d="M 40 61 Q 50 63 60 61" stroke="#9A7A58" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d="M 42 61 Q 50 64 58 61" fill="#C48868" opacity="0.6" />
    </svg>
  );
}

function HalflingInnkeeper() {
  return (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="hi-bg" cx="50%" cy="65%" r="60%">
          <stop offset="0%" stopColor="#2A1008" />
          <stop offset="100%" stopColor="#0E0604" />
        </radialGradient>
        <radialGradient id="hi-skin" cx="45%" cy="35%" r="60%">
          <stop offset="0%" stopColor="#E8B880" />
          <stop offset="100%" stopColor="#C4844A" />
        </radialGradient>
      </defs>
      <rect width="100" height="100" fill="url(#hi-bg)" />
      {/* Apron / body */}
      <ellipse cx="50" cy="106" rx="46" ry="28" fill="#C84422" />
      <ellipse cx="50" cy="102" rx="38" ry="22" fill="#AA2210" />
      {/* Apron bib */}
      <ellipse cx="50" cy="96" rx="22" ry="18" fill="#E8D080" />
      {/* Gold apron tie */}
      <rect x="46" y="82" width="8" height="4" fill="#C9A227" />
      {/* Collar of shirt */}
      <path d="M 35 82 Q 50 78 65 82 L 60 94 L 50 90 L 40 94 Z" fill="#CC3322" />
      {/* Neck */}
      <rect x="43" y="72" width="14" height="14" rx="6" fill="url(#hi-skin)" />
      {/* Curly hair - big poofy */}
      <circle cx="50" cy="30" r="24" fill="#7A3A10" />
      <circle cx="30" cy="38" r="14" fill="#7A3A10" />
      <circle cx="70" cy="38" r="14" fill="#7A3A10" />
      <circle cx="40" cy="24" r="12" fill="#7A3A10" />
      <circle cx="60" cy="24" r="12" fill="#7A3A10" />
      {/* Hair highlights */}
      <circle cx="36" cy="22" r="5" fill="#8B4A1A" opacity="0.7" />
      <circle cx="64" cy="20" r="4" fill="#8B4A1A" opacity="0.7" />
      <circle cx="50" cy="16" r="6" fill="#8B4A1A" opacity="0.6" />
      {/* Head - round and chubby */}
      <ellipse cx="50" cy="54" rx="24" ry="26" fill="url(#hi-skin)" />
      {/* Rosy cheeks */}
      <ellipse cx="35" cy="60" rx="8" ry="5" fill="#E06080" opacity="0.35" />
      <ellipse cx="65" cy="60" rx="8" ry="5" fill="#E06080" opacity="0.35" />
      {/* Round ears */}
      <circle cx="26" cy="56" r="8" fill="#D4A060" />
      <circle cx="74" cy="56" r="8" fill="#D4A060" />
      {/* Eyebrows - friendly arched */}
      <path d="M 33 44 Q 40 40 47 43" stroke="#5A2A08" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M 53 43 Q 60 40 67 44" stroke="#5A2A08" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      {/* Green eyes - warm */}
      <ellipse cx="40" cy="52" rx="6.5" ry="6" fill="#44AA22" />
      <ellipse cx="60" cy="52" rx="6.5" ry="6" fill="#44AA22" />
      <ellipse cx="40" cy="52" rx="4" ry="5" fill="#2A7A10" />
      <ellipse cx="60" cy="52" rx="4" ry="5" fill="#2A7A10" />
      <circle cx="40" cy="52" r="2" fill="#0A1A04" />
      <circle cx="60" cy="52" r="2" fill="#0A1A04" />
      <circle cx="41" cy="50" r="1.5" fill="#AADD88" opacity="0.9" />
      <circle cx="61" cy="50" r="1.5" fill="#AADD88" opacity="0.9" />
      {/* Nose - little button */}
      <ellipse cx="50" cy="60" rx="4" ry="3" fill="#C4844A" />
      <circle cx="48" cy="61" r="1.5" fill="#AA6A30" opacity="0.7" />
      <circle cx="52" cy="61" r="1.5" fill="#AA6A30" opacity="0.7" />
      {/* Big warm smile */}
      <path d="M 35 67 Q 50 78 65 67" stroke="#7A3A18" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M 37 68 Q 50 76 63 68 Q 50 80 37 68 Z" fill="#CC6644" opacity="0.7" />
      {/* Dimples */}
      <circle cx="37" cy="68" r="2" fill="#C07040" opacity="0.5" />
      <circle cx="63" cy="68" r="2" fill="#C07040" opacity="0.5" />
    </svg>
  );
}

function RivalDragon({ breedId }: { breedId?: string }) {
  const p = DRAGON_PALETTES[breedId ?? 'fire'] ?? DRAGON_PALETTES.fire;
  const bid = breedId ?? 'fire';
  return (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id={`rd-bg-${bid}`} cx="50%" cy="50%" r="65%">
          <stop offset="0%" stopColor={p.bgFrom} />
          <stop offset="100%" stopColor={p.bgTo} />
        </radialGradient>
        <radialGradient id={`rd-scale-${bid}`} cx="40%" cy="30%" r="65%">
          <stop offset="0%" stopColor={p.scaleFrom} />
          <stop offset="100%" stopColor={p.scaleTo} />
        </radialGradient>
        <radialGradient id={`rd-glow-${bid}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={p.glowColor} stopOpacity="0.4" />
          <stop offset="100%" stopColor={p.glowOuter} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="100" height="100" fill={`url(#rd-bg-${bid})`} />
      {/* Glow aura */}
      <ellipse cx="50" cy="55" rx="42" ry="38" fill={`url(#rd-glow-${bid})`} />
      {/* Wing suggestions at sides */}
      <path d="M 4 50 Q 8 30 20 40 Q 12 55 14 70 Z" fill={p.wingFill} opacity="0.7" />
      <path d="M 96 50 Q 92 30 80 40 Q 88 55 86 70 Z" fill={p.wingFill} opacity="0.7" />
      {/* Wing membrane texture */}
      <path d="M 8 48 L 18 42 M 9 56 L 19 50 M 10 64 L 20 58" stroke={p.wingStroke} strokeWidth="1" opacity="0.5" />
      <path d="M 92 48 L 82 42 M 91 56 L 81 50 M 90 64 L 80 58" stroke={p.wingStroke} strokeWidth="1" opacity="0.5" />
      {/* Neck / body */}
      <ellipse cx="50" cy="100" rx="32" ry="22" fill={p.bodyDark} />
      <ellipse cx="50" cy="96" rx="24" ry="16" fill={p.bodyMid} />
      {/* Neck scales */}
      {[44, 50, 56].map((x, i) => <ellipse key={i} cx={x} cy={80 + i * 3} rx="5" ry="3" fill={p.neckScale} opacity="0.5" />)}
      {/* Horns */}
      <path d="M 30 22 Q 22 4 26 14 Q 28 8 32 18" fill={p.hornFill} />
      <path d="M 70 22 Q 78 4 74 14 Q 72 8 68 18" fill={p.hornFill} />
      {/* Horn highlights */}
      <path d="M 29 18 Q 24 8 27 14" stroke={p.hornStroke} strokeWidth="1" fill="none" />
      <path d="M 71 18 Q 76 8 73 14" stroke={p.hornStroke} strokeWidth="1" fill="none" />
      {/* Head - wide draconic */}
      <path d="M 20 44 Q 20 20 50 16 Q 80 20 80 44 Q 80 72 50 76 Q 20 72 20 44 Z" fill={`url(#rd-scale-${bid})`} />
      {/* Scale texture on face */}
      {[
        [30,32],[40,26],[50,24],[60,26],[70,32],
        [24,42],[34,36],[44,32],[56,32],[66,36],[76,42],
        [26,52],[36,46],[46,42],[54,42],[64,46],[74,52],
        [30,62],[40,56],[50,54],[60,56],[70,62],
      ].map(([x,y],i) => (
        <path key={i} d={`M ${x-3} ${y} Q ${x} ${y-4} ${x+3} ${y} Q ${x} ${y+2} ${x-3} ${y} Z`} fill={p.scaleTex} opacity="0.45" />
      ))}
      {/* Brow ridges */}
      <path d="M 22 40 Q 34 30 46 38" stroke={p.browColor} strokeWidth="5" fill="none" strokeLinecap="round" />
      <path d="M 54 38 Q 66 30 78 40" stroke={p.browColor} strokeWidth="5" fill="none" strokeLinecap="round" />
      {/* Slit eyes */}
      <ellipse cx="37" cy="46" rx="9" ry="7" fill={p.eyeOuter} />
      <ellipse cx="63" cy="46" rx="9" ry="7" fill={p.eyeOuter} />
      <ellipse cx="37" cy="46" rx="6" ry="6" fill={p.eyeInner} />
      <ellipse cx="63" cy="46" rx="6" ry="6" fill={p.eyeInner} />
      {/* Vertical slit pupils */}
      <ellipse cx="37" cy="46" rx="2" ry="6" fill="#0A0000" />
      <ellipse cx="63" cy="46" rx="2" ry="6" fill="#0A0000" />
      {/* Eye shine */}
      <circle cx="39" cy="43" r="2" fill="#FFFFAA" opacity="0.8" />
      <circle cx="65" cy="43" r="2" fill="#FFFFAA" opacity="0.8" />
      {/* Snout */}
      <path d="M 34 58 Q 50 68 66 58 Q 62 74 50 78 Q 38 74 34 58 Z" fill={p.snout} />
      {/* Nostrils - smoking slightly */}
      <ellipse cx="44" cy="62" rx="4" ry="3" fill={p.nostril} />
      <ellipse cx="56" cy="62" rx="4" ry="3" fill={p.nostril} />
      <path d="M 43 60 Q 42 56 44 54" stroke={p.smokeColor} strokeWidth="1.5" fill="none" opacity="0.6" />
      <path d="M 57 60 Q 58 56 56 54" stroke={p.smokeColor} strokeWidth="1.5" fill="none" opacity="0.6" />
      {/* Fanged grin */}
      <path d="M 37 68 Q 50 74 63 68" stroke={p.mouthLine} strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M 38 69 Q 50 73 62 69 Q 50 78 38 69 Z" fill={p.mouthFill} opacity="0.8" />
      {/* Fangs */}
      <polygon points="42,70 45,70 43.5,78" fill="#F0E8D8" />
      <polygon points="55,70 58,70 56.5,78" fill="#F0E8D8" />
      <polygon points="47,71 50,71 48.5,77" fill="#F0E8D8" />
      <polygon points="50,71 53,71 51.5,77" fill="#F0E8D8" />
    </svg>
  );
}

const PORTRAIT_COMPONENTS: Record<Exclude<NPCRole, 'rival-dragon'>, () => React.ReactElement> = {
  'goblin-realtor': GoblinRealtor,
  'gnoll-agency': GnollAgency,
  'dragonborn-banker': DragonbornBanker,
  'elven-lawyer': ElvenLawyer,
  'halfling-innkeeper': HalflingInnkeeper,
};

export default function NPCPortrait({ role, size = 96, breedId }: Props) {
  return (
    <div
      style={{
        width: size,
        height: size,
        border: '2px solid #2C1810',
        borderRadius: 6,
        boxShadow: '0 4px 16px rgba(0,0,0,0.7), inset 0 0 12px rgba(0,0,0,0.4)',
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      {role === 'rival-dragon'
        ? <RivalDragon breedId={breedId} />
        : React.createElement(PORTRAIT_COMPONENTS[role])
      }
    </div>
  );
}
