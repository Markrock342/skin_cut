import { forwardRef } from 'react';
import type { BreakoutPosterDraft, BreakoutWeapon } from '../data/types';

interface BreakoutPosterCanvasProps {
  draft: BreakoutPosterDraft;
  weapons: BreakoutWeapon[];
}

export const BreakoutPosterCanvas = forwardRef<HTMLDivElement, BreakoutPosterCanvasProps>(
  function BreakoutPosterCanvas({ draft, weapons }, ref) {
    const formatNum = (n: number) => n.toLocaleString('th-TH');

    return (
      <div ref={ref} className="breakout-poster" data-export-root>
        <div className="breakout-poster__banner">{draft.bannerText}</div>

        <div className="breakout-poster__body">
          <div className="breakout-poster__left">
            <div className="breakout-poster__contact">{draft.contactLine}</div>
            <div className="breakout-weapon-grid">
              {weapons.map((w) => (
                <div key={w.id} className="breakout-weapon-cell">
                  {w.imageUrl ? (
                    <img src={w.imageUrl} alt="" crossOrigin="anonymous" />
                  ) : (
                    <div
                      className="breakout-weapon-placeholder"
                      style={{
                        background: `linear-gradient(145deg, hsl(${w.hue} 50% 28%), hsl(${w.hue} 40% 12%))`,
                      }}
                    />
                  )}
                  <span>{w.nameTh || w.name}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="breakout-poster__center">
            <div className="breakout-poster__id">{draft.accountId}</div>
            <div className="breakout-poster__koen">{formatNum(draft.koen)}</div>
            <div className="breakout-poster__coupons">
              <span>{draft.coupons}</span>
              <span className="muted">คูปอง</span>
            </div>
            <div className="breakout-poster__stats">
              <div>
                <strong>{draft.storageM} M</strong>
                <span>มูลค่าคลัง</span>
              </div>
              <div>
                <strong>{draft.playHours} ชม.</strong>
                <span>เวลาเล่น</span>
              </div>
              <div>
                <strong>{formatNum(draft.raids)}</strong>
                <span>รบ</span>
              </div>
            </div>
            <div className="breakout-poster__rank">{draft.rankLabel}</div>
          </div>

          <div className="breakout-poster__right">
            <div className="breakout-poster__character" aria-hidden />
          </div>
        </div>

        <div className="breakout-poster__price">{formatNum(draft.priceBaht)} ฿</div>
      </div>
    );
  },
);
