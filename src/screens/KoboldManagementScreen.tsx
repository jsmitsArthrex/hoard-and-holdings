import { useState } from 'react';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import KoboldAvatar from '../components/npcs/KoboldAvatar';
import { KOBOLD_ROLE_LABELS, KOBOLD_ROLES, KOBOLD_SPECIES_LABELS } from '../engine/gameClock';
import type { KoboldRole, KoboldTrait } from '../types';
import type { KoboldTier } from '../data/koboldWages';

const INK = '#2C1810';
const PARCHMENT = '#C4934A';
const GOLD = '#C9A227';

const TIER_COLORS: Record<KoboldTier, string> = {
  basic: '#8A8A6A',
  standard: '#4A8A4A',
  skilled: '#4A6ACC',
  elite: '#8A2ACC',
};

function MoraleBar({ value }: { value: number }) {
  const color = value < 30 ? '#CC4444' : value < 60 ? '#CC8844' : '#4ACC7A';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ width: 60, height: 6, background: '#2C181060', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${value}%`, height: '100%', background: color, borderRadius: 3 }} />
      </div>
      <span style={{ fontSize: 16, color, minWidth: 24 }}>{value}</span>
    </div>
  );
}

function LoyaltyBar({ value }: { value: number }) {
  const color = value < 30 ? '#CC4444' : value < 60 ? '#4A6ACC' : '#4A8ACC';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ width: 60, height: 6, background: '#2C181060', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${value}%`, height: '100%', background: color, borderRadius: 3 }} />
      </div>
      <span style={{ fontSize: 16, color, minWidth: 24 }}>{value}</span>
    </div>
  );
}

