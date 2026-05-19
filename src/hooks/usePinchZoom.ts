import { useEffect, useRef, type RefObject } from 'react';

interface UsePinchZoomOptions {
  enabled: boolean;
  zoom: number;
  onZoomChange: (zoom: number) => void;
  min?: number;
  max?: number;
}

function distance(touches: TouchList) {
  if (touches.length < 2) return 0;
  const a = touches[0]!;
  const b = touches[1]!;
  const dx = a.clientX - b.clientX;
  const dy = a.clientY - b.clientY;
  return Math.hypot(dx, dy);
}

/** Pinch-to-zoom บน element — ไม่รบกวนลากเลเยอร์ (เลเยอร์ใช้ touch-action: none) */
export function usePinchZoom(
  ref: RefObject<HTMLElement | null>,
  { enabled, zoom, onZoomChange, min = 0.35, max = 4 }: UsePinchZoomOptions,
) {
  const zoomRef = useRef(zoom);
  const pinchStartRef = useRef<{ dist: number; zoom: number } | null>(null);

  zoomRef.current = zoom;

  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled) return;

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 2) return;
      if ((e.target as HTMLElement).closest('.ab-compose-layer')) return;
      pinchStartRef.current = { dist: distance(e.touches), zoom: zoomRef.current };
    };

    const onTouchMove = (e: TouchEvent) => {
      const start = pinchStartRef.current;
      if (!start || e.touches.length !== 2) return;
      const dist = distance(e.touches);
      if (start.dist < 8) return;
      e.preventDefault();
      const ratio = dist / start.dist;
      const next = Math.min(max, Math.max(min, start.zoom * ratio));
      onZoomChange(Math.round(next * 100) / 100);
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) pinchStartRef.current = null;
    };

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd);
    el.addEventListener('touchcancel', onTouchEnd);

    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
      el.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [enabled, max, min, onZoomChange, ref]);
}
