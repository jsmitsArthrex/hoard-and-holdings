import { useState, useEffect } from 'react';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import KoboldAvatar from '../components/npcs/KoboldAvatar';
import { useGameStore } from '../store/gameStore';
import { playSound } from '../audio/audioEngine';
import { koboldWages } from '../data/koboldWages';
import {
  randomKoboldName, KOBOLD_ROLES, KOBOLD_SPECIES_LIST,
  KOBOLD_ROLE_LABELS, KOBOLD_SPECIES_LABELS, KOBOLD_SPECIES_COLORS,
} from '../engine/gameClock';
import type { KoboldEmployee, KoboldRole, KoboldSpecies } from '../types';
import type { KoboldTier } from '../data/koboldWages';

const INK = '#2C1810';
const PARCHMENT = '#C4934A';
const GOLD = '#C9A227';

const AGENCY_LINES = [
  "Welcome to Leliana's Labour Exchange! All kobolds are background-checked. Mostly.",
  "Fresh stock just in! These lads are eager, willing, and only slightly afraid of everything.",
  "Today's roster includes some real gems. Well, one gem. The others are... enthusiastic.",
  "Supply's tight since the last adventurer incursion. Kobolds have been in high demand. Survival instinct, you understand.",
];

function generateKoboldPool(): KoboldEmployee[] {
  const count = 3 + Math.floor(Math.random() * 3);
  const tiers: KoboldTier[] = ['basic', 'standard', 'standard', 'skilled', 'elite'];
  return Array.from({ length: count }, (_, i) => {
    const tier = tiers[Math.floor(Math.random() * tiers.length)];
    const wageEntry = koboldWages.find(w => w.tier === tier)!;
    const species = KOBOLD_SPECIES_LIST[Math.floor(Math.random() * KOBOLD_SPECIES_LIST.length)] as KoboldSpecies;
    const role = KOBOLD_ROLES[Math.floor(Math.random() * KOBOLD_ROLES.length)] as KoboldRole;
    return {
      id: `k-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 7)}`,
      name: randomKoboldName(),
      species,
      role,
      tier,
      dailyWage: wageEntry.dailyWage,
      morale: 60 + Math.floor(Math.random() * 40),
      loyalty: 50 + Math.floor(Math.random() * 50),
      daysEmployed: 0,
    };
  });
}

const TIER_COLORS: Record<KoboldTier, string> = {
  basic: '#8A8A6A',
  standard: '#4A8A4A',
  skilled: '#4A6ACC',
  elite: '#8A2ACC',
};

const TIER_LABELS: Record<KoboldTier, string> = {
  basic: 'Basic',
  standard: 'Standard',
  skilled: 'Skilled',
  elite: 'Elite',
};

