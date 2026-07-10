import React from 'react';
import type { KoboldSpecies } from '../../types';

interface Props {
  species: KoboldSpecies;
  size?: number;
}

const SPECIES_CONFIG: Record<KoboldSpecies, { bg: string; scale: string; scaleShade: string; eye: string; accent: string }> = {
  red:    { bg: '#2A0808', scale: '#CC3310', scaleShade: '#881A08', eye: '#FFDD00', accent: '#FF6622' },
  blue:   { bg: '#08102A', scale: '#2244CC', scaleShade: '#0A1E88', eye: '#44EEFF', accent: '#6688FF' },
  green:  { bg: '#081A08', scale: '#226622', scaleShade: '#103A10', eye: '#AAFFAA', accent: '#44AA44' },
  purple: { bg: '#180828', scale: '#7722CC', scaleShade: '#440A88', eye: '#FFAAFF', accent: '#BB66FF' },
  white:  { bg: '#181820', scale: '#C8C8D8', scaleShade: '#9090AA', eye: '#88DDFF', accent: '#E8E8F8' },
};

export default function KoboldAvatar({ species, size = 48 }: Props) {
  const c = SPECIES_CONFIG[species];
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}>
      <svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" width={size} height={size}>
        {/* Background */}
        <circle cx="24" cy="24" r="24" fill={c.bg} />
        {/* Glow */}
        <circle cx="24" cy="28" r="18" fill={c.scale} opacity="0.18" />
        {/* Body / shoulders */}
        <ellipse cx="24" cy="52" rx="18" ry="14" fill={c.scaleShade} />
        <ellipse cx="24" cy="48" rx="14" ry="10" fill={c.scale} opacity="0.6" />
        {/* Neck */}
        <rect x="20" y="36" width="8" height="6" rx="3" fill={c.scale} />
        {/* Head */}
        <ellipse cx="24" cy="26" rx="12" ry="13" fill={c.scale} />
        {/* Scale texture */}
        <ellipse cx="19" cy="22" rx="2.5" ry="2" fill={c.scaleShade} opacity="0.55" />
        <ellipse cx="24" cy="20" rx="2.5" ry="2" fill={c.scaleShade} opacity="0.55" />
        <ellipse cx="29" cy="22" rx="2.5" ry="2" fill={c.scaleShade} opacity="0.55" />
        <ellipse cx="18" cy="28" rx="2" ry="1.5" fill={c.scaleShade} opacity="0.4" />
        <ellipse cx="30" cy="28" rx="2" ry="1.5" fill={c.scaleShade} opacity="0.4" />
        {/* Snout */}
        <ellipse cx="24" cy="31" rx="5" ry="4" fill={c.scaleShade} />
        <ellipse cx="22" cy="32" rx="1.5" ry="1" fill={c.bg} opacity="0.7" />
        <ellipse cx="26" cy="32" rx="1.5" ry="1" fill={c.bg} opacity="0.7" />
        {/* Horns / ear spines */}
        <path d="M 14 18 Q 10 8 13 14" fill={c.scaleShade} stroke={c.scaleShade} strokeWidth="1" />
        <path d="M 34 18 Q 38 8 35 14" fill={c.scaleShade} stroke={c.scaleShade} strokeWidth="1" />
        {/* Frill / dorsal */}
        <path d="M 17 16 Q 14 10 17 13 Q 20 8 21 14" fill={c.accent} opacity="0.6" />
        <path d="M 31 16 Q 34 10 31 13 Q 28 8 27 14" fill={c.accent} opacity="0.6" />
        {/* Eyes */}
        <ellipse cx="20" cy="24" rx="3.5" ry="3" fill={c.eye} />
        <ellipse cx="28" cy="24" rx="3.5" ry="3" fill={c.eye} />
        <ellipse cx="20" cy="24" rx="2" ry="2.5" fill="#0A0A0A" />
        <ellipse cx="28" cy="24" rx="2" ry="2.5" fill="#0A0A0A" />
        <circle cx="21" cy="23" r="1" fill="white" opacity="0.7" />
        <circle cx="29" cy="23" r="1" fill="white" opacity="0.7" />
        {/* Mouth - small grin */}
        <path d="M 21 33 Q 24 36 27 33" stroke={c.scaleShade} strokeWidth="1.2" fill="none" strokeLinecap="round" />
      </svg>
    </div>
  );
}
