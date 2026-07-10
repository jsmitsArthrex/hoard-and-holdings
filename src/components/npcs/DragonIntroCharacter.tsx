import React from 'react';

interface Props {
  size?: number;
}

export default function DragonIntroCharacter({ size = 220 }: Props) {
  return (
    <svg
      width={size}
      height={Math.round(size * 0.95)}
      viewBox="0 0 200 190"
      xmlns="http://www.w3.org/2000/svg"
      style={{ overflow: 'visible', display: 'block' }}
    >
      <defs>
        <radialGradient id="dic-scale" cx="40%" cy="30%" r="65%">
          <stop offset="0%" stopColor="#FFB830" />
          <stop offset="100%" stopColor="#8A4A08" />
        </radialGradient>
        <radialGradient id="dic-belly" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor="#FFD878" />
          <stop offset="100%" stopColor="#D08018" />
        </radialGradient>
        <radialGradient id="dic-wing" cx="25%" cy="20%" r="72%">
          <stop offset="0%" stopColor="#CC7420" />
          <stop offset="100%" stopColor="#5A2608" />
        </radialGradient>
        <filter id="dic-glow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="3" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Pulsing ground glow */}
      <ellipse cx="96" cy="183" rx="54" ry="7" fill="#FF7700" opacity="0.18">
        <animate attributeName="rx" values="48;60;48" dur="3s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.12;0.24;0.12" dur="3s" repeatCount="indefinite" />
      </ellipse>

      {/* Full dragon — gentle float */}
      <g>
        <animateTransform attributeName="transform" type="translate"
          values="0,0; 0,-7; 0,0" dur="3s" repeatCount="indefinite"
          calcMode="spline" keySplines="0.45 0.05 0.55 0.95;0.45 0.05 0.55 0.95" />

        {/* Wings behind body — lazy flap */}
        <g>
          <animateTransform attributeName="transform" type="rotate"
            values="-9,96,106; 4,96,106; -9,96,106" dur="2s" repeatCount="indefinite"
            calcMode="spline" keySplines="0.45 0.05 0.55 0.95;0.45 0.05 0.55 0.95" />
          {/* Left wing membrane */}
          <path d="M 90 108 Q 66 86 46 58 Q 60 80 72 94 Q 54 72 56 48 Q 68 76 78 90 Q 64 64 74 42 Q 82 70 86 88 Q 76 60 92 44 Q 92 72 90 90" fill="url(#dic-wing)" opacity="0.85" />
          <line x1="90" y1="108" x2="46" y2="58" stroke="#5A2608" strokeWidth="1.5" opacity="0.55" />
          <line x1="90" y1="108" x2="56" y2="48" stroke="#5A2608" strokeWidth="1.5" opacity="0.55" />
          <line x1="90" y1="108" x2="74" y2="42" stroke="#5A2608" strokeWidth="1.5" opacity="0.55" />
          <line x1="90" y1="108" x2="92" y2="44" stroke="#5A2608" strokeWidth="1.5" opacity="0.55" />
          {/* Right wing (mostly behind body) */}
          <path d="M 108 108 Q 132 82 150 56 Q 136 76 124 90 Q 144 70 142 46 Q 130 72 120 88 Q 136 62 126 40 Q 116 66 112 86" fill="url(#dic-wing)" opacity="0.62" />
          <line x1="108" y1="108" x2="150" y2="56" stroke="#5A2608" strokeWidth="1.5" opacity="0.38" />
          <line x1="108" y1="108" x2="142" y2="46" stroke="#5A2608" strokeWidth="1.5" opacity="0.38" />
          <line x1="108" y1="108" x2="126" y2="40" stroke="#5A2608" strokeWidth="1.5" opacity="0.38" />
        </g>

        {/* Tail — lazy sway */}
        <g>
          <animateTransform attributeName="transform" type="rotate"
            values="-5,122,136; 6,122,136; -5,122,136" dur="2.5s" repeatCount="indefinite"
            calcMode="spline" keySplines="0.45 0.05 0.55 0.95;0.45 0.05 0.55 0.95" />
          <path d="M 122 136 Q 152 128 166 116 Q 180 106 174 94 Q 170 88 164 92" fill="#C07818" stroke="#8A4A08" strokeWidth="1.5" strokeLinejoin="round" />
          <polygon points="161,90 169,86 167,97 161,94" fill="#8A4A08" />
        </g>

        {/* Body */}
        <ellipse cx="96" cy="130" rx="46" ry="29" fill="url(#dic-scale)" />
        {/* Belly plates */}
        <ellipse cx="90" cy="136" rx="30" ry="19" fill="url(#dic-belly)" opacity="0.7" />
        {/* Scale texture */}
        {([
          [82,117],[94,115],[106,117],[116,120],
          [78,126],[90,123],[102,123],[113,126],[122,129],
          [82,135],[94,132],[105,133],[115,137],
        ] as [number,number][]).map(([x,y],i) => (
          <path key={i} d={`M${x-4},${y} Q${x},${y-4} ${x+4},${y} Q${x},${y+2} Z`} fill="#7A3A08" opacity="0.2" />
        ))}

        {/* Dorsal spines */}
        <path d="M 82 100 L 77 86 M 91 97 L 88 83 M 100 96 L 99 81 M 108 97 L 109 83" stroke="#8A4A08" strokeWidth="2.5" strokeLinecap="round" />

        {/* Front left leg + claws */}
        <path d="M 72 148 Q 66 158 62 167" stroke="#B06A14" strokeWidth="10" fill="none" strokeLinecap="round" />
        <path d="M 72 148 Q 66 158 62 167" stroke="#D4891A" strokeWidth="7" fill="none" strokeLinecap="round" />
        <line x1="58" y1="167" x2="54" y2="174" stroke="#6A3008" strokeWidth="2" strokeLinecap="round" />
        <line x1="62" y1="168" x2="60" y2="175" stroke="#6A3008" strokeWidth="2" strokeLinecap="round" />
        <line x1="66" y1="167" x2="66" y2="174" stroke="#6A3008" strokeWidth="2" strokeLinecap="round" />

        {/* Front right leg + claws */}
        <path d="M 96 150 Q 92 160 90 168" stroke="#B06A14" strokeWidth="10" fill="none" strokeLinecap="round" />
        <path d="M 96 150 Q 92 160 90 168" stroke="#D4891A" strokeWidth="7" fill="none" strokeLinecap="round" />
        <line x1="86" y1="168" x2="83" y2="175" stroke="#6A3008" strokeWidth="2" strokeLinecap="round" />
        <line x1="90" y1="169" x2="90" y2="176" stroke="#6A3008" strokeWidth="2" strokeLinecap="round" />
        <line x1="94" y1="168" x2="96" y2="175" stroke="#6A3008" strokeWidth="2" strokeLinecap="round" />

        {/* Neck — triple-layer for volume */}
        <path d="M 74 110 Q 64 98 60 85 Q 57 74 60 66" stroke="#B06A14" strokeWidth="20" fill="none" strokeLinecap="round" />
        <path d="M 74 110 Q 64 98 60 85 Q 57 74 60 66" stroke="#D4891A" strokeWidth="15" fill="none" strokeLinecap="round" />
        <path d="M 74 110 Q 64 98 60 85 Q 57 74 60 66" stroke="#FFD060" strokeWidth="7" fill="none" strokeLinecap="round" opacity="0.3" />
        <path d="M 70 107 Q 61 96 58 83" stroke="#8A4A08" strokeWidth="2" fill="none" opacity="0.35" />

        {/* Head */}
        <ellipse cx="57" cy="61" rx="27" ry="22" fill="url(#dic-scale)" />
        <ellipse cx="52" cy="67" rx="19" ry="14" fill="url(#dic-belly)" opacity="0.65" />

        {/* Horns */}
        <path d="M 48 41 Q 41 24 45 35" fill="#6A3008" stroke="#4A1E06" strokeWidth="0.5" />
        <path d="M 66 39 Q 65 20 68 32" fill="#6A3008" stroke="#4A1E06" strokeWidth="0.5" />
        <path d="M 47 37 Q 43 26 45 33" stroke="#9A5A18" strokeWidth="1.2" fill="none" opacity="0.6" />
        <path d="M 65 35 Q 65 24 67 30" stroke="#9A5A18" strokeWidth="1.2" fill="none" opacity="0.6" />

        {/* Snout */}
        <path d="M 33 65 Q 26 67 23 71 Q 26 77 33 75 Q 37 79 46 76" fill="#C07818" />
        <ellipse cx="28" cy="71" rx="2.5" ry="1.5" fill="#7A3808" />
        {/* Nostril wisp */}
        <path d="M 28 69 Q 26 63 28 60" stroke="#FF8830" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.35">
          <animate attributeName="opacity" values="0.15;0.5;0.15" dur="2.4s" repeatCount="indefinite" />
          <animate attributeName="d" values="M 28 69 Q 26 63 28 60;M 28 69 Q 27 62 29 59;M 28 69 Q 26 63 28 60" dur="2.4s" repeatCount="indefinite" />
        </path>

        {/* Brow ridge */}
        <path d="M 36 52 Q 46 47 58 51" stroke="#6A3008" strokeWidth="3.5" fill="none" strokeLinecap="round" />

        {/* Eye — glow + pulse */}
        <circle cx="45" cy="57" r="10" fill="#FFEE22" filter="url(#dic-glow)">
          <animate attributeName="r" values="9;10.5;9" dur="2s" repeatCount="indefinite" />
        </circle>
        <circle cx="45" cy="57" r="7" fill="#FFA800" />
        <ellipse cx="45" cy="57" rx="2.5" ry="6.5" fill="#0A0300" />
        <circle cx="48" cy="54" r="2.2" fill="#FFFFC0" opacity="0.95">
          <animate attributeName="opacity" values="0.7;1;0.7" dur="2s" repeatCount="indefinite" />
        </circle>
        {/* Blink — eyelid descends every ~7s */}
        <ellipse cx="45" cy="57" rx="10" ry="1" fill="#C07818" opacity="0">
          <animate attributeName="ry"
            values="1;1;1;1;1;1;1;10;1;1"
            keyTimes="0;0.55;0.62;0.68;0.74;0.8;0.86;0.91;0.96;1"
            dur="7s" repeatCount="indefinite" />
          <animate attributeName="opacity"
            values="0;0;0;0;0;0;0;1;0;0"
            keyTimes="0;0.55;0.62;0.68;0.74;0.8;0.86;0.91;0.96;1"
            dur="7s" repeatCount="indefinite" />
        </ellipse>
      </g>
    </svg>
  );
}
