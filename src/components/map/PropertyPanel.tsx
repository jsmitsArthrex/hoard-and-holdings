import type { District, Property } from '../../data/districts';
import type { RivalEntry } from './WorldMap';

const SIZE_LABEL: Record<string, string> = {
  small: 'Small', medium: 'Medium', large: 'Large', grand: 'Grand',
};

interface Props {
  property: Property | null;
  district: District | null;
  onClose: () => void;
  onPropertyClick: (id: string) => void;
  playerPropertyIds: string[];
  rivalPropertyIds: (RivalEntry & { rivalName: string })[];
}

export default function PropertyPanel({
  property, district, onClose, onPropertyClick, playerPropertyIds, rivalPropertyIds,
}: Props) {
  if (!property || !district) return null;

  const isPlayer = playerPropertyIds.includes(property.id);
  const rival = rivalPropertyIds.find(r => r.propertyIds.includes(property.id));
  const ownerLabel = isPlayer ? 'Yours' : rival ? `Rival: ${rival.rivalName}` : 'Unclaimed';
  const ownerColor = isPlayer ? '#C9A227' : rival ? '#CC2222' : '#8A8A7A';
  const sizeLabel = SIZE_LABEL[property.lairSize] ?? property.lairSize;

  return (
    <div style={{
      position: 'fixed', top: 0, right: 0, height: '100%', width: 320,
      background: 'linear-gradient(160deg, #C4934A 0%, #B8803A 100%)',
      borderLeft: '3px solid #2C1810',
      display: 'flex', flexDirection: 'column', zIndex: 100,
      fontFamily: '"Crimson Text", serif',
      boxShadow: '-6px 0 28px rgba(0,0,0,0.6)',
      animation: 'ppSlideIn 0.25s ease-out',
    }}>
      <style>{`@keyframes ppSlideIn { from { transform: translateX(100%) } to { transform: translateX(0) } }`}</style>

      {/* Header */}
      <div style={{ padding: '20px 20px 14px', borderBottom: '2px solid #2C1810', position: 'relative' }}>
        <button
          onClick={onClose}
          aria-label="Close panel"
          style={{
            position: 'absolute', top: 14, right: 14, background: 'none',
            border: 'none', fontSize: 20, cursor: 'pointer', color: '#2C1810', lineHeight: 1,
          }}
        >✕</button>
        <div style={{
          fontFamily: '"Cinzel", serif', fontSize: 20, fontWeight: 600,
          color: '#2C1810', paddingRight: 34, marginBottom: 4, lineHeight: 1.3,
        }}>
          {property.name}
        </div>
        <div style={{ fontSize: 19, color: '#5A3A1A' }}>{district.name}</div>
      </div>

      {/* Body */}
      <div style={{
        padding: '16px 20px', flex: 1, overflowY: 'auto',
        display: 'flex', flexDirection: 'column', gap: 14,
      }}>
        {/* Price */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 26, fontWeight: 600, color: '#2C1810' }}>
          <span>🪙</span>
          <span>{property.goldPrice} gold</span>
        </div>

        {/* Size badge + Danger skulls */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <span style={{
            background: '#2C1810', color: '#D4B896', padding: '3px 12px',
            borderRadius: 12, fontSize: 18, fontFamily: '"Cinzel", serif',
          }}>{sizeLabel}</span>
          <div style={{ fontSize: 19 }}>
            {Array.from({ length: 5 }, (_, i) => (
              <span key={i} style={{ color: i < property.dangerRating ? '#8B1A1A' : '#4A4A4A' }}>☠</span>
            ))}
          </div>
        </div>

        {/* Flavor text */}
        <div style={{
          fontStyle: 'italic', fontSize: 20, color: '#3A2010', lineHeight: 1.6,
          padding: '10px 12px', background: 'rgba(0,0,0,0.1)', borderRadius: 4,
          border: '1px solid rgba(44,24,16,0.2)',
        }}>
          "A {sizeLabel.toLowerCase()} lair nestled within {district.name}. Legend speaks of{' '}
          {property.dangerRating >= 4
            ? 'great peril and fearsome power'
            : 'ancient gold and forgotten glory'}{' '}
          that lingers in these halls."
        </div>

        {/* Distance */}
        <div style={{ fontSize: 18, color: '#5A3A1A' }}>
          📍 {property.distanceFromCity.toFixed(1)} leagues from the city
        </div>

        {/* Owner status */}
        <div style={{ fontSize: 21, fontWeight: 600, color: ownerColor }}>
          {ownerLabel}
        </div>
      </div>

      {/* Action button */}
      <div style={{ padding: '16px 20px', borderTop: '2px solid #2C1810' }}>
        <button
          onClick={() => onPropertyClick(property.id)}
          style={{
            width: '100%', padding: '13px', cursor: 'pointer',
            background: isPlayer ? '#2C1810' : '#C9A227',
            color: isPlayer ? '#D4B896' : '#2C1810',
            border: '2px solid #2C1810', borderRadius: 4,
            fontFamily: '"Cinzel", serif', fontSize: 20, fontWeight: 600,
            letterSpacing: 0.5,
          }}
        >
          {isPlayer ? '⚔ Manage Lair' : '📜 Make an Offer'}
        </button>
      </div>
    </div>
  );
}
