import type { BreakoutSlotDef } from '../data/arena-breakout/templates';
import { getArenaItem } from '../lib/arena-items';

interface BreakoutSlotProps {
  slot: BreakoutSlotDef;
  value?: string;
  textValue?: string;
  onClick?: () => void;
}

export function BreakoutSlot({ slot, value, textValue, onClick }: BreakoutSlotProps) {
  const isText = slot.category === 'text-money' || slot.category === 'text-price';

  if (isText) {
    return (
      <div className={`ab-slot ab-slot--text ab-slot--${slot.id}`} data-slot={slot.id}>
        <span className="ab-slot__label">{slot.label}</span>
        <strong>{textValue || '—'}</strong>
      </div>
    );
  }

  const item = value && !value.startsWith('data:') ? getArenaItem(value) : null;
  const imgSrc = value?.startsWith('data:') ? value : item?.imageUrl;

  return (
    <button
      type="button"
      className={`ab-slot ab-slot--${slot.category}${imgSrc ? ' has-image' : ''}`}
      data-slot={slot.id}
      onClick={onClick}
      title={slot.label}
    >
      {imgSrc ? (
        <img src={imgSrc} alt="" draggable={false} />
      ) : (
        <span className="ab-slot__placeholder">{slot.label}</span>
      )}
    </button>
  );
}
