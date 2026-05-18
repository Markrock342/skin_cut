import { useEffect, useState } from 'react';
import {
  frameHueFromId,
  getRovProfileFrameById,
  rovProfileFramePngPath,
  rovProfileFrameWebpPath,
} from '../data/rov/profile-frames';

interface SkinPosterFrameOverlayProps {
  frameId: string;
  strip?: boolean;
}

/**
 * วางทับบน .skin-poster__art — กลางโปร่ง ขอบเป็นกรอบ
 * มี PNG/webp ใน public จะทับ preset; ไม่มีจะเหลือวงแหวน CSS
 */
export function SkinPosterFrameOverlay({ frameId, strip }: SkinPosterFrameOverlayProps) {
  const def = getRovProfileFrameById(frameId);
  const preset = def?.preset ?? 0;
  const hue = frameHueFromId(frameId);
  const png = rovProfileFramePngPath(frameId);
  const webp = rovProfileFrameWebpPath(frameId);
  /** null = ไม่ลองโหลดรูปแล้ว */
  const [bitmapSrc, setBitmapSrc] = useState<string | null>(png);

  useEffect(() => {
    setBitmapSrc(png);
  }, [png, frameId]);

  return (
    <div
      className={`skin-poster__frame-overlay${strip ? ' skin-poster__frame-overlay--strip' : ''}`}
      aria-hidden
    >
      <div
        className="skin-poster__frame-ring"
        data-preset={preset}
        style={{ '--frame-hue': `${hue}` } as React.CSSProperties}
      />
      {bitmapSrc ? (
        <img
          className="skin-poster__frame-bitmap"
          src={bitmapSrc}
          alt=""
          draggable={false}
          onError={() => {
            if (bitmapSrc === png) setBitmapSrc(webp);
            else setBitmapSrc(null);
          }}
        />
      ) : null}
    </div>
  );
}
