const OWNERSHIP: { ringClr: string; ringW: number; icon: string; label: string }[] = [
  { ringClr: '#C9A227', ringW: 3.5, icon: '♛', label: 'Your Lair'    },
  { ringClr: '#CC2222', ringW: 3.0, icon: '⚔', label: 'Rival I'      },
  { ringClr: '#8822CC', ringW: 3.0, icon: '⚔', label: 'Rival II'     },
  { ringClr: '#8A7A6A', ringW: 1.5, icon: '',   label: 'Unclaimed'    },
];

const BIOMES: { fill: string; ring: string; icon: string; name: string }[] = [
  { fill: '#7A2A10', ring: '#CC4420', icon: '🔥', name: 'Volcanic' },
  { fill: '#1A5A1A', ring: '#2D8A2D', icon: '🌲', name: 'Forest'   },
  { fill: '#3A5A20', ring: '#5A7A3A', icon: '🌿', name: 'Swamp'    },
  { fill: '#1A4A6A', ring: '#4A8AAA', icon: '🌊', name: 'Coastal'  },
  { fill: '#4A4A5A', ring: '#7A7A9A', icon: '⛰',  name: 'Mountain' },
  { fill: '#5A5010', ring: '#9A8A30', icon: '🌾', name: 'Plains'   },
  { fill: '#2A4A6A', ring: '#6A9ACA', icon: '❄',  name: 'Tundra'   },
  { fill: '#4A4A4A', ring: '#7A7A7A', icon: '🏚', name: 'Ruins'    },
  { fill: '#3A0A6A', ring: '#8A3AAA', icon: '💀', name: 'Cursed'   },
];

export default function MapLegend() {
  return (
    <div style={{
      background: 'rgba(196, 147, 74, 0.96)',
      border: '2px solid #2C1810',
      borderRadius: 6,
      padding: '12px 14px',
      fontFamily: '"Crimson Text", serif',
      fontSize: 18,
      color: '#2C1810',
      minWidth: 160,
      boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
    }}>
      <div style={{
        fontFamily: '"Cinzel", serif', fontWeight: 600,
        marginBottom: 10, fontSize: 20,
      }}>
        Legend
      </div>

      {/* Ownership — outer ring colour */}
      <div style={{ marginBottom: 12 }}>
        <div style={{
          fontSize: 15, fontWeight: 600, textTransform: 'uppercase',
          letterSpacing: 1, marginBottom: 6, color: '#5A3A1A',
        }}>Ownership (ring)</div>
        {OWNERSHIP.map(({ ringClr, ringW, icon, label }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
            <svg width={24} height={24} style={{ flexShrink: 0 }}>
              <rect x={1} y={1} width={22} height={22} fill="none" stroke={ringClr} strokeWidth={ringW} rx={3} />
              <rect x={4} y={4} width={16} height={16} fill="#4A4A5A" stroke="#7A7A9A" strokeWidth={1.2} rx={2} />
              {icon && (
                <text x={12} y={15} textAnchor="middle" fontSize={7}
                  fill={ringClr === '#8A7A6A' ? '#D4B896' : ringClr}>{icon}</text>
              )}
            </svg>
            <span style={{ fontSize: 17 }}>{label}</span>
          </div>
        ))}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
          <svg width={24} height={24} style={{ flexShrink: 0 }}>
            <rect x={1} y={1} width={22} height={22} fill="#141420" stroke="#333" strokeWidth={1} rx={3} opacity={0.8} />
            <text x={12} y={16} textAnchor="middle" fontSize={11} fill="#3A3A4A">?</text>
          </svg>
          <span style={{ fontSize: 17 }}>Undiscovered</span>
        </div>
      </div>

      {/* District biomes — inner circle fill */}
      <div>
        <div style={{
          fontSize: 15, fontWeight: 600, textTransform: 'uppercase',
          letterSpacing: 1, marginBottom: 6, color: '#5A3A1A',
        }}>District (fill)</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px 8px' }}>
          {BIOMES.map(({ fill, ring, icon, name }) => (
            <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width={16} height={16} style={{ flexShrink: 0 }}>
                <rect x={1} y={1} width={14} height={14} fill={fill} stroke={ring} strokeWidth={1.2} rx={2} />
              </svg>
              <span style={{ fontSize: 16 }}>{icon} {name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
