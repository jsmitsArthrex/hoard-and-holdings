import { useGameStore } from '../store/gameStore';
import NPCPortrait from '../components/npcs/NPCPortrait';
import type { BlackMarketItem } from '../types';
import { playSound } from '../audio/audioEngine';

const INK = '#2C1810';
const PARCHMENT = '#C4934A';
const GOLD = '#C9A227';
const DANGER = '#8B1A1A';

const TYPE_BADGE: Record<BlackMarketItem['type'], { label: string; bg: string; color: string }> = {
  hoard:  { label: 'STOLEN GOODS', bg: '#3A2A00', color: GOLD },
  kobold: { label: 'KOBOLD',       bg: '#0A2A10', color: '#4ACC7A' },
  intel:  { label: 'INTELLIGENCE', bg: '#0A1A3A', color: '#66AAFF' },
};

const SPECIES_COLOR: Record<string, string> = {
  red:    '#CC3322',
  blue:   '#2266CC',
  green:  '#226622',
  purple: '#882299',
  white:  '#888888',
};

const FESTIVAL_ITEMS = [
  {
    id: 'festival-goblet',
    label: 'Ancient Ceremonial Goblet',
    description: 'A relic from the Festival vaults. The inscription is in Old Draconic and roughly translates to "first place." Worth a fortune to the right collector.',
    baseValue: 200,
    cost: 120,
  },
  {
    id: 'festival-scale',
    label: 'Spectral Dragon Scale',
    description: 'Shed by the Spectral Challenger during the Aerial Display. Glimmers even in total darkness. Highly sought after by hoard curators.',
    baseValue: 250,
    cost: 150,
  },
];

