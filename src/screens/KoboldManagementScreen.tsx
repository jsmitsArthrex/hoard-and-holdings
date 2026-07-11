import { useState, Fragment } from 'react';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import KoboldAvatar from '../components/npcs/KoboldAvatar';
import { KOBOLD_ROLE_LABELS, KOBOLD_ROLES, KOBOLD_SPECIES_LABELS } from '../engine/gameClock';
import type { KoboldRole, KoboldTrait, KoboldEmployee, KoboldSpecies } from '../types';
import type { KoboldTier } from '../data/koboldWages';
import { playSound } from '../audio/audioEngine';

const INK = '#2C1810';
const PARCHMENT = '#C4934A';
const GOLD = '#C9A227';

const TIER_COLORS: Record<KoboldTier, string> = {
  basic: '#8A8A6A',
  standard: '#4A8A4A',
  skilled: '#4A6ACC',
  elite: '#8A2ACC',
};

const TALENT_SHOW_COOLDOWN = 7;

const PROMOTION_COST = { basic: 60, standard: 100, skilled: 150, elite: 150 } as const;

const LIEUTENANT_SKILL_LABELS: Record<string, string> = {
  foreman: 'Foreman',
  warden: 'Warden',
  chief_ledger: 'Chief Ledger',
  infiltrator: 'Infiltrator',
  head_chef: 'Head Chef',
};

const LIEUTENANT_SKILL_DESCRIPTIONS: Record<string, string> = {
  foreman: 'All other miners earn +1 gold/evening.',
  warden: 'Auto-raid gold loss reduced by an additional 10%.',
  chief_ledger: 'Total kobold income +5% (replaces +3%).',
  infiltrator: 'Expedition success chance +10%.',
  head_chef: 'All kobolds +3 morale/day (replaces +2).',
};

