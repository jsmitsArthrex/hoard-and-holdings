import type { Contract } from '../../types';

const PARCHMENT = '#C4934A';
const GOLD = '#C9A227';

interface ContractCardProps {
  contract: Contract | undefined;
  currentDay: number;
}

function rewardText(reward: Contract['reward']): string {
  const parts: string[] = [];
  if (reward.gold) parts.push(`+${reward.gold} gold`);
  if (reward.dread) parts.push(`+${reward.dread} dread`);
  if (reward.koboldMorale) parts.push(`+${reward.koboldMorale} kobold morale`);
  return parts.join(' · ') || 'No reward';
}

export default function ContractCard({ contract, currentDay }: ContractCardProps) {
  if (!contract) {
    return (
      <div style={{
        background: '#2C181025', border: `1px solid ${PARCHMENT}20`,
        borderRadius: 6, padding: '12px 14px', marginBottom: 16,
      }}>
        <div style={{ fontFamily: '"Cinzel", serif', fontSize: 15, color: PARCHMENT, fontWeight: 700, marginBottom: 6 }}>
          📋 Active Contract
        </div>
        <div style={{ fontSize: 16, color: '#C4934A50', fontStyle: 'italic' }}>
          No contract available — check back soon.
        </div>
      </div>
    );
  }

  if (contract.completed) {
    return (
      <div style={{
        background: '#4ACC7A15', border: `1px solid #4ACC7A40`,
        borderRadius: 6, padding: '12px 14px', marginBottom: 16,
      }}>
        <div style={{ fontFamily: '"Cinzel", serif', fontSize: 15, color: '#4ACC7A', fontWeight: 700, marginBottom: 4 }}>
          📋 ✅ Contract Completed
        </div>
        <div style={{ fontSize: 17, color: '#4ACC7A', fontWeight: 600, marginBottom: 2 }}>{contract.title}</div>
        <div style={{ fontSize: 15, color: '#4ACC7A80' }}>Reward earned: {rewardText(contract.reward)}</div>
      </div>
    );
  }

  if (contract.failed) {
    return (
      <div style={{
        background: '#8B1A1A15', border: `1px solid #8B1A1A40`,
        borderRadius: 6, padding: '12px 14px', marginBottom: 16,
      }}>
        <div style={{ fontFamily: '"Cinzel", serif', fontSize: 15, color: '#CC4444', fontWeight: 700, marginBottom: 4 }}>
          📋 ❌ Contract Failed
        </div>
        <div style={{ fontSize: 17, color: '#CC4444', fontWeight: 600, marginBottom: 2 }}>{contract.title}</div>
        <div style={{ fontSize: 15, color: '#CC444480' }}>Deadline passed. Penalty applied.</div>
      </div>
    );
  }

  const daysLeft = contract.deadline - currentDay;
  const pct = contract.targetCount > 0 ? contract.progress / contract.targetCount : 0;

  return (
    <div style={{
      background: `${GOLD}10`, border: `1px solid ${GOLD}35`,
      borderRadius: 6, padding: '12px 14px', marginBottom: 16,
    }}>
      <div style={{ fontFamily: '"Cinzel", serif', fontSize: 15, color: GOLD, fontWeight: 700, marginBottom: 6 }}>
        📋 Active Contract
      </div>
      <div style={{ fontSize: 17, color: '#E8D5A0', fontWeight: 600, marginBottom: 4 }}>{contract.title}</div>
      <div style={{ fontSize: 16, color: '#C4934A90', marginBottom: 10, lineHeight: 1.5 }}>{contract.description}</div>

      <div style={{ marginBottom: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, color: PARCHMENT, marginBottom: 3 }}>
          <span>Progress</span>
          <span>{contract.progress} / {contract.targetCount}</span>
        </div>
        <div style={{ background: '#2C181060', borderRadius: 4, height: 7, overflow: 'hidden' }}>
          <div style={{
            background: pct >= 1 ? '#4ACC7A' : GOLD,
            width: `${Math.min(100, pct * 100)}%`,
            height: '100%',
            borderRadius: 4,
            transition: 'width 0.3s',
          }} />
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, flexWrap: 'wrap', gap: 4 }}>
        <span style={{ color: daysLeft <= 3 ? '#CC4444' : '#C4934A80' }}>
          Due Day {contract.deadline} ({daysLeft > 0 ? `${daysLeft}d left` : 'expires today'})
        </span>
        <span style={{ color: GOLD }}>🎁 {rewardText(contract.reward)}</span>
      </div>
    </div>
  );
}