export default function KoboldManagementScreen() {
  const { kobolds, playerPropertyIds, gold, setActiveScreen, dismissKobold, changeKoboldRole } = useGameStore();

  const hasLair = playerPropertyIds.length > 0;
  const lowMorale = kobolds.filter(k => k.morale < 30);

  const totalGrossIncome = kobolds.reduce((sum, k) => {
    const gross = k.dailyWage * 2 * (hasLair ? 1 : 0.5);
    return sum + gross;
  }, 0);
  const totalWages = kobolds.reduce((sum, k) => sum + k.dailyWage, 0);
  const netPerDay = Math.round(totalGrossIncome - totalWages);

  return (
    <div style={{ height: '100%', overflowY: 'auto', fontFamily: '"Crimson Text", Georgia, serif', background: '#0D0500' }}>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '20px' }}>

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
          <h2 style={{ fontFamily: '"Cinzel", serif', color: PARCHMENT, fontSize: 20, fontWeight: 700, margin: 0 }}>
            Colony Management
          </h2>
        </div>

        {/* Low morale warning */}
        {lowMorale.length > 0 && (
          <div style={{
            background: '#CC222220', border: '1px solid #CC222250',
            borderRadius: 6, padding: '10px 14px', marginBottom: 16,
            display: 'flex', alignItems: 'center', gap: 8, fontSize: 18, color: '#CC6666',
          }}>
            <AlertTriangle size={21} />
            <strong>Low Morale Warning:</strong>{' '}
            {lowMorale.map(k => k.name).join(', ')} {lowMorale.length === 1 ? 'is' : 'are'} unhappy.
            Consider dismissing or reassigning.
          </div>
        )}

        {/* Summary row */}
        <div style={{
          background: '#2C181040', border: `1px solid ${PARCHMENT}30`,
          borderRadius: 8, padding: '14px 20px', marginBottom: 20,
          display: 'flex', gap: 32, flexWrap: 'wrap',
        }}>
          <SummaryItem label="Kobolds" value={String(kobolds.length)} />
          <SummaryItem label="Daily Income" value={`+${Math.round(totalGrossIncome)} gold`} color='#4ACC7A' />
          <SummaryItem label="Daily Wages" value={`−${totalWages} gold`} color='#CC4444' />
          <SummaryItem
            label="Net Per Day"
            value={`${netPerDay >= 0 ? '+' : ''}${netPerDay} gold`}
            color={netPerDay >= 0 ? GOLD : '#CC4444'}
            bold
          />
          {!hasLair && (
            <div style={{ fontSize: 17, color: '#CC8844', alignSelf: 'center', fontStyle: 'italic' }}>
              ⚠️ Motel penalty (×0.5 income)
            </div>
          )}
        </div>

        {kobolds.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '60px 20px',
            color: '#C4934A40', fontStyle: 'italic', fontSize: 21,
          }}>
            No kobolds in your colony yet.<br />
            <span style={{ fontSize: 18 }}>Visit the Kobold Agency in the morning to hire workers.</span>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 18 }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${PARCHMENT}30` }}>
                  {['Kobold', 'Species', 'Role', 'Morale', 'Loyalty', 'Wage/day', ''].map(h => (
                    <th key={h} style={{
                      padding: '8px 10px', textAlign: 'left',
                      fontFamily: '"Cinzel", serif', fontSize: 16,
                      color: '#C4934A80', fontWeight: 700, letterSpacing: 0.5,
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {kobolds.map(k => (
                  <tr
                    key={k.id}
                    style={{
                      borderBottom: `1px solid ${PARCHMENT}15`,
                      background: k.morale < 30 ? '#CC222210' : 'transparent',
                    }}
                  >
                    <td style={{ padding: '10px 10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <KoboldAvatar species={k.species} size={28} />
                        <div>
                          <div style={{ color: PARCHMENT, fontWeight: 700, fontSize: 18 }}>{k.name}</div>
                          <div style={{
                            fontSize: 15, color: TIER_COLORS[k.tier],
                            padding: '1px 5px', display: 'inline-block',
                          }}>
                            {k.tier}
                          </div>
                          {k.trait && <TraitBadge trait={k.trait} />}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '10px 10px', color: '#C4934A80' }}>
                      {KOBOLD_SPECIES_LABELS[k.species]}
                    </td>
                    <td style={{ padding: '10px 10px' }}>
                      <select
                        value={k.role}
                        onChange={e => changeKoboldRole(k.id, e.target.value as KoboldRole)}
                        style={{
                          background: '#2C181060', border: `1px solid ${PARCHMENT}30`,
                          borderRadius: 4, color: PARCHMENT, fontSize: 17, padding: '4px 6px',
                          cursor: 'pointer',
                        }}
                      >
                        {KOBOLD_ROLES.map(r => (
                          <option key={r} value={r}>{KOBOLD_ROLE_LABELS[r]}</option>
                        ))}
                      </select>
                    </td>
                    <td style={{ padding: '10px 10px' }}>
                      <MoraleBar value={k.morale} />
                    </td>
                    <td style={{ padding: '10px 10px' }}>
                      <LoyaltyBar value={k.loyalty} />
                    </td>
                    <td style={{ padding: '10px 10px', color: GOLD, fontFamily: '"Cinzel", serif', fontWeight: 700 }}>
                      🪙 {k.dailyWage}
                    </td>
                    <td style={{ padding: '10px 10px' }}>
                      <button
                        onClick={() => dismissKobold(k.id)}
                        style={{
                          padding: '4px 10px', background: '#CC222230',
                          border: '1px solid #CC222260', borderRadius: 4,
                          color: '#CC6666', fontSize: 16, cursor: 'pointer',
                        }}
                      >
                        Dismiss
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function TraitBadge({ trait }: { trait: KoboldTrait }) {
  const [show, setShow] = useState(false);

  const effectLabel =
    trait.id === 'veteran_miner' ? `+${trait.value} gold/day` :
    trait.id === 'sharp_ledger'  ? `+${trait.value}% kobold income` :
    trait.id === 'master_cook'   ? `+${trait.value} morale/day (all)` :
    trait.id === 'shadow_step'   ? `+${trait.value} combat attack bonus` :
    'Immune to poaching';

  return (
    <div
      style={{ position: 'relative', display: 'inline-flex', marginTop: 4 }}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        padding: '2px 8px', borderRadius: 10, fontSize: 13,
        background: '#C9A22720', border: '1px solid #C9A22760',
        color: '#C9A227', cursor: 'default', fontFamily: '"Cinzel", serif',
        letterSpacing: 0.3,
      }}>
        ⭐ {trait.label}
      </div>
      {show && (
        <div style={{
          position: 'absolute', bottom: 'calc(100% + 6px)', left: 0, zIndex: 200,
          background: '#1A0A2E', border: '1px solid #C4934A50',
          borderRadius: 6, padding: '10px 14px', minWidth: 210, maxWidth: 280,
          fontSize: 15, lineHeight: 1.55, pointerEvents: 'none',
          boxShadow: '0 4px 16px #00000080',
        }}>
          <div style={{ fontFamily: '"Cinzel", serif', fontWeight: 700, color: '#C9A227', marginBottom: 5 }}>
            ⭐ {trait.label}
          </div>
          <div style={{ color: '#C4934A', marginBottom: 6 }}>{trait.description}</div>
          <div style={{ color: '#4ACC7A', fontSize: 14 }}>Effect: {effectLabel}</div>
        </div>
      )}
    </div>
  );
}

function SummaryItem({ label, value, color, bold }: { label: string; value: string; color?: string; bold?: boolean }) {
  return (
    <div>
      <div style={{ fontSize: 16, color: '#C4934A60', fontFamily: '"Cinzel", serif', marginBottom: 2 }}>{label}</div>
      <div style={{ fontFamily: '"Cinzel", serif', fontWeight: bold ? 700 : 600, color: color ?? PARCHMENT, fontSize: bold ? 17 : 15 }}>
        {value}
      </div>
    </div>
  );
}