export default function BlackMarketScreen() {
  const {
    gold, day, blackMarketStock, blackMarketRefreshDay,
    purchaseBlackMarketItem, setActiveScreen, festival, purchaseFestivalItem,
  } = useGameStore();

  const hasUnpurchased = (blackMarketStock ?? []).some(i => !i.purchased);
  const daysUntilRefresh = blackMarketRefreshDay - day;

  const handleBuy = (itemId: string, cost: number) => {
    if (gold < cost) return;
    playSound('coinLoss');
    purchaseBlackMarketItem(itemId);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>

      {/* ── Header ── */}
      <div style={{
        padding: '10px 16px', borderBottom: `1px solid ${PARCHMENT}30`,
        display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0,
      }}>
        <button
          onClick={() => { playSound('uiClose'); setActiveScreen('hub'); }}
          style={{
            background: 'none', border: `1px solid ${PARCHMENT}50`, borderRadius: 4,
            color: PARCHMENT, cursor: 'pointer', padding: '4px 10px', fontSize: 16,
          }}
        >
          ← Back
        </button>
        <div style={{ fontFamily: '"Cinzel", serif', fontWeight: 700, color: PARCHMENT, fontSize: 20 }}>
          🕯️ The Back Room
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: 20, display: 'flex', gap: 20 }}>

        {/* ── NPC Panel ── */}
        <div style={{ width: 160, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <NPCPortrait role="halfling-innkeeper" size={120} />
          <div style={{ fontFamily: '"Cinzel", serif', fontWeight: 700, color: PARCHMENT, fontSize: 16 }}>
            The Fence
          </div>
          <p style={{
            fontFamily: '"Crimson Text", serif', fontStyle: 'italic',
            color: `${PARCHMENT}99`, fontSize: 16, margin: 0, lineHeight: 1.5,
          }}>
            "The fence appears every few nights. No questions asked."
          </p>
          {daysUntilRefresh > 0 && (
            <div style={{
              marginTop: 6, padding: '6px 8px',
              background: '#2C181030', border: `1px solid ${PARCHMENT}25`,
              borderRadius: 4, fontSize: 14, color: `${PARCHMENT}70`,
            }}>
              Restocks in <span style={{ color: PARCHMENT, fontWeight: 700 }}>{daysUntilRefresh}</span> day{daysUntilRefresh !== 1 ? 's' : ''}
            </div>
          )}
        </div>

        {/* ── Stock Panel ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>

          {/* ── Festival Stock ── */}
          {festival?.active && (
            <div style={{ marginBottom: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <div style={{
                  fontFamily: '"Cinzel", serif', fontSize: 13, fontWeight: 700,
                  color: GOLD, letterSpacing: '0.05em',
                }}>
                  🎪 FESTIVAL STOCK
                </div>
                <span style={{
                  background: '#3A2200', color: GOLD,
                  fontSize: 11, fontWeight: 700, fontFamily: '"Cinzel", serif',
                  padding: '2px 8px', borderRadius: 3, letterSpacing: '0.06em',
                  border: `1px solid ${GOLD}50`,
                }}>
                  LIMITED
                </span>
              </div>
              {FESTIVAL_ITEMS.map(item => {
                const purchased = festival.festivalStockPurchased.includes(item.id);
                const canAfford = gold >= item.cost;
                const isDisabled = purchased || !canAfford;
                return (
                  <div
                    key={item.id}
                    style={{
                      background: purchased ? '#1A0A0210' : '#2C1A0080',
                      border: `1px solid ${purchased ? GOLD + '20' : GOLD + '60'}`,
                      borderRadius: 6, padding: '12px 14px', marginBottom: 8,
                      opacity: purchased ? 0.5 : 1,
                      display: 'flex', flexDirection: 'column', gap: 6,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{
                        background: '#3A2200', color: GOLD,
                        fontSize: 11, fontWeight: 700, fontFamily: '"Cinzel", serif',
                        padding: '2px 7px', borderRadius: 3, letterSpacing: '0.06em',
                      }}>
                        FESTIVAL EXCLUSIVE
                      </span>
                      {purchased && (
                        <span style={{ fontSize: 12, color: `${GOLD}60`, fontStyle: 'italic' }}>✓ purchased</span>
                      )}
                    </div>
                    <div style={{ fontFamily: '"Cinzel", serif', fontWeight: 700, color: GOLD, fontSize: 17 }}>
                      {item.label}
                    </div>
                    <div style={{ fontFamily: '"Crimson Text", serif', color: `${PARCHMENT}90`, fontSize: 16, lineHeight: 1.45 }}>
                      {item.description}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                      <div style={{ fontFamily: '"Cinzel", serif', fontWeight: 700, color: canAfford ? GOLD : DANGER, fontSize: 16 }}>
                        🪙 {item.cost} gold
                      </div>
                      {!purchased && (
                        <button
                          onClick={() => { if (!isDisabled) purchaseFestivalItem(item.id); }}
                          disabled={isDisabled}
                          style={{
                            padding: '6px 16px',
                            background: isDisabled ? '#2C181030' : GOLD,
                            border: `2px solid ${isDisabled ? '#2C181050' : INK}`,
                            borderRadius: 4, cursor: isDisabled ? 'default' : 'pointer',
                            fontFamily: '"Cinzel", serif', fontWeight: 700,
                            color: isDisabled ? `${PARCHMENT}40` : INK,
                            fontSize: 15, opacity: isDisabled ? 0.6 : 1,
                          }}
                        >
                          {!canAfford ? 'Cannot Afford' : 'Buy'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {!blackMarketStock || blackMarketStock.length === 0 ? (
            <div style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: `${PARCHMENT}50`, fontFamily: '"Crimson Text", serif',
              fontStyle: 'italic', fontSize: 20,
            }}>
              The Fence hasn't been around yet. Check back every 5 days.
            </div>
          ) : (
            <>
              <div style={{
                fontFamily: '"Cinzel", serif', fontSize: 13, fontWeight: 700,
                color: `${PARCHMENT}60`, letterSpacing: '0.05em', marginBottom: 2,
              }}>
                {hasUnpurchased ? 'AVAILABLE WARES' : 'ALL PURCHASED — FENCE RETURNS SOON'}
              </div>
              {blackMarketStock.map(item => {
                const badge = TYPE_BADGE[item.type];
                const canAfford = gold >= item.cost;
                const isDisabled = item.purchased || !canAfford;
                return (
                  <div
                    key={item.id}
                    style={{
                      background: item.purchased ? '#1A0A0210' : '#1A0A0280',
                      border: `1px solid ${item.purchased ? PARCHMENT + '20' : PARCHMENT + '40'}`,
                      borderRadius: 6, padding: '12px 14px',
                      opacity: item.purchased ? 0.5 : 1,
                      display: 'flex', flexDirection: 'column', gap: 6,
                    }}
                  >
                    {/* Type badge + label row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{
                        background: badge.bg, color: badge.color,
                        fontSize: 11, fontWeight: 700, fontFamily: '"Cinzel", serif',
                        padding: '2px 7px', borderRadius: 3, letterSpacing: '0.06em',
                      }}>
                        {badge.label}
                      </span>
                      {item.type === 'kobold' && item.koboldData && (
                        <span style={{
                          background: SPECIES_COLOR[item.koboldData.species] + '33',
                          color: SPECIES_COLOR[item.koboldData.species],
                          fontSize: 11, padding: '2px 6px', borderRadius: 3,
                        }}>
                          {item.koboldData.species}
                        </span>
                      )}
                      {item.purchased && (
                        <span style={{ fontSize: 12, color: `${PARCHMENT}60`, fontStyle: 'italic' }}>
                          ✓ purchased
                        </span>
                      )}
                    </div>

                    {/* Label */}
                    <div style={{
                      fontFamily: '"Cinzel", serif', fontWeight: 700,
                      color: PARCHMENT, fontSize: 17,
                    }}>
                      {item.label}
                    </div>

                    {/* Description */}
                    <div style={{
                      fontFamily: '"Crimson Text", serif',
                      color: `${PARCHMENT}90`, fontSize: 16, lineHeight: 1.45,
                    }}>
                      {item.description}
                    </div>

                    {/* Cost + buy row */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                      <div style={{
                        fontFamily: '"Cinzel", serif', fontWeight: 700,
                        color: canAfford ? GOLD : DANGER, fontSize: 16,
                      }}>
                        🪙 {item.cost} gold
                      </div>
                      {!item.purchased && (
                        <button
                          onClick={() => handleBuy(item.id, item.cost)}
                          disabled={isDisabled}
                          style={{
                            padding: '6px 16px',
                            background: isDisabled ? '#2C181030' : GOLD,
                            border: `2px solid ${isDisabled ? '#2C181050' : INK}`,
                            borderRadius: 4, cursor: isDisabled ? 'default' : 'pointer',
                            fontFamily: '"Cinzel", serif', fontWeight: 700,
                            color: isDisabled ? `${PARCHMENT}40` : INK,
                            fontSize: 15, opacity: isDisabled ? 0.6 : 1,
                          }}
                        >
                          {!canAfford ? 'Cannot Afford' : 'Buy'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
