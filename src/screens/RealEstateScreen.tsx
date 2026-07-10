import { useState } from 'react';
import { ArrowLeft, MapPin, Skull, Zap } from 'lucide-react';
import NPCPortrait from '../components/npcs/NPCPortrait';
import { useGameStore } from '../store/gameStore';
import { playSound } from '../audio/audioEngine';
import ContractCard from '../components/ui/ContractCard';
import { districts } from '../data/districts';
import type { Property } from '../data/districts';
import { PROPERTY_UPGRADES } from '../data/propertyUpgrades';

const INK = '#2C1810';
const PARCHMENT = '#C4934A';
const GOLD = '#C9A227';

const REALTOR_LINES = [
  "Ah, a distinguished client! Welcome to Grixle's Realty — where every lair comes with authentic dungeon ambiance, included at no extra cost.",
  "Business has been brisk since the dragon plague cleared up the inventory. So many motivated sellers!",
  "Between you and me, the Cursed Wastes are undervalued. A bit of existential dread never hurt resale value.",
  "My commission is only 10%... which I've already included in the price. Saves us both an awkward conversation.",
  "The market rewards the bold! Or so I tell everyone who's paid too much. It seems to help.",
];

const OFFER_LINES = [
  "Excellent choice! The previous occupant left in quite a hurry. Some say his screaming echoes on cold nights. Charming, really.",
  "Ah, that property! The bones are solid. Mostly actual bones from former adventurers, but architecturally sound.",
  "A fine selection. I'll need a deposit, a signature, and your firstborn scale. Just kidding. Mostly.",
  "Perfect taste! This one comes with a complimentary infestation of minor imps. Think of it as a security system.",
];

const SIZE_ORDER: Record<string, number> = { small: 0, medium: 1, large: 2, grand: 3 };

function getOwnerLabel(propId: string, playerIds: string[], rivals: { name: string; propertyIds: string[] }[]) {
  if (playerIds.includes(propId)) return { text: '👑 Yours', color: GOLD };
  const rival = rivals.find(r => r.propertyIds.includes(propId));
  if (rival) return { text: `⚔️ ${rival.name}`, color: '#CC6644' };
  return null;
}

