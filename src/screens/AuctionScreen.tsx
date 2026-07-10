import { useState } from 'react';
import { ArrowLeft, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useGameStore } from '../store/gameStore';
import { playSound } from '../audio/audioEngine';
import { priceIndex } from '../data/economyIndex';

const INK = '#2C1810';
const PARCHMENT = '#C4934A';
const GOLD = '#C9A227';

function getMarketCondition(mult: number): { label: string; color: string; icon: React.ReactNode } {
  if (mult > 1.2) return { label: 'Booming', color: '#4ACC7A', icon: <TrendingUp size={19} /> };
  if (mult < 0.8) return { label: 'Depressed', color: '#CC4444', icon: <TrendingDown size={19} /> };
  return { label: 'Stable', color: GOLD, icon: <Minus size={19} /> };
}

export default function AuctionScreen() {
  const { gold, day, hoardItems, goldHistory, sellHoardItem, setActiveScreen } = useGameStore();
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [lastSold, setLastSold] = useState<{ name: string; price: number } | null>(null);

  const mult = priceIndex[(day - 1) % priceIndex.length];
  const market = getMarketCondition(mult);

  const doSell = (itemId: string) => {
    const item = hoardItems.find(h => h.id === itemId);
    if (!item) return;
    const price = Math.round(item.baseValue * mult);
    setLastSold({ name: item.name, price });
    playSound('coinPickup');
    sellHoardItem(itemId);
    setConfirmId(null);
  };

  const chartData = goldHistory.slice(-30).map(h => ({ day: `D${h.day}`, gold: h.gold }));

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
          <h2 style={{ fontFamily: '"Cinzel", serif', color: PARCHMENT, fontSize: 20, fontWeight: 700, margin: 0 }}>
            🔨 The Dragon's Auction House
          </h2>
        </div>

        {/* Market conditions */}
        <div style={{
          background: '#2C181040', border: `2px solid ${market.color}30`,
          borderRadius: 8, padding: '14px 20px', marginBottom: 20,
          display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap',
        }}>
          <div>
            <div style={{ fontFamily: '"Cinzel", serif', fontSize: 16, color: '#C4934A60', marginBottom: 2 }}>
              MARKET CONDITIONS
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: market.color, fontFamily: '"Cinzel", serif', fontWeight: 700, fontSize: 20 }}>
              {market.icon} {market.label}
            </div>
          </div>
          <div>
            <div style={{ fontFamily: '"Cinzel", serif', fontSize: 16, color: '#C4934A60', marginBottom: 2 }}>MULTIPLIER</div>
            <div style={{ fontFamily: '"Cinzel", serif', fontWeight: 700, fontSize: 21, color: market.color }}>
              ×{mult.toFixed(2)}
            </div>
          </div>
          <div>
            <div style={{ fontFamily: '"Cinzel", serif', fontSize: 16, color: '#C4934A60', marginBottom: 2 }}>YOUR GOLD</div>
            <div style={{ fontFamily: '"Cinzel", serif', fontWeight: 700, fontSize: 21, color: GOLD }}>
              🪙 {gold}
            </div>
          </div>
          {lastSold && (
            <div style={{
              marginLeft: 'auto', background: '#4ACC7A20',
              border: '1px solid #4ACC7A40', borderRadius: 6, padding: '6px 12px',
              fontSize: 18, color: '#4ACC7A',
            }}>
              ✓ Sold {lastSold.name} for {lastSold.price} gold!
            </div>
          )}
        </div>

        {/* Hoard items */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontFamily: '"Cinzel", serif', color: PARCHMENT, fontSize: 20, fontWeight: 700, marginBottom: 12 }}>
            YOUR HOARD ({hoardItems.length} items)
          </div>

          {hoardItems.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '40px', color: '#C4934A40',
              fontStyle: 'italic', fontSize: 20,
              background: '#2C181020', border: `1px dashed ${PARCHMENT}20`, borderRadius: 8,
            }}>
              Your hoard is empty. Hunt adventurers to acquire loot!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {hoardItems.map(item => {
                const salePrice = Math.round(item.baseValue * mult);
                const isConfirming = confirmId === item.id;
                return (
                  <div
                    key={item.id}
                    style={{
                      background: isConfirming ? '#C9A22720' : '#2C181030',
                      border: `2px solid ${isConfirming ? GOLD + '60' : PARCHMENT + '20'}`,
                      borderRadius: 8, padding: '14px 16px',
                      display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
                    }}
                  >
                    <div style={{ fontSize: 28 }}>📦</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: '"Cinzel", serif', fontWeight: 700, color: PARCHMENT, fontSize: 19 }}>
                        {item.name}
                      </div>
                      <div style={{ fontSize: 17, color: '#C4934A60' }}>
                        Base value: 🪙{item.baseValue} · Looted Day {item.lootedOnDay}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontFamily: '"Cinzel", serif', fontWeight: 700, color: GOLD, fontSize: 19 }}>
                        🪙 {salePrice}
                      </div>
                      <div style={{ fontSize: 16, color: market.color }}>
                        ×{mult.toFixed(2)} market
                      </div>
                    </div>
                    {!isConfirming ? (
                      <button
                        onClick={() => setConfirmId(item.id)}
                        style={{
                          padding: '8px 16px', background: GOLD, border: `1px solid ${INK}`,
                          borderRadius: 4, color: INK, cursor: 'pointer',
                          fontFamily: '"Cinzel", serif', fontWeight: 700, fontSize: 17,
                        }}
                      >
                        Sell
                      </button>
                    ) : (
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          onClick={() => setConfirmId(null)}
                          style={{
                            padding: '7px 12px', background: 'transparent',
                            border: `1px solid ${PARCHMENT}30`, borderRadius: 4,
                            color: '#C4934A60', cursor: 'pointer', fontSize: 17,
                          }}
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => doSell(item.id)}
                          style={{
                            padding: '7px 14px', background: GOLD, border: `1px solid ${INK}`,
                            borderRadius: 4, color: INK, cursor: 'pointer',
                            fontFamily: '"Cinzel", serif', fontWeight: 700, fontSize: 17,
                          }}
                        >
                          Confirm Sale
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Gold history chart */}
        {chartData.length > 1 && (
          <div style={{
            background: '#2C181040', border: `1px solid ${PARCHMENT}20`,
            borderRadius: 8, padding: '16px',
          }}>
            <div style={{ fontFamily: '"Cinzel", serif', color: PARCHMENT, fontSize: 18, fontWeight: 700, marginBottom: 12 }}>
              GOLD HISTORY (last 30 entries)
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#C4934A10" />
                <XAxis dataKey="day" stroke="#C4934A40" tick={{ fontSize: 15, fill: '#C4934A60' }} />
                <YAxis stroke="#C4934A40" tick={{ fontSize: 15, fill: '#C4934A60' }} />
                <Tooltip
                  contentStyle={{ background: '#1A0800', border: `1px solid ${PARCHMENT}40`, fontSize: 17 }}
                  labelStyle={{ color: PARCHMENT }}
                  itemStyle={{ color: GOLD }}
                />
                <Line type="monotone" dataKey="gold" stroke={GOLD} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
