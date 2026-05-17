import type { CSSProperties } from 'react';
import type { BreakoutSlotDef } from '../data/arena-breakout/templates';
import { getArenaItem } from '../lib/arena-items';

interface BreakoutSlotProps {
  slot: BreakoutSlotDef;
  value?: string;
  textValue?: string;
  isActive?: boolean;
  showFrame?: boolean;
  style?: CSSProperties;
  onClick?: () => void;
  onTextChange?: (value: string) => void;
}

export function BreakoutSlot({
  slot,
  value,
  textValue,
  isActive,
  showFrame,
  style,
  onClick,
  onTextChange,
}: BreakoutSlotProps) {
  const isText = slot.category === 'text-money' || slot.category === 'text-price';
  const isKnife = slot.category === 'knife';
  const isKnifeLg = slot.id.startsWith('knife-lg');
  const isHero = isKnifeLg || slot.id === 'profile' || slot.id === 'character';

  const frameClass =
    showFrame || isActive ? ' show-frame' : value ? '' : ' is-empty';

  if (isText) {
    return (
      <button
        type="button"
        className={`ab-slot ab-slot--overlay ab-slot--text ab-slot--${slot.id}${isActive ? ' is-active' : ''}${frameClass}`}
        data-slot={slot.id}
        style={style}
        onClick={onClick}
        title={`${slot.label} — คลิกเพื่อแก้`}
      >
        {showFrame && <span className="ab-slot__label">{slot.label}</span>}
        {isActive ? (
          <input
            className="ab-slot__text-input"
            value={textValue ?? ''}
            onChange={(e) => onTextChange?.(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            placeholder={slot.label}
            autoFocus
          />
        ) : (
          <strong>{textValue || (showFrame ? '—' : '')}</strong>
        )}
      </button>
    );
  }

  const item = value && !value.startsWith('data:') ? getArenaItem(value) : null;
  const imgSrc = value?.startsWith('data:') ? value : item?.imageUrl;

  return (
    <button
      type="button"
      className={`ab-slot ab-slot--overlay ab-slot--${slot.category}${isKnife ? ' ab-slot--knife' : ''}${isKnifeLg ? ' ab-slot--knife-lg' : ''}${isHero ? ' ab-slot--hero' : ''}${imgSrc ? ' has-image' : ''}${frameClass}`}
      data-slot={slot.id}
      style={style}
      onClick={onClick}
      title={slot.label}
    >
      {imgSrc ? (
        <img src={imgSrc} alt="" draggable={false} />
      ) : showFrame ? (
        <span className="ab-slot__placeholder">{slot.label}</span>
      ) : null}
    </button>
  );
}