export default function RealEstateScreen() {
  const { gold, playerPropertyIds, rivals, highlightedPropertyId, activeContracts, day, buyProperty, setActiveScreen, logEvent, activePropertyAuction, placeBid, resolvePropertyAuction, propertyUpgrades, buildPropertyUpgrade, playerPropertyAcquiredDays, statusEffects } = useGameStore();
  const isFrozen = statusEffects.some(e => e.affectedStat === 'propertyFreeze');

  const grixleContract = (activeContracts ?? []).find(c => c.npcId === 'grixle' && !c.completed && !c.failed);
  const [dialogueLine, setDialogueLine] = useState(REALTOR_LINES[Math.floor(Math.random() * REALTOR_LINES.length)]);
  const [selectedReply, setSelectedReply] = useState<number | null>(null);
  const [confirmProp, setConfirmProp] = useState<Property | null>(null);
  const [searchFilter, setSearchFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [bidInput, setBidInput] = useState<number>(0);
  const PAGE_SIZE = 10;

  const allProperties = districts.flatMap(d =>
    d.properties.map(p => ({ ...p, districtName: d.name }))
  );

  const owned = new Set(playerPropertyIds);
  const rivalMap = new Map<string, string>();
  rivals.forEach(r => r.propertyIds.forEach(id => rivalMap.set(id, r.name)));

  const auctionPropId = activePropertyAuction?.propertyId ?? null;

  const available = allProperties
    .filter(p => !owned.has(p.id) && !rivalMap.has(p.id))
    .filter(p => searchFilter === '' || p.name.toLowerCase().includes(searchFilter.toLowerCase()) || p.districtName.toLowerCase().includes(searchFilter.toLowerCase()))
    .sort((a, b) => {
      if (a.id === auctionPropId) return -1;
      if (b.id === auctionPropId) return 1;
      return a.goldPrice - b.goldPrice;
    });

  const totalPages = Math.max(1, Math.ceil(available.length / PAGE_SIZE));
  const pagedProperties = available.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const REPLIES = [
    { text: "What's selling fast?", response: "Everything under 200 gold goes within a day. The low-danger districts are popular with cautious buyers." },
    { text: "Any hidden gems?", response: "The Cursed Wastes properties are dirt cheap. The dirt there is cursed, but still. Excellent value!" },
    { text: "How's the market?", response: "Volatile. Between adventurer incursions and rival dragon acquisitions, prices fluctuate wildly. Buy now!" },
  ];

  const handleOffer = (prop: Property) => {
    setDialogueLine(OFFER_LINES[Math.floor(Math.random() * OFFER_LINES.length)]);
    setConfirmProp(prop);
  };

  const confirmPurchase = () => {
    if (!confirmProp) return;
    playSound('coinLoss');
    buyProperty(confirmProp.id, confirmProp.goldPrice);
    setDialogueLine(`And with that, ${confirmProp.name} is yours! A fine addition to any hoard portfolio.`);
    setConfirmProp(null);
  };

  return (
    <div style={{ display: 'flex', height: '100%', fontFamily: '"Crimson Text", Georgia, serif', background: '#0D0500' }}>

      {/* ── Left: NPC Dialogue ── */}
      <div style={{
        width: 320, flexShrink: 0, background: '#1A0800',
        borderRight: `2px solid ${PARCHMENT}30`, display: 'flex', flexDirection: 'column',
        padding: '20px',
      }}>
        <button
          onClick={() => setActiveScreen('hub')}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'none', border: 'none', color: PARCHMENT, cursor: 'pointer',
            fontFamily: '"Cinzel", serif', fontSize: 17, marginBottom: 16, padding: 0,
          }}
        >
          <ArrowLeft size={19} /> Return to Lair
        </button>

        <div style={{ alignSelf: 'center', marginBottom: 12 }}>
          <NPCPortrait role="goblin-realtor" size={96} />
        </div>

        <div style={{
          fontFamily: '"Cinzel", serif', fontWeight: 700, color: PARCHMENT, fontSize: 20, marginBottom: 2,
        }}>
          Grixle the Goblin
        </div>
        <div style={{ fontSize: 17, color: '#C4934A60', marginBottom: 14 }}>
          Licensed Lair Agent · Est. 847
        </div>

        {/* Dialogue bubble */}
        <div style={{
          background: '#2C181040', border: `1px solid ${PARCHMENT}30`,
          borderRadius: 6, padding: '12px 14px', fontSize: 19, color: '#E8D5A0',
          lineHeight: 1.6, marginBottom: 14, minHeight: 60, maxHeight: 120, overflowY: 'auto',
          fontStyle: 'italic',
        }}>
          "{dialogueLine}"
        </div>

        <ContractCard contract={grixleContract} currentDay={day} />

        {/* Player replies */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {REPLIES.map((r, i) => (
            <button
              key={i}
              onClick={() => {
                setSelectedReply(i);
                setDialogueLine(r.response);
                setConfirmProp(null);
              }}
              style={{
                padding: '8px 10px', textAlign: 'left', fontSize: 18,
                background: selectedReply === i ? '#2C181060' : '#2C181030',
                border: `1px solid ${selectedReply === i ? PARCHMENT + '80' : PARCHMENT + '20'}`,
                borderRadius: 4, color: '#E8D5A0', cursor: 'pointer',
              }}
            >
              "{r.text}"
            </button>
          ))}
        </div>

        {/* Confirm purchase dialogue */}
        {confirmProp && (
          <div style={{ marginTop: 14, background: '#3C180A', border: `1px solid ${GOLD}40`, borderRadius: 6, padding: '12px 14px' }}>
            <div style={{ fontSize: 18, color: GOLD, fontFamily: '"Cinzel", serif', marginBottom: 6 }}>
              Confirm Purchase
            </div>
            <div style={{ fontSize: 18, color: '#E8D5A0', marginBottom: 10 }}>
              {confirmProp.name} · {confirmProp.goldPrice} gold
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                onClick={() => setConfirmProp(null)}
                style={{ flex: 1, padding: '8px', background: 'transparent', border: `1px solid ${PARCHMENT}40`, borderRadius: 4, color: PARCHMENT, cursor: 'pointer', fontSize: 17 }}
              >
                Nevermind
              </button>
              <button
                onClick={confirmPurchase}
                disabled={gold < confirmProp.goldPrice}
                style={{
                  flex: 2, padding: '8px', background: gold >= confirmProp.goldPrice ? GOLD : '#4A3A00',
                  border: 'none', borderRadius: 4, color: INK, cursor: gold >= confirmProp.goldPrice ? 'pointer' : 'not-allowed',
                  fontFamily: '"Cinzel", serif', fontWeight: 700, fontSize: 17,
                }}
              >
                {gold < confirmProp.goldPrice ? 'Insufficient Gold' : '🪙 Buy Now'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Right: Property Listings ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>

        {/* Winter freeze notice */}
        {isFrozen && (
          <div style={{
            background: '#0A1A2A', border: '2px solid #4A9ECC60',
            borderRadius: 6, padding: '10px 14px', marginBottom: 12,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <span style={{ fontSize: 20 }}>❄️</span>
            <span style={{ fontFamily: '"Cinzel", serif', fontWeight: 700, color: '#4A9ECC', fontSize: 17 }}>
              Roads Frozen
            </span>
            <span style={{ color: '#4A9ECC80', fontSize: 17 }}>
              — Mountain passes sealed. No property purchases until the thaw.
            </span>
          </div>
        )}

        {/* Active auction banner */}
        {activePropertyAuction && (() => {
          const aucProp = allProperties.find(p => p.id === activePropertyAuction.propertyId);
          const leaderName = activePropertyAuction.currentLeader === 'player'
            ? '👑 You'
            : `⚔️ ${rivals.find(r => r.id === activePropertyAuction.currentLeader)?.name ?? 'Rival'}`;
          return (
            <div style={{
              background: '#2A1400', border: `2px solid #FF8C00`,
              borderRadius: 6, padding: '10px 14px', marginBottom: 16,
              display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
            }}>
              <Zap size={18} color="#FF8C00" />
              <span style={{ fontFamily: '"Cinzel", serif', fontWeight: 700, color: '#FF8C00', fontSize: 17 }}>
                LIVE AUCTION:
              </span>
              <span style={{ color: '#E8D5A0', fontSize: 17 }}>
                {aucProp?.name ?? activePropertyAuction.propertyId}
              </span>
              <span style={{ color: '#C4934A80', fontSize: 16 }}>
                Current bid: {activePropertyAuction.currentBid}g · {leaderName} leads · {activePropertyAuction.roundsLeft} bid{activePropertyAuction.roundsLeft !== 1 ? 's' : ''} left
              </span>
              <button
                onClick={() => resolvePropertyAuction()}
                style={{
                  marginLeft: 'auto', padding: '5px 12px', background: '#3A1A00',
                  border: `1px solid #FF8C0060`, borderRadius: 4,
                  color: '#FF8C00', fontSize: 16, cursor: 'pointer',
                  fontFamily: '"Cinzel", serif',
                }}
              >
                Concede
              </button>
            </div>
          );
        })()}

        <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <div>
            <h2 style={{ fontFamily: '"Cinzel", serif', color: PARCHMENT, fontSize: 20, fontWeight: 700, margin: 0 }}>
              Available Properties
            </h2>
            <p style={{ color: '#C4934A60', fontSize: 18, margin: '2px 0 0' }}>
              {available.length} listings · Your gold: 🪙 {gold}
            </p>
          </div>
          <input
            placeholder="Search by name or district…"
            value={searchFilter}
            onChange={e => { setSearchFilter(e.target.value); setCurrentPage(1); }}
            style={{
              padding: '7px 12px', background: '#2C181040',
              border: `1px solid ${PARCHMENT}30`, borderRadius: 4,
              color: PARCHMENT, fontSize: 18, outline: 'none', width: 220,
            }}
          />
        </div>

        {available.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#C4934A40', fontSize: 21, marginTop: 60, fontStyle: 'italic' }}>
            No properties match your search.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
            {pagedProperties.map(prop => {
              const canAfford = gold >= prop.goldPrice;
              const isHighlighted = prop.id === highlightedPropertyId;
              return (
                <div
                  key={prop.id}
                  style={{
                    background: isHighlighted ? '#2C181050' : '#2C181025',
                    border: `2px solid ${isHighlighted ? GOLD : PARCHMENT + '25'}`,
                    borderRadius: 6, padding: '14px',
                    display: 'flex', flexDirection: 'column', gap: 8,
                    transition: 'border-color 0.2s',
                  }}
                >
                  <div style={{ fontFamily: '"Cinzel", serif', fontWeight: 700, color: PARCHMENT, fontSize: 19, lineHeight: 1.2 }}>
                    {prop.name}
                  </div>
                  <div style={{ fontSize: 17, color: '#C4934A70' }}>{(prop as typeof prop & { districtName: string }).districtName}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 20, fontWeight: 700, color: canAfford ? GOLD : '#8A7A40' }}>
                      🪙 {prop.goldPrice}
                    </span>
                    <span style={{ background: INK + '80', color: PARCHMENT, padding: '2px 6px', borderRadius: 8, fontSize: 16 }}>
                      {prop.lairSize}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <MapPin size={16} color='#C4934A60' />
                    <span style={{ fontSize: 16, color: '#C4934A60' }}>{prop.distanceFromCity.toFixed(1)} leagues</span>
                    <div style={{ marginLeft: 'auto', fontSize: 18 }}>
                      {Array.from({ length: 5 }, (_, i) => (
                        <Skull key={i} size={15} color={i < prop.dangerRating ? '#8B1A1A' : '#3A3A3A'} />
                      ))}
                    </div>
                  </div>
                  {prop.id === auctionPropId && activePropertyAuction ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div style={{
                        background: '#2A1400', border: `1px solid #FF8C0080`,
                        borderRadius: 4, padding: '6px 8px',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
                          <Zap size={13} color="#FF8C00" />
                          <span style={{ fontFamily: '"Cinzel", serif', fontWeight: 700, color: '#FF8C00', fontSize: 15 }}>
                            AUCTION
                          </span>
                          <span style={{ marginLeft: 'auto', color: '#C4934A80', fontSize: 14 }}>
                            {activePropertyAuction.roundsLeft} left
                          </span>
                        </div>
                        <div style={{ fontSize: 14, color: '#E8D5A0', marginBottom: 2 }}>
                          Bid: {activePropertyAuction.currentBid}g
                        </div>
                        <div style={{ fontSize: 13, color: '#C4934A80' }}>
                          {activePropertyAuction.currentLeader === 'player'
                            ? '👑 You lead'
                            : `⚔️ ${rivals.find(r => r.id === activePropertyAuction.currentLeader)?.name ?? 'Rival'} leads`}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <input
                          type="number"
                          min={activePropertyAuction.currentBid + 5}
                          value={bidInput > 0 ? bidInput : activePropertyAuction.currentBid + 5}
                          onChange={e => setBidInput(Number(e.target.value))}
                          style={{
                            flex: 1, minWidth: 0, padding: '5px 6px',
                            background: '#2C181050', border: `1px solid ${PARCHMENT}40`,
                            borderRadius: 4, color: PARCHMENT, fontSize: 15, outline: 'none',
                          }}
                        />
                        <button
                          onClick={() => {
                            const bid = bidInput > 0 ? bidInput : activePropertyAuction.currentBid + 5;
                            if (bid >= activePropertyAuction.currentBid + 5 && gold >= bid) {
                              playSound('coinLoss');
                              placeBid(bid);
                              setBidInput(0);
                            }
                          }}
                          disabled={gold < (bidInput > 0 ? bidInput : activePropertyAuction.currentBid + 5)}
                          style={{
                            padding: '5px 8px', background: '#FF8C00',
                            border: 'none', borderRadius: 4, color: INK,
                            fontFamily: '"Cinzel", serif', fontWeight: 700, fontSize: 14,
                            cursor: gold >= (bidInput > 0 ? bidInput : activePropertyAuction.currentBid + 5) ? 'pointer' : 'not-allowed',
                            opacity: gold < (bidInput > 0 ? bidInput : activePropertyAuction.currentBid + 5) ? 0.5 : 1,
                          }}
                        >
                          ⚡ Bid
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleOffer(prop)}
                      disabled={!canAfford || isFrozen}
                      style={{
                        padding: '8px', width: '100%',
                        background: canAfford && !isFrozen ? GOLD : '#2C181040',
                        border: `1px solid ${canAfford && !isFrozen ? INK : PARCHMENT + '20'}`,
                        borderRadius: 4, color: canAfford && !isFrozen ? INK : '#C4934A40',
                        fontFamily: '"Cinzel", serif', fontWeight: 700, fontSize: 17,
                        cursor: canAfford && !isFrozen ? 'pointer' : 'not-allowed',
                      }}
                    >
                      {isFrozen ? '❄️ Roads Frozen' : canAfford ? '📜 Make Offer' : 'Need more gold'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 18 }}>
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              style={{
                padding: '6px 16px', background: currentPage === 1 ? '#2C181030' : '#2C181060',
                border: `1px solid ${PARCHMENT}${currentPage === 1 ? '20' : '50'}`,
                borderRadius: 4, color: currentPage === 1 ? '#C4934A30' : PARCHMENT,
                fontFamily: '"Cinzel", serif', fontSize: 17, cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
              }}
            >
              ← Prev
            </button>
            <span style={{ fontFamily: '"Cinzel", serif', fontSize: 18, color: PARCHMENT }}>
              Page {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              style={{
                padding: '6px 16px', background: currentPage === totalPages ? '#2C181030' : '#2C181060',
                border: `1px solid ${PARCHMENT}${currentPage === totalPages ? '20' : '50'}`,
                borderRadius: 4, color: currentPage === totalPages ? '#C4934A30' : PARCHMENT,
                fontFamily: '"Cinzel", serif', fontSize: 17, cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
              }}
            >
              Next →
            </button>
          </div>
        )}

        {/* Player-owned section */}
        {playerPropertyIds.length > 0 && (
          <div style={{ marginTop: 24 }}>
            <div style={{ fontFamily: '"Cinzel", serif', color: GOLD, fontSize: 19, fontWeight: 700, marginBottom: 10 }}>
              YOUR HOLDINGS ({playerPropertyIds.length})
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 10 }}>
              {playerPropertyIds.map(id => {
                const prop = allProperties.find(p => p.id === id);
                if (!prop) return null;
                const acquiredDay = (playerPropertyAcquiredDays ?? {})[id] ?? day;
                const daysOwned = day - acquiredDay;
                const builtUpgrades = (propertyUpgrades ?? []).filter(u => u.propertyId === id);
                const builtIds = new Set(builtUpgrades.map(u => u.upgradeId));
                const availableUpgrades = PROPERTY_UPGRADES.filter(u => {
                  if (builtIds.has(u.id)) return false;
                  if (daysOwned < u.minDaysOwned) return false;
                  if (u.requiresLairSize && SIZE_ORDER[prop.lairSize] < SIZE_ORDER[u.requiresLairSize]) return false;
                  return true;
                });
                const lockedUpgrades = PROPERTY_UPGRADES.filter(u => {
                  if (builtIds.has(u.id)) return false;
                  if (u.requiresLairSize && SIZE_ORDER[prop.lairSize] < SIZE_ORDER[u.requiresLairSize]) return false;
                  return daysOwned < u.minDaysOwned;
                });
                return (
                  <div key={id} style={{
                    background: '#C9A22710', border: `1px solid ${GOLD}40`,
                    borderRadius: 6, padding: '12px 14px',
                    display: 'flex', flexDirection: 'column', gap: 8,
                  }}>
                    <div style={{ fontFamily: '"Cinzel", serif', fontWeight: 700, color: GOLD, fontSize: 18, lineHeight: 1.2 }}>
                      👑 {prop.name}
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                      <span style={{ background: INK + '80', color: PARCHMENT, padding: '2px 6px', borderRadius: 8, fontSize: 15 }}>
                        {prop.lairSize}
                      </span>
                      <span style={{ fontSize: 15, color: '#C4934A60' }}>
                        {daysOwned > 0 ? `Owned ${daysOwned}d` : 'Acquired today'}
                      </span>
                    </div>
                    {builtUpgrades.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        {builtUpgrades.map(bu => {
                          const uDef = PROPERTY_UPGRADES.find(u => u.id === bu.upgradeId);
                          if (!uDef) return null;
                          return (
                            <div key={bu.upgradeId} style={{
                              display: 'flex', alignItems: 'center', gap: 6,
                              background: '#0E2B0E', border: '1px solid #2D6A2D40',
                              borderRadius: 4, padding: '4px 8px', fontSize: 15, color: '#6DB96D',
                            }}>
                              <span>{uDef.icon}</span>
                              <span>{uDef.name}</span>
                              <span style={{ marginLeft: 'auto', fontWeight: 700, color: '#4DAA4D' }}>✓</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    {availableUpgrades.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <div style={{ fontSize: 13, color: '#C4934A60', fontFamily: '"Cinzel", serif', letterSpacing: '0.05em' }}>UPGRADES</div>
                        {availableUpgrades.map(u => (
                          <div key={u.id} style={{
                            background: '#2C181028', border: `1px solid ${PARCHMENT}18`,
                            borderRadius: 4, padding: '7px 8px', display: 'flex', flexDirection: 'column', gap: 3,
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                              <span style={{ fontSize: 16 }}>{u.icon}</span>
                              <span style={{ fontFamily: '"Cinzel", serif', fontWeight: 700, color: PARCHMENT, fontSize: 15 }}>
                                {u.name}
                              </span>
                              <span style={{ marginLeft: 'auto', fontSize: 15, color: gold >= u.cost ? GOLD : '#6A5A20', fontWeight: 700 }}>
                                🪙 {u.cost}
                              </span>
                            </div>
                            <div style={{ fontSize: 14, color: '#C4934A70' }}>{u.effectSummary}</div>
                            <button
                              onClick={() => buildPropertyUpgrade(id, u.id)}
                              disabled={gold < u.cost}
                              style={{
                                padding: '5px 8px', marginTop: 2,
                                background: gold >= u.cost ? PARCHMENT + '25' : '#2C181018',
                                border: `1px solid ${gold >= u.cost ? PARCHMENT + '55' : PARCHMENT + '12'}`,
                                borderRadius: 4,
                                color: gold >= u.cost ? PARCHMENT : '#C4934A28',
                                fontFamily: '"Cinzel", serif', fontWeight: 700, fontSize: 14,
                                cursor: gold >= u.cost ? 'pointer' : 'not-allowed',
                              }}
                            >
                              {gold >= u.cost ? '🔨 Build' : 'Need more gold'}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    {lockedUpgrades.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        {lockedUpgrades.map(u => (
                          <div key={u.id} style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            background: '#1A100820', border: `1px solid ${PARCHMENT}10`,
                            borderRadius: 4, padding: '4px 8px', fontSize: 14, color: '#C4934A30',
                          }}>
                            <span style={{ opacity: 0.4 }}>{u.icon}</span>
                            <span>{u.name}</span>
                            <span style={{ marginLeft: 'auto', color: '#C4934A30' }}>Day +{u.minDaysOwned - daysOwned}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