export default function KoboldAgencyScreen() {
  const { gold, playerPropertyIds, setActiveScreen, hireKobold, kobolds } = useGameStore();
  const [pool, setPool] = useState<KoboldEmployee[]>(() => generateKoboldPool());
  const [hired, setHired] = useState<Set<string>>(new Set());
  const [agencyLine] = useState(AGENCY_LINES[Math.floor(Math.random() * AGENCY_LINES.length)]);

  const hasLair = playerPropertyIds.length > 0;
  const currentGold = gold;

  const doHire = (kobold: KoboldEmployee) => {
    if (currentGold < kobold.dailyWage) return;
    playSound('koboldCheer');
    hireKobold(kobold);
    setHired(prev => new Set([...prev, kobold.id]));
  };

  const refresh = () => {
    setPool(generateKoboldPool());
    setHired(new Set());
  };

  return (
    <div style={{ height: '100%', overflowY: 'auto', fontFamily: '"Crimson Text", Georgia, serif', background: '#0D0500' }}>
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '20px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <button
            onClick={() => setActiveScreen('hub')}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'none', border: 'none', color: PARCHMENT, cursor: 'pointer',
              fontFamily: '"Cinzel", serif', fontSize: 17, padding: 0,
            }}
          >
            <ArrowLeft size={19} /> Return to Lair
          </button>
          <button
            onClick={refresh}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px',
              background: '#2C181040', border: `1px solid ${PARCHMENT}30`,
              borderRadius: 4, color: PARCHMENT, cursor: 'pointer', fontSize: 17,
            }}
          >
            <RefreshCw size={18} /> New Batch
          </button>
        </div>

        {/* Agency header */}
        <div style={{
          background: '#2C181040', border: `2px solid ${PARCHMENT}30`, borderRadius: 8,
          padding: '16px 20px', marginBottom: 20, display: 'flex', gap: 16, alignItems: 'center',
        }}>
          <div style={{ fontSize: 40 }}>🧑‍🤝‍🧑</div>
          <div>
            <div style={{ fontFamily: '"Cinzel", serif', fontWeight: 700, color: PARCHMENT, fontSize: 20 }}>
              Leliana's Labour Exchange
            </div>
            <div style={{ fontSize: 19, color: '#C4934A80', fontStyle: 'italic', marginTop: 2 }}>
              "{agencyLine}"
            </div>
          </div>
        </div>

        {!hasLair && (
          <div style={{
            background: '#CC882220', border: '1px solid #CC882250',
            borderRadius: 6, padding: '10px 14px', marginBottom: 16,
            fontSize: 18, color: '#CC9944',
          }}>
            ⚠️ <strong>Working from the Motel</strong> — kobold income reduced 50% until you own a lair.
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center' }}>
          <div style={{ fontSize: 18, color: '#C4934A80' }}>
            Your roster: {kobolds.length} kobolds &nbsp;·&nbsp; Gold: 🪙 {currentGold}
          </div>
        </div>

        {/* Kobold cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {pool.map(kobold => {
            const isHired = hired.has(kobold.id);
            const canAfford = currentGold >= kobold.dailyWage && !isHired;
            const grossIncome = kobold.dailyWage * 2 * (hasLair ? 1 : 0.5);
            const netPerDay = grossIncome - kobold.dailyWage;

            return (
              <div
                key={kobold.id}
                style={{
                  background: isHired ? '#4ACC7A10' : '#2C181030',
                  border: `2px solid ${isHired ? '#4ACC7A40' : PARCHMENT + '25'}`,
                  borderRadius: 8, padding: '16px',
                  display: 'flex', alignItems: 'center', gap: 16,
                  opacity: isHired ? 0.7 : 1,
                }}
              >
                <KoboldAvatar species={kobold.species} size={48} />

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                    <span style={{ fontFamily: '"Cinzel", serif', fontWeight: 700, color: PARCHMENT, fontSize: 20 }}>
                      {kobold.name}
                    </span>
                    <span style={{
                      padding: '1px 7px', borderRadius: 10, fontSize: 16,
                      background: TIER_COLORS[kobold.tier] + '30',
                      border: `1px solid ${TIER_COLORS[kobold.tier]}`,
                      color: TIER_COLORS[kobold.tier],
                    }}>
                      {TIER_LABELS[kobold.tier]}
                    </span>
                  </div>
                  <div style={{ fontSize: 18, color: '#C4934A80', marginBottom: 6 }}>
                    {KOBOLD_SPECIES_LABELS[kobold.species]} kobold · {KOBOLD_ROLE_LABELS[kobold.role]}
                  </div>
                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                    <MiniStat label="Morale" value={kobold.morale} max={100} color='#4ACC7A' />
                    <MiniStat label="Loyalty" value={kobold.loyalty} max={100} color='#4A6ACC' />
                  </div>
                </div>

                {/* Wage + hire */}
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontFamily: '"Cinzel", serif', fontWeight: 700, color: GOLD, fontSize: 21, marginBottom: 2 }}>
                    🪙 {kobold.dailyWage}/day
                  </div>
                  <div style={{ fontSize: 16, color: netPerDay >= 0 ? '#4ACC7A' : '#CC4444', marginBottom: 8 }}>
                    Net: {netPerDay >= 0 ? '+' : ''}{Math.round(netPerDay * 10) / 10}/day
                  </div>
                  <button
                    onClick={() => doHire(kobold)}
                    disabled={!canAfford}
                    style={{
                      padding: '8px 16px',
                      background: isHired ? '#4ACC7A30' : canAfford ? GOLD : '#2C181040',
                      border: `1px solid ${isHired ? '#4ACC7A' : canAfford ? INK : PARCHMENT + '20'}`,
                      borderRadius: 4, color: isHired ? '#4ACC7A' : canAfford ? INK : '#C4934A40',
                      fontFamily: '"Cinzel", serif', fontWeight: 700, fontSize: 17,
                      cursor: canAfford && !isHired ? 'pointer' : 'not-allowed',
                    }}
                  >
                    {isHired ? '✓ Hired!' : canAfford ? 'Hire' : 'Can\'t afford'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function MiniStat({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 80 }}>
      <div style={{ fontSize: 16, color: '#C4934A60' }}>{label}: {value}</div>
      <div style={{ height: 4, background: '#2C181060', borderRadius: 2, overflow: 'hidden', width: 80 }}>
        <div style={{ width: `${(value / max) * 100}%`, height: '100%', background: color, borderRadius: 2 }} />
      </div>
    </div>
  );
}
