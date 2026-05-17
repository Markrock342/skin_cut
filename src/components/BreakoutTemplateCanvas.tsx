import { forwardRef } from 'react';
import type { BreakoutEditorState } from '../data/types';
import { getArenaTemplate } from '../data/arena-breakout/templates';
import { BreakoutSlot } from './BreakoutSlot';

interface Props {
  state: BreakoutEditorState;
  onSlotClick: (slotId: string) => void;
  showGuide?: boolean;
}

export const BreakoutTemplateCanvas = forwardRef<HTMLDivElement, Props>(
  function BreakoutTemplateCanvas({ state, onSlotClick, showGuide }, ref) {
    const tpl = getArenaTemplate(state.templateFamily);
    const guideUrl = tpl.variants.find((v) => v.id === state.variantId)?.preview;

    const slot = (id: string) => {
      const def = tpl.slots.find((s) => s.id === id)!;
      const textVal =
        id === 'money' ? state.money : id === 'price' ? state.price : undefined;
      const val =
        id === 'profile'
          ? state.profileImage
          : id === 'character'
            ? state.characterImage
            : state.slots[id];

      return (
        <BreakoutSlot
          key={id}
          slot={def}
          value={val}
          textValue={textVal}
          onClick={() => onSlotClick(id)}
        />
      );
    };

    return (
      <div
        ref={ref}
        className={`ab-canvas ab-canvas--${state.templateFamily}`}
        data-export-root
      >
        {showGuide && guideUrl && (
          <img className="ab-canvas__guide" src={guideUrl} alt="" aria-hidden />
        )}

        {state.templateFamily === 'landscape' && (
          <>
            <header className="ab-header">
              {slot('profile')}
              <div className="ab-character-wrap">{slot('character')}</div>
            </header>
            <div className="ab-land-mid">
              <div className="ab-land-knives-lg">
                {slot('knife-lg-0')}
                {slot('knife-lg-1')}
              </div>
              <div className="ab-land-knives-sm">
                {slot('knife-sm-0')}
                {slot('knife-sm-1')}
                {slot('knife-sm-2')}
              </div>
              <div className="ab-land-titles">
                {slot('title-0')}
                {slot('title-1')}
              </div>
              <div className="ab-land-price-col">
                {slot('price')}
                {slot('money')}
              </div>
            </div>
            <div className="ab-land-bottom">
              <div className="ab-land-guns">
                {Array.from({ length: 20 }, (_, i) => slot(`gun-${i}`))}
              </div>
              <div className="ab-land-frames">
                {Array.from({ length: 9 }, (_, i) => slot(`frame-${i}`))}
              </div>
              <div className="ab-land-outfits">
                {Array.from({ length: 6 }, (_, i) => slot(`outfit-${i}`))}
              </div>
            </div>
          </>
        )}

        {state.templateFamily === 'square' && (
          <>
            <header className="ab-header">
              {slot('profile')}
              <div className="ab-character-wrap">{slot('character')}</div>
            </header>
            <div className="ab-sq-mid">
              {slot('knife-lg-0')}
              <div className="ab-sq-price-col">
                {slot('price')}
                {slot('money')}
              </div>
            </div>
            <div className="ab-sq-bottom">
              {slot('knife-sm-0')}
              <div className="ab-sq-guns">
                {Array.from({ length: 4 }, (_, i) => slot(`gun-${i}`))}
              </div>
              <div className="ab-sq-outfits">
                {Array.from({ length: 4 }, (_, i) => slot(`outfit-${i}`))}
              </div>
            </div>
          </>
        )}

        {state.templateFamily === 'portrait' && (
          <>
            <header className="ab-header">
              {slot('profile')}
              <div className="ab-character-wrap">{slot('character')}</div>
            </header>
            <div className="ab-port-price-row">
              {slot('money')}
              {slot('price')}
            </div>
            <div className="ab-port-body">
              <div className="ab-port-left">
                {slot('knife-lg-0')}
                {slot('knife-sm-0')}
                <div className="ab-port-guns">
                  {Array.from({ length: 10 }, (_, i) => slot(`gun-${i}`))}
                </div>
              </div>
              <div className="ab-port-center">
                <div className="ab-port-frames">
                  {Array.from({ length: 9 }, (_, i) => slot(`frame-${i}`))}
                </div>
                <div className="ab-port-titles">
                  {slot('title-0')}
                  {slot('title-1')}
                  {slot('title-2')}
                </div>
                <div className="ab-port-red">
                  {Array.from({ length: 8 }, (_, i) => slot(`red-${i}`))}
                </div>
              </div>
              <div className="ab-port-outfits">
                {Array.from({ length: 5 }, (_, i) => slot(`outfit-${i}`))}
              </div>
            </div>
          </>
        )}
      </div>
    );
  },
);