const ROLE_ACTS: Record<KoboldRole, string> = {
  miner: 'Competitive rock-stacking. Surprisingly tense.',
  guard: 'A dramatic re-enactment of their finest patrol. With sound effects.',
  treasurer: 'A spoken-word performance about quarterly earnings.',
  scout: 'An interpretive dance about shadows and stealth.',
  cook: 'A live cooking demonstration involving something unidentified.',
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
  const { kobolds, playerPropertyIds, gold, day, lastTalentShowDay, setActiveScreen, dismissKobold, changeKoboldRole, judgeAct, finishTalentShow, promoteKobold, setLieutenantAssignment } = useGameStore();
  const [showOpen, setShowOpen] = useState(false);
  const [showLineup, setShowLineup] = useState<KoboldEmployee[]>([]);
  const [confirmPromoteId, setConfirmPromoteId] = useState<string | null>(null);
  const cooldownRemaining = (lastTalentShowDay ?? 0) === 0 ? 0 : Math.max(0, TALENT_SHOW_COOLDOWN - (day - (lastTalentShowDay ?? 0)));
  const canHoldShow = cooldownRemaining === 0 && kobolds.length >= 2;
  const lieutenants = kobolds.filter(k => k.isLieutenant);
  const regulars = kobolds.filter(k => !k.isLieutenant);

  function openTalentShow() {
    const shuffled = [...kobolds].sort(() => Math.random() - 0.5);
    setShowLineup(shuffled.slice(0, 3));
    setShowOpen(true);
    playSound('uiOpen');
  }

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

        {/* Talent Show */}
        {kobolds.length >= 2 && (
          <div style={{ marginBottom: 20 }}>
            {showOpen ? (
              <TalentShowPanel
                lineup={showLineup}
                gold={gold}
                onJudge={judgeAct}
                onFinish={finishTalentShow}
                onClose={() => { setShowOpen(false); playSound('uiClose'); }}
              />
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <button
                  onClick={openTalentShow}
                  disabled={!canHoldShow}
                  style={{
                    padding: '8px 18px', borderRadius: 6,
                    background: canHoldShow ? '#C9A22720' : '#2C181040',
                    border: `1px solid ${canHoldShow ? '#C9A22760' : '#C4934A30'}`,
                    color: canHoldShow ? GOLD : '#C4934A40',
                    fontFamily: '"Cinzel", serif', fontSize: 16,
                    cursor: canHoldShow ? 'pointer' : 'default',
                  }}
                >
                  🎭 Talent Show
                </button>
                {cooldownRemaining > 0 && (
                  <span style={{ fontSize: 16, color: '#C4934A60', fontStyle: 'italic' }}>
                    Available in {cooldownRemaining} day{cooldownRemaining !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
            )}
          </div>
        )}

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
                {lieutenants.length > 0 && (
                  <tr>
                    <td colSpan={7} style={{
                      padding: '8px 10px',
                      fontFamily: '"Cinzel", serif', fontSize: 13,
                      color: GOLD, background: '#C9A2270A',
                      borderBottom: `1px solid ${GOLD}25`, letterSpacing: 1.2,
                    }}>
                      ⚜️ LIEUTENANTS
                    </td>
                  </tr>
                )}
                {lieutenants.map(k => (
                  <Fragment key={k.id}>
                    <tr style={{
                      borderBottom: `1px solid ${PARCHMENT}10`,
                      background: k.morale < 30 ? '#CC222210' : '#C9A2270A',
                    }}>
                      <td style={{ padding: '10px 10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <KoboldAvatar species={k.species} size={28} />
                          <div>
                            <div style={{ color: GOLD, fontWeight: 700, fontSize: 18 }}>{k.name}</div>
                            <div style={{ fontSize: 15, color: TIER_COLORS[k.tier], padding: '1px 5px', display: 'inline-block' }}>
                              {k.tier}
                            </div>
                            <LieutenantBadge kobold={k} />
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '10px 10px', color: '#C4934A80' }}>{KOBOLD_SPECIES_LABELS[k.species]}</td>
                      <td style={{ padding: '10px 10px' }}>
                        <select
                          value={k.role}
                          onChange={e => changeKoboldRole(k.id, e.target.value as KoboldRole)}
                          style={{
                            background: '#2C181060', border: `1px solid ${PARCHMENT}30`,
                            borderRadius: 4, color: PARCHMENT, fontSize: 17, padding: '4px 6px', cursor: 'pointer',
                          }}
                        >
                          {KOBOLD_ROLES.map(r => <option key={r} value={r}>{KOBOLD_ROLE_LABELS[r]}</option>)}
                        </select>
                      </td>
                      <td style={{ padding: '10px 10px' }}><MoraleBar value={k.morale} /></td>
                      <td style={{ padding: '10px 10px' }}><LoyaltyBar value={k.loyalty} /></td>
                      <td style={{ padding: '10px 10px', color: GOLD, fontFamily: '"Cinzel", serif', fontWeight: 700 }}>🪙 {k.dailyWage}</td>
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
                    <tr style={{ borderBottom: `1px solid ${PARCHMENT}18` }}>
                      <td colSpan={7} style={{ padding: '0 10px 10px 46px' }}>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 13, color: `${GOLD}80`, fontFamily: '"Cinzel", serif', letterSpacing: 0.5 }}>
                            Assignment:
                          </span>
                          {(['defence', 'recruitment', 'trade'] as const).map(assign => {
                            const labels = { defence: '🛡 Lair Defence', recruitment: '📋 Recruitment', trade: '💰 Trade' };
                            const active = k.lieutenantAssignment === assign;
                            return (
                              <button
                                key={assign}
                                onClick={() => { setLieutenantAssignment(k.id, active ? null : assign); playSound('uiClick'); }}
                                style={{
                                  padding: '4px 12px', borderRadius: 4, fontSize: 14,
                                  background: active ? '#C9A22730' : '#2C181030',
                                  border: `1px solid ${active ? '#C9A22780' : PARCHMENT + '20'}`,
                                  color: active ? GOLD : PARCHMENT + '60',
                                  cursor: 'pointer', fontFamily: 'inherit',
                                }}
                              >
                                {labels[assign]}
                              </button>
                            );
                          })}
                        </div>
                      </td>
                    </tr>
                  </Fragment>
                ))}
                {lieutenants.length > 0 && regulars.length > 0 && (
                  <tr>
                    <td colSpan={7} style={{
                      padding: '8px 10px',
                      fontFamily: '"Cinzel", serif', fontSize: 13,
                      color: '#C4934A60', background: '#2C181018',
                      borderBottom: `1px solid ${PARCHMENT}15`, letterSpacing: 1.2,
                    }}>
                      COLONY
                    </td>
                  </tr>
                )}
                {regulars.map(k => (
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
                    <td style={{ padding: '10px 10px', color: '#C4934A80' }}>{KOBOLD_SPECIES_LABELS[k.species]}</td>
                    <td style={{ padding: '10px 10px' }}>
                      <select
                        value={k.role}
                        onChange={e => changeKoboldRole(k.id, e.target.value as KoboldRole)}
                        style={{
                          background: '#2C181060', border: `1px solid ${PARCHMENT}30`,
                          borderRadius: 4, color: PARCHMENT, fontSize: 17, padding: '4px 6px', cursor: 'pointer',
                        }}
                      >
                        {KOBOLD_ROLES.map(r => <option key={r} value={r}>{KOBOLD_ROLE_LABELS[r]}</option>)}
                      </select>
                    </td>
                    <td style={{ padding: '10px 10px' }}><MoraleBar value={k.morale} /></td>
                    <td style={{ padding: '10px 10px' }}><LoyaltyBar value={k.loyalty} /></td>
                    <td style={{ padding: '10px 10px', color: GOLD, fontFamily: '"Cinzel", serif', fontWeight: 700 }}>
                      🪙 {k.dailyWage}
                    </td>
                    <td style={{ padding: '10px 10px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                        {confirmPromoteId === k.id ? (
                          <>
                            <div style={{ fontSize: 13, color: GOLD, lineHeight: 1.4 }}>
                              Promote {k.name} for {PROMOTION_COST[k.tier]}g?
                              <div style={{ fontSize: 12, color: '#C4934A60', fontStyle: 'italic' }}>Cannot be undone.</div>
                            </div>
                            <div style={{ display: 'flex', gap: 5 }}>
                              <button
                                onClick={() => { promoteKobold(k.id); setConfirmPromoteId(null); }}
                                disabled={gold < PROMOTION_COST[k.tier]}
                                style={{
                                  padding: '4px 10px',
                                  background: gold >= PROMOTION_COST[k.tier] ? '#C9A22730' : '#2C181040',
                                  border: `1px solid ${gold >= PROMOTION_COST[k.tier] ? '#C9A22760' : PARCHMENT + '20'}`,
                                  borderRadius: 4,
                                  color: gold >= PROMOTION_COST[k.tier] ? GOLD : PARCHMENT + '40',
                                  fontSize: 14, cursor: gold >= PROMOTION_COST[k.tier] ? 'pointer' : 'default',
                                }}
                              >
                                Confirm
                              </button>
                              <button
                                onClick={() => setConfirmPromoteId(null)}
                                style={{
                                  padding: '4px 10px', background: '#2C181030',
                                  border: `1px solid ${PARCHMENT}30`, borderRadius: 4,
                                  color: PARCHMENT + '60', fontSize: 14, cursor: 'pointer',
                                }}
                              >
                                Cancel
                              </button>
                            </div>
                          </>
                        ) : (
                          <>
                            {k.daysEmployed >= 30 && !!k.trait && (
                              <button
                                onClick={() => { setConfirmPromoteId(k.id); playSound('uiClick'); }}
                                disabled={gold < PROMOTION_COST[k.tier]}
                                style={{
                                  padding: '4px 10px',
                                  background: gold >= PROMOTION_COST[k.tier] ? '#C9A22720' : '#2C181040',
                                  border: `1px solid ${gold >= PROMOTION_COST[k.tier] ? '#C9A22760' : PARCHMENT + '20'}`,
                                  borderRadius: 4,
                                  color: gold >= PROMOTION_COST[k.tier] ? GOLD : PARCHMENT + '40',
                                  fontSize: 14, cursor: gold >= PROMOTION_COST[k.tier] ? 'pointer' : 'default',
                                }}
                              >
                                {gold >= PROMOTION_COST[k.tier]
                                  ? `⚜️ Promote (${PROMOTION_COST[k.tier]}g)`
                                  : `⚜️ Promote (need ${PROMOTION_COST[k.tier]}g)`}
                              </button>
                            )}
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
                          </>
                        )}
                      </div>
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

function LieutenantBadge({ kobold }: { kobold: KoboldEmployee }) {
  const [show, setShow] = useState(false);
  const skillLabel = LIEUTENANT_SKILL_LABELS[kobold.lieutenantSkill ?? ''] ?? kobold.lieutenantSkill ?? '';
  const skillDesc = LIEUTENANT_SKILL_DESCRIPTIONS[kobold.lieutenantSkill ?? ''] ?? '';

  return (
    <div
      style={{ position: 'relative', display: 'inline-flex', marginTop: 4 }}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        padding: '2px 8px', borderRadius: 10, fontSize: 13,
        background: '#C9A22730', border: '1px solid #C9A22790',
        color: GOLD, cursor: 'default', fontFamily: '"Cinzel", serif',
        letterSpacing: 0.3,
      }}>
        ⚜️ {skillLabel}
      </div>
      {show && (
        <div style={{
          position: 'absolute', bottom: 'calc(100% + 6px)', left: 0, zIndex: 200,
          background: '#1A0A2E', border: '1px solid #C9A22750',
          borderRadius: 6, padding: '10px 14px', minWidth: 210, maxWidth: 280,
          fontSize: 15, lineHeight: 1.55, pointerEvents: 'none',
          boxShadow: '0 4px 16px #00000080',
        }}>
          <div style={{ fontFamily: '"Cinzel", serif', fontWeight: 700, color: GOLD, marginBottom: 5 }}>
            ⚜️ Lieutenant — {skillLabel}
          </div>
          {kobold.trait && (
            <div style={{ color: '#C4934A80', marginBottom: 4, fontSize: 13 }}>
              ⭐ {kobold.trait.label}: {kobold.trait.description}
            </div>
          )}
          <div style={{ color: '#4ACC7A', fontSize: 14 }}>Skill: {skillDesc}</div>
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

function TalentShowPanel({
  lineup,
  gold,
  onJudge,
  onFinish,
  onClose,
}: {
  lineup: KoboldEmployee[];
  gold: number;
  onJudge: (koboldId: string, choice: 'praise' | 'critique' | 'bribe') => void;
  onFinish: (score: number) => void;
  onClose: () => void;
}) {
  const [phase, setPhase] = useState<'intro' | 'act' | 'results'>('intro');
  const [actIndex, setActIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [actLog, setActLog] = useState<{ name: string; species: KoboldSpecies; choice: string; delta: number }[]>([]);
  const scoreTier: 'crowd-pleaser' | 'decent' | 'flop' = score >= 30 ? 'crowd-pleaser' : score >= 15 ? 'decent' : 'flop';
  const currentKobold = lineup[actIndex];

  function handleJudge(choice: 'praise' | 'critique' | 'bribe') {
    if (choice === 'bribe' && gold < 10) return;
    const kobold = lineup[actIndex];
    onJudge(kobold.id, choice);
    const delta = choice === 'praise' ? 15 : choice === 'critique' ? -5 : 25;
    const newScore = score + delta;
    setScore(newScore);
    setActLog(prev => [...prev, { name: kobold.name, species: kobold.species, choice, delta }]);
    playSound('uiClick');
    if (actIndex + 1 >= lineup.length) {
      onFinish(newScore);
      setPhase('results');
    } else {
      setActIndex(i => i + 1);
    }
  }

  if (phase === 'intro') {
    return (
      <div style={{ background: '#150A03', border: `1px solid ${PARCHMENT}35`, borderRadius: 8, padding: '20px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🎭</div>
          <h3 style={{ fontFamily: '"Cinzel", serif', color: PARCHMENT, fontSize: 19, margin: '0 0 10px' }}>
            Kobold Talent Show
          </h3>
          <p style={{ color: '#C4934A90', fontSize: 17, fontStyle: 'italic', margin: '0 0 18px', lineHeight: 1.5 }}>
            Your kobolds shuffle nervously onto a makeshift stage. The audience (you) settles in.
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <button
              onClick={() => { setPhase('act'); playSound('uiClick'); }}
              style={{
                padding: '8px 22px', borderRadius: 6,
                background: '#C9A22730', border: '1px solid #C9A22760',
                color: GOLD, fontFamily: '"Cinzel", serif', fontSize: 16, cursor: 'pointer',
              }}
            >
              Begin Show
            </button>
            <button
              onClick={onClose}
              style={{
                padding: '8px 16px', borderRadius: 6,
                background: '#2C181040', border: '1px solid #C4934A30',
                color: '#C4934A80', fontSize: 16, cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'act' && currentKobold) {
    return (
      <div style={{ background: '#150A03', border: `1px solid ${PARCHMENT}35`, borderRadius: 8, padding: '20px' }}>
        <div style={{ fontSize: 14, color: '#C4934A60', fontFamily: '"Cinzel", serif', letterSpacing: 0.5, marginBottom: 12 }}>
          ACT {actIndex + 1} OF {lineup.length}
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 18 }}>
          <KoboldAvatar species={currentKobold.species} size={60} />
          <div>
            <div style={{ color: PARCHMENT, fontFamily: '"Cinzel", serif', fontSize: 19, fontWeight: 700 }}>
              {currentKobold.name}
            </div>
            <div style={{ color: '#C4934A80', fontSize: 15, marginBottom: 8 }}>
              {KOBOLD_ROLE_LABELS[currentKobold.role]}
            </div>
            <div style={{
              color: '#C4934ACC', fontSize: 17, fontStyle: 'italic',
              background: '#2C181030', padding: '8px 12px', borderRadius: 4,
              borderLeft: `2px solid ${PARCHMENT}40`,
            }}>
              "{ROLE_ACTS[currentKobold.role]}"
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            onClick={() => handleJudge('praise')}
            style={{
              padding: '9px 18px', borderRadius: 6,
              background: '#4ACC7A20', border: '1px solid #4ACC7A50',
              color: '#4ACC7A', fontSize: 16, cursor: 'pointer',
            }}
          >
            👏 Praise <span style={{ fontSize: 14, opacity: 0.7 }}>+15 morale</span>
          </button>
          <button
            onClick={() => handleJudge('critique')}
            style={{
              padding: '9px 18px', borderRadius: 6,
              background: '#CC884420', border: '1px solid #CC884450',
              color: '#CC8844', fontSize: 16, cursor: 'pointer',
            }}
          >
            📝 Critique <span style={{ fontSize: 14, opacity: 0.7 }}>−5 morale</span>
          </button>
          <button
            onClick={() => handleJudge('bribe')}
            disabled={gold < 10}
            style={{
              padding: '9px 18px', borderRadius: 6,
              background: gold >= 10 ? '#C9A22720' : '#2C181040',
              border: `1px solid ${gold >= 10 ? '#C9A22760' : '#C4934A20'}`,
              color: gold >= 10 ? GOLD : '#C4934A40',
              fontSize: 16, cursor: gold >= 10 ? 'pointer' : 'default',
            }}
          >
            💰 Bribe <span style={{ fontSize: 14, opacity: 0.7 }}>+25 morale · 10g</span>
          </button>
        </div>
      </div>
    );
  }

  const TIER_INFO = {
    'crowd-pleaser': { icon: '🎉', label: 'Crowd Pleaser', reward: '+20 gold found in audience donations', color: GOLD },
    'decent': { icon: '✅', label: 'Decent Show', reward: '+5 dread — word spreads of your generous patronage', color: '#4ACC7A' },
    'flop': { icon: '💀', label: 'Critical Flop', reward: 'Rosie hears about it. −3 dread.', color: '#CC4444' },
  };
  const RECAP = {
    'crowd-pleaser': '"The crowd erupts. Someone throws a copper piece. It is the most touching thing you have ever seen."',
    'decent': '"The kobolds bow. Someone in the back coughs. It is fine."',
    'flop': '"Rosie Rumour was seen writing in her notepad. This cannot be good."',
  };
  const CHOICE_LABELS: Record<string, string> = { praise: '👏 Praised', critique: '📝 Critiqued', bribe: '💰 Bribed' };
  const tier = TIER_INFO[scoreTier];

  return (
    <div style={{ background: '#150A03', border: `1px solid ${PARCHMENT}35`, borderRadius: 8, padding: '20px' }}>
      <h3 style={{ fontFamily: '"Cinzel", serif', color: PARCHMENT, fontSize: 18, margin: '0 0 14px' }}>
        🏆 Show Results
      </h3>
      <div style={{ marginBottom: 14 }}>
        {actLog.map((entry, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '6px 0', borderBottom: `1px solid ${PARCHMENT}15`,
          }}>
            <KoboldAvatar species={entry.species} size={26} />
            <span style={{ color: PARCHMENT, fontSize: 17, flex: 1 }}>{entry.name}</span>
            <span style={{ color: '#C4934A80', fontSize: 15 }}>{CHOICE_LABELS[entry.choice]}</span>
            <span style={{
              color: entry.delta > 0 ? '#4ACC7A' : '#CC4444',
              fontFamily: '"Cinzel", serif', fontWeight: 700, fontSize: 17, minWidth: 36,
            }}>
              {entry.delta > 0 ? '+' : ''}{entry.delta}
            </span>
          </div>
        ))}
      </div>
      <div style={{
        background: `${tier.color}15`, border: `1px solid ${tier.color}40`,
        borderRadius: 6, padding: '12px 16px', marginBottom: 12,
      }}>
        <div style={{ fontFamily: '"Cinzel", serif', color: tier.color, fontSize: 18, fontWeight: 700, marginBottom: 4 }}>
          {tier.icon} {tier.label}
        </div>
        <div style={{ color: '#C4934A', fontSize: 16 }}>{tier.reward}</div>
      </div>
      <p style={{ color: '#C4934A80', fontSize: 16, fontStyle: 'italic', margin: '0 0 16px' }}>
        {RECAP[scoreTier]}
      </p>
      <button
        onClick={onClose}
        style={{
          padding: '8px 22px', borderRadius: 6,
          background: '#2C181040', border: `1px solid ${PARCHMENT}40`,
          color: PARCHMENT, fontFamily: '"Cinzel", serif', fontSize: 16, cursor: 'pointer',
        }}
      >
        Close
      </button>
    </div>
  );
}
