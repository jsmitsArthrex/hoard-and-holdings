import { useState } from 'react';
import type { District, Property } from '../../data/districts';

type Biome = 'volcanic' | 'forest' | 'swamp' | 'coastal' | 'mountain' | 'plains' | 'desert' | 'tundra' | 'ruins' | 'cursed';

interface DMeta { cx: number; cy: number; biome: Biome }

// Tile dimensions
const TILE = 40;
const GAP  = 3;
// Tiles are offset 12px below the district centre so the label fits above
const TY_OFFSET = 12;

// District positions scaled 0.72 toward centre (500,500) to cluster into a cohesive landmass
const DISTRICT_META: Record<string, DMeta> = {
  district_00: { cx: 335, cy: 282, biome: 'mountain' },
  district_01: { cx: 604, cy: 335, biome: 'swamp'    },
  district_02: { cx: 718, cy: 465, biome: 'coastal'  },
  district_03: { cx: 478, cy: 396, biome: 'volcanic' },
  district_04: { cx: 278, cy: 592, biome: 'tundra'   },
  district_05: { cx: 672, cy: 649, biome: 'coastal'  },
  district_06: { cx: 535, cy: 539, biome: 'plains'   },
  district_07: { cx: 404, cy: 473, biome: 'forest'   },
  district_08: { cx: 588, cy: 722, biome: 'ruins'    },
  district_09: { cx: 335, cy: 722, biome: 'cursed'   },
};

// Returns the top-left corner of property tile i in a 3+2 grid centred at (cx, cy)
function propTilePos(cx: number, cy: number, i: number): [number, number] {
  const row = i < 3 ? 0 : 1;
  const col = i < 3 ? i : i - 3;
  const rowCount = row === 0 ? 3 : 2;
  const rowWidth = rowCount * TILE + (rowCount - 1) * GAP;
  const px = cx - rowWidth / 2 + col * (TILE + GAP);
  const py = cy + TY_OFFSET - (2 * TILE + GAP) / 2 + row * (TILE + GAP);
  return [px, py];
}

const BIOME: Record<Biome, { fill: string; ring: string; icon: string }> = {
  volcanic: { fill: '#7A2A10', ring: '#CC4420', icon: '🔥' },
  forest:   { fill: '#1A5A1A', ring: '#2D8A2D', icon: '🌲' },
  swamp:    { fill: '#3A5A20', ring: '#5A7A3A', icon: '🌿' },
  coastal:  { fill: '#1A4A6A', ring: '#4A8AAA', icon: '🌊' },
  mountain: { fill: '#4A4A5A', ring: '#7A7A9A', icon: '⛰'  },
  plains:   { fill: '#5A5010', ring: '#9A8A30', icon: '🌾' },
  desert:   { fill: '#7A6010', ring: '#C4A020', icon: '☀'  },
  tundra:   { fill: '#2A4A6A', ring: '#6A9ACA', icon: '❄'  },
  ruins:    { fill: '#4A4A4A', ring: '#7A7A7A', icon: '🏚' },
  cursed:   { fill: '#3A0A6A', ring: '#8A3AAA', icon: '💀' },
};

const RIVAL_CLR = ['#CC2222', '#8822CC', '#22AACC', '#CC6622'];
const SIZE_LABELS: Record<string, string> = { small: 'Small', medium: 'Medium', large: 'Large', grand: 'Grand' };

export interface RivalEntry {
  rivalId: number;
  propertyIds: string[];
  rivalName?: string;
}

interface Props {
  districts: District[];
  properties: Property[];
  onPropertyClick: (id: string) => void;
  playerPropertyIds: string[];
  rivalPropertyIds: RivalEntry[];
  fogOfWar: Set<string>;
}

interface Tooltip {
  name: string; districtName: string;
  goldPrice: number; lairSize: string;
  x: number; y: number;
}

