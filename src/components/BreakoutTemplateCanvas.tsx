import { forwardRef } from 'react';
import type { BreakoutEditorState } from '../data/types';
import { getArenaTemplate } from '../data/arena-breakout/templates';
import {
  ARENA_CANVAS_RATIO,
  getSlotRect,
} from '../data/arena-breakout/slot-layouts';
import { BreakoutSlot } from './BreakoutSlot';

interface Props {
  state: BreakoutEditorState;
  activeSlotId?: string | null;
  onSlotClick: (slotId: string) => void;
  onTextChange?: (slotId: 'money' | 'price', value: string) => void;
  /** แสดงกรอบช่องว่างตอนแก้ไข */
  showSlotFrames?: boolean;
}

export const BreakoutTemplateCanvas = forwardRef<HTMLDivElement, Props>(
  function BreakoutTemplateCanvas(
    { state, activeSlotId, onSlotClick, onTextChange, showSlotFrames = false },
    ref,
  ) {
    const tpl = getArenaTemplate(state.templateFamily);
    const bgUrl = tpl.variants.find((v) => v.id === state.variantId)?.preview;

    return (
      <div
        ref={ref}
        className={`ab-canvas ab-canvas--${state.templateFamily}${showSlotFrames ? ' show-frames' : ''}`}
        style={{ aspectRatio: ARENA_CANVAS_RATIO[state.templateFamily] }}
        data-export-root
      >
        {bgUrl && <img className="ab-canvas__bg" src={bgUrl} alt="" aria-hidden />}

        <div className="ab-canvas__slots">
          {tpl.slots.map((def) => {
            const rect = getSlotRect(state.templateFamily, def.id);
            if (!rect) return null;

            const textVal =
              def.id === 'money' ? state.money : def.id === 'price' ? state.price : undefined;
            const val = state.slots[def.id];

            return (
              <BreakoutSlot
                key={def.id}
                slot={def}
                value={val}
                textValue={textVal}
                isActive={activeSlotId === def.id}
                showFrame={showSlotFrames}
                style={{
                  left: `${rect.left}%`,
                  top: `${rect.top}%`,
                  width: `${rect.width}%`,
                  height: `${rect.height}%`,
                }}
                onClick={() => onSlotClick(def.id)}
                onTextChange={
                  def.id === 'money' || def.id === 'price'
                    ? (v) => onTextChange?.(def.id as 'money' | 'price', v)
                    : undefined
                }
              />
            );
          })}
        </div>
      </div>
    );
  },
);
