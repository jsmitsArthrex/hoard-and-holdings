import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts';
import { useStore } from '../../store';
import type { MarketCondition, PriceHistoryEntry } from '../../store/types';

const CONDITION_COLOR: Record<MarketCondition, string> = {
  booming:   '#22c55e',
  stable:    '#C9A227',
  depressed: '#fb923c',
  crash:     '#ef4444',
};

interface TooltipPayloadEntry {
  payload: PriceHistoryEntry;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  const { day, multiplier, marketCondition } = payload[0].payload;
  return (
    <div
      style={{
        backgroundColor: '#2C1810',
        border: '1px solid #C4934A',
        padding: '0.5rem 0.75rem',
        fontFamily: 'Crimson Text, serif',
        borderRadius: 2,
      }}
    >
      <p style={{ color: '#C9A227', fontWeight: 'bold', marginBottom: 2 }}>Day {day}</p>
      <p style={{ color: '#F5E6C8', marginBottom: 2 }}>
        {(multiplier * 100).toFixed(0)}% of baseline
      </p>
      <p
        style={{
          color: CONDITION_COLOR[marketCondition],
          textTransform: 'capitalize',
        }}
      >
        {marketCondition}
      </p>
    </div>
  );
}

export function EconomyChart() {
  const priceHistory = useStore((s) => s.priceHistory);
  const chartData = priceHistory.slice(-30);

  if (chartData.length === 0) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: 180,
          backgroundColor: '#1A0A2E',
          border: '1px solid #C4934A',
          borderRadius: 4,
        }}
      >
        <p
          style={{
            color: '#C4934A',
            fontFamily: 'Crimson Text, serif',
            fontStyle: 'italic',
          }}
        >
          No market data yet — advance to the next day
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        backgroundColor: '#1A0A2E',
        border: '1px solid #C4934A',
        borderRadius: 4,
        padding: '1rem',
      }}
    >
      <h3
        style={{
          color: '#C9A227',
          fontFamily: 'Cinzel, serif',
          fontSize: '0.75rem',
          letterSpacing: '0.12em',
          marginBottom: '0.75rem',
          textTransform: 'uppercase',
        }}
      >
        Market Index — Last 30 Days
      </h3>

      <ResponsiveContainer width="100%" height={160}>
        <LineChart data={chartData} margin={{ top: 4, right: 12, bottom: 4, left: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2C1810" />

          <XAxis
            dataKey="day"
            tick={{ fill: '#C4934A', fontSize: 15, fontFamily: 'Crimson Text, serif' }}
            tickLine={false}
            axisLine={{ stroke: '#C4934A' }}
            label={{
              value: 'Day',
              position: 'insideBottomRight',
              offset: -4,
              fill: '#C4934A',
              fontSize: 15,
            }}
          />

          <YAxis
            tickFormatter={(v: number) => `${(v * 100).toFixed(0)}%`}
            tick={{ fill: '#C4934A', fontSize: 15, fontFamily: 'Crimson Text, serif' }}
            tickLine={false}
            axisLine={{ stroke: '#C4934A' }}
            domain={[0.3, 3.0]}
            width={40}
          />

          <Tooltip content={<CustomTooltip />} />

          <ReferenceLine
            y={1.0}
            stroke="#C9A227"
            strokeDasharray="4 4"
            label={{
              value: 'Baseline',
              fill: '#C9A227',
              fontSize: 14,
              position: 'insideTopRight',
            }}
          />

          <Line
            type="monotone"
            dataKey="multiplier"
            stroke="#C4934A"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: '#C9A227', stroke: '#1A0A2E' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