export default function WorldMap({
  districts, onPropertyClick, playerPropertyIds, rivalPropertyIds, fogOfWar,
}: Props) {
  const [tooltip, setTooltip] = useState<Tooltip | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const SIZE = 1000;
  const VB_X = 150, VB_Y = 195, VB_W = 700, VB_H = 620;

  const playerSet = new Set(playerPropertyIds);
  const rivalMap = new Map<string, number>();
  rivalPropertyIds.forEach(({ rivalId, propertyIds }) =>
    propertyIds.forEach(p => rivalMap.set(p, rivalId)));

  const ownerStroke = (id: string): string => {
    if (playerSet.has(id)) return '#C9A227';
    const r = rivalMap.get(id);
    return r != null ? RIVAL_CLR[r % RIVAL_CLR.length] : '#8A7A6A';
  };
  const ownerSW = (id: string): number =>
    playerSet.has(id) ? 3.5 : rivalMap.has(id) ? 3 : 1.5;

  const handleTileClick = (e: React.MouseEvent, propId: string) => {
    e.stopPropagation();
    setSelectedId(propId === selectedId ? null : propId);
    onPropertyClick(propId);
  };

  return (
    <div style={{
      background: '#C4934A', padding: 12, borderRadius: 8,
      display: 'inline-block', position: 'relative',
      boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
    }}>
      <svg
        width={560} height={496}
        viewBox={`${VB_X} ${VB_Y} ${VB_W} ${VB_H}`}
        style={{ display: 'block', border: '3px solid #2C1810' }}
        onMouseLeave={() => setTooltip(null)}
      >
        <defs>
          <filter id="wm-rough">
            <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="2" result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale="2.5" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>

        {/* Parchment background */}
        <rect width={SIZE} height={SIZE} fill="#C4934A" />

        {/* Continent landmass blob */}
        <path
          d="M 275 190 C 370 148,560 168,658 242 C 748 288,812 372,808 462 C 814 562,782 642,752 702 C 732 772,672 842,592 848 C 512 866,418 862,312 844 C 232 832,158 758,154 658 C 148 576,168 448,204 356 C 224 286,248 202,275 190 Z"
          fill="#A87838"
          opacity={0.28}
        />

        {/* Hand-drawn grid lines */}
        <g filter="url(#wm-rough)" stroke="#2C1810" strokeWidth="0.6" opacity="0.2">
          {Array.from({ length: 13 }, (_, i) => (
            <g key={i}>
              <line x1={i * 80} y1={0} x2={i * 80} y2={SIZE} />
              <line x1={0} y1={i * 80} x2={SIZE} y2={i * 80} />
            </g>
          ))}
        </g>

        {/* District region ellipses */}
        {districts.map(d => {
          const m = DISTRICT_META[d.id];
          if (!m) return null;
          const b = BIOME[m.biome];
          const fog = fogOfWar.has(d.id);
          return (
            <g key={`rgn-${d.id}`}>
              <ellipse
                cx={m.cx} cy={m.cy + TY_OFFSET / 2} rx={118} ry={102}
                fill={fog ? '#141420' : b.fill}
                stroke={fog ? '#333' : b.ring}
                strokeWidth={1.5}
                opacity={fog ? 0.55 : 0.42}
              />
              {fog ? (
                <text x={m.cx} y={m.cy + TY_OFFSET / 2 + 7}
                  textAnchor="middle" fontSize={22} fill="#3A3A4A">?</text>
              ) : (
                <>
                  <text x={m.cx} y={m.cy - 57}
                    textAnchor="middle" fontSize={14}>{b.icon}</text>
                  <text
                    x={m.cx} y={m.cy - 42}
                    textAnchor="middle" fontSize={12}
                    fill="#D4B896" fontFamily="Cinzel, serif"
                    stroke="#1A0A00" strokeWidth={3} paintOrder="stroke"
                    style={{ userSelect: 'none' }}
                  >
                    {d.name.length > 16 ? d.name.slice(0, 15) + '…' : d.name}
                  </text>
                </>
              )}
            </g>
          );
        })}

        {/* Individual property tile nodes */}
        {districts.map(d => {
          const m = DISTRICT_META[d.id];
          if (!m) return null;
          const b = BIOME[m.biome];
          const fog = fogOfWar.has(d.id);
          return d.properties.map((p, i) => {
            const [px, py] = propTilePos(m.cx, m.cy, i);
            const tcx = px + TILE / 2;
            const tcy = py + TILE / 2;
            const isPlayer = playerSet.has(p.id);
            const isRival = rivalMap.has(p.id);
            const oc = ownerStroke(p.id);
            const sw = ownerSW(p.id);
            const isSelected = selectedId === p.id;

            if (fog) {
              return (
                <rect key={p.id}
                  x={px} y={py} width={TILE} height={TILE}
                  fill="#1A1A28" stroke="#333" strokeWidth={1}
                  rx={3} opacity={0.7} />
              );
            }
            return (
              <g key={p.id}
                onClick={e => handleTileClick(e, p.id)}
                onMouseEnter={() => setTooltip({
                  name: p.name, districtName: d.name,
                  goldPrice: p.goldPrice, lairSize: p.lairSize,
                  x: tcx, y: py,
                })}
                onMouseLeave={() => setTooltip(null)}
                style={{ cursor: 'pointer' }}
              >
                {/* Selection / player ownership glow */}
                {(isPlayer || isSelected) && (
                  <rect
                    x={px - 4} y={py - 4}
                    width={TILE + 8} height={TILE + 8}
                    fill="none"
                    stroke={isSelected ? '#FFD700' : '#C9A227'}
                    strokeWidth={isSelected ? 3 : 4}
                    rx={5}
                    opacity={0.38}
                  />
                )}
                {/* Main tile */}
                <rect
                  x={px} y={py} width={TILE} height={TILE}
                  fill={b.fill}
                  stroke={oc}
                  strokeWidth={sw}
                  rx={3}
                />
                {/* Owner icon centred in tile */}
                {isPlayer && (
                  <text x={tcx} y={tcy + 5} textAnchor="middle"
                    fontSize={14} fill="#FFD700" pointerEvents="none">♛</text>
                )}
                {!isPlayer && isRival && (
                  <text x={tcx} y={tcy + 5} textAnchor="middle"
                    fontSize={12} fill={oc} pointerEvents="none">⚔</text>
                )}
              </g>
            );
          });
        })}

        {/* Per-property tooltip */}
        {tooltip && (() => {
          const { name, districtName, goldPrice, lairSize, x, y } = tooltip;
          const TW = 190, TH = 76;
          const tx = Math.min(Math.max(x - TW / 2, VB_X + 4), VB_X + VB_W - TW - 4);
          const ty = y - TH - 10 < VB_Y + 4 ? y + TILE + 8 : y - TH - 10;
          return (
            <g pointerEvents="none">
              <rect x={tx} y={ty} width={TW} height={TH}
                fill="#2C1810" rx={4} opacity={0.96} />
              <rect x={tx} y={ty} width={TW} height={TH}
                fill="none" stroke="#C9A227" strokeWidth={1} rx={4} opacity={0.55} />
              <text x={tx + TW / 2} y={ty + 21} textAnchor="middle"
                fontSize={13} fill="#C9A227" fontFamily="Cinzel, serif" fontWeight={600}>
                {name.length > 22 ? name.slice(0, 21) + '…' : name}
              </text>
              <text x={tx + TW / 2} y={ty + 42} textAnchor="middle"
                fontSize={11} fill="#D4B896" fontFamily="Crimson Text, serif">
                {districtName}
              </text>
              <text x={tx + TW / 2} y={ty + 61} textAnchor="middle"
                fontSize={11} fill="#D4B896" fontFamily="Crimson Text, serif">
                {SIZE_LABELS[lairSize] ?? lairSize} · {goldPrice}g
              </text>
            </g>
          );
        })()}
      </svg>
    </div>
  );
}
